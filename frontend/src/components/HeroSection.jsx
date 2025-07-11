import { Citrus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden w-full">
      <div className="max-w-7xl mx-auto py-24 px-4 w-full">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-[#ff6b00] rounded-2xl flex items-center justify-center">
              <Citrus color="white" size={32} />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Bem-vindo ao
            <span className="text-[#ff6b00]"> OrangeBank</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            O banco digital que simplifica sua vida financeira. Conta digital,
            cartões, investimentos e muito mais, tudo com a praticidade que você
            merece.
          </p>

          <div className="flex flex-col gap-4 justify-center items-center">
            <button
              onClick={() => navigate("/register")}
              className="text-lg py-3 px-8 bg-[#ff6b00] text-white border-none rounded-lg flex items-center cursor-pointer"
            >
              Abrir Sua Conta
              <ArrowRight size={20} className="ml-2" />
            </button>

            <button
              onClick={() => navigate("/login")}
              className="text-lg py-3 px-8 bg-transparent text-[#ff6b00] border border-[#ff6b00] rounded-lg cursor-pointer"
            >
              Já sou cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
