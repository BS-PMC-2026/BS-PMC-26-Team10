// Tests for SocialLinks component (BSPMT10-10-usn10)
import { test, expect, describe } from "vitest";
import { render, screen } from "@testing-library/react";
import SocialLinks from "../components/SocialLinks/SocialLinks";

describe("SocialLinks — inline variant", () => {
  test("renders 3 social links", () => {
    render(<SocialLinks variant="inline" />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
  });

  test("Instagram link points to correct URL", () => {
    render(<SocialLinks variant="inline" />);
    const ig = screen.getByLabelText("Instagram");
    expect(ig).toHaveAttribute("href", expect.stringContaining("instagram.com/spicy_with_dinars"));
  });

  test("Facebook link points to correct URL", () => {
    render(<SocialLinks variant="inline" />);
    const fb = screen.getByLabelText("Facebook");
    expect(fb).toHaveAttribute("href", expect.stringContaining("facebook.com"));
  });

  test("WhatsApp link points to correct URL", () => {
    render(<SocialLinks variant="inline" />);
    const wa = screen.getByLabelText("WhatsApp");
    expect(wa).toHaveAttribute("href", expect.stringContaining("wa.me"));
  });

  test("all links open in new tab", () => {
    render(<SocialLinks variant="inline" />);
    screen.getAllByRole("link").forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer");
    });
  });
});

describe("SocialLinks — floating variant", () => {
  test("renders 3 social links", () => {
    render(<SocialLinks variant="floating" />);
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  test("floating container has correct class", () => {
    const { container } = render(<SocialLinks variant="floating" />);
    expect(container.querySelector(".sl-floating")).toBeInTheDocument();
  });
});

describe("SocialLinks — default variant", () => {
  test("defaults to inline when no variant prop given", () => {
    const { container } = render(<SocialLinks />);
    expect(container.querySelector(".sl-inline")).toBeInTheDocument();
  });
});
