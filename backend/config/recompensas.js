const ORANGE_COIN_REWARDS = {
  // Operações bancárias básicas
  DEPOSIT: 5,              // Depósito na conta
  WITHDRAW: 3,             // Saque da conta
  INTERNAL_TRANSFER: 4,    // Transferência entre contas próprias
  EXTERNAL_TRANSFER: 8,    // Transferência para outros usuários
  
  // Operações de investimento
  BUY_ASSET: 10,           // Compra de ativo (ações)
  SELL_ASSET: 8,           // Venda de ativo
  BUY_FIXED_INCOME: 12,    // Compra de renda fixa
  
  // Engajamento na plataforma
  GENERATE_REPORT: 7,      // Geração de relatório
  DAILY_LOGIN: 2,          // Login diário
  COMPLETE_PROFILE: 20,    // Completar perfil
  FIRST_INVESTMENT: 30     // Primeiro investimento (bônus único)
};

module.exports = ORANGE_COIN_REWARDS;