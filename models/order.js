const Order = require('./models/Order'); // Import the Order model

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

    // Redirect to order confirmation page
    res.send('Order placed successfully!');
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).send('Internal server error');
  }
});
