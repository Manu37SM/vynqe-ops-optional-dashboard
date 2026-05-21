// FilterBar.jsx — T-03 fixed
//
// Fixes applied:
//   T-03: removed local `activeLabel` state that shadowed the parent prop.
//         Now uses `activeFilter` prop directly for active highlight.
//   T-03: handleClick now calls onFilterChange(filter.value) to notify parent.
//   T-03: onChange on search input now calls onSearchChange(val).
//
// Advanced note (status casing):
//   Filter values are lowercase ('active', 'blocked', …).
//   App.jsx comparison uses w.status?.toLowerCase() so mixed-case data is safe.
//   Using the prop for active state means the first click always reflects truth.

import React from 'react'

const FILTERS = [
  { label: 'All',       value: 'all' },
  { label: 'Active',    value: 'active' },
  { label: 'Blocked',   value: 'blocked' },
  { label: 'Review',    value: 'review' },
  { label: 'Completed', value: 'completed' },
]

export default function FilterBar({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onSummarise,
  summarising,
}) {
  function handleClick(filter) {
    onFilterChange(filter.value)   // T-03 fix: notify parent
  }

  return (
    <div className="filter-bar">
      {FILTERS.map(f => (
        <button
          key={f.value}
          // T-03 fix: compare against activeFilter prop, not local state
          className={`filter-btn ${activeFilter === f.value ? 'active' : ''}`}
          onClick={() => handleClick(f)}
        >
          {f.label}
        </button>
      ))}

      <div className="filter-bar-right">
        <input
          className="search-input"
          type="text"
          placeholder="Search workflows..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}  // T-03 fix: propagate
        />

        {/* T-09: Summarise button — wired to onSummarise */}
        <button
          className={`btn-summarise ${summarising ? 'loading' : ''}`}
          onClick={onSummarise}
          disabled={summarising}
        >
          {summarising ? 'Summarising…' : 'Summarise today'}
        </button>
      </div>
    </div>
  )
}
