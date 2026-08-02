import { ButtonHTMLAttributes } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";
import { audio } from "@/lib/audio";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'alert' | 'success' | 'gold' | 'secondary';
}

export function PixelButton({ children, variant = 'primary', className = "", ...props }: PixelButtonProps) {
  const baseStyle = "pixel-border px-4 py-2 font-pixel text-xl uppercase transition-transform active:translate-y-1 active:shadow-none pixel-shadow cursor-pointer select-none";
  
  const variantStyles = {
    primary: "bg-pixel-panel-light text-white hover:brightness-110",
    alert: "bg-pixel-alert text-white hover:brightness-110",
    success: "bg-pixel-success text-pixel-bg hover:brightness-110",
    gold: "bg-pixel-gold text-pixel-bg hover:brightness-110",
    secondary: "bg-gray-600 text-white hover:brightness-110",
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    audio.playClick();
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <button 
      className={`${baseStyle} ${variantStyles[variant]} ${className}`}
      {...props}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
