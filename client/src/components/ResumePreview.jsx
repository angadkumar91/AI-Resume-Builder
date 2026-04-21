import CorporateTemplate from "../templates/CorporateTemplate";
import MinimalTemplate from "../templates/MinimalTemplate";
import ModernTemplate from "../templates/ModernTemplate";
import { useResumeStore } from "../store/useResumeStore";

const templateMap = {
  minimal: MinimalTemplate,
  modern: ModernTemplate,
  corporate: CorporateTemplate,
};

export default function ResumePreview() {
  const resume = useResumeStore((state) => state.resume);
  const templateId = useResumeStore((state) => state.templateId);
  const updateResumeField = useResumeStore((state) => state.updateResumeField);
  const appendArrayItem = useResumeStore((state) => state.appendArrayItem);
  const removeArrayItem = useResumeStore((state) => state.removeArrayItem);

  const ActiveTemplate = templateMap[templateId] ?? MinimalTemplate;

  return (
    <>
      <div className="overflow-auto rounded-2xl border border-slate-200 bg-slate-100 p-3 shadow-preview dark:border-slate-700 dark:bg-slate-950">
        <div
          id="resume-preview"
          className="a4-sheet mx-auto rounded-md bg-white p-7 text-[12px] text-slate-900"
        >
          <ActiveTemplate
            mode="edit"
            resume={resume}
            updateResumeField={updateResumeField}
            appendArrayItem={appendArrayItem}
            removeArrayItem={removeArrayItem}
          />
        </div>
      </div>
      <div className="pointer-events-none fixed left-[-10000px] top-0">
        <div id="resume-export" className="a4-sheet bg-white p-7 text-[12px] text-slate-900">
          <ActiveTemplate mode="print" resume={resume} />
        </div>
      </div>
    </>
  );
}
