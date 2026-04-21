import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ATSChecker from "../components/ATSChecker";
import { useResumeStore } from "../store/useResumeStore";
import apiClient from "../utils/apiClient";

describe("ATSChecker", () => {
  beforeEach(() => {
    useResumeStore.getState().resetForTests();
    vi.restoreAllMocks();
  });

  it("shows ATS score after checking", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValue({
      data: {
        score: 82,
        matchedKeywords: ["react", "javascript"],
        missingKeywords: ["node"],
        suggestions: ["Add projects demonstrating node."],
      },
    });

    render(<ATSChecker />);

    fireEvent.change(
      screen.getByPlaceholderText(
        /Paste job description here to score match and identify missing keywords/i,
      ),
      {
        target: {
          value: "Need react javascript node testing communication",
        },
      },
    );

    fireEvent.click(screen.getByRole("button", { name: /Run ATS Analysis/i }));

    await waitFor(() => {
      expect(screen.getByText(/ATS Score: 82/i)).toBeInTheDocument();
    });
  });
});

