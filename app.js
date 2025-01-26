// Importing required modules
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');  // Use mongoose only once
const session = require('express-session');




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
  secret: 'your_secret_key',  // Replace with your own secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  // Set to true if using HTTPS
}));

// MongoDB connection URI
const dbURI = 'mongodb://localhost:27017/ecommerce'; // Make sure MongoDB is running

// Connect to MongoDB (replace with your MongoDB connection string)
mongoose.connect('mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define a Product schema
const productSchema = new mongoose.Schema({
  name: String,
  short_description: String,
  retail_price: Number,
  image: String,
  category: String // Category like "Menclothes", "Womenclothes", etc.
});

// Create a Product model
const Product = mongoose.model('Product', productSchema);
// Route for the homepage
app.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
    res.render('homepage', { products });
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({ message: 'Error fetching products' });
  }
});
// Profile route
app.get('/profile', (req, res) => {
  res.render('profile');
});

// Route for Men Clothes
app.get('/menclothes', async (req, res) => {
  try {
    const products = await Product.find({ category: "Men Clothes" });
    res.render('menclothes', { products });
  } catch (err) {
    console.error('Error fetching Men Clothes:', err);
    return res.status(500).json({ message: 'Error fetching Men Clothes' });
  }
});
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Assuming user data is stored in User model
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    size: String,
    quantity: Number,
    price: Number
  }],
  totalPrice: Number,
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

// Route for Women Clothes
app.get('/womenclothes', async (req, res) => {
  try {
    const products = await Product.find({ category: "Women Clothes" });
    res.render('womenclothes', { products });
  } catch (err) {
    console.error('Error fetching Women Clothes:', err);
    return res.status(500).json({ message: 'Error fetching Women Clothes' });
  }
});

// Route for Men Accessories
app.get('/menaccessories', async (req, res) => {
  try {
    const products = await Product.find({ category: "Men Accessories" });
    res.render('menacc', { products });
  } catch (err) {
    console.error('Error fetching Men Accessories:', err);
    return res.status(500).json({ message: 'Error fetching Men Accessories' });
  }
});
// Route for Women Accessories
app.get('/womenaccessories', async (req, res) => {
  try {
    const products = await Product.find({ category: "Women Accessories" });
    res.render('womenacc', { products });
  } catch (err) {
    console.error('Error fetching Women Accessories:', err);
    return res.status(500).json({ message: 'Error fetching Women Accessories' });
  }
});

// Route for Beauty Products
app.get('/beauty', async (req, res) => {
  try {
    const products = await Product.find({ category: "Beauty" });
    res.render('beauty', { products });
  } catch (err) {
    console.error('Error fetching Beauty products:', err);
    return res.status(500).json({ message: 'Error fetching Beauty products' });
  }
});

// Define your route for fetching products by category
app.get('/api/products', async (req, res) => {
  try {
    const category = req.query.category; // Get the category from query parameters
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    // Fetch products based on the category
    const products = await Product.find({ category: category });

    // If no products are found in that category
    if (products.length === 0) {
      return res.status(404).json({ error: 'No products found for this category' });
    }

    res.json(products); // Send the products as a JSON response
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to display product details
app.get('/product-details/:id', async (req, res) => {
  try {
      const productId = req.params.id;
      const product = await Product.findById(productId);  // MongoDB query to find product by ID

      if (product) {
          res.render('product-details', { product });
      } else {
          res.render('product-details', { product: null });
      }
  } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).send('Server error');
  }
});


// Add to Cart route
app.post('/add-to-cart', async (req, res) => {
  const { productId, size } = req.body;

  try {
    // Find the product in MongoDB by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Initialize cart if not present
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Check if the product is already in the cart with the same size
    const existingItem = req.session.cart.find(item => item.productId.toString() === productId && item.size === size);

    if (existingItem) {
      // Increase the quantity if the item already exists in the cart
      existingItem.quantity += 1;
    } else {
      // Add new item to cart
      req.session.cart.push({
        productId: product._id,  // MongoDB _id for unique identification
        size: size,
        quantity: 1,
        name: product.name,
        price: product.retail_price,
        image: product.image
      });
    }

    // Redirect to the cart page (you could also send a response if needed)
    res.redirect('/cart');
  } catch (err) {
    console.error('Error adding product to cart:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Get Cart route
// Cart route
app.get('/cart', async (req, res) => {
  if (!req.session.cart || req.session.cart.length === 0) {
    return res.render('empty-cart');  // Display empty cart page
  }

  try {
    // Fetch the products from MongoDB using the productId stored in the session cart
    const productIds = req.session.cart.map(item => item.productId);

    // Use `Product.find()` to fetch products by their IDs
    const products = await Product.find({ '_id': { $in: productIds } });

    // Map through the cart and merge it with the corresponding product data
    const cartWithDetails = req.session.cart.map(item => {
      const product = products.find(p => p._id.toString() === item.productId.toString());
      return {
        ...item,  // Keep the cart item properties
        product: product  // Add the full product details
      };
    });

    // Render the cart page and pass the detailed cart data
    res.render('cart', { cart: cartWithDetails });
  } catch (err) {
    console.error('Error fetching cart products:', err);
    res.status(500).send('Internal server error');
  }
});

// Cart Remove route
app.post('/remove-from-cart', (req, res) => {
  const { productId, size } = req.body;

  // Remove the item from the cart (session)
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(item => item.productId.toString() !== productId.toString() || item.size !== size);
  }

  // Redirect back to the cart page
  res.redirect('/cart');
});


// Checkout route
// Checkout route
app.get('/checkout', async (req, res) => {
  const cart = req.session.cart || [];

  // If the cart is empty, redirect to the cart page
  if (cart.length === 0) {
    return res.redirect('/cart');
  }

  try {
    // Fetch the products in the cart from MongoDB
    const productIds = cart.map(item => item.productId);
    const products = await Product.find({ '_id': { $in: productIds } });

    // Map the session cart to include the product details
    const cartWithDetails = cart.map(item => {
      const product = products.find(p => p._id.toString() === item.productId.toString());
      return {
        ...item,
        product: product  // Add the product details to the cart item
      };
    });

    // Render the checkout page with the detailed cart information
    res.render('checkout', { cart: cartWithDetails });
  } catch (err) {
    console.error('Error fetching products for checkout:', err);
    res.status(500).send('Internal server error');
  }
});


// API endpoint to fetch product list
app.post('/api/products', (req, res) => {
  const { name, image, short_description, retail_price, category } = req.body;

  // Check if all fields are provided
  if (!name || !image || !short_description || !retail_price || !category) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const newProduct = new Product({
    name,
    image,
    short_description,
    retail_price,
    category
  });

  newProduct.save((err, product) => {
    if (err) {
      console.error('Error creating product:', err);  // Log the error for debugging
      return res.status(500).json({ error: 'Error creating product' });
    }
    res.status(201).json({ message: 'Product created successfully', productId: product._id });
  });
});


// API endpoint to fetch product details
app.get('/api/products/:id', (req, res) => {
  const productId = req.params.id;

  Product.findById(productId, (err, product) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching product details' });
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  });
});

// Route to update an existing product
app.put('/api/products/:id', (req, res) => {
  const { name, image, size, retail_price, distribution_price, short_description, category } = req.body;
  const productId = req.params.id;

  Product.findByIdAndUpdate(
    productId,
    { name, image, size, retail_price, distribution_price, short_description, category },
    { new: true }, // Return the updated document
    (err, product) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating product' });
      }
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.status(200).json({ message: 'Product updated successfully', product });
    }
  );
});

// Route to delete a product
app.delete('/api/products/:id', (req, res) => {
  const productId = req.params.id;

  Product.findByIdAndDelete(productId, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting product' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  });
});

app.post('/place-order', async (req, res) => {
  const cart = req.session.cart || [];
  const { userId, shippingAddress } = req.body;  // Assuming these are sent in the request body

  if (cart.length === 0) {
    return res.status(400).send('Your cart is empty!');
  }

  try {
    // Fetch product details from the database for cart items
    const productIds = cart.map(item => item.productId);
    const products = await Product.find({ '_id': { $in: productIds } });

    // Calculate the total price
    let totalPrice = 0;
    const orderItems = cart.map(item => {
      const product = products.find(p => p._id.toString() === item.productId.toString());
      totalPrice += product.retail_price * item.quantity;
      return {
        productId: product._id,
        size: item.size,
        quantity: item.quantity,
        price: product.retail_price
      };
    });

    // Create the order document
    const newOrder = new Order({
      userId,
      items: orderItems,
      totalPrice,
      shippingAddress,
      status: 'Pending'
    });

    // Save the order to the database
    await newOrder.save();

    // Clear the cart in the session after the order is placed
    req.session.cart = [];

    // Send a success response
    res.send('Order placed successfully!');
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).send('Internal server error');
  }
});


// Set the port the app will listen on
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
