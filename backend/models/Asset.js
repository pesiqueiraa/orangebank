const db = require("../config/database");

class Asset {
  constructor(id, nome, tipo, categoria, createdAt) {
    this.id = id;
    this.nome = nome;
    this.tipo = tipo; // 'ação' ou 'renda fixa'
    this.categoria = categoria; // ex.: Agro, Serviços, Tecnologia
    this.createdAt = createdAt;
  }

  // ==================== MÉTODOS DE BUSCA E LISTAGEM ====================

  /**
   * Buscar todos os ativos
   * @returns {Array} Lista de todos os ativos
   */
  static async getAllAssets() {
    try {
      const query = `
                SELECT id, nome, tipo, categoria, created_at 
                FROM assets 
                ORDER BY tipo, nome
            `;
      const result = await db.query(query);
      return result.rows.map((row) => Asset.fromDatabase(row));
    } catch (error) {
      throw new Error(`Erro ao buscar todos os ativos: ${error.message}`);
    }
  }

  /**
   * Buscar ativos por termo de pesquisa (nome, símbolo ou categoria)
   * @param {string} searchTerm - Termo de busca
   * @returns {Array} Lista de ativos encontrados
   */
  static async searchAssets(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        return [];
      }

      const term = `%${searchTerm.toLowerCase()}%`;
      
      const query = `
        SELECT DISTINCT
          a.id, a.nome, a.tipo, a.categoria, a.created_at,
          s.symbol, s.current_price, s.daily_variation,
          fi.id as fixed_income_id, fi.rate, fi.rate_type, fi.maturity
        FROM assets a
        LEFT JOIN stocks s ON a.id = s.asset_id
        LEFT JOIN fixed_income fi ON a.id = fi.asset_id
        WHERE 
          LOWER(a.nome) LIKE $1 
          OR LOWER(a.categoria) LIKE $1
          OR LOWER(s.symbol) LIKE $1
        ORDER BY 
          CASE 
            WHEN LOWER(a.nome) LIKE $1 THEN 1
            WHEN LOWER(s.symbol) LIKE $1 THEN 2
            WHEN LOWER(a.categoria) LIKE $1 THEN 3
            ELSE 4
          END,
          a.nome
      `;
      
      const result = await db.query(query, [term]);
      
      return result.rows.map((row) => {
        const baseAsset = Asset.fromDatabase(row).toJSON();
        
        // Adicionar dados de ação se existir
        if (row.symbol) {
          return {
            ...baseAsset,
            symbol: row.symbol,
            currentPrice: parseFloat(row.current_price || 0),
            dailyVariation: parseFloat(row.daily_variation || 0)
          };
        }
        
        // Adicionar dados de renda fixa se existir
        if (row.fixed_income_id) {
          return {
            ...baseAsset,
            fixedIncomeId: row.fixed_income_id,
            rate: parseFloat(row.rate || 0),
            rateType: row.rate_type,
            maturity: row.maturity
          };
        }
        
        return baseAsset;
      });
    } catch (error) {
      throw new Error(`Erro ao buscar ativos: ${error.message}`);
    }
  }

  /**
   * Buscar ativos com filtros avançados
   * @param {Object} filters - Filtros de busca
   * @returns {Array} Lista de ativos filtrados
   */
  static async searchAssetsWithFilters(filters = {}) {
    try {
      const { 
        searchTerm, 
        tipo, 
        categoria, 
        minPrice, 
        maxPrice,
        rateType,
        limit = 50 
      } = filters;

      let conditions = [];
      let params = [];
      let paramCount = 0;

      // Busca por termo
      if (searchTerm && searchTerm.trim() !== '') {
        paramCount++;
        const term = `%${searchTerm.toLowerCase()}%`;
        conditions.push(`(
          LOWER(a.nome) LIKE $${paramCount} 
          OR LOWER(a.categoria) LIKE $${paramCount}
          OR LOWER(s.symbol) LIKE $${paramCount}
        )`);
        params.push(term);
      }

      // Filtro por tipo
      if (tipo) {
        paramCount++;
        conditions.push(`a.tipo = $${paramCount}`);
        params.push(tipo);
      }

      // Filtro por categoria
      if (categoria) {
        paramCount++;
        conditions.push(`a.categoria = $${paramCount}`);
        params.push(categoria);
      }

      // Filtro por preço mínimo (apenas ações)
      if (minPrice) {
        paramCount++;
        conditions.push(`s.current_price >= $${paramCount}`);
        params.push(parseFloat(minPrice));
      }

      // Filtro por preço máximo (apenas ações)
      if (maxPrice) {
        paramCount++;
        conditions.push(`s.current_price <= $${paramCount}`);
        params.push(parseFloat(maxPrice));
      }

      // Filtro por tipo de taxa (apenas renda fixa)
      if (rateType) {
        paramCount++;
        conditions.push(`fi.rate_type = $${paramCount}`);
        params.push(rateType);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      paramCount++;
      params.push(parseInt(limit));

      const query = `
        SELECT DISTINCT
          a.id, a.nome, a.tipo, a.categoria, a.created_at,
          s.symbol, s.current_price, s.daily_variation,
          fi.id as fixed_income_id, fi.rate, fi.rate_type, fi.maturity, fi.minimum_investment
        FROM assets a
        LEFT JOIN stocks s ON a.id = s.asset_id
        LEFT JOIN fixed_income fi ON a.id = fi.asset_id
        ${whereClause}
        ORDER BY 
          CASE 
            WHEN LOWER(a.nome) LIKE COALESCE($1, '') THEN 1
            WHEN LOWER(s.symbol) LIKE COALESCE($1, '') THEN 2
            WHEN LOWER(a.categoria) LIKE COALESCE($1, '') THEN 3
            ELSE 4
          END,
          a.nome
        LIMIT $${paramCount}
      `;
      
      const result = await db.query(query, params);
      
      return result.rows.map((row) => {
        const baseAsset = Asset.fromDatabase(row).toJSON();
        
        // Adicionar dados de ação se existir
        if (row.symbol) {
          return {
            ...baseAsset,
            symbol: row.symbol,
            currentPrice: parseFloat(row.current_price || 0),
            dailyVariation: parseFloat(row.daily_variation || 0)
          };
        }
        
        // Adicionar dados de renda fixa se existir
        if (row.fixed_income_id) {
          return {
            ...baseAsset,
            fixedIncomeId: row.fixed_income_id,
            rate: parseFloat(row.rate || 0),
            rateType: row.rate_type,
            maturity: row.maturity,
            minimumInvestment: parseFloat(row.minimum_investment || 0)
          };
        }
        
        return baseAsset;
      });
    } catch (error) {
      throw new Error(`Erro ao buscar ativos com filtros: ${error.message}`);
    }
  }

  /**
   * Buscar apenas ativos de renda fixa
   * @returns {Array} Lista de ativos de renda fixa
   */
  static async getFixedIncomeAssets() {
    try {
      const query = `
                SELECT id, nome, tipo, categoria, created_at 
                FROM assets 
                WHERE tipo = 'renda fixa' 
                ORDER BY nome
            `;
      const result = await db.query(query);
      return result.rows.map((row) => Asset.fromDatabase(row));
    } catch (error) {
      throw new Error(`Erro ao buscar ativos de renda fixa: ${error.message}`);
    }
  }

  /**
   * Buscar apenas ações
   * @returns {Array} Lista de ações
   */
  static async getStocks() {
    try {
      const query = `
        SELECT id, nome, tipo, categoria, created_at 
        FROM assets 
        WHERE tipo = 'ação' 
        ORDER BY nome
      `;
      const result = await db.query(query);
      return result.rows.map((row) => Asset.fromDatabase(row));
    } catch (error) {
      throw new Error(`Erro ao buscar ações: ${error.message}`);
    }
  }

  /**
   * Buscar ativo específico por ID
   * @param {string} id - ID do ativo
   * @returns {Asset|null} Ativo encontrado ou null
   */
  static async findById(id) {
    try {
      const query = `
                SELECT id, nome, tipo, categoria, created_at 
                FROM assets 
                WHERE id = $1
            `;
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return Asset.fromDatabase(result.rows[0]);
    } catch (error) {
      throw new Error(`Erro ao buscar ativo por ID: ${error.message}`);
    }
  }
  /**
   * Buscar ativo específico por nome
   * @param {string} nome - Nome do ativo
   * @returns {Asset|null} Ativo encontrado ou null
   */
  static async findByName(nome) {
    try {
      const query = `
                SELECT id, nome, tipo, categoria, created_at 
                FROM assets 
                WHERE nome = $1
            `;
      const result = await db.query(query, [nome]);

      if (result.rows.length === 0) {
        return null;
      }

      return Asset.fromDatabase(result.rows[0]);
    } catch (error) {
      throw new Error(`Erro ao buscar ativo por nome: ${error.message}`);
    }
  }

  /**
   * Buscar ativos por tipo
   * @param {string} tipo - Tipo do ativo ('ação' ou 'renda fixa')
   * @returns {Array} Lista de ativos do tipo especificado
   */
  static async findByType(tipo) {
    try {
      const query = `
                SELECT id, nome, tipo, categoria, created_at 
                FROM assets 
                WHERE tipo = $1 
                ORDER BY nome
            `;
      const result = await db.query(query, [tipo]);
      return result.rows.map((row) => Asset.fromDatabase(row));
    } catch (error) {
      throw new Error(`Erro ao buscar ativos por tipo: ${error.message}`);
    }
  }
  /**
   * Buscar ativos por categoria
   * @param {string} categoria - Categoria dos ativos
   * @returns {Array} Lista de ativos da categoria
   */
  static async findByCategory(categoria) {
    try {
      const query = `
                SELECT id, nome, tipo, categoria, created_at 
                FROM assets 
                WHERE categoria = $1 
                ORDER BY nome
            `;
      const result = await db.query(query, [categoria]);
      return result.rows.map((row) => Asset.fromDatabase(row));
    } catch (error) {
      throw new Error(`Erro ao buscar ativos por categoria: ${error.message}`);
    }
  }

  // ==================== MÉTODOS DE VALIDAÇÃO ====================

  /**
   * Verificar se ativo existe
   * @param {string} id - ID do ativo
   * @returns {boolean} True se ativo existe
   */
  static async exists(id) {
    try {
      const asset = await Asset.findById(id);
      return asset !== null;
    } catch (error) {
      return false;
    }
  }

  // ==================== RELATÓRIOS E ESTATÍSTICAS ====================

  /**
   * Obter estatísticas dos ativos
   * @returns {Object} Estatísticas
   */
  static async getStatistics() {
    try {
      const query = `
                SELECT 
                    COUNT(*) as total_assets,
                    COUNT(CASE WHEN tipo = 'ação' THEN 1 END) as total_stocks,
                    COUNT(CASE WHEN tipo = 'renda fixa' THEN 1 END) as total_fixed_income
                FROM assets
            `;
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao obter estatísticas: ${error.message}`);
    }
  }
  /**
   * Obter distribuição por categoria
   * @returns {Array} Distribuição por categoria
   */
  static async getCategoryDistribution() {
    try {
      const query = `
                SELECT 
                    categoria,
                    tipo,
                    COUNT(*) as total
                FROM assets 
                GROUP BY categoria, tipo 
                ORDER BY categoria, tipo
            `;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(
        `Erro ao obter distribuição por categoria: ${error.message}`
      );
    }
  }

  /**
   * Listar todas as categorias
   * @returns {Array} Lista de categorias
   */
  static async getAllCategories() {
    try {
      const query = `
                SELECT DISTINCT categoria 
                FROM assets 
                ORDER BY categoria
            `;
      const result = await db.query(query);
      return result.rows.map((row) => row.categoria);
    } catch (error) {
      throw new Error(`Erro ao obter categorias: ${error.message}`);
    }
  }

  // ==================== MÉTODOS DE CONVERSÃO ====================

  /**
   * Criar instância Asset a partir de dados do banco
   * @param {Object} row - Linha do banco de dados
   * @returns {Asset} Instância de Asset
   */
  static fromDatabase(row) {
    return new Asset(row.id, row.nome, row.tipo, row.categoria, row.created_at);
  }

  /**
   * Converter instância para JSON
   * @returns {Object} Representação em objeto
   */
  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      tipo: this.tipo,
      categoria: this.categoria,
      createdAt: this.createdAt,
    };
  }

  // ==================== MÉTODOS DE PREÇOS (STOCKS) ====================

  /**
   * Buscar dados de preço de um ativo (da tabela stocks)
   * @param {string} assetId - ID do ativo
   * @returns {Object|null} Dados de preço ou null
   */
  static async getStockPrice(assetId) {
    try {
      const query = `
        SELECT s.id, s.symbol, s.asset_id, s.current_price, s.daily_variation
        FROM stocks s
        WHERE s.asset_id = $1
      `;
      const result = await db.query(query, [assetId]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao buscar preço do ativo: ${error.message}`);
    }
  }

  /**
   * Buscar ativo com seus dados de preço
   * @param {string} assetId - ID do ativo
   * @returns {Object|null} Ativo completo com preços
   */
  static async getAssetWithPrice(assetId) {
    try {
      const query = `
        SELECT 
          a.id, a.nome, a.tipo, a.categoria, a.created_at,
          s.symbol, s.current_price, s.daily_variation
        FROM assets a
        LEFT JOIN stocks s ON a.id = s.asset_id
        WHERE a.id = $1
      `;
      const result = await db.query(query, [assetId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        ...Asset.fromDatabase(row).toJSON(),
        symbol: row.symbol,
        currentPrice: parseFloat(row.current_price || 0),
        dailyVariation: parseFloat(row.daily_variation || 0),
      };
    } catch (error) {
      throw new Error(`Erro ao buscar ativo com preço: ${error.message}`);
    }
  }

  /**
   * Buscar todas as ações com preços
   * @returns {Array} Lista de ações com preços
   */
  static async getStocksWithPrices() {
    try {
      const query = `
        SELECT 
          a.id, a.nome, a.tipo, a.categoria, a.created_at,
          s.symbol, s.current_price, s.daily_variation
        FROM assets a
        INNER JOIN stocks s ON a.id = s.asset_id
        WHERE a.tipo = 'ação'
        ORDER BY a.nome
      `;
      const result = await db.query(query);

      return result.rows.map((row) => ({
        ...Asset.fromDatabase(row).toJSON(),
        symbol: row.symbol,
        currentPrice: parseFloat(row.current_price),
        dailyVariation: parseFloat(row.daily_variation),
      }));
    } catch (error) {
      throw new Error(`Erro ao buscar ações com preços: ${error.message}`);
    }
  }

  /**
   * Buscar ativo por símbolo (symbol)
   * @param {string} symbol - Símbolo do ativo (ex: BOIB3)
   * @returns {Object|null} Ativo encontrado ou null
   */
  static async findBySymbol(symbol) {
    try {
      const query = `
        SELECT 
          a.id, a.nome, a.tipo, a.categoria, a.created_at,
          s.symbol, s.current_price, s.daily_variation
        FROM assets a
        INNER JOIN stocks s ON a.id = s.asset_id
        WHERE s.symbol = $1
      `;
      const result = await db.query(query, [symbol]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        ...Asset.fromDatabase(row).toJSON(),
        symbol: row.symbol,
        currentPrice: parseFloat(row.current_price),
        dailyVariation: parseFloat(row.daily_variation),
      };
    } catch (error) {
      throw new Error(`Erro ao buscar ativo por símbolo: ${error.message}`);
    }
  }

  /**
   * Calcular taxa de corretagem (1% para ações)
   * @param {string} assetId - ID do ativo
   * @param {number} quantity - Quantidade de ações
   * @returns {Object} Cálculo da taxa
   */
  static async calculateBrokerageFee(assetId, quantity) {
    try {
      const asset = await Asset.getAssetWithPrice(assetId);

      if (!asset) {
        throw new Error("Ativo não encontrado");
      }

      if (asset.tipo !== "ação") {
        return {
          fee: 0,
          totalValue: 0,
          message: "Taxa de corretagem aplicável apenas para ações",
        };
      }

      const totalValue = asset.currentPrice * quantity;
      const fee = totalValue * 0.01; // 1% de taxa de corretagem

      return {
        asset: asset,
        quantity: quantity,
        unitPrice: asset.currentPrice,
        totalValue: totalValue,
        fee: fee,
        totalWithFee: totalValue + fee,
      };
    } catch (error) {
      throw new Error(`Erro ao calcular taxa de corretagem: ${error.message}`);
    }
  }

  /**
   * Atualizar preço de um ativo (na tabela stocks)
   * @param {string} assetId - ID do ativo
   * @param {number} newPrice - Novo preço
   * @returns {Object} Resultado da atualização
   */
  static async updateStockPrice(assetId, newPrice) {
    try {
      const client = await db.connect();

      try {
        await client.query("BEGIN");

        // Obter preço atual
        const currentData = await Asset.getStockPrice(assetId);
        if (!currentData) {
          throw new Error("Ativo não encontrado na tabela de preços");
        }

        const oldPrice = parseFloat(currentData.current_price);
        const variation = ((newPrice - oldPrice) / oldPrice) * 100;

        // Atualizar preço e variação
        const updateQuery = `
          UPDATE stocks 
          SET current_price = $1, daily_variation = $2
          WHERE asset_id = $3
          RETURNING *
        `;
        const result = await client.query(updateQuery, [
          newPrice,
          variation,
          assetId,
        ]);

        await client.query("COMMIT");

        return {
          success: true,
          oldPrice: oldPrice,
          newPrice: newPrice,
          variation: variation,
          data: result.rows[0],
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      throw new Error(`Erro ao atualizar preço: ${error.message}`);
    }
  }

  /**
   * Simular variação de mercado (conforme regras de negócio)
   * @returns {Object} Resultado da simulação
   */
  static async simulateMarketVariation() {
    try {
      const stocks = await Asset.getStocksWithPrices();
      const updates = [];

      for (const stock of stocks) {
        const variation = Asset.generateMarketVariation();
        const newPrice = stock.currentPrice * (1 + variation / 100);

        // Garantir que o preço nunca seja negativo
        const finalPrice = Math.max(newPrice, 0.01);

        const updateResult = await Asset.updateStockPrice(stock.id, finalPrice);
        updates.push({
          symbol: stock.symbol,
          nome: stock.nome,
          oldPrice: updateResult.oldPrice,
          newPrice: finalPrice,
          variation: variation,
        });
      }

      return {
        success: true,
        message: `${updates.length} ações atualizadas`,
        updates: updates,
      };
    } catch (error) {
      throw new Error(`Erro na simulação de mercado: ${error.message}`);
    }
  }

  /**
   * Gerar variação de mercado baseada nas regras de negócio
   * @returns {number} Percentual de variação
   */
  static generateMarketVariation() {
    const random = Math.random();
    let variationRange;

    // Distribuição de probabilidade conforme regras de negócio
    if (random < 0.4) {
      // 40% dos casos: 0.10% a 2%
      variationRange = 0.1 + Math.random() * 1.9;
    } else if (random < 0.7) {
      // 30% dos casos: 2% a 3%
      variationRange = 2 + Math.random();
    } else if (random < 0.9) {
      // 20% dos casos: 3% a 4%
      variationRange = 3 + Math.random();
    } else {
      // 10% dos casos: 4% a 5%
      variationRange = 4 + Math.random();
    }

    // Determinar direção (alta ou baixa)
    const direction = Math.random() < 0.5 ? -1 : 1;

    return variationRange * direction;
  }

  // ==================== MÉTODOS DE RENDA FIXA ====================

  // Buscar detalhes de um produto de renda fixa por ID do asset
  static async getFixedIncomeByAssetId(assetId) {
    try {
      const query = `
        SELECT 
          a.id as asset_id,
          a.nome,
          a.tipo,
          a.categoria,
          fi.id as fixed_income_id,
          fi.name as product_name,
          fi.rate,
          fi.rate_type,
          fi.maturity,
          fi.minimum_investment,
          a.created_at
        FROM assets a
        INNER JOIN fixed_income fi ON a.id = fi.asset_id
        WHERE a.id = $1 AND a.tipo = 'renda fixa'
      `;
      
      const result = await db.query(query, [assetId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar renda fixa por asset ID:', error);
      throw error;
    }
  }

  // Buscar produto de renda fixa por ID específico
  static async getFixedIncomeById(fixedIncomeId) {
    try {
      const query = `
        SELECT 
          a.id as asset_id,
          a.nome,
          a.tipo,
          a.categoria,
          fi.id as fixed_income_id,
          fi.name as product_name,
          fi.rate,
          fi.rate_type,
          fi.maturity,
          fi.minimum_investment,
          a.created_at
        FROM assets a
        INNER JOIN fixed_income fi ON a.id = fi.asset_id
        WHERE fi.id = $1
      `;
      
      const result = await db.query(query, [fixedIncomeId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar renda fixa por ID:', error);
      throw error;
    }
  }

  // Listar todos os produtos de renda fixa
  static async getAllFixedIncomes() {
    try {
      const query = `
        SELECT 
          a.id as asset_id,
          a.nome,
          a.tipo,
          a.categoria,
          fi.id as fixed_income_id,
          fi.name as product_name,
          fi.rate,
          fi.rate_type,
          fi.maturity,
          fi.minimum_investment,
          a.created_at
        FROM assets a
        INNER JOIN fixed_income fi ON a.id = fi.asset_id
        WHERE a.tipo = 'renda fixa'
        ORDER BY fi.rate DESC, fi.maturity ASC
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erro ao listar produtos de renda fixa:', error);
      throw error;
    }
  }

  // Buscar produtos de renda fixa por categoria
  static async getFixedIncomesByCategory(categoria) {
    try {
      const query = `
        SELECT 
          a.id as asset_id,
          a.nome,
          a.tipo,
          a.categoria,
          fi.id as fixed_income_id,
          fi.name as product_name,
          fi.rate,
          fi.rate_type,
          fi.maturity,
          fi.minimum_investment,
          a.created_at
        FROM assets a
        INNER JOIN fixed_income fi ON a.id = fi.asset_id
        WHERE a.tipo = 'renda fixa' AND a.categoria = $1
        ORDER BY fi.rate DESC, fi.maturity ASC
      `;
      
      const result = await db.query(query, [categoria]);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar renda fixa por categoria:', error);
      throw error;
    }
  }

  // Buscar produtos por tipo de taxa (pré ou pós-fixado)
  static async getFixedIncomesByRateType(rateType) {
    try {
      const query = `
        SELECT 
          a.id as asset_id,
          a.nome,
          a.tipo,
          a.categoria,
          fi.id as fixed_income_id,
          fi.name as product_name,
          fi.rate,
          fi.rate_type,
          fi.maturity,
          fi.minimum_investment,
          a.created_at
        FROM assets a
        INNER JOIN fixed_income fi ON a.id = fi.asset_id
        WHERE a.tipo = 'renda fixa' AND fi.rate_type = $1
        ORDER BY fi.rate DESC, fi.maturity ASC
      `;
      
      const result = await db.query(query, [rateType]);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar renda fixa por tipo de taxa:', error);
      throw error;
    }
  }

  // Buscar produtos por faixa de investimento mínimo
  static async getFixedIncomesByInvestmentRange(minAmount, maxAmount = null) {
    try {
      let query = `
        SELECT 
          a.id as asset_id,
          a.nome,
          a.tipo,
          a.categoria,
          fi.id as fixed_income_id,
          fi.name as product_name,
          fi.rate,
          fi.rate_type,
          fi.maturity,
          fi.minimum_investment,
          a.created_at
        FROM assets a
        INNER JOIN fixed_income fi ON a.id = fi.asset_id
        WHERE a.tipo = 'renda fixa' AND fi.minimum_investment >= $1
      `;
      
      const params = [minAmount];
      
      if (maxAmount !== null) {
        query += ' AND fi.minimum_investment <= $2';
        params.push(maxAmount);
      }
      
      query += ' ORDER BY fi.minimum_investment ASC, fi.rate DESC';
      
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar renda fixa por faixa de investimento:', error);
      throw error;
    }
  }

  // Buscar produtos próximos ao vencimento
  static async getFixedIncomesNearMaturity(daysToMaturity = 30) {
    try {
      const query = `
        SELECT 
          a.id as asset_id,
          a.nome,
          a.tipo,
          a.categoria,
          fi.id as fixed_income_id,
          fi.name as product_name,
          fi.rate,
          fi.rate_type,
          fi.maturity,
          fi.minimum_investment,
          (fi.maturity - CURRENT_DATE) as days_to_maturity,
          a.created_at
        FROM assets a
        INNER JOIN fixed_income fi ON a.id = fi.asset_id
        WHERE a.tipo = 'renda fixa' 
        AND fi.maturity > CURRENT_DATE 
        AND fi.maturity <= CURRENT_DATE + INTERVAL '$1 days'
        ORDER BY fi.maturity ASC
      `;
      
      const result = await db.query(query, [daysToMaturity]);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar produtos próximos ao vencimento:', error);
      throw error;
    }
  }

  // Calcular rendimento projetado para produtos pré-fixados
  static calculateFixedIncomeReturn(principal, annualRate, maturityDate) {
    try {
      const today = new Date();
      const maturity = new Date(maturityDate);
      
      // Calcular dias até o vencimento
      const timeDiff = maturity.getTime() - today.getTime();
      const daysToMaturity = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (daysToMaturity <= 0) {
        return {
          grossReturn: 0,
          netReturn: 0,
          totalGross: principal,
          totalNet: principal,
          daysToMaturity: 0,
          taxRate: 0
        };
      }
      
      // Calcular rendimento bruto (juros compostos)
      const dailyRate = Math.pow(1 + annualRate, 1/365) - 1;
      const grossReturn = principal * (Math.pow(1 + dailyRate, daysToMaturity) - 1);
      const totalGross = principal + grossReturn;
      
      // Calcular IR sobre renda fixa (fixo 22% conforme regras de negócio)
      const taxRate = 0.22; // 22% fixo para renda fixa
      
      const tax = grossReturn * taxRate;
      const netReturn = grossReturn - tax;
      const totalNet = principal + netReturn;
      
      return {
        grossReturn: parseFloat(grossReturn.toFixed(2)),
        netReturn: parseFloat(netReturn.toFixed(2)),
        totalGross: parseFloat(totalGross.toFixed(2)),
        totalNet: parseFloat(totalNet.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        taxRate: taxRate,
        daysToMaturity: daysToMaturity,
        annualRate: annualRate
      };
    } catch (error) {
      console.error('Erro ao calcular rendimento da renda fixa:', error);
      throw error;
    }
  }

  // Validar se valor atende investimento mínimo
  static async validateMinimumInvestment(fixedIncomeId, amount) {
    try {
      const product = await this.getFixedIncomeById(fixedIncomeId);
      
      if (!product) {
        throw new Error('Produto de renda fixa não encontrado');
      }
      
      const isValid = amount >= parseFloat(product.minimum_investment);
      
      return {
        isValid,
        minimumRequired: parseFloat(product.minimum_investment),
        providedAmount: amount,
        difference: isValid ? 0 : parseFloat(product.minimum_investment) - amount
      };
    } catch (error) {
      console.error('Erro ao validar investimento mínimo:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS DE CÁLCULO DE IMPOSTOS ====================

  /**
   * Calcular imposto de renda para venda de ações (15% sobre lucro)
   * @param {number} sellPrice - Preço de venda unitário
   * @param {number} buyPrice - Preço de compra médio
   * @param {number} quantity - Quantidade vendida
   * @returns {Object} Cálculo de impostos
   */
  static calculateStockTax(sellPrice, buyPrice, quantity) {
    try {
      const grossValue = sellPrice * quantity;
      const totalCost = buyPrice * quantity;
      const profit = grossValue - totalCost;
      
      // IR de 15% apenas se houver lucro
      let tax = 0;
      if (profit > 0) {
        tax = profit * 0.15; // 15% conforme regras de negócio
      }
      
      const netValue = grossValue - tax;
      
      return {
        grossValue: parseFloat(grossValue.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        netValue: parseFloat(netValue.toFixed(2)),
        taxRate: profit > 0 ? 0.15 : 0,
        isProfit: profit > 0
      };
    } catch (error) {
      console.error('Erro ao calcular imposto de ações:', error);
      throw error;
    }
  }

  /**
   * Calcular imposto de renda para resgate de renda fixa (22% sobre rendimento)
   * @param {number} redeemValue - Valor de resgate
   * @param {number} investedValue - Valor investido
   * @returns {Object} Cálculo de impostos
   */
  static calculateFixedIncomeTax(redeemValue, investedValue) {
    try {
      const earnings = redeemValue - investedValue;
      
      // IR de 22% apenas se houver rendimento
      let tax = 0;
      if (earnings > 0) {
        tax = earnings * 0.22; // 22% conforme regras de negócio
      }
      
      const netValue = redeemValue - tax;
      
      return {
        redeemValue: parseFloat(redeemValue.toFixed(2)),
        investedValue: parseFloat(investedValue.toFixed(2)),
        earnings: parseFloat(earnings.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        netValue: parseFloat(netValue.toFixed(2)),
        taxRate: earnings > 0 ? 0.22 : 0,
        hasEarnings: earnings > 0
      };
    } catch (error) {
      console.error('Erro ao calcular imposto de renda fixa:', error);
      throw error;
    }
  }
}

module.exports = Asset;
