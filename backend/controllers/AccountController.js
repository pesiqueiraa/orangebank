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
      const { toAccountId, toEmail, amount, isExternal = false } = req.body;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "ID da conta de origem é obrigatório",
        });
      }

      if (!toAccountId && !toEmail) {
        return res.status(400).json({
          success: false,
          message: "ID da conta de destino ou email do destinatário é obrigatório",
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

      let toAccount;
      
      // Handle transfer by email
      if (toEmail) {
        const User = require('../models/User');
        const destinationUser = await User.findByEmail(toEmail);
        if (!destinationUser) {
          return res.status(404).json({
            success: false,
            message: "Usuário de destino não encontrado",
          });
        }

        // Get the user's "corrente" account
        toAccount = await Account.findByUserIdAndType(destinationUser.id, 'corrente');
        if (!toAccount) {
          return res.status(404).json({
            success: false,
            message: "Conta de destino não encontrada",
          });
        }
      } 
      // Handle transfer by account ID
      else {
        toAccount = await Account.findById(toAccountId);
        if (!toAccount) {
          return res.status(404).json({
            success: false,
            message: "Conta de destino não encontrada",
          });
        }
      }

      // Determine if this is an external transfer
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
   * Comprar ações
   * POST /api/accounts/:accountId/buy-asset
   */
  static async buyAsset(req, res) {
    try {
      const { accountId } = req.params;
      const { assetId, quantity, price } = req.body;
      
      // Log para depuração
      console.log('Parâmetros recebidos:', { accountId, assetId, quantity, price });

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "ID da conta é obrigatório"
        });
      }

      if (!assetId) {
        return res.status(400).json({
          success: false,
          message: "ID do ativo é obrigatório"
        });
      }
      
      if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantidade deve ser um número maior que zero"
        });
      }

      if (!price || isNaN(Number(price)) || Number(price) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Preço deve ser um número maior que zero"
        });
      }

      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada"
        });
      }

      // Converter para número
      const result = await account.buyStockAsset(
        assetId,
        Number(quantity),
        Number(price)
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao comprar ativo:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Comprar ativo de renda fixa
   * POST /api/accounts/:accountId/buy-fixed-income
   */
  static async buyFixedIncome(req, res) {
    try {
      const { accountId } = req.params;
      const { fixedIncomeId, amount } = req.body;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "ID da conta é obrigatório",
        });
      }

      if (!fixedIncomeId || !amount) {
        return res.status(400).json({
          success: false,
          message: "ID do ativo de renda fixa e valor são obrigatórios",
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valor deve ser maior que zero",
        });
      }

      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada",
        });
      }

      const result = await account.buyFixedIncome(
        fixedIncomeId,
        parseFloat(amount)
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

  /**
   * Obter resumo da carteira de investimentos (dados consolidados)
   * GET /api/accounts/:accountId/portfolio/summary
   */
  static async getPortfolioSummary(req, res) {
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
      
      // Obter resumo através do modelo
      const summary = await account.getPortfolioSummary();

      return res.status(200).json({
        success: true,
        message: "Resumo do portfólio obtido com sucesso",
        data: summary
      });
    } catch (error) {
      console.error("Erro ao obter resumo do portfólio:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao obter resumo do portfólio",
        error: error.message
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
  /**
   * Obter todos os ativos disponíveis (ações e renda fixa)
   * GET /api/accounts/assets
   */
  static async getAvailableAssets(req, res) {
    try {
      const allAssets = await Account.getAvailableAssets();
      
      return res.status(200).json({
        success: true,
        message: "Ativos disponíveis recuperados com sucesso",
        data: allAssets
      });
    } catch (error) {
      console.error("Erro ao buscar ativos disponíveis:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar ativos disponíveis",
        error: error.message
      });
    }
  }

  /**
   * Vender ações
   * POST /api/accounts/:accountId/sell-asset
   */
  static async sellAsset(req, res) {
    try {
      const { accountId } = req.params;
      const { assetSymbol, quantity, currentPrice } = req.body;
      
      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "ID da conta é obrigatório"
        });
      }

      if (!assetSymbol) {
        return res.status(400).json({
          success: false,
          message: "Símbolo do ativo é obrigatório"
        });
      }
      
      if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantidade deve ser um número maior que zero"
        });
      }

      if (!currentPrice || isNaN(Number(currentPrice)) || Number(currentPrice) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Preço deve ser um número maior que zero"
        });
      }

      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Conta não encontrada"
        });
      }

      // Converter para número
      const result = await account.sellAsset(
        assetSymbol,
        Number(quantity),
        Number(currentPrice)
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao vender ativo:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = AccountController;
