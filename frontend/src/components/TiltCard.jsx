import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const TiltCard = ({ children, className = '' }) => {
  const ref = useRef(null);
  
  // Valores de movimento para rastrear a posição do mouse
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Suaviza o movimento com efeito de mola
  const xSmooth = useSpring(x, { stiffness: 150, damping: 20 });
  const ySmooth = useSpring(y, { stiffness: 150, damping: 20 });
  
  // Transforma a posição do mouse em valores de rotação
  const rotateX = useTransform(ySmooth, [-100, 100], [10, -10]);
  const rotateY = useTransform(xSmooth, [-100, 100], [-10, 10]);
  
  // Manipula o movimento do mouse
  const handleMouseMove = (e) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calcula o ponto central e o deslocamento a partir do centro
    const centerX = rect.left + width / 2;
    const centerY = rect.top + height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Atualiza os valores de movimento
    x.set(mouseX);
    y.set(mouseY);
  };
  
  // Reinicia quando o mouse sai do componente
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`${className} relative overflow-hidden`}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Eleva o conteúdo para dar profundidade ao efeito 3D */}
      <div style={{ transform: "translateZ(20px)" }}>
        {children}
      </div>
    </motion.div>
  );
};

export default TiltCard;