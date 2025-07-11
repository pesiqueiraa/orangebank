const express = require('express');
const router = express.Router();

const usersRoutes = require('./userRoutes');
const accountRoutes = require('./accountRoutes');

router.use('/users', usersRoutes);
router.use('/accounts', accountRoutes);

module.exports = router;
