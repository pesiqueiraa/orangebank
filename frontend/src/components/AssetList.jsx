import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';

const AssetList = ({ assets, onSelectAsset, selectedAssetId }) => {
  const [filterType, setFilterType] = useState('all'); // 'all', 'stock', 'fixed'
  
  // Filtrar assets por tipo
  const filteredAssets = assets.filter(asset => {
    if (filterType === 'all') return true;
    if (filterType === 'stock') return asset.type === 'ação';
    if (filterType === 'fixed') return asset.type === 'renda fixa';
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Ativos Disponíveis</h2>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-sm rounded-md ${
              filterType === 'all' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilterType('stock')}
            className={`px-3 py-1 text-sm rounded-md ${
              filterType === 'stock' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Ações
          </button>
          <button 
            onClick={() => setFilterType('fixed')}
            className={`px-3 py-1 text-sm rounded-md ${
              filterType === 'fixed' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Renda Fixa
          </button>
        </div>
      </div>
      
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ativo
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {filterType === 'fixed' ? 'Valor Mín.' : 'Preço'}
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {filterType === 'fixed' ? 'Taxa' : 'Variação'}
              </th>
              <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ação
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-3 py-4 text-center text-gray-500">
                  Nenhum ativo encontrado.
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => (
                <motion.tr 
                  key={asset.id}
                  whileHover={{ backgroundColor: "#f9fafb" }}
                  className={`${selectedAssetId === asset.id ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                        {asset.symbol ? asset.symbol.slice(0, 1) : '#'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{asset.symbol}</div>
                        <div className="text-sm text-gray-500">{asset.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.price)}
                    </div>
                    {asset.isFixedIncome && (
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Venc: {asset.maturityDate}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {asset.isFixedIncome ? (
                      <div className="text-sm text-green-600">
                        {typeof asset.variation === 'number' 
                          ? (asset.variation * 100).toFixed(2) 
                          : '0.00'}% {asset.rate_type === 'pre' ? 'a.a.' : '+ SELIC'}
                      </div>
                    ) : (
                      <div className={`flex items-center text-sm ${Number(asset.variation) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Number(asset.variation) >= 0 ? 
                          <TrendingUp className="h-4 w-4 mr-1" /> : 
                          <TrendingDown className="h-4 w-4 mr-1" />
                        }
                        {Number(asset.variation) >= 0 ? '+' : ''}
                        {typeof asset.variation === 'number'
                          ? asset.variation.toFixed(2)
                          : Number(asset.variation).toFixed(2)}%
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => onSelectAsset(asset)}
                      className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                        selectedAssetId === asset.id
                          ? 'text-white bg-blue-600 hover:bg-blue-700'
                          : 'text-blue-600 bg-white border-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      {selectedAssetId === asset.id ? 'Selecionado' : 'Selecionar'}
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetList;