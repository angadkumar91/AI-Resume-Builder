import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { saveAs } from "file-saver";

const DOCX_TEMPLATE_CONFIG = {
  minimal: {
    headingColor: "0F172A",
    nameUppercase: false,
    sectionUppercase: false,
  },
  modern: {
    headingColor: "3F3F46",
    nameUppercase: false,
    sectionUppercase: false,
  },
  corporate: {
    headingColor: "1E3A8A",
    nameUppercase: true,
    sectionUppercase: true,
  },
};

const DEFAULT_SECTION_TITLES = {
  summary: "Professional Summary",
  experience: "Work Experience",
  projects: "Projects",
  skills: "Technical Skills",
  certifications: "Certifications",
  education: "Education",
  achievements: "Achievements",
  additional: "Additional Details",
};

function getDocxTemplateConfig(templateId = "minimal") {
  return DOCX_TEMPLATE_CONFIG[templateId] || DOCX_TEMPLATE_CONFIG.minimal;
}

function getSectionTitle(resume, key) {
  const fallback = DEFAULT_SECTION_TITLES[key] || "";
  const custom = String(resume?.sectionTitles?.[key] || "").trim();
  return custom || fallback;
}

function cleanArray(items) {
  if (!Array.isArray(items)) return [];
  const result = [];
  items
    .map((item) => String(item || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .forEach((item) => {
      if (!result.some((entry) => entry.toLowerCase() === item.toLowerCase())) {
        result.push(item);
      }
    });
  return result;
}

function normalizeCompareText(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function dedupeExperience(entries = []) {
  const output = [];
  for (const entry of entries) {
    const role = String(entry?.role || "").trim();
    const company = String(entry?.company || "").trim();
    const duration = String(entry?.duration || "").trim();
    const points = cleanArray(entry?.points || []);
    const fullKey = [role, company, duration].map(normalizeCompareText).join("|");
    const softKey = [role, company].map(normalizeCompareText).join("|");
    const index = output.findIndex((item) => {
      const itemFull = [item.role, item.company, item.duration]
        .map(normalizeCompareText)
        .join("|");
      const itemSoft = [item.role, item.company].map(normalizeCompareText).join("|");
      return (fullKey && fullKey === itemFull) || (softKey && softKey === itemSoft);
    });
    if (index === -1) {
      output.push({ role, company, duration, points });
    } else {
      output[index].points = cleanArray([...(output[index].points || []), ...points]);
      if (!output[index].duration && duration) output[index].duration = duration;
    }
  }
  return output;
}

function dedupeProjects(entries = []) {
  const output = [];
  for (const entry of entries) {
    const name = String(entry?.name || "").trim();
    const role = String(entry?.role || "").trim();
    const duration = String(entry?.duration || "").trim();
    const points = cleanArray(entry?.points || []);
    const fullKey = [name, role, duration].map(normalizeCompareText).join("|");
    const softKey = [name, role].map(normalizeCompareText).join("|");
    const index = output.findIndex((item) => {
      const itemFull = [item.name, item.role, item.duration]
        .map(normalizeCompareText)
        .join("|");
      const itemSoft = [item.name, item.role].map(normalizeCompareText).join("|");
      return (fullKey && fullKey === itemFull) || (softKey && softKey === itemSoft);
    });
    if (index === -1) {
      output.push({ name, role, duration, points });
    } else {
      output[index].points = cleanArray([...(output[index].points || []), ...points]);
      if (!output[index].duration && duration) output[index].duration = duration;
    }
  }
  return output;
}

function shouldRenderCompactItems(items = []) {
  if (!Array.isArray(items) || items.length < 2) return false;
  return items.every((item) => {
    const words = String(item || "").trim().split(/\s+/).filter(Boolean).length;
    return words > 0 && words <= 4;
  });
}

function heading(text, config) {
  const safeTitle = config.sectionUppercase ? String(text || "").toUpperCase() : text;
  return new Paragraph({
    children: [
      new TextRun({
        text: safeTitle,
        bold: true,
        color: config.headingColor,
      }),
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
  });
}

function normal(text) {
  return new Paragraph({
    children: [new TextRun(text)],
    spacing: { after: 100 },
  });
}

function bullet(text) {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

function skillLine(category, items = []) {
  const safeItems = cleanArray(items);
  if (!safeItems.length) return null;
  if (!category) {
    return normal(safeItems.join(", "));
  }
  return new Paragraph({
    children: [
      new TextRun({ text: `• ${category}: `, bold: true }),
      new TextRun({ text: safeItems.join(", ") }),
    ],
    spacing: { after: 90 },
  });
}

export async function downloadResumeDocx(
  resume,
  templateId = "minimal",
  fileName = "resume.docx",
) {
  const templateConfig = getDocxTemplateConfig(templateId);
  const children = [];
  const experience = dedupeExperience(
    (resume.experience || []).filter(
      (entry) =>
        String(entry?.role || "").trim() ||
        String(entry?.company || "").trim() ||
        String(entry?.duration || "").trim() ||
        cleanArray(entry?.points || []).length,
    ),
  );
  const projects = dedupeProjects(
    (resume.projects || []).filter(
      (entry) =>
        String(entry?.name || "").trim() ||
        String(entry?.role || "").trim() ||
        String(entry?.duration || "").trim() ||
        cleanArray(entry?.points || []).length,
    ),
  );
  const seenSkills = new Set();
  const skillGroups = (resume.skills || [])
    .map((group) => ({
      category: String(group?.category || "").trim(),
      items: cleanArray(group?.items || []).filter((item) => {
        const key = normalizeCompareText(item);
        if (!key || seenSkills.has(key)) return false;
        seenSkills.add(key);
        return true;
      }),
    }))
    .filter((group) => group.items.length);

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: templateConfig.nameUppercase
            ? String(resume.name || "Your Name").toUpperCase()
            : resume.name || "Your Name",
          bold: true,
          color: templateConfig.headingColor,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
    }),
  );

  const contactLine = [resume.contact?.email, resume.contact?.phone, resume.contact?.location]
    .filter(Boolean)
    .join(" | ");
  if (contactLine) children.push(normal(contactLine));
  if (resume.contact?.profiles?.length) {
    const profileLine = resume.contact.profiles
      .filter((profile) => profile?.value)
      .map((profile) => `${profile?.label || "Profile"}: ${profile?.value}`)
      .join(" | ");
    if (profileLine) children.push(normal(profileLine));
  }

  if (resume.summary) {
    children.push(heading(getSectionTitle(resume, "summary"), templateConfig));
    children.push(normal(resume.summary));
  }

  if (resume.certifications?.length) {
    children.push(heading(getSectionTitle(resume, "certifications"), templateConfig));
    resume.certifications
      .filter(Boolean)
      .forEach((item) => children.push(bullet(item)));
  }

  if (skillGroups.length) {
    children.push(heading(getSectionTitle(resume, "skills"), templateConfig));
    skillGroups.forEach((group) => {
      const line = skillLine(group.category, group.items);
      if (line) children.push(line);
    });
  }

  if (experience.length) {
    children.push(heading(getSectionTitle(resume, "experience"), templateConfig));
    experience.forEach((exp) => {
      const title = [exp.role, exp.company].filter(Boolean).join(" - ");
      if (title) children.push(normal(title));
      if (exp.duration) children.push(normal(exp.duration));
      (exp.points || []).filter(Boolean).forEach((point) => children.push(bullet(point)));
    });
  }

  if (projects.length) {
    children.push(heading(getSectionTitle(resume, "projects"), templateConfig));
    projects.forEach((project) => {
      const title = [project.name, project.role ? `Role: ${project.role}` : ""]
        .filter(Boolean)
        .join(" - ");
      if (title) children.push(normal(title));
      if (project.duration) children.push(normal(project.duration));
      (project.points || [])
        .filter(Boolean)
        .forEach((point) => children.push(bullet(point)));
    });
  }

  if (cleanArray(resume.education).length) {
    children.push(heading(getSectionTitle(resume, "education"), templateConfig));
    cleanArray(resume.education).forEach((item) => children.push(bullet(item)));
  }

  if (cleanArray(resume.achievements).length) {
    children.push(heading(getSectionTitle(resume, "achievements"), templateConfig));
    cleanArray(resume.achievements).forEach((item) => children.push(bullet(item)));
  }

  if (resume.customSections?.length) {
    resume.customSections.forEach((section) => {
      const title = String(section?.title || "").trim();
      const items = cleanArray(section?.items || []);
      if (!title || !items.length) return;
      const reserved = new Set([
        "summary",
        "professional summary",
        "technical skills",
        "skills",
        "work experience",
        "experience",
        "projects",
        "education",
        "certifications",
        "achievements",
        "additional",
        "additional details",
      ]);
      if (reserved.has(title.toLowerCase())) return;
      children.push(heading(title, templateConfig));
      if (shouldRenderCompactItems(items)) {
        children.push(normal(items.map((item) => `• ${item}`).join("   ")));
      } else {
        items.forEach((item) => children.push(bullet(item)));
      }
    });
  }

  if (cleanArray(resume.additional).length) {
    children.push(heading(getSectionTitle(resume, "additional"), templateConfig));
    cleanArray(resume.additional).forEach((item) => children.push(bullet(item)));
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
}
