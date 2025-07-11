const Account = require("../models/Account");

class AccountController {
  // ==================== MÉTODOS DE CONSULTA ====================

  /**
   * Buscar todas as contas de um usuário
   * GET /api/accounts/:userId
   */
  static async getUserAccounts(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "ID do usuário é obrigatório",
        });
      }

      const accounts = await Account.findByUserId(userId);

      return res.status(200).json({
        success: true,
        message: "Contas encontradas com sucesso",
        data: accounts,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      });
    }
  }

  /**
   * Buscar conta específica por usuário e tipo
   * GET /api/accounts/:userId/:type
   */
  static async getAccountByType(req, res) {
    try {
      const { userId, type } = req.params;

      if (!userId || !type) {
        return res.status(400).json({
          success: false,
          message: "ID do usuário e tipo da conta são obrigatórios",
        });
      }

      if (!["corrente", "investimento"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Tipo de conta inválido. Use 'corrente' ou 'investimento'",
        });
      }

      const account = await Account.findByUserIdAndType(userId, type);

      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Conta encontrada com sucesso",
        data: account,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      });
    }
  }

  /**
   * Buscar conta por número (para transferências)
   * GET /api/accounts/number/:accountNumber
   */
  static async getAccountByNumber(req, res) {
    try {
      const { accountNumber } = req.params;

      if (!accountNumber) {
        return res.status(400).json({
          success: false,
          message: "Número da conta é obrigatório",
        });
      }

      const account = await Account.findByAccountNumber(accountNumber);

      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada",
        });
      }

      // Retornar apenas informações básicas para segurança
      return res.status(200).json({
        success: true,
        message: "Conta encontrada",
        data: {
          id: account.id,
          type: account.type,
          exists: true,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      });
    }
  }

  /**
   * Criar contas para um novo usuário
   * POST /api/accounts/create/:userId
   */
  static async createUserAccounts(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "ID do usuário é obrigatório",
        });
      }

      const accounts = await Account.createAccountsForUser(userId);

      return res.status(201).json({
        success: true,
        message: "Contas criadas com sucesso",
        data: accounts,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao criar contas",
        error: error.message,
      });
    }
  }

  // ==================== OPERAÇÕES FINANCEIRAS ====================

  /**
   * Realizar depósito na conta corrente
   * POST /api/accounts/:accountId/deposit
   */
  static async deposit(req, res) {
    try {
      const { accountId } = req.params;
      const { amount } = req.body;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "ID da conta é obrigatório",
        });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valor do depósito deve ser maior que zero",
        });
      }

      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada",
        });
      }

      const result = await account.deposit(parseFloat(amount));

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Realizar saque da conta corrente
   * POST /api/accounts/:accountId/withdraw
   */
  static async withdraw(req, res) {
    try {
      const { accountId } = req.params;
      const { amount } = req.body;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "ID da conta é obrigatório",
        });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valor do saque deve ser maior que zero",
        });
      }

      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada",
        });
      }

      const result = await account.withdraw(parseFloat(amount));

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Realizar transferência entre contas
   * POST /api/accounts/:accountId/transfer
   */
  static async transfer(req, res) {
    try {
      const { accountId } = req.params;
      const { toAccountId, amount, isExternal = false } = req.body;

      if (!accountId || !toAccountId) {
        return res.status(400).json({
          success: false,
          message: "IDs das contas são obrigatórios",
        });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valor da transferência deve ser maior que zero",
        });
      }

      const fromAccount = await Account.findById(accountId);
      if (!fromAccount) {
        return res.status(404).json({
          success: false,
          message: "Conta de origem não encontrada",
        });
      }

      const toAccount = await Account.findById(toAccountId);
      if (!toAccount) {
        return res.status(404).json({
          success: false,
          message: "Conta de destino não encontrada",
        });
      }

      // Determinar se é transferência externa
      const external = fromAccount.userId !== toAccount.userId;

      const result = await fromAccount.transfer(
        toAccount,
        parseFloat(amount),
        external
      );

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ==================== OPERAÇÕES DE INVESTIMENTO ====================

  /**
   * Comprar ativos
   * POST /api/accounts/:accountId/buy-asset
   */
  static async buyAsset(req, res) {
    try {
      const { accountId } = req.params;
      const { assetSymbol, quantity, price } = req.body;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "ID da conta é obrigatório",
        });
      }

      if (!assetSymbol || !quantity || !price) {
        return res.status(400).json({
          success: false,
          message: "Símbolo do ativo, quantidade e preço são obrigatórios",
        });
      }

      if (quantity <= 0 || price <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantidade e preço devem ser maiores que zero",
        });
      }

      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada",
        });
      }

      const result = await account.buyAsset(
        assetSymbol,
        parseFloat(quantity),
        parseFloat(price)
      );

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Vender ativos
   * POST /api/accounts/:accountId/sell-asset
   */
  static async sellAsset(req, res) {
    try {
      const { accountId } = req.params;
      const { assetSymbol, quantity, currentPrice } = req.body;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "ID da conta é obrigatório",
        });
      }

      if (!assetSymbol || !quantity || !currentPrice) {
        return res.status(400).json({
          success: false,
          message:
            "Símbolo do ativo, quantidade e preço atual são obrigatórios",
        });
      }

      if (quantity <= 0 || currentPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantidade e preço devem ser maiores que zero",
        });
      }

      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada",
        });
      }

      const result = await account.sellAsset(
        assetSymbol,
        parseFloat(quantity),
        parseFloat(currentPrice)
      );

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Obter carteira de investimentos
   * GET /api/accounts/:accountId/portfolio
   */
  static async getPortfolio(req, res) {
    try {
      const { accountId } = req.params;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "ID da conta é obrigatório",
        });
      }

      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada",
        });
      }

      const portfolio = await account.getPortfolio();

      return res.status(200).json({
        success: true,
        message: "Carteira obtida com sucesso",
        data: portfolio,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao obter carteira",
        error: error.message,
      });
    }
  }

  /**
   * Calcular performance dos investimentos
   * GET /api/accounts/:accountId/performance
   */
  static async getInvestmentPerformance(req, res) {
    try {
      const { accountId } = req.params;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "ID da conta é obrigatório",
        });
      }

      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada",
        });
      }

      const performance = await account.calculateInvestmentPerformance();

      return res.status(200).json({
        success: true,
        message: "Performance calculada com sucesso",
        data: performance,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ==================== HISTÓRICO E RELATÓRIOS ====================

  /**
   * Obter histórico de transações
   * GET /api/accounts/:accountId/history?limit=10
   */
  static async getTransactionHistory(req, res) {
    try {
      const { accountId } = req.params;
      const { limit = 10 } = req.query;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "ID da conta é obrigatório",
        });
      }

      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada",
        });
      }

      const history = await account.getTransactionHistory(parseInt(limit));

      return res.status(200).json({
        success: true,
        message: "Histórico obtido com sucesso",
        data: history,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao obter histórico",
        error: error.message,
      });
    }
  }

  /**
   * Gerar relatório de imposto de renda
   * GET /api/accounts/:accountId/tax-report?year=2024
   */
  static async generateTaxReport(req, res) {
    try {
      const { accountId } = req.params;
      const { year = new Date().getFullYear() } = req.query;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "ID da conta é obrigatório",
        });
      }

      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada",
        });
      }

      const report = await account.generateTaxReport(parseInt(year));

      return res.status(200).json({
        success: true,
        message: "Relatório de IR gerado com sucesso",
        data: report,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao gerar relatório de IR",
        error: error.message,
      });
    }
  }

  /**
   * Gerar extrato da conta
   * POST /api/accounts/:accountId/statement
   */
  static async generateStatement(req, res) {
    try {
      const { accountId } = req.params;
      const { startDate, endDate } = req.body;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "ID da conta é obrigatório",
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Data inicial e final são obrigatórias",
        });
      }

      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada",
        });
      }

      const statement = await account.generateStatement(
        new Date(startDate),
        new Date(endDate)
      );

      return res.status(200).json({
        success: true,
        message: "Extrato gerado com sucesso",
        data: statement,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao gerar extrato",
        error: error.message,
      });
    }
  }

  // ==================== MÉTODOS DE VALIDAÇÃO ====================

  /**
   * Validar valor de transferência
   * POST /api/accounts/:accountId/validate-transfer
   */
  static async validateTransfer(req, res) {
    try {
      const { accountId } = req.params;
      const { amount } = req.body;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "ID da conta é obrigatório",
        });
      }

      if (!amount) {
        return res.status(400).json({
          success: false,
          message: "Valor é obrigatório",
        });
      }

      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada",
        });
      }

      const validation = account.validateTransferAmount(parseFloat(amount));

      return res.status(200).json({
        success: true,
        data: validation,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro na validação",
        error: error.message,
      });
    }
  }

  /**
   * Verificar operações pendentes
   * GET /api/accounts/:accountId/pending-operations
   */
  static async checkPendingOperations(req, res) {
    try {
      const { accountId } = req.params;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "ID da conta é obrigatório",
        });
      }

      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada",
        });
      }

      const hasPending = await account.checkPendingOperations();

      return res.status(200).json({
        success: true,
        message: "Verificação concluída",
        data: {
          hasPendingOperations: hasPending,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro na verificação",
        error: error.message,
      });
    }
  }
  /**
   * Buscar posição específica de um ativo
   * GET /api/accounts/:accountId/position/:assetSymbol
   */
  static async getPosition(req, res) {
    try {
      const { accountId, assetSymbol } = req.params;

      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada",
        });
      }

      const position = await account.getPosition(assetSymbol);

      if (!position) {
        return res.status(404).json({
          success: false,
          message: "Posição não encontrada no portfólio",
        });
      }

      const pnl = await account.getPositionPnL(assetSymbol);

      res.json({
        success: true,
        data: {
          position,
          pnl,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  /**   * Buscar todos os ativos disponíveis
   * GET /api/accounts/available-assets
   */
  static async getAvailableAssets(req, res) {
    try {
      const { type } = req.query; // 'ação' ou 'renda fixa'

      let query;
      let params = [];

      if (type === "ação") {
        query = `
          SELECT 
            a.id,
            a.nome,
            a.tipo,
            a.categoria,
            s.symbol,
            s.current_price,
            s.daily_variation
          FROM assets a
          JOIN stocks s ON s.asset_id = a.id
          WHERE a.tipo = 'ação'
          ORDER BY a.categoria, a.nome
        `;
      } else if (type === "renda fixa") {
        query = `
          SELECT 
            a.id,
            a.nome,
            a.tipo,
            a.categoria,
            fi.id as symbol,
            fi.name,
            fi.rate,
            fi.rate_type,
            fi.maturity,
            fi.minimum_investment
          FROM assets a
          JOIN fixed_income fi ON fi.asset_id = a.id
          WHERE a.tipo = 'renda fixa'
          ORDER BY fi.maturity, a.nome
        `;
      } else {
        query = `
          SELECT 
            a.id,
            a.nome,
            a.tipo,
            a.categoria,
            COALESCE(s.symbol, fi.id) as symbol,
            s.current_price,
            s.daily_variation,
            fi.rate,
            fi.rate_type,
            fi.maturity,
            fi.minimum_investment
          FROM assets a
          LEFT JOIN stocks s ON s.asset_id = a.id
          LEFT JOIN fixed_income fi ON fi.asset_id = a.id
          ORDER BY a.tipo, a.categoria, a.nome
        `;
      }

      const result = await db.query(query, params);

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = AccountController;
