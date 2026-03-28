import React from "react";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("Home page", () => {
  it("shows the gauss skills hub brand in Chinese context", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: /gauss skills hub/i })).toBeInTheDocument();
    expect(screen.getByText(/发现、提交和迭代你的 skills/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /提交 skill/i })).toHaveAttribute("href", "/submit");
  });
});
