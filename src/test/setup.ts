import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("next/font/google", () => {
  const makeFont = () => () => ({
    className: "",
    style: {},
    variable: ""
  });

  return {
    Cormorant_Garamond: makeFont(),
    IBM_Plex_Mono: makeFont(),
    IBM_Plex_Sans: makeFont()
  };
});
