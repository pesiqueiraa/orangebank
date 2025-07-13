const db = require('../config/database');

class Transaction {
  constructor(id, transactionId, userId, accountId, tipo, valor, taxa, createdAt) {
    this.id = id;
    this.transactionId = transactionId;
    this.userId = userId;
    this.accountId = accountId;
    this.tipo = tipo;
    this.valor = valor;
    this.taxa = taxa;
    this.createdAt = createdAt;
  }

  // ==================== MÉTODOS DE BUSCA ====================

  /**
   * Buscar transação por ID
   * @param {string} id - ID da transação
   * @returns {Transaction|null} Transação encontrada ou null
   */
  static async findById(id) {
    try {
      const query = `
        SELECT 
          t.id,
          t.transaction_id,
          t.user_id,
          t.account_id,
          t.tipo,
          t.valor,
          t.taxa,
          t.created_at,
          a.type as account_type,
          u.name as user_name
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        JOIN users u ON t.user_id = u.id
        WHERE t.id = $1
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return new Transaction(
        row.id,
        row.transaction_id,
        row.user_id,
        row.account_id,
        row.tipo,
        parseFloat(row.valor),
        parseFloat(row.taxa),
        row.created_at
      );
    } catch (error) {
      throw new Error(`Erro ao buscar transação: ${error.message}`);
    }
  }

  /**
   * Buscar transação por transaction_id
   * @param {string} transactionId - ID único da transação
   * @returns {Transaction|null} Transação encontrada ou null
   */
  static async findByTransactionId(transactionId) {
    try {
      const query = `
        SELECT 
          t.id,
          t.transaction_id,
          t.user_id,
          t.account_id,
          t.tipo,
          t.valor,
          t.taxa,
          t.created_at
        FROM transactions t
        WHERE t.transaction_id = $1
      `;
      
      const result = await db.query(query, [transactionId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return new Transaction(
        row.id,
        row.transaction_id,
        row.user_id,
        row.account_id,
        row.tipo,
        parseFloat(row.valor),
        parseFloat(row.taxa),
        row.created_at
      );
    } catch (error) {
      throw new Error(`Erro ao buscar transação: ${error.message}`);
    }
  }

  /**
   * Buscar transações por usuário
   * @param {string} userId - ID do usuário
   * @param {number} limit - Limite de resultados
   * @param {number} offset - Offset para paginação
   * @returns {Array} Lista de transações
   */
  static async findByUserId(userId, limit = 20, offset = 0) {
    try {
      const query = `
        SELECT 
          t.id,
          t.transaction_id,
          t.user_id,
          t.account_id,
          t.tipo,
          t.valor,
          t.taxa,
          t.created_at,
          a.type as account_type
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE t.user_id = $1
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await db.query(query, [userId, limit, offset]);
      
      return result.rows.map(row => new Transaction(
        row.id,
        row.transaction_id,
        row.user_id,
        row.account_id,
        row.tipo,
        parseFloat(row.valor),
        parseFloat(row.taxa),
        row.created_at
      ));
    } catch (error) {
      throw new Error(`Erro ao buscar transações por usuário: ${error.message}`);
    }
  }

  /**
   * Buscar transações por conta
   * @param {string} accountId - ID da conta
   * @param {number} limit - Limite de resultados
   * @param {number} offset - Offset para paginação
   * @returns {Array} Lista de transações
   */
  static async findByAccountId(accountId, limit = 20, offset = 0) {
    try {
      const query = `
        SELECT 
          t.id,
          t.transaction_id,
          t.user_id,
          t.account_id,
          t.tipo,
          t.valor,
          t.taxa,
          t.created_at,
          tf.to_account_id,
          tf.status as transfer_status,
          a_dest.type as to_account_type,
          u_dest.name as to_user_name
        FROM transactions t
        LEFT JOIN transfers tf ON t.id = tf.transaction_ref
        LEFT JOIN accounts a_dest ON tf.to_account_id = a_dest.id
        LEFT JOIN users u_dest ON a_dest.user_id = u_dest.id
        WHERE t.account_id = $1
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await db.query(query, [accountId, limit, offset]);
      
      return result.rows.map(row => ({
        id: row.id,
        transaction_id: row.transaction_id,
        user_id: row.user_id,
        account_id: row.account_id,
        tipo: row.tipo,
        valor: parseFloat(row.valor),
        taxa: parseFloat(row.taxa),
        created_at: row.created_at,
        toAccountId: row.to_account_id,
        transferStatus: row.transfer_status,
        toAccountType: row.to_account_type,
        toUserName: row.to_user_name
      }));
    } catch (error) {
      throw new Error(`Erro ao buscar transações por conta: ${error.message}`);
    }
  }

  /**
   * Buscar transações por tipo
   * @param {string} tipo - Tipo da transação
   * @param {number} limit - Limite de resultados
   * @returns {Array} Lista de transações
   */
  static async findByType(tipo, limit = 50) {
    try {
      const query = `
        SELECT 
          t.id,
          t.transaction_id,
          t.user_id,
          t.account_id,
          t.tipo,
          t.valor,
          t.taxa,
          t.created_at,
          a.type as account_type,
          u.name as user_name
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        JOIN users u ON t.user_id = u.id
        WHERE t.tipo = $1
        ORDER BY t.created_at DESC
        LIMIT $2
      `;
      
      const result = await db.query(query, [tipo, limit]);
      
      return result.rows.map(row => new Transaction(
        row.id,
        row.transaction_id,
        row.user_id,
        row.account_id,
        row.tipo,
        parseFloat(row.valor),
        parseFloat(row.taxa),
        row.created_at
      ));
    } catch (error) {
      throw new Error(`Erro ao buscar transações por tipo: ${error.message}`);
    }
  }

  /**
   * Buscar transações por período
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @param {string} userId - ID do usuário (opcional)
   * @param {string} accountId - ID da conta (opcional)
   * @returns {Array} Lista de transações
   */
  static async findByDateRange(startDate, endDate, userId = null, accountId = null) {
    try {
      let query = `
        SELECT 
          t.id,
          t.transaction_id,
          t.user_id,
          t.account_id,
          t.tipo,
          t.valor,
          t.taxa,
          t.created_at,
          a.type as account_type,
          u.name as user_name
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        JOIN users u ON t.user_id = u.id
        WHERE t.created_at BETWEEN $1 AND $2
      `;
      
      const params = [startDate, endDate];
      
      if (userId) {
        query += ` AND t.user_id = $${params.length + 1}`;
        params.push(userId);
      }
      
      if (accountId) {
        query += ` AND t.account_id = $${params.length + 1}`;
        params.push(accountId);
      }
      
      query += ` ORDER BY t.created_at DESC`;
      
      const result = await db.query(query, params);
      
      return result.rows.map(row => new Transaction(
        row.id,
        row.transaction_id,
        row.user_id,
        row.account_id,
        row.tipo,
        parseFloat(row.valor),
        parseFloat(row.taxa),
        row.created_at
      ));
    } catch (error) {
      throw new Error(`Erro ao buscar transações por período: ${error.message}`);
    }
  }

  // ==================== MÉTODOS DE ESTATÍSTICAS ====================

  /**
   * Obter estatísticas de transações por usuário
   * @param {string} userId - ID do usuário
   * @param {number} year - Ano (opcional)
   * @returns {Object} Estatísticas
   */
  static async getStatisticsByUser(userId, year = null) {
    try {
      let query = `
        SELECT 
          tipo,
          COUNT(*) as total_transactions,
          SUM(valor) as total_value,
          SUM(taxa) as total_fees,
          AVG(valor) as average_value,
          EXTRACT(MONTH FROM created_at) as month
        FROM transactions 
        WHERE user_id = $1
      `;
      
      const params = [userId];
      
      if (year) {
        query += ` AND EXTRACT(YEAR FROM created_at) = $2`;
        params.push(year);
      }
      
      query += `
        GROUP BY tipo, EXTRACT(MONTH FROM created_at)
        ORDER BY month, tipo
      `;
      
      const result = await db.query(query, params);
      
      return {
        userId,
        year: year || 'all',
        data: result.rows.map(row => ({
          tipo: row.tipo,
          month: parseInt(row.month),
          totalTransactions: parseInt(row.total_transactions),
          totalValue: parseFloat(row.total_value),
          totalFees: parseFloat(row.total_fees),
          averageValue: parseFloat(row.average_value)
        }))
      };
    } catch (error) {
      throw new Error(`Erro ao obter estatísticas: ${error.message}`);
    }
  }

  /**
   * Obter volume de transações por tipo
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Array} Volume por tipo
   */
  static async getVolumeByType(startDate, endDate) {
    try {
      const query = `
        SELECT 
          tipo,
          COUNT(*) as transaction_count,
          SUM(valor) as total_volume,
          SUM(taxa) as total_fees
        FROM transactions 
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY tipo
        ORDER BY total_volume DESC
      `;
      
      const result = await db.query(query, [startDate, endDate]);
      
      return result.rows.map(row => ({
        tipo: row.tipo,
        transactionCount: parseInt(row.transaction_count),
        totalVolume: parseFloat(row.total_volume),
        totalFees: parseFloat(row.total_fees)
      }));
    } catch (error) {
      throw new Error(`Erro ao obter volume por tipo: ${error.message}`);
    }
  }

  // ==================== MÉTODOS DE VALIDAÇÃO ====================

  /**
   * Verificar se transação existe
   * @param {string} transactionId - ID da transação
   * @returns {boolean} True se existe
   */
  static async exists(transactionId) {
    try {
      const query = `SELECT 1 FROM transactions WHERE transaction_id = $1`;
      const result = await db.query(query, [transactionId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Erro ao verificar existência da transação: ${error.message}`);
    }
  }

  // ==================== MÉTODOS DE CONVERSÃO ====================

  /**
   * Converter para objeto JSON
   * @returns {Object} Representação em objeto
   */
  toJSON() {
    return {
      id: this.id,
      transactionId: this.transactionId,
      userId: this.userId,
      accountId: this.accountId,
      tipo: this.tipo,
      valor: this.valor,
      taxa: this.taxa,
      createdAt: this.createdAt
    };
  }
}

module.exports = Transaction;