import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const AssetPurchaseForm = ({ selectedAsset, availableBalance, onPurchase }) => {
  const [quantity, setQuantity] = useState(1);
  const [totalValue, setTotalValue] = useState(0);
  const [error, setError] = useState('');

  // Recalcular o valor total quando o ativo ou quantidade mudar
  useEffect(() => {
    if (selectedAsset) {
      const total = selectedAsset.price * quantity;
      setTotalValue(total);
      
      // Validar se há saldo suficiente
      if (total > availableBalance) {
        setError('Saldo insuficiente para esta compra');
      } else {
        setError('');
      }
    }
  }, [selectedAsset, quantity, availableBalance]);

  // Lidar com mudança na quantidade
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else {
      setQuantity(value);
    }
  };

  // Lidar com o envio do formulário
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (error) return;
    
    if (!selectedAsset) {
      setError('Selecione um ativo para comprar');
      return;
    }
    
    onPurchase({
      assetId: selectedAsset.id,
      quantity: quantity,
      totalValue: totalValue
    });
  };

  if (!selectedAsset) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mt-6">
        <div className="text-center text-gray-500 py-8">
          Selecione um ativo para começar a compra
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md p-6 mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Comprar Ativo</h2>
      
      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Ativo selecionado</p>
            <p className="text-lg font-bold text-gray-800">{selectedAsset.symbol}</p>
            <p className="text-sm text-gray-600">{selectedAsset.name}</p>
            {selectedAsset.isFixedIncome && (
              <div className="text-xs mt-1 text-gray-500">
                Vencimento: {selectedAsset.maturityDate}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">
              {selectedAsset.isFixedIncome ? 'Valor mínimo' : 'Preço unitário'}
            </p>
            <p className="text-lg font-bold text-gray-800">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAsset.price)}
            </p>
            {selectedAsset.isFixedIncome && (
              <div className="text-xs text-green-600">
                Taxa: {(selectedAsset.variation * 100).toFixed(2)}%
                {selectedAsset.rate_type === 'pre' ? ' a.a.' : ' + SELIC'}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
            Quantidade
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            min="1"
            value={quantity}
            onChange={handleQuantityChange}
            className="block w-full py-3 px-4 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-700">Valor total da compra</p>
            <p className="text-xl font-bold text-blue-700">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
            </p>
          </div>
          
          {error && (
            <div className="mt-2 p-2 bg-red-50 text-red-700 rounded-md flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>{error}</span>
            </div>
          )}
        </div>
        
        <motion.button
          type="submit"
          disabled={!!error || totalValue <= 0}
          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            error || totalValue <= 0 ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          whileHover={{ scale: error ? 1 : 1.02 }}
          whileTap={{ scale: error ? 1 : 0.98 }}
        >
          Confirmar Compra
        </motion.button>
      </form>
    </motion.div>
  );
};

export default AssetPurchaseForm;