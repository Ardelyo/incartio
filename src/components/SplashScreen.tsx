import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Show splash for 2 seconds, then fade out
    const displayTimer = setTimeout(() => {
      setOpacity(0);
    }, 2000);

    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(displayTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-[#202124] z-[9999] flex flex-col items-center justify-center transition-opacity duration-800"
      style={{ opacity }}
    >
      {/* Logo */}
      <div className="mb-8">
        <img
          src="/logo.webp"
          alt="Our Creativity Logo"
          className="w-24 h-24 object-contain"
          style={{ opacity: 0.7 }}
        />
      </div>

      {/* Main Text */}
      <h1
        className="text-4xl font-bold text-white text-center mb-4 tracking-wider"
        style={{ opacity: 0.8 }}
      >
        ourcreativity
      </h1>

      {/* Signature Text */}
      <p
        className="text-sm text-gray-300 text-center"
        style={{ opacity: 0.5 }}
      >
        edisi koding
      </p>
      <p
        className="text-xs text-gray-400 text-center mt-1"
        style={{ opacity: 0.4 }}
      >
        #ocekoding
      </p>
    </div>
  );
};
