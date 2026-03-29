import React from "react";
import { render, screen } from "@testing-library/react";
import { CatalogueSortBar } from "@/components/skills/catalogue-sort-bar";

describe("catalogue sort bar", () => {
  it("includes upvote and downvote sorting and preserves search query", () => {
    render(<CatalogueSortBar currentSort="upvotes" search="super" />);

    expect(screen.getByRole("link", { name: /按点赞排序/i })).toHaveAttribute("href", "/skills?sort=upvotes&q=super");
    expect(screen.getByRole("link", { name: /按点踩排序/i })).toHaveAttribute(
      "href",
      "/skills?sort=downvotes&q=super",
    );
    expect(screen.getByRole("link", { name: /按下载量排序/i })).toHaveAttribute(
      "href",
      "/skills?sort=downloads&q=super",
    );
  });
});
