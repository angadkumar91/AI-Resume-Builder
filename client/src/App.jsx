import { useEffect } from "react";
import ATSChecker from "./components/ATSChecker";
import ResumeInput from "./components/ResumeInput";
import ResumePreview from "./components/ResumePreview";
import TemplateSelector from "./components/TemplateSelector";
import Toolbar from "./components/Toolbar";
import { useResumeStore } from "./store/useResumeStore";

function App() {
  const loadLocal = useResumeStore((state) => state.loadLocal);
  const saveLocal = useResumeStore((state) => state.saveLocal);
  const theme = useResumeStore((state) => state.theme);
  const rawText = useResumeStore((state) => state.rawText);
  const resume = useResumeStore((state) => state.resume);
  const templateId = useResumeStore((state) => state.templateId);
  const jobDescription = useResumeStore((state) => state.jobDescription);

  useEffect(() => {
    loadLocal();
  }, [loadLocal]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    saveLocal();
  }, [saveLocal, rawText, resume, templateId, theme, jobDescription]);

  return (
    <div className="canvas-bg min-h-screen text-slate-800 transition-colors dark:text-slate-100">
      <main className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            AI Resume Builder
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            Paste raw resume text, generate a professional ATS-ready one-page resume,
            edit inline, score against job descriptions, and export to PDF or DOCX.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
          <section className="space-y-4">
            <ResumeInput />
            <ATSChecker />
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
              <div className="flex flex-col gap-4">
                <TemplateSelector />
                <Toolbar />
              </div>
            </div>
            <ResumePreview />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
