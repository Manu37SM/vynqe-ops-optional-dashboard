// useWorkflows.js — T-04 fixed
//
// Fixes applied:
//   T-04:  loading starts as true so UI shows loader immediately
//   T-04:  try/catch + finally so error is captured and loading always cleared
//   T-04b: empty dependency array [] so effect runs exactly once, never loops

import { useState, useEffect } from 'react'

export function useWorkflows() {
  const [loading, setLoading] = useState(true)   // T-04 fix: true from the start
  const [error, setError]     = useState(null)
  const [data, setData]       = useState(null)

  useEffect(() => {
    let cancelled = false  // guard against setting state after unmount

    async function load() {
      try {
        const res = await fetch('/data.json')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)  // T-04 fix: always clear loading
      }
    }

    load()
    return () => { cancelled = true }
  }, []) // T-04b fix: [] so this runs once, not infinitely

  return { data, loading, error }
}
