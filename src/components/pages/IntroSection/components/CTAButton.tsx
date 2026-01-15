import type { LucideIcon } from 'lucide-react';

interface CTAButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  icon?: LucideIcon;
}

export default function CTAButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  icon: Icon
}: CTAButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-2xl transition duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-medium';

  const variantClasses = {
    primary: 'bg-button-600 hover:bg-button-500 border border-button-700 text-button-foreground shadow-[0_1px_2px_rgba(63,74,88,0.25)]',
    secondary: 'border border-outline-subtle/50 dark:border-panel-300 hover:border-mint text-content hover:text-mint',
    ghost: 'text-content-muted hover:text-content'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const iconSizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
      {Icon && <Icon className={iconSizeClasses[size]} />}
    </button>
  );
}
