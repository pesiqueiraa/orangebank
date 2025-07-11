import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <div className="py-24 bg-gradient-to-r from-[#ff6b00]/10 to-[#ff6b00]/10 w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Pronto para uma nova experiência bancária?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Crie sua conta agora e tenha acesso a todos os serviços do OrangeBank
        </p>
        <button
          onClick={() => navigate("/register")}
          className="text-lg px-12 py-4 bg-[#ff6b00] hover:bg-[#e86200] text-white border-none rounded-lg flex items-center mx-auto"
        >
          Abrir Conta Gratuita
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Footer;