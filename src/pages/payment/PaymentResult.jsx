import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { formatCurrency } from '../../utils/adminHelpers'

export default function PaymentResult() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const orderCode = searchParams.get('orderCode') || searchParams.get('orderId') || searchParams.get('id') || searchParams.get('paymentId')
  const code = searchParams.get('code')
  const cancel = searchParams.get('cancel')
  const queryStatus = searchParams.get('status')
  const amountFromUrl = searchParams.get('amount')
  const urlUserKey = searchParams.get('userKey')

  useEffect(() => {
    const activePendingCode = localStorage.getItem('active_pending_order_code') || orderCode
    const activeUserKey = localStorage.getItem('active_pending_user_key') || urlUserKey || 'guest'

    const userTxKey = `spectator_transactions_${activeUserKey}`
    const userProfileKey = `spectator_profile_${activeUserKey}`

    // Extract exact deposit amount from URL or pending transaction in localStorage
    let depositAmount = Number(amountFromUrl || 0)
    if (!depositAmount && activePendingCode) {
      try {
        const txs = JSON.parse(localStorage.getItem(userTxKey) || localStorage.getItem('spectator_transactions') || '[]')
        const found = txs.find(t => String(t.id) === String(activePendingCode) || String(t.orderId) === String(activePendingCode))
        if (found && found.amount) depositAmount = Number(found.amount)
      } catch (e) { }
    }

    const updateTxAndWallet = (statusStr) => {
      if (activePendingCode || orderCode) {
        const targetCode = activePendingCode || orderCode
        try {
          // Update user-scoped transaction list
          const updateListInKey = (keyName) => {
            const stored = localStorage.getItem(keyName)
            if (stored) {
              const list = JSON.parse(stored)
              const updated = list.map(tx => {
                if (String(tx.id) === String(targetCode) || String(tx.orderId) === String(targetCode)) {
                  if (tx.amount && !depositAmount) depositAmount = Number(tx.amount)
                  return { ...tx, status: statusStr }
                }
                return tx
              })
              localStorage.setItem(keyName, JSON.stringify(updated))
            }
          }

          updateListInKey(userTxKey)
          updateListInKey('spectator_transactions')

          if (statusStr === 'SUCCESS') {
            const specProfile = JSON.parse(localStorage.getItem(userProfileKey) || localStorage.getItem('spectator_profile') || '{}')
            const curBal = Number(specProfile.balance ?? specProfile.walletBalance ?? 0)
            const addVal = depositAmount > 0 ? depositAmount : 0
            const newBal = curBal + addVal

            specProfile.balance = newBal
            specProfile.walletBalance = newBal
            specProfile.payosLinked = true

            localStorage.setItem(userProfileKey, JSON.stringify(specProfile))
            localStorage.setItem('spectator_profile', JSON.stringify(specProfile))

            try {
              const pendingProf = JSON.parse(localStorage.getItem('pending_profile') || 'null')
              if (pendingProf) {
                pendingProf.balance = newBal
                pendingProf.walletBalance = newBal
                pendingProf.payosLinked = true
                localStorage.setItem('pending_profile', JSON.stringify(pendingProf))
              }
            } catch (pErr) { }
          }

          localStorage.removeItem('active_pending_order_code')
          localStorage.removeItem('active_pending_user_key')
        } catch (e) {
          console.warn('LocalStorage error:', e)
        }
      }
    }

    if (cancel === 'true') {
      updateTxAndWallet('FAILED')
      alert('⚠️ Giao dịch nạp tiền PayOS đã bị hủy.')
      navigate('/spectator/profile', { replace: true })
      return
    }

    if (code === '00' || queryStatus === 'PAID' || queryStatus === 'SUCCESS' || !code) {
      updateTxAndWallet('SUCCESS')
      alert(`✅ Nạp tiền thành công!\n\nĐã cộng ${depositAmount > 0 ? formatCurrency(depositAmount) : ''} vào ví tài khoản của bạn.`)
      navigate('/spectator/profile', { replace: true })
      return
    }

    // Default fallback redirect
    updateTxAndWallet('SUCCESS')
    alert(`✅ Giao dịch đã được xử lý!\n\nSố dư ví tài khoản của bạn đã được cập nhật.`)
    navigate('/spectator/profile', { replace: true })
  }, [orderCode, code, cancel, queryStatus, amountFromUrl, urlUserKey, navigate, searchParams])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      color: '#fff',
      fontSize: '15px'
    }}>
      Đang chuyển hướng về trang tài khoản...
    </div>
  )
}
