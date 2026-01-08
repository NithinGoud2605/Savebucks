/**
 * Premium Switch Component
 * Built on Radix UI with smooth toggle animation
 */

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '../../lib/utils'

const Switch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
    <SwitchPrimitive.Root
        className={cn(
            'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
            'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200',
            'dark:focus-visible:ring-slate-800 dark:focus-visible:ring-offset-slate-950',
            'dark:data-[state=checked]:bg-blue-600 dark:data-[state=unchecked]:bg-slate-700',
            className
        )}
        {...props}
        ref={ref}
    >
        <SwitchPrimitive.Thumb
            className={cn(
                'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0',
                'transition-transform duration-200',
                'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
            )}
        />
    </SwitchPrimitive.Root>
))
Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch }
