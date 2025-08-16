require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');
const { csrfIfCookieAuth } = require('./middlewares/csrf');


const app = express();

// DB
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('Mongo connected');
}).catch(err => {
  console.error('Mongo connection error', err);
  process.exit(1);
});

// Basic security & parsing
app.use(helmet());
app.use(cors({
  origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','),
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-csrf-token'],
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(csrfIfCookieAuth);


// Routes
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./swagger.json');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api', require('./routes'));

// Health
const dbState = () => ({ connected: mongoose.connection.readyState === 1, readyState: mongoose.connection.readyState });
app.get('/health', (req, res) => res.json({ status: 'ok', db: dbState() }));

// Errors
const { notFound, errorHandler } = require('./middlewares/error');
app.use(notFound);
app.use(errorHandler);

// Start
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
