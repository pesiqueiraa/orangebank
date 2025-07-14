import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Gift, Trophy, TrendingUp, Info } from 'lucide-react';
// Importe o png corretamente
import orangeCoinWhite from '../assets/orangecoin-white.png';
import orangeCoinOrange from '../assets/orangecoin-orange.png';

const OrangeCoinWidget = ({ coins, previousCoins = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);
  const widgetRef = useRef(null);

  // Calcular nível baseado na quantidade de moedas
  const level = Math.floor(coins / 100) + 1;
  const progress = (coins % 100) / 100;
  const nextLevelCoins = 100 - (coins % 100);
  
  // Lidar com cliques fora do widget para fechar o popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Animar quando o valor de moedas mudar
  useEffect(() => {
    if (previousCoins !== null && coins > previousCoins) {
      setShowAnimation(true);
      setAnimatedValue(coins - previousCoins);
      
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [coins, previousCoins]);

  return (
    <div ref={widgetRef} className="relative">
      <motion.div 
        className="flex items-center space-x-1 bg-gradient-to-r from-orange-500 to-orange-400 px-3 py-2 rounded-full shadow-md cursor-pointer"
        whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(251, 146, 60, 0.4)" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        layout
      >
        <div className="relative">
          <img 
            src={orangeCoinWhite} 
            alt="OrangeCoin" 
            className="h-6 w-6 drop-shadow-md" 
          />
          
          {/* Animação de moeda ganha */}
          <AnimatePresence>
            {showAnimation && (
              <motion.div 
                className="absolute -top-5 right-0 bg-orange-300 text-white text-xs font-bold px-1.5 py-0.5 rounded-md"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: -15 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                +{animatedValue}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium text-white">{coins}</span>
          <ChevronDown 
            className={`h-3 w-3 text-orange-100 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
        
      </motion.div>

      {/* Popover com detalhes */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute right-0 top-14 bg-white rounded-xl p-4 shadow-xl border border-orange-100 w-64 z-50"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <img 
                  src={orangeCoinOrange} 
                  alt="OrangeCoin" 
                  className="h-5 w-5" 
                />
                <h4 className="font-semibold text-gray-800">OrangeCoins</h4>
              </div>
              <span className="text-lg font-bold text-orange-500">{coins}</span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Nível {level}</span>
                <span>Nível {level+1}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="text-xs text-center mt-1 text-gray-500">
                Faltam <span className="font-medium text-orange-500">{nextLevelCoins}</span> OCs para o próximo nível
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <h5 className="font-medium text-sm text-gray-700">Como ganhar mais:</h5>
              <div className="flex items-center text-xs text-gray-600 space-x-2">
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                <span>Faça uma transação (+5 OCs)</span>
              </div>
              <div className="flex items-center text-xs text-gray-600 space-x-2">
                <Gift className="h-3.5 w-3.5 text-blue-500" />
                <span>Complete seu perfil (+20 OCs)</span>
              </div>
              <div className="flex items-center text-xs text-gray-600 space-x-2">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <span>Faça seu primeiro investimento (+30 OCs)</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrangeCoinWidget;