import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

export default function ProductRow({ product, onSelect, onUpdate, onDelete, apiBase }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...product })

  const startEdit = () => {
    setForm({ ...product })
    setEditing(true)
  }
  const cancel = () => {
    setEditing(false)
  }

  const save = async () => {
    try {
      // optimistic update: update UI immediately
      const optimistic = { ...form, id: product.id }
      onUpdate(optimistic)
      setEditing(false)

      const res = await axios.put(`${apiBase}/api/products/${product.id}`, form)
      onUpdate(res.data)
      toast.success('Saved')
    } catch (err) {
      toast.error('Save failed')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this product?')) return
    try {
      await axios.delete(`${apiBase}/api/products/${product.id}`)
      onDelete(product.id)
      toast.success('Deleted')
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  if (editing) {
    return (
      <tr>
        <td>{product.image ? <img src={product.image} alt="" width="50" /> : '-'}</td>
        <td><input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} /></td>
        <td><input value={form.unit} onChange={(e)=>setForm({...form,unit:e.target.value})} /></td>
        <td><input value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})} /></td>
        <td><input value={form.brand} onChange={(e)=>setForm({...form,brand:e.target.value})} /></td>
        <td><input type="number" value={form.stock} onChange={(e)=>setForm({...form,stock:parseInt(e.target.value||0)})} /></td>
        <td>
          <select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}>
            <option>In Stock</option>
            <option>Out of Stock</option>
          </select>
        </td>
        <td>
          <button onClick={save}>Save</button>
          <button onClick={cancel}>Cancel</button>
        </td>
      </tr>
    )
  }

  return (
    <tr onClick={onSelect}>
      <td>{product.image ? <img src={product.image} alt="" width="50" /> : '-'}</td>
      <td>{product.name}</td>
      <td>{product.unit}</td>
      <td>{product.category}</td>
      <td>{product.brand}</td>
      <td>{product.stock}</td>
      <td>
        <span className={`status ${product.status === 'In Stock' ? 'in' : 'out'}`}>{product.status}</span>
      </td>
      <td>
        <button onClick={(e)=>{e.stopPropagation(); startEdit();}}>Edit</button>
        <button onClick={(e)=>{e.stopPropagation(); handleDelete();}}>Delete</button>
      </td>
    </tr>
  )
}
