import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, CreditCard } from 'lucide-react';

// Função simples de notificação toast (substituindo a biblioteca de toast)
const showToast = (message, type = 'info') => {
  alert(`${type.toUpperCase()}: ${message}`);
  // Em um aplicativo real, você implementaria uma notificação toast apropriada aqui
};

// Helper para formatação de CPF
const formatCPF = (value) => {
  if (!value) return '';
  
  // Remove todos os caracteres não-dígitos
  const cpf = value.replace(/\D/g, '');
  
  // Aplica a máscara: 000.000.000-00
  return cpf
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .substring(0, 14);
};

// Simula o processo de login para demonstração
const login = async (identifier, password, method) => {
  // Validação simples para demonstração
  if ((method === 'email' && identifier.includes('@') && password.length > 3) ||
      (method === 'cpf' && identifier.includes('.') && password.length > 3)) {
    // Salva o estado de autenticação
    localStorage.setItem('isAuthenticated', 'true');
    return true;
  }
  return false;
};

const LoginForm = () => {
  // Estados para controlar os inputs e comportamento do formulário
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' ou 'cpf'
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Função para manipular a formatação do CPF durante digitação
  const handleCPFChange = (e) => {
    setCpf(formatCPF(e.target.value));
  };

  // Alterna entre os métodos de login (email/CPF)
  const toggleLoginMethod = () => {
    setLoginMethod(loginMethod === 'email' ? 'cpf' : 'email');
  };

  // Manipulador do envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Determina qual identificador usar com base no método selecionado
      const identifier = loginMethod === 'email' ? email : cpf;
      const success = await login(identifier, password, loginMethod);
      
      if (success) {
        showToast("Login realizado com sucesso! Bem-vindo de volta ao OrangeBank.", "success");
        navigate('/dashboard');
      } else {
        const errorMessage = loginMethod === 'email' 
          ? "Email ou senha incorretos." 
          : "CPF ou senha incorretos.";
        showToast(errorMessage, "error");
      }
    } catch (error) {
      showToast("Ocorreu um erro inesperado. Tente novamente.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-none shadow-xl bg-white/95 backdrop-blur rounded-xl overflow-hidden">
      {/* Cabeçalho do formulário de login */}
      <div className="px-8 py-5 border-b border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900">Entrar</h3>
        <p className="text-sm text-gray-600 mt-1">
          Digite suas credenciais para acessar sua conta
        </p>
      </div>
      <div className="px-8 py-6">
        {/* Seletor de método de login (Email ou CPF) */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-5">
          <button
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              loginMethod === 'email'
                ? 'bg-white text-orange-500 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            type="button"
          >
            Email
          </button>
          <button
            onClick={() => setLoginMethod('cpf')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              loginMethod === 'cpf'
                ? 'bg-white text-orange-500 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            type="button"
          >
            CPF
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo de entrada para email ou CPF */}
          <div className="space-y-2">
            <label htmlFor={loginMethod} className="block text-sm font-medium text-gray-700">
              {loginMethod === 'email' ? 'Email' : 'CPF'}
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                {loginMethod === 'email' ? (
                  <Mail className="h-5 w-5" />
                ) : (
                  <CreditCard className="h-5 w-5" />
                )}
              </div>
              
              {/* Renderização condicional do campo de entrada com base no método selecionado */}
              {loginMethod === 'email' ? (
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-11 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  required
                  autoFocus={loginMethod === 'email'}
                />
              ) : (
                <input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCPFChange}
                  maxLength={14}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-11 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  required
                  autoFocus={loginMethod === 'cpf'}
                />
              )}
            </div>
          </div>

          {/* Campo de senha com opção de visualizar/ocultar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
              <Link to="/forgot-password" className="text-xs text-orange-600 hover:text-orange-700 hover:underline font-medium transition-colors">
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-11 pr-10 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                required
              />
              {/* Botão para alternar a visibilidade da senha */}
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Opção de "lembrar-me" */}
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Lembrar-me
            </label>
          </div>

          {/* Botão de submissão com estado de carregamento */}
          <button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-3 font-medium disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" />
                <span>Entrar com segurança</span>
              </>
            )}
          </button>
        </form>

        {/* Link para cadastro de novos usuários */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link 
              to="/register" 
              className="text-orange-600 hover:text-orange-700 font-medium hover:underline transition-colors"
            >
              Cadastre-se grátis
            </Link>
          </p>
        </div>

        {/* Indicador de segurança */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center text-xs text-gray-500">
          <ShieldCheck className="h-4 w-4 mr-1 text-green-600" />
          Conexão segura com certificação SSL
        </div>
      </div>
    </div>
  );
};

export default LoginForm;