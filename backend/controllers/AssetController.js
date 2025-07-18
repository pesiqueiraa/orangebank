const Asset = require("../models/Asset");
const User = require('../models/User');
const recompensas = require('../config/recompensas');

class AssetController {
  // ==================== LISTAGEM E BUSCA DE ATIVOS ====================

  /**
   * Listar todos os ativos
   * GET /api/assets
   */
  static async getAllAssets(req, res) {
    try {
      const assets = await Asset.getAllAssets();

      return res.status(200).json({
        success: true,
        message: "Ativos listados com sucesso",
        data: assets,
        total: assets.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao listar ativos",
        error: error.message,
      });
    }
  }

  /**
   * Buscar ativos por termo de pesquisa
   * GET /api/assets/search?q=termo
   */
  static async searchAssets(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Termo de busca é obrigatório",
          example: "/api/assets/search?q=BOIB3",
        });
      }

      const assets = await Asset.searchAssets(q.trim());

      return res.status(200).json({
        success: true,
        message: `Busca realizada para: "${q}"`,
        data: assets,
        total: assets.length,
        searchTerm: q.trim(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar ativos",
        error: error.message,
      });
    }
  }

  /**
   * Buscar ativos com filtros avançados
   * POST /api/assets/search-advanced
   */
  static async searchAssetsAdvanced(req, res) {
    try {
      const filters = req.body;

      const assets = await Asset.searchAssetsWithFilters(filters);

      return res.status(200).json({
        success: true,
        message: "Busca avançada realizada com sucesso",
        data: assets,
        total: assets.length,
        filters: filters,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro na busca avançada",
        error: error.message,
      });
    }
  }

  /**
   * Buscar ativos por categoria
   * GET /api/assets/category/:categoria
   */
  static async getAssetsByCategory(req, res) {
    try {
      const { categoria } = req.params;

      if (!categoria) {
        return res.status(400).json({
          success: false,
          message: "Categoria é obrigatória",
        });
      }

      const assets = await Asset.findByCategory(categoria);

      return res.status(200).json({
        success: true,
        message: `Ativos da categoria ${categoria} listados com sucesso`,
        data: assets,
        total: assets.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar ativos por categoria",
        error: error.message,
      });
    }
  }

  /**
   * Buscar ativos por tipo
   * GET /api/assets/type/:tipo
   */
  static async getAssetsByType(req, res) {
    try {
      const { tipo } = req.params;

      if (!tipo) {
        return res.status(400).json({
          success: false,
          message: "Tipo é obrigatório",
        });
      }

      const assets = await Asset.findByType(tipo);

      return res.status(200).json({
        success: true,
        message: `Ativos do tipo ${tipo} listados com sucesso`,
        data: assets,
        total: assets.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar ativos por tipo",
        error: error.message,
      });
    }
  }
  // ==================== AÇÕES (RENDA VARIÁVEL) ====================

  /**
   * Listar todas as ações com preços
   * GET /api/assets/stocks
   */
  static async getAllStocks(req, res) {
    try {
      const stocks = await Asset.getStocksWithPrices();

      return res.status(200).json({
        success: true,
        message: "Ações listadas com sucesso",
        data: stocks,
        total: stocks.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao listar ações",
        error: error.message,
      });
    }
  }
  /**
   * Buscar ação por símbolo
   * GET /api/assets/stocks/:symbol
   */
  static async getStockBySymbol(req, res) {
    try {
      const { symbol } = req.params;

      if (!symbol) {
        return res.status(400).json({
          success: false,
          message: "Símbolo é obrigatório",
        });
      }

      const stock = await Asset.findBySymbol(symbol.toUpperCase());

      if (!stock) {
        return res.status(404).json({
          success: false,
          message: "Ação não encontrada",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Ação encontrada com sucesso",
        data: stock,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar ação",
        error: error.message,
      });
    }
  }
  // ==================== RENDA FIXA ====================

  /**
   * Listar todos os produtos de renda fixa
   * GET /api/assets/fixed-income
   */
  static async getAllFixedIncomes(req, res) {
    try {
      const products = await Asset.getAllFixedIncomes();

      return res.status(200).json({
        success: true,
        message: "Produtos de renda fixa listados com sucesso",
        data: products,
        total: products.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao listar produtos de renda fixa",
        error: error.message,
      });
    }
  }
  /**
   * Buscar produto de renda fixa por ID
   * GET /api/assets/fixed-income/:id
   */
  static async getFixedIncomeById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID do produto é obrigatório",
        });
      }

      const product = await Asset.getFixedIncomeById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Produto de renda fixa não encontrado",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Produto encontrado com sucesso",
        data: product,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar produto de renda fixa",
        error: error.message,
      });
    }
  }
  /**
   * Buscar produtos de renda fixa por categoria
   * GET /api/assets/fixed-income/category/:categoria
   */
  static async getFixedIncomesByCategory(req, res) {
    try {
      const { categoria } = req.params;

      if (!categoria) {
        return res.status(400).json({
          success: false,
          message: "Categoria é obrigatória",
        });
      }

      const products = await Asset.getFixedIncomesByCategory(categoria);

      return res.status(200).json({
        success: true,
        message: `Produtos de renda fixa da categoria ${categoria} listados com sucesso`,
        data: products,
        total: products.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar produtos por categoria",
        error: error.message,
      });
    }
  }
  /**
   * Buscar produtos de renda fixa por tipo de taxa
   * GET /api/assets/fixed-income/rate-type/:rateType
   */
  static async getFixedIncomesByRateType(req, res) {
    try {
      const { rateType } = req.params;

      if (!rateType || !["pre", "pos"].includes(rateType)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de taxa deve ser "pre" ou "pos"',
        });
      }

      const products = await Asset.getFixedIncomesByRateType(rateType);

      return res.status(200).json({
        success: true,
        message: `Produtos ${rateType}-fixados listados com sucesso`,
        data: products,
        total: products.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar produtos por tipo de taxa",
        error: error.message,
      });
    }
  }

  /**
   * Buscar produtos por faixa de investimento mínimo
   * GET /api/assets/fixed-income/investment-range?min=1000&max=5000
   */
  static async getFixedIncomesByInvestmentRange(req, res) {
    try {
      const { min, max } = req.query;

      if (!min) {
        return res.status(400).json({
          success: false,
          message: "Valor mínimo é obrigatório",
        });
      }

      const minAmount = parseFloat(min);
      const maxAmount = max ? parseFloat(max) : null;

      if (minAmount <= 0 || (maxAmount && maxAmount <= 0)) {
        return res.status(400).json({
          success: false,
          message: "Valores devem ser maiores que zero",
        });
      }

      const products = await Asset.getFixedIncomesByInvestmentRange(
        minAmount,
        maxAmount
      );

      return res.status(200).json({
        success: true,
        message: "Produtos na faixa de investimento listados com sucesso",
        data: products,
        total: products.length,
        filter: {
          minAmount,
          maxAmount,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar produtos por faixa de investimento",
        error: error.message,
      });
    }
  }
  /**
   * Calcular rendimento projetado de renda fixa
   * POST /api/assets/fixed-income/calculate-return
   */
  static async calculateFixedIncomeReturn(req, res) {
    try {
      const { principal, annualRate, maturityDate } = req.body;

      if (!principal || !annualRate || !maturityDate) {
        return res.status(400).json({
          success: false,
          message:
            "Valor principal, taxa anual e data de vencimento são obrigatórios",
        });
      }

      if (principal <= 0 || annualRate <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valor principal e taxa devem ser maiores que zero",
        });
      }

      const calculation = Asset.calculateFixedIncomeReturn(
        parseFloat(principal),
        parseFloat(annualRate),
        maturityDate
      );

      return res.status(200).json({
        success: true,
        message: "Rendimento calculado com sucesso",
        data: calculation,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao calcular rendimento",
        error: error.message,
      });
    }
  }
  /**
   * Validar investimento mínimo
   * POST /api/assets/fixed-income/validate-investment
   */
  static async validateMinimumInvestment(req, res) {
    try {
      const { fixedIncomeId, amount } = req.body;

      if (!fixedIncomeId || !amount) {
        return res.status(400).json({
          success: false,
          message: "ID do produto e valor são obrigatórios",
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valor deve ser maior que zero",
        });
      }

      const validation = await Asset.validateMinimumInvestment(
        fixedIncomeId,
        parseFloat(amount)
      );

      return res.status(200).json({
        success: true,
        message: "Validação realizada com sucesso",
        data: validation,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao validar investimento mínimo",
        error: error.message,
      });
    }
  }

  /**
   * Simular variação de mercado para todas as ações
   * POST /api/assets/market/simulate
   */
  static async simulateMarketVariation(req, res) {
    try {
      const result = await Asset.simulateMarketVariation();

      return res.status(200).json({
        success: true,
        message: "Simulação de mercado executada com sucesso",
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao simular variação de mercado",
        error: error.message,
      });
    }
  }

  /**
   * Atualizar preço de uma ação específica
   * PUT /api/assets/stocks/:assetId/price
   */
  static async updateStockPrice(req, res) {
    try {
      const { assetId } = req.params;
      const { newPrice } = req.body;

      if (!assetId || !newPrice) {
        return res.status(400).json({
          success: false,
          message: "ID do ativo e novo preço são obrigatórios",
        });
      }

      if (newPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "Preço deve ser maior que zero",
        });
      }

      const result = await Asset.updateStockPrice(
        assetId,
        parseFloat(newPrice)
      );

      return res.status(200).json({
        success: true,
        message: "Preço atualizado com sucesso",
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao atualizar preço",
        error: error.message,
      });
    }
  }
  // ==================== CÁLCULOS DE IMPOSTOS ====================

  /**
   * Calcular imposto para venda de ações
   * POST /api/assets/calculate-stock-tax
   */
  static async calculateStockTax(req, res) {
    try {
      const { sellPrice, buyPrice, quantity } = req.body;

      if (!sellPrice || !buyPrice || !quantity) {
        return res.status(400).json({
          success: false,
          message:
            "Preço de venda, preço de compra e quantidade são obrigatórios",
        });
      }

      if (sellPrice <= 0 || buyPrice <= 0 || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Todos os valores devem ser maiores que zero",
        });
      }

      const calculation = Asset.calculateStockTax(
        parseFloat(sellPrice),
        parseFloat(buyPrice),
        parseFloat(quantity)
      );

      return res.status(200).json({
        success: true,
        message: "Imposto calculado com sucesso",
        data: calculation,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao calcular imposto de ações",
        error: error.message,
      });
    }
  }

  /**
   * Calcular imposto para resgate de renda fixa
   * POST /api/assets/calculate-fixed-income-tax
   */
  static async calculateFixedIncomeTax(req, res) {
    try {
      const { redeemValue, investedValue } = req.body;

      if (!redeemValue || !investedValue) {
        return res.status(400).json({
          success: false,
          message: "Valor de resgate e valor investido são obrigatórios",
        });
      }

      if (redeemValue <= 0 || investedValue <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valores devem ser maiores que zero",
        });
      }

      const calculation = Asset.calculateFixedIncomeTax(
        parseFloat(redeemValue),
        parseFloat(investedValue)
      );

      return res.status(200).json({
        success: true,
        message: "Imposto calculado com sucesso",
        data: calculation,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao calcular imposto de renda fixa",
        error: error.message,
      });
    }
  }
  // ==================== RELATÓRIOS E ESTATÍSTICAS ====================

  /**
   * Obter estatísticas gerais dos ativos
   * GET /api/assets/statistics
   */
  static async getStatistics(req, res) {
    try {
      const stats = await Asset.getStatistics();

      return res.status(200).json({
        success: true,
        message: "Estatísticas obtidas com sucesso",
        data: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao obter estatísticas",
        error: error.message,
      });
    }
  }

  /**
   * Obter distribuição por categoria
   * GET /api/assets/category-distribution
   */
  static async getCategoryDistribution(req, res) {
    try {
      const distribution = await Asset.getCategoryDistribution();

      return res.status(200).json({
        success: true,
        message: "Distribuição por categoria obtida com sucesso",
        data: distribution,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao obter distribuição por categoria",
        error: error.message,
      });
    }
  }
  /**
   * Listar todas as categorias disponíveis
   * GET /api/assets/categories
   */
  static async getAllCategories(req, res) {
    try {
      const categories = await Asset.getAllCategories();

      return res.status(200).json({
        success: true,
        message: "Categorias listadas com sucesso",
        data: categories,
        total: categories.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao listar categorias",
        error: error.message,
      });
    }
  }
  /**
   * Buscar produtos próximos ao vencimento
   * GET /api/assets/fixed-income/near-maturity?days=30
   */
  static async getFixedIncomesNearMaturity(req, res) {
    try {
      const { days } = req.query;
      const daysToMaturity = days ? parseInt(days) : 30;

      if (daysToMaturity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Número de dias deve ser maior que zero",
        });
      }

      const products = await Asset.getFixedIncomesNearMaturity(daysToMaturity);

      return res.status(200).json({
        success: true,
        message: `Produtos próximos ao vencimento (${daysToMaturity} dias) listados com sucesso`,
        data: products,
        total: products.length,
        daysFilter: daysToMaturity,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar produtos próximos ao vencimento",
        error: error.message,
      });
    }
  }
  /**
   * Buscar ativo com dados de preço (se aplicável)
   * GET /api/assets/:id/with-price
   */
  static async getAssetWithPrice(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID do ativo é obrigatório",
        });
      }

      const asset = await Asset.getAssetWithPrice(id);

      if (!asset) {
        return res.status(404).json({
          success: false,
          message: "Ativo não encontrado",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Ativo com preços obtido com sucesso",
        data: asset,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar ativo com preços",
        error: error.message,
      });
    }
  }

  // Modificar o método de compra de ativo
  static async buyAsset(req, res) {
    try {
      // ... código existente para a compra de ativo ...

      // Após compra bem-sucedida:
      if (result.success) {
        // Adicionar OrangeCoins ao usuário
        await User.addOrangeCoins(
          account.userId,
          recompensas.BUY_ASSET,
          'Compra de ativo'
        );

        // O restante do código existente...
      }

      // ... restante do código existente ...
    } catch (error) {
      // ... tratamento de erro existente ...
    }
  };

  // Modificar o método de compra de renda fixa
  static async buyFixedIncome(req, res) {
    try {
      // ... código existente para a compra de renda fixa ...

      // Após compra bem-sucedida:
      if (result.success) {
        // Adicionar OrangeCoins ao usuário
        await User.addOrangeCoins(
          account.userId,
          REWARDS.BUY_FIXED_INCOME,
          'Compra de renda fixa'
        );

        // O restante do código existente...
      }

      // ... restante do código existente ...
    } catch (error) {
      // ... tratamento de erro existente ...
    }
  };

  // Modificar o método de venda de ativo
  static async sellAsset(req, res) {
    try {
      // ... código existente para a venda de ativo ...

      // Após venda bem-sucedida:
      if (result.success) {
        // Adicionar OrangeCoins ao usuário
        await User.addOrangeCoins(
          account.userId,
          REWARDS.SELL_ASSET,
          'Venda de ativo'
        );

        // O restante do código existente...
      }

      // ... restante do código existente ...
    } catch (error) {
      // ... tratamento de erro existente ...
    }
  };
}

module.exports = AssetController;
