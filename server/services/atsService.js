const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "your",
  "have",
  "will",
  "you",
  "our",
  "are",
  "was",
  "were",
  "has",
  "had",
  "but",
  "into",
  "about",
  "using",
  "use",
  "across",
  "through",
  "their",
  "them",
  "they",
  "can",
  "not",
  "all",
  "any",
  "who",
  "job",
  "role",
  "team",
  "years",
  "year",
  "work",
  "required",
  "preferred",
  "experience",
  "skills",
  "skill",
  "strong",
  "ability",
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\- ]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function countFrequency(tokens) {
  const counts = new Map();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
}

function topKeywords(tokens, limit = 30) {
  const counts = countFrequency(tokens);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword]) => keyword);
}

function resumeToText(resume) {
  const skillsText = (resume.skills || [])
    .flatMap((group) => [
      group?.category || "",
      ...((group?.items || []).filter(Boolean)),
    ])
    .join(" ");
  const profilesText = (resume.contact?.profiles || [])
    .flatMap((profile) => [profile?.label || "", profile?.value || ""])
    .join(" ");
  const expText = resume.experience
    .map(
      (exp) =>
        `${exp.role} ${exp.company} ${exp.duration} ${(exp.points || []).join(" ")}`,
    )
    .join(" ");
  const projectsText = (resume.projects || [])
    .map(
      (project) =>
        `${project.name} ${project.role} ${project.duration} ${(project.points || []).join(" ")}`,
    )
    .join(" ");

  const educationText = (resume.education || []).join(" ");
  const certificationsText = (resume.certifications || []).join(" ");
  const achievementsText = (resume.achievements || []).join(" ");
  const additionalText = (resume.additional || []).join(" ");
  const customSectionsText = (resume.customSections || [])
    .flatMap((section) => [section?.title || "", ...(section?.items || [])])
    .join(" ");

  return `${resume.name} ${resume.summary} ${resume.contact?.location || ""} ${profilesText} ${skillsText} ${expText} ${projectsText} ${educationText} ${certificationsText} ${achievementsText} ${additionalText} ${customSectionsText}`;
}

function titleCase(input) {
  return input
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeForMatch(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\- ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesMatch(keyword, options = []) {
  const normalizedKeyword = normalizeForMatch(keyword);
  if (!normalizedKeyword) return false;
  const paddedKeyword = ` ${normalizedKeyword} `;
  return options.some((option) => {
    const normalizedOption = normalizeForMatch(option);
    if (!normalizedOption) return false;
    if (normalizedOption.length <= 2 || normalizedKeyword.length <= 2) {
      return (
        normalizedKeyword === normalizedOption ||
        normalizedKeyword.split(" ").includes(normalizedOption)
      );
    }
    return (
      normalizedKeyword === normalizedOption ||
      paddedKeyword.includes(` ${normalizedOption} `) ||
      (normalizedKeyword.length >= 4 &&
        normalizedOption.includes(normalizedKeyword))
    );
  });
}

const TECH_KEYWORDS = [
  "python",
  "java",
  "javascript",
  "typescript",
  "sql",
  "pyspark",
  "react",
  "node",
  "express",
  "fastapi",
  "django",
  "flask",
  "tensorflow",
  "pytorch",
  "pandas",
  "numpy",
  "spark",
  "databricks",
  "delta",
  "mongodb",
  "postgresql",
  "mysql",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "gcp",
  "rest",
  "api",
  "testing",
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
];

const PROJECT_KEYWORDS = [
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
];

const EXPERIENCE_KEYWORDS = [
  "leadership",
  "stakeholder",
  "collaboration",
  "ownership",
  "strategy",
  "operations",
  "delivery",
  "mentoring",
  "management",
];

function classifyKeywordSection(keyword = "") {
  if (includesMatch(keyword, TECH_KEYWORDS)) {
    return {
      section: "Skills",
      note: "Add to the most relevant skill category. If unavailable, use Other Skills.",
      example: `Add "${keyword}" under a matching skill group (or Other Skills).`,
    };
  }
  if (includesMatch(keyword, CERTIFICATION_KEYWORDS)) {
    return {
      section: "Certifications",
      note: "Map this keyword to a certification title or relevant credential detail.",
      example: `Completed ${keyword} certification and applied it in real projects.`,
    };
  }
  if (includesMatch(keyword, PROJECT_KEYWORDS)) {
    return {
      section: "Projects",
      note: "Use this keyword in a project bullet with measurable outcome.",
      example: `Built a project feature using ${keyword} that improved performance by 20%.`,
    };
  }
  if (includesMatch(keyword, EXPERIENCE_KEYWORDS)) {
    return {
      section: "Work Experience",
      note: "Add this keyword in a quantified impact point in experience.",
      example: `Demonstrated ${keyword} while delivering measurable business outcomes.`,
    };
  }
  return {
    section: "Summary / Work Experience",
    note: "Incorporate naturally into summary or an impact bullet.",
    example: `Applied ${keyword} in day-to-day responsibilities and delivery outcomes.`,
  };
}

export function calculateATSScore(resume, jobDescription) {
  const jdTokens = tokenize(jobDescription);
  const resumeTokens = new Set(tokenize(resumeToText(resume)));

  const jdKeywords = topKeywords(jdTokens, 30);
  const matchedKeywords = jdKeywords.filter((keyword) => resumeTokens.has(keyword));
  const missingKeywords = jdKeywords.filter(
    (keyword) => !resumeTokens.has(keyword),
  );

  const denominator = jdKeywords.length || 1;
  const score = Math.max(
    0,
    Math.min(100, Math.round((matchedKeywords.length / denominator) * 100)),
  );

  const target90MatchCount = Math.ceil(denominator * 0.9);
  const target99MatchCount = Math.ceil(denominator * 0.99);
  const requiredFor90 = Math.max(0, target90MatchCount - matchedKeywords.length);
  const requiredFor99 = Math.max(0, target99MatchCount - matchedKeywords.length);
  const keywordsToReach90 = missingKeywords.slice(0, requiredFor90 || 8);
  const stretchKeywordsFor99 = missingKeywords.slice(
    keywordsToReach90.length,
    keywordsToReach90.length + Math.max(0, requiredFor99 - keywordsToReach90.length),
  );

  const suggestions = [];
  if (keywordsToReach90.length) {
    suggestions.push(
      `Prioritize these keywords to move toward 90% ATS: ${keywordsToReach90
        .map(titleCase)
        .join(", ")}.`,
    );
  }
  if (stretchKeywordsFor99.length) {
    suggestions.push(
      `For a 90-99% range, also incorporate: ${stretchKeywordsFor99
        .map(titleCase)
        .join(", ")}.`,
    );
  }

  const keywordPlacementHints = keywordsToReach90.slice(0, 12).map((keyword) => ({
    keyword,
    ...classifyKeywordSection(keyword),
  }));

  keywordPlacementHints.slice(0, 4).forEach((item) => {
    suggestions.push(
      `Place "${titleCase(item.keyword)}" in ${item.section}. ${item.note} Example: ${item.example}`,
    );
  });

  return {
    score,
    matchedKeywords,
    missingKeywords,
    keywordsToReach90,
    stretchKeywordsFor99,
    targetRange: { min: 90, max: 99 },
    requiredKeywordCountFor90: requiredFor90,
    requiredKeywordCountFor99: requiredFor99,
    actionPlan: {
      summaryKeywords: keywordsToReach90.slice(0, 4),
      skillsKeywords: keywordsToReach90.slice(0, 10),
      experienceKeywords: keywordsToReach90.slice(0, 6),
    },
    keywordPlacementHints,
    suggestions,
  };
}
