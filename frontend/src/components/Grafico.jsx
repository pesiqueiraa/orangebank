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
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const Grafico = ({ period = 'week' }) => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar dados financeiros reais do backend com base no período selecionado
  useEffect(() => {
    const fetchFinancialData = async () => {
      setIsLoading(true);
      
      try {
        // Obter usuário do localStorage
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          console.error("Usuário não encontrado no localStorage");
          setIsLoading(false);
          return;
        }
        
        const user = JSON.parse(storedUser);
        
        // Definir parâmetros baseados no período
        const dataPoints = period === 'week' ? 7 : period === 'month' ? 30 : 12;
        
        // 1. Buscar contas do usuário
        const accountsResponse = await axios.get(`${API_URL}/accounts/${user.id}`);
        if (!accountsResponse.data.success) {
          throw new Error("Falha ao buscar contas do usuário");
        }
        
        const accounts = accountsResponse.data.data;
        const currentAccount = accounts.find(acc => acc.type === 'corrente');
        const investmentAccount = accounts.find(acc => acc.type === 'investimento');
        
        if (!currentAccount || !investmentAccount) {
          throw new Error("Contas não encontradas");
        }
        
        // 2. Buscar histórico de transações para cada conta
        const currentHistoryResponse = await axios.get(
          `${API_URL}/accounts/${currentAccount.id}/history?limit=100`
        );
        
        const investmentHistoryResponse = await axios.get(
          `${API_URL}/accounts/${investmentAccount.id}/history?limit=100`
        );
        
        // 3. Buscar performance de investimentos
        const performanceResponse = await axios.get(
          `${API_URL}/accounts/${investmentAccount.id}/performance`
        );
        
        // Processar dados para o gráfico
        const formattedData = processDataForChart(
          currentHistoryResponse.data.data, 
          investmentHistoryResponse.data.data,
          performanceResponse.data.data,
          period,
          currentAccount.balance,
          investmentAccount.balance
        );
        
        setChartData(formattedData);
      } catch (error) {
        console.error("Erro ao buscar dados financeiros:", error);
        // Fallback para dados simulados caso haja erro
        setChartData(generateSimulatedData(period));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFinancialData();
  }, [period]);

  // Função para processar dados da API para o formato do gráfico
  const processDataForChart = (currentTransactions, investmentTransactions, performance, period, currentBalance, investmentBalance) => {
    const today = new Date();
    const dates = [];
    const dataPoints = period === 'week' ? 7 : period === 'month' ? 30 : 12;
    
    // Criar datas para o período selecionado
    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date();
      if (period === 'week' || period === 'month') {
        date.setDate(today.getDate() - i);
      } else { // year
        date.setMonth(today.getMonth() - i);
      }
      
      // Formatar a data conforme o período
      const formattedDate = period === 'year' 
        ? date.toLocaleDateString('pt-BR', { month: 'short' }) 
        : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      dates.push({
        date: formattedDate,
        fullDate: date
      });
    }
    
    return dates.map((dateInfo, index) => {
      const { date, fullDate } = dateInfo;
      
      // Calcula o saldo em cada data com base em transações ocorridas após fullDate.
      let currentAccountBalance = calculateBalanceAtDate(currentTransactions, currentBalance, fullDate, today);
      let investmentAccountBalance = calculateBalanceAtDate(investmentTransactions, investmentBalance, fullDate, today);
      
      // Para o último ponto (data de hoje), se houver dados de performance, usar valor real.
      if (performance && performance.assets && index === dataPoints - 1) {
        investmentAccountBalance = performance.summary.totalCurrentValue + performance.summary.availableBalance;
      }
      
      const totalBalance = currentAccountBalance + investmentAccountBalance;
      
      return {
        name: date,
        contaCorrente: Math.max(0, Math.round(currentAccountBalance)),
        contaInvestimento: Math.max(0, Math.round(investmentAccountBalance)),
        total: Math.max(0, Math.round(totalBalance))
      };
    });
  };
  
  // Calcula o saldo em uma data específica, considerando somente transações ocorridas após fullDate até hoje.
  const calculateBalanceAtDate = (transactions, currentBalance, fullDate, today) => {
    let variation = 0;
    transactions
      .filter(tx => {
          const txDate = new Date(tx.created_at);
          return txDate > fullDate && txDate <= today;
      })
      .forEach(tx => {
          if (tx.tipo.includes('depósito') || tx.tipo.includes('recebimento')) {
              variation += parseFloat(tx.valor);
          } else if (tx.tipo.includes('saque') || tx.tipo.includes('transferência')) {
              variation -= parseFloat(tx.valor);
          }
      });
    return currentBalance - variation;
};

  // Dados simulados para fallback
  const generateSimulatedData = (period) => {
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