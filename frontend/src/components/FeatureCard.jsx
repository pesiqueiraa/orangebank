const FeatureCard = ({ feature }) => {
  const Icon = feature.icon;

  return (
    <div className="p-6 text-center bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="w-12 h-12 bg-[#ff6b00]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
        <Icon className="h-6 w-6 text-[#ff6b00]" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
      <p className="text-gray-600">{feature.description}</p>
    </div>
  );
};

export default FeatureCard;