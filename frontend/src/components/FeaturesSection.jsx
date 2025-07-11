import FeatureCard from "./FeatureCard";

const FeaturesSection = ({ features }) => {
  return (
    <div className="py-24 bg-white/50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Por que escolher o OrangeBank?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Uma solução financeira completa com todos os serviços que você precisa no dia a dia
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;