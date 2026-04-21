import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import ResumePreview from "../components/ResumePreview";
import { useResumeStore } from "../store/useResumeStore";

describe("ResumePreview", () => {
  beforeEach(() => {
    useResumeStore.getState().resetForTests();
    useResumeStore
      .getState()
      .updateResumeField("name", "Jane Candidate");
  });

  it("renders the preview container and editable fields", () => {
    render(<ResumePreview />);
    expect(document.getElementById("resume-preview")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Jane Candidate")).toBeInTheDocument();
  });
});

