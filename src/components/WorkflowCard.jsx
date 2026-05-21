// WorkflowCard.jsx — T-02 / T-07 / T-08
//
// Fixes:
//   T-02: null assignee  → assignee?.name ?? 'Unassigned'
//   T-02: string/NaN/over-100 progress → Math.min(100, Math.max(0, Number(...) || 0))
//   T-02: null tags → (tags ?? []).map(...)
//   T-02: priority can be 0, "urgent", or null → normalise before CSS var lookup
//   T-07: StatusBadge replaces inline status colour logic
//   T-08: suggested_actions as quick-action buttons

import React from 'react'
import StatusBadge from './StatusBadge'

const ACTION_META = {
  send_update:    { label: 'Send update',    icon: '→' },
  escalate:       { label: 'Escalate',       icon: '⚠' },
  request_review: { label: 'Request review', icon: '◎' },
  mark_blocked:   { label: 'Mark blocked',   icon: '✕' },
  assign_owner:   { label: 'Assign owner',   icon: '+' },
  close:          { label: 'Close',          icon: '✓' },
}

// Normalise priority to a valid CSS variable index (1 | 2 | 3) or null
function normalisePriority(p) {
  if (p === 1 || p === 2 || p === 3) return p
  if (p === 'urgent') return 1     // treat "urgent" as P1
  return null                      // 0, null, anything else → no badge
}

function formatDate(ts) {
  if (!ts) return '—'
  try {
    const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  } catch {
    return '—'
  }
}

export default function WorkflowCard({ workflow, isSelected, onClick, onAction }) {
  // T-02: null assignee guard
  const assigneeName   = workflow.assignee?.name   ?? 'Unassigned'
  const assigneeAvatar = workflow.assignee?.avatar  ?? '?'

  // T-02: clamp progress; handles "72" (string), "N/A" (NaN → 0), 143 (>100)
  const progressVal = Math.min(100, Math.max(0, Number(workflow.progress) || 0))

  // T-02: null tags guard
  const tags = workflow.tags ?? []

  // T-02: priority normalised — only render badge for valid P1/P2/P3
  const priority = normalisePriority(workflow.priority)

  // T-08: up to 2 quick-action buttons
  const actions = (workflow.suggested_actions ?? []).slice(0, 2)

  return (
    <div
      className={`workflow-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(workflow)}
    >
      {/* Header: ID + status badge */}
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="card-id">{workflow.id}</span>
          {priority && (
            <span style={{ fontSize: '9px', color: `var(--priority-${priority})`, letterSpacing: '0.3px' }}>
              P{priority}
            </span>
          )}
        </div>
        {/* T-07: StatusBadge */}
        <StatusBadge status={workflow.status} />
      </div>

      {/* Title + client */}
      <div>
        <div className="card-title">{workflow.title}</div>
        <div className="card-client">{workflow.client_name}</div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${progressVal}%` }} />
      </div>

      {/* Assignee + progress number */}
      <div className="card-meta">
        <div className="card-assignee">
          <div className="avatar">{assigneeAvatar}</div>
          {assigneeName}
        </div>
        <span className="muted" style={{ fontSize: '10px' }}>
          {/* Show original value if it wasn't a clean number */}
          {workflow.progress === 'N/A' || workflow.progress == null
            ? '—'
            : `${progressVal}%`}
        </span>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="tags">
          {tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}

      {/* T-08: Quick-action buttons — stopPropagation so card doesn't also select */}
      {actions.length > 0 && (
        <div className="card-actions" onClick={e => e.stopPropagation()}>
          {actions.map(actionKey => {
            const meta = ACTION_META[actionKey] ?? { label: actionKey, icon: '·' }
            return (
              <button
                key={actionKey}
                className="card-action-btn"
                onClick={() => onAction?.(workflow, actionKey)}
                title={meta.label}
              >
                {meta.icon} {meta.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Footer: last updated */}
      <div className="card-footer">
        <span className="card-updated">updated {formatDate(workflow.updated_at)}</span>
      </div>
    </div>
  )
}
