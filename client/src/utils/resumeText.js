export function resumeToPlainText(resume) {
  const skillLine = (resume.skills || [])
    .flatMap((group) => [
      group?.category ? `${group.category}:` : "",
      ...((group?.items || []).filter(Boolean)),
    ])
    .filter(Boolean)
    .join(", ");

  const sections = [];

  sections.push(resume.name || "Unnamed Candidate");
  sections.push(
    [resume.contact?.email, resume.contact?.phone, resume.contact?.location]
      .filter(Boolean)
      .join(" | "),
  );
  if (resume.contact?.profiles?.length) {
    sections.push(
      resume.contact.profiles
        .filter((profile) => profile?.value)
        .map((profile) => `${profile?.label || "Profile"}: ${profile?.value}`)
        .join("\n"),
    );
  }

  if (resume.summary) {
    sections.push(`SUMMARY\n${resume.summary}`);
  }

  if (skillLine) {
    sections.push(`SKILLS\n${skillLine}`);
  }

  if (resume.experience?.length) {
    const experienceBlock = resume.experience
      .map((exp) => {
        const title = [exp.role, exp.company].filter(Boolean).join(" - ");
        const points = (exp.points || [])
          .filter(Boolean)
          .map((point) => `- ${point}`)
          .join("\n");
        return `${title}\n${exp.duration || ""}\n${points}`.trim();
      })
      .join("\n\n");

    sections.push(`EXPERIENCE\n${experienceBlock}`);
  }

  if (resume.projects?.length) {
    const projectsBlock = resume.projects
      .map((project) => {
        const title = [project.name, project.role ? `Role: ${project.role}` : ""]
          .filter(Boolean)
          .join(" - ");
        const points = (project.points || [])
          .filter(Boolean)
          .map((point) => `- ${point}`)
          .join("\n");
        return `${title}\n${project.duration || ""}\n${points}`.trim();
      })
      .join("\n\n");
    sections.push(`PROJECTS\n${projectsBlock}`);
  }

  if (resume.education?.length) {
    sections.push(`EDUCATION\n${resume.education.filter(Boolean).join("\n")}`);
  }

  if (resume.certifications?.length) {
    sections.push(
      `CERTIFICATIONS\n${resume.certifications.filter(Boolean).join("\n")}`,
    );
  }

  if (resume.achievements?.length) {
    sections.push(
      `ACHIEVEMENTS\n${resume.achievements.filter(Boolean).join("\n")}`,
    );
  }

  if (resume.additional?.length) {
    sections.push(`ADDITIONAL\n${resume.additional.filter(Boolean).join("\n")}`);
  }

  if (resume.customSections?.length) {
    for (const section of resume.customSections) {
      const title = String(section?.title || "").trim();
      const items = (section?.items || []).filter(Boolean);
      if (title && items.length) {
        sections.push(`${title.toUpperCase()}\n${items.join("\n")}`);
      }
    }
  }

  return sections.filter(Boolean).join("\n\n");
}
