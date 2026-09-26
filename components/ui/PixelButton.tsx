import { ButtonHTMLAttributes } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";
import { audio } from "@/lib/audio";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'alert' | 'success' | 'gold' | 'secondary' | 'wood';
  size?: 'sm' | 'md' | 'lg';
}

/** Chunky Stardew-style button: 4px ink outline, flat fill, hard bevel, 4px press travel. */
export function PixelButton({ children, variant = 'primary', size = 'md', className = "", ...props }: PixelButtonProps) {
  const base = "pixel-btn font-pixel uppercase cursor-pointer select-none inline-flex items-center justify-center gap-2 leading-none";
  const sizes = { sm: "px-3 py-2 text-base", md: "px-4 py-3 text-xl", lg: "px-6 py-4 text-2xl" };
  const variants = {
    primary: "bg-[#3b5dc9] text-white hover:bg-[#41a6f6]",
    alert: "bg-[#d95763] text-white hover:bg-[#ef7d57]",
    success: "bg-[#6abe30] text-[#0d0b14] hover:bg-[#99e550]",
    gold: "bg-[#d29922] text-[#0d0b14] hover:bg-[#fbf236]",
    secondary: "bg-[#333c57] text-[#f4f4f4] hover:bg-[#566c86]",
    wood: "bg-[#8d5524] text-[#ffe9c9] hover:bg-[#c68642]",
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    audio.playClick();
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    props.onClick?.(e);
  };

  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} onClick={handleClick}>
      {children}
    </button>
  );
}
