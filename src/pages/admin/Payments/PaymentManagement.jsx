import React from 'react'
import { payments } from '../../../data/adminMockData'
import { StatusBadge, formatCurrency } from '../../../utils/adminHelpers'
import './PaymentManagement.css'

export default function PaymentManagement() {
  return (
    <div className="payment-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Thanh toán</h1>
          <p className="admin-page-sub">Lịch sử giao dịch và trạng thái thanh toán</p>
        </div>
      </div>

      <div className="payment-summary">
        <div className="admin-stat-card">
          <span>Tổng giao dịch</span>
          <strong>{payments.length}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Hoàn thành</span>
          <strong>{payments.filter((p) => p.status === 'completed').length}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Chờ xử lý</span>
          <strong>{payments.filter((p) => p.status === 'pending').length}</strong>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head"><h3>Lịch sử giao dịch</h3></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã GD</th>
                <th>Transaction ID</th>
                <th>Người mua</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td className="payment-txn">{p.transactionId}</td>
                  <td>{p.buyer}</td>
                  <td className="payment-amount">{formatCurrency(p.amount)}</td>
                  <td>{p.method}</td>
                  <td><StatusBadge status={p.status === 'completed' ? 'approved' : 'pending_payment'} /></td>
                  <td>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
