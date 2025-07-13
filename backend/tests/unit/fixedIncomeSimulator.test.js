const Asset = require('../../models/Asset');

describe('Fixed Income Return Simulator', () => {
  test('should calculate correct returns for a fixed income investment', () => {
    // Arrange
    const principal = 10000;  // R$ 10.000,00
    const annualRate = 0.12;  // 12% ao ano
    const maturityDate = new Date();
    maturityDate.setFullYear(maturityDate.getFullYear() + 1); // 1 ano no futuro
    
    // Act
    const result = Asset.calculateFixedIncomeReturn(principal, annualRate, maturityDate);
    
    // Assert
    expect(result).toHaveProperty('grossReturn');
    expect(result).toHaveProperty('netReturn');
    expect(result).toHaveProperty('totalGross');
    expect(result).toHaveProperty('totalNet');
    expect(result).toHaveProperty('tax');
    
    // O rendimento bruto deve ser aproximadamente 12% do principal
    expect(result.grossReturn).toBeCloseTo(1200, -1);
    
    // O imposto deve ser 22% do rendimento bruto
    expect(result.tax).toBeCloseTo(result.grossReturn * 0.22, 1);
    
    // O rendimento líquido deve ser o rendimento bruto menos o imposto
    expect(result.netReturn).toBeCloseTo(result.grossReturn - result.tax, 1);
    
    // A taxa de imposto deve ser 22% para renda fixa
    expect(result.taxRate).toBe(0.22);
  });

  test('should return original principal when maturity date is in the past', () => {
    // Arrange
    const principal = 10000;
    const annualRate = 0.12;
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1); // 1 ano no passado
    
    // Act
    const result = Asset.calculateFixedIncomeReturn(principal, annualRate, pastDate);
    
    // Assert
    expect(result.grossReturn).toBe(0);
    expect(result.netReturn).toBe(0);
    expect(result.totalGross).toBe(principal);
    expect(result.totalNet).toBe(principal);
    expect(result.taxRate).toBe(0);
  });
});