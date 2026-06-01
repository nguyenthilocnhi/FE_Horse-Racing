import React from 'react'

export default function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="modal-close">Close</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
