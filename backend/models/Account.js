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
  /**
   * Transferir valores entre contas
   * @param {Account} toAccount - Conta de destino
   * @param {number} amount - Valor da transferência
   * @param {boolean} isExternal - Se é transferência externa (entre usuários)
   * @returns {Object} Resultado da operação
   */
  async transfer(toAccount, amount, isExternal = false) {
    if (amount <= 0) {
      throw new Error("Valor da transferência deve ser maior que zero");
    }

    if (this.hasInsufficientBalance(amount)) {
      throw new Error("Saldo insuficiente para realizar a transferência");
    }

    // Validações específicas para conta investimento
    if (this.type === "investimento" && isExternal) {
      throw new Error(
        "Conta investimento não pode realizar transferências externas"
      );
    }

    if (this.type === "investimento") {
      const hasPending = await this.checkPendingOperations();
      if (hasPending) {
        throw new Error(
          "Não é possível transferir da conta investimento com operações pendentes"
        );
      }
    }

    // Calcular taxa para transferências externas
    let fee = 0;
    if (isExternal) {
      fee = amount * 0.005; // 0.5% de taxa
    }

    const totalAmount = amount + fee;
    if (this.hasInsufficientBalance(totalAmount)) {
      throw new Error("Saldo insuficiente para cobrir transferência e taxa");
    }

    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      // Debitar da conta origem
      const debitQuery = `
                UPDATE accounts 
                SET balance = balance - $1, updated_at = NOW() 
                WHERE id = $2 
                RETURNING balance
            `;
      const debitResult = await client.query(debitQuery, [
        totalAmount,
        this.id,
      ]);
      this.balance = parseFloat(debitResult.rows[0].balance);

      // Creditar na conta destino
      const creditQuery = `
                UPDATE accounts 
                SET balance = balance + $1, updated_at = NOW() 
                WHERE id = $2 
                RETURNING balance
            `;
      await client.query(creditQuery, [amount, toAccount.id]);

      // Registrar transação da conta origem
      const transactionId = await this.recordTransaction(
        client,
        isExternal ? "transferência_externa" : "transferência_interna",
        totalAmount,
        fee
      );

      // Registrar transferência
      const transferQuery = `
                INSERT INTO transfers (transaction_ref, from_account_id, to_account_id, status)
                VALUES ($1, $2, $3, 'concluída')
            `;
      await client.query(transferQuery, [transactionId, this.id, toAccount.id]);

      // Registrar transação na conta destino
      await toAccount.recordTransaction(
        client,
        isExternal ? "recebimento_externo" : "recebimento_interna",
        amount,
        0
      );

      await client.query("COMMIT");

      return {
        success: true,
        message: "Transferência realizada com sucesso",
        newBalance: this.balance,
        fee: fee,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Erro ao realizar transferência: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // ==================== MÉTODOS DE INVESTIMENTO ====================

  /**
   * Comprar ativos (apenas conta investimento)
   * @param {string} assetSymbol - Símbolo do ativo
   * @param {number} quantity - Quantidade de ativos
   * @param {number} price - Preço unitário do ativo
   * @returns {Object} Resultado da operação
   */
  async buyAsset(assetSymbol, quantity, price) {
    if (this.type !== "investimento") {
      throw new Error(
        "Compra de ativos só pode ser realizada na conta investimento"
      );
    }

    if (quantity <= 0) {
      throw new Error("Quantidade deve ser maior que zero");
    }

    if (price <= 0) {
      throw new Error("Preço deve ser maior que zero");
    }

    const totalValue = quantity * price;
    const brokerageFee = totalValue * 0.01; // 1% de taxa de corretagem para ações
    const totalCost = totalValue + brokerageFee;

    if (this.hasInsufficientBalance(totalCost)) {
      throw new Error("Saldo insuficiente para comprar os ativos");
    }

    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      // Debitar o valor da compra + taxa
      const updateQuery = `
                UPDATE accounts 
                SET balance = balance - $1, updated_at = NOW() 
                WHERE id = $2 
                RETURNING balance
            `;
      const result = await client.query(updateQuery, [totalCost, this.id]);
      this.balance = parseFloat(result.rows[0].balance);

      // Registrar transação
      const transactionId = await this.recordTransaction(
        client,
        "compra_ativo",
        totalCost,
        brokerageFee
      );

      // Registrar o ativo na carteira (temporariamente sem transaction_ref)
      const portfolioQuery = `
                INSERT INTO portfolio (user_id, account_id, asset_symbol, quantity, purchase_price, average_price, purchase_date)
                VALUES ($1, $2, $3, $4, $5, $5, NOW())
                ON CONFLICT (user_id, asset_symbol) 
                DO UPDATE SET 
                    quantity = portfolio.quantity + $4,
                    average_price = ((portfolio.quantity * COALESCE(portfolio.average_price, portfolio.purchase_price)) + ($4 * $5)) / (portfolio.quantity + $4),
                    updated_at = NOW()
            `;

      await client.query(portfolioQuery, [
        this.userId,
        this.id,
        assetSymbol,
        quantity,
        price,
      ]);

      await client.query("COMMIT");

      return {
        success: true,
        message: `Compra realizada com sucesso: ${quantity} unidades de ${assetSymbol}`,
        newBalance: this.balance,
        totalCost: totalCost,
        brokerageFee: brokerageFee,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Erro ao comprar ativo: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Vender ativos (apenas conta investimento)
   * @param {string} assetSymbol - Símbolo do ativo
   * @param {number} quantity - Quantidade de ativos a vender
   * @param {number} currentPrice - Preço atual do ativo
   * @returns {Object} Resultado da operação
   */
  async sellAsset(assetSymbol, quantity, currentPrice) {
    if (this.type !== "investimento") {
      throw new Error(
        "Venda de ativos só pode ser realizada na conta investimento"
      );
    }

    if (quantity <= 0) {
      throw new Error("Quantidade deve ser maior que zero");
    }

    if (currentPrice <= 0) {
      throw new Error("Preço deve ser maior que zero");
    }

    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      // Verificar se o usuário possui o ativo
      const portfolioQuery = `
                SELECT quantity, average_price 
                FROM portfolio 
                WHERE user_id = $1 AND asset_symbol = $2
            `;
      const portfolioResult = await client.query(portfolioQuery, [
        this.userId,
        assetSymbol,
      ]);

      if (portfolioResult.rows.length === 0) {
        throw new Error("Você não possui este ativo");
      }

      const { quantity: ownedQuantity, average_price: averagePrice } =
        portfolioResult.rows[0];

      if (quantity > ownedQuantity) {
        throw new Error("Quantidade insuficiente do ativo");
      }

      const grossValue = quantity * currentPrice;
      const profit = (currentPrice - averagePrice) * quantity;

      // Calcular imposto (15% para ações sobre o lucro)
      let tax = 0;
      if (profit > 0) {
        tax = profit * 0.15; // 15% de IR sobre o lucro
      }

      const netValue = grossValue - tax;

      // Creditar o valor líquido na conta
      const updateAccountQuery = `
                UPDATE accounts 
                SET balance = balance + $1, updated_at = NOW() 
                WHERE id = $2 
                RETURNING balance
            `;
      const accountResult = await client.query(updateAccountQuery, [
        netValue,
        this.id,
      ]);
      this.balance = parseFloat(accountResult.rows[0].balance);

      // Atualizar portfolio
      if (quantity === ownedQuantity) {
        // Remover ativo do portfolio
        await client.query(
          "DELETE FROM portfolio WHERE user_id = $1 AND asset_symbol = $2",
          [this.userId, assetSymbol]
        );
      } else {
        // Reduzir quantidade
        await client.query(
          "UPDATE portfolio SET quantity = quantity - $1, updated_at = NOW() WHERE user_id = $2 AND asset_symbol = $3",
          [quantity, this.userId, assetSymbol]
        );
      }

      // Registrar transação
      await this.recordTransaction(client, "venda_ativo", netValue, tax);

      await client.query("COMMIT");

      return {
        success: true,
        message: `Venda realizada com sucesso: ${quantity} unidades de ${assetSymbol}`,
        newBalance: this.balance,
        grossValue: grossValue,
        tax: tax,
        netValue: netValue,
        profit: profit,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Erro ao vender ativo: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Obter carteira de investimentos do usuário
   * @returns {Array} Lista de ativos na carteira
   */
  async getPortfolio() {
    try {
      const Portfolio = require('./Portfolio');
      const userId = this.userId;
      
      // Get all portfolio positions
      const positions = await Portfolio.getByUserId(userId);
      
      if (!positions || positions.length === 0) {
        // Return empty structure if no positions
        return {
          assets: [],
          totalInvested: 0,
          currentValue: 0,
          profitLoss: 0,
          profitLossPercentage: 0,
          investmentsByCategory: { chartData: [] },
          performanceByAsset: { chartData: [], series: [{ key: "variacao", name: "Variação %" }] },
          performanceOverTime: {
            chartData: [],
            series: [{ key: "valor", name: "Valor Total" }]
          }
        };
      }
      
      // Transform positions into the format expected by frontend with safe defaults
      const assets = positions.map(pos => {
        // Ensure all numeric values are valid numbers
        const quantity = parseFloat(pos.quantity) || 0;
        const averagePrice = parseFloat(pos.average_price) || 0;
        
        // For fixed income, use average_price as current_price if not available
        let currentPrice = pos.current_price;
        if (currentPrice === null || currentPrice === undefined) {
          currentPrice = averagePrice;
        } else {
          currentPrice = parseFloat(currentPrice);
        }
        
        const totalValue = quantity * currentPrice;
        const invested = quantity * averagePrice;
        const profitLoss = totalValue - invested;
        const profitLossPercentage = invested > 0 ? (profitLoss / invested) * 100 : 0;
        
        return {
          id: pos.id || pos.asset_symbol,
          symbol: pos.asset_symbol || 'N/A',
          name: pos.asset_name || 'Ativo sem nome',
          quantity: quantity,
          averagePrice: averagePrice,
          currentPrice: currentPrice,
          totalValue: totalValue,
          profitLoss: profitLoss,
          profitLossPercentage: profitLossPercentage,
          tipo: pos.asset_type || 'N/A',
          categoria: pos.asset_category || 'N/A'
        };
      });
      
      // Safely calculate aggregated values
      const totalInvested = assets.reduce((sum, asset) => sum + (asset.quantity * asset.averagePrice), 0);
      const currentValue = assets.reduce((sum, asset) => sum + asset.totalValue, 0);
      const profitLoss = currentValue - totalInvested;
      const profitLossPercentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
      
      // Create category data with safe defaults
      const categories = {};
      positions.forEach(pos => {
        const category = pos.asset_category || 'Sem categoria';
        const quantity = parseFloat(pos.quantity) || 0;
        const price = parseFloat(pos.current_price || pos.average_price) || 0;
        const value = quantity * price;
        
        if (!categories[category]) {
          categories[category] = 0;
        }
        categories[category] += value;
      });
      
      const investmentsByCategory = {
        chartData: Object.keys(categories).map(category => ({
          name: category,
          value: categories[category]
        }))
      };
      
      // Create performance by asset data
      const performanceByAsset = {
        chartData: assets.map(asset => ({
          name: asset.symbol,
          variacao: asset.profitLossPercentage
        })),
        series: [{ key: "variacao", name: "Variação %" }]
      };
      
      // Simplified performance over time with safe calculations
      const performanceOverTime = {
        chartData: [
          { name: "3 meses atrás", valor: currentValue * 0.95 },
          { name: "2 meses atrás", valor: currentValue * 0.97 },
          { name: "1 mês atrás", valor: currentValue * 0.99 },
          { name: "Atual", valor: currentValue }
        ],
        series: [{ key: "valor", name: "Valor Total" }]
      };
      
      return {
        assets,
        totalInvested,
        currentValue,
        profitLoss,
        profitLossPercentage,
        investmentsByCategory,
        performanceByAsset,
        performanceOverTime
      };
    } catch (error) {
      console.error("Erro ao obter carteira:", error);
      // Return safe default values on error
      return {
        assets: [],
        totalInvested: 0,
        currentValue: 0,
        profitLoss: 0,
        profitLossPercentage: 0,
        investmentsByCategory: { chartData: [] },
        performanceByAsset: { chartData: [], series: [{ key: "variacao", name: "Variação %" }] },
        performanceOverTime: {
          chartData: [],
          series: [{ key: "valor", name: "Valor Total" }]
        }
      };
    }
  }

  /**
   * Obter resumo da carteira de investimentos
   * @returns {Object} Dados consolidados do portfólio
   */
  async getPortfolioSummary() {
    try {
      const db = require("../config/database");
      
      // Consultar portfólio do usuário na tabela portfolio
      const query = `
        SELECT 
          p.asset_symbol,
          p.quantity,
          p.average_price,
          s.current_price,
          a.nome as asset_name,
          a.categoria as asset_category
        FROM 
          portfolio p
        LEFT JOIN 
          stocks s ON p.asset_symbol = s.symbol
        LEFT JOIN 
          assets a ON s.asset_id = a.id
        WHERE 
          p.account_id = $1
      `;
      
      const result = await db.query(query, [this.id]);
      const positions = result.rows;
      
      // Calcular valores agregados
      const assets = positions.map(pos => {
        // Garantir que todos os valores sejam números válidos
        const quantity = parseFloat(pos.quantity) || 0;
        const averagePrice = parseFloat(pos.average_price) || 0;
        const currentPrice = parseFloat(pos.current_price) || averagePrice;
        
        const totalValue = quantity * currentPrice;
        const invested = quantity * averagePrice;
        const profitLoss = totalValue - invested;
        const profitLossPercentage = invested > 0 ? (profitLoss / invested) * 100 : 0;
        
        return {
          id: pos.asset_symbol,
          symbol: pos.asset_symbol,
          name: pos.asset_name || pos.asset_symbol,
          quantity: quantity,
          averagePrice: averagePrice,
          currentPrice: currentPrice,
          totalValue: totalValue,
          profitLoss: profitLoss,
          profitLossPercentage: profitLossPercentage,
        };
      });
      
      // Calcular totais
      const totalInvested = assets.reduce((sum, asset) => sum + (asset.quantity * asset.averagePrice), 0);
      const currentValue = assets.reduce((sum, asset) => sum + asset.totalValue, 0);
      const profitLoss = currentValue - totalInvested;
      const profitLossPercentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
      
      // Preparar dados para gráficos
      const categories = {};
      positions.forEach(pos => {
        const category = pos.asset_category || 'Outros';
        const quantity = parseFloat(pos.quantity) || 0;
        const price = parseFloat(pos.current_price || pos.average_price) || 0;
        const value = quantity * price;
        
        if (!categories[category]) {
          categories[category] = 0;
        }
        categories[category] += value;
      });
      
      return {
        totalInvested,
        currentValue,
        profitLoss,
        profitLossPercentage,
        assets,
        investmentsByCategory: {
          chartData: Object.keys(categories).map(category => ({
            name: category,
            value: categories[category]
          }))
        },
        performanceByAsset: {
          chartData: assets.map(asset => ({
            name: asset.symbol,
            variacao: asset.profitLossPercentage
          })),
          series: [{ key: "variacao", name: "Variação %" }]
        },
        performanceOverTime: {
          chartData: [
            { name: "3 meses atrás", valor: currentValue * 0.95 },
            { name: "2 meses atrás", valor: currentValue * 0.97 },
            { name: "1 mês atrás", valor: currentValue * 0.99 },
            { name: "Atual", valor: currentValue }
          ],
          series: [{ key: "valor", name: "Valor Total" }]
        }
      };
    } catch (error) {
      console.error("Erro ao obter resumo do portfólio:", error);
      // Retornar estrutura vazia em caso de erro
      return {
        totalInvested: 0,
        currentValue: 0,
        profitLoss: 0,
        profitLossPercentage: 0,
        assets: [],
        investmentsByCategory: { chartData: [] },
        performanceByAsset: { chartData: [], series: [{ key: "variacao", name: "Variação %" }] },
        performanceOverTime: {
          chartData: [],
          series: [{ key: "valor", name: "Valor Total" }]
        }
      };
    }
  }
  // ==================== MÉTODOS DE RELATÓRIOS ====================

  /**
   * Gerar relatório de imposto de renda
   * @param {number} year - Ano para o relatório (padrão: ano atual)
   * @returns {Object} Relatório de IR
   */
  async generateTaxReport(year = new Date().getFullYear()) {
    try {
      // Buscar transações de compra e venda de ativos no ano
      const query = `
        SELECT 
          t.id,
          t.tipo,
          t.valor,
          t.taxa,
          t.created_at,
          EXTRACT(MONTH FROM t.created_at) as month,
          o.asset_id,
          o.quantidade,
          o.preco_unitario,
          o.imposto_retido,
          a.nome as asset_name,
          a.tipo as asset_type
        FROM transactions t
        JOIN operations o ON t.id = o.transaction_ref
        JOIN assets a ON o.asset_id = a.id
        WHERE t.account_id = $1 
        AND EXTRACT(YEAR FROM t.created_at) = $2
        AND t.tipo IN ('venda_ativo', 'compra_ativo')
        ORDER BY t.created_at
      `;
      
      const result = await db.query(query, [this.id, year]);

      let totalTaxPaid = 0;
      let totalProfit = 0;
      let totalLoss = 0;
      const monthlyData = {};
      const transactions = [];

      result.rows.forEach((row) => {
        const month = row.month;
        
        if (!monthlyData[month]) {
          monthlyData[month] = { profit: 0, loss: 0, tax: 0, operations: 0 };
        }

        // Registrar a transação para detalhamento
        if (row.tipo === "venda_ativo") {
          const operationValue = parseFloat(row.valor) || 0;
          const tax = parseFloat(row.imposto_retido) || parseFloat(row.taxa) || 0;
          
          transactions.push({
            id: row.id,
            date: row.created_at,
            type: 'Venda de Ativo',
            asset: row.asset_name,
            asset_type: row.asset_type,
            quantity: row.quantidade,
            price: row.preco_unitario,
            value: operationValue,
            tax: tax
          });
          
          // Adicionar ao resumo mensal
          totalTaxPaid += tax;
          
          // Determinar se é lucro ou prejuízo
          // Na prática seria necessário calcular com base no preço médio
          // mas estamos assumindo que o valor já representa o resultado
          if (operationValue > 0) {
            totalProfit += operationValue;
            monthlyData[month].profit += operationValue;
          } else {
            totalLoss += Math.abs(operationValue);
            monthlyData[month].loss += Math.abs(operationValue);
          }
          
          monthlyData[month].tax += tax;
          monthlyData[month].operations++;
        }
      });

      return {
        year: year,
        totalTaxPaid: totalTaxPaid,
        totalProfit: totalProfit,
        totalLoss: totalLoss,
        monthlyBreakdown: monthlyData,
        transactions: transactions
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de IR:', error);
      throw new Error(`Erro ao gerar relatório de IR: ${error.message}`);
    }
  }

  /**
   * Gerar extrato da conta
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Array} Extrato da conta
   */
  async generateStatement(startDate, endDate) {
    try {
      const query = `
                SELECT 
                    transaction_id,
                    tipo,
                    valor,
                    taxa,
                    created_at
                FROM transactions
                WHERE account_id = $1
                AND created_at BETWEEN $2 AND $3
                ORDER BY created_at DESC
            `;
      const result = await db.query(query, [this.id, startDate, endDate]);

      return {
        accountType: this.type,
        period: { start: startDate, end: endDate },
        transactions: result.rows,
        currentBalance: this.balance,
      };
    } catch (error) {
      throw new Error(`Erro ao gerar extrato: ${error.message}`);
    }
  }

  /**
   * Calcular rentabilidade de investimentos
   * @returns {Object} Resumo de rentabilidade
   */
  async calculateInvestmentPerformance() {
    if (this.type !== "investimento") {
      throw new Error("Método disponível apenas para conta investimento");
    }

    try {
      const portfolioQuery = `
                SELECT 
                    asset_symbol,
                    quantity,
                    average_price
                FROM portfolio 
                WHERE user_id = $1
            `;
      const portfolioResult = await db.query(portfolioQuery, [this.userId]);

      // Aqui você precisaria buscar os preços atuais dos ativos
      // Para fins de exemplo, vou simular:
      const performance = portfolioResult.rows.map((asset) => {
        // Em um cenário real, você buscaria o preço atual de uma API ou tabela de preços
        const currentPrice =
          asset.average_price * (1 + (Math.random() - 0.5) * 0.2); // Simulação
        const totalInvested = asset.quantity * asset.average_price;
        const currentValue = asset.quantity * currentPrice;
        const profitLoss = currentValue - totalInvested;
        const profitLossPercent = (profitLoss / totalInvested) * 100;

        return {
          symbol: asset.asset_symbol,
          quantity: asset.quantity,
          averagePrice: asset.average_price,
          currentPrice: currentPrice,
          totalInvested: totalInvested,
          currentValue: currentValue,
          profitLoss: profitLoss,
          profitLossPercent: profitLossPercent,
        };
      });

      const totalInvested = performance.reduce(
        (sum, asset) => sum + asset.totalInvested,
        0
      );
      const totalCurrentValue = performance.reduce(
        (sum, asset) => sum + asset.currentValue,
        0
      );
      const totalProfitLoss = totalCurrentValue - totalInvested;
      const totalProfitLossPercent =
        totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

      return {
        assets: performance,
        summary: {
          totalInvested,
          totalCurrentValue,
          totalProfitLoss,
          totalProfitLossPercent,
          availableBalance: this.balance,
        },
      };
    } catch (error) {
      throw new Error(`Erro ao calcular performance: ${error.message}`);
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
      // Verificar se há transações de compra recentes (últimas 2 horas)
      const query = `
                SELECT COUNT(*) as pending_count
                FROM transactions t
                WHERE t.account_id = $1 
                AND t.created_at > NOW() - INTERVAL '2 hours'
                AND t.tipo LIKE '%compra%'
                AND t.valor > 0
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

  /**
   * Busca todos os ativos disponíveis para investimento
   * @returns {Array} Lista de todos os ativos (ações e renda fixa)
   */
  static async getAvailableAssets() {
    try {
      // Consulta para obter todas as ações com informações completas
      const queryStocks = `
        SELECT s.id, s.symbol, a.nome AS name, s.current_price AS price, 
               s.daily_variation AS variation, a.tipo AS type, a.categoria AS category
        FROM stocks s
        JOIN assets a ON s.asset_id = a.id
        ORDER BY s.symbol
      `;
      
      // Consulta para obter todos os ativos de renda fixa com informações completas
      const queryFixedIncome = `
        SELECT f.id, f.id AS symbol, f.name, f.minimum_investment AS price,
               f.rate AS variation, a.tipo AS type, a.categoria AS category,
               f.maturity, f.rate, f.rate_type
        FROM fixed_income f
        JOIN assets a ON f.asset_id = a.id
        ORDER BY f.name
      `;
      
      const stocksResult = await db.query(queryStocks);
      const fixedIncomeResult = await db.query(queryFixedIncome);
      
      // Combinar os resultados em uma única lista
      const allAssets = [
        ...stocksResult.rows,
        ...fixedIncomeResult.rows.map(item => ({
          ...item,
          isFixedIncome: true,
          maturityDate: new Date(item.maturity).toLocaleDateString('pt-BR')
        }))
      ];
      
      return allAssets;
    } catch (error) {
      throw new Error(`Erro ao buscar ativos disponíveis: ${error.message}`);
    }
  }

  /**
   * Compra um ativo específico (ação)
   * @param {string} assetId - ID do ativo a ser comprado
   * @param {number} quantity - Quantidade a ser comprada
   * @param {number} price - Preço unitário do ativo
   * @returns {Object} Resultado da operação de compra
   */
  async buyStockAsset(assetId, quantity, price) {
    try {
      // Verificar se a conta é do tipo investimento
      if (this.type !== 'investimento') {
        throw new Error('Operação permitida apenas para contas de investimento');
      }
      
      // Calcular valor total da compra
      const totalValue = price * quantity;
      
      // Verificar se há saldo suficiente
      if (this.balance < totalValue) {
        throw new Error('Saldo insuficiente para esta operação');
      }
      
      // Buscar dados do ativo
      const assetQuery = `
        SELECT s.id, s.symbol, a.nome 
        FROM stocks s 
        JOIN assets a ON s.asset_id = a.id 
        WHERE s.id = $1
      `;
      const assetResult = await db.query(assetQuery, [assetId]);
      
      if (assetResult.rows.length === 0) {
        throw new Error('Ativo não encontrado');
      }
      
      const asset = assetResult.rows[0];
      
      // Iniciar transação
      await db.query('BEGIN');
      
      try {
        // 1. Registrar a transação financeira
        const transactionQuery = `
          INSERT INTO transactions (transaction_id, user_id, account_id, tipo, valor, taxa)
          VALUES (gen_random_uuid(), $1, $2, 'investimento', $3, 0)
          RETURNING id
        `;
        const transactionResult = await db.query(transactionQuery, [
          this.userId, this.id, totalValue
        ]);
        
        const transactionId = transactionResult.rows[0].id;
        
        // 2. Registrar a operação
        const operationQuery = `
          INSERT INTO operations (transaction_ref, asset_id, tipo, quantidade, preco_unitario)
          VALUES ($1, $2, 'compra', $3, $4)
          RETURNING id
        `;
        const operationResult = await db.query(operationQuery, [
          transactionId, assetId, quantity, price
        ]);
        
        // 3. Atualizar ou criar posição no portfólio
        const portfolioQuery = `
          INSERT INTO portfolio (user_id, account_id, asset_symbol, quantity, average_price, purchase_price, transaction_ref)
          VALUES ($1, $2, $3, $4, $5, $5, $6)
          ON CONFLICT (user_id, asset_symbol) 
          DO UPDATE SET 
            quantity = portfolio.quantity + $4,
            average_price = (portfolio.average_price * portfolio.quantity + $5 * $4) / (portfolio.quantity + $4),
            updated_at = NOW()
          RETURNING id
        `;
        await db.query(portfolioQuery, [
          this.userId, this.id, asset.symbol, quantity, price, transactionId
        ]);
        
        // 4. Atualizar o saldo da conta
        const newBalance = this.balance - totalValue;
        const updateQuery = `
          UPDATE accounts SET balance = $1, updated_at = NOW() WHERE id = $2
          RETURNING balance
        `;
        const updateResult = await db.query(updateQuery, [newBalance, this.id]);
        
        // Commit da transação
        await db.query('COMMIT');
        
        // Atualizar o saldo local do objeto
        this.balance = parseFloat(updateResult.rows[0].balance);
        
        return {
          success: true,
          message: 'Ativo comprado com sucesso',
          operation: operationResult.rows[0],
          newBalance: this.balance
        };
      } catch (error) {
        // Rollback em caso de erro
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      throw new Error(`Erro ao comprar ativo: ${error.message}`);
    }
  }

  /**
   * Compra um ativo de renda fixa
   * @param {string} fixedIncomeId - ID do ativo de renda fixa
   * @param {number} amount - Valor a ser investido
   * @returns {Object} Resultado da operação de compra
   */
  async buyFixedIncome(fixedIncomeId, amount) {
    try {
      // Verificar se a conta é do tipo investimento
      if (this.type !== 'investimento') {
        throw new Error('Operação permitida apenas para contas de investimento');
      }
      
      // Verificar se há saldo suficiente
      if (this.balance < amount) {
        throw new Error('Saldo insuficiente para esta operação');
      }
      
      // Buscar dados do ativo de renda fixa
      const assetQuery = `
        SELECT f.*, a.nome, a.tipo 
        FROM fixed_income f 
        JOIN assets a ON f.asset_id = a.id 
        WHERE f.id = $1
      `;
      const assetResult = await db.query(assetQuery, [fixedIncomeId]);
      
      if (assetResult.rows.length === 0) {
        throw new Error('Ativo de renda fixa não encontrado');
      }
      
      const asset = assetResult.rows[0];
      
      // Verificar valor mínimo
      if (amount < asset.minimum_investment) {
        throw new Error(`O valor mínimo para investimento é ${asset.minimum_investment}`);
      }
      
      // Iniciar transação
      await db.query('BEGIN');
      
      try {
        // 1. Registrar a transação financeira
        const transactionQuery = `
          INSERT INTO transactions (transaction_id, user_id, account_id, tipo, valor, taxa)
          VALUES (gen_random_uuid(), $1, $2, 'investimento', $3, 0)
          RETURNING id
        `;
        const transactionResult = await db.query(transactionQuery, [
          this.userId, this.id, amount
        ]);
        
        const transactionId = transactionResult.rows[0].id;
        
        // 2. Registrar a operação (considere 1 unidade com preço = amount)
        const operationQuery = `
          INSERT INTO operations (transaction_ref, asset_id, tipo, quantidade, preco_unitario)
          VALUES ($1, $2, 'compra', 1, $3)
          RETURNING id
        `;
        const operationResult = await db.query(operationQuery, [
          transactionId, asset.asset_id, amount
        ]);
        
        // 3. Atualizar ou criar posição no portfólio para renda fixa
        const portfolioQuery = `
          INSERT INTO portfolio (user_id, account_id, asset_symbol, quantity, average_price, purchase_price, transaction_ref)
          VALUES ($1, $2, $3, 1, $4, $4, $5)
          RETURNING id
        `;
        await db.query(portfolioQuery, [
          this.userId, this.id, fixedIncomeId, amount, transactionId
        ]);
        
        // 4. Atualizar o saldo da conta
        const newBalance = this.balance - amount;
        const updateQuery = `
          UPDATE accounts SET balance = $1, updated_at = NOW() WHERE id = $2
          RETURNING balance
        `;
        const updateResult = await db.query(updateQuery, [newBalance, this.id]);
        
        // Commit da transação
        await db.query('COMMIT');
        
        // Atualizar o saldo local do objeto
        this.balance = parseFloat(updateResult.rows[0].balance);
        
        return {
          success: true,
          message: 'Investimento em renda fixa realizado com sucesso',
          operation: operationResult.rows[0],
          newBalance: this.balance
        };
      } catch (error) {
        // Rollback em caso de erro
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      throw new Error(`Erro ao investir em renda fixa: ${error.message}`);
    }
  }
}

module.exports = Account;
