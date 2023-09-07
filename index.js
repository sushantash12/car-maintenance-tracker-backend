const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken } = require('./middleware/auth');
var cors = require('cors');

// routes
const vehicleRoutes = require('./routes/vehicles');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const providerRoutes = require('./routes/providers');
const appointments = require('./routes/appointments');
const maintenanceRecords = require('./routes/maintenanceRecords');

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Welcome to the Car Maintenance Tracker API!');
});

// Connect to MongoDB using Mongoose
mongoose.connect('mongodb+srv://sushantashish3:mYnJvUM0hsIJCc4I@cluster0.rbdvcua.mongodb.net/?retryWrites=true&w=majority', {
  dbName:"car_maintenance_tracker",
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB database');
});


// app.use((req, res, next) => {
//     req.db = db;
//     next();
//   });

app.use('/users', userRoutes(db));
app.use('/admin', adminRoutes(db));
app.use('/vehicles', authenticateToken, vehicleRoutes(db));
app.use('/providers', authenticateToken, providerRoutes(db));
app.use('/appointments', authenticateToken, appointments(db));
app.use('/maintenanceRecords', authenticateToken, maintenanceRecords(db));


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

