import React, { useState, useEffect } from "react";
import axios from "axios";
import { Download, Briefcase, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import GraficoRelatorio from "./GraficoRelatorio";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";

// API URL
const API_URL = "https://orangebank.onrender.com/api";

const ResumoInvest = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [investAccount, setInvestAccount] = useState(null);

  const fetchSummaryData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Obter dados do usuário e conta do localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      const accounts = JSON.parse(localStorage.getItem("accounts")) || [];

      if (!user || !user.id) {
        throw new Error("Usuário não encontrado");
      }

      // Tentar encontrar a conta de investimento do usuário com várias possibilidades
      let account = accounts.find((acc) => 
        acc.type === "investimento" || 
        acc.type === "Investimento" || 
        acc.type === "INVESTIMENTO" ||
        acc.tipo === "investimento"
      );

      // Se não encontrar, usar a primeira conta como fallback
      if (!account && accounts.length > 0) {
        account = accounts[0];
        console.warn("Conta de investimento não encontrada, usando conta alternativa:", account.id);
      }

      if (!account || !account.id) {
        throw new Error("Nenhuma conta disponível");
      }

      setInvestAccount(account);

      // Buscar dados de resumo da API
      try {
        const response = await axios.get(
          `${API_URL}/accounts/${account.id}/portfolio/summary`
        );

        if (response.data.success) {
          setSummaryData(response.data.data);
          return;
        }
      } catch (apiError) {
        console.error("API error:", apiError);
        // Continuará e usará dados simulados
      }

      // Se chegamos aqui, vamos usar dados simulados
      const demoData = {
        totalInvested: 45000.0,
        currentValue: 47850.75,
        profitLoss: 2850.75,
        profitLossPercentage: 6.33,
        investmentsByCategory: {
          chartData: [
            { name: "Ações", value: 25000 },
            { name: "Renda Fixa", value: 15000 },
            { name: "Fundos", value: 5000 },
          ],
        },
        performanceByAsset: {
          chartData: [
            { name: "PETR4", variacao: 12.5 },
            { name: "VALE3", variacao: -3.2 },
            { name: "MGLU3", variacao: -8.7 },
            { name: "WEGE3", variacao: 15.3 },
            { name: "ITUB4", variacao: 5.8 },
            { name: "BBDC4", variacao: 4.2 },
          ],
          series: [{ key: "variacao", name: "Variação %" }],
        },
        performanceOverTime: {
          chartData: [
            { name: "Jan", valor: 40000 },
            { name: "Fev", valor: 41200 },
            { name: "Mar", valor: 40500 },
            { name: "Abr", valor: 42300 },
            { name: "Mai", valor: 43100 },
            { name: "Jun", valor: 44800 },
            { name: "Jul", valor: 47850.75 },
          ],
          series: [{ key: "valor", name: "Valor Total" }],
        },
        assets: [
          {
            id: 1,
            symbol: "PETR4",
            name: "Petrobras PN",
            quantity: 200,
            averagePrice: 28.75,
            currentPrice: 32.35,
            totalValue: 6470,
            profitLoss: 720,
            profitLossPercentage: 12.5,
          },
          {
            id: 2,
            symbol: "VALE3",
            name: "Vale ON",
            quantity: 150,
            averagePrice: 69.4,
            currentPrice: 67.18,
            totalValue: 10077,
            profitLoss: -333,
            profitLossPercentage: -3.2,
          },
          {
            id: 3,
            symbol: "CDB BB",
            name: "CDB Banco do Brasil",
            quantity: 1,
            averagePrice: 10000,
            currentPrice: 10620,
            totalValue: 10620,
            profitLoss: 620,
            profitLossPercentage: 6.2,
          },
          {
            id: 4,
            symbol: "TESOURO",
            name: "Tesouro Direto",
            quantity: 1,
            averagePrice: 5000,
            currentPrice: 5190,
            totalValue: 5190,
            profitLoss: 190,
            profitLossPercentage: 3.8,
          },
          {
            id: 5,
            symbol: "WEGE3",
            name: "WEG SA",
            quantity: 100,
            averagePrice: 36.8,
            currentPrice: 42.43,
            totalValue: 4243,
            profitLoss: 563,
            profitLossPercentage: 15.3,
          },
        ],
      };
      
      setSummaryData(demoData);
      setError("API temporariamente indisponível. Exibindo dados simulados.");
    } catch (error) {
      console.error("Erro ao buscar resumo de investimentos:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!summaryData) return;
    
    const doc = new jsPDF();
    
    // Adicionar cabeçalho
    doc.setFontSize(18);
    doc.text('Resumo de Investimentos', 14, 15);
    
    // Adicionar informações da conta
    doc.setFontSize(11);
    if (investAccount) {
      doc.text(`Conta: ${investAccount.type || investAccount.tipo || "Investimento"} ${investAccount.id.substring(0, 8)}`, 14, 25);
    }
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    
    // Adicionar resumo
    doc.setFontSize(14);
    doc.text('Resumo da Carteira', 14, 40);
    
    doc.setFontSize(11);
    doc.text(`Total Investido: ${new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(summaryData.totalInvested || 0)}`, 14, 50);
    
    doc.text(`Valor Atual: ${new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(summaryData.currentValue || 0)}`, 14, 55);
    
    doc.text(`Lucro/Prejuízo: ${new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(summaryData.profitLoss || 0)}`, 14, 60);
    
    doc.text(`Rentabilidade: ${(summaryData.profitLossPercentage || 0).toFixed(2)}%`, 14, 65);
    
    // Adicionar tabela de ativos manualmente
    doc.setFontSize(14);
    doc.text('Carteira de Ativos', 14, 80);
    
    let y = 90;
    doc.setFontSize(10);
    doc.text('Ativo', 14, y);
    doc.text('Qtde', 60, y);
    doc.text('Preço Médio', 80, y);
    doc.text('Valor Investido', 120, y);
    doc.text('Valor Atual', 160, y);
    doc.text('Rendimento', 190, y);
    y += 5;
    doc.line(14, y, 196, y);
    y += 10;
    
    // Formatar valores para moeda
    const formatCurrency = (value) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };
    
    // Adicionar dados da tabela
    (summaryData.assets || []).forEach((asset, index) => {
      if (index > 15) return; // Limitar para não ultrapassar a página
      
      // Garantir que os valores numéricos sejam números válidos
      const quantity = parseFloat(asset.quantity) || 0;
      const averagePrice = parseFloat(asset.averagePrice) || 0;
      const currentPrice = parseFloat(asset.currentPrice) || averagePrice;
      const invested = quantity * averagePrice;
      const current = quantity * currentPrice;
      const profitLoss = current - invested;
      const profitLossPercentage = invested > 0 ? (profitLoss / invested) * 100 : 0;
      
      doc.text(asset.symbol, 14, y);
      doc.text(quantity.toLocaleString('pt-BR'), 60, y);
      doc.text(formatCurrency(averagePrice), 80, y);
      doc.text(formatCurrency(invested), 120, y);
      doc.text(formatCurrency(current), 160, y);
      doc.text(`${formatCurrency(profitLoss)} (${profitLossPercentage.toFixed(2)}%)`, 190, y);
      y += 10;
      
      if (y > 270) {
        doc.addPage();
        // Adicionar cabeçalho da tabela na nova página
        y = 20;
        doc.setFontSize(10);
        doc.text('Ativo', 14, y);
        doc.text('Qtde', 60, y);
        doc.text('Preço Médio', 80, y);
        doc.text('Valor Investido', 120, y);
        doc.text('Valor Atual', 160, y);
        doc.text('Rendimento', 190, y);
        y += 5;
        doc.line(14, y, 196, y);
        y += 10;
      }
    });
    
    // Se não houver ativos
    if (!summaryData.assets || summaryData.assets.length === 0) {
      doc.text("Nenhum investimento encontrado na sua carteira.", 14, y);
    }
    
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
    
    // Adicionar informações legais
    doc.setPage(pageCount);
    doc.setFontSize(7);
    doc.text(
      'Este documento é apenas um resumo informativo e não substitui os documentos oficiais de sua corretora.',
      14,
      doc.internal.pageSize.getHeight() - 20
    );
    
    doc.save(`resumo-investimentos-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
  };

  // Carregar dados ao iniciar o componente
  useEffect(() => {
    fetchSummaryData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error === "Nenhuma conta disponível" || error === "Usuário não encontrado") {
    return (
      <div className="bg-orange-50 border border-orange-200 text-orange-800 px-6 py-8 rounded-md text-center">
        <div className="flex flex-col items-center">
          <AlertCircle size={48} className="text-orange-500 mb-4" />
          <p className="text-lg font-medium mb-2">Conta de investimento não encontrada</p>
          <p className="text-sm mb-6">
            Você precisa ter uma conta de investimento para visualizar este relatório.
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

  if (!summaryData) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded-md text-center">
        <p className="text-lg font-medium">Nenhum dado disponível</p>
        <p className="text-sm">
          Verifique se você possui uma conta de investimento.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md mb-4">
          <p className="font-medium">Atenção</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {investAccount && (
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-700">Conta utilizada para este relatório</p>
          <p className="text-base font-medium text-blue-800">
            {investAccount.type || investAccount.tipo || "Conta"} {investAccount.id}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Resumo de Investimentos
        </h2>

        <button
          onClick={handleExportPDF}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          <Download size={16} className="mr-2" /> Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-700">Total Investido</p>
          <p className="text-xl font-bold text-blue-800">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(summaryData?.totalInvested || 0)}
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <p className="text-sm text-purple-700">Valor Atual</p>
          <p className="text-xl font-bold text-purple-800">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(summaryData?.currentValue || 0)}
          </p>
        </div>

        <div
          className={`${
            (summaryData?.profitLoss || 0) >= 0
              ? "bg-green-50 border-green-100"
              : "bg-red-50 border-red-100"
          } p-4 rounded-lg border`}
        >
          <p
            className={`text-sm ${
              (summaryData?.profitLoss || 0) >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            Lucro/Prejuízo
          </p>
          <p
            className={`text-xl font-bold ${
              (summaryData?.profitLoss || 0) >= 0 ? "text-green-800" : "text-red-800"
            } flex items-center`}
          >
            {(summaryData?.profitLoss || 0) >= 0 ? (
              <TrendingUp size={18} className="mr-1" />
            ) : (
              <TrendingDown size={18} className="mr-1" />
            )}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(summaryData?.profitLoss || 0)}
          </p>
        </div>

        <div
          className={`${
            (summaryData?.profitLossPercentage || 0) >= 0
              ? "bg-green-50 border-green-100"
              : "bg-red-50 border-red-100"
          } p-4 rounded-lg border`}
        >
          <p
            className={`text-sm ${
              (summaryData?.profitLossPercentage || 0) >= 0
                ? "text-green-700"
                : "text-red-700"
            }`}
          >
            Rentabilidade
          </p>
          <p
            className={`text-xl font-bold ${
              (summaryData?.profitLossPercentage || 0) >= 0
                ? "text-green-800"
                : "text-red-800"
            } flex items-center`}
          >
            {(summaryData?.profitLossPercentage || 0) >= 0 ? (
              <TrendingUp size={18} className="mr-1" />
            ) : (
              <TrendingDown size={18} className="mr-1" />
            )}
            {((summaryData?.profitLossPercentage || 0)).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <GraficoRelatorio
            title="Distribuição por Categoria"
            type="pie"
            data={summaryData.investmentsByCategory}
            showLegend={true}
            height="300px"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <GraficoRelatorio
            title="Evolução do Patrimônio"
            type="line"
            data={summaryData.performanceOverTime}
            xAxisLabel="Período"
            yAxisLabel="Valor (R$)"
            height="300px"
          />
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <h3 className="text-lg font-medium text-gray-800 p-4 bg-gray-50 border-b border-gray-200 flex items-center">
          <Briefcase size={18} className="mr-2 text-blue-600" />
          Carteira de Ativos
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Ativo
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Quantidade
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Preço Médio
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Valor Investido
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Valor Atual
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Rendimento
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(summaryData?.assets || []).map((asset) => {
                // Garantir que os valores numéricos sejam números válidos
                const quantity = parseFloat(asset.quantity) || 0;
                const averagePrice = parseFloat(asset.averagePrice) || 0;
                const currentPrice = parseFloat(asset.currentPrice) || averagePrice;
                const invested = quantity * averagePrice;
                const current = quantity * currentPrice;
                const profitLoss = current - invested;
                const profitLossPercentage = invested > 0 ? (profitLoss / invested) * 100 : 0;
                
                return (
                  <tr key={asset.id || asset.symbol}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {asset.symbol}
                        </div>
                        <div className="text-sm text-gray-500">{asset.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {quantity.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(averagePrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(invested)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-gray-900">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(current)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                        profitLoss >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <div className="flex items-center justify-end">
                        {profitLoss >= 0 ? (
                          <TrendingUp size={16} className="mr-1" />
                        ) : (
                          <TrendingDown size={16} className="mr-1" />
                        )}
                        <span>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(profitLoss)}
                          <span className="text-xs ml-1">
                            ({profitLossPercentage >= 0 ? "+" : ""}
                            {profitLossPercentage.toFixed(2)}%)
                          </span>
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {(!summaryData?.assets || summaryData.assets.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhum investimento encontrado na sua carteira.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResumoInvest;
