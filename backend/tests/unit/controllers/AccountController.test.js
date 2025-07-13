const AccountController = require('../../../controllers/AccountController');
const Account = require('../../../models/Account');

// Mock the Account model
jest.mock('../../../models/Account');

describe('AccountController', () => {
  let req;
  let res;

  beforeEach(() => {
    // Clear all mock implementations
    jest.clearAllMocks();
    
    // Setup request and response objects
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

  describe('getUserAccounts', () => {
    it('should return accounts when user has accounts', async () => {
      // Arrange
      req.params.userId = '123';
      
      const mockAccounts = [
        new Account('acc1', '123', 'corrente', 1000.00, new Date(), new Date()),
        new Account('acc2', '123', 'investimento', 5000.00, new Date(), new Date())
      ];
      
      Account.findByUserId.mockResolvedValueOnce(mockAccounts);

      // Act
      await AccountController.getUserAccounts(req, res);

      // Assert
      expect(Account.findByUserId).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        data: mockAccounts
      });
    });

    it('should return 400 when user id is missing', async () => {
      // Arrange
      req.params.userId = '';

      // Act
      await AccountController.getUserAccounts(req, res);

      // Assert
      expect(Account.findByUserId).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("ID do usuário é obrigatório")
      });
    });
  });

  describe('buyFixedIncome', () => {
    it('should process fixed income purchase successfully', async () => {
      // Arrange
      req.params.accountId = 'acc1';
      req.body = {
        fixedIncomeId: 'FI001',
        amount: 5000
      };
      
      const mockAccount = {
        id: 'acc1',
        buyFixedIncome: jest.fn().mockResolvedValueOnce({
          success: true,
          message: 'Investimento em renda fixa realizado com sucesso',
          newBalance: 5000.00
        })
      };
      
      Account.findById.mockResolvedValueOnce(mockAccount);

      // Act
      await AccountController.buyFixedIncome(req, res);

      // Assert
      expect(Account.findById).toHaveBeenCalledWith('acc1');
      expect(mockAccount.buyFixedIncome).toHaveBeenCalledWith('FI001', 5000);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.stringContaining('Investimento em renda fixa realizado com sucesso'),
        newBalance: 5000.00
      });
    });

    it('should return 400 when amount is missing', async () => {
      // Arrange
      req.params.accountId = 'acc1';
      req.body = {
        fixedIncomeId: 'FI001'
        // amount missing
      };

      // Act
      await AccountController.buyFixedIncome(req, res);

      // Assert
      expect(Account.findById).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("ID do ativo de renda fixa e valor são obrigatórios")
      });
    });

    it('should return 404 when account is not found', async () => {
      // Arrange
      req.params.accountId = 'non-existent';
      req.body = {
        fixedIncomeId: 'FI001',
        amount: 5000
      };
      
      Account.findById.mockResolvedValueOnce(null);

      // Act
      await AccountController.buyFixedIncome(req, res);

      // Assert
      expect(Account.findById).toHaveBeenCalledWith('non-existent');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("Conta não encontrada")
      });
    });
  });

  describe('getPortfolioSummary', () => {
    it('should return portfolio summary successfully', async () => {
      // Arrange
      req.params.accountId = 'acc1';
      
      const mockSummary = {
        assets: [],
        totalInvested: 10000,
        currentValue: 12000,
        profitLoss: 2000,
        profitLossPercentage: 20
      };
      
      const mockAccount = {
        id: 'acc1',
        getPortfolioSummary: jest.fn().mockResolvedValueOnce(mockSummary)
      };
      
      Account.findById.mockResolvedValueOnce(mockAccount);

      // Act
      await AccountController.getPortfolioSummary(req, res);

      // Assert
      expect(Account.findById).toHaveBeenCalledWith('acc1');
      expect(mockAccount.getPortfolioSummary).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        data: mockSummary
      });
    });
  });
});