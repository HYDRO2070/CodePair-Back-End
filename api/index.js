// api/index.js
require('dotenv').config();
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/test', (req, res) => {
    res.status(200).json({ message: 'Test successful!' });
});

app.get('/', (req, res) => {
    res.send('Welcome to the simple API!');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
