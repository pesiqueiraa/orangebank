import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, AlertCircle, FileText } from 'lucide-react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import RelatorioTabela from './RelatorioTabela';
import GraficoRelatorio from './GraficoRelatorio';
import { Link } from 'react-router-dom';

const API_URL = 'https://orangebank.onrender.com/api';

const ImpostoRenda = () => {
  const [data, setData] = useState({
    totalTaxPaid: 0,
    totalProfit: 0,
    totalLoss: 0,
    monthlyBreakdown: {},
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [view, setView] = useState('table');
  const [investAccount, setInvestAccount] = useState(null);

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const storedUser = JSON.parse(localStorage.getItem('user'));
      
      if (!storedUser || !storedUser.id) {
        throw new Error("Usuário não autenticado");
      }
      
      // 1. Primeiro, buscar as contas do usuário
      const accountsResponse = await axios.get(`${API_URL}/accounts/${storedUser.id}`);
      
      if (!accountsResponse.data.success || !accountsResponse.data.data.length) {
        throw new Error("Nenhuma conta encontrada");
      }
      
      // 2. Encontrar a conta de investimento
      const investmentAccount = accountsResponse.data.data.find(
        acc => acc.type === 'investimento'
      );
      
      if (!investmentAccount) {
        throw new Error("Conta de investimento não encontrada");
      }
      
      setInvestAccount(investmentAccount);
      
      // 3. Buscar o relatório de impostos usando o ID da conta de investimento
      const response = await axios.get(
        `${API_URL}/accounts/${investmentAccount.id}/tax-report?year=${year}`
      );
      
      if (response.data.success) {
        const reportData = response.data.data;
        
        // 4. Processar os dados para exibição
        // Transformar o breakdown mensal em transações para a tabela
        const transactions = [];
        
        Object.entries(reportData.monthlyBreakdown || {}).forEach(([month, data]) => {
          if (data.operations > 0) {
            transactions.push({
              date: `${year}-${month}-15`, // Usando dia 15 como representativo do mês
              type: 'Venda de Ativos',
              asset: `Operações (${data.operations})`,
              value: data.profit || 0,
              tax: data.tax || 0
            });
          }
        });
        
        setData({
          ...reportData,
          totalIncome: reportData.totalProfit || 0,
          totalDividends: 0, // O backend não fornece este dado específico
          transactions: transactions
        });
      } else {
        throw new Error(response.data.message || "Erro ao buscar relatório de imposto de renda");
      }
    } catch (error) {
      console.error("Erro ao carregar relatório de imposto de renda:", error);
      setError(error.message || "Ocorreu um erro ao carregar os dados");
      
      // Não vamos usar dados simulados na versão final, vamos mostrar o erro
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!data) return;
    
    const doc = new jsPDF();
    
    // Adicionar cabeçalho
    doc.setFontSize(18);
    doc.text('Relatório de Imposto de Renda', 14, 15);
    
    // Adicionar ano
    doc.setFontSize(12);
    doc.text(`Ano-calendário: ${year}`, 14, 25);
    
    // Adicionar informações da conta, se disponível
    if (investAccount) {
      doc.text(`Conta: ${investAccount.type} - ${investAccount.id.substring(0, 8)}`, 14, 30);
    }
    
    // Adicionar resumo
    doc.setFontSize(14);
    doc.text('Resumo do Período', 14, 40);
    
    doc.setFontSize(11);
    doc.text(`Total de Lucro: ${formatCurrency(data.totalProfit || 0)}`, 14, 50);
    doc.text(`Total de Prejuízo: ${formatCurrency(data.totalLoss || 0)}`, 14, 55);
    doc.text(`Imposto Total Retido: ${formatCurrency(data.totalTaxPaid || 0)}`, 14, 60);
    
    // Adicionar tabela de transações
    if (data.transactions && data.transactions.length > 0) {
      // Preparar dados para tabela
      const tableColumn = ["Data", "Tipo", "Ativo", "Valor", "Imposto"];
      const tableRows = data.transactions.map(item => [
        new Date(item.date).toLocaleDateString('pt-BR'),
        item.type,
        item.asset,
        formatCurrency(item.value),
        formatCurrency(item.tax)
      ]);
      
      doc.setFontSize(14);
      doc.text('Detalhamento de Operações', 14, 70);
      
      // Adicionar tabela automaticamente
      doc.autoTable({
        startY: 75,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [241, 135, 56] }
      });
    } else {
      doc.text('Nenhuma operação encontrada para o período.', 14, 75);
    }
    
    // Adicionar mensagem de aviso
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 80;
    doc.setFontSize(9);
    doc.text('Este documento é apenas informativo e não substitui a declaração oficial de imposto de renda.', 14, finalY);
    doc.text('Consulte um contador para orientações específicas sobre sua declaração.', 14, finalY + 5);
    
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
    
    doc.save(`relatorio-ir-${year}-${new Date().toLocaleDateString('pt-BR')}.pdf`);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error === "Conta de investimento não encontrada") {
    return (
      <div className="bg-orange-50 border border-orange-200 text-orange-800 px-6 py-8 rounded-md text-center">
        <div className="flex flex-col items-center">
          <AlertCircle size={48} className="text-orange-500 mb-4" />
          <p className="text-lg font-medium mb-2">Conta de investimento não encontrada</p>
          <p className="text-sm mb-6">
            Você precisa ter uma conta de investimento para visualizar o relatório de imposto de renda.
          </p>
          <Link 
            to="/dashboard" 
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-6 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p className="font-medium">Erro ao carregar dados</p>
        </div>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  const columns = [
    { header: 'Data', accessor: 'date', formatter: (value) => new Date(value).toLocaleDateString('pt-BR') },
    { header: 'Tipo', accessor: 'type' },
    { header: 'Ativo/Operações', accessor: 'asset' },
    { header: 'Valor', accessor: 'value', formatter: formatCurrency },
    { header: 'Imposto', accessor: 'tax', formatter: formatCurrency }
  ];

  // Preparar dados para o gráfico de barras (meses x valores)
  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  
  const chartData = {
    chartData: Object.entries(data.monthlyBreakdown || {}).map(([month, data]) => ({
      name: monthNames[parseInt(month) - 1],
      valor: data.profit || 0,
      imposto: data.tax || 0
    })),
    series: [
      { key: "valor", name: "Lucro" },
      { key: "imposto", name: "Imposto" }
    ]
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-md p-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <FileText className="h-6 w-6 mr-2 text-orange-500" />
          Relatório de Imposto de Renda
        </h2>
        <div className="flex flex-wrap gap-3">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {[...Array(5)].map((_, i) => {
              const yearOption = new Date().getFullYear() - i;
              return (
                <option key={yearOption} value={yearOption}>
                  {yearOption}
                </option>
              );
            })}
          </select>
          
          <button
            onClick={() => setView(view === 'table' ? 'chart' : 'table')}
            className="px-3 py-2 text-sm bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200"
          >
            {view === 'table' ? 'Ver Gráfico' : 'Ver Tabela'}
          </button>
          
          <motion.button
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="text-sm text-green-700 mb-1">Lucro Total</div>
          <div className="text-xl font-bold text-green-800">{formatCurrency(data.totalProfit || 0)}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <div className="text-sm text-red-700 mb-1">Prejuízo Total</div>
          <div className="text-xl font-bold text-red-800">{formatCurrency(data.totalLoss || 0)}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="text-sm text-blue-700 mb-1">Imposto Retido</div>
          <div className="text-xl font-bold text-blue-800">{formatCurrency(data.totalTaxPaid || 0)}</div>
        </div>
      </div>

      <div className="mb-6">
        {view === 'table' ? (
          data.transactions && data.transactions.length > 0 ? (
            <RelatorioTabela 
              data={data.transactions} 
              columns={columns} 
              title="Operações para Declaração"
            />
          ) : (
            <div className="bg-gray-50 p-6 text-center text-gray-500 rounded-lg border border-gray-200">
              Nenhuma operação tributável encontrada para o ano {year}.
            </div>
          )
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <GraficoRelatorio 
              title={`Operações por Mês - ${year}`}
              type="bar"
              data={chartData}
              xAxisLabel="Mês"
              yAxisLabel="Valor (R$)"
              height="300px"
              showLegend={true}
            />
          </div>
        )}
      </div>

    </motion.div>
  );
};

export default ImpostoRenda;