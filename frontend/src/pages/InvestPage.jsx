import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Importar componentes
import AssetList from '../components/AssetList';
import AssetPurchaseForm from '../components/AssetPurchaseForm';
import AccountBalanceCard from '../components/AccountBalanceCard';
import ToastNotification from '../components/ToastNotification';
import SearchAssets from '../components/SearchAssets';

// Definir a URL base da API
const API_URL = 'http://localhost:3000/api';

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

  // Função para lidar com a seleção de um ativo
  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
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
        
        
        <div className="lg:flex lg:space-x-6">
          {/* Lista de ativos */}
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
      </div>
    </motion.div>
  );
};

export default InvestPage;