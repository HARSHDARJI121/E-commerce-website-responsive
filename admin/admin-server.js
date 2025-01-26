const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Initialize the app
const app = express();
const port = 3000; // Change to your desired port

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ecommerce', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Database connection failed:', err));

// Define Product schema and model
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  size: { type: String, required: true },
  retail_price: { type: Number, required: true },
  distribution_price: { type: Number, required: true },
  short_description: { type: String, required: true },
  category: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

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
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Error fetching products' });
  }
});

// Route to add a new product
app.post('/api/products', async (req, res) => {
  const { name, image, size, retail_price, distribution_price, short_description, category } = req.body;

  if (!name || !image || !size || !retail_price || !distribution_price || !short_description || !category) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const product = new Product({
    name,
    image,
    size,
    retail_price,
    distribution_price,
    short_description,
    category
  });

  try {
    const newProduct = await product.save();
    res.status(201).json({ message: 'Product added successfully', productId: newProduct._id });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ error: 'Error adding product' });
  }
});

// Route to update an existing product
app.put('/api/products/:id', async (req, res) => {
  const { name, image, size, retail_price, distribution_price, short_description, category } = req.body;
  const productId = req.params.id;

  if (!name || !image || !size || !retail_price || !distribution_price || !short_description || !category) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { name, image, size, retail_price, distribution_price, short_description, category },
      { new: true } // To return the updated document
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Error updating product' });
  }
});

// Route to delete a product
app.delete('/api/products/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Error deleting product' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Admin server running on http://localhost:${port}/admin`);
});
