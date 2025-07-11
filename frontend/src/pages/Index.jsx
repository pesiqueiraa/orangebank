import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Shield, Zap, PieChart } from "lucide-react";

import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import Footer from "../components/Footer";

const Index = () => {
  const user = null;
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const features = [
    {
      icon: CreditCard,
      title: "Conta Digital Completa",
      description:
        "Conta corrente, poupança e cartões em um só lugar, sem tarifas de manutenção.",
    },
    {
      icon: Shield,
      title: "Segurança Garantida",
      description:
        "Suas transações e dados protegidos com a mais alta tecnologia de segurança.",
    },
    {
      icon: Zap,
      title: "Transferências Instantâneas",
      description: "Envie e receba dinheiro em segundos com Pix e TED sem custos.",
    },
    {
      icon: PieChart,
      title: "Investimentos Inteligentes",
      description:
        "Diversifique sua carteira com opções de investimentos para todos os perfis.",
    },
  ];

  return (
    <div className="min-h-screen w-full m-0 p-0 bg-gradient-to-br from-white via-orange-50 to-orange-100">
      <HeroSection />
      <FeaturesSection features={features} />
      <Footer />
    </div>
  );
};

export default Index;