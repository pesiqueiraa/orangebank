const Portfolio = require('../../../models/Portfolio');
const mockDb = require('../../mocks/database.mock');

// Mock the database module
jest.mock('../../../config/database', () => {
  return mockDb;
});

describe('Portfolio Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getByUserId', () => {
    it('should return portfolio positions for a user', async () => {
      // Arrange
      const userId = 'user123';
      const mockPositions = [
        { asset_symbol: 'PETR4', quantity: 100, average_price: 25.75 },
        { asset_symbol: 'VALE3', quantity: 50, average_price: 68.20 }
      ];
      
      mockDb.query.mockResolvedValueOnce({
        rows: mockPositions
      });

      // Act
      const result = await Portfolio.getByUserId(userId);

      // Assert
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), [userId]);
      expect(result).toEqual(mockPositions);
    });

    it('should return empty array when user has no positions', async () => {
      // Arrange
      const userId = 'user-without-portfolio';
      
      mockDb.query.mockResolvedValueOnce({
        rows: []
      });

      // Act
      const result = await Portfolio.getByUserId(userId);

      // Assert
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });

  describe('addOrUpdatePosition', () => {
    it('should update position when asset already exists in portfolio', async () => {
      // Arrange
      const userId = 'user123';
      const accountId = 'acc123';
      const assetSymbol = 'PETR4';
      const quantity = 10;
      const unitPrice = 26.50;
      const transactionRef = 'tx123';
      
      const existingPosition = {
        quantity: 100,
        average_price: 25.75
      };
      
      jest.spyOn(Portfolio, 'getPosition').mockResolvedValueOnce(existingPosition);
      
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 'pos1', quantity: 110, average_price: 25.82 }]
      });

      // Act
      const result = await Portfolio.addOrUpdatePosition(
        userId, accountId, assetSymbol, quantity, unitPrice, transactionRef
      );

      // Assert
      expect(Portfolio.getPosition).toHaveBeenCalledWith(userId, assetSymbol);
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(mockDb.query.mock.calls[0][0]).toContain('UPDATE portfolio');
      expect(result.quantity).toBe(110);
      expect(result.average_price).toBe(25.82);
    });

    it('should create new position when asset does not exist in portfolio', async () => {
      // Arrange
      const userId = 'user123';
      const accountId = 'acc123';
      const assetSymbol = 'VALE3';
      const quantity = 50;
      const unitPrice = 68.20;
      const transactionRef = 'tx456';
      
      jest.spyOn(Portfolio, 'getPosition').mockResolvedValueOnce(null);
      
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 'pos2', quantity: 50, average_price: 68.20 }]
      });

      // Act
      const result = await Portfolio.addOrUpdatePosition(
        userId, accountId, assetSymbol, quantity, unitPrice, transactionRef
      );

      // Assert
      expect(Portfolio.getPosition).toHaveBeenCalledWith(userId, assetSymbol);
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(mockDb.query.mock.calls[0][0]).toContain('INSERT INTO portfolio');
      expect(result.quantity).toBe(50);
      expect(result.average_price).toBe(68.20);
    });
  });
});