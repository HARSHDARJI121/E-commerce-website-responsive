// MongoDB connection URI
const dbURI = 'mongodb://localhost:27017/ecommerce'; // Make sure MongoDB is running

// Connect to MongoDB (no need for useNewUrlParser and useUnifiedTopology)
mongoose.connect(dbURI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
  });
