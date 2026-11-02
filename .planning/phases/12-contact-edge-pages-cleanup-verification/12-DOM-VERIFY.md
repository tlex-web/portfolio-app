---
schema_version: 1
wave: 5
outcome: verified
reason: ok
checked: 16
passed: 13
failed: 0
needs_review: 3
---

# Phase 12 wave 5: live-DOM verification (12-15, 12-16, 12-26)

Browser: claude-in-chrome, new tab, against `next start` at http://localhost:3000 (HEAD 02a2b0c).

## 12-15 /offline
- 12-15 title: passed. `document.title` = `Offline · Tim Lui`.
- 12-15 robots: passed. `meta[name=robots]` = `noindex`.
- 12-15 h1: passed. Single h1 `You're offline`.
- 12-15 body copy: passed. `This page needs a connection and reloads by itself when you're back online.`
- 12-15 Try again button: passed. Button `Try again` is present.
- 12-15 Saved on this device: passed. The h2 `Saved on this device` shows the list branch (Home, Photographs, Engineering, Roadmap, Contact, a photograph, box, coin-flip). The SW was controlling the page. The empty and unsupported branches were not reachable live.
- 12-15 error pages: needs_review (could not look). They can't be triggered on demand, so they rely on Jest coverage.

## 12-16 Direct contact panel
- 12-16 h2: passed. `Direct contact`.
- 12-16 Email row: passed. Mono address text, a Copy button with aria-label `Copy email address`, and the `Write an email` mailto link (not clicked).
- 12-16 Copy feedback ("Copied"): needs_review. I did not click it, to avoid writing to the clipboard.
- 12-16 Location / Replies / Elsewhere: passed. `47.37 N · 8.54 E · Zürich` (2 dp), `Usually within a few days`, GitHub (github.com/tlex-web) and LinkedIn links.
- 12-16 DOM order and responsive order: passed. The panel follows the form in the DOM, and its wrapper class is `order-first min-w-0 lg:order-none`. I did not check the visual order below 1024 px. That is a class-level observation only.

## 12-26 Validation
- 12-26 blur-then-live: passed. I typed `a` in Message and moved focus to Name. Message then had `aria-invalid="true"` and the inline error `Write at least 10 characters (now 1).` (it was briefly absent right after blur, then present).
- 12-26 counter: passed. `0 / 2,000` at load and `1 / 2,000` after typing.
- 12-26 error summary: passed. Submitting the invalid form focused a single `div[role=alert][tabindex=-1]` titled `Check 3 fields`, with links #name, #email, #message in that order.
- 12-26 nothing typed is cleared: needs_review (partial). After the invalid submit Message still held `a`, and Name and Email were empty as entered. A real-pointer click via the extension's ref click did not produce the summary. A JS `button.click()` did. This is probably a harness click-targeting issue, but a human should confirm with a real mouse click.

## Orchestrator note on needs_review row 3 (Send click)

Re-checked with real Playwright pointer clicks against the same build (scratchpad `send-click-probe.mjs`), chromium, firefox and webkit at 1440 x 900, three scenarios each: type one character in Message then click Send; type, Tab away, then click Send; click Send on the empty form. All nine runs opened the focused "Check 3 fields" summary, and no /api/feedback request was sent. The claude-in-chrome click miss is a tool artefact, not a regression of the 12-26 blur/click fix. (The second `role="alert"` on the page is Next's route announcer.)

Rows 1 (error pages not triggerable on demand) and 2 (Copy not clicked) remain covered by the 12-15 and 12-16 Jest suites.
