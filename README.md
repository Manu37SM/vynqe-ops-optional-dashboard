# VynqeOps — Internal Dashboard

You just joined Vynqe. It's day one. No one has time to onboard you properly.

Someone built this internal ops dashboard last week before a client demo. It half-works. The data is real. The UI isn't. Your job is to make it usable.

Clone it. Own it. Ship it.

---

## The scenario

Vynqe tracks decisions and workflows across tools and teams. This dashboard is how the ops team monitors active client work — what's blocked, what's overdue, who owns what.

The previous dev got pulled onto something else. They left the codebase in a state that's "mostly working" — which in practice means several things are visually broken, a few things crash silently, and the data wiring is incomplete.

You have 4 hours.

---

## Getting started

```bash
git clone <repo-url>
cd vynqe-ops
git checkout -b your-name

npm install
npm run dev
```

Open `http://localhost:5173`. The app loads. Some cards show. Some crash. That's expected.

---

## The codebase

```
vynqe-ops/
├── public/
│   └── data.json          # 120+ workflows + activity log + users
├── src/
│   ├── App.jsx            # Root. Orchestrates layout. Read this first.
│   ├── main.jsx           # Entry point. Don't touch.
│   ├── styles/
│   │   └── global.css     # All styles. Dark design system.
│   ├── hooks/
│   │   └── useWorkflows.js  # Data fetching hook.
│   └── components/
│       ├── FilterBar.jsx    # Filter + search bar.
│       ├── WorkflowCard.jsx # Single card in the grid.
│       ├── DetailPanel.jsx  # Side panel (shell only).
│       └── ActivityFeed.jsx # Bottom feed (shell only).
└── DECISIONS.md           # You fill this in. Required.
```

Read `App.jsx` first. It tells you what's wired and what isn't.

---

## Watch out for

These are not bugs you need to fix. They're signals. The real world has messy data. Your job is to build UI that handles it gracefully.

- **Status casing**: Workflows have status values like "active", "ACTIVE", and "In Progress". The filter uses one but not the others.
- **Progress type mismatch**: Some workflows have progress as a string ("72"), some as a number, some as > 100, some as "N/A". The progress bar might break.
- **Timestamps in two formats**: Some dates are ISO strings, some are Unix epoch integers. Both need to work.
- **Null and missing fields**: Optional fields like assignee, due_date, and tags might be null instead of [] or {}.
- **Orphaned data**: The activity log has entries referencing workflows that don't exist. The workflow wf_999 is in the activity log but not in the workflows array.
- **Duplicate entries**: The activity log has exact duplicates. Same timestamp, same user, same action.
- **Inverted timestamps**: Some workflows have created_at > updated_at by weeks. That doesn't make sense but the data says it.
- **Type inconsistency**: Priority is sometimes a number (1, 2, 3) and sometimes a string ("urgent").

Don't obsess over these. Fix what breaks the UI. Leave the rest for DECISIONS.md.

---

## The tasks

Do them in order. Don't skip ahead with basics broken.

### Layer 1 — Fix what's broken

**T-01 — Fix broken responsive layout**

Below 768px the cards overflow instead of stacking. It's not one bug — it's two separate CSS issues that interact.

Look at `.workflow-grid` and `.topbar` in `global.css`. You'll find:
- One issue with grid layout that doesn't respond to viewport width
- One issue with a hardcoded max-width that prevents flexible sizing

Both need fixing. The grid needs to stack to 1 column on mobile. The container needs to use available width.

Hint: Search for "T-01" comments in the CSS to find exactly where.

**T-02 — Connect data to UI**

Right now the grid renders 3 hardcoded cards. `data.json` is being fetched (you can see it in Network tab), but the code ignores it completely.

Wire `data.workflows` to the grid. Replace HARDCODED_CARDS with real data.

But first: read through the data. Look at what we warned you about above. Some fields are null. Some are weird types. Some cards will crash your component if you don't handle them. That's intentional.

Start by just rendering the data. Then make it not crash on the edge cases.

**T-03 — Make filters work**

The filter buttons light up when you click them. They look responsive. But they do nothing. The data doesn't filter.

The issue is in `FilterBar.jsx`. Trace the flow:
1. You click a button
2. Local state updates (visual highlight)
3. But the parent (App.jsx) never gets told

Find where the callback should fire. Then figure out why it doesn't.

Advanced: Once you've wired the callbacks, test it. The filter still won't work on the first click. Why? Think about status casing.

**T-04 — Add loading and error states**

Right now if the fetch fails, the app goes blank silently. No error message. No loading indicator.

Start in `useWorkflows.js`. The hook needs to:
- Show loading = true while fetching
- Catch errors and set error state
- Reset loading = false when done (both success and error)

Then go to `App.jsx` and render the states. Show a loader while loading. Show an error message if something fails.

Advanced (T-04b): You might notice the loader loops infinitely on error. That's another bug. Hint: check the useEffect dependencies.

### Layer 2 — Build what's missing

**T-05 — Task detail side panel**

The shell exists. It's empty. Click a workflow card and nothing happens.

Build the detail panel. It should show:
- Workflow title and client name
- Current status (use the StatusBadge you'll build in T-07 once you extract it)
- Assignee (handle null)
- Due date (handle null)
- Progress bar
- History timeline (this is tricky — see below)
- Notes field (read-only is fine, or make it editable if you want)

The history is in workflow.history. It's an array of {timestamp, user, action}. Render them in reverse order (newest first). But timestamps are in two formats: ISO strings and Unix epochs. Handle both.

Also: some workflows have no history. Empty array. Don't break on that.

**T-06 — Activity feed**

The container is there at the bottom. It's empty.

`data.json` has an `activity_log` array. Render it. Newest first. For each entry show: timestamp, user name, action, workflow ID.

Gotchas:
- User might be null (anonymous entries). Show "Unknown" or "—".
- Action might be an empty string. Handle it.
- The activity log has duplicate entries. You can either dedupe them or just render them twice. Your call.
- Some entries reference workflows that don't exist in the main data (wf_999, etc). They're orphaned. You can skip them, or render them with a warning. Your call.
- Timestamps are in two formats: ISO strings and Unix epochs. Parse both.

**T-07 — Reusable status badge**

Status display logic is copy-pasted in 7 places across the codebase:
1. WorkflowCard.jsx — card header
2. DetailPanel.jsx — panel header
3. ActivityFeed.jsx — optional, for activity entries
4. Topbar count badges — custom color for each status
5-7. Other places you'll find with grep

Create a `StatusBadge` component that takes a status and returns a colored badge. Use it everywhere.

The challenge: the topbar count badges need slightly different rendering (color dot + label in a specific format). Make your component flexible enough to handle both.

Extraction is the skill here, not creativity. Don't obsess with perfection.

### Layer 3 — Go further

**T-08 — Make the workflow overview easier to act on**

That's the full requirement. You decide what it means.

Hint 1: Look at the data carefully. Each workflow has a `suggested_actions` array. It's not used anywhere.

Hint 2: Look for T-08 comments in the code. There's a hook-up point waiting for you.

You could add a panel showing suggested actions and let users take action. You could add quick-action buttons to cards. You could add a "what should I do with this?" indicator. The product is intentionally vague. That's the test.

What would you actually build?

**T-09 — Mock AI summary button**

The "Summarise today" button exists in the filter bar. Wire the onClick handler. Response can be completely mocked ("Here's a summary: all systems normal" or whatever). We're watching what you decide to show, not whether the summary is accurate.

Optional. Bonus points for thinking through UX here.

**T-10 — Write DECISIONS.md**

5 to 8 lines minimum. Required. 

Fill in the template. Be direct. Don't oversell. Tell us:
- What you completed
- What you skipped and why
- Bugs you found beyond the task list
- AI tools you used and how
- What you'd do differently with more time

This is where we learn how you think. Your code is one signal. Your judgment is another.

---

## What we're watching

- **Git commits.** Do you work in steps or dump everything at once?
- **Folder structure.** How you organise code tells us how you think.
- **Layer 1 complete.** Can you prioritise? Finish what matters first?
- **DECISIONS.md.** Self-awareness, communication, judgment under pressure.
- **AI tool usage.** Can you validate and own the output? We want honesty, not defensiveness.
- **T-08 response.** Product thinking. How do you handle ambiguity?
- **Data handling.** Did you just render data, or did you handle edge cases?
- **5-minute walkthrough.** Can you explain your decisions clearly?

---

## Ground rules

- **Basics first.** Layer 1 before Layer 2 before Layer 3. A working T-01 beats a half-built T-08.
- **Commit as you go.** After each task, commit. Clean messages. Example: `feat: wire data.json to workflow grid`
- **If something doesn't work, say so.** In DECISIONS.md. Knowing your limits is a skill.
- **Ask if unclear.** Be specific. "What should I do?" is not a question. "Should the empty action field in activity log be skipped or rendered?" is.
- **Work beats perfect.** Shipping something that works is better than shipping nothing because it wasn't perfect.

---

## Submitting

Push your branch before time is up. Don't wait until the last minute — push early and keep pushing.

Each candidate does a 5-minute walkthrough after. Show what you built. Explain your decisions. Tell us what you'd do differently with more time.

---

## A note on the data

`data.json` is intentionally messy. It came from a real data export. Not everything is clean or consistent. Some inconsistencies will break naive code. Some are just interesting.

You don't have to fix the data or make it perfect. Just make the UI survive it and work well anyway.

If you notice anomalies beyond what the tasks mention, note them in DECISIONS.md under "Bugs I found beyond the task list." That section is optional but it signals a lot.
