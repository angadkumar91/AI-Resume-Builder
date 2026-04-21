import { useResumeStore } from "../store/useResumeStore";

function ScoreBadge({ score }) {
  const tone =
    score >= 90
      ? "bg-emerald-100 text-emerald-800"
      : score >= 75
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-800";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>
      ATS Score: {score}
    </span>
  );
}

export default function ATSChecker() {
  const jobDescription = useResumeStore((state) => state.jobDescription);
  const atsResult = useResumeStore((state) => state.atsResult);
  const isCheckingATS = useResumeStore((state) => state.isCheckingATS);
  const atsError = useResumeStore((state) => state.atsError);
  const setJobDescription = useResumeStore((state) => state.setJobDescription);
  const runAtsCheck = useResumeStore((state) => state.runAtsCheck);
  const applyAtsSuggestions = useResumeStore(
    (state) => state.applyAtsSuggestions,
  );

  const targetKeywords = atsResult?.keywordsToReach90 || [];
  const placementHints = atsResult?.keywordPlacementHints || [];
  const canApplySuggestions = Boolean(
    atsResult &&
    ((atsResult?.keywordsToReach90 || []).length ||
      (atsResult?.stretchKeywordsFor99 || []).length ||
      (atsResult?.missingKeywords || []).length),
  );

  function handleUseSuggestions() {
    const result = applyAtsSuggestions();
    const appliedList = (result?.appliedKeywords || []).slice(0, 12);
    const skippedList = (result?.skippedKeywords || []).slice(0, 12);
    const manualList = (result?.manualRecommendations || []).slice(0, 8);

    const appliedLine = appliedList.length
      ? `Auto-applied keywords were added to "Other Skills": ${appliedList.join(", ")}`
      : 'No new keyword was added. "Other Skills" already contains current ATS keywords.';
    const skippedLine = skippedList.length
      ? `\nAlready present (skipped): ${skippedList.join(", ")}`
      : "";
    const manualLines = manualList.length
      ? `\n\nManual section fit recommendations:\n${manualList
          .map(
            (item) =>
              `- ${item.keyword}: ${item.sections.join(" / ")}${item.example ? `\n  e.g. ${item.example}` : ""}`,
          )
          .join("\n")}`
      : "";

    window.alert(
      `${result?.message || "ATS suggestions processed."}\n\n${appliedLine}${skippedLine}${manualLines}\n\nPlease re-run ATS analysis now.`,
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
          ATS Checker
        </h2>
        <button
          type="button"
          onClick={runAtsCheck}
          disabled={isCheckingATS}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {isCheckingATS ? "Checking..." : "Run ATS Analysis"}
        </button>
      </div>

      <textarea
        value={jobDescription}
        onChange={(event) => setJobDescription(event.target.value)}
        placeholder="Paste job description here to score match and identify missing keywords..."
        className="min-h-[170px] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
      />

      {atsError ? (
        <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
          {atsError}
        </p>
      ) : null}

      {atsResult ? (
        <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
          <ScoreBadge score={atsResult.score} />

          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
              Missing Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {(atsResult.missingKeywords || []).slice(0, 12).map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-rose-100 px-2 py-1 text-[11px] font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
              Keywords To Reach 90-99%
            </h3>
            <div className="flex flex-wrap gap-2">
              {targetKeywords.length ? (
                targetKeywords.slice(0, 14).map((keyword) => (
                  <span
                    key={`target-${keyword}`}
                    className="rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200"
                  >
                    {keyword}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-300">
                  Score is near target or no extra keywords required. Re-run
                  after edits for refreshed targets.
                </span>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
              Suggestions
            </h3>
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              {(atsResult.suggestions || []).slice(0, 5).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
              Section Fit Guidance
            </h3>
            {placementHints.length ? (
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {placementHints.slice(0, 8).map((item) => (
                  <li key={`${item.keyword}-${item.section}`}>
                    • <span className="font-semibold">{item.keyword}</span> →{" "}
                    {item.section}
                    {item.example ? (
                      <span className="block pl-4 text-[11px] text-slate-500 dark:text-slate-300">
                        e.g. {item.example}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Run ATS analysis to get section-level placement guidance.
              </p>
            )}
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleUseSuggestions}
              disabled={!canApplySuggestions}
              className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-900/50"
            >
              Use These Suggestions
            </button>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">
              After applying, run ATS analysis again. Keep iterating until score
              reaches 90%+.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
