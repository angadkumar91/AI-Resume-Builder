import { useResumeStore } from "../store/useResumeStore";

export default function ResumeInput() {
  const rawText = useResumeStore((state) => state.rawText);
  const isGenerating = useResumeStore((state) => state.isGenerating);
  const error = useResumeStore((state) => state.error);
  const setRawText = useResumeStore((state) => state.setRawText);
  const generateResume = useResumeStore((state) => state.generateResume);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
          Raw Resume Input
        </h2>
        <button
          type="button"
          onClick={generateResume}
          disabled={isGenerating}
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          {isGenerating ? "Generating..." : "Generate Resume"}
        </button>
      </div>

      <textarea
        value={rawText}
        onChange={(event) => setRawText(event.target.value)}
        placeholder="Paste messy or unstructured resume text here..."
        className="min-h-[260px] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
      />

      {error ? (
        <p className="mt-2 rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
          {error}
        </p>
      ) : null}
    </section>
  );
}

