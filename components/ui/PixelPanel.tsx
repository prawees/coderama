import { ReactNode } from "react";

interface PixelPanelProps {
  children: ReactNode;
  className?: string;
  variant?: 'dark' | 'light' | 'alert' | 'success' | 'wood' | 'metal' | 'paper';
  title?: string;
}

/**
 * Opaque, chunky panel. No blur, no rounded corners, no gradients.
 * 'wood' and 'metal' render a full Stardew-style frame with inner inset.
 */
export function PixelPanel({ children, className = "", variant = 'dark', title }: PixelPanelProps) {
  if (variant === 'wood' || variant === 'metal') {
    return (
      <div className={`relative ${variant === 'wood' ? 'pixel-frame' : 'pixel-frame-metal rivets'} ${className}`}>
        {title && (
          <div className="absolute -top-3 left-6 px-3 py-1 bg-pixel-ink border-4 border-black text-pixel-gold font-heading text-[10px] tracking-widest uppercase z-10">
            {title}
          </div>
        )}
        <div className="frame-inner p-3 overflow-hidden flex flex-col">{children}</div>
      </div>
    );
  }
  if (variant === 'paper') {
    return <div className={`pixel-frame-paper p-5 ${className}`}>{children}</div>;
  }
  const flat = {
    dark: "bg-[#0d0b14] text-[#f4f4f4] border-[#333c57]",
    light: "bg-[#1a1c2c] text-white border-[#566c86]",
    alert: "bg-[#ac3232] text-white border-[#5d1a1a]",
    success: "bg-[#6abe30] text-[#0d0b14] border-[#2e5a12]",
  }[variant];
  return <div className={`border-4 ${flat} p-4 relative pixel-shadow ${className}`}>{children}</div>;
}
