import React from 'react'

export const Loader = ({ size = 48, label = '' }) => {
  return (
    <div className="app-loader" role="status" aria-live="polite">
      <div className="spinner" style={{ width: size, height: size }} />
      {label ? <div className="loader-label">{label}</div> : null}
    </div>
  )
}
