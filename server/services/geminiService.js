import { ensureResumeShape } from "../utils/resumeSchema.js";

const GEMINI_MODEL = "gemini-2.5-flash-lite";

function buildPrompt(rawText) {
  return `You are a professional resume writer.

Convert the input into a COMPLETE structured resume.

IMPORTANT RULES:
* NEVER skip any section.
* If data exists, it MUST be included.
* Always extract ALL experiences (not just one).
* Always extract ALL projects (not just one).
* Always extract ALL education entries.
* Always extract ALL certifications/licenses entries.
* Always extract ALL achievements entries.
* Always extract ALL skills and group them based on the candidate profile.
* Keep contact/profile details at top: email, phone, and all profile handles/links (LinkedIn, GitHub, LeetCode, etc.).
* Do NOT use fixed skill categories. Categories must adapt to the resume content.
* Rewrite bullet points professionally with action verbs.
* Keep content concise for a one-page ATS-friendly resume.
* NEVER merge everything into one line.
* Projects are a mandatory standard section when present in input.
* If there are sections beyond standard ones (for example Publications, Volunteering), place them in customSections.
* Keep related skills together in the same category.
* Do NOT duplicate content across sections.
* Never repeat the same project, experience entry, or skill more than once.
* Return strict JSON only (no markdown, no commentary).

OUTPUT FORMAT:
{
  "name": "",
  "contact": {
    "email": "",
    "phone": "",
    "portfolio": "",
    "profiles": [
      {
        "label": "",
        "value": ""
      }
    ]
  },
  "summary": "",
  "skills": [
    {
      "category": "",
      "items": []
    }
  ],
  "experience": [
    {
      "role": "",
      "company": "",
      "duration": "",
      "points": []
    }
  ],
  "projects": [
    {
      "name": "",
      "role": "",
      "duration": "",
      "points": []
    }
  ],
  "education": [],
  "certifications": [],
  "achievements": [],
  "additional": [],
  "customSections": [
    {
      "title": "",
      "items": []
    }
  ]
}

INPUT:
${rawText}`;
}

function extractTextFromGeminiResponse(payload) {
  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text ?? "")
    .join("")
    .trim();

  if (!text) {
    const error = new Error("Gemini returned an empty response.");
    error.code = "GEMINI_PARSE_ERROR";
    throw error;
  }

  return text;
}

function sanitizeJSONResponse(raw) {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function parseResumeWithGemini(rawText) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const error = new Error(
      "Missing GEMINI_API_KEY in server environment configuration.",
    );
    error.code = "GEMINI_CONFIG_ERROR";
    throw error;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildPrompt(rawText) }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Gemini API request failed: ${response.status}`);
    error.code = "GEMINI_PARSE_ERROR";
    error.details = body;
    throw error;
  }

  const payload = await response.json();
  const candidateText = extractTextFromGeminiResponse(payload);
  const cleanJSON = sanitizeJSONResponse(candidateText);

  try {
    const parsed = JSON.parse(cleanJSON);
    return ensureResumeShape(parsed, rawText);
  } catch (jsonError) {
    const error = new Error("Failed to parse Gemini response into JSON.");
    error.code = "GEMINI_PARSE_ERROR";
    error.details = cleanJSON.slice(0, 500);
    throw error;
  }
}
