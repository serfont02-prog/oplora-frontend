import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconBefore?: ReactNode;
};

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: 'var(--op-color-primary)',
    borderColor: 'var(--op-color-primary)',
    color: '#ffffff',
    boxShadow: '0 10px 20px rgba(31, 124, 255, 0.18)',
  },
  secondary: {
    background: 'var(--op-color-surface-raised)',
    borderColor: 'var(--op-color-border-strong)',
    color: 'var(--op-color-ink)',
    boxShadow: 'var(--op-shadow-sm)',
  },
  ghost: {
    background: 'transparent',
    borderColor: 'transparent',
    color: 'var(--op-color-ink-soft)',
    boxShadow: 'none',
  },
};

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: {
    minHeight: 36,
    padding: '8px 12px',
    fontSize: 13,
  },
  md: {
    minHeight: 44,
    padding: '11px 16px',
    fontSize: 14,
  },
  lg: {
    minHeight: 52,
    padding: '14px 20px',
    fontSize: 15,
  },
};

export default function Button({
  children,
  iconBefore,
  variant = 'primary',
  size = 'md',
  style,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className="op-focus-ring"
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 'var(--op-radius-md)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontWeight: 800,
        lineHeight: 1,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.58 : 1,
        transition: 'transform 150ms ease, box-shadow 150ms ease, background 150ms ease',
        ...style,
      }}
      {...props}
    >
      {iconBefore ? (
        <span aria-hidden="true" style={{ display: 'inline-flex', flexShrink: 0 }}>
          {iconBefore}
        </span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}
