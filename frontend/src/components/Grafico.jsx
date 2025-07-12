import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { motion } from 'framer-motion';

const Grafico = ({ period = 'week' }) => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simula dados financeiros com base no período selecionado
  useEffect(() => {
    setIsLoading(true);
    
    // Simula um atraso de API
    setTimeout(() => {
      const generateData = () => {
        let data = [];
        let baseCurrent = 3000;
        let baseInvestment = 12000;
        
        // Define o número de pontos de dados com base no período
        const dataPoints = period === 'week' ? 7 : period === 'month' ? 30 : 12;
        const dateFormat = period === 'year' ? 'MMM' : 'DD/MM';
        
        // Cria datas para o período selecionado
        const today = new Date();
        const dates = [];
        
        for (let i = dataPoints - 1; i >= 0; i--) {
          const date = new Date();
          if (period === 'week' || period === 'month') {
            date.setDate(today.getDate() - i);
          } else { // year
            date.setMonth(today.getMonth() - i);
          }
          
          // Formata a data conforme o período
          const formattedDate = period === 'year' 
            ? date.toLocaleDateString('pt-BR', { month: 'short' }) 
            : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          
          dates.push(formattedDate);
        }
        
        // Gera dados financeiros aleatórios
        for (let i = 0; i < dataPoints; i++) {
          // Adiciona alguma volatilidade aos valores
          const randomCurrentChange = Math.random() * 200 - 100; // -100 a 100
          const randomInvestmentChange = Math.random() * 300 - 100; // -100 a 200
          
          // Tendências de longo prazo
          const trend = i / dataPoints * 500;
          
          baseCurrent += randomCurrentChange;
          baseInvestment += randomInvestmentChange + trend;
          
          // Adiciona dados ao array
          data.push({
            name: dates[i],
            contaCorrente: Math.max(0, Math.round(baseCurrent)),
            contaInvestimento: Math.max(0, Math.round(baseInvestment)),
            total: Math.max(0, Math.round(baseCurrent + baseInvestment))
          });
        }
        
        return data;
      };
      
      // Atualiza o estado com os dados gerados
      setChartData(generateData());
      setIsLoading(false);
    }, 600);
  }, [period]);

  // Exibe um spinner de carregamento enquanto os dados são gerados
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md h-80 flex items-center justify-center">
        <motion.div 
          className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-white rounded-xl p-4 shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      style={{
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {/* Definições dos gradientes para as áreas do gráfico */}
            <defs>
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorInvestment" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            {/* Grade de fundo */}
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            {/* Eixo X (datas) */}
            <XAxis 
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
            />
            {/* Eixo Y (valores) */}
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              tickFormatter={(value) => `R$${value.toLocaleString('pt-BR')}`}
            />
            {/* Tooltip ao passar o mouse sobre pontos */}
            <Tooltip 
              formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, undefined]}
              labelFormatter={(label) => `Data: ${label}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
            />
            {/* Legenda do gráfico */}
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              formatter={(value) => {
                const valueMap = {
                  'contaCorrente': 'Conta Corrente',
                  'contaInvestimento': 'Conta Investimento',
                  'total': 'Total'
                };
                return <span className="text-sm font-medium">{valueMap[value] || value}</span>;
              }}
            />
            {/* Área de Conta Corrente */}
            <Area 
              type="monotone" 
              dataKey="contaCorrente" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorCurrent)" 
              strokeWidth={2}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            {/* Área de Conta Investimento */}
            <Area 
              type="monotone" 
              dataKey="contaInvestimento" 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorInvestment)" 
              strokeWidth={2} 
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            {/* Área de Total */}
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#f59e0b" 
              fillOpacity={1} 
              fill="url(#colorTotal)" 
              strokeWidth={2} 
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default Grafico;