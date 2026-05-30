import React from 'react';

export const BrandingFooter: React.FC = () => {
  return (
    <a
      href="https://instagram.com/oc.koding"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 group hover:opacity-100 transition-opacity"
      style={{ opacity: 0.35 }}
    >
      {/* Logo */}
      <div className="w-10 h-10 flex items-center justify-center">
        <img
          src="/logo.webp"
          alt="Our Creativity"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Signature Text */}
      <div className="flex flex-col justify-center text-right">
        <span className="text-xs font-semibold text-gray-300" style={{ opacity: 0.6 }}>
          ourcreativity
        </span>
        <span className="text-[10px] text-gray-400" style={{ opacity: 0.4 }}>
          edisi koding
        </span>
        <span className="text-[9px] text-gray-500" style={{ opacity: 0.35 }}>
          #ocekoding
        </span>
      </div>
    </a>
  );
};
