import { create } from "zustand";
import apiClient from "../utils/apiClient";
import { calculateATSLocally } from "../utils/atsScore";
import { loadAppState, saveAppState } from "../utils/storage";

const DEFAULT_SECTION_TITLES = {
  summary: "Professional Summary",
  experience: "Work Experience",
  projects: "Projects",
  skills: "Technical Skills",
  education: "Education",
  certifications: "Certifications",
  achievements: "Achievements",
  additional: "Additional Details",
  custom: "Custom Sections",
  profiles: "Profiles",
};

export const EMPTY_RESUME = {
  name: "",
  contact: {
    email: "",
    phone: "",
    location: "",
    portfolio: "",
    profiles: [],
  },
  summary: "",
  skills: [{ category: "", items: [""] }],
  experience: [
    {
      role: "",
      company: "",
      duration: "",
      points: [""],
    },
  ],
  projects: [
    {
      name: "",
      role: "",
      duration: "",
      points: [""],
    },
  ],
  education: [""],
  certifications: [""],
  achievements: [""],
  additional: [""],
  customSections: [],
  sectionTitles: { ...DEFAULT_SECTION_TITLES },
};

const INITIAL_STATE = {
  rawText: "",
  jobDescription: "",
  resume: EMPTY_RESUME,
  templateId: "minimal",
  atsResult: null,
  isGenerating: false,
  isCheckingATS: false,
  error: "",
  atsError: "",
  theme: "light",
};

function cloneValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function parseSegment(segment) {
  return /^\d+$/.test(segment) ? Number(segment) : segment;
}

function toPathSegments(path) {
  return path.split(".").map(parseSegment);
}

function updatePath(target, path, value) {
  const cloned = cloneValue(target);
  const keys = toPathSegments(path);
  let current = cloned;

  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    const nextKey = keys[i + 1];

    if (current[key] === undefined || current[key] === null) {
      current[key] = typeof nextKey === "number" ? [] : {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return cloned;
}

function appendArrayPath(target, path, value = "") {
  const cloned = cloneValue(target);
  const keys = toPathSegments(path);
  let current = cloned;

  for (const key of keys) {
    if (current[key] === undefined || current[key] === null) {
      current[key] = [];
    }
    current = current[key];
  }

  if (!Array.isArray(current)) {
    return cloned;
  }

  current.push(value);
  return cloned;
}

function removeArrayPath(target, path, index) {
  const cloned = cloneValue(target);
  const keys = toPathSegments(path);
  let current = cloned;

  for (const key of keys) {
    current = current[key];
    if (!current) {
      return cloned;
    }
  }

  if (!Array.isArray(current) || current.length <= 1) {
    return cloned;
  }

  current.splice(index, 1);
  return cloned;
}

function normalizeArray(value, fallback = [""]) {
  if (!Array.isArray(value) || !value.length) {
    return [...fallback];
  }
  return value.map((item) => String(item || ""));
}

function splitListText(value = "") {
  return String(value || "")
    .split(/\n|,|;|•|\|/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeItemList(value, fallback = [""]) {
  if (Array.isArray(value)) {
    const list = value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    return list.length ? list : [...fallback];
  }
  if (typeof value === "string") {
    const list = splitListText(value);
    return list.length ? list : [...fallback];
  }
  return [...fallback];
}

function normalizeSectionTitles(sectionTitles) {
  const source =
    sectionTitles && typeof sectionTitles === "object" ? sectionTitles : {};
  const normalized = { ...DEFAULT_SECTION_TITLES };
  Object.keys(DEFAULT_SECTION_TITLES).forEach((key) => {
    const next = String(source[key] || "").trim();
    if (next) {
      normalized[key] = next;
    }
  });
  return normalized;
}

function normalizeSkillCategoryLabel(value = "") {
  const clean = String(value || "")
    .replace(/^[^A-Za-z0-9]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "";

  if (/\bprogram(?:m)?ing\s+languages?\b/i.test(clean)) {
    return "Programming Languages";
  }
  if (/^ai\s*&?\s*machine learning$/i.test(clean)) {
    return "AI & Machine Learning";
  }
  if (/^tools?\s*&?\s*ides?$/i.test(clean)) {
    return "Tools & IDEs";
  }
  return clean;
}

function normalizeSkillGroups(skills) {
  if (!skills) {
    return [];
  }

  if (Array.isArray(skills)) {
    if (!skills.length) {
      return [];
    }

    if (typeof skills[0] === "object" && skills[0] !== null) {
      const groups = skills
        .map((group) => {
          const items = normalizeItemList(group?.items, []);
          const category =
            normalizeSkillCategoryLabel(group?.category) ||
            (items.length ? "Core Skills" : "");
          return { category, items };
        })
        .filter((group) => group.items.length);
      return groups;
    }

    return [
      {
        category: "Skills",
        items: normalizeItemList(skills),
      },
    ];
  }

  if (typeof skills === "object") {
    const groups = Object.entries(skills)
      .map(([category, items]) => {
        const normalizedItems = normalizeItemList(items, []);
        const normalizedCategory =
          normalizeSkillCategoryLabel(category) ||
          (normalizedItems.length ? "Core Skills" : "");
        return {
          category: normalizedCategory,
          items: normalizedItems,
        };
      })
      .filter((group) => group.items.length);
    return groups;
  }

  return [];
}

function extractSkillGroupsFromRawText(rawText = "") {
  const text = String(rawText || "");
  if (!text.trim()) return [];

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const groups = new Map();
  let inSkills = false;
  const headingPattern =
    /^(technical skills|skills|core skills|expertise|competencies)\b/i;
  const stopPattern =
    /^(summary|professional summary|work experience|experience|projects?|education|certifications?|achievements?|additional|area of interest|interests?)\b/i;

  const ensureGroup = (label) => {
    const category =
      normalizeSkillCategoryLabel(label || "Core Skills") || "Core Skills";
    const key = normalizeCompareText(category);
    if (!groups.has(key)) {
      groups.set(key, { category, items: [] });
    }
    return groups.get(key);
  };

  const addItem = (group, item) => {
    addUniqueByNormalized(group.items, item);
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/^[^A-Za-z0-9]+/, "").trim();
    if (!line) continue;

    if (headingPattern.test(line)) {
      inSkills = true;
      continue;
    }
    if (inSkills && stopPattern.test(line)) {
      inSkills = false;
      continue;
    }
    if (!inSkills) continue;

    const labeled = line.match(/^([^:]+):\s*(.+)$/);
    if (labeled) {
      const group = ensureGroup(labeled[1]);
      splitListText(labeled[2]).forEach((item) => addItem(group, item));
      continue;
    }

    const group = ensureGroup("Core Skills");
    splitListText(line).forEach((item) => addItem(group, item));
  }

  return [...groups.values()].filter((group) => group.items.length);
}

function mergeSkillGroups(primaryGroups = [], rawText = "") {
  const merged = new Map();
  const addGroupItems = (group) => {
    const category =
      normalizeSkillCategoryLabel(group?.category || "Core Skills") || "Core Skills";
    const key = normalizeCompareText(category);
    if (!key) return;
    if (!merged.has(key)) {
      merged.set(key, { category, items: [] });
    }
    const target = merged.get(key);
    normalizeItemList(group?.items, []).forEach((item) =>
      addUniqueByNormalized(target.items, item),
    );
  };

  (Array.isArray(primaryGroups) ? primaryGroups : []).forEach(addGroupItems);
  extractSkillGroupsFromRawText(rawText).forEach(addGroupItems);

  return [...merged.values()].filter((group) => group.items.length);
}

function normalizeCustomSections(customSections) {
  if (!Array.isArray(customSections)) {
    return [];
  }
  return customSections.map((section) => ({
    title: String(section?.title || ""),
    items: normalizeArray(section?.items),
  }));
}

function normalizeProfiles(profiles, fallbackPortfolio = "") {
  const result = [];
  if (Array.isArray(profiles)) {
    for (const profile of profiles) {
      const label = String(profile?.label || "").trim();
      const value = String(profile?.value || "").trim();
      if (!value) continue;
      const key = `${label.toLowerCase()}|${value.toLowerCase()}`;
      if (
        !result.some(
          (item) =>
            `${item.label.toLowerCase()}|${item.value.toLowerCase()}` === key,
        )
      ) {
        result.push({ label: label || "Profile", value });
      }
    }
  }

  const portfolio = String(fallbackPortfolio || "").trim();
  if (portfolio) {
    const key = `portfolio|${portfolio.toLowerCase()}`;
    if (
      !result.some(
        (item) => `${item.label.toLowerCase()}|${item.value.toLowerCase()}` === key,
      )
    ) {
      result.push({ label: "Portfolio", value: portfolio });
    }
  }

  return result;
}

function normalizeResume(resume = {}, rawText = "") {
  const normalizedSkillGroups = normalizeSkillGroups(resume.skills);
  return {
    name: String(resume.name || ""),
    contact: {
      email: String(resume.contact?.email || ""),
      phone: String(resume.contact?.phone || ""),
      location: String(resume.contact?.location || ""),
      portfolio: String(resume.contact?.portfolio || ""),
      profiles: normalizeProfiles(
        resume.contact?.profiles,
        resume.contact?.portfolio || "",
      ),
    },
    summary: String(resume.summary || ""),
    skills: mergeSkillGroups(normalizedSkillGroups, rawText),
    experience:
      Array.isArray(resume.experience) && resume.experience.length
        ? resume.experience.map((exp) => ({
            role: String(exp?.role || ""),
            company: String(exp?.company || ""),
            duration: String(exp?.duration || ""),
            points: normalizeArray(exp?.points),
          }))
        : cloneValue(EMPTY_RESUME.experience),
    projects:
      Array.isArray(resume.projects) && resume.projects.length
        ? resume.projects.map((project) => ({
            name:
              typeof project === "string"
                ? String(project || "")
                : String(project?.name || project?.title || ""),
            role:
              typeof project === "string" ? "" : String(project?.role || ""),
            duration:
              typeof project === "string" ? "" : String(project?.duration || ""),
            points:
              typeof project === "string"
                ? [""]
                : normalizeArray(project?.points),
          }))
        : cloneValue(EMPTY_RESUME.projects),
    education: normalizeArray(resume.education),
    certifications: normalizeArray(resume.certifications),
    achievements: normalizeArray(resume.achievements),
    additional: normalizeArray(resume.additional),
    customSections: normalizeCustomSections(resume.customSections),
    sectionTitles: normalizeSectionTitles(resume.sectionTitles),
  };
}

function normalizeCompareText(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^-a-z0-9+#.]/g, "");
}

function addUniqueByNormalized(list, value) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (!clean) return false;
  const key = normalizeCompareText(clean);
  if (!key) return false;

  const exists = list.some(
    (item) => normalizeCompareText(String(item || "")) === key,
  );
  if (exists) return false;
  list.push(clean);
  return true;
}

function normalizeKeywordForMatch(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^-a-z0-9+#. ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SKILL_CATEGORY_RULES = [
  {
    category: "Programming Languages",
    aliases: ["programming", "language", "languages", "coding"],
    keywords: [
      "python",
      "java",
      "javascript",
      "typescript",
      "sql",
      "pyspark",
      "scala",
      "kotlin",
      "golang",
      "go",
      "c++",
      "c#",
      "ruby",
      "php",
      "r",
    ],
  },
  {
    category: "Frameworks & Libraries",
    aliases: ["framework", "library", "libraries", "web", "backend", "frontend"],
    keywords: [
      "react",
      "node",
      "express",
      "fastapi",
      "django",
      "flask",
      "spring",
      "tensorflow",
      "pytorch",
      "pandas",
      "numpy",
      "matplotlib",
      "scikit",
      "spark",
      "hadoop",
      "rest",
      "api",
    ],
  },
  {
    category: "Data & AI",
    aliases: ["data", "analytics", "ai", "ml", "machine learning"],
    keywords: [
      "machine learning",
      "ml",
      "ai",
      "genai",
      "llm",
      "nlp",
      "databricks",
      "delta",
      "feature",
      "model",
      "anomaly",
      "forecast",
      "classification",
      "analysis",
      "etl",
      "pipeline",
    ],
  },
  {
    category: "Cloud & DevOps",
    aliases: ["cloud", "devops", "infrastructure", "deployment"],
    keywords: [
      "aws",
      "azure",
      "gcp",
      "docker",
      "kubernetes",
      "terraform",
      "jenkins",
      "devops",
      "serverless",
      "lambda",
      "ec2",
      "ci",
      "cd",
    ],
  },
  {
    category: "Databases",
    aliases: ["database", "databases", "db", "storage"],
    keywords: [
      "mongodb",
      "postgresql",
      "mysql",
      "redis",
      "oracle",
      "snowflake",
      "bigquery",
      "database",
    ],
  },
  {
    category: "Testing & Quality",
    aliases: ["testing", "quality", "qa"],
    keywords: [
      "testing",
      "pytest",
      "jest",
      "cypress",
      "selenium",
      "qa",
      "quality",
      "unit",
      "integration",
      "automation",
    ],
  },
];

const CERTIFICATION_KEYWORDS = [
  "cert",
  "certified",
  "certification",
  "certificate",
  "license",
  "licence",
  "pmp",
  "scrum",
  "itil",
  "cfa",
  "six sigma",
  "oracle",
];

const EXPERIENCE_HINTS = [
  "leadership",
  "stakeholder",
  "collaboration",
  "ownership",
  "strategy",
  "operations",
  "delivery",
  "mentoring",
  "management",
  "roadmap",
  "client",
];

const PROJECT_HINTS = [
  "project",
  "platform",
  "pipeline",
  "integration",
  "deployment",
  "dashboard",
  "application",
  "product",
  "microservice",
  "architecture",
  "migration",
  "implementation",
  "design",
  "optimization",
  "fraud",
  "healthcare",
  "fintech",
];

const SUMMARY_HINTS = [
  "communication",
  "analytical",
  "problem solving",
  "adaptability",
  "detail oriented",
  "innovation",
  "collaboration",
];

function includesMatch(keyword, candidates = []) {
  const normalizedKeyword = normalizeKeywordForMatch(keyword);
  if (!normalizedKeyword) return false;
  const paddedKeyword = ` ${normalizedKeyword} `;
  return candidates.some((candidate) => {
    const normalizedCandidate = normalizeKeywordForMatch(candidate);
    if (!normalizedCandidate) return false;
    if (normalizedCandidate.length <= 2 || normalizedKeyword.length <= 2) {
      return (
        normalizedKeyword === normalizedCandidate ||
        normalizedKeyword.split(" ").includes(normalizedCandidate)
      );
    }
    return (
      normalizedKeyword === normalizedCandidate ||
      paddedKeyword.includes(` ${normalizedCandidate} `) ||
      (normalizedKeyword.length >= 4 &&
        normalizedCandidate.includes(normalizedKeyword))
    );
  });
}

function classifyKeywordPlacement(keyword) {
  for (const rule of SKILL_CATEGORY_RULES) {
    if (includesMatch(keyword, rule.keywords)) {
      return {
        type: "technicalSkill",
        preferredSkillCategory: rule.category,
        suggestedSections: ["Skills"],
        example: `Add "${keyword}" under a matching skills category.`,
      };
    }
  }

  if (includesMatch(keyword, CERTIFICATION_KEYWORDS)) {
    return {
      type: "certification",
      suggestedSections: ["Certifications", "Summary"],
      example: `Example: "Completed ${keyword} certification and applied it in production workflows."`,
    };
  }

  if (includesMatch(keyword, PROJECT_HINTS)) {
    return {
      type: "project",
      suggestedSections: ["Projects", "Work Experience"],
      example: `Example: "Built a project feature using ${keyword} to improve reliability and performance."`,
    };
  }

  if (includesMatch(keyword, EXPERIENCE_HINTS)) {
    return {
      type: "experience",
      suggestedSections: ["Work Experience", "Summary"],
      example: `Example: "Demonstrated ${keyword} while delivering measurable business outcomes."`,
    };
  }

  if (includesMatch(keyword, SUMMARY_HINTS)) {
    return {
      type: "summary",
      suggestedSections: ["Summary"],
      example: `Example: "Profile summary includes ${keyword} with role-relevant context."`,
    };
  }

  return {
    type: "general",
    suggestedSections: ["Summary", "Work Experience"],
    example: `Example: "Integrated ${keyword} into an impact bullet with numbers."`,
  };
}

function findMatchingSkillGroup(skills, preferredCategory) {
  if (!Array.isArray(skills) || !preferredCategory) return null;

  const rule = SKILL_CATEGORY_RULES.find(
    (item) =>
      normalizeCompareText(item.category) === normalizeCompareText(preferredCategory),
  );
  const aliases = [
    preferredCategory,
    ...(rule?.aliases || []),
    ...(rule?.keywords || []).slice(0, 5),
  ];

  return (
    skills.find((group) => {
      const category = String(group?.category || "");
      return includesMatch(category, aliases);
    }) || null
  );
}

function ensureOtherSkillsGroup(skills) {
  if (!Array.isArray(skills)) return null;
  let otherGroup =
    skills.find((group) =>
      includesMatch(group?.category || "", ["other skills", "other", "additional"]),
    ) || null;

  if (!otherGroup) {
    otherGroup = { category: "Other Skills", items: [] };
    skills.push(otherGroup);
  }
  if (!Array.isArray(otherGroup.items)) {
    otherGroup.items = [];
  }
  return otherGroup;
}

function addSkillKeywordToBestCategory(skills, keyword, preferredCategory) {
  if (!Array.isArray(skills)) return false;

  let targetGroup = findMatchingSkillGroup(skills, preferredCategory);
  if (!targetGroup) {
    targetGroup = ensureOtherSkillsGroup(skills);
  }
  if (!targetGroup) return false;

  if (!Array.isArray(targetGroup.items)) {
    targetGroup.items = [];
  }
  return addUniqueByNormalized(targetGroup.items, keyword);
}

function resolveTargetKeywords(atsResult = {}) {
  const preferred = Array.isArray(atsResult?.keywordsToReach90)
    ? atsResult.keywordsToReach90
    : [];
  const stretch = Array.isArray(atsResult?.stretchKeywordsFor99)
    ? atsResult.stretchKeywordsFor99
    : [];
  const missing = Array.isArray(atsResult?.missingKeywords)
    ? atsResult.missingKeywords
    : [];

  const candidates = [...missing, ...preferred, ...stretch];
  const unique = [];
  candidates.forEach((keyword) => {
    addUniqueByNormalized(unique, keyword);
  });
  return unique;
}

function applyAtsKeywordsToResume(resume, atsResult) {
  const nextResume = cloneValue(resume);
  const keywords = resolveTargetKeywords(atsResult).filter((keyword) =>
    Boolean(String(keyword || "").trim()),
  );

  if (!keywords.length) {
    return {
      applied: false,
      resume: nextResume,
      appliedKeywords: [],
      message:
        "Your resume already contains the current ATS target keywords. Re-run analysis for updated suggestions.",
    };
  }

  if (!Array.isArray(nextResume.skills) || !nextResume.skills.length) {
    nextResume.skills = cloneValue(EMPTY_RESUME.skills);
  }

  const appliedBySection = {
    skills: [],
  };
  const skippedKeywords = [];
  const manualRecommendations = [];

  const keywordPlacements = keywords.map((keyword) => ({
    keyword,
    ...classifyKeywordPlacement(keyword),
  }));

  for (const placement of keywordPlacements) {
    const addedToSkills = addSkillKeywordToBestCategory(
      nextResume.skills,
      placement.keyword,
      "Other Skills",
    );
    if (addedToSkills) {
      appliedBySection.skills.push(placement.keyword);
    } else {
      skippedKeywords.push(placement.keyword);
    }
    if (placement.type !== "technicalSkill") {
      manualRecommendations.push({
        keyword: placement.keyword,
        sections:
          placement.suggestedSections?.length > 0
            ? placement.suggestedSections
            : ["Summary", "Work Experience"],
        example: placement.example || "",
      });
      continue;
    }
  }

  const uniqueManual = [];
  manualRecommendations.forEach((item) => {
    const key = `${normalizeCompareText(item.keyword)}|${item.sections
      .map((section) => normalizeCompareText(section))
      .join("|")}`;
    if (!uniqueManual.some((entry) => entry.key === key)) {
      uniqueManual.push({ key, ...item });
    }
  });
  const dedupedManualRecommendations = uniqueManual.map((entry) => ({
    keyword: entry.keyword,
    sections: entry.sections,
    example: entry.example || "",
  }));

  const appliedKeywords = [...appliedBySection.skills].filter(Boolean);

  if (!appliedKeywords.length && !dedupedManualRecommendations.length) {
    return {
      applied: false,
      resume: nextResume,
      appliedKeywords: [],
      skippedKeywords,
      manualRecommendations: [],
      message:
        "No ATS updates were required. Your resume already includes the active target keywords.",
    };
  }

  return {
    applied: appliedKeywords.length > 0,
    resume: nextResume,
    appliedKeywords,
    skippedKeywords,
    appliedBySection,
    manualRecommendations: dedupedManualRecommendations,
    message:
      "ATS suggestions were processed. Missing/target keywords were added to Other Skills only. Re-run ATS after review.",
  };
}

export const useResumeStore = create((set, get) => ({
  ...INITIAL_STATE,

  setRawText: (rawText) => set({ rawText }),
  setJobDescription: (jobDescription) => set({ jobDescription }),
  setTemplate: (templateId) => set({ templateId }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),

  updateResumeField: (path, value) =>
    set((state) => ({
      resume: updatePath(state.resume, path, value),
    })),

  appendArrayItem: (path, value = "") =>
    set((state) => ({
      resume: appendArrayPath(state.resume, path, value),
    })),

  removeArrayItem: (path, index) =>
    set((state) => ({
      resume: removeArrayPath(state.resume, path, index),
    })),

  setResume: (resume) =>
    set((state) => ({ resume: normalizeResume(resume, state.rawText) })),
  setError: (error) => set({ error }),
  clearErrors: () => set({ error: "", atsError: "" }),

  hydrateFromJSON: (payload) => {
    const safePayload = payload && typeof payload === "object" ? payload : {};

    set((state) => ({
      ...state,
      rawText: safePayload.rawText ?? state.rawText,
      resume: normalizeResume(
        safePayload.resume || safePayload,
        safePayload.rawText ?? state.rawText,
      ),
      templateId: safePayload.templateId ?? state.templateId,
      theme: safePayload.theme ?? state.theme,
    }));
  },

  loadLocal: () => {
    const saved = loadAppState();
    if (!saved) return false;

    set((state) => ({
      ...state,
      ...saved,
      resume: normalizeResume(saved.resume || state.resume, saved.rawText || state.rawText),
    }));
    return true;
  },

  saveLocal: () => {
    const state = get();
    return saveAppState({
      rawText: state.rawText,
      resume: state.resume,
      templateId: state.templateId,
      theme: state.theme,
      jobDescription: state.jobDescription,
    });
  },

  generateResume: async () => {
    const { rawText } = get();
    if (!rawText || rawText.trim().length < 10) {
      set({ error: "Paste a fuller raw resume text before generating." });
      return false;
    }

    set({ isGenerating: true, error: "" });
    try {
      const { data } = await apiClient.post("/api/parse-resume", { rawText });
      set({
        resume: normalizeResume(data.resume || EMPTY_RESUME, rawText),
        isGenerating: false,
      });
      return true;
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        "Failed to parse resume with AI. Please try again.";
      set({ error: message, isGenerating: false });
      return false;
    }
  },

  runAtsCheck: async () => {
    const { resume, jobDescription } = get();
    if (!jobDescription || jobDescription.trim().length < 10) {
      set({ atsError: "Paste a detailed job description for ATS analysis." });
      return false;
    }

    set({ isCheckingATS: true, atsError: "" });

    try {
      const { data } = await apiClient.post("/api/ats-score", {
        resume,
        jobDescription,
      });
      set({ atsResult: data, isCheckingATS: false });
      return true;
    } catch {
      const fallback = calculateATSLocally(resume, jobDescription);
      set({
        atsResult: fallback,
        atsError: "Using local ATS scoring because server request failed.",
        isCheckingATS: false,
      });
      return true;
    }
  },

  applyAtsSuggestions: () => {
    const { resume, atsResult } = get();
    if (!atsResult) {
      return {
        applied: false,
        appliedKeywords: [],
        message: "Run ATS analysis first to generate suggestions.",
      };
    }

    const result = applyAtsKeywordsToResume(resume, atsResult);
    if (!result.applied) {
      return result;
    }

    set({
      // ATS apply must not reorder or rehydrate sections from rawText.
      // Only persist direct ATS edits (currently: keywords into Other Skills).
      resume: result.resume,
      atsError: "",
    });
    return result;
  },

  resetForTests: () => set({ ...INITIAL_STATE, resume: cloneValue(EMPTY_RESUME) }),
}));
