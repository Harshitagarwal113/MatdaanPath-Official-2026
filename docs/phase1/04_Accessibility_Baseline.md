# Phase 1: Accessibility Baseline

Accessibility is a non-negotiable PRD requirement, especially for a civic tech application. All Phase 2 UI development must pass these criteria.

## 1. Keyboard Navigation
- Every interactive element (buttons, links, form fields, timeline cards) must be focusable using the `Tab` key.
- Focus states must be highly visible (e.g., a thick outline, not just browser defaults).
- Users must be able to complete the core flows entirely without a mouse.

## 2. Screen Reader Support
- Semantic HTML tags (`<nav>`, `<main>`, `<article>`, `<section>`, `<h1>`-`<h6>`) must be used correctly.
- All images, icons, and non-text elements must have descriptive `alt` tags or `aria-label` attributes.
- Interactive custom elements (like the chat assistant) must use `aria-live` regions to announce new messages to screen readers.

## 3. Visual Accessibility
- **Color Contrast:** Text and interactive elements must meet WCAG 2.1 AA standards (contrast ratio of at least 4.5:1 for normal text).
- **Text Scaling:** The UI must support browser-level zooming up to 200% without breaking the layout or hiding text.
- **Color Reliance:** Information must not be conveyed by color alone (e.g., do not just use red for an error, use an icon and text).

## 4. Cognitive Accessibility
- Use plain language. Break complex paragraphs into bulleted lists.
- Avoid timed interactions.
- Provide clear error messages that explain exactly how to fix the problem.

## Future Phases
- Text-to-Speech (reading answers aloud) and Voice Input.
- Multi-language support (Hindi and regional languages).
