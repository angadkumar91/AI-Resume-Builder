import { useEffect } from "react";

const SAMPLE_RAW_RESUME = `RAVI SHARMA

Email: ravi.sharma@example.com
Phone: +91 98765 43210
Location: Bengaluru, India

LinkedIn: linkedin.com/in/ravisharma-data
GitHub: github.com/ravi-sharma-dev
Portfolio: ravisharma.dev

SUMMARY
AI Engineer with 3+ years of experience building data and machine learning solutions for healthcare and finance use cases. Strong in Python, data pipelines, model deployment, and backend APIs.

CERTIFICATIONS
Databricks Certified Data Engineer Associate - 2025
AWS Certified Cloud Practitioner - 2024
Google Data Analytics Professional Certificate - 2023

WORK EXPERIENCE
AI Engineer - Nova Analytics Pvt Ltd | Jan 2024 - Present
Designed and deployed ML-powered analytics services using Python, FastAPI, and Databricks.
Built batch and streaming pipelines with Spark and Delta Lake for production reporting.
Collaborated with cross-functional teams to improve model quality and reduce processing cost.

Data Analyst - Insight Grid Solutions | Jul 2022 - Dec 2023
Automated KPI dashboards and SQL reports for business operations.
Built ETL pipelines for multi-source datasets and improved data reliability.

PROJECTS
Fraud Risk Monitoring Platform Role: ML Engineer | Duration: 4 months
Built anomaly-detection workflow with Isolation Forest and streaming features.
Created Gold-layer datasets and dashboards for near real-time monitoring.

Medical Document Intelligence Role: AI Engineer | Duration: Ongoing
Implemented document ingestion APIs and retrieval workflows for clinical records.
Integrated NLP model outputs into operational insights for analysts.

TECHNICAL SKILLS
Programming Languages: Python, SQL, Java
AI & Machine Learning: ML, Feature Engineering, Model Evaluation, Anomaly Detection
Frameworks & Libraries: FastAPI, TensorFlow, Pandas, NumPy
Data Engineering: Spark, Databricks, Delta Lake, ETL Pipelines
Databases: PostgreSQL, MongoDB, MySQL
Cloud & DevOps: AWS, Docker, GitHub Actions
Tools: Power BI, Jupyter Notebook, VS Code

EDUCATION
B.Tech in Computer Science - XYZ Institute of Technology | 2018 - 2022 | Pune, India

AREA OF INTEREST
Data Science
Artificial Intelligence
Machine Learning
Generative AI`;

function Section({ title, children }) {
  return (
    <section className="mt-5">
      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
        {title}
      </h3>
      <div className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        {children}
      </div>
    </section>
  );
}

function ExampleLine({ label, value }) {
  return (
    <p className="text-xs sm:text-sm">
      <span className="font-semibold text-slate-900 dark:text-slate-100">{label}:</span>{" "}
      <span className="font-mono text-[11px] sm:text-xs">{value}</span>
    </p>
  );
}

export default function HowToUseGuideModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const onEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Know How To Use AI Resume Builder For Best Results
          </h2>
          <button type="button" className="toolbar-btn" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="max-h-[calc(92vh-62px)] overflow-y-auto px-4 py-4 sm:px-6">
          <Section title="Best Workflow">
            <ol className="list-decimal space-y-1 pl-5">
              <li>Paste your full raw resume text in the left input area.</li>
              <li>Click <strong>Generate Resume</strong>.</li>
              <li>Review the right-side preview and edit inline where needed.</li>
              <li>Switch templates and keep the version you like most.</li>
              <li>Run ATS analysis using your target job description.</li>
              <li>Apply ATS suggestions, re-run ATS, and iterate until score is strong.</li>
              <li>Download PDF and DOCX when final.</li>
            </ol>
          </Section>

          <Section title="How To Write Raw Input Properly">
            <p>
              Keep headings clear and in uppercase. Put each section on a new line.
              Use one item per line for certifications, education, and achievements.
              For experience and projects, add role/company/duration first, then point-wise lines.
            </p>
            <p className="mt-2">
              Recommended headings:
              <strong> SUMMARY, WORK EXPERIENCE, PROJECTS, TECHNICAL SKILLS, CERTIFICATIONS, EDUCATION, ACHIEVEMENTS</strong>.
            </p>
          </Section>

          <Section title="Section-by-Section Writing Format">
            <div className="space-y-2">
              <p><strong>Summary:</strong> 2 to 4 lines about profile, strengths, and domain focus.</p>
              <p><strong>Work Experience:</strong> `Role - Company | Duration` then achievement-driven points.</p>
              <p><strong>Projects:</strong> `Project Name Role: X | Duration: Y` then impact points.</p>
              <p><strong>Skills:</strong> Use category format like `Programming Languages: Python, SQL`.</p>
              <p><strong>Certifications:</strong> One certification per line with month/year if possible.</p>
              <p><strong>Education:</strong> Degree | Institution | Years | Location.</p>
            </div>
          </Section>

          <Section title="Mini Examples For Each Section">
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
              <ExampleLine
                label="Name"
                value="RAVI SHARMA"
              />
              <ExampleLine
                label="Profiles"
                value="LinkedIn: linkedin.com/in/ravisharma-data | GitHub: github.com/ravi-sharma-dev"
              />
              <ExampleLine
                label="Summary"
                value="AI Engineer with 3+ years in ML systems, data pipelines, and backend API development."
              />
              <ExampleLine
                label="Work Experience"
                value="AI Engineer - Nova Analytics Pvt Ltd | Jan 2024 - Present"
              />
              <ExampleLine
                label="Experience Point"
                value="Built Databricks-based batch pipelines, reducing report turnaround by 35%."
              />
              <ExampleLine
                label="Project"
                value="Fraud Risk Monitoring Platform Role: ML Engineer | Duration: 4 months"
              />
              <ExampleLine
                label="Skills"
                value="Programming Languages: Python, SQL, Java"
              />
              <ExampleLine
                label="Certification"
                value="Databricks Certified Data Engineer Associate - 2025"
              />
              <ExampleLine
                label="Education"
                value="B.Tech in CSE - XYZ Institute | 2018 - 2022 | Pune, India"
              />
              <ExampleLine
                label="Achievement"
                value="Ranked Top 5 in internal ML hackathon (2024)."
              />
              <ExampleLine
                label="Additional Details"
                value="Languages: English, Hindi"
              />
              <ExampleLine
                label="Custom Section"
                value="AREA OF INTEREST -> Data Science, Machine Learning, Generative AI"
              />
            </div>
          </Section>

          <Section title="Spacing and Newline Guidance">
            <ul className="list-disc space-y-1 pl-5">
              <li>For skills, use comma-separated items in the same category line.</li>
              <li>For short custom items, comma or single Enter keeps items compact.</li>
              <li>For paragraph-style custom points, use a blank line (double Enter) between points.</li>
              <li>Keep bullet points concise (prefer 8 to 16 words each).</li>
              <li>Avoid repeating the same skill/project/experience point.</li>
            </ul>
          </Section>

          <Section title="How ATS Checker Works">
            <ul className="list-disc space-y-1 pl-5">
              <li>Paste the target job description in ATS Checker.</li>
              <li>Click <strong>Run ATS Analysis</strong>.</li>
              <li>Review score, missing keywords, and suggestions.</li>
              <li>Click <strong>Use These Suggestions</strong> to add suggested keywords into skills.</li>
              <li>Click <strong>Run ATS Analysis</strong> again and iterate until score improves.</li>
            </ul>
          </Section>

          <Section title="Other Features You Should Use">
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Templates:</strong> Try Minimal, Modern, and Corporate before final export.</li>
              <li><strong>Preview PDF:</strong> Check layout before downloading.</li>
              <li><strong>Download PDF/DOCX:</strong> Export final resume in both formats.</li>
              <li><strong>Copy Content:</strong> Quickly copy plain resume text.</li>
              <li><strong>Export JSON:</strong> Save editable structured resume backup.</li>
              <li><strong>Import JSON:</strong> Continue from a previous resume session.</li>
              <li><strong>Dark Mode:</strong> Editing comfort mode (export remains resume-focused).</li>
              <li><strong>Save Local / Load Local:</strong> Keep work-in-progress in browser storage.</li>
            </ul>
          </Section>

          <Section title="Build Portfolio From Resume (AI Portfolio Builder)">
            <p>
              After finalizing your resume here, you can quickly build a portfolio website using
              your resume content in <strong>AI Portfolio Builder</strong>.
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Open your generated resume preview.</li>
              <li>Copy resume content (use <strong>Copy Content</strong> button or select all text).</li>
              <li>Open AI Portfolio Builder in a new tab.</li>
              <li>Paste content and generate portfolio sections automatically.</li>
            </ol>
            <a
              href="https://ai-portfolio-builder-part-02.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
            >
              Open AI Portfolio Builder
            </a>
          </Section>

          <Section title="Common Mistakes To Avoid">
            <ul className="list-disc space-y-1 pl-5">
              <li>Do not paste only one section. Always paste complete resume content.</li>
              <li>Do not write all skills in a single unstructured paragraph.</li>
              <li>Do not use decorative symbols or unusual characters in raw input.</li>
              <li>Do not duplicate points across Summary, Experience, and Projects.</li>
            </ul>
          </Section>

          <Section title="Dummy Raw Resume Reference (Best-Suited Format)">
            <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
              Copy this structure pattern and replace with your own details.
            </p>
            <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
              {SAMPLE_RAW_RESUME}
            </pre>
          </Section>
        </div>
      </div>
    </div>
  );
}
