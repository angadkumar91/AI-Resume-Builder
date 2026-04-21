import { useEffect, useRef, useState } from "react";
import { useResumeStore } from "../store/useResumeStore";
import { copyText } from "../utils/clipboard";
import { downloadResumeDocx } from "../utils/docxExport";
import { downloadResumePDF } from "../utils/pdfExport";
import { resumeToPlainText } from "../utils/resumeText";

export default function Toolbar() {
  const [status, setStatus] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  const resume = useResumeStore((state) => state.resume);
  const theme = useResumeStore((state) => state.theme);
  const toggleTheme = useResumeStore((state) => state.toggleTheme);
  const saveLocal = useResumeStore((state) => state.saveLocal);
  const loadLocal = useResumeStore((state) => state.loadLocal);
  const hydrateFromJSON = useResumeStore((state) => state.hydrateFromJSON);
  const rawText = useResumeStore((state) => state.rawText);
  const templateId = useResumeStore((state) => state.templateId);

  async function handlePdfDownload() {
    await downloadResumePDF(resume, templateId, "resume.pdf");
    setStatus("Structured PDF downloaded.");
  }

  async function handlePreviewPdf() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    setIsPreviewLoading(true);
    try {
      const url = await downloadResumePDF(resume, templateId, "resume.pdf", {
        returnBlobUrl: true,
      });
      setPreviewUrl(url || "");
      setIsPreviewOpen(true);
      setStatus("PDF preview ready.");
    } catch {
      setStatus("Unable to generate PDF preview.");
    } finally {
      setIsPreviewLoading(false);
    }
  }

  function closePreview() {
    setIsPreviewOpen(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  }

  async function handleDocxDownload() {
    await downloadResumeDocx(resume, templateId, "resume.docx");
    setStatus("DOCX downloaded.");
  }

  async function handleCopy() {
    const text = resumeToPlainText(resume);
    const copied = await copyText(text);
    setStatus(copied ? "Resume copied to clipboard." : "Copy failed.");
  }

  function handleExportJSON() {
    const payload = JSON.stringify({ resume, rawText, templateId, theme }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resume-data.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Resume JSON exported.");
  }

  function triggerImport() {
    fileInputRef.current?.click();
  }

  function handleImportJSON(event) {
    const [file] = event.target.files || [];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        hydrateFromJSON(parsed);
        setStatus("Resume JSON imported.");
      } catch {
        setStatus("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
        Toolbar
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handlePreviewPdf} className="toolbar-btn">
          {isPreviewLoading ? "Preparing Preview..." : "Preview PDF"}
        </button>
        <button
          type="button"
          onClick={handlePdfDownload}
          className="toolbar-btn bg-slate-900 text-white hover:bg-slate-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          Download PDF
        </button>
        <button
          type="button"
          onClick={handleDocxDownload}
          className="toolbar-btn"
        >
          Download DOCX
        </button>
        <button type="button" onClick={handleCopy} className="toolbar-btn">
          Copy Content
        </button>
        <button type="button" onClick={handleExportJSON} className="toolbar-btn">
          Export JSON
        </button>
        <button type="button" onClick={triggerImport} className="toolbar-btn">
          Import JSON
        </button>
        <button
          type="button"
          onClick={() => {
            saveLocal();
            setStatus("Saved locally.");
          }}
          className="toolbar-btn"
        >
          Save Local
        </button>
        <button
          type="button"
          onClick={() => {
            const loaded = loadLocal();
            setStatus(loaded ? "Loaded from local storage." : "No local data found.");
          }}
          className="toolbar-btn"
        >
          Load Local
        </button>
        <button type="button" onClick={toggleTheme} className="toolbar-btn">
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportJSON}
        className="hidden"
      />

      {status ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">{status}</p>
      ) : null}

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="flex h-[92vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">
                Resume PDF Preview
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePdfDownload}
                  className="toolbar-btn"
                >
                  Download
                </button>
                <button type="button" onClick={closePreview} className="toolbar-btn">
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-3">
              {previewUrl ? (
                <iframe
                  key={previewUrl}
                  src={previewUrl}
                  title="Resume PDF Preview"
                  className="h-full w-full rounded-md border border-slate-300 bg-white"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-600">
                  Preparing preview...
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
