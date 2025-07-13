import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle, 
  MinusCircle, 
  ArrowRightLeft, 
  LineChart, 
  CreditCard,
  Download,
  Filter,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  Briefcase
} from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const API_URL = 'http://localhost:3000/api';

const ExtratoConta = () => {
  const [statementData, setStatementData] = useState({
    account: null,
    transactions: [],
    summary: {
      totalCredits: 0,
      totalDebits: 0,
      netBalance: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30');
  const [showFilters, setShowFilters] = useState(false);
  
  // Animações
  const tableVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: i * 0.1,
        duration: 0.4 
      }
    })
  };

  useEffect(() => {
    fetchStatementData();
  }, [period]);

  const fetchStatementData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('Usuário não encontrado');
      }
      
      // 1. Buscar contas do usuário
      const accountsResponse = await axios.get(`${API_URL}/accounts/${user.id}`);
      
      if (!accountsResponse.data.success || !accountsResponse.data.data.length) {
        throw new Error('Nenhuma conta encontrada');
      }
      
      // 2. Encontrar a conta corrente
      const currentAccount = accountsResponse.data.data.find(acc => acc.type === 'corrente') || accountsResponse.data.data[0];
      
      // 3. Buscar histórico de transações usando o endpoint específico
      const historyResponse = await axios.get(`${API_URL}/transactions/account/${currentAccount.id}`, {
        params: { 
          limit: 50, // Buscar mais transações para ter dados suficientes
        }
      });
      
      if (!historyResponse.data.success) {
        throw new Error(historyResponse.data.message || 'Erro ao buscar histórico');
      }

      const transactions = historyResponse.data.data;
      
      // 4. Filtrar transações pelo período selecionado
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      
      const filteredTransactions = transactions.filter(transaction => 
        new Date(transaction.created_at) >= startDate
      );
      
      // 5. Calcular resumo financeiro
      const summary = calculateSummary(filteredTransactions);
      
      // 6. Preparar dados para o gráfico de fluxo
      const flowChartData = prepareFlowChartData(filteredTransactions);
      
      setStatementData({
        account: {
          id: currentAccount.id,
          type: currentAccount.type,
          balance: currentAccount.balance,
          availableBalance: currentAccount.balance,
          branch: '0001',
          number: currentAccount.id.substring(0, 8)
        },
        transactions: filteredTransactions,
        summary: summary,
        flowChart: flowChartData
      });
      
    } catch (error) {
      console.error('Erro ao buscar extrato:', error);
      setError(error.message || 'Falha ao carregar o extrato');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (transactions) => {
    const summary = {
      totalCredits: 0,
      totalDebits: 0,
      netBalance: 0
    };

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.valor || 0);
      if (amount >= 0 && transaction.tipo !== 'transferência_interna' && transaction.tipo !== 'transferência_externa') {
        summary.totalCredits += amount;
      } else {
        summary.totalDebits += amount;
      }
    });

    summary.netBalance = summary.totalCredits + summary.totalDebits;
    return summary;
  };

  const prepareFlowChartData = (transactions) => {
    // Agrupar transações por data para o gráfico
    const chartData = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at).toLocaleDateString('pt-BR');
      const amount = parseFloat(transaction.valor || 0);
      
      if (!chartData[date]) {
        chartData[date] = {
          entradas: 0,
          saidas: 0
        };
      }
      
      if (amount >= 0 && transaction.tipo !== 'transferência_interna' && transaction.tipo !== 'transferência_externa') {
        chartData[date].entradas += amount;
      } else {
        chartData[date].saidas += Math.abs(amount);
      }
    });
    
    return {
      chartData: Object.keys(chartData).map(date => ({
        name: date,
        entradas: chartData[date].entradas,
        saidas: -chartData[date].saidas // Negativo para visualização
      })),
      series: [
        { key: "entradas", name: "Entradas" },
        { key: "saidas", name: "Saídas" }
      ]
    };
  };

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  const handleExportPDF = () => {
    if (!statementData.account) return;
    
    const doc = new jsPDF();
    
    // Adicionar cabeçalho
    doc.setFontSize(18);
    doc.text('Extrato de Conta Corrente', 14, 15);
    
    // Adicionar informações da conta
    doc.setFontSize(11);
    doc.text(`Conta: ${statementData.account.branch}-${statementData.account.number}`, 14, 25);
    doc.text(`Período: Últimos ${period} dias`, 14, 30);
    doc.text(`Saldo Atual: ${formatCurrency(statementData.account.balance)}`, 14, 35);
    
    // Adicionar resumo
    doc.text('Resumo do Período', 14, 45);
    doc.text(`Entradas: ${formatCurrency(statementData.summary.totalCredits)}`, 14, 50);
    doc.text(`Saídas: ${formatCurrency(statementData.summary.totalDebits)}`, 14, 55);
    doc.text(`Saldo do Período: ${formatCurrency(statementData.summary.netBalance)}`, 14, 60);
    
    // Adicionar tabela de transações manualmente
    doc.text('Histórico de Transações', 14, 70);
    let y = 80;
    doc.setFontSize(10);
    doc.text('Data', 14, y);
    doc.text('Descrição', 65, y);
    doc.text('Valor', 150, y);
    y += 5;
    doc.line(14, y, 196, y);
    y += 10;
    
    // Adicionar dados da tabela
    statementData.transactions.forEach((transaction, index) => {
      if (index > 20) return; // Limitar a 20 transações para não ultrapassar a página
    
      doc.text(new Date(transaction.created_at).toLocaleDateString('pt-BR'), 14, y);
      doc.text(transaction.tipo.substring(0, 25), 65, y); // Limitar comprimento do texto
      doc.text(formatCurrency(transaction.valor), 150, y);
      y += 10;
      
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    
    // Adicionar rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2, 
        doc.internal.pageSize.getHeight() - 10, 
        { align: 'center' }
      );
    }
    
    doc.save(`extrato-conta-${statementData.account.number}-${new Date().toLocaleDateString('pt-BR')}.pdf`);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value) || 0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const getTransactionIcon = (transaction) => {
    const tipo = transaction.tipo ? transaction.tipo.toLowerCase() : '';
    
    if (tipo.includes('depósito') || tipo.includes('deposito') || tipo.includes('recebimento')) {
      return <PlusCircle className="h-5 w-5 text-green-600" />;
    } else if (tipo.includes('saque')) {
      return <MinusCircle className="h-5 w-5 text-red-600" />;
    } else if (tipo.includes('transferência') || tipo.includes('transferencia')) {
      return <ArrowRightLeft className="h-5 w-5 text-blue-600" />;
    } else if (tipo.includes('ativo')) {
      return <LineChart className="h-5 w-5 text-purple-600" />;
    } else {
      return <CreditCard className="h-5 w-5 text-gray-600" />;
    }
  };

  // Adicione função para obter descrição detalhada da transação
  const getTransactionDescription = (transaction) => {
    const tipo = transaction.tipo ? transaction.tipo.toLowerCase() : '';
    
    // Para transferências, adicionar informações da conta de destino
    if ((tipo.includes('transferência') || tipo.includes('transferencia')) && transaction.toAccountId) {
      return `${transaction.tipo} para conta ${transaction.toAccountId.substring(0, 8)}`;
    }
    
    return transaction.tipo;
  };

  const getTransactionBgClass = (tipo) => {
    tipo = tipo.toLowerCase();
    if (tipo.includes('depósito') || tipo.includes('deposito') || tipo.includes('recebimento')) {
      return 'bg-green-100';
    } else if (tipo.includes('saque')) {
      return 'bg-red-100';
    } else if (tipo.includes('transferência') || tipo.includes('transferencia')) {
      return 'bg-blue-100';
    } else if (tipo.includes('ativo')) {
      return 'bg-purple-100';
    } else {
      return 'bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p className="font-medium">Erro ao carregar o extrato</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <FileText className="h-6 w-6 mr-2 text-orange-500" />
          Extrato de Conta Corrente
        </h2>
        
        <div className="flex items-center space-x-3">
          <motion.button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Filter size={16} className="mr-2" /> Filtros
          </motion.button>
          
          <motion.button 
            onClick={handleExportPDF}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download size={16} className="mr-2" /> Exportar PDF
          </motion.button>
        </div>
      </div>
      
      {showFilters && (
        <motion.div 
          className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <select 
                value={period}
                onChange={handlePeriodChange}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="15">Últimos 15 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {statementData.account && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          
          <motion.div 
            className="bg-green-50 p-4 rounded-lg border border-green-100"
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <p className="text-sm text-green-700">Saldo Atual</p>
            <p className="text-lg font-bold text-green-800">
              {formatCurrency(statementData.account.balance)}
            </p>
          </motion.div>
          
          <motion.div 
            className="bg-gray-50 p-4 rounded-lg border border-gray-100"
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <p className="text-sm text-gray-700">Saldo Disponível</p>
            <p className="text-lg font-bold text-gray-800">
              {formatCurrency(statementData.account.availableBalance)}
            </p>
          </motion.div>
        </div>
      )}
      
      
      <motion.div 
        className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-medium text-gray-800 mb-4">Resumo do Período</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Entradas</p>
            <p className="text-lg font-medium text-green-600">
              {formatCurrency(statementData.summary.totalCredits)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Saídas</p>
            <p className="text-lg font-medium text-red-600">
              {formatCurrency(statementData.summary.totalDebits)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Saldo do Período</p>
            <p className="text-lg font-medium text-orange-600">
              {formatCurrency(statementData.summary.netBalance)}
            </p>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        className="bg-white bg-opacity-95 backdrop-filter backdrop-blur-sm rounded-xl overflow-hidden border border-gray-200 shadow-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-lg font-medium text-gray-800 p-4 bg-gray-50 border-b border-gray-200 flex items-center">
          <Briefcase size={18} className="mr-2 text-blue-600" />
          Histórico de Transações
        </h3>
        
        <div className="overflow-x-auto">
          <motion.table 
            className="w-full text-left"
            variants={tableVariants}
            initial="hidden"
            animate="visible"
          >
            <thead>
              <tr className="bg-gray-50 bg-opacity-80">
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <AnimatePresence>
                {statementData.transactions.length > 0 ? (
                  statementData.transactions.map((transaction) => (
                    <motion.tr 
                      key={transaction.id} 
                      className="hover:bg-gray-50 transition-colors"
                      variants={rowVariants}
                      whileHover={{
                        backgroundColor: "#f9fafb",
                        transition: { duration: 0.2 }
                      }}
                      layout
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-2 text-gray-400" />
                          {formatDate(transaction.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <motion.div 
                            className={`w-10 h-10 rounded-full ${getTransactionBgClass(transaction.tipo)} flex items-center justify-center`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {getTransactionIcon(transaction)}
                          </motion.div>
                          <div>
                            <span className="text-sm font-medium text-gray-800">
                              {getTransactionDescription(transaction)}
                            </span>
                            {transaction.transferStatus && (
                              <span className={`text-xs ml-2 px-2 py-1 rounded-full ${
                                transaction.transferStatus === 'concluída' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {transaction.transferStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <motion.span 
                          className={`text-sm font-semibold ${parseFloat(transaction.valor) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        >
                          <span className="inline-flex items-center">
                            {parseFloat(transaction.valor) >= 0 ? (
                              <ArrowUpRight size={16} className="mr-1" />
                            ) : (
                              <ArrowDownRight size={16} className="mr-1" />
                            )}
                            {formatCurrency(transaction.valor)}
                          </span>
                        </motion.span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhuma transação encontrada para o período selecionado.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </motion.table>
        </div>
      </motion.div>
      
      <motion.div 
        className="mt-6 text-sm text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p>* As transações dos últimos 90 dias estão disponíveis para consulta.</p>
      </motion.div>
    </div>
  );
};

export default ExtratoConta;