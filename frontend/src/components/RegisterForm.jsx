import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, Check, CreditCard, Calendar } from 'lucide-react';

// Simple toast notification function (similar to the login form)
const showToast = (message, type = 'info') => {
  alert(`${type.toUpperCase()}: ${message}`);
  // In a real app, you'd implement a proper toast notification here
};

// CPF formatter helper
const formatCPF = (value) => {
  if (!value) return '';
  
  // Remove all non-digits
  const cpf = value.replace(/\D/g, '');
  
  // Apply the mask: 000.000.000-00
  return cpf
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .substring(0, 14);
};

// Validate CPF format
const isValidCPF = (cpf) => {
  const regex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  return regex.test(cpf);
};

const RegisterForm = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const navigate = useNavigate();

  const handleCPFChange = (e) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      showToast("As senhas não conferem.", "error");
      return;
    }
    
    if (!acceptTerms) {
      showToast("Você precisa aceitar os termos e condições.", "error");
      return;
    }

    if (!isValidCPF(cpf)) {
      showToast("CPF inválido. Use o formato 000.000.000-00.", "error");
      return;
    }
    
    setIsLoading(true);

    try {
      // Simulating API call to register the user
      // In a real implementation, you'd send all the required fields to the backend
      const success = await new Promise(resolve => setTimeout(() => resolve(true), 1500));
      
      if (success) {
        showToast("Conta criada com sucesso! Seja bem-vindo ao OrangeBank.", "success");
        navigate('/dashboard');
      } else {
        showToast("Erro ao criar conta. Tente novamente.", "error");
      }
    } catch (error) {
      showToast("Ocorreu um erro inesperado. Tente novamente.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-none shadow-xl bg-white/95 backdrop-blur rounded-xl overflow-hidden">
      <div className="px-8 py-5 border-b border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900">Criar Conta</h3>
        <p className="text-sm text-gray-600 mt-1">
          Cadastre-se para começar a usar o OrangeBank
        </p>
      </div>
      <div className="px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome completo */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nome completo</label>
            <div className="relative group">
              <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                <User className="h-5 w-5" />
              </div>
              <input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-11 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <div className="relative group">
              <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                <Mail className="h-5 w-5" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-11 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                required
              />
            </div>
          </div>

          {/* CPF - Novo campo */}
          <div className="space-y-2">
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF</label>
            <div className="relative group">
              <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                <CreditCard className="h-5 w-5" />
              </div>
              <input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCPFChange}
                maxLength={14}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-11 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                required
              />
            </div>
          </div>

          {/* Data de Nascimento - Novo campo */}
          <div className="space-y-2">
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">Data de nascimento</label>
            <div className="relative group">
              <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                <Calendar className="h-5 w-5" />
              </div>
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-11 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                required
              />
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
            <div className="relative group">
              <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Crie uma senha forte"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-11 pr-10 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                required
              />
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
            <p className="text-xs text-gray-500">
              Use pelo menos 8 caracteres com letras, números e símbolos.
            </p>
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmar senha</label>
            <div className="relative group">
              <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-11 pr-10 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Termos e condições */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={() => setAcceptTerms(!acceptTerms)}
                className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                required
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="text-gray-600">
                Eu concordo com os <Link to="/terms" className="text-orange-600 hover:text-orange-700 font-medium hover:underline transition-colors">Termos de Serviço</Link> e <Link to="/privacy" className="text-orange-600 hover:text-orange-700 font-medium hover:underline transition-colors">Política de Privacidade</Link>
              </label>
            </div>
          </div>

          {/* Botão de cadastro */}
          <button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-3 font-medium disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 mt-6"
            disabled={isLoading || !acceptTerms}
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Criando conta...</span>
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                <span>Criar conta</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link 
              to="/login" 
              className="text-orange-600 hover:text-orange-700 font-medium hover:underline transition-colors"
            >
              Faça login
            </Link>
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center text-xs text-gray-500">
          <ShieldCheck className="h-4 w-4 mr-1 text-green-600" />
          Seus dados estão seguros e protegidos
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;