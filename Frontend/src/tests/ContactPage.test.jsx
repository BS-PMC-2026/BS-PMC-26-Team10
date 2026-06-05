// Tests for ContactPage (BSPMT10-149-usn34)
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ContactPage from "../pages/ContactPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <ContactPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── Rendering ──────────────────────────────────────────────────────────────

test("renders the contact form", () => {
  renderPage();
  expect(document.querySelector(".cp-form")).toBeInTheDocument();
});

test("renders name, phone, email and message fields", () => {
  renderPage();
  expect(document.querySelector("#cp-name")).toBeInTheDocument();
  expect(document.querySelector("#cp-phone")).toBeInTheDocument();
  expect(document.querySelector("#cp-email")).toBeInTheDocument();
  expect(document.querySelector("#cp-message")).toBeInTheDocument();
});

test("renders social links section", () => {
  renderPage();
  expect(document.querySelector(".cp-social-links")).toBeInTheDocument();
});

test("renders 3 social links", () => {
  renderPage();
  const links = document.querySelectorAll(".cp-social-btn");
  expect(links).toHaveLength(3);
});

test("renders direct contact card with phone and email links", () => {
  renderPage();
  expect(document.querySelector('a[href^="tel:"]')).toBeInTheDocument();
  expect(document.querySelector('a[href^="mailto:"]')).toBeInTheDocument();
});

// ── Validation ────────────────────────────────────────────────────────────

test("shows validation errors when submitting empty form", async () => {
  renderPage();
  fireEvent.click(screen.getByRole("button", { name: /שלח הודעה|send message/i }));
  await waitFor(() => {
    expect(document.querySelector(".cp-error")).toBeInTheDocument();
  });
});

test("does not call fetch when form is empty", async () => {
  renderPage();
  fireEvent.click(screen.getByRole("button", { name: /שלח הודעה|send message/i }));
  expect(fetch).not.toHaveBeenCalled();
});

// ── Submission ────────────────────────────────────────────────────────────

test("shows success message after valid submission", async () => {
  renderPage();
  fireEvent.change(document.querySelector("#cp-name"),    { target: { value: "ישראל ישראלי" } });
  fireEvent.change(document.querySelector("#cp-phone"),   { target: { value: "050-000-0000" } });
  fireEvent.change(document.querySelector("#cp-email"),   { target: { value: "test@test.com" } });
  fireEvent.change(document.querySelector("#cp-message"), { target: { value: "שאלה בדיקה" } });

  fireEvent.click(screen.getByRole("button", { name: /שלח הודעה|send message/i }));

  await waitFor(() => {
    expect(document.querySelector(".cp-success")).toBeInTheDocument();
  });
});

test("calls POST /contact on valid submission", async () => {
  renderPage();
  fireEvent.change(document.querySelector("#cp-name"),    { target: { value: "ישראל ישראלי" } });
  fireEvent.change(document.querySelector("#cp-phone"),   { target: { value: "050-000-0000" } });
  fireEvent.change(document.querySelector("#cp-email"),   { target: { value: "test@test.com" } });
  fireEvent.change(document.querySelector("#cp-message"), { target: { value: "שאלה בדיקה" } });

  fireEvent.click(screen.getByRole("button", { name: /שלח הודעה|send message/i }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/contact"),
      expect.objectContaining({ method: "POST" })
    );
  });
});

test("shows send-another button after success", async () => {
  renderPage();
  fireEvent.change(document.querySelector("#cp-name"),    { target: { value: "ישראל ישראלי" } });
  fireEvent.change(document.querySelector("#cp-phone"),   { target: { value: "050-000-0000" } });
  fireEvent.change(document.querySelector("#cp-email"),   { target: { value: "test@test.com" } });
  fireEvent.change(document.querySelector("#cp-message"), { target: { value: "שאלה בדיקה" } });
  fireEvent.click(screen.getByRole("button", { name: /שלח הודעה|send message/i }));

  await waitFor(() => expect(document.querySelector(".cp-success")).toBeInTheDocument());
  expect(screen.getByRole("button", { name: /שלח הודעה נוספת|send another/i })).toBeInTheDocument();
});

test("shows error message when server returns error", async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: false });
  renderPage();
  fireEvent.change(document.querySelector("#cp-name"),    { target: { value: "ישראל ישראלי" } });
  fireEvent.change(document.querySelector("#cp-phone"),   { target: { value: "050-000-0000" } });
  fireEvent.change(document.querySelector("#cp-email"),   { target: { value: "test@test.com" } });
  fireEvent.change(document.querySelector("#cp-message"), { target: { value: "שאלה בדיקה" } });
  fireEvent.click(screen.getByRole("button", { name: /שלח הודעה|send message/i }));

  await waitFor(() => {
    expect(document.querySelector(".cp-send-error")).toBeInTheDocument();
  });
});
