const AssetController = require('../../../controllers/AssetController');
const Asset = require('../../../models/Asset');

// Mock the Asset model
jest.mock('../../../models/Asset');

describe('AssetController', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      params: {},
      query: {},
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('getAllAssets', () => {
    it('should return all assets successfully', async () => {
      // Arrange
      const mockAssets = [
        { id: 'A1', symbol: 'PETR4', name: 'Petrobras' },
        { id: 'A2', symbol: 'VALE3', name: 'Vale' }
      ];
      
      Asset.getAllAssets = jest.fn().mockResolvedValueOnce(mockAssets);

      // Act
      await AssetController.getAllAssets(req, res);

      // Assert
      expect(Asset.getAllAssets).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        data: mockAssets,
        total: 2
      });
    });

    it('should handle errors when fetching assets fails', async () => {
      // Arrange
      Asset.getAllAssets = jest.fn().mockRejectedValueOnce(new Error('Database error'));

      // Act
      await AssetController.getAllAssets(req, res);

      // Assert
      expect(Asset.getAllAssets).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('Erro ao listar ativos'),
        error: 'Database error'
      });
    });
  });

  describe('getFixedIncomesByInvestmentRange', () => {
    it('should return fixed income products within range', async () => {
      // Arrange
      req.query = {
        min: '1000',
        max: '5000'
      };
      
      const mockProducts = [
        { id: 'F1', name: 'CDB Banco A', minimum_investment: 1500 },
        { id: 'F2', name: 'LCI Banco B', minimum_investment: 3000 }
      ];
      
      Asset.getFixedIncomesByInvestmentRange = jest.fn().mockResolvedValueOnce(mockProducts);

      // Act
      await AssetController.getFixedIncomesByInvestmentRange(req, res);

      // Assert
      expect(Asset.getFixedIncomesByInvestmentRange).toHaveBeenCalledWith(1000, 5000);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        data: mockProducts,
        total: 2,
        filter: {
          minAmount: 1000,
          maxAmount: 5000,
        },
      });
    });

    it('should return 400 when min value is missing', async () => {
      // Arrange
      req.query = {
        max: '5000'
      };

      // Act
      await AssetController.getFixedIncomesByInvestmentRange(req, res);

      // Assert
      expect(Asset.getFixedIncomesByInvestmentRange).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("Valor mínimo é obrigatório")
      });
    });
  });

  describe('calculateFixedIncomeReturn', () => {
    it('should calculate and return income projection', async () => {
      // Arrange
      req.body = {
        principal: 10000,
        annualRate: 10,
        maturityDate: '2024-12-31'
      };
      
      const mockCalculation = {
        principal: 10000,
        rate: 10,
        maturityDate: new Date('2024-12-31'),
        interestAmount: 1000,
        totalReturn: 11000
      };
      
      Asset.calculateFixedIncomeReturn = jest.fn().mockReturnValueOnce(mockCalculation);

      // Act
      await AssetController.calculateFixedIncomeReturn(req, res);

      // Assert
      expect(Asset.calculateFixedIncomeReturn).toHaveBeenCalledWith(10000, 10, '2024-12-31');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        data: mockCalculation
      });
    });

    it('should return 400 when required parameters are missing', async () => {
      // Arrange
      req.body = {
        principal: 10000,
        // annualRate is missing
        maturityDate: '2024-12-31'
      };

      // Act
      await AssetController.calculateFixedIncomeReturn(req, res);

      // Assert
      expect(Asset.calculateFixedIncomeReturn).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("obrigatórios")
      });
    });
  });
});