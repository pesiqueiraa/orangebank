import React from 'react';
import { Citrus } from 'lucide-react';
import RegisterForm from '../components/RegisterForm';

const Register = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/30 transform transition-transform hover:scale-105">
            <Citrus className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            Crie sua conta
          </h1>
          <p className="text-gray-600 mt-3 text-lg">
            Abra sua conta no OrangeBank em poucos minutos
          </p>
        </div>
        
        <RegisterForm />
        
        <div className="text-center mt-6 text-sm text-gray-500">
          © 2025 OrangeBank. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};

export default Register;