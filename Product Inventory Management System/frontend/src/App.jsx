import React, { useEffect, useState } from 'react'
import axios from 'axios'
import ProductsTable from './components/ProductsTable'
import SearchBar from './components/SearchBar'
import HistorySidebar from './components/HistorySidebar'
import { ToastContainer, toast } from 'react-toastify'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function App() {
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchProducts = async (q = '') => {
    setLoading(true)
    try {
      if (q) {
        const res = await axios.get(`${API}/api/products/search`, { params: { name: q } })
        setProducts(res.data)
      } else if (categoryFilter) {
        const res = await axios.get(`${API}/api/products`, { params: { category: categoryFilter } })
        setProducts(res.data)
      } else {
        const res = await axios.get(`${API}/api/products`)
        setProducts(res.data)
      }
    } catch (err) {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [categoryFilter])

  const handleSearch = (q) => {
    fetchProducts(q)
  }

  // Import CSV
  const handleImport = async (file) => {
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await axios.post(`${API}/api/products/import`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(`Import added: ${res.data.added}, duplicates: ${res.data.duplicates?.length || 0}`)
      fetchProducts()
    } catch (err) {
      toast.error('Import failed')
    }
  }

  const handleExport = async () => {
    try {
      const res = await axios.get(`${API}/api/products/export`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'products.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      toast.error('Export failed')
    }
  }

  // optimistic update callback from child
  const updateLocalProduct = (updated) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  const deleteLocalProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="container">
      <ToastContainer position="top-right" />
      <header className="header">
        <div>
          <h1>Product Inventory</h1>
        </div>
        <div className="header-right">
          <input type="file" onChange={(e) => handleImport(e.target.files[0])} />
          <button className="btn" onClick={handleExport}>Export</button>
        </div>
      </header>

      <div className="controls">
        <SearchBar onSearch={handleSearch} />
        <div>
          <label>Category: </label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All</option>
            <option value="Electronics">Electronics</option>
            <option value="Grocery">Grocery</option>
            <option value="Personal Care">Personal Care</option>
            <option value="Uncategorized">Uncategorized</option>
            {/* You can populate categories dynamically if you want */}
          </select>
        </div>
      </div>

      <ProductsTable
        products={products}
        loading={loading}
        onRowSelect={(p) => setSelectedProduct(p)}
        onUpdate={updateLocalProduct}
        onDelete={deleteLocalProduct}
        apiBase={API}
      />

      <HistorySidebar
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        apiBase={API}
      />
    </div>
  )
}
