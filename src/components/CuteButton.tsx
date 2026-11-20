import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'pink' | 'sky' | 'lavender' | 'peach' | 'mint' | 'cream';

interface CuteButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  pink: 'bg-gradient-to-b from-[#FF9AB8] to-[#FF6B93] text-white border-[#4A355A] hover:brightness-105',
  sky: 'bg-gradient-to-b from-[#9AD5FF] to-[#56AEFF] text-[#2B2440] border-[#4A355A] hover:brightness-105',
  lavender: 'bg-gradient-to-b from-[#CFC1FF] to-[#A68EFF] text-[#2B2440] border-[#4A355A] hover:brightness-105',
  peach: 'bg-gradient-to-b from-[#FFC4AC] to-[#FF9675] text-[#3B263B] border-[#4A355A] hover:brightness-105',
  mint: 'bg-gradient-to-b from-[#A2F0CE] to-[#5CD0A5] text-[#243D36] border-[#4A355A] hover:brightness-105',
  cream: 'bg-[#FFFDF9] text-[#4A355A] border-[#4A355A]/30 hover:bg-[#F7F3FF]',
};

const SIZE_CLASSES: Record<NonNullable<CuteButtonProps['size']>, string> = {
  sm: 'min-h-[44px] px-4 py-2 text-sm',
  md: 'min-h-[48px] px-5 py-2.5 text-base',
  lg: 'min-h-[54px] px-7 py-3 text-lg',
};

export function CuteButton({
  variant = 'pink',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  children,
  type = 'button',
  ...rest
}: CuteButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        'font-display inline-flex items-center justify-center gap-2 rounded-full border-[3px] font-bold tracking-wide transition-transform duration-100',
        'shadow-[0_4px_0_rgba(74,53,90,0.22)] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(74,53,90,0.22)]',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
