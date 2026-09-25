# Changelog frontend

The existing dark-and-green identity is refined into a quiet writing workspace for developers. Product copy stays in English. The landing page explains the transformation from commits to release notes; the app prioritizes repository selection, a focused draft, and easy export.

## Visual system

- Canvas `#0d1110`; document surface `#121915`; raised selection `#1c2520`.
- Primary text `#edf2ef`; secondary text `#9eada4`; mint accent `#a6ebbc` with dark text `#102318`.
- Borders `#29332e`; field borders `#39463e`; error text `#f3a8a5`.
- Geist Variable for interface and display; Geist Mono Variable only for repository identifiers, branches, hashes, and Markdown. Both are bundled locally through Fontsource.
- Controls have 8px corners, document surfaces 14px. Primary interactive targets are at least 44px; compact auxiliary controls are 36px.
- Landing container: 1440px. App container: 1280px. Mobile page gutter: 20px.
- Keep the existing Lucide icon family. Use thin, consistent strokes and accessible names for icon-only controls.

## Motion

- One introductory sequence explains the relationship between the commit strip and the document. It plays once, without decorative loops.
- Navigation and segmented controls use Motion shared-layout transitions, with no spring bounce.
- Tab content and history details crossfade in 200ms or less. Routine navigation never waits for an exit animation.
- CSS handles button feedback. Hover movement is restricted to devices with a fine pointer.
- MotionConfig follows the operating system's reduced-motion setting. The CSS media query disables movement, shimmer, and smooth scrolling for that preference.
- Motion documentation: https://motion.dev/docs/react-accessibility and https://motion.dev/docs/react-layout-animations.

## Content and states

Controls name their actions. Empty states explain the next step, and errors explain recovery. Never claim a draft is saved based only on the current backend's completion event. The landing example is visibly labeled as an example, never as customer data.

The app supports repository filtering, source commit inspection, preview/Markdown switching, clipboard format selection, downloads, history filtering, and explicit deletion confirmation. Changing generation filters invalidates previously loaded commits. A generated draft retains the repository name it was generated for.

## Skill application

Design-taste-frontend, redesign-existing-projects, impeccable, and emil-design-eng guide refinement, hierarchy, interaction, copy, and accessibility. Framer Motion core/layout/scroll guidance informs the animation strategy; no scroll hijacking or unnecessary parallax is added to a writing tool. Next.js, React best practices, agent-browser, and browser verification guide implementation and checks.

Image-to-code, imagegen-frontend-web, and imagegen were used to produce three separate preview references: landing hero, workflow section, and generator workspace. The references informed spacing, typography, composition, and component proportions; the shipped interface is real HTML, CSS, and React. They are preview artifacts, not runtime image dependencies.

The high-end, minimalist, industrial, brand, GSAP, mobile-image, and Stitch skills were considered where relevant. Their conflicting visual prescriptions are not combined: the existing web product remains dark, green, and task-oriented. No native mobile app, new brand kit, GSAP dependency, Stitch project, or unrelated design-system migration is introduced.

## Scope

This pass changes the frontend presentation and related UI state handling. Backend authentication, persistence guarantees, database policy changes, and dependency security upgrades remain tracked in the repository audit. Verify backend integration separately before release.
