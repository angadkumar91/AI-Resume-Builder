function asString(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\s\?\s/g, " - ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function asStringArray(value) {
  if (!Array.isArray(value)) return [];
  const result = [];
  for (const item of value) {
    addUnique(result, item);
  }
  return result;
}

function toTitleCase(text = "") {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function splitByDelimiters(input = "") {
  return input
    .split(/[,\n;|•]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSkillCategoryLabel(value = "") {
  const clean = asString(value)
    .replace(/^[^A-Za-z0-9]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "";

  if (/\bprogram(?:m)?ing\s+languages?\b/i.test(clean)) {
    return "Programming Languages";
  }

  if (/^skills?$/i.test(clean)) {
    return "Core Skills";
  }

  return toTitleCase(clean);
}

function addUnique(list, value) {
  const clean = asString(value);
  if (!clean) return;
  if (!list.some((item) => item.toLowerCase() === clean.toLowerCase())) {
    list.push(clean);
  }
}

function normalizeCompareText(value = "") {
  return asString(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildCompositeKey(...parts) {
  return parts
    .map((part) => normalizeCompareText(part))
    .filter(Boolean)
    .join("|");
}

function looksLikeDurationText(text = "") {
  return Boolean(extractDuration(text));
}

function looksLikeSentence(text = "") {
  const clean = asString(text);
  if (!clean) return false;
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 10) return true;
  if (/[.,;:]$/.test(clean)) return true;
  return /^(developed|developing|integrated|integrating|designed|built|contributed|implemented|managed|led|created|worked|transformed)\b/i.test(
    clean,
  );
}

function mergeBrokenSentences(lines = []) {
  const source = asStringArray(lines);
  const merged = [];
  for (const line of source) {
    if (!merged.length) {
      merged.push(line);
      continue;
    }

    const lastIndex = merged.length - 1;
    const previous = merged[lastIndex];
    const shouldJoin =
      /[,:\-]$/.test(previous) ||
      (!/[.!?]$/.test(previous) && /^[a-z]/.test(line)) ||
      (previous.split(/\s+/).length <= 6 && /^[a-z]/.test(line));

    if (shouldJoin) {
      merged[lastIndex] = asString(`${previous} ${line}`);
    } else {
      merged.push(line);
    }
  }
  return asStringArray(merged);
}

function mergePointSets(existingPoints = [], incomingPoints = []) {
  const merged = [];
  const seen = [];
  const add = (value) => {
    const clean = asString(value);
    if (!clean) return;
    const normalized = normalizeCompareText(clean);
    if (!normalized) return;

    const isDuplicate = seen.some((seenItem) => {
      if (seenItem === normalized) return true;
      const prefixLength = Math.min(32, seenItem.length, normalized.length);
      if (prefixLength < 24) return false;
      const seenPrefix = seenItem.slice(0, prefixLength);
      const normalizedPrefix = normalized.slice(0, prefixLength);
      return seenPrefix === normalizedPrefix;
    });

    if (!isDuplicate) {
      seen.push(normalized);
      merged.push(clean);
    }
  };

  mergeBrokenSentences(existingPoints).forEach(add);
  mergeBrokenSentences(incomingPoints).forEach(add);
  return merged;
}

function absorbContactLine(contact, rawLine) {
  const line = asString(rawLine);
  if (!line) return false;

  const email = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone = line.match(/(?:\+?\d{1,3}[-\s]?)?(?:\d[\s-]?){9,14}\d/)?.[0] || "";
  const profileMatch = line.match(
    /^(linkedin|github|leet\s*code|portfolio|website)\s*[:\-]\s*(.+)$/i,
  );

  if (email) {
    contact.email ||= asString(email);
    return true;
  }
  if (/^phone\b/i.test(line) && phone) {
    contact.phone ||= asString(phone);
    return true;
  }
  if (profileMatch) {
    const labelRaw = asString(profileMatch[1]);
    const label =
      /^leet/i.test(labelRaw)
        ? "LeetCode"
        : toTitleCase(labelRaw.replace(/\s+/g, " "));
    const value = asString(profileMatch[2]);
    if (value) {
      contact.profiles = normalizeProfiles([
        ...(contact.profiles || []),
        { label, value },
      ]);
    }
    return true;
  }

  return false;
}

function normalizeProfiles(value) {
  if (!Array.isArray(value)) return [];
  const profiles = [];

  for (const item of value) {
    const label = asString(item?.label || "");
    const raw = asString(item?.value || "");
    const pairText = asString(item?.text || "");
    if (pairText && !raw && pairText.includes(":")) {
      const [left, ...right] = pairText.split(":");
      const parsedLabel = asString(left);
      const parsedValue = asString(right.join(":"));
      if (parsedValue) {
        const key = `${parsedLabel.toLowerCase()}|${parsedValue.toLowerCase()}`;
        const exists = profiles.some(
          (entry) =>
            `${entry.label.toLowerCase()}|${entry.value.toLowerCase()}` === key,
        );
        if (!exists) {
          profiles.push({ label: parsedLabel || "Profile", value: parsedValue });
        }
      }
      continue;
    }

    if (!raw) continue;
    const key = `${label.toLowerCase()}|${raw.toLowerCase()}`;
    const exists = profiles.some(
      (entry) => `${entry.label.toLowerCase()}|${entry.value.toLowerCase()}` === key,
    );
    if (!exists) {
      profiles.push({ label: label || "Profile", value: raw });
    }
  }

  return profiles;
}

function normalizeSkillGroups(skills) {
  if (!skills) return [];

  const normalizeSkillItems = (value) => {
    if (Array.isArray(value)) {
      return asStringArray(value);
    }
    if (typeof value === "string") {
      return asStringArray(splitByDelimiters(value));
    }
    return [];
  };

  if (Array.isArray(skills)) {
    if (!skills.length) return [];

    if (typeof skills[0] === "object" && skills[0] !== null) {
      return skills
        .map((group) => {
          const items = normalizeSkillItems(group?.items);
          const category =
            normalizeSkillCategoryLabel(group?.category) ||
            (items.length ? "Core Skills" : "");
          return { category, items };
        })
        .filter((group) => group.items.length);
    }

    return [
      {
        category: "Core Skills",
        items: asStringArray(skills),
      },
    ];
  }

  if (typeof skills === "object") {
    return Object.entries(skills)
      .map(([category, items]) => {
        const normalizedItems = normalizeSkillItems(items);
        const normalizedCategory =
          normalizeSkillCategoryLabel(asString(category).replace(/_/g, " ")) ||
          (normalizedItems.length ? "Core Skills" : "");
        return {
          category: normalizedCategory,
          items: normalizedItems,
        };
      })
      .filter((group) => group.items.length);
  }

  return [];
}

function normalizeCustomSections(customSections) {
  if (!Array.isArray(customSections)) return [];
  return customSections
    .map((section) => ({
      title: asString(section?.title),
      items: asStringArray(
        (section?.items || []).flatMap((item) => {
          const clean = asString(item);
          if (!clean) return [];
          if (clean.includes("•")) {
            return clean
              .split("•")
              .map((part) => asString(part))
              .filter(Boolean);
          }
          return [clean];
        }),
      ),
    }))
    .filter((section) => section.title && section.items.length);
}

function splitLines(rawText = "") {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\t/g, " ").trim())
    .filter(Boolean);
}

function normalizeHeading(line = "") {
  return line
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getKnownHeading(line) {
  const normalized = normalizeHeading(line);
  if (!normalized) return "";

  const candidates = [
    {
      key: "summary",
      pattern:
        /^(summary|professional summary|profile|objective|career objective|about)\b/i,
    },
    {
      key: "skills",
      pattern: /^(skills|technical skills|core skills|expertise|competencies)\b/i,
    },
    {
      key: "experience",
      pattern: /^(experience|work experience|employment|internship|internships)\b/i,
    },
    {
      key: "experience",
      pattern: /^(work exprience|work experiance|exprience|experiance)\b/i,
    },
    {
      key: "projects",
      pattern: /^(projects?|key projects?|project experience|project work)\b/i,
    },
    {
      key: "education",
      pattern:
        /^(education|academic|qualification|academics|educational background)\b/i,
    },
    {
      key: "achievements",
      pattern: /^(achievement|achievements|awards|accomplishments|achivement)\b/i,
    },
    {
      key: "certifications",
      pattern:
        /^(certification|certifications|certificate|certificates|certified courses|licenses|license|credentials?)\b/i,
    },
    {
      key: "additional",
      pattern:
        /^(additional|other details|miscellaneous|others)\b/i,
    },
  ];

  const match = candidates.find(
    (candidate) =>
      candidate.pattern.test(line) || candidate.pattern.test(normalized),
  );
  return match?.key || "";
}

function isLikelyHeading(line) {
  if (!line || line.length > 64) return false;
  if (line.endsWith(".")) return false;
  if (/^[\-\u2022*]/.test(line)) return false;

  const letters = line.replace(/[^A-Za-z]/g, "");
  if (!letters) return false;

  const upperRatio =
    letters.split("").filter((char) => char === char.toUpperCase()).length /
    letters.length;

  return /:$/.test(line) || upperRatio > 0.8;
}

function extractBuckets(rawText = "") {
  const lines = splitLines(rawText);
  const buckets = {
    summary: [],
    skills: [],
    experience: [],
    projects: [],
    education: [],
    achievements: [],
    certifications: [],
    additional: [],
    custom: {},
  };

  let current = "summary";

  for (const line of lines) {
    const known = getKnownHeading(line);
    if (known) {
      current = known;
      continue;
    }

    const normalized = normalizeHeading(line);
    if (/^(interests?|area of interest|activities|hobbies)\b/.test(normalized)) {
      const title = toTitleCase(line.replace(/:$/, ""));
      if (!buckets.custom[title]) {
        buckets.custom[title] = [];
      }
      current = `custom:${title}`;
      continue;
    }

    if (isLikelyHeading(line)) {
      const title = toTitleCase(line.replace(/:$/, ""));
      if (!buckets.custom[title]) {
        buckets.custom[title] = [];
      }
      current = `custom:${title}`;
      continue;
    }

    if (current.startsWith("custom:")) {
      const title = current.replace("custom:", "");
      if (!buckets.custom[title]) {
        buckets.custom[title] = [];
      }
      buckets.custom[title].push(line);
      continue;
    }

    buckets[current].push(line);
  }

  return buckets;
}

function extractContactFromRaw(rawText = "") {
  const emailMatch = rawText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-\s]?)?(?:\d[\s-]?){9,14}\d/g);
  const portfolioMatch = rawText.match(
    /(https?:\/\/\S+|linkedin\.com\/\S+|github\.com\/\S+|portfolio[^\s]*)/i,
  );
  const profiles = [];

  const profilePatterns = [
    { label: "LinkedIn", regex: /linkedin\s*[:\-]\s*([^\n]+)/gi },
    { label: "GitHub", regex: /github\s*[:\-]\s*([^\n]+)/gi },
    { label: "LeetCode", regex: /leet\s*code\s*[:\-]\s*([^\n]+)/gi },
    { label: "Portfolio", regex: /portfolio\s*[:\-]\s*([^\n]+)/gi },
  ];

  for (const pattern of profilePatterns) {
    let match = pattern.regex.exec(rawText);
    while (match) {
      const value = asString(match[1]).replace(/^[•\-]\s*/, "");
      if (value) {
        const key = `${pattern.label.toLowerCase()}|${value.toLowerCase()}`;
        const exists = profiles.some(
          (item) => `${item.label.toLowerCase()}|${item.value.toLowerCase()}` === key,
        );
        if (!exists) {
          profiles.push({ label: pattern.label, value });
        }
      }
      match = pattern.regex.exec(rawText);
    }
    pattern.regex.lastIndex = 0;
  }

  const urlMatches = rawText.match(/https?:\/\/[^\s]+/gi) || [];
  for (const url of urlMatches) {
    const value = asString(url);
    if (!value) continue;
    let label = "Portfolio";
    if (/linkedin\.com/i.test(value)) label = "LinkedIn";
    else if (/github\.com/i.test(value)) label = "GitHub";
    else if (/leetcode\.com/i.test(value)) label = "LeetCode";
    const key = `${label.toLowerCase()}|${value.toLowerCase()}`;
    const exists = profiles.some(
      (item) => `${item.label.toLowerCase()}|${item.value.toLowerCase()}` === key,
    );
    if (!exists) {
      profiles.push({ label, value });
    }
  }

  return {
    email: emailMatch?.[0] || "",
    phone: phoneMatch?.[0] || "",
    portfolio: portfolioMatch?.[0] || "",
    profiles,
  };
}

function enrichSkillGroups(currentSkills, rawText = "") {
  const buckets = extractBuckets(rawText);
  const groups = normalizeSkillGroups(currentSkills);
  const groupMap = new Map(
    groups.map((group) => [group.category.toLowerCase(), { ...group }]),
  );

  const getGroup = (label) => {
    const category = normalizeSkillCategoryLabel(label || "Core Skills") || "Core Skills";
    const key = category.toLowerCase();
    if (!groupMap.has(key)) {
      groupMap.set(key, { category, items: [] });
    }
    return groupMap.get(key);
  };

  for (const rawLine of buckets.skills) {
    const line = asString(rawLine.replace(/^[^A-Za-z0-9]+/, ""));
    if (!line) continue;

    const labelMatch = line.match(/^([^:]+):\s*(.+)$/);
    if (labelMatch) {
      const group = getGroup(labelMatch[1]);
      for (const item of splitByDelimiters(labelMatch[2])) {
        addUnique(group.items, item);
      }
      continue;
    }

    const group = getGroup("Core Skills");
    for (const item of splitByDelimiters(line)) {
      addUnique(group.items, item);
    }
  }

  // Fallback: recover skills from raw lines when section bucketing misses or is incomplete.
  const knownSkillLabelPattern =
    /(program(?:m)?ing\s+languages?|ai\s*&?\s*machine learning|frameworks?\s*&?\s*libraries?|data engineering\s*&?\s*analytics|big data\s*&?\s*platforms?|databases?|cloud\s*&?\s*dev(?:\s*practices)?|tools?\s*&?\s*ides?|technical skills?|core skills?)/i;
  const ignoredSkillLabelPattern =
    /^(email|phone|linkedin|github|leet\s*code|portfolio|website|summary|work experience|projects?|education|certifications?|achievements?|role|duration)\b/i;

  for (const rawLine of splitLines(rawText)) {
    const line = asString(rawLine.replace(/^[^A-Za-z0-9]+/, ""));
    if (!line.includes(":")) continue;

    const [left, ...rightParts] = line.split(":");
    const label = asString(left);
    const valuesPart = asString(rightParts.join(":"));
    if (!label || !valuesPart) continue;
    if (ignoredSkillLabelPattern.test(label)) continue;
    if (!knownSkillLabelPattern.test(label)) continue;

    const parsedItems = splitByDelimiters(valuesPart);
    if (!parsedItems.length) continue;

    const group = getGroup(label);
    parsedItems.forEach((item) => addUnique(group.items, item));
  }

  const orderedGroups = [...groupMap.values()].filter((group) => group.items.length);
  const mergedByCategory = new Map();
  const globalSkillSeen = new Set();

  for (const group of orderedGroups) {
    const category =
      normalizeSkillCategoryLabel(group.category || "Core Skills") || "Core Skills";
    const categoryKey = normalizeCompareText(category) || "skills";
    if (!mergedByCategory.has(categoryKey)) {
      mergedByCategory.set(categoryKey, { category, items: [] });
    }

    const target = mergedByCategory.get(categoryKey);
    for (const item of group.items || []) {
      const skillKey = normalizeCompareText(item);
      if (!skillKey || globalSkillSeen.has(skillKey)) continue;
      target.items.push(asString(item));
      globalSkillSeen.add(skillKey);
    }
  }

  const normalizedGroups = [...mergedByCategory.values()].filter(
    (group) => group.items.length,
  );

  // Hard fallback for cases where AI keeps "Programming Languages" empty.
  const programmingLine = splitLines(rawText).find((line) =>
    /program(?:m)?ing\s+languages?\s*[:\-]/i.test(line),
  );
  if (programmingLine) {
    const match = asString(programmingLine.replace(/^[^A-Za-z0-9]+/, "")).match(
      /^([^:\-]+)\s*[:\-]\s*(.+)$/i,
    );
    const rawItems = match?.[2] ? splitByDelimiters(match[2]) : [];
    if (rawItems.length) {
      const targetCategory = "Programming Languages";
      const existing =
        normalizedGroups.find(
          (group) =>
            normalizeCompareText(group.category) ===
            normalizeCompareText(targetCategory),
        ) || null;

      if (existing) {
        rawItems.forEach((item) => addUnique(existing.items, item));
      } else {
        normalizedGroups.push({
          category: targetCategory,
          items: asStringArray(rawItems),
        });
      }
    }
  }

  const priority = [
    "programminglanguages",
    "ai machine learning",
    "frameworks libraries",
  ].map((item) => normalizeCompareText(item));

  normalizedGroups.sort((a, b) => {
    const aKey = normalizeCompareText(a.category);
    const bKey = normalizeCompareText(b.category);
    const aIndex = priority.indexOf(aKey);
    const bIndex = priority.indexOf(bKey);
    const safeA = aIndex === -1 ? 99 : aIndex;
    const safeB = bIndex === -1 ? 99 : bIndex;
    return safeA - safeB;
  });

  return normalizedGroups.filter((group) => group.items.length);
}

function extractDuration(text) {
  const monthYearPattern =
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\.?\s*\d{4}\s*[-–]\s*(?:present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\.?\s*\d{4})\b/i;
  const yearPattern = /\b\d{4}\s*[-–]\s*(?:present|current|\d{4})\b/i;
  const explicitPattern =
    /\b(?:duration\s*[:\-]\s*)?(?:\d+\s*(?:month|months|year|years)|ongoing)\b/i;
  const rawMatch =
    text.match(monthYearPattern)?.[0] ||
    text.match(yearPattern)?.[0] ||
    text.match(explicitPattern)?.[0] ||
    "";
  return asString(rawMatch.replace(/^duration\s*[:\-]\s*/i, ""));
}

function looksLikeExperienceHeading(line = "") {
  return /(engineer|developer|analyst|manager|intern|technician|consultant|specialist|associate|lead|support|executive)/i.test(
    line,
  );
}

function parseExperienceLine(line) {
  const duration = extractDuration(line);
  const cleaned = line.replace(duration, "").trim();
  const partsByPipe = cleaned.split(/\s+\|\s+/);
  const partsByAt = cleaned.split(/\s+at\s+/i);

  let role = "";
  let company = "";

  if (partsByPipe.length >= 2) {
    role = partsByPipe[0];
    company = partsByPipe.slice(1).join(" | ");
  } else if (partsByAt.length >= 2) {
    role = partsByAt[0];
    company = partsByAt.slice(1).join(" at ");
  } else {
    const partsByDash = cleaned.split(/\s+-\s+/);
    if (partsByDash.length >= 2) {
      role = partsByDash[0];
      company = partsByDash.slice(1).join(" - ");
    } else {
      role = cleaned;
    }
  }

  return {
    role: asString(role),
    company: asString(company),
    duration: asString(duration),
    points: [],
  };
}

function mergeExperiences(currentExperience, rawText = "") {
  const fromAI = (Array.isArray(currentExperience) ? currentExperience : [])
    .map((exp) => ({
      role: asString(exp?.role),
      company: asString(exp?.company),
      duration: asString(exp?.duration),
      points: mergeBrokenSentences(exp?.points),
    }))
    .filter((exp) => exp.role || exp.company || exp.duration || exp.points.length);

  const buckets = extractBuckets(rawText);
  const extracted = [];
  let current = null;

  for (const rawLine of buckets.experience) {
    const line = rawLine.replace(/\u2022/g, "-").trim();
    if (!line) continue;

    if (/^[-*]\s+/.test(line)) {
      if (current) {
        current.points.push(line.replace(/^[-*]\s+/, "").trim());
      }
      continue;
    }

    if (looksLikeExperienceHeading(line) || extractDuration(line) || /\s+\|\s+/.test(line)) {
      current = parseExperienceLine(line);
      extracted.push(current);
      continue;
    }

    if (current) {
      current.points.push(line);
    }
  }

  const merged = [...fromAI];
  for (const exp of extracted) {
    const key = `${exp.role}|${exp.company}|${exp.duration}`.toLowerCase();
    const alreadyPresent = merged.some(
      (item) => `${item.role}|${item.company}|${item.duration}`.toLowerCase() === key,
    );
    if (!alreadyPresent && (exp.role || exp.company || exp.duration || exp.points.length)) {
      merged.push(exp);
    }
  }

  const deduped = [];
  for (const exp of merged) {
    let normalized = {
      role: asString(exp.role),
      company: asString(exp.company),
      duration: asString(exp.duration),
      points: mergeBrokenSentences(exp.points),
    };

    if (normalized.company && looksLikeDurationText(normalized.company)) {
      normalized.duration ||= normalized.company;
      normalized.company = "";
    }

    if (!normalized.company && /\s+-\s+/.test(normalized.role)) {
      const [left, ...rest] = normalized.role.split(/\s+-\s+/);
      const right = asString(rest.join(" - "));
      if (right && !looksLikeDurationText(right)) {
        normalized.role = asString(left);
        normalized.company = right;
      }
    }

    const hasMeta = Boolean(normalized.role && (normalized.company || normalized.duration));
    if (!hasMeta && looksLikeSentence(normalized.role)) {
      continue;
    }
    if (!normalized.role && normalized.points.length) {
      continue;
    }

    const fullKey = buildCompositeKey(
      normalized.role,
      normalized.company,
      normalized.duration,
    );
    const softKey =
      buildCompositeKey(normalized.role, normalized.company) ||
      buildCompositeKey(...normalized.points.slice(0, 2));
    const matchIndex = deduped.findIndex((item) => {
      const itemFull = buildCompositeKey(item.role, item.company, item.duration);
      const itemSoft =
        buildCompositeKey(item.role, item.company) ||
        buildCompositeKey(...item.points.slice(0, 2));
      return (fullKey && itemFull === fullKey) || (softKey && itemSoft === softKey);
    });

    if (matchIndex === -1) {
      deduped.push(normalized);
      continue;
    }

    const existing = deduped[matchIndex];
    if (!existing.duration && normalized.duration) {
      existing.duration = normalized.duration;
    }
    existing.points = mergePointSets(existing.points || [], normalized.points || []);
  }

  return deduped.filter(
    (exp) =>
      exp.role &&
      (exp.company || exp.duration || exp.points.length) &&
      !(looksLikeSentence(exp.role) && !exp.company && !exp.duration),
  );
}

function parseProjectLine(line) {
  const duration = extractDuration(line);
  const noDuration = asString(
    line
      .replace(/\bduration\s*[:\-]\s*[^|]+/i, "")
      .replace(duration, ""),
  );
  const roleMatch = noDuration.match(/\brole\s*[:\-]\s*([^|]+)\b/i);
  const name = asString(
    noDuration
      .replace(/\brole\s*[:\-]\s*([^|]+)\b/i, "")
      .replace(/\s*\|\s*$/, ""),
  );
  const role = asString(roleMatch?.[1] || "");

  return {
    name,
    role,
    duration: asString(duration),
    points: [],
  };
}

function looksLikeProjectHeading(line = "") {
  if (!line) return false;
  if (/^[-*]\s+/.test(line)) return false;
  return (
    /\b(project|platform|system|application|dashboard|analytics)\b/i.test(line) ||
    /\brole\s*[:\-]/i.test(line) ||
    /\bduration\s*[:\-]/i.test(line)
  );
}

function normalizeProjects(projects) {
  if (!Array.isArray(projects)) return [];
  return projects
    .map((project) => ({
      name: asString(project?.name || project?.title || ""),
      role: asString(project?.role || ""),
      duration: asString(project?.duration || ""),
      points: asStringArray(project?.points),
    }))
    .filter(
      (project) =>
        project.name || project.role || project.duration || project.points.length,
    );
}

function mergeProjects(currentProjects, rawText = "") {
  const fromAI = normalizeProjects(currentProjects);
  const buckets = extractBuckets(rawText);
  const extracted = [];
  let current = null;

  for (const rawLine of buckets.projects) {
    const line = rawLine.replace(/\u2022/g, "-").trim();
    if (!line) continue;

    if (/^[-*]\s+/.test(line)) {
      if (current) {
        current.points.push(line.replace(/^[-*]\s+/, "").trim());
      }
      continue;
    }

    if (looksLikeProjectHeading(line)) {
      current = parseProjectLine(line);
      extracted.push(current);
      continue;
    }

    if (current) {
      current.points.push(line);
    }
  }

  const merged = [...fromAI];
  for (const project of extracted) {
    const key = `${project.name}|${project.role}|${project.duration}`.toLowerCase();
    const exists = merged.some(
      (item) => `${item.name}|${item.role}|${item.duration}`.toLowerCase() === key,
    );
    if (!exists && (project.name || project.role || project.duration || project.points.length)) {
      merged.push(project);
    }
  }

  const deduped = [];
  for (const project of merged) {
    const normalized = {
      name: asString(project.name),
      role: asString(project.role),
      duration: asString(project.duration),
      points: mergeBrokenSentences(project.points),
    };

    const hasMeta = Boolean(normalized.name && (normalized.role || normalized.duration));
    if (!hasMeta && looksLikeSentence(normalized.name)) {
      continue;
    }
    if (!normalized.name && normalized.points.length) {
      continue;
    }

    const fullKey = buildCompositeKey(
      normalized.name,
      normalized.role,
      normalized.duration,
    );
    const softKey =
      buildCompositeKey(normalized.name, normalized.role) ||
      buildCompositeKey(...normalized.points.slice(0, 2));
    const matchIndex = deduped.findIndex((item) => {
      const itemFull = buildCompositeKey(item.name, item.role, item.duration);
      const itemSoft =
        buildCompositeKey(item.name, item.role) ||
        buildCompositeKey(...item.points.slice(0, 2));
      return (fullKey && itemFull === fullKey) || (softKey && itemSoft === softKey);
    });

    if (matchIndex === -1) {
      deduped.push(normalized);
      continue;
    }

    const existing = deduped[matchIndex];
    if (!existing.duration && normalized.duration) {
      existing.duration = normalized.duration;
    }
    existing.points = mergePointSets(existing.points || [], normalized.points || []);
  }

  return deduped.filter(
    (project) =>
      project.name &&
      (project.role || project.duration || project.points.length) &&
      !(looksLikeSentence(project.name) && !project.role && !project.duration),
  );
}

function enrichArraySection(currentValues, rawText = "", sectionKey) {
  const values = asStringArray(currentValues);
  const buckets = extractBuckets(rawText);
  const sectionLines = buckets[sectionKey] || [];

  for (const line of sectionLines) {
    if (/^[-*]\s*/.test(line)) {
      addUnique(values, line.replace(/^[-*]\s*/, ""));
    } else {
      addUnique(values, line);
    }
  }

  return values;
}

function inferEducationFromText(rawText = "") {
  const lines = splitLines(rawText);
  const result = [];
  const educationPattern =
    /\b(b\.?tech|m\.?tech|bachelor|master|phd|college|university|school|hsc|ssc|diploma|cgpa|gpa)\b/i;

  for (const line of lines) {
    if (educationPattern.test(line)) {
      addUnique(result, line.replace(/^[-*]\s*/, ""));
    }
  }
  return result;
}

function inferCertificationsFromText(rawText = "") {
  const lines = splitLines(rawText);
  const result = [];
  const certPattern =
    /\b(certified|certification|certificate|coursera|udemy|nptel|aws|azure|oracle|google|microsoft)\b/i;

  for (const line of lines) {
    if (certPattern.test(line)) {
      addUnique(result, line.replace(/^[-*]\s*/, ""));
    }
  }
  return result;
}

function isCertificationItem(text = "") {
  return /\b(certified|certification|certificate|license|licensed|credential)\b/i.test(
    text,
  );
}

function inferNameFromText(rawText = "") {
  const lines = splitLines(rawText);
  for (const line of lines.slice(0, 8)) {
    if (!line) continue;
    if (line.includes("@")) continue;
    if (/:/.test(line)) continue;
    if (/\b(summary|experience|education|skills|certification|project)\b/i.test(line)) {
      continue;
    }
    const cleaned = asString(line.replace(/^[•\-]\s*/, ""));
    if (cleaned.split(" ").length <= 5) {
      return cleaned;
    }
  }
  return "";
}

function fallbackSummary(summary, rawText = "") {
  const clean = asString(summary);
  if (clean) return clean;
  const buckets = extractBuckets(rawText);
  return buckets.summary.slice(0, 3).join(" ").trim();
}

function mergeCustomSections(currentCustom, rawText = "") {
  const buckets = extractBuckets(rawText);
  const merged = normalizeCustomSections(currentCustom);
  const byTitle = new Map(merged.map((section) => [section.title.toLowerCase(), section]));

  for (const [title, lines] of Object.entries(buckets.custom)) {
    const key = title.toLowerCase();
    if (!byTitle.has(key)) {
      byTitle.set(key, { title, items: [] });
    }
    const section = byTitle.get(key);
    for (const line of lines) {
      const candidate = asString(line.replace(/^[-*]\s*/, ""));
      if (!candidate) continue;
      if (candidate.includes("•")) {
        for (const part of candidate.split("•")) {
          addUnique(section.items, part);
        }
      } else {
        addUnique(section.items, candidate);
      }
    }
  }

  const reserved = new Set([
    "summary",
    "professional summary",
    "skills",
    "technical skills",
    "experience",
    "work experience",
    "projects",
    "education",
    "certifications",
    "achievements",
    "additional",
    "additional details",
  ]);

  return [...byTitle.values()].filter(
    (section) =>
      section.title &&
      section.items.length &&
      !reserved.has(section.title.toLowerCase()),
  );
}

function absorbKnownSectionsFromCustom(resume) {
  const custom = [];
  const nameKey = normalizeHeading(resume.name || "");

  for (const section of resume.customSections || []) {
    const title = normalizeHeading(section.title);
    if (!title) continue;

    if (
      title === nameKey ||
      /^contact|personal details|profiles?$|links?$/.test(title)
    ) {
      let consumed = 0;
      const remainder = [];
      for (const item of section.items) {
        if (absorbContactLine(resume.contact, item)) {
          consumed += 1;
        } else {
          remainder.push(item);
        }
      }
      if (consumed === section.items.length) {
        continue;
      }
      if (remainder.length) {
        custom.push({ title: section.title, items: remainder });
      }
      continue;
    }

    if (
      /^certification|^certifications|^certificate|^certificates|certified courses|licenses?|credentials?/.test(
        title,
      )
    ) {
      for (const item of section.items) addUnique(resume.certifications, item);
      continue;
    }

    if (/^education|academics?|qualification/.test(title)) {
      for (const item of section.items) addUnique(resume.education, item);
      continue;
    }

    if (/^achievement|awards?|accomplishments?|achivement/.test(title)) {
      for (const item of section.items) addUnique(resume.achievements, item);
      continue;
    }

    if (/^project|^projects|project experience|project work/.test(title)) {
      const inferred = mergeProjects(
        section.items.map((item) => ({ name: item, points: [] })),
        "",
      );
      for (const project of inferred) {
        const key = `${project.name}|${project.role}|${project.duration}`.toLowerCase();
        const exists = resume.projects.some(
          (item) =>
            `${item.name}|${item.role}|${item.duration}`.toLowerCase() === key,
        );
        if (!exists) {
          resume.projects.push(project);
        }
      }
      continue;
    }

    custom.push(section);
  }

  resume.customSections = custom;
  return resume;
}

export function ensureResumeShape(data = {}, rawText = "") {
  const resume = absorbKnownSectionsFromCustom({
    name: asString(data.name),
    contact: {
      email: asString(data?.contact?.email),
      phone: asString(data?.contact?.phone),
      portfolio: asString(data?.contact?.portfolio),
      profiles: normalizeProfiles(data?.contact?.profiles),
    },
    summary: fallbackSummary(data.summary, rawText),
    skills: enrichSkillGroups(data.skills, rawText),
    experience: mergeExperiences(data.experience, rawText),
    projects: mergeProjects(data.projects, rawText),
    education: enrichArraySection(data.education, rawText, "education"),
    achievements: enrichArraySection(data.achievements, rawText, "achievements"),
    certifications: enrichArraySection(
      data.certifications,
      rawText,
      "certifications",
    ),
    additional: enrichArraySection(data.additional, rawText, "additional"),
    customSections: mergeCustomSections(data.customSections, rawText),
  });

  const fallback = extractContactFromRaw(rawText);
  resume.name ||= inferNameFromText(rawText);
  resume.contact.email ||= fallback.email;
  resume.contact.phone ||= fallback.phone;
  resume.contact.portfolio ||= fallback.portfolio;
  resume.contact.profiles = normalizeProfiles([
    ...(resume.contact.profiles || []),
    ...(fallback.profiles || []),
  ]);

  if (!resume.education.length) {
    for (const item of inferEducationFromText(rawText)) {
      addUnique(resume.education, item);
    }
  }

  if (!resume.certifications.length) {
    for (const item of inferCertificationsFromText(rawText)) {
      addUnique(resume.certifications, item);
    }
  }

  if (!resume.certifications.length && resume.achievements.length) {
    const remainingAchievements = [];
    for (const item of resume.achievements) {
      if (isCertificationItem(item)) {
        addUnique(resume.certifications, item);
      } else {
        remainingAchievements.push(item);
      }
    }
    resume.achievements = remainingAchievements;
  }

  // Remove duplicated lines across adjacent optional sections.
  const projectValues = resume.projects.flatMap((project) => [
    project.name,
    ...project.points,
  ]);
  const experienceValues = resume.experience.flatMap((exp) => [
    exp.role,
    exp.company,
    ...exp.points,
  ]);
  const customValues = resume.customSections.flatMap((section) => section.items);

  resume.additional = resume.additional.filter(
    (item) =>
      !resume.education.some((entry) => entry.toLowerCase() === item.toLowerCase()) &&
      !resume.certifications.some(
        (entry) => entry.toLowerCase() === item.toLowerCase(),
      ) &&
      !resume.achievements.some((entry) => entry.toLowerCase() === item.toLowerCase()) &&
      !projectValues.some((entry) => entry.toLowerCase() === item.toLowerCase()) &&
      !experienceValues.some((entry) => entry.toLowerCase() === item.toLowerCase()) &&
      !customValues.some((entry) => entry.toLowerCase() === item.toLowerCase()),
  );

  return resume;
}

export function validateResumeForScoring(resume) {
  if (!resume || typeof resume !== "object") {
    return false;
  }

  const normalized = ensureResumeShape(resume);
  return (
    typeof normalized.name === "string" &&
    typeof normalized.summary === "string" &&
    Array.isArray(normalized.skills) &&
    Array.isArray(normalized.experience)
  );
}
