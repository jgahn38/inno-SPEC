import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'error';
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon: Icon,
  iconPosition = 'left',
  variant = 'default',
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseClasses = 'input block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors';
  
  const variantClasses = {
    default: 'border-gray-300 focus:ring-primary-500 focus:border-primary-500',
    error: 'border-red-300 focus:ring-red-500 focus:border-red-500',
  };
  
  const iconClasses = Icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '';
  
  const inputClasses = `${baseClasses} ${variantClasses[variant]} ${iconClasses} ${className}`;
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-gray-400" />
          </div>
        )}
        
        <input
          id={inputId}
          className={inputClasses}
          {...props}
        />
        
        {Icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
