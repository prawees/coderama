import { ButtonHTMLAttributes } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";
import { audio } from "@/lib/audio";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "alert" | "success" | "gold" | "secondary" | "sky" | "wood" | "plum";
}

/** Chunky wooden button with a press-down feel */
export function PixelButton({ children, variant = "primary", className = "", ...props }: PixelButtonProps) {
  const variants: Record<string, string> = {
    primary: "cozy-btn-leaf",
    success: "cozy-btn-leaf",
    alert: "cozy-btn-berry",
    gold: "cozy-btn-sun",
    secondary: "",
    sky: "cozy-btn-sky",
    wood: "cozy-btn-wood",
    plum: "cozy-btn-plum",
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    audio.playClick();
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    props.onClick?.(e);
  };

  return (
    <button
      {...props}
      className={`cozy-btn px-4 py-2 font-pixel text-xl select-none cursor-pointer ${variants[variant]} ${className}`}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
