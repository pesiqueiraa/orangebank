import React, { useState } from 'react';
import { Citrus } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://orangebank.onrender.com/api';

const Login = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState('email');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      
      if (loginType === 'email') {
        response = await axios.post(`${API_URL}/users/login/email`, { email: login, password });
      } else {
        response = await axios.post(`${API_URL}/users/login/cpf`, { cpf: login, password });
      }
      
      // Login bem-sucedido
      const userData = response.data.user;
      
      // Salvar usuário no localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Redirecionar para dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/30 transform transition-transform hover:scale-105">
            <Citrus className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            Bem-vindo de volta
          </h1>
          <p className="text-gray-600 mt-3 text-lg">
            Faça login para acessar sua conta OrangeBank
          </p>
        </div>
        
        {/* Login Form Integrado */}
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          <div className="mb-6">
            <div className="flex justify-center mb-4">
              <button
                type="button"
                className={`px-4 py-2 ${loginType === 'email' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'} rounded-l-lg transition-colors focus:outline-none`}
                onClick={() => setLoginType('email')}
              >
                Email
              </button>
              <button
                type="button"
                className={`px-4 py-2 ${loginType === 'cpf' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'} rounded-r-lg transition-colors focus:outline-none`}
                onClick={() => setLoginType('cpf')}
              >
                CPF
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label 
                htmlFor="login" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {loginType === 'email' ? 'Email' : 'CPF'}
              </label>
              <input
                type={loginType === 'email' ? 'email' : 'text'}
                id="login"
                placeholder={loginType === 'email' ? 'seuemail@exemplo.com' : '000.000.000-00'}
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            <div className="mb-6">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Senha
              </label>
              <input
                type="password"
                id="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-orange-500 text-white py-2.5 rounded-lg font-medium transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/esqueci-senha" className="text-sm text-orange-600 hover:text-orange-800">
              Esqueceu sua senha?
            </a>
            <p className="mt-4 text-gray-600">
              Não tem uma conta?{' '}
              <a href="/register" className="text-orange-600 hover:text-orange-800">
                Cadastre-se
              </a>
            </p>
          </div>
        </div>
        
        <div className="text-center mt-6 text-sm text-gray-500">
          © 2025 OrangeBank. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};

export default Login;