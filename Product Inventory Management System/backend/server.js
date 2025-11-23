// server.js
const express = require('express');
const cors = require('cors');
const db = require('./db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { body, validationResult } = require('express-validator');
const { Parser } = require('json2csv');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// Utility: run SQL with promise
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}
function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}
function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

/**
 * 1) GET /api/products  - list all products
 */
app.get('/api/products', async (req, res) => {
  try {
    const { page, limit, sortBy, order, category } = req.query;
    // Basic server-side pagination/filtering (optional)
    let sql = 'SELECT * FROM products';
    const params = [];
    if (category) {
      sql += ' WHERE category = ?';
      params.push(category);
    }
    if (sortBy) {
      const ord = order && order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      sql += ` ORDER BY ${sortBy} ${ord}`;
    } else {
      sql += ' ORDER BY id DESC';
    }
    if (page && limit) {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    }
    const rows = await allAsync(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

/**
 * 2) GET /api/products/search?name=abc  - search by name (partial, case-insensitive)
 */
app.get('/api/products/search', async (req, res) => {
  try {
    const q = req.query.name || '';
    const rows = await allAsync(
      `SELECT * FROM products WHERE lower(name) LIKE ? ORDER BY id DESC`,
      [`%${q.toLowerCase()}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * 3) PUT /api/products/:id  - update product, log stock changes
 */
app.put(
  '/api/products/:id',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('unit').notEmpty(),
    body('category').notEmpty(),
    body('brand').notEmpty(),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be >= 0'),
    body('status').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const id = req.params.id;
      const { name, unit, category, brand, stock, status, image } = req.body;

      // check name uniqueness (excluding self)
      const existing = await getAsync('SELECT id FROM products WHERE lower(name)=? AND id<>?', [
        name.toLowerCase(),
        id,
      ]);
      if (existing) {
        return res.status(400).json({ error: 'Name already exists' });
      }

      // get old row
      const old = await getAsync('SELECT * FROM products WHERE id = ?', [id]);
      if (!old) return res.status(404).json({ error: 'Product not found' });

      await runAsync(
        `UPDATE products SET name=?, unit=?, category=?, brand=?, stock=?, status=?, image=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [name, unit, category, brand, stock, status, image || null, id]
      );

      // if stock changed, insert inventory_log
      if (old.stock !== Number(stock)) {
        const changedBy = req.body.changedBy || 'admin';
        await runAsync(
          `INSERT INTO inventory_logs (productId, oldStock, newStock, changedBy) VALUES (?,?,?,?)`,
          [id, old.stock, Number(stock), changedBy]
        );
      }

      const updated = await getAsync('SELECT * FROM products WHERE id = ?', [id]);
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

/**
 * 4) DELETE /api/products/:id  - delete product
 */
app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await runAsync('DELETE FROM products WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

/**
 * 5) POST /api/products/import  - CSV import (multipart)
 *    CSV headers: name,unit,category,brand,stock,status,image
 */
app.post('/api/products/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const filePath = req.file.path;
    const parser = fs.createReadStream(filePath).pipe(parse({ columns: true, trim: true }));

    const added = [];
    const skipped = [];
    const duplicates = [];

    for await (const record of parser) {
      // normalize record
      const name = (record.name || '').trim();
      if (!name) {
        skipped.push({ reason: 'missing name', record });
        continue;
      }
      const unit = (record.unit || 'pcs').trim();
      const category = (record.category || 'Uncategorized').trim();
      const brand = (record.brand || '').trim();
      const stock = parseInt(record.stock || 0);
      const status = (record.status || (stock > 0 ? 'In Stock' : 'Out of Stock')).trim();
      const image = (record.image || '').trim();

      // check duplicate by name (case-insensitive)
      const existing = await getAsync('SELECT id FROM products WHERE lower(name)=?', [name.toLowerCase()]);
      if (existing) {
        duplicates.push({ name, existingId: existing.id });
        continue;
      }

      const r = await runAsync(
        `INSERT INTO products (name, unit, category, brand, stock, status, image) VALUES (?,?,?,?,?,?,?)`,
        [name, unit, category, brand, stock, status, image || null]
      );
      added.push({ id: r.lastID, name });
    }

    // remove uploaded file
    fs.unlinkSync(filePath);

    res.json({ added: added.length, skipped: skipped.length, duplicates, details: { added, skipped } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Import failed', details: err.message });
  }
});

/**
 * 6) GET /api/products/export  - CSV export of all products
 */
app.get('/api/products/export', async (req, res) => {
  try {
    const rows = await allAsync('SELECT name, unit, category, brand, stock, status, image FROM products');
    const parser = new Parser({ fields: ['name', 'unit', 'category', 'brand', 'stock', 'status', 'image'] });
    const csv = parser.parse(rows || []);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
});

/**
 * 7) GET /api/products/:id/history  - inventory logs for product
 */
app.get('/api/products/:id/history', async (req, res) => {
  try {
    const id = req.params.id;
    const rows = await allAsync(
      'SELECT id, productId, oldStock, newStock, changedBy, timestamp FROM inventory_logs WHERE productId=? ORDER BY timestamp DESC',
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * 8) Simple seed endpoint (optional) - not needed in production
 */
app.post('/api/seed', async (req, res) => {
  try {
    const sample = [
      ['Apple iPhone 14', 'pcs', 'Electronics', 'Apple', 10, 'In Stock', 'https://example.com/iphone.jpg'],
      ['Banana', 'kg', 'Grocery', 'FreshFarm', 0, 'Out of Stock', ''],
      ['Shampoo', 'bottle', 'Personal Care', 'CleanCo', 25, 'In Stock', ''],
    ];
    for (const p of sample) {
      try {
        await runAsync(
          `INSERT INTO products (name, unit, category, brand, stock, status, image) VALUES (?,?,?,?,?,?,?)`,
          p
        );
      } catch (e) {
        // ignore duplicates
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Seed failed' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('Server started on port', PORT);
});
