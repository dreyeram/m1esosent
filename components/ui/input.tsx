/**
 * Input Component
 * 
 * Accessible input component with label and error states.
 */

import * as React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            label,
            error,
            hint,
            leftIcon,
            rightIcon,
            id,
            disabled,
            ...props
        },
        ref
    ) => {
        const inputId = id || React.useId();

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-slate-300 mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        disabled={disabled}
                        className={clsx(
                            'w-full rounded-lg border bg-slate-800/50 text-slate-100',
                            'placeholder:text-slate-500',
                            'transition-all duration-200',
                            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            error
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500',
                            leftIcon ? 'pl-10' : 'pl-4',
                            rightIcon ? 'pr-10' : 'pr-4',
                            'py-2.5 text-sm',
                            className
                        )}
                        aria-invalid={error ? 'true' : 'false'}
                        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-400">
                        {error}
                    </p>
                )}
                {hint && !error && (
                    <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-slate-500">
                        {hint}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

/**
 * Textarea Component
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, hint, id, disabled, ...props }, ref) => {
        const textareaId = id || React.useId();

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="block text-sm font-medium text-slate-300 mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    disabled={disabled}
                    className={clsx(
                        'w-full rounded-lg border bg-slate-800/50 text-slate-100',
                        'placeholder:text-slate-500',
                        'transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'resize-none',
                        error
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500',
                        'px-4 py-2.5 text-sm',
                        className
                    )}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
                    {...props}
                />
                {error && (
                    <p id={`${textareaId}-error`} className="mt-1.5 text-sm text-red-400">
                        {error}
                    </p>
                )}
                {hint && !error && (
                    <p id={`${textareaId}-hint`} className="mt-1.5 text-sm text-slate-500">
                        {hint}
                    </p>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
