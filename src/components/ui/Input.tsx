import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  allowClear?: boolean;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    error,
    leftIcon,
    rightIcon,
    allowClear = false,
    onClear,
    type = 'text',
    className = '',
    id,
    value,
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const isPassword = type === 'password';
  const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`ui-input-wrapper ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="ui-input-label">
          {label}
        </label>
      )}
      <div className={`ui-input-box ${error ? 'has-error' : ''}`}>
        {leftIcon && <span className="text-[var(--text-muted)] shrink-0">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={computedType}
          value={value}
          className="ui-input-field"
          {...props}
        />
        {allowClear && value && !props.disabled && (
          <button
            type="button"
            onClick={onClear}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded transition-colors"
            aria-label="Clear input"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {rightIcon && !isPassword && <span className="text-[var(--text-muted)] shrink-0">{rightIcon}</span>}
      </div>
      {error && <span className="ui-input-error">{error}</span>}
      {!error && helperText && <span className="ui-input-helper">{helperText}</span>}
    </div>
  );
});
