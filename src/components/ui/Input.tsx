import { forwardRef, useId, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { cn } from './cn';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
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
    className,
    id,
    value,
    disabled,
    required,
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const inputId = id || (typeof label === 'string' && label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : generatedId);
  const isPassword = type === 'password';
  const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const messageId = `${inputId}-message`;
  const hasMessage = Boolean(error || helperText);

  return (
    <div className={cn('ui-input-wrapper', className)}>
      {label && (
        <label htmlFor={inputId} className="ui-input-label">
          {label}
          {required && (
            <span aria-hidden="true" className="ms-1 text-[var(--color-danger-ink)]">
              *
            </span>
          )}
        </label>
      )}
      <div className={cn('ui-input-box', error && 'has-error')}>
        {leftIcon && <span className="text-[var(--text-muted)] shrink-0">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={computedType}
          value={value}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          aria-required={required || undefined}
          className="ui-input-field"
          {...props}
        />
        {allowClear && value && !disabled && (
          <button type="button" onClick={onClear} className="ui-input-action" aria-label="Clear input">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="ui-input-action"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
          </button>
        )}
        {rightIcon && !isPassword && <span className="text-[var(--text-muted)] shrink-0">{rightIcon}</span>}
      </div>
      {error && (
        <span id={messageId} className="ui-input-error" role="alert">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={messageId} className="ui-input-helper">
          {helperText}
        </span>
      )}
    </div>
  );
});
