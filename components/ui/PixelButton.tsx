import { ButtonHTMLAttributes } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";
import { audio } from "@/lib/audio";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'alert' | 'success' | 'gold' | 'secondary';
}

export function PixelButton({ children, variant = 'primary', className = "", ...props }: PixelButtonProps) {
  const baseStyle = "pixel-border px-4 py-2 font-pixel text-xl uppercase transition-transform duration-100 active:scale-95 cursor-pointer select-none";
  
  const variantStyles = {
    primary: "bg-[#1f6feb] text-white hover:bg-[#388bfd]",
    alert: "bg-[#da3633] text-white hover:bg-[#f85149]",
    success: "bg-[#2ea043] text-white hover:bg-[#3fb950]",
    gold: "bg-[#d29922] text-[#0d1117] hover:bg-[#e3b341]",
    secondary: "bg-[#21262d] text-gray-300 hover:bg-[#30363d]",
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
