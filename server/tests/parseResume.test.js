import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import * as geminiService from "../services/geminiService.js";

describe("POST /api/parse-resume", () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 for invalid input", async () => {
    const response = await request(app).post("/api/parse-resume").send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Invalid input");
  });

  it("returns normalized resume on success", async () => {
    vi.spyOn(geminiService, "parseResumeWithGemini").mockResolvedValue({
      name: "Alex Doe",
      contact: { email: "alex@mail.com", phone: "9999999999", portfolio: "" },
      summary: "Summary",
      skills: [{ category: "Frontend", items: ["React"] }],
      experience: [],
      education: [],
      certifications: ["AWS Certified Cloud Practitioner"],
      achievements: [],
      additional: [],
      customSections: [],
    });

    const response = await request(app)
      .post("/api/parse-resume")
      .send({ rawText: "alex worked with react and node in multiple projects" });

    expect(response.status).toBe(200);
    expect(response.body.resume.name).toBe("Alex Doe");
    expect(response.body.resume.skills[0].items).toContain("React");
    expect(response.body.resume.certifications).toContain(
      "AWS Certified Cloud Practitioner",
    );
    expect(response.body.meta.model).toBe("gemini-2.5-flash-lite");
  });

  it("normalizes skill items when Gemini returns string values", async () => {
    vi.spyOn(geminiService, "parseResumeWithGemini").mockResolvedValue({
      name: "Taylor",
      contact: { email: "", phone: "", portfolio: "" },
      summary: "Summary",
      skills: [{ category: "Programming Languages", items: "Python, SQL, Java" }],
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      achievements: [],
      additional: [],
      customSections: [],
    });

    const response = await request(app)
      .post("/api/parse-resume")
      .send({ rawText: "Python SQL Java engineer profile with project details" });

    expect(response.status).toBe(200);
    expect(response.body.resume.skills[0].items).toEqual(
      expect.arrayContaining(["Python", "SQL", "Java"]),
    );
  });

  it("extracts programming language skills from raw technical skills lines", async () => {
    vi.spyOn(geminiService, "parseResumeWithGemini").mockResolvedValue({
      name: "Taylor",
      contact: { email: "", phone: "", portfolio: "" },
      summary: "Summary",
      skills: [],
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      achievements: [],
      additional: [],
      customSections: [],
    });

    const rawText = [
      "TECHNICAL SKILLS",
      "• Programming Languages: Python, SQL, Java, PySpark",
      "• Frameworks & Libraries: FastAPI, TensorFlow",
    ].join("\n");

    const response = await request(app)
      .post("/api/parse-resume")
      .send({ rawText });

    expect(response.status).toBe(200);
    const programmingGroup = response.body.resume.skills.find((group) =>
      /programming languages/i.test(group.category),
    );
    expect(programmingGroup).toBeTruthy();
    expect(programmingGroup.items).toEqual(
      expect.arrayContaining(["Python", "SQL", "Java", "PySpark"]),
    );
  });

  it("rebuilds empty programming language category from rawText", async () => {
    vi.spyOn(geminiService, "parseResumeWithGemini").mockResolvedValue({
      name: "Angad",
      contact: { email: "", phone: "", portfolio: "" },
      summary: "Summary",
      skills: [
        { category: "Programming Languages", items: [] },
        {
          category: "Ai & Machine Learning",
          items: ["Machine Learning", "Anomaly Detection"],
        },
      ],
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      achievements: [],
      additional: [],
      customSections: [],
    });

    const rawText = [
      "TECHNICAL SKILLS",
      "• Programming Languages: Python, SQL, PySpark, Java",
      "• AI & Machine Learning: Machine Learning, Anomaly Detection",
    ].join("\n");

    const response = await request(app).post("/api/parse-resume").send({ rawText });
    expect(response.status).toBe(200);
    const skillGroups = response.body.resume.skills || [];
    const programmingGroup = skillGroups.find((group) =>
      /programming languages/i.test(group.category),
    );

    expect(programmingGroup).toBeTruthy();
    expect(programmingGroup.items.length).toBeGreaterThan(0);
    expect(programmingGroup.items).toEqual(
      expect.arrayContaining(["Python", "SQL", "PySpark", "Java"]),
    );
    expect(
      skillGroups.some((group) => /programming languages/i.test(group.category) && !(group.items || []).length),
    ).toBe(false);
  });

  it("returns 502 when Gemini response cannot be parsed", async () => {
    const error = new Error("bad payload");
    error.code = "GEMINI_PARSE_ERROR";

    vi.spyOn(geminiService, "parseResumeWithGemini").mockRejectedValue(error);

    const response = await request(app)
      .post("/api/parse-resume")
      .send({ rawText: "valid resume text with enough content" });

    expect(response.status).toBe(502);
  });
});
