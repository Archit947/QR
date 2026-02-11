const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Basic Route
app.get('/', (req, res) => {
  res.send('QR OJT Backend Running');
});

const qrRoutes = require('./routes/qrRoutes');
const contentRoutes = require('./routes/contentRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const statsRoutes = require('./routes/statsRoutes');

app.use('/api/qr', qrRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/stats', statsRoutes);

// Export for Vercel (or other serverless environments)
module.exports = app;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
app.use('/api/employees', employeeRoutes);
app.use('/api/stats', statsRoutes);

// 404 Handler for API
app.use((req, res) => {
    res.status(404).json({ error: `Not Found: ${req.method} ${req.originalUrl}` });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
