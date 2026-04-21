import clsx from "clsx";
import { useResumeStore } from "../store/useResumeStore";

const templates = [
  { id: "minimal", label: "Minimal" },
  { id: "modern", label: "Modern" },
  { id: "corporate", label: "Corporate" },
];

export default function TemplateSelector() {
  const templateId = useResumeStore((state) => state.templateId);
  const setTemplate = useResumeStore((state) => state.setTemplate);

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
        Template
      </p>
      <div className="flex flex-wrap gap-2">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setTemplate(template.id)}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              templateId === template.id
                ? "border-slate-900 bg-slate-900 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-slate-950"
                : "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800",
            )}
          >
            {template.label}
          </button>
        ))}
      </div>
    </div>
  );
}

