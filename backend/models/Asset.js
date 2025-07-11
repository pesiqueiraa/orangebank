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
}

module.exports = Asset;
