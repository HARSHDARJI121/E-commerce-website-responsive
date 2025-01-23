// Import necessary modules
const express = require('express');
const mysql = require('mysql');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: 'Harsh@5489', // Replace with your MySQL password
  database: 'ecommerce', // Replace with your database name
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to database');
});

// Middleware setup
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Set up the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Route for the admin page
app.get('/admin', (req, res) => {
  res.render('admin'); // Ensure `views/admin.ejs` exists
});

// Route to fetch all products
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM products';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: 'Error fetching products' });
      return;
    }
    res.json(results);
  });
});

// Route to add a new product
app.post('/api/products', (req, res) => {
  const { name, image, size, retail_price, distribution_price, short_description, category } = req.body;

  if (!name || !image || !size || !retail_price || !distribution_price || !short_description || !category) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  const query = `
    INSERT INTO products (name, image, size, retail_price, distribution_price, short_description, category, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  db.query(
    query,
    [name, image, size, retail_price, distribution_price, short_description, category],
    (err, result) => {
      if (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ error: 'Error adding product' });
        return;
      }
      res.status(201).json({ message: 'Product added successfully', productId: result.insertId });
    }
  );
});

// Route to update an existing product
app.put('/api/products/:id', (req, res) => {
  const { name, image, size, retail_price, distribution_price, short_description, category } = req.body;
  const productId = req.params.id;

  if (!name || !image || !size || !retail_price || !distribution_price || !short_description || !category) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  const query = `
    INSERT INTO products (name, image, size, retail_price, distribution_price, short_description, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`;


  db.query(
    query,
    [name, image, size, retail_price, distribution_price, short_description, category, productId],
    (err, result) => {
      if (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Error updating product' });
        return;
      }
      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      res.status(200).json({ message: 'Product updated successfully' });
    }
  );
});

// Route to delete a product
app.delete('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  const query = 'DELETE FROM products WHERE id = ?';

  db.query(query, [productId], (err, result) => {
    if (err) {
      console.error('Error deleting product:', err);
      res.status(500).json({ error: 'Error deleting product' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Admin server running on http://localhost:${port}/admin`);
});
