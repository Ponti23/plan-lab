---
name: docs-style-guide
description: How workers write docs, guides and presentation pages so they read like Opus wrote them. Include in every writing brief.
---

# Docs and presentation style guide

Use this guide for any brief whose output is a document, guide, report, slide-style page or
HTML page meant for people. The user is often sending it to someone outside the project, such as
a friend or client. Read the whole guide before writing anything.

## 1. Before writing

- **Name the reader and the one job of the page.** Example: "A curious non-developer friend wants
  to know how big a 1-car garage and a master bedroom are, and why." Every section must serve that
  job. Cut anything that doesn't.
- **Collect facts first.** Read the sources the brief lists. Write down every number you plan to
  use, with its source. Never invent, round differently or "estimate" a number. If a source does
  not say something, the doc does not say it either.
- **Separate evidence from opinion.** Measured data, design rules and open questions get
  different words: "builders draw", "the tool uses", "nobody knows yet".

## 2. Structure

Order the content by what the reader needs first:

1. **Title and a short intro.** Say what this is, who it is for, and what units or terms are used.
2. **Quick answers.** Put the direct answers to the reader's actual questions near the top, often
   as a small table. Most readers stop here.
3. **How we know.** Explain the method in plain words, and define any term the reader may not
   know, with a concrete example. For p10 / median / p90, use "line up 100 rooms…".
4. **Details.** Use one consistent block per item, with the same labels in the same order each
   time (for example Typical / Range / Tool uses / Interesting fact).
5. **Gaps.** Say plainly what is unknown or has no data. Don't hide it.
6. **Summary table**, then **caveats**.

Headings describe their content ("Garage, two cars", not "Section 4"). Only number things that
really are a sequence.

## 3. Writing

- Write plainly, the way a knowledgeable friend talks. Use short sentences and active voice.
- Be specific: "0 of 205 double garages were narrower than 5.49 m" beats "garages are very
  consistent".
- **Every "interesting fact" needs a source.** Explaining why something happens is the most common
  place to invent things. If the source does not give the reason, leave it out.
- No internal jargon for outside readers: no file paths, ticket IDs, decision codes or code names.
  Describe them in words.
- Avoid these filler habits:
  - asides set off by em-dashes
  - "not X, but Y" framing
  - colon-then-reveal sentences
  - scare quotes
  - "worth noting", "it's important to", "honest caveat", "let's dive in"
  - emoji as section markers
- Superlatives ("the most", "the only", "always") must be checked against all of the data.
  If you can't check one, soften it ("one of the most").
- Keep units consistent and say them once (for example "short side × long side, in metres").
  Use the × sign.

## 4. Accessibility (required)

- **Never use colour alone to carry meaning.** The user is colour-blind. Status, strength and
  categories need a word label ("Strong", "Moderate", "None"). Colour can be added on top.
- Tables need header rows. Images and SVG diagrams need a text label or `aria-label`.

## 5. HTML pages (when the brief asks for a web page)

- **Format:** one self-contained `.html` file. Start with `<title>` and `<style>`, then the
  content. Leave out `<!doctype>`, `<html>`, `<head>` and `<body>`; the publisher wraps the page.
  Scripts may load only from cdnjs.cloudflare.com, and fonts only from Google Fonts. Inline
  everything else.
- **Title:** a short name of two to four words (for example "How Big Is a Room?"). Don't add an
  explanation after a dash or colon.
- **Design tokens:** first write a `:root` block with 4–6 colour tokens, plus font tokens for
  display, body and mono/data. Then use only those tokens in the rest of the CSS. Add a one-line
  comment above the tokens that names the layout idea.
- **Light and dark themes are both required.** Redefine the tokens under
  `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} }` and again under
  `:root[data-theme="dark"] {…}`. Set `color-scheme: dark` in both. `body` must set an explicit
  background from a token. Never write a literal colour in a component rule.
- **Ground the look in the subject.** Choose a palette and fonts that fit the topic. For
  floor-plan or architecture content, that could mean a drafting-paper look, dimensions set in
  mono like plan annotations, and a small drawing to scale.

  Avoid the generic AI looks:
  - cream background with a serif heading and a terracotta accent
  - purple-blue gradient hero
  - Inter everywhere
  - everything centred
  - rounded cards with shadows on every block
- **Typography:** pair a characterful display face (used sparingly) with a readable body face.
  Keep body text at most about 68 characters wide. Give headings `text-wrap: balance`. Give
  number columns `font-variant-numeric: tabular-nums`.
- **Layout:** use one centred column (max width about 860px) with at least 16px side padding.
  Space sections with grid or flex `gap`, not margins. The page must work at 400px wide with no
  horizontal page scroll. Wide tables go inside an `overflow-x: auto` wrapper.
- **Decoration by role:** borders, fills and an accent stripe should mark one element that needs
  to stand out (a key callout), not every block.
- **Diagrams:** draw them to a real scale and note the scale (for example "22 px = 1 m"), include
  a scale bar, and keep labels inside the viewBox and clear of shapes.
- **No print buttons, no download links and no forms that submit anywhere.** The page is
  complete when loaded, with nothing hidden behind scrolling animations.

## 6. Self-check before returning

1. Re-read every number against its source. List any you are unsure about in your reply.
2. Search your text for "most", "only", "always", "never", "usually" and "because". Make sure a
   source backs each one.
3. Check that no meaning depends on colour.
4. For HTML, check that the dark-theme blocks redefine every colour token, and that the page
   still works at 400px wide.
5. Reply with the file path, the section headings, and the list of uncertain numbers. Don't
   publish anything; Opus reviews and publishes.

## Opus's side (orchestrator)

- Briefs for writing tasks say: "Follow `knowledge/patterns/docs-style-guide.md`." They also
  name the reader, the sources, the one output file and any facts that must appear.
- Review is mandatory. Fact-check the numbers against the sources and hunt for invented reasons
  and unchecked superlatives; those are where DeepSeek went wrong on the room-size guide
  (2026-10-07). Fix them, then publish the Artifact (workers can't publish).
