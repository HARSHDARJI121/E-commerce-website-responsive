// Importing required modules
const express = require('express');
const path = require('path');
const mysql = require('mysql');
const session = require('express-session'); // Add session handling

// Initialize the Express app
const app = express();

// Set up the view engine as EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Set views folder path

// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse incoming request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up the session middleware
app.use(session({
  secret: 'your_secret_key', // You can replace this with your own secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Set up the MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Harsh@5489', // Replace with your DB password
  database: 'ecommerce'  // Replace with your DB name
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to database');
});


// Homepage route
app.get('/', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching products' });
    }
    res.render('homepage', { products: results });  // homepage.ejs
  });
});

app.get('/profile',(req,res) => {
  res.render('profile.ejs')
})
// Men Clothes route
app.get('/menclothes', (req, res) => {
  db.query('SELECT * FROM products WHERE category = "Men Clothes"', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching products' });
    }
    res.render('menclothes', { products: results });  // men-clothes.ejs
  });
});

// Women Clothes route
app.get('/womenclothes', (req, res) => {
  db.query('SELECT * FROM products WHERE category = "Women Clothes"', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching products' });
    }
    res.render('womenclothes', { products: results });  // women-clothes.ejs
  });
});

// Men Accessories route
app.get('/menaccessories', (req, res) => {
  db.query('SELECT * FROM products WHERE category = "Men Accessories"', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching products' });
    }
    res.render('menacc', { products: results });  // men-accessories.ejs
  });
});

// Women Accessories route
app.get('/womenaccessories', (req, res) => {
  db.query('SELECT * FROM products WHERE category = "Women Accessories"', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching products' });
    }
    res.render('womenacc', { products: results });  // women-accessories.ejs
  });
});

// Beauty route
app.get('/beauty', (req, res) => {
  db.query('SELECT * FROM products WHERE category = "Beauty"', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching products' });
    }
    res.render('beauty', { products: results });  // beauty.ejs
  });
});

const categories = ['Men Clothes', 'Women Clothes', 'Men Accessories', 'Women Accessories', 'Beauty'];

categories.forEach(category => {
  app.get(`/${category.replace(/ /g, '').toLowerCase()}`, (req, res) => {
    db.query('SELECT * FROM products WHERE category = ?', [category], (err, results) => {
      if (err) {
        return res.status(500).json({ message: `Error fetching ${category} products` });
      }
      res.render(category.replace(/ /g, '').toLowerCase(), { products: results });
    });
  });
});

// Route to display product details
app.get('/product-details/:id', (req, res) => {
  const productId = req.params.id;
  db.query('SELECT * FROM products WHERE id = ?', [productId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching product details' });
    }

    if (result.length === 0) {
      return res.status(404).send('Product not found');
    }

    res.render('product-details', { product: result[0] });
  });
});

// Add to Cart route
app.post('/add-to-cart', (req, res) => {
  const { productId, size } = req.body;
  const query = 'SELECT * FROM products WHERE id = ?';

  db.query(query, [productId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = result[0];

    // Ensure the cart is initialized if it doesn't exist
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Check if the product (with size) already exists in the cart
    const existingItem = req.session.cart.find(item => item.productId === productId && item.size === size);

    if (existingItem) {
      existingItem.quantity += 1; // Increase quantity if product is already in the cart
    } else {
      // Add a new item to the cart
      req.session.cart.push({
        productId: product.id,
        size: product.size,
        quantity: 1,
        name: product.name,
        price: product.retail_price,
        image: product.image
      });
    }

    return res.redirect('/cart');
  });
});

// Get Cart route
app.get('/cart', (req, res) => {
  if (!req.session.cart || req.session.cart.length === 0) {
    return res.render('empty-cart');  // Display empty cart page
  }

  res.render('cart', { cart: req.session.cart });
});

// Cart Remove route
app.post('/remove-from-cart', (req, res) => {
  const { productId, size } = req.body;

  // Remove the item from the cart (session)
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(item => item.productId != productId || item.size != size);
  }

  // Redirect back to the cart page
  res.redirect('/cart');
});

// Checkout route
app.get('/checkout', (req, res) => {
  const cart = req.session.cart || [];
  res.render('checkout', { cart });
});

// Route to place an order (post-order submission)
app.post('/place-order', (req, res) => {
  // Handle placing an order, you could integrate with a payment gateway here.
  // For now, just redirect to a confirmation page
  res.send('Order placed successfully');
});

// API endpoint to fetch product list
app.get('/api/products', (req, res) => {
  const category = req.query.category; // Get category from query params
  let query = 'SELECT * FROM products';
  const params = [];

  if (category) {
      query += ' WHERE category = ?';
      params.push(category);
  }

  db.query(query, params, (err, results) => {
      if (err) {
          console.error('Error fetching products:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.json(results);
  });
});

// API endpoint for product details
app.get('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  db.query('SELECT * FROM products WHERE id = ?', [productId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching product details' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(result[0]);
  });
});

// Route to update an existing product
app.put('/api/products/:id', (req, res) => {
  const { name, image, size, retail_price, distribution_price, short_description, category } = req.body;
  const productId = req.params.id;

  if (!name || !image || !size || !retail_price || !distribution_price || !short_description || !category) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const query = `
    UPDATE products 
    SET name = ?, image = ?, size = ?, retail_price = ?, distribution_price = ?, short_description = ?, category = ? 
    WHERE id = ?;
  `;

  db.query(query, [name, image, size, retail_price, distribution_price, short_description, category, productId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error updating product' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json({ message: 'Product updated successfully' });
  });
});

// Route to add a new product
app.post('/api/products', (req, res) => {
  const { name, image, short_description, retail_price, category } = req.body;

  const query = `
      INSERT INTO products (name, image, short_description, retail_price, category)
      VALUES (?, ?, ?, ?, ?)
  `;
  const params = [name, image, short_description, retail_price, category];

  db.query(query, params, (err, result) => {
      if (err) {
          return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.status(201).json({ message: 'Product added successfully', productId: result.insertId });
  });
});

// Set the port the app will listen on
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});