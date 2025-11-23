# Skillwise Assignment Question

---

**Time Limit:** 2 days

**Tech Stack (Mandatory):** React (Frontend), Node.js (Backend), SQLite (Database)

**Submission Requirements:**

- Public GitHub repository (must share link)
- Both frontend and backend must be deployed (e.g., Backend → Render / Railway, Frontend → Netlify / Vercel)
- Provide live testing URLs for both frontend and backend
- Reply with GitHub repo link + deployed URLs in the same email

---

### Objective

Build a complete **Product Inventory Management System** with search, filtering, inline editing, CSV import/export, and inventory change history tracking.

---

### Frontend Tasks (React)

1. **Product Search & Filtering**
    - Implement a search bar that calls `GET /api/products/search?name=<query>`
    - Add a **Category filter dropdown** that filters the product list in real-time
    - Add an **"Add New Product"** button (opens a modal/form – implementation optional but preferred)
    - Place **Import** and **Export** buttons on the **right side of the header**
2. **Products Table**
    - Display products in a clean table with the following columns:`Image | Name | Unit | Category | Brand | Stock | Status | Actions`
    - Show **Stock Status** with color coding:
        - "In Stock" → Green label
        - "Out of Stock" → Red label
    - Actions column must have **Edit** and **Delete** buttons
3. **Import / Export Functionality**
    - **Import button**: Opens file picker → Upload CSV → POST to `/api/products/import` → Show success/error toast → Auto-refresh table
    - **Export button**: Triggers download of CSV via `GET /api/products/export`
4. **Inline Editing**
    - Clicking **Edit** turns the row into editable fields (except Image & ID)
    - Show **Save** and **Cancel** buttons
    - On Save → Send `PUT /api/products/:id` with updated data
    - Update the row instantly on success (optimistic update preferred)
5. **Inventory History Sidebar / Panel**
    - When a product row is selected/clicked, show a sidebar or slide-in panel
    - Fetch and display inventory update history for that product (from backend API)
    - Show columns: Date, Old Stock, New Stock, Changed By, Timestamp

---

### Backend Tasks (Node.js + Express + SQLite)

1. **CSV Import API**
    - `POST /api/products/import` (multipart/form-data)
    - Expected CSV columns: `name,unit,category,brand,stock,status,image`
    - Insert only **new products** (duplicate check by **name** – case-insensitive)
    - Return JSON: `{ added: 12, skipped: 5, duplicates: [{name, existingId}] }`
    - (Optional bonus: Let frontend show "Edit existing?" for duplicates)
2. **CSV Export API**
    - `GET /api/products/export`
    - Return CSV file of all products with proper headers and `Content-Disposition: attachment`
3. **Get Products API**
    - `GET /api/products` → Return full JSON list of products
    - `GET /api/products/search?name=abc` → Filter by name (partial, case-insensitive)
4. **Update Product API**
    - `PUT /api/products/:id`
    - Validate:
        - `name` must be unique (except for itself)
        - `stock` must be a number ≥ 0
        - Other fields required as per schema
    - Return updated product on success
5. **Inventory History Tracking**
    - Create a separate table `inventory_logs`
    - Whenever **stock** is updated via PUT → create a log entry:
        - `productId, oldStock, newStock, changedBy (e.g., "admin" or user email), timestamp`
    - API: `GET /api/products/:id/history` → Return logs sorted by date DESC

---

### Bonus Tasks (Optional but Highly Valued)

- Server-side **pagination**, **sorting**, and **filtering** on `/api/products`
- Basic **authentication** (login page + protected routes) – even simple username/password is fine
- Fully **responsive / mobile-friendly** UI
- Write **unit/integration tests** (Jest + Supertest for backend, React Testing Library for frontend)
- Proper error handling and user feedback (toasts, loading states)

---

### Mandatory Deliverables

1. GitHub Repository (public) – Clean commits, README with setup & deployment instructions
2. Deployed Backend (e.g., Render, Railway, [Fly.io](http://fly.io/))
3. Deployed Frontend (e.g., Netlify, Vercel)
4. Live working URLs for both
5. CSV import/export must work end-to-end

---

**Note:** This assignment is designed to evaluate your full-stack skills, code quality, attention to detail, and ability to deliver a polished product — not to overburden you.

**Submit by replying to this email with:**

- GitHub Repository URL
- Live Frontend URL
- Live Backend/Base URL

---

All the best! 🚀
