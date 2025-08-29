import React from 'react'

export function SkipLink() {
  return (
    <a
      href="#main"
      className="skip-link"
      onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth' })}
    >
      Skip to main content
    </a>
  )
}
