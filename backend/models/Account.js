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
   * Busca conta por número único (para transferências entre usuários)
   * @param {string} accountNumber - Número da conta (usando ID como número)
   * @returns {Account|null} Conta encontrada ou null
   */
  static async findByAccountNumber(accountNumber) {
    try {
      const query = `
                SELECT id, user_id, type, balance, created_at, updated_at 
                FROM accounts 
                WHERE id = $1 AND type = 'corrente'
            `;
      const result = await db.query(query, [accountNumber]);

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
      throw new Error(`Erro ao buscar conta por número: ${error.message}`);
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

  /**
   * Realizar saque (apenas conta corrente)
   * @param {number} amount - Valor do saque
   * @returns {Object} Resultado da operação
   */
  async withdraw(amount) {
    if (this.type !== "corrente") {
      throw new Error("Saques só podem ser realizados na conta corrente");
    }

    if (amount <= 0) {
      throw new Error("Valor do saque deve ser maior que zero");
    }

    if (this.hasInsufficientBalance(amount)) {
      throw new Error("Saldo insuficiente para realizar o saque");
    }

    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      // Atualizar saldo da conta
      const updateQuery = `
                UPDATE accounts 
                SET balance = balance - $1, updated_at = NOW() 
                WHERE id = $2 
                RETURNING balance
            `;
      const result = await client.query(updateQuery, [amount, this.id]);
      this.balance = parseFloat(result.rows[0].balance);

      // Registrar transação
      await this.recordTransaction(client, "saque", amount, 0);

      await client.query("COMMIT");

      return {
        success: true,
        message: "Saque realizado com sucesso",
        newBalance: this.balance,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Erro ao realizar saque: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // ==================== MÉTODOS DE VALIDAÇÃO ====================

  /**
   * Verificar se há saldo insuficiente
   * @param {number} amount - Valor a ser verificado
   * @returns {boolean} True se saldo insuficiente
   */
  hasInsufficientBalance(amount) {
    return this.balance < amount;
  }
  /**
   * Validar valor de transferência
   * @param {number} amount - Valor da transferência
   * @returns {Object} Resultado da validação
   */
  validateTransferAmount(amount) {
    if (amount <= 0) {
      return { valid: false, message: "Valor deve ser maior que zero" };
    }

    if (this.hasInsufficientBalance(amount)) {
      return { valid: false, message: "Saldo insuficiente" };
    }

    return { valid: true };
  }
  /**
   * Verificar operações pendentes (para conta investimento)
   * @returns {boolean} True se há operações pendentes
   */
  async checkPendingOperations() {
    try {
      const query = `
                SELECT COUNT(*) as pending_count
                FROM transactions t
                JOIN operations o ON t.id = o.transaction_ref
                WHERE t.account_id = $1 
                AND t.created_at > NOW() - INTERVAL '1 hour'
                AND o.tipo = 'compra'
            `;
      const result = await db.query(query, [this.id]);
      return parseInt(result.rows[0].pending_count) > 0;
    } catch (error) {
      throw new Error(
        `Erro ao verificar operações pendentes: ${error.message}`
      );
    }
  }
  // ==================== MÉTODOS DE HISTÓRICO ====================

  /**
   * Obter histórico de transações da conta
   * @param {number} limit - Limite de registros (padrão: 10)
   * @returns {Array} Histórico de transações
   */
  async getTransactionHistory(limit = 10) {
    try {
      const query = `
                SELECT 
                    t.id,
                    t.transaction_id,
                    t.tipo,
                    t.valor,
                    t.taxa,
                    t.created_at,
                    tf.to_account_id,
                    tf.status as transfer_status
                FROM transactions t
                LEFT JOIN transfers tf ON t.id = tf.transaction_ref
                WHERE t.account_id = $1
                ORDER BY t.created_at DESC
                LIMIT $2
            `;
      const result = await db.query(query, [this.id, limit]);
      return result.rows;
    } catch (error) {
      throw new Error(
        `Erro ao obter histórico de transações: ${error.message}`
      );
    }
  }
  /**
   * Registrar uma transação
   * @param {Object} client - Cliente de conexão do banco
   * @param {string} type - Tipo da transação
   * @param {number} amount - Valor da transação
   * @param {number} fee - Taxa da transação
   * @returns {string} ID da transação criada
   */
  async recordTransaction(client, type, amount, fee = 0) {
    try {
      const transactionId = `TXN_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const query = `
                INSERT INTO transactions (transaction_id, user_id, account_id, tipo, valor, taxa)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `;

      const result = await client.query(query, [
        transactionId,
        this.userId,
        this.id,
        type,
        amount,
        fee,
      ]);

      return result.rows[0].id;
    } catch (error) {
      throw new Error(`Erro ao registrar transação: ${error.message}`);
    }
  }
  /**
   * Atualizar saldo da conta
   * @param {number} newBalance - Novo saldo
   */
  async updateBalance(newBalance) {
    try {
      const query = `
                UPDATE accounts 
                SET balance = $1, updated_at = NOW() 
                WHERE id = $2
            `;
      await db.query(query, [newBalance, this.id]);
      this.balance = newBalance;
    } catch (error) {
      throw new Error(`Erro ao atualizar saldo: ${error.message}`);
    }
  }
  /**
   * Converter para objeto JSON
   * @returns {Object} Representação em objeto da conta
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      balance: this.balance,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
