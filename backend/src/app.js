//app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const profileRoutes = require('./routes/profile.routes');

// ۱. CORS
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ۲. Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/bookmarks', require('./routes/bookmark.routes'));
app.use('/api/activity', require('./routes/activity.routes'));

// ۳. فایل‌های استاتیک
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ۴. روت‌ها
const statsRoutes = require('./routes/stats.routes');
const authRoutes = require('./routes/auth.routes');
const businessRoutes = require('./routes/business.routes');
const reviewRoutes = require('./routes/review.routes');
const categoryRoutes = require('./routes/category.routes');
const neshanRoutes = require('./routes/neshan');
const messageRoutes = require('./routes/message.routes');
const notificationRoutes = require('./routes/notification.routes');

app.use('/api/stats', statsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/neshan', neshanRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);
app.get('/api/profile/test', (req, res) => {
  res.json({ success: true, message: 'profile route is working' });
});

// تست موقت
app.post('/api/test-track', (req, res) => {
  console.log('TEST TRACK WORKS');
  res.json({ success: true, message: 'test ok' });
});

// ۵. سرور + Keep Alive
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// این خط جلوی بسته شدن ناخواسته رو می‌گیره
process.stdin.resume();