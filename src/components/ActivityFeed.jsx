// ActivityFeed.jsx — T-06
//
// Renders the global activity log, newest first.
//
// Edge cases handled:
//   - users is a keyed OBJECT { usr_aisha: {name,avatar,...} }, NOT an array
//     → lookup via users?.[entry.user]?.name
//   - null user        → 'Unknown'
//   - empty action     → italic '(no action recorded)'
//   - duplicate entries → deduplicated by id
//   - orphaned wf_id   → flagged with ⚠ (workflow not in main data)
//   - Unix epoch ts    → parsed with * 1000

import React, { useMemo } from 'react'

function parseTimestamp(ts) {
  if (!ts) return null
  if (typeof ts === 'number') return new Date(ts * 1000)
  return new Date(ts)
}

function formatTime(ts) {
  const d = parseTimestamp(ts)
  if (!d || isNaN(d)) return '—'
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function ActivityFeed({ activityLog, users, workflowIds }) {
  const entries = useMemo(() => {
    if (!activityLog?.length) return []

    // users is a keyed object { usr_aisha: {name, avatar, role}, … }
    // NOT an array — access directly by id
    const resolveUser = (userId) => {
      if (!userId) return 'Unknown'
      // users may be undefined if data hasn't loaded
      const u = users?.[userId]
      return u?.name ?? userId   // fall back to raw id if not found
    }

    // Deduplicate by id — keep first occurrence
    const seen = new Set()
    const deduped = activityLog.filter(entry => {
      if (seen.has(entry.id)) return false
      seen.add(entry.id)
      return true
    })

    // Sort newest first
    return [...deduped].sort((a, b) => {
      const ta = parseTimestamp(a.timestamp)?.getTime() ?? 0
      const tb = parseTimestamp(b.timestamp)?.getTime() ?? 0
      return tb - ta
    }).map(entry => ({
      ...entry,
      userName: resolveUser(entry.user),
      isOrphan: workflowIds != null && !workflowIds.has(entry.workflow_id),
    }))
  }, [activityLog, users, workflowIds])

  return (
    <div className="activity-feed">
      <div className="activity-feed-header">
        Activity {entries.length > 0 ? `· ${entries.length} entries` : ''}
      </div>

      {entries.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
          No activity yet.
        </div>
      )}

      {entries.map(entry => (
        <div key={entry.id} className="activity-entry">
          <span className="activity-time">{formatTime(entry.timestamp)}</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            {entry.userName}
          </span>
          <span style={{ color: 'var(--text-secondary)', flex: 1, minWidth: 0 }}>
            {' '}
            {entry.action
              ? entry.action
              : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>(no action recorded)</span>
            }
          </span>
          <span className="activity-wfid">
            {entry.isOrphan
              ? <span className="activity-orphan" title="Workflow not found">{entry.workflow_id} ⚠</span>
              : entry.workflow_id
            }
          </span>
        </div>
      ))}
    </div>
  )
}
