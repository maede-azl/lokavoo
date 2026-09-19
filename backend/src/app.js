require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ============================================
// CORS
// ============================================

app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')
      : 'http://localhost:5173',
    methods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
    credentials: true,
  })
);

// ============================================
// Body Parser
// ============================================

app.use(
  express.json({
    limit: '10mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// ============================================
// Static Files
// ============================================

app.use(
  '/uploads',
  express.static(
    path.join(__dirname, '..', 'uploads')
  )
);

// ============================================
// Routes
// ============================================

app.use(
  '/api/bookmarks',
  require('./routes/bookmark.routes')
);

app.use(
  '/api/activity',
  require('./routes/activity.routes')
);

app.use(
  '/api/auth',
  require('./routes/auth.routes')
);

app.use(
  '/api/businesses',
  require('./routes/business.routes')
);

app.use(
  '/api/categories',
  require('./routes/category.routes')
);

app.use(
  '/api/reviews',
  require('./routes/review.routes')
);

app.use(
  '/api/neshan',
  require('./routes/neshan')
);

app.use(
  '/api/messages',
  require('./routes/message.routes')
);

app.use(
  '/api/notifications',
  require('./routes/notification.routes')
);

app.use(
  '/api/stats',
  require('./routes/stats.routes')
);

app.use(
  '/api/profile',
  require('./routes/profile.routes')
);

app.use(
  '/api/admin',
  require('./routes/admin.routes')
);

app.use(
  '/api/settings',
  require('./routes/settings.routes')
);

app.use(
  '/api/support',
  require('./routes/support.routes')
);

app.use(
  '/api/subscriptions',
  require('./routes/subscription.routes')
);

app.use(
  '/api/payment',
  require('./routes/payment.routes')
);

// ============================================
// Error Handler
// ============================================

app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);

  res.status(500).json({
    success: false,
    message:
      err.message || 'خطای داخلی سرور',
  });
});

// ============================================
// Server
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT}`
  );
});

process.stdin.resume();