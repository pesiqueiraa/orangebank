import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const AssetSellForm = ({ selectedAsset, onSell }) => {
  const [quantity, setQuantity] = useState(1);
  const [totalValue, setTotalValue] = useState(0);
  const [error, setError] = useState(null);
  
  // Calculate total value whenever selectedAsset or quantity changes
  useEffect(() => {
    if (selectedAsset && selectedAsset.currentPrice) {
      setTotalValue(selectedAsset.currentPrice * quantity);
    }
  }, [selectedAsset, quantity]);

  // Reset form when selectedAsset changes
  useEffect(() => {
    setQuantity(1);
    setError(null);
  }, [selectedAsset]);

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (selectedAsset && selectedAsset.quantity && value > selectedAsset.quantity) {
      setQuantity(selectedAsset.quantity);
      setError(`Você possui apenas ${selectedAsset.quantity} unidades deste ativo`);
    } else {
      setQuantity(value);
      setError(null);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (error) return;
    
    if (!selectedAsset) {
      setError('Selecione um ativo para vender');
      return;
    }
    
    onSell({
      assetSymbol: selectedAsset.symbol,
      quantity: quantity,
      currentPrice: selectedAsset.currentPrice
    });
  };

  if (!selectedAsset) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mt-6">
        <div className="text-center text-gray-500 py-8">
          Selecione um ativo do seu portfólio para vender
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
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Vender Ativo</h2>
      
      <div className="flex flex-col mb-6">
        <h3 className="font-medium text-gray-700">{selectedAsset.name} ({selectedAsset.symbol})</h3>
        <div className="mt-1 flex justify-between">
          <span className="text-sm text-gray-500">Preço atual:</span>
          <span className="font-medium">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAsset.currentPrice)}
          </span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-sm text-gray-500">Quantidade disponível:</span>
          <span className="font-medium">{selectedAsset.quantity} unidades</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-sm text-gray-500">Preço médio de compra:</span>
          <span className="font-medium">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAsset.averagePrice)}
          </span>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md flex items-center">
          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade a vender
          </label>
          <input
            id="quantity"
            type="number"
            min="1"
            max={selectedAsset.quantity}
            value={quantity}
            onChange={handleQuantityChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Valor total da venda:</span>
            <span className="text-lg font-bold text-orange-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            * Impostos e taxas serão calculados automaticamente no momento da venda
          </p>
        </div>
        
        <button
          type="submit"
          className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          Vender Ativo
        </button>
      </form>
    </motion.div>
  );
};

export default AssetSellForm;