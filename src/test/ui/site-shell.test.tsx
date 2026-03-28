import React from "react";
import { render, screen } from "@testing-library/react";
import RootLayout from "@/app/layout";

describe("Root layout", () => {
  it("renders archive navigation links", () => {
    const layout = RootLayout({
      children: <div>child</div>
    }) as React.ReactElement<{ children: React.ReactNode }>;

    const body = layout.props.children as React.ReactElement<{ children: React.ReactNode }>;

    render(<>{body.props.children}</>);

    expect(screen.getByRole("link", { name: /browse skills/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /submit/i })).toBeInTheDocument();
  });
});
