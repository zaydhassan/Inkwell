/* ─────────────────────────────────────────────────────────────────────
   About page — the story's building blocks, one import surface.

   About.js composes these in order; nothing here is used anywhere else in
   the app, so this barrel exists to keep the page's import block readable
   rather than to be a shared library.
   ───────────────────────────────────────────────────────────────────── */

export { Section, StepMark, NodeChip, AuthorTag, DiagramStage, useParallax } from "./shared";
export { default as ScrollProgress, CHAPTERS } from "./ScrollProgress";
export { default as EcosystemFlow } from "./EcosystemFlow";
export { default as OrbitDiagram } from "./OrbitDiagram";
export { default as ProblemLedger } from "./ProblemLedger";
export { default as SolutionWorkflow } from "./SolutionWorkflow";
export { default as AiComparison } from "./AiComparison";
export { default as AiFeatureGrid } from "./AiFeatureGrid";
export { default as WritingDemo } from "./WritingDemo";
export { default as WriterJourney } from "./WriterJourney";
export { default as ReaderJourney } from "./ReaderJourney";
export { default as CommunityDiagram } from "./CommunityDiagram";
export { default as ReadWriteEarn } from "./ReadWriteEarn";
export { default as AuthorshipTimeline } from "./AuthorshipTimeline";
export { default as FutureVision } from "./FutureVision";
export { default as ClosingCta } from "./ClosingCta";
export { Mock } from "./Mocks";
