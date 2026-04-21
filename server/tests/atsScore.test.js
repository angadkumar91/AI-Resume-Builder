import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("POST /api/ats-score", () => {
  const app = createApp();

  it("returns bounded score and missing keywords", async () => {
    const resume = {
      name: "Alex Doe",
      contact: { email: "", phone: "", portfolio: "" },
      summary: "Frontend engineer with react and javascript background",
      skills: [{ category: "Frontend", items: ["React", "JavaScript", "CSS"] }],
      experience: [
        {
          role: "Frontend Developer",
          company: "Acme",
          duration: "2020-2024",
          points: ["Built responsive UI with React"],
        },
      ],
      education: ["B.Tech Computer Science"],
      certifications: ["AWS Certified Cloud Practitioner"],
      achievements: [],
      additional: [],
      customSections: [],
    };

    const response = await request(app).post("/api/ats-score").send({
      resume,
      jobDescription:
        "We need a React engineer with JavaScript, Node, REST APIs, testing, and communication skills.",
    });

    expect(response.status).toBe(200);
    expect(response.body.score).toBeGreaterThanOrEqual(0);
    expect(response.body.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(response.body.missingKeywords)).toBe(true);
    expect(response.body.missingKeywords.length).toBeGreaterThan(0);
    expect(Array.isArray(response.body.keywordPlacementHints)).toBe(true);
  });
});
