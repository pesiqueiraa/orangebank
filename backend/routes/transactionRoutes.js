const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/TransactionController');

// ==================== ROTAS DE CONSULTA ====================

// Buscar transação por ID
router.get('/:id', TransactionController.getTransactionById);

// Buscar transação por transaction_id
router.get('/ref/:transactionId', TransactionController.getByTransactionId);

// Buscar transações por usuário
router.get('/user/:userId', TransactionController.getTransactionsByUser);

// Buscar transações por conta
router.get('/account/:accountId', TransactionController.getTransactionsByAccount);

// Buscar transações por tipo
router.get('/type/:tipo', TransactionController.getTransactionsByType);

// Buscar transações por período
router.post('/date-range', TransactionController.getTransactionsByDateRange);

// ==================== ROTAS DE ESTATÍSTICAS ====================

// Obter estatísticas por usuário
router.get('/stats/user/:userId', TransactionController.getUserTransactionStats);

// Obter volume por tipo
router.post('/stats/volume-by-type', TransactionController.getVolumeByType);

// ==================== ROTAS DE VALIDAÇÃO ====================

// Verificar se transação existe
router.get('/exists/:transactionId', TransactionController.checkTransactionExists);

module.exports = router;