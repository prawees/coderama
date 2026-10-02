import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface PixelPanelProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  children: ReactNode;
  className?: string;
  variant?: 'dark' | 'light' | 'alert' | 'success' | 'wood' | 'metal' | 'paper';
  title?: string;
}

/**
 * Opaque, chunky panel. No blur, no rounded corners, no gradients.
 * 'wood' and 'metal' render a full Stardew-style frame with inner inset.
 */
export function PixelPanel({ children, className = "", variant = 'dark', title, ...props }: PixelPanelProps) {
  const motionProps = {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { type: "spring" as const, stiffness: 300, damping: 20 },
    ...props
  };

  if (variant === 'wood' || variant === 'metal') {
    return (
      <motion.div className={`relative ${variant === 'wood' ? 'pixel-frame' : 'pixel-frame-metal rivets'} ${className}`} {...motionProps}>
        {title && (
          <div className="absolute -top-3 left-6 px-3 py-1 bg-pixel-ink border-4 border-black text-pixel-gold font-heading text-[10px] tracking-widest uppercase z-10">
            {title}
          </div>
        )}
        <div className="frame-inner p-3 overflow-hidden flex flex-col">{children}</div>
      </motion.div>
    );
  }
  if (variant === 'paper') {
    return <motion.div className={`pixel-frame-paper p-5 ${className}`} {...motionProps}>{children}</motion.div>;
  }
  const flat = {
    dark: "bg-[#0b1626] text-[#f4f4f4] border-[#2c4a73]",
    light: "bg-[#16263f] text-white border-[#6d82a3]",
    alert: "bg-[#ac3232] text-white border-[#5d1a1a]",
    success: "bg-[#6abe30] text-[#0b1626] border-[#2e5a12]",
  }[variant];
  return <motion.div className={`border-4 ${flat} p-4 relative pixel-shadow ${className}`} {...motionProps}>{children}</motion.div>;
}
