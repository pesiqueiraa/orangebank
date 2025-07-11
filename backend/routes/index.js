const express = require('express');
const router = express.Router();

const usersRoutes = require('./userRoutes');

router.use('/users', usersRoutes);

module.exports = router;
