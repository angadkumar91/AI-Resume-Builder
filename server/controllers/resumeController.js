import { calculateATSScore } from "../services/atsService.js";
import { parseResumeWithGemini } from "../services/geminiService.js";
import {
  ensureResumeShape,
  validateResumeForScoring,
} from "../utils/resumeSchema.js";

export async function parseResume(req, res, next) {
  try {
    const rawText = req.body?.rawText;

    if (!rawText || typeof rawText !== "string" || rawText.trim().length < 10) {
      return res.status(400).json({
        error:
          "Invalid input. Provide rawText as a non-empty string with meaningful content.",
      });
    }

    const resume = await parseResumeWithGemini(rawText);

    return res.status(200).json({
      resume: ensureResumeShape(resume, rawText),
      meta: { model: "gemini-2.5-flash-lite" },
    });
  } catch (error) {
    if (error.code === "GEMINI_PARSE_ERROR") {
      return res.status(502).json({
        error:
          "Gemini returned an unexpected response format. Please try again.",
      });
    }

    if (error.code === "GEMINI_CONFIG_ERROR") {
      return res.status(500).json({
        error: error.message,
      });
    }

    return next(error);
  }
}

export function getATSScore(req, res) {
  const { resume, jobDescription } = req.body ?? {};

  if (!jobDescription || typeof jobDescription !== "string") {
    return res
      .status(400)
      .json({ error: "jobDescription is required and must be a string." });
  }

  if (!validateResumeForScoring(resume)) {
    return res.status(400).json({
      error: "resume is required and must match the expected resume structure.",
    });
  }

  const normalizedResume = ensureResumeShape(resume);
  const scoreResult = calculateATSScore(normalizedResume, jobDescription);
  return res.status(200).json(scoreResult);
}
