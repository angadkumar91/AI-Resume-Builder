import { beforeEach, describe, expect, it } from "vitest";
import { useResumeStore } from "../store/useResumeStore";

describe("useResumeStore", () => {
  beforeEach(() => {
    useResumeStore.getState().resetForTests();
  });

  it("updates nested fields", () => {
    useResumeStore.getState().updateResumeField("contact.email", "a@a.com");
    expect(useResumeStore.getState().resume.contact.email).toBe("a@a.com");
    useResumeStore.getState().updateResumeField("skills.0.category", "Cloud");
    expect(useResumeStore.getState().resume.skills[0].category).toBe("Cloud");
  });

  it("appends and removes list entries", () => {
    useResumeStore
      .getState()
      .appendArrayItem("skills", { category: "Backend", items: ["Node.js"] });
    expect(
      useResumeStore.getState().resume.skills.some((group) =>
        group.items.includes("Node.js"),
      ),
    ).toBe(true);

    const index = useResumeStore
      .getState()
      .resume.skills.findIndex((group) => group.items.includes("Node.js"));
    useResumeStore.getState().removeArrayItem("skills", index);
    expect(
      useResumeStore.getState().resume.skills.some((group) =>
        group.items.includes("Node.js"),
      ),
    ).toBe(false);
  });

  it("adds ATS keywords only to Other Skills and keeps manual guidance", () => {
    useResumeStore.setState({
      resume: {
        ...useResumeStore.getState().resume,
        skills: [
          { category: "Programming Languages", items: ["Python"] },
          { category: "Cloud & DevOps", items: ["AWS"] },
          { category: "Frameworks & Libraries", items: ["React"] },
        ],
        summary: "Backend engineer",
      },
      atsResult: {
        keywordsToReach90: ["docker", "leadership"],
        missingKeywords: ["docker", "leadership"],
        actionPlan: {
          summaryKeywords: ["leadership"],
          skillsKeywords: ["docker"],
          experienceKeywords: [],
        },
      },
    });

    const result = useResumeStore.getState().applyAtsSuggestions();
    const updated = useResumeStore.getState().resume;

    const cloudSkills = updated.skills.find((group) =>
      /cloud|devops/i.test(group.category),
    );
    const otherSkills = updated.skills.find((group) =>
      /other/i.test(group.category),
    );

    expect(result.appliedKeywords).toContain("docker");
    expect(result.appliedKeywords).toContain("leadership");
    expect(cloudSkills?.items || []).not.toContain("docker");
    expect(otherSkills?.items || []).toContain("leadership");
    expect(otherSkills?.items || []).toContain("docker");
    expect(
      (result.manualRecommendations || []).some((item) => item.keyword === "leadership"),
    ).toBe(true);
    expect(updated.summary).toBe("Backend engineer");
    expect(
      (updated.additional || []).some((item) => /ATS Skills Added/i.test(item)),
    ).toBe(false);
  });

  it("can apply new ATS missing keywords on subsequent runs", () => {
    useResumeStore.setState({
      resume: {
        ...useResumeStore.getState().resume,
        skills: [{ category: "Other Skills", items: [] }],
      },
      atsResult: {
        keywordsToReach90: ["docker"],
        missingKeywords: ["docker"],
        actionPlan: { summaryKeywords: [], skillsKeywords: ["docker"], experienceKeywords: [] },
      },
    });

    useResumeStore.getState().applyAtsSuggestions();
    let otherSkills = useResumeStore
      .getState()
      .resume.skills.find((group) => /other/i.test(group.category));
    expect(otherSkills?.items || []).toContain("docker");

    useResumeStore.setState({
      atsResult: {
        keywordsToReach90: ["kubernetes"],
        missingKeywords: ["kubernetes"],
        actionPlan: {
          summaryKeywords: [],
          skillsKeywords: ["kubernetes"],
          experienceKeywords: [],
        },
      },
    });
    useResumeStore.getState().applyAtsSuggestions();
    otherSkills = useResumeStore
      .getState()
      .resume.skills.find((group) => /other/i.test(group.category));
    expect(otherSkills?.items || []).toContain("docker");
    expect(otherSkills?.items || []).toContain("kubernetes");
  });

  it("does not duplicate keywords when ATS suggestions are applied repeatedly", () => {
    useResumeStore.setState({
      resume: {
        ...useResumeStore.getState().resume,
        skills: [{ category: "Other Skills", items: [] }],
      },
      atsResult: {
        keywordsToReach90: ["docker", "kubernetes"],
        missingKeywords: ["docker", "kubernetes"],
        actionPlan: {
          summaryKeywords: [],
          skillsKeywords: ["docker", "kubernetes"],
          experienceKeywords: [],
        },
      },
    });

    const first = useResumeStore.getState().applyAtsSuggestions();
    const second = useResumeStore.getState().applyAtsSuggestions();

    const otherSkills = useResumeStore
      .getState()
      .resume.skills.find((group) => /other/i.test(group.category));
    const items = otherSkills?.items || [];

    expect(first.appliedKeywords).toEqual(
      expect.arrayContaining(["docker", "kubernetes"]),
    );
    expect(second.appliedKeywords).toEqual([]);
    expect(second.skippedKeywords).toEqual(
      expect.arrayContaining(["docker", "kubernetes"]),
    );
    expect(items.filter((item) => /docker/i.test(item)).length).toBe(1);
    expect(items.filter((item) => /kubernetes/i.test(item)).length).toBe(1);
  });

  it("preserves existing skill category order when applying ATS suggestions", () => {
    useResumeStore.setState({
      resume: {
        ...useResumeStore.getState().resume,
        skills: [
          { category: "Programming Languages", items: ["Python", "SQL"] },
          { category: "Frameworks & Libraries", items: ["React"] },
          { category: "Cloud & DevOps", items: ["AWS"] },
          { category: "Other Skills", items: ["Communication"] },
        ],
      },
      atsResult: {
        keywordsToReach90: ["docker", "kubernetes"],
        missingKeywords: ["docker", "kubernetes"],
      },
    });

    const before = useResumeStore
      .getState()
      .resume.skills.map((group) => group.category);
    useResumeStore.getState().applyAtsSuggestions();
    const after = useResumeStore
      .getState()
      .resume.skills.map((group) => group.category);

    expect(after).toEqual(before);
    const otherSkills = useResumeStore
      .getState()
      .resume.skills.find((group) => /other/i.test(group.category));
    expect(otherSkills?.items || []).toEqual(
      expect.arrayContaining(["Communication", "docker", "kubernetes"]),
    );
  });

  it("repairs empty programming language group from rawText on JSON hydrate", () => {
    useResumeStore.getState().hydrateFromJSON({
      rawText: [
        "TECHNICAL SKILLS",
        "• Programming Languages: Python, SQL, PySpark, Java",
        "• AI & Machine Learning: Machine Learning, Anomaly Detection",
      ].join("\n"),
      resume: {
        ...useResumeStore.getState().resume,
        skills: [
          { category: "Programming Languages", items: [] },
          { category: "Ai & Machine Learning", items: ["Machine Learning"] },
        ],
      },
    });

    const skills = useResumeStore.getState().resume.skills;
    const programming = skills.find((group) =>
      /programming languages/i.test(group.category),
    );

    expect(programming).toBeTruthy();
    expect(programming?.items || []).toEqual(
      expect.arrayContaining(["Python", "SQL", "PySpark", "Java"]),
    );
    expect(
      skills.some(
        (group) =>
          /programming languages/i.test(group.category) &&
          !(group.items || []).length,
      ),
    ).toBe(false);
  });

  it("removes empty skill groups during normalization", () => {
    useResumeStore.getState().hydrateFromJSON({
      rawText: "",
      resume: {
        ...useResumeStore.getState().resume,
        skills: [
          { category: "Programming Languages", items: [] },
          { category: "Frameworks & Libraries", items: ["React"] },
        ],
      },
    });

    const skills = useResumeStore.getState().resume.skills;
    expect(
      skills.some(
        (group) =>
          /programming languages/i.test(group.category) &&
          !(group.items || []).length,
      ),
    ).toBe(false);
    expect(
      skills.some((group) => /frameworks/i.test(group.category)),
    ).toBe(true);
  });
});
