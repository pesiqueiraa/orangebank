const Asset = require("../models/Asset");

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
}

module.exports = AssetController;
