import { useEffect, useState } from "react";
import ATSChecker from "./components/ATSChecker";
import HowToUseGuideModal from "./components/HowToUseGuideModal";
import ResumeInput from "./components/ResumeInput";
import ResumePreview from "./components/ResumePreview";
import TemplateSelector from "./components/TemplateSelector";
import Toolbar from "./components/Toolbar";
import { useResumeStore } from "./store/useResumeStore";

const GUIDE_PROMPT_KEY = "resume_builder_guide_prompt_seen";

function App() {
  const loadLocal = useResumeStore((state) => state.loadLocal);
  const saveLocal = useResumeStore((state) => state.saveLocal);
  const theme = useResumeStore((state) => state.theme);
  const rawText = useResumeStore((state) => state.rawText);
  const resume = useResumeStore((state) => state.resume);
  const templateId = useResumeStore((state) => state.templateId);
  const jobDescription = useResumeStore((state) => state.jobDescription);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showGuidePrompt, setShowGuidePrompt] = useState(false);

  useEffect(() => {
    loadLocal();
  }, [loadLocal]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    saveLocal();
  }, [saveLocal, rawText, resume, templateId, theme, jobDescription]);

  useEffect(() => {
    const seenPrompt = localStorage.getItem(GUIDE_PROMPT_KEY);
    if (seenPrompt) return undefined;

    const timer = window.setTimeout(() => {
      setShowGuidePrompt(true);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, []);

  function openGuideFromPrompt() {
    localStorage.setItem(GUIDE_PROMPT_KEY, "1");
    setShowGuidePrompt(false);
    setIsGuideOpen(true);
  }

  function dismissGuidePrompt() {
    localStorage.setItem(GUIDE_PROMPT_KEY, "1");
    setShowGuidePrompt(false);
  }

  return (
    <div className="canvas-bg min-h-screen text-slate-800 transition-colors dark:text-slate-100">
      <main className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              AI Resume Builder
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              Paste raw resume text, generate a professional ATS-ready one-page resume,
              edit inline, score against job descriptions, and export to PDF or DOCX.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-sm transition hover:bg-slate-100 sm:w-auto dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Know How To Use
            </button>
            <a
              href="https://ai-portfolio-builder-part-02.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 shadow-sm transition hover:bg-emerald-100 sm:w-auto dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
            >
              Open AI Portfolio Builder
            </a>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
          <section className="space-y-4">
            <ResumeInput />
            <ATSChecker onOpenGuide={() => setIsGuideOpen(true)} />
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

      <HowToUseGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {showGuidePrompt ? (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Need Help Building The Best Resume?
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Open the complete usage guide to learn the best raw input format,
              section writing style, spacing rules, and ATS checker workflow.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openGuideFromPrompt}
                className="toolbar-btn bg-slate-900 text-white hover:bg-slate-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                Open Guide
              </button>
              <button
                type="button"
                onClick={dismissGuidePrompt}
                className="toolbar-btn"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
