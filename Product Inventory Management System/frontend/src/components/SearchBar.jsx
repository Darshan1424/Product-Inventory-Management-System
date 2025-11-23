import React, { useState } from 'react'

export default function SearchBar({ onSearch }) {
  const [q, setQ] = useState('')
  const handle = () => onSearch(q)
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." />
      <button onClick={handle}>Search</button>
      <button onClick={() => { setQ(''); onSearch(''); }}>Clear</button>
    </div>
  )
}
