import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import TemplatePrintRenderer from "./TemplatePrintRenderer";

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
      if (
        !result.some(
          (existing) => existing.toLowerCase() === item.toLowerCase(),
        )
      ) {
        result.push(item);
      }
    });
  return result;
}

const draftCache = new Map();

function splitSkillsDraft(value = "") {
  return value
    .replace(/\r/g, "")
    .split(/\n|,|•|\|/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitCustomDraft(value = "") {
  const raw = String(value || "").replace(/\r/g, "");
  if (!raw.trim()) return [];

  const blocks = raw
    .split(/\n\s*\n+/g)
    .map((block) => block.trim())
    .filter(Boolean);

  const items = [];
  blocks.forEach((block) => {
    const lines = block
      .split(/\n/g)
      .map((item) => item.trim())
      .filter(Boolean);
    const parts = block
      .split(/\n|,|•|\|/g)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!parts.length) return;

    const compactLike =
      parts.length > 1 &&
      parts.every((part) => part.split(/\s+/).filter(Boolean).length <= 6);
    const explicitCompactSeparators = /[,|•]/.test(block);
    const shortSingleEnterList =
      lines.length > 1 &&
      lines.every((line) => line.split(/\s+/).filter(Boolean).length <= 6);

    if (compactLike || explicitCompactSeparators || shortSingleEnterList) {
      parts.forEach((part) => items.push(part));
      return;
    }

    items.push(block.replace(/\n+/g, " ").trim());
  });

  return cleanArray(items);
}

function arrayToCommaText(items = []) {
  return cleanArray(items).join(", ");
}

function arrayToLines(items = []) {
  return cleanArray(items).join("\n");
}

function SectionTitle({
  title,
  className = "",
  titlePath,
  updateResumeField,
  inputClassName = "",
}) {
  const canEdit = Boolean(titlePath && typeof updateResumeField === "function");
  return (
    <h2
      className={clsx(
        "mb-1.5 border-b pb-1 text-[13px] font-bold uppercase tracking-[0.12em]",
        className,
      )}
    >
      {canEdit ? (
        <input
          value={title || ""}
          onChange={(event) => updateResumeField(titlePath, event.target.value)}
          placeholder="Section Title"
          className={clsx(
            "w-full bg-transparent px-0 py-0 outline-none",
            inputClassName,
          )}
        />
      ) : (
        title
      )}
    </h2>
  );
}

function EditSection({
  title,
  styles,
  variant = "minimal",
  children,
  titlePath,
  updateResumeField,
}) {
  const canEditTitle = Boolean(titlePath && typeof updateResumeField === "function");
  if (variant === "modern") {
    return (
      <section className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-700" />
          <h2
            className={clsx(
              "min-w-[180px] text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700",
            )}
          >
            {canEditTitle ? (
              <input
                value={title || ""}
                onChange={(event) => updateResumeField(titlePath, event.target.value)}
                placeholder="Section Title"
                className="w-full bg-transparent px-0 py-0 outline-none"
              />
            ) : (
              title
            )}
          </h2>
          <span className="h-px flex-1 bg-slate-300" />
        </div>
        {children}
      </section>
    );
  }

  if (variant === "corporate") {
    return (
      <section className="mt-6 overflow-hidden rounded-sm border border-blue-200 bg-white">
        <h2
          className={clsx(
            "bg-blue-900 px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white",
          )}
        >
          {canEditTitle ? (
            <input
              value={title || ""}
              onChange={(event) => updateResumeField(titlePath, event.target.value)}
              placeholder="Section Title"
              className="w-full bg-transparent px-0 py-0 text-white outline-none"
            />
          ) : (
            title
          )}
        </h2>
        <div className="p-3">{children}</div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <SectionTitle
        title={title}
        className={styles.heading}
        titlePath={titlePath}
        updateResumeField={updateResumeField}
      />
      {children}
    </section>
  );
}

function FieldInput({ value, onChange, placeholder, className = "" }) {
  return (
    <input
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={clsx(
        "w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none transition focus:border-slate-300 focus:bg-slate-50",
        className,
      )}
    />
  );
}

function FieldTextarea({
  value,
  onChange,
  rows = 3,
  placeholder,
  className = "",
}) {
  return (
    <textarea
      rows={rows}
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={clsx(
        "w-full resize-none rounded-md border border-transparent bg-transparent px-2 py-1 text-sm leading-snug outline-none transition focus:border-slate-300 focus:bg-slate-50",
        className,
      )}
    />
  );
}

function DelimitedTextarea({
  items,
  onCommit,
  fieldKey,
  rows = 3,
  placeholder,
  className = "",
  mode = "skills",
}) {
  const textFromItems =
    mode === "custom" ? arrayToLines(items) : arrayToCommaText(items);
  const [draft, setDraft] = useState(
    () => draftCache.get(fieldKey) ?? textFromItems,
  );
  const latestDraftRef = useRef(draft);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  const parseDraft = (text) => {
    if (mode === "custom") return splitCustomDraft(text);
    return splitSkillsDraft(text);
  };

  useEffect(() => {
    return () => {
      const latest = latestDraftRef.current;
      const parsed =
        mode === "custom" ? splitCustomDraft(latest) : splitSkillsDraft(latest);
      onCommitRef.current(parsed);
      draftCache.set(fieldKey, latest);
    };
  }, [fieldKey, mode]);

  return (
    <textarea
      rows={rows}
      value={draft}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        latestDraftRef.current = next;
        draftCache.set(fieldKey, next);
      }}
      onBlur={(event) => {
        const latest = event.target.value;
        latestDraftRef.current = latest;
        draftCache.set(fieldKey, latest);
        const parsed = parseDraft(latest);
        onCommit(parsed);
      }}
      placeholder={placeholder}
      className={clsx(
        "w-full resize-none rounded-md border border-transparent bg-transparent px-2 py-1 text-sm leading-snug outline-none transition focus:border-slate-300 focus:bg-slate-50",
        className,
      )}
    />
  );
}

function SkillsEditor({
  resume,
  updateResumeField,
  appendArrayItem,
  removeArrayItem,
  styles,
  variant,
  sectionTitle,
  sectionTitlePath,
}) {
  const groups =
    Array.isArray(resume.skills) && resume.skills.length ? resume.skills : [];

  return (
    <EditSection
      title={sectionTitle || "Technical Skills"}
      titlePath={sectionTitlePath}
      updateResumeField={updateResumeField}
      styles={styles}
      variant={variant}
    >
      <div className="space-y-3">
        {groups.map((group, index) => (
          <div
            key={`skill-group-${index}`}
            className={clsx("rounded-md border p-2", styles.block)}
          >
            <div className="flex items-center gap-2">
              <span className={clsx("text-sm font-bold", styles.subHeading)}>
                {"•"}
              </span>
              <FieldInput
                value={group?.category}
                placeholder="Skill category (e.g., Cloud, Languages, Tools)"
                className={clsx(styles.text, "font-semibold")}
                onChange={(value) =>
                  updateResumeField(`skills.${index}.category`, value)
                }
              />
              <button
                type="button"
                className={clsx(
                  "rounded-md px-2 py-1 text-xs font-semibold",
                  styles.mutedButton,
                )}
                onClick={() => removeArrayItem("skills", index)}
              >
                Remove
              </button>
            </div>
            <DelimitedTextarea
              key={`skills-draft-${index}-${arrayToCommaText(group?.items || [])}`}
              fieldKey={`skills.${index}.items`}
              mode="skills"
              items={group?.items || []}
              rows={3}
              className={clsx("mt-2", styles.text)}
              placeholder="Type skills separated by comma (e.g., Python, SQL, Databricks). Press Enter for a new line if needed."
              onCommit={(value) =>
                updateResumeField(`skills.${index}.items`, value)
              }
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        className={clsx(
          "mt-2 rounded-md border px-2 py-1 text-xs font-semibold",
          styles.addButton,
        )}
        onClick={() => appendArrayItem("skills", { category: "", items: [""] })}
      >
        + Add Skill Group
      </button>
    </EditSection>
  );
}

function ProfilesEditor({
  profiles,
  updateResumeField,
  appendArrayItem,
  removeArrayItem,
  styles,
  variant,
  sectionTitle,
  sectionTitlePath,
}) {
  const safeProfiles =
    Array.isArray(profiles) && profiles.length
      ? profiles
      : [{ label: "", value: "" }];
  return (
    <section className="mt-4">
      <SectionTitle
        title={sectionTitle || "Profiles"}
        titlePath={sectionTitlePath}
        updateResumeField={updateResumeField}
        className={clsx(
          styles.heading,
          variant === "modern" &&
            "mb-2 border-0 pb-0 text-[12px] tracking-[0.12em] text-zinc-700",
          variant === "corporate" &&
            "mb-2 border-0 pb-0 text-[12px] tracking-[0.12em] text-blue-900",
        )}
      />
      <div className="space-y-1.5">
        {safeProfiles.map((profile, index) => (
          <div
            className="grid grid-cols-1 gap-2 sm:grid-cols-[160px_1fr_auto]"
            key={`profile-${index}`}
          >
            <FieldInput
              value={profile?.label}
              placeholder="Label (LinkedIn, GitHub)"
              className={styles.text}
              onChange={(value) =>
                updateResumeField(`contact.profiles.${index}.label`, value)
              }
            />
            <FieldInput
              value={profile?.value}
              placeholder="Handle or URL"
              className={styles.text}
              onChange={(value) =>
                updateResumeField(`contact.profiles.${index}.value`, value)
              }
            />
            <button
              type="button"
              className={clsx(
                "rounded-md px-2 py-1 text-xs font-semibold",
                styles.mutedButton,
              )}
              onClick={() => removeArrayItem("contact.profiles", index)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={clsx(
          "mt-2 rounded-md border px-2 py-1 text-xs font-semibold",
          styles.addButton,
        )}
        onClick={() =>
          appendArrayItem("contact.profiles", { label: "", value: "" })
        }
      >
        + Add Profile
      </button>
    </section>
  );
}

function ProjectsEditor({
  resume,
  updateResumeField,
  appendArrayItem,
  removeArrayItem,
  styles,
  variant,
  sectionTitle,
  sectionTitlePath,
}) {
  const projects =
    Array.isArray(resume.projects) && resume.projects.length
      ? resume.projects
      : [];

  return (
    <EditSection
      title={sectionTitle || "Projects"}
      titlePath={sectionTitlePath}
      updateResumeField={updateResumeField}
      styles={styles}
      variant={variant}
    >
      <div className="space-y-3">
        {projects.map((project, projectIndex) => (
          <div
            key={`project-edit-${projectIndex}`}
            className={clsx("rounded-md border p-2", styles.block)}
          >
            <FieldInput
              value={project.name}
              placeholder="Project Name"
              onChange={(value) =>
                updateResumeField(`projects.${projectIndex}.name`, value)
              }
              className={styles.text}
            />
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <FieldInput
                value={project.role}
                placeholder="Role"
                onChange={(value) =>
                  updateResumeField(`projects.${projectIndex}.role`, value)
                }
                className={styles.text}
              />
              <FieldInput
                value={project.duration}
                placeholder="Duration"
                onChange={(value) =>
                  updateResumeField(`projects.${projectIndex}.duration`, value)
                }
                className={styles.text}
              />
            </div>

            <div className="mt-2 space-y-1">
              {(project.points || []).map((point, pointIndex) => (
                <div
                  className="flex items-center gap-2"
                  key={`project-point-${projectIndex}-${pointIndex}`}
                >
                  <FieldInput
                    value={point}
                    placeholder="Project bullet point"
                    onChange={(value) =>
                      updateResumeField(
                        `projects.${projectIndex}.points.${pointIndex}`,
                        value,
                      )
                    }
                    className={styles.text}
                  />
                  <button
                    type="button"
                    className={clsx(
                      "rounded-md px-2 py-1 text-xs font-semibold",
                      styles.mutedButton,
                    )}
                    onClick={() =>
                      removeArrayItem(
                        `projects.${projectIndex}.points`,
                        pointIndex,
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={clsx(
                  "rounded-md border px-2 py-1 text-xs font-semibold",
                  styles.addButton,
                )}
                onClick={() =>
                  appendArrayItem(`projects.${projectIndex}.points`, "")
                }
              >
                + Add Bullet
              </button>
              <button
                type="button"
                className={clsx(
                  "rounded-md border px-2 py-1 text-xs font-semibold",
                  styles.removeButton,
                )}
                onClick={() => removeArrayItem("projects", projectIndex)}
              >
                Remove Project
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={clsx(
          "mt-2 rounded-md border px-2 py-1 text-xs font-semibold",
          styles.addButton,
        )}
        onClick={() =>
          appendArrayItem("projects", {
            name: "",
            role: "",
            duration: "",
            points: [""],
          })
        }
      >
        + Add Project
      </button>
    </EditSection>
  );
}

function ArraySectionEditor({
  title,
  titlePath,
  addLabel,
  path,
  items,
  placeholder,
  appendArrayItem,
  removeArrayItem,
  updateResumeField,
  styles,
  variant,
}) {
  const safeItems = Array.isArray(items) && items.length ? items : [""];

  return (
    <EditSection
      title={title}
      titlePath={titlePath}
      updateResumeField={updateResumeField}
      styles={styles}
      variant={variant}
    >
      <div className="space-y-1.5">
        {safeItems.map((item, index) => (
          <div className="flex items-center gap-2" key={`${path}-${index}`}>
            <FieldInput
              value={item}
              placeholder={placeholder}
              className={styles.text}
              onChange={(value) => updateResumeField(`${path}.${index}`, value)}
            />
            <button
              type="button"
              className={clsx(
                "rounded-md px-2 py-1 text-xs font-semibold",
                styles.mutedButton,
              )}
              onClick={() => removeArrayItem(path, index)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={clsx(
          "mt-2 rounded-md border px-2 py-1 text-xs font-semibold",
          styles.addButton,
        )}
        onClick={() => appendArrayItem(path, "")}
      >
        + Add {addLabel}
      </button>
    </EditSection>
  );
}

function CustomSectionsEditor({
  customSections,
  updateResumeField,
  appendArrayItem,
  removeArrayItem,
  styles,
  variant,
  sectionTitle,
  sectionTitlePath,
}) {
  const sections =
    Array.isArray(customSections) && customSections.length
      ? customSections
      : [];

  return (
    <EditSection
      title={sectionTitle || "Custom Sections"}
      titlePath={sectionTitlePath}
      updateResumeField={updateResumeField}
      styles={styles}
      variant={variant}
    >
      <div className="space-y-3">
        {sections.map((section, index) => (
          <div
            key={`custom-section-${index}`}
            className={clsx("rounded-md border p-2", styles.block)}
          >
            <div className="flex items-center gap-2">
              <FieldInput
                value={section?.title}
                placeholder="Section title (e.g., Publications, Projects)"
                className={styles.text}
                onChange={(value) =>
                  updateResumeField(`customSections.${index}.title`, value)
                }
              />
              <button
                type="button"
                className={clsx(
                  "rounded-md px-2 py-1 text-xs font-semibold",
                  styles.mutedButton,
                )}
                onClick={() => removeArrayItem("customSections", index)}
              >
                Remove
              </button>
            </div>
            <DelimitedTextarea
              key={`custom-draft-${index}-${arrayToLines(section?.items || [])}`}
              fieldKey={`customSections.${index}.items`}
              mode="custom"
              items={section?.items || []}
              rows={3}
              className={clsx("mt-2", styles.text)}
              placeholder="Short values: use comma or single Enter (e.g., English, Hindi, Bhojpuri). Long point: write full line and press Enter twice (blank line) for next point."
              onCommit={(value) =>
                updateResumeField(`customSections.${index}.items`, value)
              }
            />
            <p className={clsx("mt-1 text-[11px]", styles.subMeta)}>
              Hint: comma or single Enter keeps short items compact in one line.
              Use a blank line (double Enter) to start a new paragraph bullet.
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={clsx(
          "mt-2 rounded-md border px-2 py-1 text-xs font-semibold",
          styles.addButton,
        )}
        onClick={() =>
          appendArrayItem("customSections", {
            title: "New Section",
            items: [""],
          })
        }
      >
        + Add Custom Section
      </button>
    </EditSection>
  );
}

function PrintMode({ resume, styles, variant = "minimal" }) {
  return (
    <TemplatePrintRenderer
      resume={resume}
      styles={styles}
      variant={variant}
    />
  );
}

function EditMode({
  resume,
  updateResumeField,
  appendArrayItem,
  removeArrayItem,
  styles,
  variant = "minimal",
}) {
  const rootClass =
    variant === "modern"
      ? "h-full w-full rounded-[20px] border border-slate-300 bg-gradient-to-br from-white via-stone-50/70 to-slate-50 p-5 shadow-[0_20px_40px_rgba(15,23,42,0.09)]"
      : "h-full w-full";
  const headerClass =
    variant === "modern"
      ? "relative overflow-hidden rounded-2xl border border-slate-300 bg-gradient-to-r from-white via-slate-50 to-stone-100/70 px-5 py-4 shadow-[0_8px_22px_rgba(15,23,42,0.07)]"
      : variant === "corporate"
        ? "border-y-2 border-blue-900 py-3 text-center"
        : clsx("border-b pb-3", styles.headerRule);
  const nameClass =
    variant === "modern"
      ? "px-0 text-[36px] font-extrabold tracking-[0.01em]"
      : variant === "corporate"
        ? "px-0 text-[32px] font-black uppercase tracking-[0.07em] text-center"
        : "px-0 text-3xl font-bold";
  const contactGridClass =
    variant === "modern"
      ? "mt-3 grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2"
      : variant === "corporate"
        ? "mx-auto mt-3 grid max-w-[96%] grid-cols-1 gap-2 text-sm sm:grid-cols-3"
        : "mt-2 grid grid-cols-1 gap-1 text-sm sm:grid-cols-3";
  const sectionTitles = resume.sectionTitles || {};

  return (
    <div className={clsx(rootClass, styles.wrapper)}>
      <header className={clsx(headerClass, styles.headerRule)}>
        {variant === "modern" ? (
          <>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-[2px] w-8 rounded-full bg-slate-700" />
              <span className="h-[2px] w-full rounded-full bg-slate-200" />
            </div>
            <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-b from-slate-100/70 to-transparent" />
          </>
        ) : null}
        <FieldInput
          value={resume.name}
          placeholder="Full Name"
          onChange={(value) => updateResumeField("name", value)}
          className={clsx(nameClass, styles.name)}
        />
        <div className={contactGridClass}>
          <FieldInput
            value={resume.contact.email}
            placeholder="email@example.com"
            onChange={(value) => updateResumeField("contact.email", value)}
            className={styles.contact}
          />
          <FieldInput
            value={resume.contact.phone}
            placeholder="+91-XXXXXXXXXX"
            onChange={(value) => updateResumeField("contact.phone", value)}
            className={styles.contact}
          />
          <FieldInput
            value={resume.contact.location}
            placeholder="Location"
            onChange={(value) => updateResumeField("contact.location", value)}
            className={styles.contact}
          />
        </div>

        <ProfilesEditor
          profiles={resume.contact.profiles}
          updateResumeField={updateResumeField}
          appendArrayItem={appendArrayItem}
          removeArrayItem={removeArrayItem}
          styles={styles}
          variant={variant}
          sectionTitle={sectionTitles.profiles}
          sectionTitlePath="sectionTitles.profiles"
        />
      </header>

      <EditSection
        title={sectionTitles.summary || "Professional Summary"}
        titlePath="sectionTitles.summary"
        updateResumeField={updateResumeField}
        styles={styles}
        variant={variant}
      >
        <FieldTextarea
          rows={4}
          value={resume.summary}
          placeholder="Write a concise profile summary."
          onChange={(value) => updateResumeField("summary", value)}
          className={styles.text}
        />
      </EditSection>

      <EditSection
        title={sectionTitles.experience || "Work Experience"}
        titlePath="sectionTitles.experience"
        updateResumeField={updateResumeField}
        styles={styles}
        variant={variant}
      >
        <div className="space-y-3">
          {(resume.experience || []).map((exp, expIndex) => (
            <div
              key={`exp-edit-${expIndex}`}
              className={clsx(
                "rounded-md border p-2",
                styles.block,
                variant === "modern" &&
                  "border-slate-200 bg-gradient-to-r from-white to-slate-50/70 shadow-[0_6px_14px_rgba(15,23,42,0.05)]",
                variant === "corporate" && "bg-blue-50/20",
              )}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <FieldInput
                  value={exp.role}
                  placeholder="Role"
                  onChange={(value) =>
                    updateResumeField(`experience.${expIndex}.role`, value)
                  }
                  className={styles.text}
                />
                <FieldInput
                  value={exp.company}
                  placeholder="Company"
                  onChange={(value) =>
                    updateResumeField(`experience.${expIndex}.company`, value)
                  }
                  className={styles.text}
                />
              </div>
              <FieldInput
                value={exp.duration}
                placeholder="Duration"
                onChange={(value) =>
                  updateResumeField(`experience.${expIndex}.duration`, value)
                }
                className={clsx("mt-2", styles.text)}
              />

              <div className="mt-2 space-y-1">
                {(exp.points || []).map((point, pointIndex) => (
                  <div
                    className="flex items-center gap-2"
                    key={`point-${pointIndex}`}
                  >
                    <FieldInput
                      value={point}
                      placeholder="Bullet point"
                      onChange={(value) =>
                        updateResumeField(
                          `experience.${expIndex}.points.${pointIndex}`,
                          value,
                        )
                      }
                      className={styles.text}
                    />
                    <button
                      type="button"
                      className={clsx(
                        "rounded-md px-2 py-1 text-xs font-semibold",
                        styles.mutedButton,
                      )}
                      onClick={() =>
                        removeArrayItem(
                          `experience.${expIndex}.points`,
                          pointIndex,
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={clsx(
                    "rounded-md border px-2 py-1 text-xs font-semibold",
                    styles.addButton,
                  )}
                  onClick={() =>
                    appendArrayItem(`experience.${expIndex}.points`, "")
                  }
                >
                  + Add Bullet
                </button>
                <button
                  type="button"
                  className={clsx(
                    "rounded-md border px-2 py-1 text-xs font-semibold",
                    styles.removeButton,
                  )}
                  onClick={() => removeArrayItem("experience", expIndex)}
                >
                  Remove Experience
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className={clsx(
            "mt-2 rounded-md border px-2 py-1 text-xs font-semibold",
            styles.addButton,
          )}
          onClick={() =>
            appendArrayItem("experience", {
              role: "",
              company: "",
              duration: "",
              points: [""],
            })
          }
        >
          + Add Experience
        </button>
      </EditSection>

      <ProjectsEditor
        resume={resume}
        updateResumeField={updateResumeField}
        appendArrayItem={appendArrayItem}
        removeArrayItem={removeArrayItem}
        styles={styles}
        variant={variant}
        sectionTitle={sectionTitles.projects}
        sectionTitlePath="sectionTitles.projects"
      />

      <SkillsEditor
        resume={resume}
        updateResumeField={updateResumeField}
        appendArrayItem={appendArrayItem}
        removeArrayItem={removeArrayItem}
        styles={styles}
        variant={variant}
        sectionTitle={sectionTitles.skills}
        sectionTitlePath="sectionTitles.skills"
      />

      <ArraySectionEditor
        title={sectionTitles.education || "Education"}
        titlePath="sectionTitles.education"
        addLabel="Education"
        path="education"
        items={resume.education}
        placeholder="Degree / Institution / Year"
        appendArrayItem={appendArrayItem}
        removeArrayItem={removeArrayItem}
        updateResumeField={updateResumeField}
        styles={styles}
        variant={variant}
      />

      <ArraySectionEditor
        title={sectionTitles.certifications || "Certifications"}
        titlePath="sectionTitles.certifications"
        addLabel="Certification"
        path="certifications"
        items={resume.certifications}
        placeholder="Certification / Provider / Year"
        appendArrayItem={appendArrayItem}
        removeArrayItem={removeArrayItem}
        updateResumeField={updateResumeField}
        styles={styles}
        variant={variant}
      />

      <ArraySectionEditor
        title={sectionTitles.achievements || "Achievements"}
        titlePath="sectionTitles.achievements"
        addLabel="Achievement"
        path="achievements"
        items={resume.achievements}
        placeholder="Awards / Milestones"
        appendArrayItem={appendArrayItem}
        removeArrayItem={removeArrayItem}
        updateResumeField={updateResumeField}
        styles={styles}
        variant={variant}
      />

      <ArraySectionEditor
        title={sectionTitles.additional || "Additional Details"}
        titlePath="sectionTitles.additional"
        addLabel="Additional Item"
        path="additional"
        items={resume.additional}
        placeholder="Other relevant details"
        appendArrayItem={appendArrayItem}
        removeArrayItem={removeArrayItem}
        updateResumeField={updateResumeField}
        styles={styles}
        variant={variant}
      />

      <CustomSectionsEditor
        customSections={resume.customSections}
        updateResumeField={updateResumeField}
        appendArrayItem={appendArrayItem}
        removeArrayItem={removeArrayItem}
        styles={styles}
        variant={variant}
        sectionTitle={sectionTitles.custom}
        sectionTitlePath="sectionTitles.custom"
      />
    </div>
  );
}

export default function ResumeTemplateBase({
  resume,
  updateResumeField,
  appendArrayItem,
  removeArrayItem,
  mode = "edit",
  styles,
  variant = "minimal",
}) {
  if (mode === "print") {
    return <PrintMode resume={resume} styles={styles} variant={variant} />;
  }

  return (
    <EditMode
      resume={resume}
      updateResumeField={updateResumeField}
      appendArrayItem={appendArrayItem}
      removeArrayItem={removeArrayItem}
      styles={styles}
      variant={variant}
    />
  );
}

