# Paw Promise UI design specification

**Project:** Paw Promise by Leo Club of Tholangamuwa

**Status:** Implemented design contract through Milestone 5 and current
Milestone 6 public-interface work

**Last aligned:** 2026-11-08

This document describes the interface that exists now and the rules future work
must follow. `TECHNICAL_SPEC.md` remains the source of truth for architecture,
data models, privacy, and permissions. Visual design must never imply a feature
or status that the data model does not support.

## 1. Product experience

Paw Promise is a community record of care for local stray and community pups.
It is not an adoption marketplace, veterinary system, social network, or generic
SaaS dashboard.

The experience should feel:

- warm, local, respectful, and trustworthy;
- editorial and photography-led on public pages;
- calm, direct, and information-rich in the authenticated workspace;
- designed for real field use on mobile devices;
- accountable about who recorded information and what is publicly visible.

The interface should look intentionally composed by a product design team. Avoid
visual devices commonly associated with generic generated templates.

## 2. Brand and visual system

### Typography

- Primary typeface: **DM Sans** through `next/font`.
- Use sentence case for headings and controls.
- Headings use tight but readable tracking and a strong editorial hierarchy.
- Body text must retain comfortable line height, particularly on mobile.
- Do not use oversized statistics or headings that displace useful content.

### Colour tokens

The implemented tokens are defined in `src/app/globals.css`:

| Token | Value | Use |
| --- | --- | --- |
| `--ivory` | `#f8f1e7` | Page background |
| `--paper` | `#fffaf4` | Forms, cards, drawers, and raised surfaces |
| `--primary` | `#d66f45` | Primary actions, icons, active states |
| `--primary-hover` | `#b95532` | Hover states and stronger terracotta text |
| `--primary-soft` | `#f4d2bc` | Selected and supporting surfaces |
| `--primary-soft-strong` | `#e8b899` | Stronger accent and selection |
| `--cocoa` | `#342a25` | Warm dark supporting text |
| `--charcoal` | `#2c2925` | Primary typography |
| `--muted` | `#756b62` | Secondary text |
| `--line` | `#e7d8cb` | Subtle borders and dividers |
| `--amber` | `#bd7a32` | Warning and pending emphasis |

Legacy `--forest` and `--sage` variables are compatibility aliases only. New UI
must use the warm terracotta identity and should not reintroduce green as the
primary brand colour.

### Surfaces, borders, and shape

- Use warm ivory page backgrounds and paper surfaces.
- Prefer layout, spacing, and dividers over wrapping every section in a card.
- Standard surface radius is approximately 10-14px.
- Shadows are restrained and only clarify hierarchy; public cards should not
  float upward or scale on hover.
- Use thin warm borders. Do not use glassmorphism or translucent floating panels.
- Gradients are exceptional and must not be used as decoration by default.

### Photography and icons

- Use real Paw photography with consistent `object-cover` crops.
- Never imply that illustrative photography represents a real record.
- Do not use generic AI illustrations in place of real animal photography.
- Use Lucide icons consistently. Icons support labels and should not become
  decorative noise.

## 3. Language and naming

- Public-facing language prefers **Paw**, **Paws**, and **Pups** over “dog” where
  it reads naturally: “Paw directory”, “Introduce a pup”, “Paw profile”.
- Technical schema names such as `dogs`, `dog_events`, and `dog_code` remain
  unchanged for compatibility.
- Permanent public identifiers use `PP-000001` formatting and are labelled
  **Paw ID** when clarification is necessary.
- If a record has no non-whitespace name, its formatted Paw ID is the display
  name everywhere. This is a presentation fallback only; do not persist the Paw
  ID into the nullable `name` field.
- Unknown and unavailable information is valid. Use “Unknown”, “Not provided”,
  or another honest label rather than forcing users to guess.
- Observations must never be written as unverified veterinary diagnoses.

## 4. Responsive layout rules

### Mobile first

- Support a minimum viewport width of 320 CSS pixels without horizontal scroll
  or clipped controls.
- Default to one column. Add columns only when the content benefits from them.
- Workspace page padding is compact on phones and increases at `sm` and `lg`.
- Interactive targets should be at least 40-44px where practical.
- Primary actions are full-width on narrow screens when that improves reach and
  clarity.
- Native date, file, select, and number controls must use `min-w-0`, `max-w-full`,
  and responsive parent grids so browser intrinsic widths cannot overflow.
- Long identifiers, coordinates, filenames, and locality labels must wrap or
  truncate deliberately.

### Desktop

- Public content uses a centred editorial canvas with controlled line lengths.
- Directory filters may occupy a stable left column while results use a
  responsive grid.
- Profiles may use a photography/details split followed by a wide care-history
  section.
- Workspace pages favour clear tables, lists, and forms over oversized dashboard
  metrics.

### Navigation

- Public navigation provides Home, Meet the pups, About, and How it works.
- Signed-out users see Sign in and Join the community.
- Signed-in users retain their browser session and see Workspace and Sign out.
- Workspace navigation becomes a semantic off-canvas drawer on mobile.
- Drawer and filter backdrops are real buttons with accessible labels and
  keyboard behavior; do not attach click handlers to non-interactive containers.

## 5. Public experience

### Homepage

- The homepage is a static editorial introduction. It must not query or feature
  live Paw records.
- It should explain the shared care-history purpose, how the platform works, and
  guide people to the directory or membership.
- Keep sections visually grounded rather than layering floating cards or badges.
- Use warm, restrained imagery and Paw Promise-specific copy.

### Paw directory

- Start with a concise editorial heading, search, result count, and filters.
- Search supports name, Paw ID, breed, and locality.
- Desktop filters remain visible in a left column; mobile filters use an
  accessible right-side drawer.
- Paw cards use a flat bordered structure:
  1. large photograph;
  2. Paw ID as quiet metadata;
  3. display name;
  4. breed and estimated age;
  5. approximate locality;
  6. care-update count and most recent update date.
- The whole card is the link. Do not add a redundant floating arrow, pill, or
  “Open profile” control.
- Empty results explain how to clear filters and return to all published Paws.

### Public Paw profile

- Use a flat editorial layout with a large primary photograph and a clear facts
  column on desktop, stacked on mobile.
- Show only published, public-safe fields and approved public photography.
- Public location is an approximate locality only.
- The care history is chronological and easy to scan. Event type, title, date,
  description, and public locality should have consistent hierarchy.
- Private evidence, participant identities, contributor details, and exact
  coordinates must never appear in public UI or public queries.
- Signed-in users may be offered the authenticated “Add a care update” action.

### About

- Explain the Leo Club stewardship model, the purpose of accountable history,
  and the boundary between community observation and professional care.
- Avoid invented impact statistics or unsupported claims.

## 6. Authentication and session experience

- Authentication pages use the same warm visual system and plain-language copy.
- Registration never exposes role selection.
- Email verification, callback, password recovery, and reset flows need explicit
  success, error, and next-step states.
- Public browsing and page refreshes must preserve a valid Supabase session.
- Signed-in public headers should link back to Workspace and provide Sign out.
- Suspended or unavailable accounts receive a clear dedicated state rather than
  leaking protected content or failing without explanation.

## 7. Authenticated workspace

### Dashboard and Paw management

- Prioritise actionable work: introduced Paws, recent activity, follow-ups, and
  moderation items appropriate to the current role.
- Use compact lists and status badges rather than oversized statistics.
- Paw management must distinguish Pending, Published, Rejected, and Archived
  records without inventing care/adoption statuses absent from the schema.
- Archived records remain reviewable by authorised staff and preserve permanent
  IDs and history.

### Paw registration wizard

- Mobile field use is the primary design target.
- Break the workflow into understandable steps: identification and photograph,
  discovery location, people present, observed condition, and review.
- Exact discovery location is required and can be selected on the map or from
  device location.
- Photo uploads provide selection, upload, success, and retry feedback.
- Optional fields and unknown values must be clearly marked.
- Review copy explains that a missing name will display as the assigned Paw ID
  after submission.
- Submission creates a Pending profile for independent moderation.

### Care update flow

- Use one clear, vertically ordered form with type-specific fields.
- Supported types are feeding, sighting, health observation, veterinary visit,
  vaccination, sterilisation, rescue, and general update.
- On mobile:
  - all fields stay within the viewport;
  - date and visibility stack;
  - feeding quantity and unit use a safe narrow grid;
  - location actions stack when space is limited;
  - the map uses a shorter mobile height;
  - file upload controls and filenames cannot force overflow;
  - the final submit action spans the available width.
- Explain that exact points are restricted and evidence remains private.
- Participant names are optional and permission-sensitive.
- Reinforce the append-only history model before submission.
- Success returns a clear route to the Paw timeline; expected failures remain
  inline and preserve user context.

### Member-only location map

- Active Members, Moderators, and Super Admins may view exact discovery and care
  event points for a Paw.
- Signed-out users and suspended accounts cannot access exact points.
- Each recorded point connects to its event and timestamp.
- Leaflet and OpenStreetMap-compatible tiles are the current implementation.
- Map controls must support touch, pointer, and keyboard-accessible surrounding
  actions. Coordinates and accuracy text must wrap safely on mobile.

### Follow-ups and activity

- Event history is chronological, attributable, and easy to scan.
- Follow-ups clearly communicate owner, due date, overdue state, and status.
- Empty states explain what action creates the first item.
- Expected action errors and success messages appear inline.

## 8. Moderation and administration

- Moderation queues prioritise photograph, Paw identity, approximate locality,
  submitter, submission time, and review actions.
- Publish, reject, and request-changes actions need distinct intent and clear
  feedback. Rejection and change requests require actionable notes.
- Moderators cannot approve their own Paw submissions.
- User administration is Super Admin-only for role changes; server enforcement
  is required regardless of visible navigation.
- Archival is recoverable, audited, and available to Moderators and Super Admins
  under the defined rules. Restoration is Super Admin-only and returns the Paw
  to independent pending review.
- Super Admin actions do not require a second approver.
- Audit history is a functional record, not a decorative activity feed.

## 9. Shared component behavior

Reuse established components rather than redesigning each page independently:

- `PublicHeader`, `PublicFooter`, and `WorkspaceShell` for page structure;
- `Button` and `ButtonLink` for consistent actions;
- `StatusBadge` for schema-backed states;
- `DogCard` for public Paw summaries;
- `LocationPicker` and Paw location-history components for maps;
- action-feedback forms for pending, success, and expected-error handling.

Shared behavior requirements:

- Loading states reserve useful space and explain what is loading.
- Empty states explain why the list is empty and what to do next.
- Error states use plain language, preserve privacy, and offer a safe retry.
- Success states confirm what was saved and provide the next relevant action.
- Destructive or archival actions require explicit intent, reason, and feedback.

## 10. Accessibility

- Use semantic headings in logical order.
- Use native buttons, links, labels, fieldsets, legends, outputs, and form controls
  before adding ARIA roles.
- Every form control needs an accessible label and every icon-only action needs
  an `aria-label`.
- All interactions must work with keyboard and touch input.
- Maintain visible focus styling and adequate colour contrast.
- Do not rely on colour alone to communicate status.
- Images require meaningful alt text unless they are deliberately decorative.
- Dynamic messages use appropriate live regions or semantic output elements.
- Respect reduced-motion preferences when adding future animation.

## 11. Patterns to avoid

- Green as the primary identity colour.
- Glassmorphism, decorative blobs, and excessive gradients.
- Floating cards, floating metadata pills, or unnecessary arrows.
- Excessively rounded containers and heavy shadows.
- Generic AI illustrations or inconsistent icon systems.
- Huge dashboard numbers without operational value.
- Hardcoded Paw records, featured flags, follows, adoption status, treatment
  status, or any other concept absent from the current schema.
- Public exact-location maps or language implying precise coordinates are public.
- Client-only permission checks.
- Mobile layouts that depend on `overflow-x: hidden` to conceal broken controls.

## 12. Verification checklist

For UI changes, verify at minimum:

- 320px, 375px, and 430px mobile widths;
- tablet and desktop layouts;
- no horizontal overflow or clipped native controls;
- public signed-out and signed-in headers;
- loading, empty, error, and success states affected by the change;
- keyboard navigation and visible focus;
- approximate versus exact location visibility;
- missing-name fallback to formatted Paw ID;
- no unsupported statuses or hardcoded records;
- TypeScript, ESLint, unit tests, and production build;
- SonarQube Cloud new-code Security and Reliability ratings remain A and
  duplication stays within the configured gate.

Do not trade accessibility, permission integrity, or responsive behavior for a
visual effect.
