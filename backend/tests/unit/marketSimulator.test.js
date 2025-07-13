const Asset = require('../../models/Asset');

describe('Market Simulator', () => {
  // Testar a distribuição de probabilidade das variações
  test('should generate market variation according to probability distribution', () => {
    // Criamos um histograma para acompanhar as distribuições
    const histogram = {
      range1: 0, // 0.1% a 2%
      range2: 0, // 2% a 3%
      range3: 0, // 3% a 4%
      range4: 0  // 4% a 5%
    };
    
    const sampleSize = 10000;
    
    // Gerar várias amostras para validar a distribuição
    for (let i = 0; i < sampleSize; i++) {
      const variation = Asset.generateMarketVariation();
      const absVariation = Math.abs(variation);
      
      if (absVariation >= 0.1 && absVariation < 2) {
        histogram.range1++;
      } else if (absVariation >= 2 && absVariation < 3) {
        histogram.range2++;
      } else if (absVariation >= 3 && absVariation < 4) {
        histogram.range3++;
      } else if (absVariation >= 4 && absVariation <= 5) {
        histogram.range4++;
      }
    }
    
    // Verificar se a distribuição está dentro de margens aceitáveis
    expect(histogram.range1 / sampleSize).toBeCloseTo(0.4, 1); // ~40%
    expect(histogram.range2 / sampleSize).toBeCloseTo(0.3, 1); // ~30%
    expect(histogram.range3 / sampleSize).toBeCloseTo(0.2, 1); // ~20%
    expect(histogram.range4 / sampleSize).toBeCloseTo(0.1, 1); // ~10%
  });

  test('should update stock prices properly', async () => {
    // Mock para getStocksWithPrices
    Asset.getStocksWithPrices = jest.fn().mockResolvedValue([
      { id: '1', symbol: 'PETR4', currentPrice: 30, nome: 'Petrobras' },
      { id: '2', symbol: 'VALE3', currentPrice: 70, nome: 'Vale' }
    ]);
    
    // Mock para updateStockPrice
    Asset.updateStockPrice = jest.fn().mockImplementation((id, price) => {
      return Promise.resolve({
        oldPrice: id === '1' ? 30 : 70,
        newPrice: price
      });
    });
    
    // Substituir generateMarketVariation com valores fixos para o teste
    const originalMethod = Asset.generateMarketVariation;
    Asset.generateMarketVariation = jest.fn()
      .mockReturnValueOnce(5.0)  // Para PETR4: +5%
      .mockReturnValueOnce(-2.0); // Para VALE3: -2%
    
    try {
      // Act
      const result = await Asset.simulateMarketVariation();
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.updates).toHaveLength(2);
      
      // Verificar primeiro ativo (PETR4)
      expect(result.updates[0].symbol).toBe('PETR4');
      expect(result.updates[0].oldPrice).toBe(30);
      expect(result.updates[0].newPrice).toBeCloseTo(31.5, 1); // 30 + 5%
      
      // Verificar segundo ativo (VALE3)
      expect(result.updates[1].symbol).toBe('VALE3');
      expect(result.updates[1].oldPrice).toBe(70);
      expect(result.updates[1].newPrice).toBeCloseTo(68.6, 1); // 70 - 2%
    } finally {
      // Restaurar método original
      Asset.generateMarketVariation = originalMethod;
    }
  });
});