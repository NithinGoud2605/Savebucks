import React from 'react'
import { clsx } from 'clsx'

export function Container({ children, className, size = 'default', ...props }) {
  return (
    <div
      className={clsx(
        'mx-auto px-4 sm:px-6 lg:px-8',
        {
          'max-w-7xl': size === 'default',
          'max-w-4xl': size === 'medium',
          'max-w-2xl': size === 'small',
          'max-w-full': size === 'full',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
