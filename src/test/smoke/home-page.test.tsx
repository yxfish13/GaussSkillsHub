import React from "react";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("Home page", () => {
  it("shows the product name and submit CTA", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: /skills hub/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /submit a skill/i })).toHaveAttribute("href", "/submit");
  });
});
