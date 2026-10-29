import React from 'react';
import { clsx } from 'clsx';
import { ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'verified' | 'unverified' | 'indicative' | 'reach' | 'target' | 'likely' | 'default';
  children?: React.ReactNode;
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'verified':
        return 'bg-acacia/20 text-[#8CF2A6] border-acacia border text-xs font-mono font-medium';
      case 'unverified':
        return 'bg-saffron/10 text-saffron border border-saffron/60 text-xs font-mono font-medium';
      case 'indicative':
        return 'bg-ink-surface text-bone-muted border border-dashed border-bone-muted/40 text-xs font-mono';
      case 'reach':
        return 'bg-murram/20 text-murram-light border border-murram/50 text-xs font-mono font-medium';
      case 'target':
        return 'bg-saffron/20 text-saffron-light border border-saffron/50 text-xs font-mono font-medium';
      case 'likely':
        return 'bg-acacia/30 text-emerald-300 border border-acacia-light text-xs font-mono font-medium';
      default:
        return 'bg-ink-surface text-bone border border-white/10 text-xs font-mono';
    }
  };

  const renderIcon = () => {
    if (variant === 'verified') return <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-[#8CF2A6]" />;
    if (variant === 'unverified') return <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-saffron" />;
    if (variant === 'indicative') return <HelpCircle className="w-3.5 h-3.5 inline mr-1 text-bone-muted" />;
    return null;
  };

  const defaultText = () => {
    if (children) return children;
    if (variant === 'verified') return 'Verified';
    if (variant === 'unverified') return 'Unverified';
    if (variant === 'indicative') return 'Indicative';
    return null;
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full tracking-wide transition-colors',
        getVariantStyles(),
        className
      )}
      {...props}
    >
      {renderIcon()}
      {defaultText()}
    </span>
  );
}

