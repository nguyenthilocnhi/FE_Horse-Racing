import React, { useState, useEffect } from 'react'
import './GlobalAlertModal.css'

export default function GlobalAlertModal() {
  const [currentAlert, setCurrentAlert] = useState(null)
  const [queue, setQueue] = useState([])

  useEffect(() => {
    // Override standard window.alert with high-end custom popup modal
    const originalAlert = window.alert
    window.alert = (message) => {
      const alertObj = {
        id: Date.now() + Math.random(),
        type: 'alert',
        message: String(message || ''),
      }
      setQueue((prev) => [...prev, alertObj])
    }

    // Event listener for custom system-alert dispatches
    const handleSystemAlert = (e) => {
      const alertObj = {
        id: Date.now() + Math.random(),
        type: e.detail?.type || 'alert',
        message: String(e.detail?.message || ''),
        title: e.detail?.title,
        resolve: e.detail?.resolve,
      }
      setQueue((prev) => [...prev, alertObj])
    }

    window.addEventListener('system-alert', handleSystemAlert)

    return () => {
      window.alert = originalAlert
      window.removeEventListener('system-alert', handleSystemAlert)
    }
  }, [])

  // Process alert queue continuously
  useEffect(() => {
    if (!currentAlert && queue.length > 0) {
      setCurrentAlert(queue[0])
      setQueue((prev) => prev.slice(1))
    }
  }, [currentAlert, queue])

  const handleClose = (result = true) => {
    if (currentAlert?.resolve) {
      currentAlert.resolve(result)
    }
    setCurrentAlert(null)
  }

  // Support Keyboard shortcuts (Escape to dismiss, Enter to accept)
  useEffect(() => {
    if (!currentAlert) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose(false)
      } else if (e.key === 'Enter') {
        handleClose(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentAlert])

  if (!currentAlert) return null

  // Intelligently infer status type and title from message text content
  let statusType = 'info'
  let displayTitle = currentAlert.title || 'Thông báo'
  let messageText = currentAlert.message || ''

  if (messageText.includes('✅') || messageText.toLowerCase().includes('thành công')) {
    statusType = 'success'
    if (!currentAlert.title) displayTitle = 'Thành công'
  } else if (
    messageText.includes('❌') ||
    messageText.toLowerCase().includes('thất bại') ||
    messageText.toLowerCase().includes('lỗi')
  ) {
    statusType = 'error'
    if (!currentAlert.title) displayTitle = 'Thông báo lỗi'
  } else if (
    messageText.includes('⚠️') ||
    messageText.toLowerCase().includes('cảnh báo') ||
    messageText.toLowerCase().includes('vui lòng')
  ) {
    statusType = 'warning'
    if (!currentAlert.title) displayTitle = 'Cảnh báo'
  }

  // Format clean display text
  const cleanMessage = messageText.replace(/^[✅❌⚠️ℹ️🟢🔴]\s*/, '')

  return (
    <div className="system-popup-overlay" onClick={() => handleClose(false)}>
      <div
        className={`system-popup-card type-${statusType}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="system-popup-icon-wrapper">
          {statusType === 'success' && <div className="popup-icon icon-success">✓</div>}
          {statusType === 'error' && <div className="popup-icon icon-error">✕</div>}
          {statusType === 'warning' && <div className="popup-icon icon-warning">!</div>}
          {statusType === 'info' && <div className="popup-icon icon-info">♞</div>}
        </div>

        <h3 className="system-popup-title">{displayTitle}</h3>

        <div className="system-popup-message">
          {cleanMessage.split('\n').map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>

        <div className="system-popup-actions">
          {currentAlert.type === 'confirm' && (
            <button
              type="button"
              className="popup-btn popup-btn-cancel"
              onClick={() => handleClose(false)}
            >
              Hủy bỏ
            </button>
          )}
          <button
            type="button"
            className="popup-btn popup-btn-primary"
            onClick={() => handleClose(true)}
            autoFocus
          >
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  )
}
