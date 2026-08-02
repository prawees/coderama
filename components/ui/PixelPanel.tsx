import { ReactNode } from "react";

interface PixelPanelProps {
  children: ReactNode;
  className?: string;
  variant?: 'dark' | 'light' | 'alert' | 'success';
}

export function PixelPanel({ children, className = "", variant = 'dark' }: PixelPanelProps) {
  const baseStyle = "pixel-border p-4 relative";
  
  const variantStyles = {
    dark: "bg-pixel-panel text-pixel-text",
    light: "bg-pixel-panel-light text-white",
    alert: "bg-pixel-alert text-white",
    success: "bg-pixel-success text-black",
  };

  return (
    <div className={`${baseStyle} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}
