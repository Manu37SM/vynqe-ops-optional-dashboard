# DECISIONS.md

## What I completed

**T-01** — Fixed both CSS bugs: added `flex-wrap: wrap` to `.topbar`; replaced hardcoded `max-width: 1400px` on `.workflow-grid` with `width: 100%` and added `@media (max-width: 768px) { grid-template-columns: 1fr }` plus a 2-column breakpoint at 1024px.

**T-02** — Replaced `HARDCODED_CARDS` with `data.workflows`. Fixed all crash bugs in `WorkflowCard`: null assignee (`?.name ?? 'Unassigned'`), string progress `"72"` + `"N/A"` (NaN → 0) + over-100 value `143` (`Math.min(100, Math.max(0, Number(...) || 0))`), null tags (`?? []`), priority `"urgent"` or `0`/`null` (normalised via helper before CSS var lookup).

**T-03** — Removed local `activeLabel` from `FilterBar` that shadowed the parent prop. Now uses `activeFilter` prop for highlight, calls `onFilterChange(filter.value)` on click, wired `onSearchChange` on input. Fixed casing via `normaliseStatus()` in App.jsx — maps `'ACTIVE'` → `'active'`, `'In Progress'` → `'active'`, `'COMPLETED'` → `'completed'` so all status variants filter correctly.

**T-04** — `useWorkflows` now starts `loading = true`, uses async try/catch/finally, and `[]` dependency array (T-04b). Unmount guard with `cancelled` flag prevents state updates after teardown. App renders spinner during load, error screen with retry button on failure.

**T-05** — Full detail panel: title, client, status badge, priority (string "urgent" displayed as P1), progress (handles "N/A"), assignee (null-safe), due/created/updated dates, editable notes (resets on workflow change), suggested actions (T-08), history timeline (newest first, both timestamp formats, empty-safe).

**T-06** — Wired `ActivityFeed`. Key fix: `users` in data.json is a **keyed object** `{ usr_aisha: {name,…} }` not an array — accessed as `users?.[entry.user]?.name`. Deduplicates by `id`, sorts newest first, null user → 'Unknown', empty action → italic fallback, orphaned `workflow_id` → flagged with ⚠, Unix epoch → `* 1000`.

**T-07** — Created `StatusBadge` with `variant` prop (`'badge'` | `'topbar'`). Replaced all copy-pasted instances across WorkflowCard, DetailPanel, App topbar, SummaryModal. Exported `getStatusColour` for shared use. Added `normaliseStatus()` in App.jsx so `'In Progress'` and `'ACTIVE'` render with the correct colour.

**T-08** — Quick-action buttons (max 2) on each card with `stopPropagation`. Full action list with descriptions in detail panel. Actions dispatch a toast notification. One `ACTION_META` map covers both surfaces.

**T-09** — "Summarise today" opens `SummaryModal` after a 1.2s simulated delay (button disabled, shows "Summarising…"). Summary computes real numbers from live data: counts per status, overdue workflows, P1 items, recently updated. Modal closes on backdrop click or Escape.

**T-10** — This file.

## What I skipped and why

Nothing skipped. The optional Anthropic API call for T-09 was intentionally omitted — the task said mocked is fine, and a data-driven summary computed from real state is more meaningful than a static string.

## Bugs found beyond the task list

1. **`users` is an object, not an array.** The README describes it as "users" but `data.json` stores it as `{ usr_aisha: {name,…}, … }`. Iterating with `.forEach()` would silently fail. Fixed by direct keyed access `users?.[userId]?.name`.

2. **Priority `"urgent"` string and `0` / `null`.** Only 1, 2, 3 are valid for CSS vars. `var(--priority-urgent)` is undefined. Normalised via `normalisePriority()` before rendering.

3. **`progress: "N/A"` (`wf_153`).** `Number("N/A")` is `NaN`. `|| 0` guard catches it; shown as `—` in the UI instead of `NaN%`.

4. **`status: null` (`wf_157`).** `StatusBadge` and `normaliseStatus()` both guard with `if (!s) return …` so no crash and no filter match (only shown under 'all').

5. **`status: 'In Progress'` and `'ACTIVE'` casing.** Without `normaliseStatus()`, clicking the 'Active' filter would miss these workflows. Fixed with explicit normalisation before comparison.

6. **Inverted timestamps (`wf_016`, `wf_151`).** `created_at` is weeks after `updated_at`. No crash — both fields render independently. Noted here as a data quality anomaly.

7. **Progress bar `max-width` missing in original CSS.** `progress: 143` rendered a bar wider than its container even with `overflow: hidden`. Added `max-width: 100%` to `.progress-bar-fill`.

8. **`FilterBar` used `defaultValue` (uncontrolled input).** Made it `value={searchQuery}` (controlled) so the search can be cleared or reset from the parent.

9. **Topbar counts used `displayedWorkflows`.** When the 'Active' filter was on, blocked count showed 0. Changed to always count from the full `workflows` array.

## AI tools used

Claude AI — used to read and understand the full codebase in one pass, identify all intentional and unintentional bugs, and implement fixes. All outputs were verified against actual source files and data before writing. The `users` object shape bug was caught by running the real data through node before writing the fix.

## What I'd do differently with more time

- Add optimistic UI for actions (update card status locally immediately).
- Persist edited notes to `localStorage`.
- Keyboard navigation between cards (arrow keys), focus-trap in the detail panel.
- Extract `parseTimestamp` / `formatDate` into `src/utils/time.js` — duplicated across three files.
- Unit tests for the edge-case guards (null assignee, epoch timestamps, "N/A" progress, "urgent" priority, orphaned activity entries).
- Add a `'pending'` filter button — the data has `status: 'pending'` but there's no UI filter for it.
