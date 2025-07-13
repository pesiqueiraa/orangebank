const Account = require('../../../models/Account');
const mockDb = require('../../mocks/database.mock');

// Mock the database module
jest.mock('../../../config/database', () => {
  return mockDb;
});

describe('Account Model', () => {
  beforeEach(() => {
    // Clear all mock implementations before each test
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return an account when given a valid id', async () => {
      // Arrange
      const mockAccountData = {
        id: '123',
        user_id: '456',
        type: 'corrente',
        balance: '1000.00',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockDb.query.mockResolvedValueOnce({
        rows: [mockAccountData]
      });

      // Act
      const account = await Account.findById('123');

      // Assert
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(account).toBeInstanceOf(Account);
      expect(account.id).toBe('123');
      expect(account.balance).toBe(1000.00); // Verify it's parsed as float
    });

    it('should return null when account is not found', async () => {
      // Arrange
      mockDb.query.mockResolvedValueOnce({
        rows: []
      });

      // Act
      const account = await Account.findById('non-existent-id');

      // Assert
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(account).toBeNull();
    });
  });

  describe('deposit', () => {
    it('should increase account balance when depositing money', async () => {
      // Arrange
      const account = new Account('123', '456', 'corrente', 1000.00, new Date(), new Date());
      const depositAmount = 500.00;
      
      mockDb.query.mockResolvedValueOnce({
        rows: [{ balance: '1500.00' }]
      });

      // Act
      const result = await account.deposit(depositAmount);

      // Assert
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(account.balance).toBe(1500.00);
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(1500.00);
    });

    it('should throw error when depositing to investment account', async () => {
      // Arrange
      const account = new Account('123', '456', 'investimento', 1000.00, new Date(), new Date());
      const depositAmount = 500.00;

      // Act & Assert
      await expect(account.deposit(depositAmount)).rejects.toThrow(
        "Depósito só pode ser realizado na conta corrente"
      );
      expect(mockDb.query).not.toHaveBeenCalled();
    });
  });

  describe('buyFixedIncome', () => {
    it('should successfully purchase fixed income asset', async () => {
      // Arrange
      const account = new Account('123', '456', 'investimento', 10000.00, new Date(), new Date());
      const fixedIncomeId = 'FI001';
      const amount = 5000.00;
      
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      
      // Mock the asset query result
      mockDb.query.mockImplementationOnce(async (query, params) => {
        if (query.includes('SELECT f.*, a.nome, a.tipo')) {
          return {
            rows: [{
              id: fixedIncomeId,
              asset_id: 'A001',
              name: 'Test Fixed Income',
              minimum_investment: 1000,
              rate: 10,
              rate_type: 'pre',
              maturity: new Date(2025, 0, 1)
            }]
          };
        }
      });
      
      // Mock transaction creation
      mockDb.query.mockImplementationOnce(async () => ({
        rows: [{ id: 'T001' }]
      }));
      
      // Mock operation recording
      mockDb.query.mockImplementationOnce(async () => ({
        rows: [{ id: 'OP001' }]
      }));
      
      // Mock portfolio update
      mockDb.query.mockImplementationOnce(async () => ({
        rows: [{ id: 'P001' }]
      }));
      
      // Mock account balance update
      mockDb.query.mockImplementationOnce(async () => ({
        rows: [{ balance: '5000.00' }]
      }));

      // Act
      const result = await account.buyFixedIncome(fixedIncomeId, amount);

      // Assert
      expect(mockDb.query).toHaveBeenCalledTimes(5); // 5 queries: find asset, BEGIN, transaction, portfolio, balance
      expect(result.success).toBe(true);
      expect(account.balance).toBe(5000.00);
    });
  });
});