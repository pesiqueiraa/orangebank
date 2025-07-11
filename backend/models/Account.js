const db = require("../config/database");

class Account {
  // Define o construtor da classe Account
  constructor(id, userId, type, balance, createdAt, updatedAt) {
    this.id = id;
    this.userId = userId;
    this.type = type; // 'corrente' ou 'investimento'
    this.balance = balance;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // ========== MÉTODOS DE BUSCA E CRIAÇÃO ==========

  // Busca todas as contas de um usuário
  static async findByUserId(userId) {
    try {
      const query = `
                SELECT id, user_id, type, balance, created_at, updated_at 
                FROM accounts 
                WHERE user_id = $1
                ORDER BY type
            `;
      const result = await db.query(query, [userId]);
      return result.rows.map(
        (row) =>
          new Account(
            row.id,
            row.user_id,
            row.type,
            parseFloat(row.balance),
            row.created_at,
            row.updated_at
          )
      );
    } catch (error) {
      throw new Error(`Erro ao buscar contas do usuário: ${error.message}`);
    }
  }
  /**
   * Busca conta específica por usuário e tipo
   * @param {string} userId - ID do usuário
   * @param {string} type - Tipo da conta ('corrente' ou 'investimento')
   * @returns {Account|null} Conta encontrada ou null
   */
  static async findByUserIdAndType(userId, type) {
    try {
      const query = `
                SELECT id, user_id, type, balance, created_at, updated_at 
                FROM accounts 
                WHERE user_id = $1 AND type = $2
            `;
      const result = await db.query(query, [userId, type]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return new Account(
        row.id,
        row.user_id,
        row.type,
        parseFloat(row.balance),
        row.created_at,
        row.updated_at
      );
    } catch (error) {
      throw new Error(`Erro ao buscar conta: ${error.message}`);
    }
  }

  /**
   * Busca conta por ID
   * @param {string} accountId - ID da conta
   * @returns {Account|null} Conta encontrada ou null
   */
  static async findById(accountId) {
    try {
      const query = `
                SELECT id, user_id, type, balance, created_at, updated_at 
                FROM accounts 
                WHERE id = $1
            `;
      const result = await db.query(query, [accountId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return new Account(
        row.id,
        row.user_id,
        row.type,
        parseFloat(row.balance),
        row.created_at,
        row.updated_at
      );
    } catch (error) {
      throw new Error(`Erro ao buscar conta por ID: ${error.message}`);
    }
  }
}
