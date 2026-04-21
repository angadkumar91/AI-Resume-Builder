import clsx from "clsx";

const RESERVED_SECTION_TITLES = new Set([
  "summary",
  "professional summary",
  "skills",
  "technical skills",
  "work experience",
  "experience",
  "projects",
  "education",
  "certifications",
  "achievements",
  "additional",
  "additional details",
]);

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

function cleanArray(value) {
  if (!Array.isArray(value)) return [];
  const result = [];
  value
    .map((item) =>
      String(item || "")
        .replace(/\s+/g, " ")
        .trim(),
    )
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

function dedupeExperiences(entries = []) {
  const output = [];
  entries.forEach((entry) => {
    const role = String(entry?.role || "").trim();
    const company = String(entry?.company || "").trim();
    const duration = String(entry?.duration || "").trim();
    const points = cleanArray(entry?.points || []);
    const fullKey = [role, company, duration].map(normalizeCompareText).join("|");
    const softKey = [role, company].map(normalizeCompareText).join("|");
    const existingIndex = output.findIndex((item) => {
      const existingFull = [item.role, item.company, item.duration]
        .map(normalizeCompareText)
        .join("|");
      const existingSoft = [item.role, item.company]
        .map(normalizeCompareText)
        .join("|");
      return (
        (fullKey && existingFull === fullKey) ||
        (softKey && existingSoft === softKey)
      );
    });

    if (existingIndex === -1) {
      output.push({ role, company, duration, points });
      return;
    }

    output[existingIndex].points = cleanArray([
      ...(output[existingIndex].points || []),
      ...points,
    ]);
    if (!output[existingIndex].duration && duration) {
      output[existingIndex].duration = duration;
    }
  });
  return output;
}

function dedupeProjects(entries = []) {
  const output = [];
  entries.forEach((entry) => {
    const name = String(entry?.name || "").trim();
    const role = String(entry?.role || "").trim();
    const duration = String(entry?.duration || "").trim();
    const points = cleanArray(entry?.points || []);
    const fullKey = [name, role, duration].map(normalizeCompareText).join("|");
    const softKey = [name, role].map(normalizeCompareText).join("|");
    const existingIndex = output.findIndex((item) => {
      const existingFull = [item.name, item.role, item.duration]
        .map(normalizeCompareText)
        .join("|");
      const existingSoft = [item.name, item.role]
        .map(normalizeCompareText)
        .join("|");
      return (
        (fullKey && existingFull === fullKey) ||
        (softKey && existingSoft === softKey)
      );
    });

    if (existingIndex === -1) {
      output.push({ name, role, duration, points });
      return;
    }

    output[existingIndex].points = cleanArray([
      ...(output[existingIndex].points || []),
      ...points,
    ]);
    if (!output[existingIndex].duration && duration) {
      output[existingIndex].duration = duration;
    }
  });
  return output;
}

function shouldRenderCompactItems(items = []) {
  if (items.length < 2) return false;
  return items.every((item) => {
    const words = String(item || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return words > 0 && words <= 4;
  });
}

function buildPrintData(resume) {
  const rawSkillGroups = (resume.skills || [])
    .map((group) => ({
      category: String(group?.category || "").trim(),
      items: cleanArray(group?.items || []),
    }))
    .filter((group) => group.items.length);

  const seenSkills = new Set();
  const skillGroups = rawSkillGroups
    .map((group) => {
      const items = group.items.filter((item) => {
        const key = normalizeCompareText(item);
        if (!key || seenSkills.has(key)) return false;
        seenSkills.add(key);
        return true;
      });
      return { ...group, items };
    })
    .filter((group) => group.items.length);

  const experience = dedupeExperiences(
    (resume.experience || []).filter(
      (item) =>
        String(item?.role || "").trim() ||
        String(item?.company || "").trim() ||
        String(item?.duration || "").trim() ||
        cleanArray(item?.points || []).length,
    ),
  );
  const projects = dedupeProjects(
    (resume.projects || []).filter(
      (item) =>
        String(item?.name || "").trim() ||
        String(item?.role || "").trim() ||
        String(item?.duration || "").trim() ||
        cleanArray(item?.points || []).length,
    ),
  );

  const sectionTitles = { ...DEFAULT_SECTION_TITLES };
  if (resume?.sectionTitles && typeof resume.sectionTitles === "object") {
    Object.keys(sectionTitles).forEach((key) => {
      const next = String(resume.sectionTitles[key] || "").trim();
      if (next) {
        sectionTitles[key] = next;
      }
    });
  }

  return {
    name: String(resume.name || "").trim() || "Your Name",
    summary: String(resume.summary || "").trim(),
    contactLine: [resume.contact?.email, resume.contact?.phone, resume.contact?.location]
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(" | "),
    profiles: (resume.contact?.profiles || [])
      .map((profile) => ({
        label: String(profile?.label || "").trim(),
        value: String(profile?.value || "").trim(),
      }))
      .filter((profile) => profile.value)
      .map((profile) => `${profile.label || "Profile"}: ${profile.value}`),
    skillGroups,
    experience,
    projects,
    education: cleanArray(resume.education || []),
    certifications: cleanArray(resume.certifications || []),
    achievements: cleanArray(resume.achievements || []),
    additional: cleanArray(resume.additional || []),
    sectionTitles,
    customSections: (resume.customSections || [])
      .map((section) => ({
        title: String(section?.title || "").trim(),
        items: cleanArray(section?.items || []),
      }))
      .filter((section) => {
        if (!section.title || !section.items.length) return false;
        return !RESERVED_SECTION_TITLES.has(section.title.toLowerCase());
      }),
  };
}

function PrintBullets({ items, className = "" }) {
  return (
    <ul className={clsx("mt-1 list-disc space-y-0.5 pl-5 text-[11px]", className)}>
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function MinimalSection({ title, styles, children }) {
  return (
    <section className="mt-6">
      <h2
        className={clsx(
          "mb-1.5 border-b pb-1 text-[13px] font-bold uppercase tracking-[0.12em]",
          styles.heading,
        )}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function MinimalPrintLayout({ data, styles }) {
  const titles = data.sectionTitles || DEFAULT_SECTION_TITLES;
  return (
    <div className={clsx("resume-content w-full", styles.wrapper)}>
      <header className={clsx("border-b pb-3.5", styles.headerRule)}>
        <h1 className={clsx("text-[29px] font-bold leading-none", styles.printName)}>
          {data.name}
        </h1>
        {data.contactLine ? (
          <p className={clsx("mt-1 text-[11px]", styles.printContact)}>{data.contactLine}</p>
        ) : null}
        {data.profiles.length ? (
          <div
            className={clsx(
              "mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px]",
              styles.printContact,
            )}
          >
            {data.profiles.map((profile, index) => (
              <span key={`minimal-profile-${index}`}>{profile}</span>
            ))}
          </div>
        ) : null}
      </header>

      {data.summary ? (
        <MinimalSection title={titles.summary} styles={styles}>
          <p className={clsx("text-sm", styles.text)}>{data.summary}</p>
        </MinimalSection>
      ) : null}

      {data.experience.length ? (
        <MinimalSection title={titles.experience} styles={styles}>
          <div className="space-y-3">
            {data.experience.map((exp, index) => {
              const heading = [exp.role, exp.company].filter(Boolean).join(" | ");
              const points = cleanArray(exp.points || []);
              if (!heading && !exp.duration && !points.length) return null;
              return (
                <article key={`minimal-exp-${index}`}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className={clsx("text-sm font-semibold", styles.subHeading)}>{heading}</h3>
                    {exp.duration ? (
                      <p className={clsx("text-xs text-right", styles.subMeta)}>{exp.duration}</p>
                    ) : null}
                  </div>
                  {points.length ? <PrintBullets items={points} className={styles.text} /> : null}
                </article>
              );
            })}
          </div>
        </MinimalSection>
      ) : null}

      {data.projects.length ? (
        <MinimalSection title={titles.projects} styles={styles}>
          <div className="space-y-3">
            {data.projects.map((project, index) => {
              const heading = [
                project.name,
                project.role ? `Role: ${project.role}` : "",
              ]
                .filter(Boolean)
                .join(" | ");
              const points = cleanArray(project.points || []);
              if (!heading && !project.duration && !points.length) return null;
              return (
                <article key={`minimal-project-${index}`}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className={clsx("text-sm font-semibold", styles.subHeading)}>{heading}</h3>
                    {project.duration ? (
                      <p className={clsx("text-xs text-right", styles.subMeta)}>
                        {project.duration}
                      </p>
                    ) : null}
                  </div>
                  {points.length ? <PrintBullets items={points} className={styles.text} /> : null}
                </article>
              );
            })}
          </div>
        </MinimalSection>
      ) : null}

      {data.skillGroups.length ? (
        <MinimalSection title={titles.skills} styles={styles}>
          <div className={clsx("grid grid-cols-2 gap-x-5 gap-y-1 text-[11px]", styles.text)}>
            {data.skillGroups.map((group, index) => (
              <div key={`minimal-skill-group-${index}`}>
                {group.category ? (
                  <>
                    <span className={clsx("font-bold", styles.subHeading)}>
                      • {group.category}:
                    </span>{" "}
                    <span>{group.items.join(", ")}</span>
                  </>
                ) : (
                  <span>{group.items.join(", ")}</span>
                )}
              </div>
            ))}
          </div>
        </MinimalSection>
      ) : null}

      {data.certifications.length ? (
        <MinimalSection title={titles.certifications} styles={styles}>
          <PrintBullets items={data.certifications} className={styles.text} />
        </MinimalSection>
      ) : null}

      {data.education.length ? (
        <MinimalSection title={titles.education} styles={styles}>
          <PrintBullets items={data.education} className={styles.text} />
        </MinimalSection>
      ) : null}

      {data.achievements.length ? (
        <MinimalSection title={titles.achievements} styles={styles}>
          <PrintBullets items={data.achievements} className={styles.text} />
        </MinimalSection>
      ) : null}

      {data.additional.length ? (
        <MinimalSection title={titles.additional} styles={styles}>
          <PrintBullets items={data.additional} className={styles.text} />
        </MinimalSection>
      ) : null}

      {data.customSections.map((section, index) => (
        <MinimalSection key={`minimal-custom-${index}`} title={section.title} styles={styles}>
          {shouldRenderCompactItems(section.items) ? (
            <p className={clsx("text-[11px]", styles.text)}>
              {section.items.map((item) => `• ${item}`).join("   ")}
            </p>
          ) : (
            <PrintBullets items={section.items} className={styles.text} />
          )}
        </MinimalSection>
      ))}
    </div>
  );
}

function ModernSection({ title, children }) {
  return (
    <section className="mt-5">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-slate-700" />
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700">
          {title}
        </h2>
        <span className="h-px flex-1 bg-slate-300" />
      </div>
      <div className="mt-2.5 pl-3">{children}</div>
    </section>
  );
}

function ModernPrintLayout({ data, styles }) {
  const titles = data.sectionTitles || DEFAULT_SECTION_TITLES;
  const contactTokens = [
    ...(data.contactLine
      ? data.contactLine
          .split("|")
          .map((token) => token.trim())
          .filter(Boolean)
      : []),
    ...data.profiles,
  ];

  return (
    <div className={clsx("resume-content w-full", styles.wrapper)}>
      <header className="relative overflow-hidden rounded-xl border border-slate-300 bg-gradient-to-r from-white via-slate-50 to-stone-100/70 px-5 py-4">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-b from-slate-100/80 to-transparent" />
        <div className="mb-2 flex items-center gap-2">
          <span className="h-[2px] w-8 rounded-full bg-slate-700" />
          <span className="h-[2px] w-full rounded-full bg-slate-200" />
        </div>
        <h1
          className={clsx(
            "text-[30px] font-extrabold uppercase leading-none tracking-[0.01em]",
            styles.printName,
          )}
        >
          {data.name}
        </h1>
        {contactTokens.length ? (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-zinc-600">
            {contactTokens.map((token, index) => (
              <span key={`modern-contact-${index}`}>
                {index > 0 ? <span className="mr-2 text-zinc-400">•</span> : null}
                {token}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      {data.summary ? (
        <ModernSection title={titles.summary}>
          <p className={clsx("text-[11px] leading-snug", styles.text)}>{data.summary}</p>
        </ModernSection>
      ) : null}

      {data.experience.length ? (
        <ModernSection title={titles.experience}>
          <div className="space-y-3">
            {data.experience.map((exp, index) => {
              const heading = [exp.role, exp.company].filter(Boolean).join(" | ");
              const points = cleanArray(exp.points || []);
              if (!heading && !exp.duration && !points.length) return null;
              return (
                <article
                  key={`modern-exp-${index}`}
                  className="relative border-l-2 border-slate-300 pl-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-900">{heading}</h3>
                    {exp.duration ? (
                      <p className="text-xs font-medium text-zinc-600">{exp.duration}</p>
                    ) : null}
                  </div>
                  {points.length ? <PrintBullets items={points} className={styles.text} /> : null}
                </article>
              );
            })}
          </div>
        </ModernSection>
      ) : null}

      {data.projects.length ? (
        <ModernSection title={titles.projects}>
          <div className="space-y-3">
            {data.projects.map((project, index) => {
              const heading = [
                project.name,
                project.role ? `Role: ${project.role}` : "",
              ]
                .filter(Boolean)
                .join(" | ");
              const points = cleanArray(project.points || []);
              if (!heading && !project.duration && !points.length) return null;
              return (
                <article
                  key={`modern-project-${index}`}
                  className="relative border-l-2 border-stone-300 pl-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-900">{heading}</h3>
                    {project.duration ? (
                      <p className="text-xs font-medium text-zinc-600">{project.duration}</p>
                    ) : null}
                  </div>
                  {points.length ? <PrintBullets items={points} className={styles.text} /> : null}
                </article>
              );
            })}
          </div>
        </ModernSection>
      ) : null}

      {data.skillGroups.length ? (
        <ModernSection title={titles.skills}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-700">
            {data.skillGroups.map((group, index) => (
              <p key={`modern-skill-group-${index}`} className="text-[11px] text-zinc-700">
                {group.category ? (
                  <>
                    <span className="font-bold text-slate-900">• {group.category}: </span>
                    <span>{group.items.join(", ")}</span>
                  </>
                ) : (
                  <span>{group.items.join(", ")}</span>
                )}
              </p>
            ))}
          </div>
        </ModernSection>
      ) : null}

      {data.certifications.length ? (
        <ModernSection title={titles.certifications}>
          <PrintBullets items={data.certifications} className={styles.text} />
        </ModernSection>
      ) : null}

      {data.education.length ? (
        <ModernSection title={titles.education}>
          <PrintBullets items={data.education} className={styles.text} />
        </ModernSection>
      ) : null}

      {data.achievements.length ? (
        <ModernSection title={titles.achievements}>
          <PrintBullets items={data.achievements} className={styles.text} />
        </ModernSection>
      ) : null}

      {data.additional.length ? (
        <ModernSection title={titles.additional}>
          <PrintBullets items={data.additional} className={styles.text} />
        </ModernSection>
      ) : null}

      {data.customSections.map((section, index) => (
        <ModernSection key={`modern-custom-${index}`} title={section.title}>
          {shouldRenderCompactItems(section.items) ? (
            <p className="text-[11px] text-slate-700">
              {section.items.map((item) => `• ${item}`).join("   ")}
            </p>
          ) : (
            <PrintBullets items={section.items} className={styles.text} />
          )}
        </ModernSection>
      ))}
    </div>
  );
}

function CorporateSection({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 bg-blue-900 px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
        {title}
      </h2>
      <div className="px-0.5">{children}</div>
    </section>
  );
}

function CorporatePrintLayout({ data, styles }) {
  const titles = data.sectionTitles || DEFAULT_SECTION_TITLES;
  return (
    <div className={clsx("resume-content w-full", styles.wrapper)}>
      <header className="border-y-2 border-blue-900 py-3 text-center">
        <h1 className={clsx("text-[27px] font-extrabold uppercase tracking-[0.08em]", styles.printName)}>
          {data.name}
        </h1>
        {data.contactLine ? (
          <p className={clsx("mt-1 text-[11px]", styles.printContact)}>{data.contactLine}</p>
        ) : null}
        {data.profiles.length ? (
          <p className={clsx("mt-1 text-[11px]", styles.printContact)}>{data.profiles.join(" • ")}</p>
        ) : null}
      </header>

      {data.summary ? (
        <CorporateSection title={titles.summary}>
          <p className={clsx("text-[11px]", styles.text)}>{data.summary}</p>
        </CorporateSection>
      ) : null}

      {data.experience.length ? (
        <CorporateSection title={titles.experience}>
          <div className="space-y-2.5">
            {data.experience.map((exp, index) => {
              const points = cleanArray(exp.points || []);
              if (!exp.role && !exp.company && !exp.duration && !points.length) return null;
              return (
                <article
                  key={`corporate-exp-${index}`}
                  className="border border-blue-200 px-2.5 py-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {exp.role ? (
                        <h3 className={clsx("text-sm font-semibold", styles.subHeading)}>{exp.role}</h3>
                      ) : null}
                      {exp.company ? <p className="text-[11px] text-slate-700">{exp.company}</p> : null}
                    </div>
                    {exp.duration ? (
                      <p className={clsx("text-xs text-right", styles.subMeta)}>{exp.duration}</p>
                    ) : null}
                  </div>
                  {points.length ? <PrintBullets items={points} className={styles.text} /> : null}
                </article>
              );
            })}
          </div>
        </CorporateSection>
      ) : null}

      {data.projects.length ? (
        <CorporateSection title={titles.projects}>
          <div className="space-y-2.5">
            {data.projects.map((project, index) => {
              const points = cleanArray(project.points || []);
              if (!project.name && !project.role && !project.duration && !points.length) return null;
              return (
                <article
                  key={`corporate-project-${index}`}
                  className="border border-blue-200 px-2.5 py-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {project.name ? (
                        <h3 className={clsx("text-sm font-semibold", styles.subHeading)}>{project.name}</h3>
                      ) : null}
                      {project.role ? (
                        <p className="text-[11px] text-slate-700">Role: {project.role}</p>
                      ) : null}
                    </div>
                    {project.duration ? (
                      <p className={clsx("text-xs text-right", styles.subMeta)}>{project.duration}</p>
                    ) : null}
                  </div>
                  {points.length ? <PrintBullets items={points} className={styles.text} /> : null}
                </article>
              );
            })}
          </div>
        </CorporateSection>
      ) : null}

      {data.skillGroups.length ? (
        <CorporateSection title={titles.skills}>
          <ul className={clsx("space-y-1 text-[11px]", styles.text)}>
            {data.skillGroups.map((group, index) => (
              <li key={`corporate-skill-group-${index}`}>
                {group.category ? (
                  <>
                    <span className={clsx("font-bold", styles.subHeading)}>• {group.category}:</span>{" "}
                    <span>{group.items.join(", ")}</span>
                  </>
                ) : (
                  <span>{group.items.join(", ")}</span>
                )}
              </li>
            ))}
          </ul>
        </CorporateSection>
      ) : null}

      {data.certifications.length ? (
        <CorporateSection title={titles.certifications}>
          <PrintBullets items={data.certifications} className={styles.text} />
        </CorporateSection>
      ) : null}

      {data.education.length ? (
        <CorporateSection title={titles.education}>
          <PrintBullets items={data.education} className={styles.text} />
        </CorporateSection>
      ) : null}

      {data.achievements.length ? (
        <CorporateSection title={titles.achievements}>
          <PrintBullets items={data.achievements} className={styles.text} />
        </CorporateSection>
      ) : null}

      {data.additional.length ? (
        <CorporateSection title={titles.additional}>
          <PrintBullets items={data.additional} className={styles.text} />
        </CorporateSection>
      ) : null}

      {data.customSections.map((section, index) => (
        <CorporateSection key={`corporate-custom-${index}`} title={section.title}>
          {shouldRenderCompactItems(section.items) ? (
            <p className={clsx("text-[11px]", styles.text)}>
              {section.items.map((item) => `• ${item}`).join("   ")}
            </p>
          ) : (
            <PrintBullets items={section.items} className={styles.text} />
          )}
        </CorporateSection>
      ))}
    </div>
  );
}

export default function TemplatePrintRenderer({
  resume,
  styles,
  variant = "minimal",
}) {
  const data = buildPrintData(resume);
  if (variant === "modern") {
    return <ModernPrintLayout data={data} styles={styles} />;
  }
  if (variant === "corporate") {
    return <CorporatePrintLayout data={data} styles={styles} />;
  }
  return <MinimalPrintLayout data={data} styles={styles} />;
}
