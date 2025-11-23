import React from 'react'
import ProductRow from './ProductRow'

export default function ProductsTable({ products, loading, onRowSelect, onUpdate, onDelete, apiBase }) {
  if (loading) return <div>Loading...</div>
  return (
    <table className="products-table">
      <thead>
        <tr>
          <th>Image</th><th>Name</th><th>Unit</th><th>Category</th><th>Brand</th><th>Stock</th><th>Status</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.length === 0 && <tr><td colSpan="8">No products</td></tr>}
        {products.map((p) => (
          <ProductRow key={p.id} product={p} onSelect={() => onRowSelect(p)} onUpdate={onUpdate} onDelete={onDelete} apiBase={apiBase} />
        ))}
      </tbody>
    </table>
  )
}
