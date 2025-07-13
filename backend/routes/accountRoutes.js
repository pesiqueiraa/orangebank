const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/AccountController');

// =============== ROTAS DE CONSULTA ===============

// Novas rotas para portfolio
router.get('/:accountId/position/:assetSymbol', AccountController.getPosition);
router.get('/assets', AccountController.getAvailableAssets);


// Buscar conta por número (para transferências) - deve vir antes de /:userId
router.get('/number/:accountNumber', AccountController.getAccountByNumber);

// Verificar operações pendentes - deve vir antes de /:accountId/history
router.get('/:accountId/pending-operations', AccountController.checkPendingOperations);

// Obter carteira de investimentos
router.get('/:accountId/portfolio', AccountController.getPortfolio);
router.get('/:accountId/portfolio/summary', AccountController.getPortfolioSummary);

// Calcular performance dos investimentos
router.get('/:accountId/performance', AccountController.getInvestmentPerformance);

// Obter histórico de transações
router.get('/:accountId/history', AccountController.getTransactionHistory);

// Gerar relatório de imposto de renda
router.get('/:accountId/tax-report', AccountController.generateTaxReport);

// Buscar conta específica por usuário e tipo
router.get('/:userId/:type', AccountController.getAccountByType);

// Buscar todas as contas de um usuário
router.get('/:userId', AccountController.getUserAccounts);

// ==================== ROTAS DE CRIAÇÃO ====================

// Criar contas para um novo usuário
router.post('/create/:userId', AccountController.createUserAccounts);

// ==================== OPERAÇÕES FINANCEIRAS ====================

// Realizar depósito na conta corrente
router.post('/:accountId/deposit', AccountController.deposit);

// Realizar saque da conta corrente
router.post('/:accountId/withdraw', AccountController.withdraw);

// Realizar transferência entre contas
router.post('/:accountId/transfer', AccountController.transfer);

// Validar valor de transferência
router.post('/:accountId/validate-transfer', AccountController.validateTransfer);

// Gerar extrato da conta
router.post('/:accountId/statement', AccountController.generateStatement);

// ==================== OPERAÇÕES DE INVESTIMENTO ====================

// Comprar ativos
router.post('/:accountId/buy-asset', AccountController.buyAsset);

// Rota para compra de ativos de renda fixa
router.post('/:accountId/buy-fixed-income', AccountController.buyFixedIncome);

// Rota para venda de ativos
router.post('/:accountId/sell-asset', AccountController.sellAsset);

module.exports = router;
