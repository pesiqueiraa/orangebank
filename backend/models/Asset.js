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
}

module.exports = Asset;
