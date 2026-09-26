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
    primary: "bg-[#3f7fc0] text-white hover:bg-[#41a6f6]",
    alert: "bg-[#dd363d] text-white hover:bg-[#ef5b5f]",
    success: "bg-[#2f9e8f] text-white hover:bg-[#3dbba8]",
    gold: "bg-[#d29922] text-[#0b1626] hover:bg-[#ffd866]",
    secondary: "bg-[#2c4a73] text-[#f4f4f4] hover:bg-[#6d82a3]",
    wood: "bg-[#f3f6ff] text-[#254671] hover:bg-white",
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
