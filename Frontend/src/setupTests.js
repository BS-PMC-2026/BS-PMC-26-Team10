import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import i18n from "./i18n";

// Force English so tests can assert against the English UI strings.
i18n.changeLanguage("en");

afterEach(() => {
  cleanup();
});