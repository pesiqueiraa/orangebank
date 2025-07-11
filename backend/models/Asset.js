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
}

module.exports = Asset;
