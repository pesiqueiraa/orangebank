const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

class TransactionController {
  
  // ==================== MÉTODOS DE CONSULTA ====================

  /**
   * Buscar transação por ID
   * GET /api/transactions/:id
   */
  static async getTransactionById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID da transação é obrigatório"
        });
      }

      const transaction = await Transaction.findById(id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transação não encontrada"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Transação encontrada com sucesso",
        data: transaction
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar transação",
        error: error.message
      });
    }
  }

  /**
   * Buscar transação por transaction_id
   * GET /api/transactions/ref/:transactionId
   */
  static async getByTransactionId(req, res) {
    try {
      const { transactionId } = req.params;

      if (!transactionId) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID é obrigatório"
        });
      }

      const transaction = await Transaction.findByTransactionId(transactionId);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transação não encontrada"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Transação encontrada com sucesso",
        data: transaction
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar transação",
        error: error.message
      });
    }
  }

  /**
   * Buscar transações por usuário
   * GET /api/transactions/user/:userId?limit=20&offset=0
   */
  static async getTransactionsByUser(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "ID do usuário é obrigatório"
        });
      }

      const transactions = await Transaction.findByUserId(
        userId, 
        parseInt(limit), 
        parseInt(offset)
      );

      return res.status(200).json({
        success: true,
        message: "Transações listadas com sucesso",
        data: transactions,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: transactions.length
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar transações do usuário",
        error: error.message
      });
    }
  }

  /**
   * Buscar transações por conta
   * GET /api/transactions/account/:accountId?limit=20&offset=0
   */
  static async getTransactionsByAccount(req, res) {
    try {
      const { accountId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "ID da conta é obrigatório"
        });
      }

      // Verificar se a conta existe
      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada"
        });
      }

      const transactions = await Transaction.findByAccountId(
        accountId, 
        parseInt(limit), 
        parseInt(offset)
      );

      return res.status(200).json({
        success: true,
        message: "Transações da conta listadas com sucesso",
        data: transactions,
        accountInfo: {
          id: account.id,
          type: account.type,
          balance: account.balance
        },
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: transactions.length
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar transações da conta",
        error: error.message
      });
    }
  }

  /**
   * Buscar transações por tipo
   * GET /api/transactions/type/:tipo?limit=50
   */
  static async getTransactionsByType(req, res) {
    try {
      const { tipo } = req.params;
      const { limit = 50 } = req.query;

      if (!tipo) {
        return res.status(400).json({
          success: false,
          message: "Tipo da transação é obrigatório"
        });
      }

      const validTypes = [
        'depósito', 'saque', 'transferência_interna', 'transferência_externa',
        'recebimento_interna', 'recebimento_externo', 'compra_ativo', 'venda_ativo'
      ];

      if (!validTypes.includes(tipo)) {
        return res.status(400).json({
          success: false,
          message: "Tipo de transação inválido",
          validTypes: validTypes
        });
      }

      const transactions = await Transaction.findByType(tipo, parseInt(limit));

      return res.status(200).json({
        success: true,
        message: `Transações do tipo ${tipo} listadas com sucesso`,
        data: transactions,
        total: transactions.length,
        type: tipo
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar transações por tipo",
        error: error.message
      });
    }
  }

  /**
   * Buscar transações por período
   * POST /api/transactions/date-range
   */
  static async getTransactionsByDateRange(req, res) {
    try {
      const { startDate, endDate, userId, accountId } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Data inicial e final são obrigatórias"
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: "Data inicial deve ser menor que a data final"
        });
      }

      const transactions = await Transaction.findByDateRange(
        start, 
        end, 
        userId, 
        accountId
      );

      return res.status(200).json({
        success: true,
        message: "Transações do período listadas com sucesso",
        data: transactions,
        period: {
          startDate: start,
          endDate: end
        },
        filters: {
          userId: userId || null,
          accountId: accountId || null
        },
        total: transactions.length
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar transações por período",
        error: error.message
      });
    }
  }

  // ==================== MÉTODOS DE ESTATÍSTICAS ====================

  /**
   * Obter estatísticas de transações por usuário
   * GET /api/transactions/stats/user/:userId?year=2024
   */
  static async getUserTransactionStats(req, res) {
    try {
      const { userId } = req.params;
      const { year } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "ID do usuário é obrigatório"
        });
      }

      const stats = await Transaction.getStatisticsByUser(
        userId, 
        year ? parseInt(year) : null
      );

      return res.status(200).json({
        success: true,
        message: "Estatísticas obtidas com sucesso",
        data: stats
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao obter estatísticas do usuário",
        error: error.message
      });
    }
  }

  /**
   * Obter volume de transações por tipo
   * POST /api/transactions/stats/volume-by-type
   */
  static async getVolumeByType(req, res) {
    try {
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Data inicial e final são obrigatórias"
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      const volumeStats = await Transaction.getVolumeByType(start, end);

      return res.status(200).json({
        success: true,
        message: "Volume por tipo obtido com sucesso",
        data: volumeStats,
        period: {
          startDate: start,
          endDate: end
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao obter volume por tipo",
        error: error.message
      });
    }
  }

  // ==================== MÉTODOS DE VALIDAÇÃO ====================

  /**
   * Verificar se transação existe
   * GET /api/transactions/exists/:transactionId
   */
  static async checkTransactionExists(req, res) {
    try {
      const { transactionId } = req.params;

      if (!transactionId) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID é obrigatório"
        });
      }

      const exists = await Transaction.exists(transactionId);

      return res.status(200).json({
        success: true,
        message: "Verificação concluída",
        data: {
          transactionId,
          exists
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro na verificação",
        error: error.message
      });
    }
  }
}

module.exports = TransactionController;