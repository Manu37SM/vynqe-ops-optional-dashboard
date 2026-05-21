// DetailPanel.jsx — T-05, T-07, T-08
//
// Full detail panel:
//   - Title, client, ID, status badge (T-07), priority (normalised)
//   - Assignee (null-safe), due date (null-safe), created/updated
//   - Progress bar (clamped, handles "N/A" / string / >100)
//   - Tags
//   - Suggested actions panel (T-08)
//   - Editable notes (syncs when different workflow selected)
//   - History timeline: newest first, ISO + Unix epoch, empty-safe
//
// README edge cases handled:
//   - priority "urgent" → displayed as P1
//   - priority 0 / null → no priority badge
//   - progress "N/A"   → shows — instead of NaN%
//   - inverted timestamps (created > updated) → just renders as-is, no crash

import React, { useState, useEffect } from 'react'
import StatusBadge from './StatusBadge'

function parseTimestamp(ts) {
  if (!ts) return null
  if (typeof ts === 'number') return new Date(ts * 1000)
  return new Date(ts)
}

function formatDate(ts) {
  const d = parseTimestamp(ts)
  if (!d || isNaN(d)) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(ts) {
  const d = parseTimestamp(ts)
  if (!d || isNaN(d)) return '—'
  return (
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
    ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
}

function relativeTime(ts) {
  const d = parseTimestamp(ts)
  if (!d || isNaN(d)) return '—'
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days === 0)  return 'today'
  if (days === 1)  return 'yesterday'
  if (days < 7)   return `${days}d ago`
  return formatDate(ts)
}

// Normalise priority to 1/2/3 for CSS var, or null
function normalisePriority(p) {
  if (p === 1 || p === 2 || p === 3) return p
  if (p === 'urgent') return 1
  return null
}

const ACTION_META = {
  send_update:    { label: 'Send update',    icon: '→', desc: 'Notify client of progress' },
  escalate:       { label: 'Escalate',       icon: '⚠', desc: 'Flag for senior review' },
  request_review: { label: 'Request review', icon: '◎', desc: 'Ask team to review' },
  mark_blocked:   { label: 'Mark blocked',   icon: '✕', desc: 'Flag as blocked' },
  assign_owner:   { label: 'Assign owner',   icon: '+', desc: 'Assign to someone' },
  close:          { label: 'Close workflow', icon: '✓', desc: 'Mark as completed' },
}

export default function DetailPanel({ workflow, onClose, onAction }) {
  const [notes, setNotes] = useState('')

  // Sync notes textarea when a different workflow is selected
  useEffect(() => {
    setNotes(workflow?.notes ?? '')
  }, [workflow?.id])

  if (!workflow) {
    return (
      <div className="detail-panel">
        <div className="detail-panel-empty">
          Select a workflow<br />to see details
        </div>
      </div>
    )
  }

  // Progress: clamp and handle "N/A" / null
  const rawProgress    = workflow.progress
  const progressNum    = Number(rawProgress)
  const progressValid  = rawProgress != null && rawProgress !== 'N/A' && !isNaN(progressNum)
  const progressVal    = progressValid ? Math.min(100, Math.max(0, progressNum)) : 0
  const progressLabel  = progressValid ? `${progressVal}%` : '—'

  const assigneeName   = workflow.assignee?.name   ?? 'Unassigned'
  const assigneeAvatar = workflow.assignee?.avatar  ?? '?'
  const priority       = normalisePriority(workflow.priority)

  // History: newest first, both timestamp formats, empty-safe
  const history = [...(workflow.history ?? [])].sort((a, b) => {
    const ta = parseTimestamp(a.timestamp)?.getTime() ?? 0
    const tb = parseTimestamp(b.timestamp)?.getTime() ?? 0
    return tb - ta
  })

  const suggestedActions = workflow.suggested_actions ?? []

  return (
    <div className="detail-panel">

      {/* ── Header ── */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>
              {workflow.id}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', lineHeight: 1.3 }}>
              {workflow.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
              {workflow.client_name ||
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No client</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px 4px', marginLeft: '8px', flexShrink: 0 }}
          >×</button>
        </div>

        {/* Status + priority row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
          <StatusBadge status={workflow.status} />
          {priority && (
            <span style={{ fontSize: '10px', color: `var(--priority-${priority})`, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              P{priority}
            </span>
          )}
          {workflow.priority === 'urgent' && (
            <span style={{ fontSize: '10px', color: 'var(--priority-1)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              URGENT
            </span>
          )}
        </div>
      </div>

      {/* ── Body (scrollable) ── */}
      <div className="detail-panel-body">

        {/* Progress */}
        <div>
          <div className="detail-section-label">Progress</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="progress-bar-wrap" style={{ flex: 1, height: '5px' }}>
              <div className="progress-bar-fill" style={{ width: `${progressVal}%` }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>{progressLabel}</span>
          </div>
        </div>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="detail-row">
            <div className="detail-section-label">Assignee</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div className="avatar">{assigneeAvatar}</div>
              <span className="detail-value">{assigneeName}</span>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-section-label">Due date</div>
            <div className="detail-value">{formatDate(workflow.due_date)}</div>
          </div>
          <div className="detail-row">
            <div className="detail-section-label">Created</div>
            <div className="detail-value">{formatDate(workflow.created_at)}</div>
          </div>
          <div className="detail-row">
            <div className="detail-section-label">Updated</div>
            <div className="detail-value">{relativeTime(workflow.updated_at)}</div>
          </div>
        </div>

        {/* Tags */}
        {(workflow.tags ?? []).length > 0 && (
          <div>
            <div className="detail-section-label">Tags</div>
            <div className="tags">
              {(workflow.tags ?? []).map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          </div>
        )}

        {/* T-08: Suggested actions */}
        {suggestedActions.length > 0 && (
          <div>
            <div className="detail-section-label">Suggested actions</div>
            <div className="suggested-actions">
              {suggestedActions.map(actionKey => {
                const meta = ACTION_META[actionKey] ?? { label: actionKey, icon: '·', desc: '' }
                return (
                  <button
                    key={actionKey}
                    className="suggested-action-btn"
                    onClick={() => onAction?.(workflow, actionKey)}
                  >
                    <span className="suggested-action-icon">{meta.icon}</span>
                    <div>
                      <div>{meta.label}</div>
                      {meta.desc && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                          {meta.desc}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Notes — editable */}
        <div>
          <div className="detail-section-label">Notes</div>
          <textarea
            className="notes-textarea"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes…"
          />
        </div>

        {/* History timeline */}
        <div>
          <div className="detail-section-label">
            History {history.length === 0 ? '— none' : `(${history.length})`}
          </div>
          {history.length === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No history recorded.</div>
          ) : (
            <div>
              {history.map((h, i) => (
                <div key={i} className="history-item">
                  <span className="history-time">{formatDateTime(h.timestamp)}</span>
                  <span className="history-content">
                    <span className="history-user">{h.user ?? 'unknown'}</span>
                    {' '}{h.action || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>(no action)</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
