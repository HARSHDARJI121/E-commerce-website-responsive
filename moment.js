const moment = require('moment');  // Require moment.js for date formatting

// Route to add a new product
app.post('/api/products', (req, res) => {
  const { name, image, size, retail_price, distribution_price, short_description, category } = req.body;

  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' '); 
  // The above code converts to the format 'YYYY-MM-DD HH:MM:SS'
  
  // Insert into the query
  const query = `
    INSERT INTO products (name, image, size, retail_price, distribution_price, short_description, category, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  connection.query(query, [name, image, size, retail_price, distribution_price, short_description, category, createdAt], (err, result) => {
    if (err) {
      console.error("Error adding product: ", err);
      return res.status(500).send(`Error adding product: ${err.message}`);
    }
    return res.status(200).send('Product added successfully!');
  });
  
  
});
