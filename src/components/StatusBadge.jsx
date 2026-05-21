// StatusBadge.jsx — T-07
//
// Single reusable status badge. Replaces copy-pasted inline logic in:
//   WorkflowCard, DetailPanel, ActivityFeed, App topbar (count badges)
//
// Props:
//   status   — string: 'active' | 'blocked' | 'review' | 'completed' | anything
//   variant  — 'badge' (default) | 'dot-only' | 'topbar' (dot + count + label)
//   count    — number, used only when variant='topbar'

import React from 'react'

const STATUS_COLOURS = {
  active:      'var(--status-active)',
  blocked:     'var(--status-blocked)',
  review:      'var(--status-review)',
  completed:   'var(--status-completed)',
  'in progress': 'var(--status-active)',
}

export function getStatusColour(status) {
  if (!status) return 'var(--status-unknown)'
  return STATUS_COLOURS[status.toLowerCase()] ?? 'var(--status-unknown)'
}

export default function StatusBadge({ status, variant = 'badge', count }) {
  const colour = getStatusColour(status)
  const label  = status ?? 'unknown'

  if (variant === 'dot-only') {
    return (
      <span
        className="status-dot"
        style={{ background: colour }}
        title={label}
      />
    )
  }

  if (variant === 'topbar') {
    // Renders: ● 3 active
    return (
      <span className="status-label" style={{ color: colour, fontSize: '11px' }}>
        <span className="status-dot" style={{ background: colour }} />
        {count} {label}
      </span>
    )
  }

  // Default: dot + label text
  return (
    <span className="status-label" style={{ color: colour }}>
      <span className="status-dot" style={{ background: colour }} />
      {label}
    </span>
  )
}
