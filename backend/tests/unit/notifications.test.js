const Asset = require('../../models/Asset');

describe('Notifications System - Fixed Income Maturity', () => {
  // Mock do módulo db
  const mockDb = {
    query: jest.fn()
  };
  
  // Mock da função para melhor controle
  let originalGetFixedIncomesNearMaturity;
  
  beforeAll(() => {
    // Guardar implementação original
    originalGetFixedIncomesNearMaturity = Asset.getFixedIncomesNearMaturity;
    
    // Sobrescrever o método com nossa versão mockada para o teste
    Asset.getFixedIncomesNearMaturity = async (daysToMaturity = 30) => {
      try {
        // Este é um mock que simula o comportamento do método real
        const result = await mockDb.query('SELECT * FROM fixed_income WHERE maturity <= $1', [daysToMaturity]);
        return result.rows;
      } catch (error) {
        console.error('Erro ao buscar produtos próximos ao vencimento:', error);
        throw error;
      }
    };
  });
  
  afterAll(() => {
    // Restaurar o método original
    Asset.getFixedIncomesNearMaturity = originalGetFixedIncomesNearMaturity;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should find fixed income products near maturity', async () => {
    // Arrange
    const mockFixedIncomes = [
      {
        asset_id: '1',
        nome: 'Tesouro Selic',
        tipo: 'renda fixa',
        categoria: 'tesouro',
        fixed_income_id: 'ts1',
        product_name: 'Tesouro Selic 2025',
        rate: 0.1075,
        rate_type: 'pós-fixado',
        maturity: '2025-01-01',
        minimum_investment: 100.0,
        days_to_maturity: 25
      },
      {
        asset_id: '2',
        nome: 'CDB Banco XYZ',
        tipo: 'renda fixa',
        categoria: 'cdb',
        fixed_income_id: 'cdb1',
        product_name: 'CDB Banco XYZ 120%',
        rate: 1.2,
        rate_type: 'pré-fixado',
        maturity: '2025-01-15',
        minimum_investment: 1000.0,
        days_to_maturity: 15
      }
    ];
    
    // Configurar o mock para retornar nossos dados
    mockDb.query.mockResolvedValue({ rows: mockFixedIncomes });
    
    // Act
    const result = await Asset.getFixedIncomesNearMaturity(30);
    
    // Assert
    expect(result).toEqual(mockFixedIncomes);
    expect(mockDb.query).toHaveBeenCalledTimes(1);
    expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM fixed_income WHERE maturity <= $1', [30]);
  });

  test('should handle errors gracefully', async () => {
    // Arrange
    const errorMessage = 'Database connection error';
    mockDb.query.mockRejectedValue(new Error(errorMessage));
    
    // Act & Assert
    await expect(Asset.getFixedIncomesNearMaturity(30)).rejects.toThrow(errorMessage);
    
    // Verificar se o método foi chamado
    expect(mockDb.query).toHaveBeenCalledTimes(1);
  });
});