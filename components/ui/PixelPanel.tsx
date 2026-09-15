import { ReactNode } from "react";

interface PixelPanelProps {
  children: ReactNode;
  className?: string;
  variant?: 'dark' | 'light' | 'alert' | 'success';
}

export function PixelPanel({ children, className = "", variant = 'dark' }: PixelPanelProps) {
  const baseStyle = "pixel-border p-4 relative backdrop-blur-md shadow-2xl transition-all duration-300";
  
  const variantStyles = {
    dark: "bg-[#0d1117]/90 text-gray-200",
    light: "bg-[#161b22]/90 text-white",
    alert: "bg-[#da3633]/90 text-white",
    success: "bg-[#2ea043]/90 text-white",
  };

  return (
    <div className={`${baseStyle} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}
