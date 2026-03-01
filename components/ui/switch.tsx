/**
 * Switch Component - Radix UI Based
 * 
 * Accessible toggle switch component.
 */

"use client";

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { clsx } from 'clsx';

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
    label?: string;
    description?: string;
}

const Switch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitive.Root>,
    SwitchProps
>(({ className, label, description, id, ...props }, ref) => {
    const switchId = id || React.useId();

    const switchElement = (
        <SwitchPrimitive.Root
            ref={ref}
            id={switchId}
            className={clsx(
                'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
                'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-slate-700',
                className
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb
                className={clsx(
                    'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
                    'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
                )}
            />
        </SwitchPrimitive.Root>
    );

    if (label || description) {
        return (
            <div className="flex items-start gap-3">
                {switchElement}
                <div className="flex flex-col">
                    {label && (
                        <label
                            htmlFor={switchId}
                            className="text-sm font-medium text-slate-100 cursor-pointer"
                        >
                            {label}
                        </label>
                    )}
                    {description && (
                        <span className="text-sm text-slate-400">{description}</span>
                    )}
                </div>
            </div>
        );
    }

    return switchElement;
});

Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
