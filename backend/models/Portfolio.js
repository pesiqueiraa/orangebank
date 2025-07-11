const db = require("../config/database");

class Portfolio {
  // Buscar portfólio completo de um usuário
  static async getByUserId(userId) {
    try {
      const query = `
        SELECT 
          p.*,
          a.nome as asset_name,
          a.tipo as asset_type,
          a.categoria as asset_category,
          CASE 
            WHEN a.tipo = 'ação' THEN s.current_price
            ELSE NULL
          END as current_price,
          CASE 
            WHEN a.tipo = 'ação' THEN s.daily_variation
            ELSE NULL
          END as daily_variation,
          CASE 
            WHEN a.tipo = 'renda fixa' THEN fi.rate
            ELSE NULL
          END as fixed_rate,
          CASE 
            WHEN a.tipo = 'renda fixa' THEN fi.maturity
            ELSE NULL
          END as maturity_date
        FROM portfolio p
        JOIN assets a ON a.id = (
          SELECT asset_id FROM stocks WHERE symbol = p.asset_symbol
          UNION
          SELECT asset_id FROM fixed_income WHERE id = p.asset_symbol
        )
        LEFT JOIN stocks s ON s.symbol = p.asset_symbol
        LEFT JOIN fixed_income fi ON fi.id = p.asset_symbol
        WHERE p.user_id = $1
        ORDER BY p.created_at DESC
      `;
      
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erro ao buscar portfólio: ${error.message}`);
    }
  }

  // Buscar posição específica de um ativo no portfólio
  static async getPosition(userId, assetSymbol) {
    try {
      const query = `
        SELECT * FROM portfolio 
        WHERE user_id = $1 AND asset_symbol = $2
      `;
      
      const result = await db.query(query, [userId, assetSymbol]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erro ao buscar posição: ${error.message}`);
    }
  }

  // Adicionar ou atualizar posição no portfólio (compra)
  static async addOrUpdatePosition(userId, accountId, assetSymbol, quantity, unitPrice, transactionRef) {
    try {
      // Verificar se já existe posição
      const existingPosition = await this.getPosition(userId, assetSymbol);
      
      if (existingPosition) {
        // Atualizar posição existente - calcular novo preço médio
        const newQuantity = parseFloat(existingPosition.quantity) + parseFloat(quantity);
        const totalValue = (parseFloat(existingPosition.quantity) * parseFloat(existingPosition.average_price)) + 
                          (parseFloat(quantity) * parseFloat(unitPrice));
        const newAveragePrice = totalValue / newQuantity;
        
        const updateQuery = `
          UPDATE portfolio 
          SET 
            quantity = $1,
            average_price = $2,
            updated_at = NOW()
          WHERE user_id = $3 AND asset_symbol = $4
          RETURNING *
        `;
        
        const result = await db.query(updateQuery, [newQuantity, newAveragePrice, userId, assetSymbol]);
        return result.rows[0];
      } else {
        // Criar nova posição
        const insertQuery = `
          INSERT INTO portfolio (
            user_id, account_id, asset_symbol, quantity, 
            average_price, purchase_price, transaction_ref
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        
        const result = await db.query(insertQuery, [
          userId, accountId, assetSymbol, quantity, 
          unitPrice, unitPrice, transactionRef
        ]);
        return result.rows[0];
      }
    } catch (error) {
      throw new Error(`Erro ao adicionar posição: ${error.message}`);
    }
  }

  // Reduzir posição no portfólio (venda)
  static async reducePosition(userId, assetSymbol, quantity) {
    try {
      const existingPosition = await this.getPosition(userId, assetSymbol);
      
      if (!existingPosition) {
        throw new Error('Posição não encontrada no portfólio');
      }
      
      const currentQuantity = parseFloat(existingPosition.quantity);
      const sellQuantity = parseFloat(quantity);
      
      if (sellQuantity > currentQuantity) {
        throw new Error('Quantidade insuficiente para venda');
      }
      
      const newQuantity = currentQuantity - sellQuantity;
      
      if (newQuantity === 0) {
        // Remover posição completamente
        const deleteQuery = `
          DELETE FROM portfolio 
          WHERE user_id = $1 AND asset_symbol = $2
        `;
        await db.query(deleteQuery, [userId, assetSymbol]);
        return null;
      } else {
        // Atualizar quantidade
        const updateQuery = `
          UPDATE portfolio 
          SET 
            quantity = $1,
            updated_at = NOW()
          WHERE user_id = $2 AND asset_symbol = $3
          RETURNING *
        `;
        
        const result = await db.query(updateQuery, [newQuantity, userId, assetSymbol]);
        return result.rows[0];
      }
    } catch (error) {
      throw new Error(`Erro ao reduzir posição: ${error.message}`);
    }
  }

  // Calcular valor total do portfólio
  static async getTotalValue(userId) {
    try {
      const query = `
        SELECT 
          SUM(
            CASE 
              WHEN a.tipo = 'ação' THEN p.quantity * s.current_price
              WHEN a.tipo = 'renda fixa' THEN p.quantity * p.average_price
              ELSE 0
            END
          ) as total_value
        FROM portfolio p
        JOIN assets a ON a.id = (
          SELECT asset_id FROM stocks WHERE symbol = p.asset_symbol
          UNION
          SELECT asset_id FROM fixed_income WHERE id = p.asset_symbol
        )
        LEFT JOIN stocks s ON s.symbol = p.asset_symbol
        WHERE p.user_id = $1
      `;
      
      const result = await db.query(query, [userId]);
      return parseFloat(result.rows[0].total_value) || 0;
    } catch (error) {
      throw new Error(`Erro ao calcular valor do portfólio: ${error.message}`);
    }
  }

  // Calcular rendimento/prejuízo de uma posição específica
  static async getPositionPnL(userId, assetSymbol) {
    try {
      const query = `
        SELECT 
          p.quantity,
          p.average_price,
          CASE 
            WHEN a.tipo = 'ação' THEN s.current_price
            ELSE p.average_price
          END as current_price,
          a.tipo as asset_type
        FROM portfolio p
        JOIN assets a ON a.id = (
          SELECT asset_id FROM stocks WHERE symbol = p.asset_symbol
          UNION
          SELECT asset_id FROM fixed_income WHERE id = p.asset_symbol
        )
        LEFT JOIN stocks s ON s.symbol = p.asset_symbol
        WHERE p.user_id = $1 AND p.asset_symbol = $2
      `;
      
      const result = await db.query(query, [userId, assetSymbol]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const position = result.rows[0];
      const quantity = parseFloat(position.quantity);
      const averagePrice = parseFloat(position.average_price);
      const currentPrice = parseFloat(position.current_price);
      
      const totalInvested = quantity * averagePrice;
      const currentValue = quantity * currentPrice;
      const pnl = currentValue - totalInvested;
      const pnlPercentage = ((currentPrice - averagePrice) / averagePrice) * 100;
      
      return {
        quantity,
        averagePrice,
        currentPrice,
        totalInvested,
        currentValue,
        pnl,
        pnlPercentage: pnlPercentage || 0,
        assetType: position.asset_type
      };
    } catch (error) {
      throw new Error(`Erro ao calcular P&L: ${error.message}`);
    }
  }

  // Verificar se o usuário possui quantidade suficiente para venda
  static async hasEnoughQuantity(userId, assetSymbol, requiredQuantity) {
    try {
      const position = await this.getPosition(userId, assetSymbol);
      
      if (!position) {
        return false;
      }
      
      return parseFloat(position.quantity) >= parseFloat(requiredQuantity);
    } catch (error) {
      throw new Error(`Erro ao verificar quantidade: ${error.message}`);
    }
  }

  // Obter resumo do portfólio por categoria
  static async getSummaryByCategory(userId) {
    try {
      const query = `
        SELECT 
          a.categoria,
          COUNT(*) as asset_count,
          SUM(
            CASE 
              WHEN a.tipo = 'ação' THEN p.quantity * s.current_price
              WHEN a.tipo = 'renda fixa' THEN p.quantity * p.average_price
              ELSE 0
            END
          ) as total_value,
          SUM(p.quantity * p.average_price) as total_invested
        FROM portfolio p
        JOIN assets a ON a.id = (
          SELECT asset_id FROM stocks WHERE symbol = p.asset_symbol
          UNION
          SELECT asset_id FROM fixed_income WHERE id = p.asset_symbol
        )
        LEFT JOIN stocks s ON s.symbol = p.asset_symbol
        WHERE p.user_id = $1
        GROUP BY a.categoria
        ORDER BY total_value DESC
      `;
      
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erro ao gerar resumo por categoria: ${error.message}`);
    }
  }
}

module.exports = Portfolio;