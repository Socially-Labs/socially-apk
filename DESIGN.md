---
name: design-lessons
description: "Design standards for this repo, drawn from Fabricio Teixeira's 'Lessons of Design', Matthew Butterick's 'Practical Typography', and Maya Brennan's 'How to become an AI Designer'. Use when choosing type, setting text, reviewing UI for legibility, or deciding whether a component earns its place."
---

# Lessons of Design

> Three sources, deliberately unequal in authority.
>
> - **Part 1 — Fabricio Teixeira.** Canonical. On *thinking* about design.
> - **Part 2 — Matthew Butterick.** Canonical. On *setting type*, with numbers.
> - **Part 3 — Maya Brennan.** One practitioner's experience report, not doctrine.
>   Useful, and in places scale-dependent. Flagged where it matters.

Parts 1 and 3 are reproduced verbatim (gaps marked). Part 2 is paraphrased from
his rules with links. Part 4 is this repo, measured against all three.

## Overview

Design is a craft with three separate jobs that are easy to confuse:

| Job | Question | Source |
| --- | --- | --- |
| **Concepts** | What is this, and what does it refuse to be? | Teixeira |
| **Craft** | Is the text set correctly and legibly? | Butterick |
| **Practice** | How does a designer work now, and what does that cost? | Brennan |

Teixeira supplies the intent. Butterick supplies the measurable checks. Brennan
supplies the workflow — and the warning that the workflow can hollow out the other
two if you let it.

## When to Use

- Choosing or changing a font, type size, line height, or measure.
- Reviewing a screen for legibility before it ships.
- Deciding whether a new component earns its place (Teixeira: *simplicity is
  repeatedly saying no to almost everything*).
- When you catch yourself repeating a design mistake an agent has already made
  twice — that is the signal to update this file (Brennan: *"that's when it's time
  to update your SKILL.md file"*).

## Project Tokens

These are the source of truth. This document describes them; it does not override them.

| Concern | Where |
| --- | --- |
| Colours (light/dark) | `src/constants/theme.ts` → `Colors` |
| Auth panel colours, shadows, type sizes | `src/constants/theme.ts` → `AuthPanel` |
| Wallet surfaces, action colours, type sizes | `src/constants/theme.ts` → `WalletPalette` |
| Floating detail sheet surfaces and motion | `src/constants/theme.ts` → `DashboardSheetTheme` |
| Inter family names, weight map | `src/constants/fonts.ts` → `InterFont`, `InterWeightMap`, `interFamily()` |
| Spacing scale, max measure | `src/constants/theme.ts` → `Spacing`, `MaxContentWidth` |
| Type variants | `src/components/shared/ui/themed-text.tsx` |
| Web font stacks | `src/global.css` |

**Why every Inter weight is its own `fontFamily`.** SDK 57 cannot interpolate
weights inside a family (`useFonts` takes a flat record; the `FontFamilyDefinition`
and variable-font support landed in 58). So `Inter_700Bold.ttf` and
`Inter_400Regular.ttf` both declare family `Inter`, but SemiBold declares
`Inter SemiBold`. Consequence: to set a weight, set `fontFamily` to that weight's
name and leave `fontWeight` alone. Setting both is a no-op and can trigger
synthetic bolding on Android. Use `interFamily(600)` rather than hardcoding.

---

## Part 1 — Concepts

*Fabricio Teixeira. Reproduced verbatim from* ***Lessons of Design***.
*The source text supplied for this file is incomplete; gaps are marked rather than filled.*

### Prologue

*Fabricio Teixeira is a designer based in Brooklyn, NY. He's a design partner at
digital product agency Work & Co, and the founder of design publications UX
Collective and DOC.*

*He's not verified on Twitter.*

> After almost 20 years of doing the same thing over and over (i.e. designing
> digital products), I needed to stop for a second and put down on paper what it is
> that I find compelling about our craft.
>
> Why do I do what I do? What lessons have I learned by doing it? And why, after so
> many years, do I choose to continue to do it? My hope is that the lessons captured
> here inspire other designers taking a similar path.
>
> For many years I thought I was the one in the driver's seat. That I was the one
> creating the products. But after writing down these notes, I realized Design has
> shaped me in more ways than I could have imagined. Design has changed how I view
> the world, how I make decisions.

**I thought I was just another designer of products.**

**Turns out I am a product of design.**

---

### 01 — Find your conceptual models

> "Design needs to be plugged into human behavior. Design dissolves in behavior."
> —Naoto Fukasawa

*Wall Mounted CD Player by Naoto Fukasawa.*

**a** — Products that start with a conceptual model (a framework used to help people
know, understand, or simulate a subject the model represents) have bigger chances
of remaining consistent as new features are added. Once you have a strong framework
in place, it's easier to preserve the integrity of your product as it moves from
scratchpad into production.

When you're generating conceptual ideas, ignore what you think is possible. Your
brain will try to establish invisible limits to what you can or cannot do. Force
yourself to break every single one of those rules.

**b** — You're never bad at something, you're just new to it.

**c** — Pull your ideas apart. In order to truly validate your hypothesis, you need
to test your framework against others that are different enough to get meaningful
user feedback. Sometimes you need to exaggerate those differences in your designs
so they're visible to the untrained eye.

**d** — Whenever there is an argument between two ideas, find the third idea.

**e** — Suspend disbelief. The more you know about how digital products work and how
they are built, the faster you will try to come up with solutions that work and can
scale. Try the ideas that won't work first. Eventually, one of those unthinkable
ideas will work—and that will feel like magic.

**f** — Expand your references. Stop reading design blogs to learn about design (I
know of all people I shouldn't be the one saying that, but hey). Make a list of your
idols and find out who their idols are. Follow those folks. Hopefully none of them
are digital product designers.

**g** — Take breaks. The best ideas will come to you while you are out on a run,
brewing coffee, or any other time when your brain is not obsessing about work.

**h** — Find the ideas that scare you. Invite them over. Give them a try. Even if
they don't work: you will be less scared to try them next time.

**i** — Stop moving on autopilot. Pause. Breathe. Assimilate. Find meaning. Look at
the work you're doing through the lens of curiosity and awe.

**j** — **[text missing in source]**

---

### 02 — Simplicity is saying no

> "Simplicity does not mean want or poverty. It does not mean the absence of any
> decor, or absolute nudity. It only means that the decor should belong intimately
> to the design proper, and that anything foreign to it should be taken away."
> — Paul Jacques Grillo

*Form, Function & Design, by Paul Jacques Grillo.*

**a** — Train your eye to spot redundancy. Look around your screen, find elements
that are serving a similar purpose. Either pull them apart, group them closer
together, or simply merge them into one. That's how you move closer to simplicity.

**b** — Not everything needs to be visible at all times. The beauty of digital
products is that we can play with the axis of time; we can build interactions that
gradually and contextually reveal themselves to users. Don't try to show everything
that's in the requirements document on the same page. That's just bad design.

**c** — Simplicity is repeatedly saying no to almost everything.

**d** — You don't —ever— have to be rude when you say no. At work, and in life.

**e** — Antoine de Saint-Exupéry said that "perfection is achieved not when there is
nothing more to add, but when there is nothing left to take away". It's when you
reach that point—that exact iteration in your artboards—that you realize what the
product was meant to be all along. That feeling of completeness (not fullness or
abundance, but completeness) is the key that unlocks the door to a secret world.

**f** — Create space for the eyes to pause. Consuming visual information is a
choreography of the eye. You can dictate that rhythm by inserting the right pauses
and white space in your designs. The pixels you don't use are as important as the
ones you do.

*A compilation of creative graphic design works by Georg Olden for the American TV
channel CBS.*

> **[source text ends here — sections 03 onward were not supplied for this file]**

---

## Part 2 — Craft

*Matthew Butterick,* ***Practical Typography***. *Paraphrased from his rules, with
figures as published. Free and reader-supported at
[practicaltypography.com](https://practicaltypography.com/); buy him a coffee if it
was useful.*

His framing: **the quality of a document is decided by how the body text looks**,
because there is more body text than anything else. Start there.

### The four body-text decisions

| Decision | Butterick's range | Notes |
| --- | --- | --- |
| Point size | 10–12pt print · **15–25px web** | Not every font looks the same size at the same number. Adjust. |
| Line spacing | **120–145%** of point size | CSS `line-height`, prefer unitless (`1.3`, not `130%`). Default single is too tight; 1.5 is too loose. |
| Line length | **45–90 characters** | Or 2–3 lowercase alphabets. Measure with the word-count function, not by eye. |
| Font | A professional font | His actual argument is legibility at small sizes, not status. |

### Rules that apply here

- **Curly quotes, not straight ones.** Use real `’` and `“ ”`. This applies in code
  too — a string in a UI is prose.
- **One space between sentences.** Never multiple spaces or runs of whitespace
  characters.
- **Apostrophes point downward** (`’`). Foot and inch marks stay **straight** (`'`)
  — the one place a straight mark is correct.
- **Ellipses are one character** (`…`), not three periods.
- **Bold or italic, as little as possible. Never both.** If everything is
  emphasised, nothing is.
- **Never italicise a sans-serif.** See below — this repo is already correct.
- **All caps only for less than one line**, and only with **5–12% extra
  letterspacing**. Never a whole paragraph: caps flatten the varied contour of
  lowercase that lets the eye recognise words, so readers skim. If you want
  attention, use a heading, a larger size, or a rule.
- **Underlining is for links only.**
- **Centred text sparingly.** Fine for a lockup or a title; not for paragraphs.
- **Kerning on, always.**
- **No real small caps, no fake small caps.**
- **Never Times New Roman or Arial.** Avoid monospaced faces for prose (fine for
  code). Avoid goofy faces.
- **Ampersands sparingly**, except in proper names.
- **Proper `™` and `©`**, not `(TM)` or `(c)`.

### The sans-serif italic rule, specifically

> "If you're using a sans serif font, skip italic and use bold for emphasis. It's
> not usually worth italicizing sans serif fonts—unlike serif fonts, which look
> quite different when italicized, most sans serif italic fonts just have a gentle
> slant that doesn't stand out on the page."

**This repo already follows it.** `src/constants/fonts.ts` says: *"Italics are not
bundled — no screen renders them today."* Use `InterFont.medium`/`semiBold` for
emphasis instead. If italics ever become needed, that comment is the thing to
revisit first.

---

## Part 3 — Practice

*Maya Brennan,* ***How to become an AI Designer*** *(UX Collective, Aug 2026),
design lead at Amplitude + Statsig.*
[mayabrennan.io](https://www.mayabrennan.io/)

**Read the scale caveat.** Brennan's advice assumes a design lead inside an EPD org
with engineering partners, shared token budgets, and a frontend to own. This repo is
one person and one app. Her *workflow* transfers; her *org chart* does not.

Her five steps, briefly:

1. **Take a break from Figma.** Speed beat pixel-perfect prototypes on a team
   shipping multiple times a day.
2. **Vibecode interactive prototypes.** Lo-fi click-through HTML, shared daily,
   iterated in the open. Keep early wireframes *simple and visually unlike* the real
   design system — "getting a wireframe ninety percent of the way is exponentially
   easier than trying to get the last ten percent right."
3. **Find a new source of truth.** Her conclusion: *"Prod was the Source of Truth."*
   If you want the source of truth to be designed, ship code.
4. **Get access to the codebase.** Her framing of the real difference: *"AI for
   efficient design output versus AI for a better design output."*
5. **Own the frontend.** Not all of it — lead on frontend decisions, review
   frontend PRs, implement polish.

### Step 6 — the part that matters most

She ends conflicted, and it's the most useful thing in the piece:

> "My new AI-powered workflow has allowed me to build out beautiful, complex designs
> at a totally unprecedented speed and scale… But I must also acknowledge that it has
> come with an unprecedented detachment from my craft."

And on the question she can't answer:

> "You can optimize your workflow and 10x your output… But, **you cannot speed up
> creativity. You cannot simulate Taste.**"

That is the tension running through this whole file. Teixeira says *stop moving on
autopilot; pause, breathe, assimilate.* Brennan says prod is the source of truth.
Both are right, and they pull against each other on a bad week.

### Two rules worth lifting verbatim

> "If you find you are fixing the same issue in multiple PRs, **that's when it's time
> to update your SKILL.md file.**"

This file is that mechanism. When an agent gets a design detail wrong twice, the fix
belongs here rather than in a fresh prompt.

> "Communicate your reasoning behind design updates, **even if the reasoning is
> obvious.**"

Comments in the code, not just the diff. `fonts.ts` and `theme.ts` already model
this — their "why" blocks are longer than their code.

---

## Part 4 — Applied to this repo

Measured against Parts 1–3. Not a to-do list; a record of where we stand.

### Typography

| Check | Butterick | Here | |
| --- | --- | --- | --- |
| Body size | 15–25px | `default` = **16px** ✅ · `small`/`link` = 14px | 14 is just under; fine for secondary text, not body prose |
| Line height | 120–145% | 16/24 = **150%** · 14/20 = 143% | Slightly loose on `default`, within range on `small` |
| Measure | 45–90 chars | `MaxContentWidth = 800` ≈ 100+ chars | **Over.** Caps the tablet/web column too wide |
| Caps letterspacing | 5–12% | Auth field uses sentence case; no uppercase label | Reference uses an inline email field |
| | | `APP_NAME` 30px + `ls:4` = **13%** | Slightly over |
| Italic on sans | Never | Not bundled ✅ | Already correct |
| Kerning | On | default ✅ | React Native enables kerning; not disabled anywhere |

The auth panel uses `AuthPanel` tokens in `theme.ts`: 15px email input and primary
button, 26px verification code, 13px social labels, 14px errors, and 12px secondary
captions. The OR divider is 11px. The reference's quieter hierarchy is retained
with readable captions; `placeholder` is slate `#66758C`, with 4.5:1 contrast on
the light panel. The panel has 26px corners, 10px control corners, a translucent
white gradient, a slate primary button, and outlined Google, Apple, and X buttons.

### The free-font tension — unresolved, on purpose

Butterick: avoid free fonts, buy a professional one. **Inter is a free font.**

His stated reason is that a professional font carries a professional designer's
skills — and his own font, Concourse, is in that category, so treat the rule as
partly self-interested. The durable part of the argument is legibility at small
sizes, and that is precisely where this repo's text lives (12–26px in the auth panel).

The counter-argument, which this repo already embodies: Inter's per-weight naming
problem and the SDK 57 interpolation limits are documented at length in
`fonts.ts`. A designer who has documented *why* their type system works this way
has done the work Butterick is asking for. **This is a deliberate decision, not an
oversight.** Revisit if small-size legibility becomes a complaint.

### Complexity

- `shared/dashboard/dashboard-sheet.tsx` adapts the October 2 modal reference to
  the dashboard theme: 32px corners, 8px side insets, a grab handle, a centred
  title, and a quiet inset body surface. The panel rises as one surface with a
  360ms spring and slides out over 260ms. The native modal and its last visible
  content stay mounted through the exit. The handle supports downward dragging,
  with a short drag returning to rest. Reduced motion applies states instantly.
  All existing dashboard callers inherit the shared treatment. Measurements and
  platform adaptations are recorded in `docs/dashboard-sheet-motion.md`.

- `wallet.tsx` uses the voyage artwork, a 40px balance, translucent asset cards,
  and separate preview holdings. Its 18px title and 12px subtitle sit in the top
  header, aligned like the home greeting. Deposit and Withdraw share the Receive
  on Solana card, with a divider between its receiving row and the actions.
  `wallet-actions.tsx` adapts the reference Pay/Request expansion to Deposit and
  Withdraw: three pills, a reversible arrow-to-X morph, and brief
  label crossfades. Opening takes 380ms and closing 320ms. Reduced motion applies
  the final state immediately. Blur runs on web and Android 12+; iOS uses the
  same crossfade and scale without unsupported blur. Motion measurements and
  deliberate platform differences are recorded in `docs/wallet-motion.md`.

- `auth-screen.tsx` follows the user's October 1, 2026 screenshot: white arches,
  pale blue sea and sky, and a compact translucent bottom panel. The generated
  backdrop preserves the existing voyage composition; its color appears over
  the original during a 600ms crossfade. The form stays hidden until the splash
  finishes, then rises 64px with a clamped spring (damping 28, stiffness 240,
  mass 0.9). Controls follow on a single 520ms clock with 52ms stagger spacing
  and individually eased cubic Bézier curves `(0.22, 1, 0.36, 1)`.
  Email and verification share the field and button; 280ms layout transitions
  move these controls while headers and footers crossfade. Button labels have
  fixed space so loading text never changes their height. Press feedback uses
  2.5% compression and a spring return. Focus moves the background by 8px and
  scales it by 1.8%; scroll and sheet drag add smaller parallax. Only the top
  sheet edge accepts drag, with a velocity-aware spring return and downward
  keyboard dismissal. The keyboard opens on tap, and the verification field
  receives focus after an email code is sent. Small viewports can scroll.
  Reduced motion skips spatial movement, stagger, fades, and layout animation.
  The default policy destinations are `socially.trade/terms` and `/privacy`,
  with optional public environment overrides. Social buttons dispatch actual
  Privy OAuth flows; providers and allowed redirects must be configured in Privy.

- `src/app/_layout.tsx` gates the navigator behind font loading **without unmounting
  it**, and pins `collapsable={false}` on both wrappers. The simpler-looking
  versions of both are the ones that crash Android: returning `null` remounts
  `NativeTabs` and its fragments, and dropping `collapsable` lets Fabric flatten a
  wrapper and reparent the tabs. *Simplicity is repeatedly saying no* — the simplest
  version was also the broken one.
- `explore.tsx` is the Expo starter's demo content, untouched. It is the largest
  block of copy in the app and serves no product purpose. **Candidate for
  deletion** — Teixeira, *c*: not everything needs to be visible at all times.

### Accessibility — and the `collapsable` trap

`src/app/_layout.tsx` sets `collapsable={false}` on **both** wrapper `View`s, and
that is load-bearing, not boilerplate. Without it, Fabric is free to flatten a
`View` that has no reason to exist, which reparents `NativeTabs` underneath
Android's fragment manager. The reattachment can then throw
`[RNScreens] Unexpected fragment manager state`.

Note the trap in the other direction: the obvious "fix" of pinning
`importantForAccessibility` to a constant looks harmless and re-triggers exactly
this. Toggle the a11y prop, but keep both wrappers. If you add or remove a wrapper
`View` here, re-test on Android with the splash running.

### Corrections to make

| Fix | Where |
| --- | --- |
| Straight apostrophe in user-facing copy | `src/app/(app)/explore.tsx:106` → `&rsquo;` or `’` |
| `MaxContentWidth` 800 → ~600 | `src/constants/theme.ts`, if the measure complaint is real |
| Reduce `explore.tsx` or remove it | `src/app/(app)/explore.tsx` |

None are urgent. The apostrophe is the only outright error.

---

## Sources

**Canonical**

- Teixeira, F. *Lessons of Design.* [fabricio.com](https://fabricio.com) — reproduced
  in Part 1, verbatim, with gaps marked.
- Butterick, M. *Practical Typography*, 2nd ed.
  [practicaltypography.com](https://practicaltypography.com/) — free, reader-supported.
  Part 2 paraphrases his rules; figures as published.

**Practitioner report**

- Brennan, M. *How to become an AI Designer.* UX Collective, Aug 2026.
  [mayabrennan.io](https://www.mayabrennan.io/) — Part 3. One person's account.

**Cited by Brennan, worth reading**

- Wen, J. *The Design Process Is Dead.* [Lenny's Newsletter](https://www.lennysnewsletter.com/p/the-design-process-is-dead-heres-whats-replacing-it)
- Wattenberger, A. *Our Interfaces Have Lost Their Senses.* [wattenberger.com](https://wattenberger.com/thoughts/our-interfaces-have-lost-their-senses)
- Phamous, J. *Teaching Agents Product Design at Vercel.* [vercel.com](https://vercel.com/blog/teaching-agents-product-design-at-vercel)
- Krehel, J. *Details That Make Interfaces Feel Better.* [jakub.kr](https://jakub.kr/writing/details-that-make-interfaces-feel-better)
- Kowalski, E. *7 Practical Animation Tips.* [emilkowal.ski](https://emilkowal.ski/ui/7-practical-animation-tips)

## Keeping This Alive

When a design mistake shows up twice, fix it here. When a token changes, update
**Project Tokens** and re-check Part 4 — those numbers drift silently.

*Incentive, from Brennan: after the first PR that changes a visual detail on
purpose, the explanation stops being optional.*
