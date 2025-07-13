const Asset = require('../../../models/Asset');
const mockDb = require('../../mocks/database.mock');

// Mock the database module
jest.mock('../../../config/database', () => {
  return mockDb;
});

describe('Asset Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFixedIncomeById', () => {
    it('should return fixed income product when found', async () => {
      // Arrange
      const mockFixedIncome = {
        id: 'FI001',
        asset_id: 'A001',
        name: 'CDB Banco Test',
        minimum_investment: 1000,
        rate: 10,
        rate_type: 'pre'
      };
      
      mockDb.query.mockResolvedValueOnce({
        rows: [mockFixedIncome]
      });

      // Act
      const result = await Asset.getFixedIncomeById('FI001');

      // Assert
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockFixedIncome);
    });

    it('should return null when fixed income is not found', async () => {
      // Arrange
      mockDb.query.mockResolvedValueOnce({
        rows: []
      });

      // Act
      const result = await Asset.getFixedIncomeById('non-existent');

      // Assert
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe('validateMinimumInvestment', () => {
    it('should validate when amount meets minimum investment', async () => {
      // Arrange
      const fixedIncomeId = 'FI001';
      const amount = 2000;
      
      jest.spyOn(Asset, 'getFixedIncomeById').mockResolvedValueOnce({
        id: fixedIncomeId,
        minimum_investment: 1000
      });

      // Act
      const result = await Asset.validateMinimumInvestment(fixedIncomeId, amount);

      // Assert
      expect(Asset.getFixedIncomeById).toHaveBeenCalledWith(fixedIncomeId);
      expect(result.isValid).toBe(true);
      expect(result.minimumRequired).toBe(1000);
      expect(result.providedAmount).toBe(2000);
      expect(result.difference).toBe(0);
    });

    it('should invalidate when amount is below minimum investment', async () => {
      // Arrange
      const fixedIncomeId = 'FI001';
      const amount = 500;
      
      jest.spyOn(Asset, 'getFixedIncomeById').mockResolvedValueOnce({
        id: fixedIncomeId,
        minimum_investment: 1000
      });

      // Act
      const result = await Asset.validateMinimumInvestment(fixedIncomeId, amount);

      // Assert
      expect(Asset.getFixedIncomeById).toHaveBeenCalledWith(fixedIncomeId);
      expect(result.isValid).toBe(false);
      expect(result.minimumRequired).toBe(1000);
      expect(result.providedAmount).toBe(500);
      expect(result.difference).toBe(500);
    });
  });

  describe('calculateFixedIncomeReturn', () => {
    it('should calculate pre-fixed income return correctly', () => {
      // Arrange
      const principal = 10000;
      const annualRate = 10; // 10%
      const maturityDate = new Date(2024, 11, 31); // December 31, 2024
      
      // Mock current date
      const currentDate = new Date(2024, 0, 1); // January 1, 2024
      jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

      // Act
      const result = Asset.calculateFixedIncomeReturn(principal, annualRate, maturityDate);

      // Assert
      expect(result.principal).toBe(principal);
      expect(result.rate).toBe(annualRate);
      expect(result.maturityDate).toEqual(maturityDate);
      expect(result.interestAmount).toBeDefined();
      expect(result.totalReturn).toBeGreaterThan(principal);
      
      // Restore Date
      jest.restoreAllMocks();
    });
  });
});