import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const GraficoRelatorio = ({
  data,
  type = 'bar',
  title,
  showLegend = false,
  xAxisLabel,
  yAxisLabel,
  height = '300px'
}) => {
  const colors = [
    '#FF6384', // Rosa
    '#36A2EB', // Azul
    '#FFCE56', // Amarelo
    '#4BC0C0', // Verde-água
    '#9966FF', // Roxo
    '#FF9F40', // Laranja
    '#C7C7C7', // Cinza
    '#5366FF', // Azul-roxo
    '#4EA686', // Verde
    '#FF6347'  // Vermelho-coral
  ];

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart
            data={data.chartData || []}
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              label={{ 
                value: xAxisLabel, 
                position: 'bottom',
                offset: 0,
                style: { textAnchor: 'middle' }
              }} 
            />
            <YAxis 
              label={{ 
                value: yAxisLabel, 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' } 
              }} 
            />
            <Tooltip formatter={(value) => [`${value}`, '']} />
            {showLegend && <Legend />}
            {(data.series || []).map((series, index) => (
              <Bar key={index} dataKey={series.key} fill={colors[index % colors.length]} name={series.name} />
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart
            data={data.chartData || []}
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              label={{ 
                value: xAxisLabel, 
                position: 'bottom',
                offset: 0,
                style: { textAnchor: 'middle' }
              }}
            />
            <YAxis 
              label={{ 
                value: yAxisLabel, 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' } 
              }} 
            />
            <Tooltip formatter={(value) => [`${value}`, '']} />
            {showLegend && <Legend />}
            {(data.series || []).map((series, index) => (
              <Line 
                key={index} 
                type="monotone" 
                dataKey={series.key} 
                stroke={colors[index % colors.length]} 
                activeDot={{ r: 8 }}
                name={series.name} 
              />
            ))}
          </LineChart>
        );

      case 'pie':
      case 'doughnut':
        return (
          <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <Pie
              data={data.chartData || []}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={type === 'doughnut' ? 100 : 80}
              innerRadius={type === 'doughnut' ? 60 : 0}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {(data.chartData || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {showLegend && <Legend layout="vertical" align="right" verticalAlign="middle" />}
            <Tooltip formatter={(value) => [`${value}`, '']} />
          </PieChart>
        );

      default:
        return <div>Tipo de gráfico não suportado</div>;
    }
  };

  return (
    <div className="w-full" style={{ height }}>
      {title && <h3 className="text-center text-lg font-medium mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default GraficoRelatorio;