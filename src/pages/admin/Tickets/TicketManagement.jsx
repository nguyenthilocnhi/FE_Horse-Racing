import React, { useState } from 'react'
import { tickets } from '../../../data/adminMockData'
import { StatusBadge, formatCurrency } from '../../../utils/adminHelpers'
import './TicketManagement.css'

export default function TicketManagement() {
  const [statusFilter, setStatusFilter] = useState('ALL')

  const filtered = statusFilter === 'ALL'
    ? tickets
    : tickets.filter((t) => t.paymentStatus === statusFilter)

  return (
    <div className="ticket-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý Vé</h1>
          <p className="admin-page-sub">Theo dõi vé bán và trạng thái thanh toán</p>
        </div>
      </div>

      <div className="admin-filter-bar">
        <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="paid">Đã thanh toán</option>
          <option value="pending">Chờ thanh toán</option>
        </select>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã vé</th>
                <th>Người mua</th>
                <th>Email</th>
                <th>Race</th>
                <th>Loại vé</th>
                <th>SL</th>
                <th>Số tiền</th>
                <th>Thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.buyer}</td>
                  <td>{t.email}</td>
                  <td>{t.race}</td>
                  <td><span className="admin-badge admin-badge--gold">{t.type}</span></td>
                  <td>{t.quantity}</td>
                  <td className="ticket-amount">{formatCurrency(t.amount)}</td>
                  <td><StatusBadge status={t.paymentStatus === 'pending' ? 'pending_payment' : t.paymentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
