import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function HistorySidebar({ product, onClose, apiBase }) {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    if (!product) return
    const fetch = async () => {
      try {
        const res = await axios.get(`${apiBase}/api/products/${product.id}/history`)
        setLogs(res.data)
      } catch (err) {
        setLogs([])
      }
    }
    fetch()
  }, [product])

  if (!product) return null

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>History: {product.name}</h3>
        <button onClick={onClose}>Close</button>
      </div>
      <table className="history-table">
        <thead><tr><th>Date</th><th>Old</th><th>New</th><th>By</th></tr></thead>
        <tbody>
          {logs.length===0 && <tr><td colSpan="4">No logs</td></tr>}
          {logs.map(l => (
            <tr key={l.id}>
              <td>{new Date(l.timestamp).toLocaleString()}</td>
              <td>{l.oldStock}</td>
              <td>{l.newStock}</td>
              <td>{l.changedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
