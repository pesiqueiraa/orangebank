import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Importar componentes
import AssetList from '../components/AssetList';
import AssetPurchaseForm from '../components/AssetPurchaseForm';
import AssetSellForm from '../components/AssetSellForm';
import AccountBalanceCard from '../components/AccountBalanceCard';
import ToastNotification from '../components/ToastNotification';
import SearchAssets from '../components/SearchAssets';

// Definir a URL base da API
const API_URL = 'https://orangebank.onrender.com/api';

// Configuração para animação de entrada na página
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  in: {
    opacity: 1,
    y: 0
  },
  out: {
    opacity: 0,
    y: -20
  }
};

const InvestPage = () => {
  // Estados
  const [contaInvestimento, setContaInvestimento] = useState(null);
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'sell'
  const [portfolioAssets, setPortfolioAssets] = useState([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [selectedPortfolioAsset, setSelectedPortfolioAsset] = useState(null);
  
  const navigate = useNavigate();

  // Buscar dados da conta investimento e ativos disponíveis
  useEffect(() => {
    const fetchData = async () => {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      
      if (!storedUser || !storedUser.id) {
        navigate('/login');
        return;
      }

      try {
        // Buscar conta investimento
        setIsLoading(true);
        const accountResponse = await axios.get(`${API_URL}/accounts/${storedUser.id}/investimento`);
        
        if (accountResponse.data.success) {
          setContaInvestimento(accountResponse.data.data);
        } else {
          throw new Error("Erro ao buscar dados da conta investimento");
        }
        
        // Buscar ativos disponíveis
        setLoadingAssets(true);
        const assetsResponse = await axios.get(`${API_URL}/accounts/assets`);
        
        if (assetsResponse.data.success) {
          setAssets(assetsResponse.data.data);
          setFilteredAssets(assetsResponse.data.data); // Inicializa os ativos filtrados
        } else {
          throw new Error("Erro ao buscar ativos disponíveis");
        }
        
        // Buscar portfolio do usuário
        await fetchPortfolio(accountResponse.data.data.id);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        displayToast(error.response?.data?.message || 'Erro ao carregar dados', 'error');
      } finally {
        setIsLoading(false);
        setLoadingAssets(false);
      }
    };

    fetchData();
  }, [navigate]);
  
  // Buscar portfolio do usuário
  const fetchPortfolio = async (accountId) => {
    if (!accountId) return;
    
    try {
      setLoadingPortfolio(true);
      const portfolioResponse = await axios.get(`${API_URL}/accounts/${accountId}/portfolio`);
      
      if (portfolioResponse.data.success) {
        setPortfolioAssets(portfolioResponse.data.data.assets || []);
      } else {
        throw new Error("Erro ao buscar portfolio");
      }
    } catch (error) {
      console.error('Erro ao carregar portfolio:', error);
      displayToast(error.response?.data?.message || 'Erro ao carregar portfolio', 'error');
    } finally {
      setLoadingPortfolio(false);
    }
  };

  // Filtrar ativos com base no termo de busca
  useEffect(() => {
    if (assets.length === 0) {
      setFilteredAssets([]);
      return;
    }
    
    if (!searchTerm.trim()) {
      setFilteredAssets(assets);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = assets.filter(asset => 
      asset.name?.toLowerCase().includes(term) || 
      asset.symbol?.toLowerCase().includes(term) || 
      asset.category?.toLowerCase().includes(term) ||
      asset.tipo?.toLowerCase().includes(term)
    );
    
    setFilteredAssets(filtered);
  }, [assets, searchTerm]);

  // Função para exibir notificações toast
  const displayToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    
    // Ocultar a notificação após 3 segundos
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Função para lidar com a seleção de um ativo para compra
  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
    if (activeTab === 'sell') {
      setActiveTab('buy');
    }
  };
  
  // Função para lidar com a seleção de um ativo do portfolio para venda
  const handleSelectPortfolioAsset = (asset) => {
    setSelectedPortfolioAsset(asset);
    if (activeTab === 'buy') {
      setActiveTab('sell');
    }
  };

  // Função para realizar a compra de um ativo
  const handlePurchaseAsset = async (purchaseData) => {
    setIsLoading(true);
    
    try {
      if (!contaInvestimento || !contaInvestimento.id) {
        throw new Error("Conta investimento não encontrada");
      }
      
      if (!selectedAsset || !selectedAsset.id) {
        throw new Error("Ativo não selecionado corretamente");
      }
      
      // Validar dados antes de enviar
      if (!selectedAsset.isFixedIncome && 
          (!purchaseData.quantity || purchaseData.quantity <= 0)) {
        throw new Error("Quantidade inválida");
      }
      
      console.log("Dados do ativo:", selectedAsset);
      console.log("Dados da compra:", purchaseData);
      
      // Endpoints diferentes baseados no tipo de ativo
      const endpoint = selectedAsset.isFixedIncome 
        ? `${API_URL}/accounts/${contaInvestimento.id}/buy-fixed-income`
        : `${API_URL}/accounts/${contaInvestimento.id}/buy-asset`;
      
      // Dados específicos baseados no tipo de ativo
      // Garantindo tipos de dados corretos
      const requestData = selectedAsset.isFixedIncome
        ? {
            fixedIncomeId: selectedAsset.id,
            amount: parseFloat(purchaseData.totalValue)
          }
        : {
            assetId: selectedAsset.id,
            quantity: parseInt(purchaseData.quantity, 10),
            price: parseFloat(selectedAsset.price)
          };
      
      console.log("Endpoint:", endpoint);
      console.log("Request data:", requestData);
      
      const response = await axios.post(endpoint, requestData);
      
      console.log("Resposta:", response.data);
      
      if (response.data.success) {
        // Atualizar o saldo da conta
        setContaInvestimento({
          ...contaInvestimento,
          balance: response.data.newBalance
        });
        
        // Atualizar o portfólio
        await fetchPortfolio(contaInvestimento.id);
        
        const assetName = selectedAsset.symbol || selectedAsset.name;
        const successMsg = selectedAsset.isFixedIncome
          ? `Investimento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(purchaseData.totalValue)} em ${assetName} realizado com sucesso!`
          : `Compra de ${purchaseData.quantity} ${assetName} realizada com sucesso!`;
        
        displayToast(successMsg, 'success');
        
        // Resetar a seleção após compra bem-sucedida
        setSelectedAsset(null);
      } else {
        throw new Error(response.data.message || 'Erro ao realizar a compra');
      }
    } catch (error) {
      console.error('Erro na compra de ativos:', error);
      // Mostrar detalhes do erro para depuração
      if (error.response) {
        console.error('Resposta do servidor:', error.response.data);
      }
      displayToast(error.response?.data?.message || error.message || 'Falha ao comprar ativo', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para realizar a venda de um ativo
  const handleSellAsset = async (sellData) => {
    setIsLoading(true);
    
    try {
      if (!contaInvestimento || !contaInvestimento.id) {
        throw new Error("Conta investimento não encontrada");
      }
      
      if (!selectedPortfolioAsset || !selectedPortfolioAsset.symbol) {
        throw new Error("Ativo não selecionado corretamente");
      }
      
      console.log("Dados do ativo:", selectedPortfolioAsset);
      console.log("Dados da venda:", sellData);
      
      const endpoint = `${API_URL}/accounts/${contaInvestimento.id}/sell-asset`;
      
      const response = await axios.post(endpoint, {
        assetSymbol: sellData.assetSymbol,
        quantity: parseInt(sellData.quantity, 10),
        currentPrice: parseFloat(sellData.currentPrice)
      });
      
      console.log("Resposta:", response.data);
      
      if (response.data.success) {
        // Atualizar o saldo da conta
        setContaInvestimento({
          ...contaInvestimento,
          balance: response.data.newBalance
        });
        
        // Atualizar o portfólio
        await fetchPortfolio(contaInvestimento.id);
        
        const assetName = selectedPortfolioAsset.name || selectedPortfolioAsset.symbol;
        let successMsg = `Venda de ${sellData.quantity} unidades de ${assetName} realizada com sucesso!`;
        
        if (response.data.tax > 0) {
          successMsg += ` Imposto de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(response.data.tax)} retido.`;
        }
        
        displayToast(successMsg, 'success');
        
        // Resetar a seleção após venda bem-sucedida
        setSelectedPortfolioAsset(null);
      } else {
        throw new Error(response.data.message || 'Erro ao realizar a venda');
      }
    } catch (error) {
      console.error('Erro na venda de ativos:', error);
      // Mostrar detalhes do erro para depuração
      if (error.response) {
        console.error('Resposta do servidor:', error.response.data);
      }
      displayToast(error.response?.data?.message || error.message || 'Falha ao vender ativo', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar o termo de busca
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 py-8 px-4 sm:px-6 lg:px-8"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.4 }}
    >
      {/* Toast de notificação */}
      <ToastNotification 
        show={showToast} 
        message={toastMessage} 
        type={toastType}
        onClose={() => setShowToast(false)}
      />
      
      <div className="max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8 flex items-center">
          <Link to="/dashboard" className="mr-4 p-2 rounded-full hover:bg-orange-200 transition-colors">
            <ArrowLeft className="h-6 w-6 text-orange-600" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Investimentos</h1>
        </div>
        
        {/* Saldo da conta */}
        <div className="mb-8">
          <AccountBalanceCard 
            balance={contaInvestimento?.balance} 
            loading={isLoading} 
          />
        </div>
        
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('buy')}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === 'buy'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Comprar Ativos
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === 'sell'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Vender Ativos
            </button>
          </div>
        </div>
        
        {/* Conteúdo baseado na tab ativa */}
        {activeTab === 'buy' ? (
          <div className="lg:flex lg:space-x-6">
            {/* Lista de ativos para compra */}
            <div className="lg:w-3/5">
              {loadingAssets ? (
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                  <p className="text-gray-500">Carregando ativos disponíveis...</p>
                </div>
              ) : (
                <>
                  <SearchAssets onSearch={handleSearch} />
                  <AssetList 
                    assets={filteredAssets} 
                    onSelectAsset={handleSelectAsset}
                    selectedAssetId={selectedAsset?.id}
                  />
                </>
              )}
            </div>
            
            {/* Formulário de compra */}
            <div className="lg:w-2/5 mt-6 lg:mt-0">
              <AssetPurchaseForm 
                selectedAsset={selectedAsset}
                availableBalance={contaInvestimento?.balance || 0}
                onPurchase={handlePurchaseAsset}
              />
              
              {selectedAsset && (
                <div className="mt-6 bg-white p-4 rounded-xl shadow-md">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Sobre este ativo</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedAsset.description || `${selectedAsset.name} (${selectedAsset.symbol}) é um ativo negociado na bolsa de valores.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:flex lg:space-x-6">
            {/* Lista de ativos do portfólio para venda */}
            <div className="lg:w-3/5">
              {loadingPortfolio ? (
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                  <p className="text-gray-500">Carregando seu portfólio...</p>
                </div>
              ) : portfolioAssets.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                  <p className="text-gray-500">Você ainda não possui ativos em sua carteira.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-800">Seu Portfólio</h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {portfolioAssets.map((asset) => (
                      <div
                        key={asset.symbol}
                        className={`p-4 hover:bg-orange-50 cursor-pointer transition-colors ${
                          selectedPortfolioAsset?.symbol === asset.symbol ? 'bg-orange-50' : ''
                        }`}
                        onClick={() => handleSelectPortfolioAsset(asset)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-gray-800">{asset.name}</h3>
                            <p className="text-sm text-gray-500">{asset.symbol}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.currentPrice)}
                            </div>
                            <div className={`text-sm ${asset.profitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {asset.profitLossPercentage >= 0 ? '+' : ''}
                              {asset.profitLossPercentage.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-gray-500">Quantidade: {asset.quantity}</span>
                          <span className="text-gray-500">
                            Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.totalValue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Formulário de venda */}
            <div className="lg:w-2/5 mt-6 lg:mt-0">
              <AssetSellForm 
                selectedAsset={selectedPortfolioAsset}
                onSell={handleSellAsset}
              />
              
              {selectedPortfolioAsset && (
                <div className="mt-6 bg-white p-4 rounded-xl shadow-md">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Informações sobre impostos</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    A venda de ações está sujeita ao imposto de renda de 15% sobre o lucro obtido.
                    O valor será calculado automaticamente no momento da venda.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InvestPage;