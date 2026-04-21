import { jsPDF } from "jspdf";

const PDF_TEMPLATE_CONFIG = {
  minimal: {
    headingStyle: "line",
    accent: [71, 85, 105],
    headingText: [15, 23, 42],
    bodyText: [31, 41, 55],
    subMeta: [71, 85, 105],
    headerMode: "minimal",
  },
  modern: {
    headingStyle: "modernRule",
    accent: [51, 65, 85],
    cardFill: [250, 250, 250],
    headingText: [24, 24, 27],
    bodyText: [63, 63, 70],
    subMeta: [82, 82, 91],
    headerMode: "modernCard",
  },
  corporate: {
    headingStyle: "bar",
    accent: [30, 64, 175],
    headingText: [30, 64, 175],
    bodyText: [30, 41, 59],
    subMeta: [30, 64, 175],
    headerMode: "centered",
  },
};

const DEFAULT_SECTION_TITLES = {
  summary: "Summary",
  experience: "Work Experience",
  projects: "Projects",
  skills: "Technical Skills",
  certifications: "Certifications",
  education: "Education",
  achievements: "Achievements",
  additional: "Additional Details",
};

function getPdfTemplateConfig(templateId = "minimal") {
  return PDF_TEMPLATE_CONFIG[templateId] || PDF_TEMPLATE_CONFIG.minimal;
}

function getSectionTitle(resume, key) {
  const fallback = DEFAULT_SECTION_TITLES[key] || "";
  const custom = String(resume?.sectionTitles?.[key] || "").trim();
  return custom || fallback;
}

function cleanArray(items) {
  if (!Array.isArray(items)) return [];
  const result = [];
  for (const item of items) {
    const clean = String(item || "").replace(/\s+/g, " ").trim();
    if (!clean) continue;
    if (!result.some((entry) => entry.toLowerCase() === clean.toLowerCase())) {
      result.push(clean);
    }
  }
  return result;
}

function normalizeCompareText(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function dedupeExperienceEntries(entries = []) {
  const output = [];
  entries.forEach((entry) => {
    const role = String(entry?.role || "").trim();
    const company = String(entry?.company || "").trim();
    const duration = String(entry?.duration || "").trim();
    const points = cleanArray(entry?.points || []);
    const fullKey = [role, company, duration].map(normalizeCompareText).join("|");
    const softKey = [role, company].map(normalizeCompareText).join("|");
    const matchIndex = output.findIndex((item) => {
      const itemFull = [item.role, item.company, item.duration]
        .map(normalizeCompareText)
        .join("|");
      const itemSoft = [item.role, item.company].map(normalizeCompareText).join("|");
      return (fullKey && itemFull === fullKey) || (softKey && itemSoft === softKey);
    });

    if (matchIndex === -1) {
      output.push({ role, company, duration, points });
      return;
    }

    output[matchIndex].points = cleanArray([...(output[matchIndex].points || []), ...points]);
    if (!output[matchIndex].duration && duration) {
      output[matchIndex].duration = duration;
    }
  });
  return output;
}

function dedupeProjectEntries(entries = []) {
  const output = [];
  entries.forEach((entry) => {
    const name = String(entry?.name || "").trim();
    const role = String(entry?.role || "").trim();
    const duration = String(entry?.duration || "").trim();
    const points = cleanArray(entry?.points || []);
    const fullKey = [name, role, duration].map(normalizeCompareText).join("|");
    const softKey = [name, role].map(normalizeCompareText).join("|");
    const matchIndex = output.findIndex((item) => {
      const itemFull = [item.name, item.role, item.duration]
        .map(normalizeCompareText)
        .join("|");
      const itemSoft = [item.name, item.role].map(normalizeCompareText).join("|");
      return (fullKey && itemFull === fullKey) || (softKey && itemSoft === softKey);
    });

    if (matchIndex === -1) {
      output.push({ name, role, duration, points });
      return;
    }

    output[matchIndex].points = cleanArray([...(output[matchIndex].points || []), ...points]);
    if (!output[matchIndex].duration && duration) {
      output[matchIndex].duration = duration;
    }
  });
  return output;
}

function shouldRenderCompactItems(items = []) {
  if (!Array.isArray(items) || items.length < 2) return false;
  return items.every((item) => {
    const words = String(item || "").trim().split(/\s+/).filter(Boolean).length;
    return words > 0 && words <= 4;
  });
}

function withPageBreak(doc, y, neededHeight, margin, pageHeight) {
  if (y + neededHeight <= pageHeight - margin) {
    return y;
  }
  doc.addPage();
  return margin;
}

function addWrappedLine(doc, text, x, y, maxWidth, options = {}) {
  const {
    font = "helvetica",
    style = "normal",
    size = 10.5,
    color = [31, 41, 55],
    lineGap = 2,
  } = options;

  const safeText = String(text || "").trim();
  if (!safeText) return y;

  doc.setFont(font, style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(safeText, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * (size + lineGap);
}

function addInlineSkillLine(
  doc,
  category,
  itemsText,
  x,
  y,
  maxWidth,
  options = {},
) {
  const {
    categorySize = 10.2,
    itemSize = 10,
    categoryColor = [15, 23, 42],
    itemColor = [31, 41, 55],
    lineGap = 1.4,
  } = options;

  const safeCategory = String(category || "").trim();
  const safeItems = String(itemsText || "").trim();
  if (!safeCategory) {
    return addWrappedLine(doc, safeItems, x, y, maxWidth, {
      size: itemSize,
      color: itemColor,
      lineGap,
    });
  }

  const categoryText = `• ${safeCategory}: `;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(categorySize);
  const categoryWidth = doc.getTextWidth(categoryText);

  const firstLineWidth = Math.max(60, maxWidth - categoryWidth);
  const itemLines = doc.splitTextToSize(safeItems, firstLineWidth);
  const [firstItemLine = "", ...remainingLines] = itemLines;

  doc.setTextColor(...categoryColor);
  doc.text(categoryText, x, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(itemSize);
  doc.setTextColor(...itemColor);
  if (firstItemLine) {
    doc.text(firstItemLine, x + categoryWidth, y);
  }

  let cursor = y + (itemSize + lineGap);
  for (const line of remainingLines) {
    doc.text(line, x, cursor);
    cursor += itemSize + lineGap;
  }

  return Math.max(y + itemSize + lineGap, cursor);
}

function addSectionTitle(
  doc,
  title,
  x,
  y,
  maxWidth,
  margin,
  pageHeight,
  templateConfig = PDF_TEMPLATE_CONFIG.minimal,
) {
  const headingHeight = 18;
  const nextY = withPageBreak(doc, y, headingHeight + 8, margin, pageHeight);
  const safeTitle = String(title || "").toUpperCase();

  if (templateConfig.headingStyle === "bar") {
    doc.setFillColor(...templateConfig.accent);
    doc.rect(x, nextY - 11, maxWidth, 16, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text(safeTitle, x + 6, nextY + 1);
    return nextY + 14;
  }

  if (templateConfig.headingStyle === "accent") {
    doc.setFillColor(...templateConfig.accent);
    doc.rect(x, nextY - 8, 4, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...templateConfig.headingText);
    doc.text(safeTitle, x + 8, nextY);
    return nextY + 12;
  }

  if (templateConfig.headingStyle === "modernRule") {
    doc.setFillColor(...templateConfig.accent);
    doc.circle(x + 3, nextY - 3, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...templateConfig.headingText);
    doc.text(safeTitle, x + 10, nextY);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.8);
    const titleWidth = doc.getTextWidth(safeTitle);
    const lineStart = Math.min(x + titleWidth + 16, x + maxWidth - 40);
    doc.line(lineStart, nextY - 3, x + maxWidth, nextY - 3);
    return nextY + 10;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...templateConfig.headingText);
  doc.text(safeTitle, x, nextY);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.8);
  doc.line(x, nextY + 4, x + maxWidth, nextY + 4);
  return nextY + 14;
}

function addBulletList(
  doc,
  items,
  x,
  y,
  maxWidth,
  margin,
  pageHeight,
  options = {},
) {
  const { color = [31, 41, 55], bullet = "•" } = options;
  let cursor = y;
  for (const item of cleanArray(items)) {
    cursor = withPageBreak(doc, cursor, 16, margin, pageHeight);
    cursor = addWrappedLine(doc, `${bullet} ${item}`, x, cursor, maxWidth, {
      size: 10,
      color,
      lineGap: 1.5,
    });
    cursor += 1;
  }
  return cursor;
}

export async function downloadResumePDF(
  resume,
  templateId = "minimal",
  fileName = "resume.pdf",
  options = {},
) {
  const { returnBlobUrl = false } = options;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });
  const templateConfig = getPdfTemplateConfig(templateId);
  const isModernTemplate = templateConfig.headerMode === "modernCard";

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const name = String(resume?.name || "Your Name").trim();
  const contactLine = [
    resume?.contact?.email,
    resume?.contact?.phone,
    resume?.contact?.location,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(" | ");

  const profiles = cleanArray(
    (resume?.contact?.profiles || []).map((profile) => {
      const label = String(profile?.label || "").trim() || "Profile";
      const value = String(profile?.value || "").trim();
      return value ? `${label}: ${value}` : "";
    }),
  );

  if (templateConfig.headerMode === "modernCard") {
    const cardHeight = 46;
    const fillColor = templateConfig.cardFill || [250, 250, 250];
    doc.setFillColor(...fillColor);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 8, 8, "FD");

    doc.setDrawColor(...templateConfig.accent);
    doc.setLineWidth(1.4);
    doc.line(margin + 12, y + 12, margin + contentWidth - 12, y + 12);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...templateConfig.headingText);
    doc.text(name.toUpperCase(), margin + 14, y + 30);

    y += cardHeight + 8;
    const tokenLine = [contactLine, ...profiles].filter(Boolean).join(" • ");
    if (tokenLine) {
      y = addWrappedLine(doc, tokenLine, margin, y, contentWidth, {
        size: 10,
        color: templateConfig.bodyText,
        lineGap: 1.5,
      });
    }
  } else if (templateConfig.headerMode === "card") {
    const cardHeight = 64;
    const fillColor = templateConfig.cardFill || [255, 255, 255];
    doc.setFillColor(...fillColor);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 8, 8, "FD");
    doc.setDrawColor(...templateConfig.accent);
    doc.setLineWidth(1.6);
    doc.line(margin + 12, y + 10, margin + 120, y + 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...templateConfig.headingText);
    doc.text(name, margin + 14, y + 24);

    const summary = String(resume?.summary || "").trim();
    if (summary) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...templateConfig.bodyText);
      const summaryLines = doc.splitTextToSize(summary, contentWidth - 28);
      doc.text(summaryLines.slice(0, 2), margin + 14, y + 38);
    }
    y += cardHeight + 8;
    const tokenLine = [contactLine, ...profiles].filter(Boolean).join(" | ");
    if (tokenLine) {
      y = addWrappedLine(doc, tokenLine, margin, y, contentWidth, {
        size: 10,
        color: templateConfig.bodyText,
        lineGap: 1.5,
      });
    }
  } else if (templateConfig.headerMode === "centered") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...templateConfig.headingText);
    doc.text(name.toUpperCase(), margin + contentWidth / 2, y, { align: "center" });
    y += 18;

    if (contactLine) {
      y = addWrappedLine(doc, contactLine, margin, y, contentWidth, {
        size: 10,
        color: templateConfig.bodyText,
        lineGap: 1.5,
      });
    }
    if (profiles.length) {
      y = addWrappedLine(doc, profiles.join(" • "), margin, y, contentWidth, {
        size: 10,
        color: templateConfig.bodyText,
        lineGap: 1.5,
      });
    }
    doc.setDrawColor(...templateConfig.accent);
    doc.setLineWidth(1.2);
    doc.line(margin, y + 3, margin + contentWidth, y + 3);
    y += 14;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...templateConfig.headingText);
    doc.text(name, margin, y);
    y += 20;

    if (contactLine) {
      y = addWrappedLine(doc, contactLine, margin, y, contentWidth, {
        size: 10,
        color: templateConfig.bodyText,
        lineGap: 1.5,
      });
    }

    if (profiles.length) {
      y = addWrappedLine(doc, profiles.join(" | "), margin, y, contentWidth, {
        size: 10,
        color: templateConfig.bodyText,
        lineGap: 1.5,
      });
    }

    y += 4;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin + contentWidth, y);
    y += 12;
  }

  if (
    String(resume?.summary || "").trim() &&
    templateConfig.headerMode !== "card"
  ) {
    y = addSectionTitle(
      doc,
      getSectionTitle(resume, "summary"),
      margin,
      y,
      contentWidth,
      margin,
      pageHeight,
      templateConfig,
    );
    y = addWrappedLine(doc, resume.summary, margin, y, contentWidth, {
      size: 10,
      color: templateConfig.bodyText,
      lineGap: 1.5,
    });
    y += 3;
  }

  const certifications = cleanArray(resume?.certifications || []);
  if (certifications.length && !isModernTemplate) {
    y = addSectionTitle(
      doc,
      getSectionTitle(resume, "certifications"),
      margin,
      y,
      contentWidth,
      margin,
      pageHeight,
      templateConfig,
    );
    y = addBulletList(doc, certifications, margin, y, contentWidth, margin, pageHeight, {
      color: templateConfig.bodyText,
    });
    y += 2;
  }

  const experience = dedupeExperienceEntries(
    (Array.isArray(resume?.experience) ? resume.experience : []).filter(
      (entry) =>
        String(entry?.role || "").trim() ||
        String(entry?.company || "").trim() ||
        String(entry?.duration || "").trim() ||
        cleanArray(entry?.points || []).length,
    ),
  );
  if (experience.length) {
    y = addSectionTitle(
      doc,
      getSectionTitle(resume, "experience"),
      margin,
      y,
      contentWidth,
      margin,
      pageHeight,
      templateConfig,
    );
    for (const exp of experience) {
      const title = [exp?.role, exp?.company].filter(Boolean).join(" | ");
      const duration = String(exp?.duration || "").trim();
      const points = cleanArray(exp?.points || []);
      if (!title && !duration && !points.length) continue;

      y = withPageBreak(doc, y, 24, margin, pageHeight);
      const titleWidth = duration ? contentWidth - 140 : contentWidth;
      y = addWrappedLine(doc, title, margin, y, titleWidth, {
        style: "bold",
        size: 10.5,
        color: templateConfig.headingText,
        lineGap: 1.5,
      });

      if (duration) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...templateConfig.subMeta);
        doc.text(duration, margin + contentWidth, y - 12, { align: "right" });
      }

      y = addBulletList(
        doc,
        points,
        margin + 8,
        y,
        contentWidth - 8,
        margin,
        pageHeight,
        { color: templateConfig.bodyText },
      );
      y += 2;
    }
  }

  const projects = dedupeProjectEntries(
    (Array.isArray(resume?.projects) ? resume.projects : []).filter(
      (entry) =>
        String(entry?.name || "").trim() ||
        String(entry?.role || "").trim() ||
        String(entry?.duration || "").trim() ||
        cleanArray(entry?.points || []).length,
    ),
  );
  if (projects.length) {
    y = addSectionTitle(
      doc,
      getSectionTitle(resume, "projects"),
      margin,
      y,
      contentWidth,
      margin,
      pageHeight,
      templateConfig,
    );
    for (const project of projects) {
      const title = [
        project?.name,
        project?.role ? `Role: ${project.role}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
      const duration = String(project?.duration || "").trim();
      const points = cleanArray(project?.points || []);
      if (!title && !duration && !points.length) continue;

      y = withPageBreak(doc, y, 24, margin, pageHeight);
      const titleWidth = duration ? contentWidth - 140 : contentWidth;
      y = addWrappedLine(doc, title, margin, y, titleWidth, {
        style: "bold",
        size: 10.5,
        color: templateConfig.headingText,
        lineGap: 1.5,
      });

      if (duration) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...templateConfig.subMeta);
        doc.text(duration, margin + contentWidth, y - 12, { align: "right" });
      }

      y = addBulletList(
        doc,
        points,
        margin + 8,
        y,
        contentWidth - 8,
        margin,
        pageHeight,
        { color: templateConfig.bodyText },
      );
      y += 2;
    }
  }

  const seenSkillItems = new Set();
  const skillGroups = (resume?.skills || [])
    .map((group) => {
      const category = String(group?.category || "").trim();
      const items = cleanArray(group?.items || []).filter((item) => {
        const key = normalizeCompareText(item);
        if (!key || seenSkillItems.has(key)) return false;
        seenSkillItems.add(key);
        return true;
      });
      if (!items.length) return null;
      return { category, items };
    })
    .filter(Boolean);

  if (skillGroups.length) {
    y = addSectionTitle(
      doc,
      getSectionTitle(resume, "skills"),
      margin,
      y,
      contentWidth,
      margin,
      pageHeight,
      templateConfig,
    );
    for (const group of skillGroups) {
      y = addInlineSkillLine(
        doc,
        group.category,
        group.items.join(", "),
        margin,
        y,
        contentWidth,
        {
          categorySize: 10.2,
          itemSize: 10,
          categoryColor: templateConfig.headingText,
          itemColor: templateConfig.bodyText,
          lineGap: 1.4,
        },
      );
      y += 0.5;
    }
    y += 2;
  }

  if (certifications.length && isModernTemplate) {
    y = addSectionTitle(
      doc,
      getSectionTitle(resume, "certifications"),
      margin,
      y,
      contentWidth,
      margin,
      pageHeight,
      templateConfig,
    );
    y = addBulletList(doc, certifications, margin, y, contentWidth, margin, pageHeight, {
      color: templateConfig.bodyText,
    });
    y += 2;
  }

  const education = cleanArray(resume?.education || []);
  if (education.length) {
    y = addSectionTitle(
      doc,
      getSectionTitle(resume, "education"),
      margin,
      y,
      contentWidth,
      margin,
      pageHeight,
      templateConfig,
    );
    y = addBulletList(doc, education, margin, y, contentWidth, margin, pageHeight, {
      color: templateConfig.bodyText,
    });
    y += 2;
  }

  const achievements = cleanArray(resume?.achievements || []);
  if (achievements.length) {
    y = addSectionTitle(
      doc,
      getSectionTitle(resume, "achievements"),
      margin,
      y,
      contentWidth,
      margin,
      pageHeight,
      templateConfig,
    );
    y = addBulletList(doc, achievements, margin, y, contentWidth, margin, pageHeight, {
      color: templateConfig.bodyText,
    });
    y += 2;
  }

  const additional = cleanArray(resume?.additional || []);
  const customSections = (resume?.customSections || [])
    .map((section) => ({
      title: String(section?.title || "").trim(),
      items: cleanArray(section?.items || []),
    }))
    .filter((section) => {
      if (!section.title || !section.items.length) return false;
      const title = section.title.toLowerCase();
      return ![
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
      ].includes(title);
    });

  for (const section of customSections) {
    y = addSectionTitle(
      doc,
      section.title,
      margin,
      y,
      contentWidth,
      margin,
      pageHeight,
      templateConfig,
    );
    if (shouldRenderCompactItems(section.items)) {
      y = addWrappedLine(
        doc,
        section.items.map((item) => `• ${item}`).join("   "),
        margin,
        y,
        contentWidth,
        { size: 10, lineGap: 1.5 },
      );
    } else {
      y = addBulletList(doc, section.items, margin, y, contentWidth, margin, pageHeight, {
        color: templateConfig.bodyText,
      });
    }
    y += 2;
  }

  if (additional.length) {
    y = addSectionTitle(
      doc,
      getSectionTitle(resume, "additional"),
      margin,
      y,
      contentWidth,
      margin,
      pageHeight,
      templateConfig,
    );
    addBulletList(doc, additional, margin, y, contentWidth, margin, pageHeight, {
      color: templateConfig.bodyText,
    });
  }

  if (returnBlobUrl) {
    const blob = doc.output("blob");
    return URL.createObjectURL(blob);
  }

  doc.save(fileName);
  return null;
}
