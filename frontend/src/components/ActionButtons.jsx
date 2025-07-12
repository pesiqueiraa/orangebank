import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, MinusCircle, ArrowRightLeft, LineChart } from 'lucide-react';

const ActionButtons = ({ onActionClick }) => {
  const navigate = useNavigate();
  
  // Configuração dos botões de ação rápida
  const actionButtons = [
    {
      name: 'Depositar',
      icon: <PlusCircle className="h-6 w-6" />,
      bgColorFrom: 'from-green-50',
      bgColorTo: 'to-green-100',
      textColor: 'text-green-600',
      shadowColor: 'rgba(52, 211, 153, 0.2)',
      path: '/deposito'
    },
    {
      name: 'Sacar',
      icon: <MinusCircle className="h-6 w-6" />,
      bgColorFrom: 'from-red-50',
      bgColorTo: 'to-red-100',
      textColor: 'text-red-600',
      shadowColor: 'rgba(248, 113, 113, 0.2)',
      path: '/saque'  // Alterado de '/withdraw' para '/saque'
    },
    {
      name: 'Transferir',
      icon: <ArrowRightLeft className="h-6 w-6" />,
      bgColorFrom: 'from-blue-50',
      bgColorTo: 'to-blue-100',
      textColor: 'text-blue-600',
      shadowColor: 'rgba(59, 130, 246, 0.2)',
      path: '/transfer'
    },
    {
      name: 'Investir',
      icon: <LineChart className="h-6 w-6" />,
      bgColorFrom: 'from-purple-50',
      bgColorTo: 'to-purple-100',
      textColor: 'text-purple-600',
      shadowColor: 'rgba(124, 58, 237, 0.2)',
      path: '/invest'
    }
  ];

  // Manipula o clique em um botão de ação
  const handleButtonClick = (button) => {
    if (onActionClick) onActionClick(button.name);
    navigate(button.path);
  };

  // Variantes de animação para o contêiner
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1 // Atraso entre cada item filho
      }
    }
  };

  // Variantes de animação para cada item
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</h3>
      
      {/* Grid de botões com animação escalonada */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {actionButtons.map((button) => (
          <motion.button
            key={button.name}
            onClick={() => handleButtonClick(button)}
            className="bg-white rounded-xl p-5 flex flex-col items-center justify-center"
            style={{
              boxShadow: `9px 9px 16px rgba(163, 177, 198, 0.5), 
                         -9px -9px 16px rgba(255, 255, 255, 0.8)`
            }}
            variants={item}
            whileHover={{ 
              scale: 1.03,
              boxShadow: `12px 12px 20px rgba(163, 177, 198, 0.6), 
                         -12px -12px 20px rgba(255, 255, 255, 0.9)`
            }}
            whileTap={{ 
              scale: 0.97,
              boxShadow: `inset 3px 3px 7px rgba(163, 177, 198, 0.6), 
                          inset -3px -3px 7px rgba(255, 255, 255, 0.7)`
            }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {/* Círculo com ícone - design neumórfico */}
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${button.bgColorFrom} ${button.bgColorTo} ${button.textColor} flex items-center justify-center mb-3`}
                style={{
                  boxShadow: `inset 2px 2px 5px rgba(255, 255, 255, 0.7), 
                             inset -2px -2px 5px ${button.shadowColor}`
                }}>
              {button.icon}
            </div>
            <span className="font-medium text-gray-800">{button.name}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default ActionButtons;