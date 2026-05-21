// SummaryModal.jsx — T-09
//
// "Summarise today" feature. Generates a context-aware summary from
// actual workflow data (not truly random — counts, flags blockers, etc.)
// Displayed in a modal with a brief simulated loading delay for UX realism.
//
// UX decisions:
//   - 1.2s fake "thinking" delay so it feels responsive, not instant
//   - Pulls real numbers from data: counts per status, overdue items, top blockers
//   - Closes on backdrop click or Escape key

import React, { useEffect } from 'react'
import StatusBadge from './StatusBadge'

function buildSummary(workflows) {
  if (!workflows?.length) return null

  const now = new Date()
  const byStatus = {}
  const overdue = []
  const highPriority = []
  const recentlyUpdated = []

  workflows.forEach(w => {
    const s = w.status?.toLowerCase() ?? 'unknown'
    byStatus[s] = (byStatus[s] ?? 0) + 1

    if (w.due_date) {
      const due = new Date(w.due_date)
      if (due < now && s !== 'completed') overdue.push(w)
    }
    if (w.priority === 1 && s !== 'completed') highPriority.push(w)

    const updated = new Date(typeof w.updated_at === 'number' ? w.updated_at * 1000 : w.updated_at)
    const hoursAgo = (now - updated) / 3600000
    if (hoursAgo < 48) recentlyUpdated.push(w)
  })

  const blocked = byStatus['blocked'] ?? 0
  const active  = byStatus['active'] ?? 0
  const review  = byStatus['review'] ?? 0
  const done    = byStatus['completed'] ?? 0

  return { byStatus, overdue, highPriority, recentlyUpdated, blocked, active, review, done, total: workflows.length }
}

export default function SummaryModal({ workflows, onClose }) {
  const summary = buildSummary(workflows)

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-title-icon">◈</span>
            Today's summary
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Status counts */}
          <div>
            <div className="summary-section-label">Overview</div>
            <div className="summary-stat-row">
              {[
                { label: 'Total',     val: summary.total,   colour: 'var(--text-primary)' },
                { label: 'Active',    val: summary.active,  colour: 'var(--status-active)' },
                { label: 'Blocked',   val: summary.blocked, colour: 'var(--status-blocked)' },
                { label: 'In review', val: summary.review,  colour: 'var(--status-review)' },
              ].map(({ label, val, colour }) => (
                <div key={label} className="summary-stat">
                  <div className="summary-stat-num" style={{ color: colour }}>{val}</div>
                  <div className="summary-stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Insight blurb */}
          <div className="summary-insight">
            {summary.blocked > 0 && (
              <><strong>{summary.blocked} workflow{summary.blocked > 1 ? 's' : ''} blocked</strong> — needs attention before end of day. </>
            )}
            {summary.overdue.length > 0 && (
              <><strong>{summary.overdue.length} overdue</strong> and not yet completed. </>
            )}
            {summary.blocked === 0 && summary.overdue.length === 0 && (
              <>All {summary.active} active workflows are on track. </>
            )}
            {summary.review > 0 && (
              <>{summary.review} workflow{summary.review > 1 ? 's' : ''} waiting for review.</>
            )}
          </div>

          {/* High priority */}
          {summary.highPriority.length > 0 && (
            <div>
              <div className="summary-section-label">P1 — Needs action ({summary.highPriority.length})</div>
              {summary.highPriority.slice(0, 4).map(w => (
                <div key={w.id} className="summary-item">
                  <div className="summary-item-dot" />
                  <div>
                    <span style={{ color: 'var(--text-primary)' }}>{w.title}</span>
                    {' '}
                    <StatusBadge status={w.status} />
                    {' '}
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>— {w.client_name || 'No client'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Overdue */}
          {summary.overdue.length > 0 && (
            <div>
              <div className="summary-section-label">Overdue ({summary.overdue.length})</div>
              {summary.overdue.slice(0, 4).map(w => (
                <div key={w.id} className="summary-item">
                  <div className="summary-item-dot" style={{ background: 'var(--status-blocked)' }} />
                  <span style={{ color: 'var(--text-primary)' }}>{w.title}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginLeft: 4 }}>
                    — due {new Date(w.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Recently active */}
          {summary.recentlyUpdated.length > 0 && (
            <div>
              <div className="summary-section-label">Updated in last 48h ({summary.recentlyUpdated.length})</div>
              {summary.recentlyUpdated.slice(0, 4).map(w => (
                <div key={w.id} className="summary-item">
                  <div className="summary-item-dot" style={{ background: 'var(--status-active)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{w.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
