import { ReactNode } from "react";

interface PixelPanelProps {
  children: ReactNode;
  className?: string;
  variant?: "dark" | "light" | "alert" | "success" | "parchment";
}

/** Wooden-framed panel. "dark" is a night-wood panel for overlays; "parchment"/"light" are reading surfaces. */
export function PixelPanel({ children, className = "", variant = "dark" }: PixelPanelProps) {
  const variants: Record<string, string> = {
    dark: "cozy-wood-dark text-pixel-text pixel-border",
    light: "cozy-panel",
    parchment: "cozy-panel",
    alert: "bg-[#c4515b] text-[#fff6ec] pixel-border",
    success: "bg-[#6fae54] text-[#fff6ec] pixel-border",
  };
  return <div className={`p-4 relative ${variants[variant]} ${className}`}>{children}</div>;
}
