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
  /**
   * Criar novas contas para um usuário (corrente e investimento)
   * @param {string} userId - ID do usuário
   * @returns {Object} Objeto com ambas as contas criadas
   */
  static async createAccountsForUser(userId) {
    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      // Verificar se o usuário já possui contas
      const existingAccountsQuery = `
                SELECT type FROM accounts WHERE user_id = $1
            `;
      const existingResult = await client.query(existingAccountsQuery, [
        userId,
      ]);

      if (existingResult.rows.length > 0) {
        const existingTypes = existingResult.rows.map((row) => row.type);
        throw new Error(
          `Usuário já possui contas: ${existingTypes.join(", ")}`
        );
      }

      // Criar conta corrente
      const currentAccountQuery = `
                INSERT INTO accounts (user_id, type, balance) 
                VALUES ($1, 'corrente', 0) 
                RETURNING id, user_id, type, balance, created_at, updated_at
            `;
      const currentResult = await client.query(currentAccountQuery, [userId]);

      // Criar conta investimento
      const investmentAccountQuery = `
                INSERT INTO accounts (user_id, type, balance) 
                VALUES ($1, 'investimento', 0) 
                RETURNING id, user_id, type, balance, created_at, updated_at
            `;
      const investmentResult = await client.query(investmentAccountQuery, [
        userId,
      ]);

      await client.query("COMMIT");

      const currentRow = currentResult.rows[0];
      const investmentRow = investmentResult.rows[0];

      return {
        corrente: new Account(
          currentRow.id,
          currentRow.user_id,
          currentRow.type,
          parseFloat(currentRow.balance),
          currentRow.created_at,
          currentRow.updated_at
        ),
        investimento: new Account(
          investmentRow.id,
          investmentRow.user_id,
          investmentRow.type,
          parseFloat(investmentRow.balance),
          investmentRow.created_at,
          investmentRow.updated_at
        ),
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Erro ao criar contas: ${error.message}`);
    } finally {
      client.release();
    }
  }
  // ==================== MÉTODOS DE OPERAÇÕES FINANCEIRAS ====================

  /**
   * Realizar depósito (apenas conta corrente)
   * @param {number} amount - Valor do depósito
   * @returns {Object} Resultado da operação
   */
  async deposit(amount) {
    if (this.type !== "corrente") {
      throw new Error("Depósitos só podem ser realizados na conta corrente");
    }

    if (amount <= 0) {
      throw new Error("Valor do depósito deve ser maior que zero");
    }

    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      // Atualizar saldo da conta
      const updateQuery = `
                UPDATE accounts 
                SET balance = balance + $1, updated_at = NOW() 
                WHERE id = $2 
                RETURNING balance
            `;
      const result = await client.query(updateQuery, [amount, this.id]);
      this.balance = parseFloat(result.rows[0].balance);

      // Registrar transação
      await this.recordTransaction(client, "depósito", amount, 0);

      await client.query("COMMIT");

      return {
        success: true,
        message: "Depósito realizado com sucesso",
        newBalance: this.balance,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Erro ao realizar depósito: ${error.message}`);
    } finally {
      client.release();
    }
  }
}
