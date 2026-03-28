import React from "react";
import { render, screen } from "@testing-library/react";
import { VersionSwitcher } from "@/components/skills/version-switcher";

describe("version switcher", () => {
  it("encodes version strings in public history links", () => {
    render(
      <VersionSwitcher
        skillSlug="demo-skill"
        currentVersion="v1.0.0&beta=true"
        versions={[
          {
            id: "version-1",
            version: "v1.0.0&beta=true",
            title: "Demo Skill"
          }
        ]}
      />,
    );

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/skills/demo-skill?version=v1.0.0%26beta%3Dtrue",
    );
  });
});
