const express = require('express');
const router = express.Router();

const transactionRoutes = require('./transactionRoutes');
const usersRoutes = require('./userRoutes');
const accountRoutes = require('./accountRoutes');

router.use('/users', usersRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);


module.exports = router;
