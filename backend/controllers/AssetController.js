const Asset = require('../models/Asset');

class AssetController {
  
  // ==================== LISTAGEM E BUSCA DE ATIVOS ====================

  /**
   * Listar todos os ativos
   * GET /api/assets
   */
  static async getAllAssets(req, res) {
    try {
      const assets = await Asset.getAllAssets();
      
      return res.status(200).json({
        success: true,
        message: 'Ativos listados com sucesso',
        data: assets,
        total: assets.length
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar ativos',
        error: error.message
      });
    }
  }
}

module.exports = AssetController;