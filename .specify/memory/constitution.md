<!--
Sync Impact Report
- Version change: (template, unratified) → 1.0.0
- Modified principles: n/a (initial ratification)
- Added sections:
  - I. Next.js App Router & TypeScript (NON-NEGOTIABLE)
  - II. Component Standards
  - III. Styling with SCSS
  - IV. Data & State Management
  - V. Localization & Time Handling
  - VI. Quality Gates: Testing, Documentation, Linting
  - Technology Stack (Additional Constraints)
  - Development Workflow & Quality Gates
  - Governance
- Removed sections: none (all template placeholders replaced)
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (generic Constitution Check gate, no stack-specific edits needed)
  - ✅ .specify/templates/spec-template.md (tech-agnostic, no edits needed)
  - ✅ .specify/templates/tasks-template.md (tech-agnostic, no edits needed)
  - ✅ CLAUDE.md (no constitution-specific references present)
- Follow-up TODOs: none
-->

# ComeOnBaby Constitution

## Core Principles

### I. Next.js App Router & TypeScript (NON-NEGOTIABLE)

All application code MUST be written in TypeScript and MUST target Next.js 14
using the App Router (`app/` directory). Pages Router patterns MUST NOT be
introduced. Every new route, layout, and server/client component MUST have
explicit TypeScript types; `any` is prohibited except in isolated, clearly
commented interop shims.

**Rationale**: Next.js 14 App Router is the project's chosen routing and
rendering model. Mixing routers or falling back to untyped JS creates
inconsistent data-fetching semantics and erodes the type-safety guarantees
the rest of the codebase relies on.

### II. Component Standards

Components MUST be authored as function components; class components MUST
NOT be used. Component files and their exported component identifiers MUST
use PascalCase (e.g., `UserProfileCard.tsx` exporting `UserProfileCard`).
Each file MUST export one primary component.

**Rationale**: A single component paradigm and consistent naming keep the
codebase predictable and make companion files (styles, tests, Storybook
stories) unambiguous to locate.

### III. Styling with SCSS

All styling MUST be implemented with SCSS (Sass), using CSS Modules
(`*.module.scss`) scoped to their owning component. Inline `style` props and
CSS-in-JS libraries MUST NOT be introduced.

**Rationale**: A single styling system avoids specificity conflicts and
keeps the Sass compiler as the only styling toolchain dependency to
maintain.

### IV. Data & State Management

Server/remote data fetching and caching MUST use TanStack Query. All HTTP
calls MUST go through axios via a shared client; native `fetch` MUST NOT be
used for API calls. Global client-only state (state not owned by the
server) MUST use Zustand; local, component-scoped state MUST use React
state hooks instead of ad-hoc global stores.

**Rationale**: One server-state layer (TanStack Query) and one client-state
layer (Zustand) prevent divergent caching/invalidation logic and duplicate
sources of truth.

### V. Localization & Time Handling

All user-facing UI text MUST be Korean. All date/time display and
computation MUST be normalized to KST (Asia/Seoul) using `date-fns` (with a
timezone-aware helper where conversion is required). Raw `Date` arithmetic
or browser-locale-dependent formatting MUST NOT be used for user-facing
dates.

**Rationale**: The product serves a Korean-speaking audience, and
inconsistent timezone handling is a recurring source of off-by-one-day and
stale-cache bugs.

### VI. Quality Gates: Testing, Documentation, Linting

Every component and non-trivial utility/module MUST have Jest tests
covering its primary behavior before being considered done. Every
shared/reusable UI component MUST have a corresponding Storybook story.
ESLint (`eslint-config-next`) MUST run clean before merge; disabling a rule
requires an inline comment justifying why.

**Rationale**: These three gates are the project's baseline definition of
"done" — untested, undocumented, or unlinted code is not mergeable
regardless of feature completeness.

## Technology Stack

- **Framework**: Next.js 14 (App Router), TypeScript
- **Styling**: SCSS/Sass via CSS Modules
- **Data fetching**: TanStack Query, HTTP via axios
- **Client state**: Zustand
- **Date/time**: date-fns, normalized to KST (Asia/Seoul)
- **Testing**: Jest
- **Component documentation**: Storybook
- **Linting**: ESLint with `eslint-config-next`

Any deviation from this stack (a new library, an alternate styling system,
an alternate state manager, etc.) requires a constitution amendment; it MUST
NOT be introduced as a one-off PR decision.

## Development Workflow & Quality Gates

- PRs MUST pass ESLint and the Jest test suite in CI before merge.
- New or changed shared/reusable components MUST include or update their
  Storybook story in the same PR.
- Code review MUST verify adherence to Principles I–VI. Reviewers MUST
  block merges that introduce Pages Router files, non-SCSS styling,
  non-axios HTTP calls, non-Zustand global client state, or date handling
  that is not normalized to KST.

## Governance

This constitution supersedes ad-hoc conventions. Where existing code
conflicts with it, the constitution takes precedence and either the code or
the constitution (via amendment) must change.

Amendments require: a written description of the change and its rationale,
an update to this file, a version bump per semantic versioning (MAJOR:
backward-incompatible principle removal or redefinition; MINOR: a new
principle or materially expanded guidance; PATCH: clarification or wording
fixes), and a propagation check across `.specify/templates/*` and any agent
context files.

All PRs and code reviews MUST verify compliance with this constitution.
Unjustified complexity or deviation from the stated principles MUST be
flagged in review rather than merged silently. Use `CLAUDE.md` (repo root)
for day-to-day runtime development guidance that supplements, but does not
override, this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-07-18 | **Last Amended**: 2026-07-18
