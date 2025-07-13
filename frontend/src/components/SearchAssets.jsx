import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const SearchAssets = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Implementar debounce para evitar muitas chamadas durante a digitação
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, onSearch]);

  // Limpar termo de busca
  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className={`relative mb-4 transition-all ${isFocused ? 'ring-2 ring-blue-400' : ''}`}>
      <div className="flex items-center bg-white rounded-lg border border-gray-300 overflow-hidden">
        <div className="pl-3 text-gray-400">
          <Search size={18} />
        </div>
        
        <input
          type="text"
          placeholder="Buscar ativos (nome, símbolo, categoria)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full py-3 px-2 outline-none text-sm text-gray-700"
        />
        
        {searchTerm && (
          <button 
            onClick={handleClear}
            className="pr-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchAssets;