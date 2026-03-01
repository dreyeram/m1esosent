'use client';

import React, { useId } from 'react';
import { clsx, type ClassValue } from 'clsx';

// Utility for class merging with tailwind-merge support if available, purely clsx if not
export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

// --- Card Component ---
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={cn("bg-white rounded-xl shadow-sm border border-slate-200 p-6", className)}>
            {children}
        </div>
    );
}

// --- Button Component ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
                {
                    "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm": variant === 'primary',
                    "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500": variant === 'secondary',
                    "bg-transparent hover:bg-slate-100 text-slate-700": variant === 'ghost',
                    "bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500": variant === 'danger',
                    "px-3 py-1.5 text-sm": size === 'sm',
                    "px-4 py-2 text-base": size === 'md',
                    "px-6 py-3 text-lg": size === 'lg',
                },
                className
            )}
            {...props}
        />
    );
}

// --- Input Component ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export function Input({ className, label, id, ...props }: InputProps) {
    // Use React's useId hook for SSR-safe ID generation
    const reactId = useId();
    const inputId = id || reactId;

    return (
        <div className="flex flex-col gap-1.5">
            {label && <label htmlFor={inputId} className="text-sm font-medium text-slate-700">{label}</label>}
            <input
                id={inputId}
                className={cn(
                    "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all",
                    className
                )}
                {...props}
            />
        </div>
    );
}

// --- Select Component ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { label: string; value: string }[];
}

export function Select({ className, label, id, options, ...props }: SelectProps) {
    // Use React's useId hook for SSR-safe ID generation
    const reactId = useId();
    const selectId = id || reactId;

    return (
        <div className="flex flex-col gap-1.5">
            {label && <label htmlFor={selectId} className="text-sm font-medium text-slate-700">{label}</label>}
            <select
                id={selectId}
                className={cn(
                    "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all appearance-none",
                    className
                )}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

// --- Label Component ---
export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
    return (
        <label className={cn("text-sm font-medium text-slate-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props}>
            {children}
        </label>
    );
}
