// App.jsx
//
// T-02: displayedWorkflows from data.workflows (not HARDCODED_CARDS)
// T-03: filter + search fully wired; .toLowerCase() on both sides handles
//       'ACTIVE', 'COMPLETED', 'In Progress' casing variation in data
// T-04: loading spinner + error screen with retry
// T-07: topbar uses StatusBadge variant='topbar'
// T-08: onAction handler → toast
// T-09: SummaryModal with 1.2s simulated delay

import React, { useState, useMemo } from 'react'
import { useWorkflows } from './hooks/useWorkflows'
import FilterBar    from './components/FilterBar'
import WorkflowCard from './components/WorkflowCard'
import DetailPanel  from './components/DetailPanel'
import ActivityFeed from './components/ActivityFeed'
import StatusBadge  from './components/StatusBadge'
import SummaryModal from './components/SummaryModal'

// Status normalisation — 'ACTIVE' → 'active', 'In Progress' → 'active', etc.
// Keeps filter logic consistent with StatusBadge colour mapping
function normaliseStatus(s) {
  if (!s) return null
  const lower = s.toLowerCase()
  if (lower === 'in progress') return 'active'
  return lower
}

export default function App() {
  const { data, loading, error } = useWorkflows()

  const [activeFilter,     setActiveFilter]    = useState('all')
  const [searchQuery,      setSearchQuery]      = useState('')
  const [selectedWorkflow, setSelectedWorkflow] = useState(null)
  const [showSummary,      setShowSummary]      = useState(false)
  const [summarising,      setSummarising]      = useState(false)
  const [toast,            setToast]            = useState(null)

  // All derived state and useMemo hooks MUST come before any early returns.
  // React requires hooks to be called unconditionally on every render.
  const workflows   = data?.workflows ?? []
  // users is a keyed object { usr_aisha: {name, avatar, role}, … } — NOT an array
  const users       = data?.users ?? {}
  const workflowIds = useMemo(() => new Set(workflows.map(w => w.id)), [workflows])

  // T-02 + T-03: filter + search
  // Advanced casing: normaliseStatus() maps 'ACTIVE'/'In Progress' → 'active', etc.
  const displayedWorkflows = useMemo(() => {
    let result = workflows

    if (activeFilter !== 'all') {
      result = result.filter(w => normaliseStatus(w.status) === activeFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(w =>
        w.title?.toLowerCase().includes(q) ||
        w.client_name?.toLowerCase().includes(q) ||
        w.id?.toLowerCase().includes(q) ||
        (w.tags ?? []).some(t => t.toLowerCase().includes(q))
      )
    }

    return result
  }, [workflows, activeFilter, searchQuery])

  // Topbar counts: always from full dataset, normalised so 'ACTIVE' counts as 'active'
  const statusCounts = useMemo(() => {
    const counts = {}
    workflows.forEach(w => {
      const s = normaliseStatus(w.status) ?? 'unknown'
      counts[s] = (counts[s] ?? 0) + 1
    })
    return counts
  }, [workflows])

  // T-04: Early returns AFTER all hooks — Rules of Hooks requires this ordering
  if (loading) {
    return (
      <div className="state-fullscreen">
        <div className="loading-spinner" />
        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Loading workflows…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="state-fullscreen">
        <span style={{ color: 'var(--status-blocked)', fontSize: '22px' }}>⚠</span>
        <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>Failed to load data</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{error.message}</span>
        <button
          style={{ marginTop: 8, padding: '6px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

  // T-09: 1.2s simulated thinking delay before showing modal
  function handleSummarise() {
    if (summarising) return
    setSummarising(true)
    setTimeout(() => {
      setSummarising(false)
      setShowSummary(true)
    }, 1200)
  }

  // T-08: action handler — toast feedback
  function handleAction(workflow, actionKey) {
    const messages = {
      send_update:    `Update sent for "${workflow.title}"`,
      escalate:       `"${workflow.title}" escalated`,
      request_review: `Review requested for "${workflow.title}"`,
      mark_blocked:   `"${workflow.title}" marked as blocked`,
      assign_owner:   `Assign owner — coming soon`,
      close:          `"${workflow.title}" closed`,
    }
    setToast(messages[actionKey] ?? `Action "${actionKey}" triggered`)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="app-shell">

      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="topbar-logo">vynqe<span>ops</span></div>

        {/* T-07: StatusBadge variant='topbar' replaces copy-pasted inline logic */}
        <div style={{ display: 'flex', gap: '16px', marginLeft: '24px' }}>
          {['active', 'blocked', 'review'].map(s => (
            <StatusBadge key={s} status={s} variant="topbar" count={statusCounts[s] ?? 0} />
          ))}
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
          {workflows.length} workflows
          {displayedWorkflows.length !== workflows.length && ` · ${displayedWorkflows.length} shown`}
        </div>
      </header>

      {/* ── Filter bar ── */}
      <FilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSummarise={handleSummarise}
        summarising={summarising}
      />

      {/* ── Main body ── */}
      <div className="main-body">
        <div className="content-area">

          {/* Workflow grid — T-02: real data */}
          <div className="workflow-grid-container">
            {displayedWorkflows.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', paddingTop: '40px', textAlign: 'center' }}>
                No workflows match this filter.
              </div>
            ) : (
              <div className="workflow-grid">
                {displayedWorkflows.map(workflow => (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    isSelected={selectedWorkflow?.id === workflow.id}
                    onClick={setSelectedWorkflow}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </div>

          {/* T-06: Activity feed — users passed as object (not array) */}
          <ActivityFeed
            activityLog={data?.activity_log}
            users={users}
            workflowIds={workflowIds}
          />
        </div>

        {/* T-05: Detail panel */}
        <DetailPanel
          workflow={selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
          onAction={handleAction}
        />
      </div>

      {/* T-09: Summary modal */}
      {showSummary && (
        <SummaryModal
          workflows={workflows}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* T-08: Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)', padding: '10px 20px',
          fontSize: '12px', color: 'var(--text-primary)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          zIndex: 999, whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
