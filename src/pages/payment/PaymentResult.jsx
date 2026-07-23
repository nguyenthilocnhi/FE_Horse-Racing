import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getPaymentStatus } from '../../services/paymentService'
import { formatCurrency } from '../../utils/adminHelpers'

export default function PaymentResult() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const orderCode = searchParams.get('orderCode') || searchParams.get('orderId') || searchParams.get('id') || searchParams.get('paymentId')
  const code = searchParams.get('code')
  const cancel = searchParams.get('cancel')
  const queryStatus = searchParams.get('status')

  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('PENDING') // 'SUCCESS' | 'FAILED' | 'PENDING'
  const [transaction, setTransaction] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const timerRef = useRef(null)
  const pollCountRef = useRef(0)

  useEffect(() => {
    if (!orderCode) {
      setLoading(false)
      setStatus('FAILED')
      setErrorMessage('Không tìm thấy mã giao dịch (orderCode) trên đường dẫn.')
      return
    }

    if (cancel === 'true') {
      setLoading(false)
      setStatus('FAILED')
      setErrorMessage('Giao dịch đã bị người dùng hủy bỏ trên payOS.')
      return
    }

    fetchStatus()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [orderCode, cancel])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const data = await getPaymentStatus(orderCode)
      setTransaction(data)

      const serverStatus = (data?.status || '').toUpperCase()

      if (serverStatus === 'SUCCESS') {
        setStatus('SUCCESS')
        setLoading(false)
        if (timerRef.current) clearInterval(timerRef.current)
      } else if (serverStatus === 'FAILED') {
        setStatus('FAILED')
        setLoading(false)
        if (timerRef.current) clearInterval(timerRef.current)
      } else {
        // Nếu Backend trả PENDING ➔ Kích hoạt Polling tự động mỗi 2 giây (tối đa 30 giây = 15 lần)
        setStatus('PENDING')
        startPolling()
      }
    } catch (err) {
      console.error('Lỗi kiểm tra trạng thái giao dịch:', err)
      if (code && code !== '00') {
        setStatus('FAILED')
        setErrorMessage('Giao dịch bị từ chối hoặc hủy bỏ trên cổng payOS.')
      } else {
        setStatus('PENDING')
        startPolling()
      }
      setLoading(false)
    }
  }

  const startPolling = () => {
    if (timerRef.current) return

    timerRef.current = setInterval(async () => {
      pollCountRef.current += 1

      // Sau 30s (15 lần thử) nếu vẫn PENDING thì ngưng polling và hiển thị thông báo
      if (pollCountRef.current >= 15) {
        if (timerRef.current) clearInterval(timerRef.current)
        setLoading(false)
        setStatus('PENDING')
        return
      }

      try {
        const data = await getPaymentStatus(orderCode)
        setTransaction(data)
        const currentStatus = (data?.status || '').toUpperCase()

        if (currentStatus === 'SUCCESS') {
          setStatus('SUCCESS')
          setLoading(false)
          if (timerRef.current) clearInterval(timerRef.current)
        } else if (currentStatus === 'FAILED') {
          setStatus('FAILED')
          setLoading(false)
          if (timerRef.current) clearInterval(timerRef.current)
        }
      } catch (err) {
        console.warn('Polling status error:', err?.message)
      }
    }, 2000)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'radial-gradient(circle at top, #0f172a 0%, #020617 100%)',
      color: '#fff',
      fontFamily: "'Montserrat', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '24px',
        padding: '36px 28px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(59, 130, 246, 0.15)',
        textAlign: 'center'
      }}>
        {/* Banner Logo */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(59, 130, 246, 0.15)',
          color: '#60a5fa',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          padding: '4px 14px',
          borderRadius: '20px',
          marginBottom: '20px'
        }}>
          payOS Hosted Checkout Gateway
        </div>

        {/* Status: SUCCESS */}
        {status === 'SUCCESS' && (
          <div>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '36px', color: '#fff',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
            }}>
              ✓
            </div>
            <h2 style={{ color: '#34d399', fontSize: '24px', margin: '0 0 8px', fontWeight: '800' }}>
              Nạp tiền thành công!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 24px' }}>
              Giao dịch đã được payOS xác nhận và cộng tiền vào tài khoản ví của bạn.
            </p>

            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '16px',
              padding: '18px',
              margin: '0 0 24px'
            }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Số tiền đã nạp</span>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#34d399' }}>
                {formatCurrency(transaction?.amount || 0)}
              </span>
            </div>

            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              padding: '14px 16px',
              textAlign: 'left',
              fontSize: '13px',
              marginBottom: '28px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Mã giao dịch:</span>
                <strong style={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: '14px' }}>
                  {transaction?.transactionCode || 'PAY' + (orderCode || '')}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Order Code:</span>
                <span style={{ color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace' }}>{orderCode}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/spectator/profile')}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              Quay về Ví
            </button>
          </div>
        )}

        {/* Status: FAILED */}
        {status === 'FAILED' && (
          <div>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '36px', color: '#fff',
              boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)'
            }}>
              ✕
            </div>
            <h2 style={{ color: '#f87171', fontSize: '24px', margin: '0 0 8px', fontWeight: '800' }}>
              Giao dịch thất bại
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 24px' }}>
              {errorMessage || 'Thanh toán không hoàn tất hoặc đã bị hủy bỏ.'}
            </p>

            <button
              type="button"
              onClick={() => navigate('/spectator/profile')}
              style={{
                width: '100%',
                padding: '14px',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Quay về Ví
            </button>
          </div>
        )}

        {/* Status: PENDING */}
        {status === 'PENDING' && (
          <div>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              border: '4px solid #60a5fa',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h2 style={{ color: '#e2e8f0', fontSize: '20px', margin: '0 0 8px', fontWeight: '700' }}>
              Đang xác nhận giao dịch...
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 24px' }}>
              Hệ thống đang kiểm tra xác thực thông tin từ cổng payOS.
            </p>

            <button
              type="button"
              onClick={() => navigate('/spectator/profile')}
              style={{
                padding: '10px 24px',
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Quay về Ví
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
