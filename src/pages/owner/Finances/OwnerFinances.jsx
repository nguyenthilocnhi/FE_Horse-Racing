import React, { useState } from 'react'
import { financialLog as initialTxns, ownerProfile } from '../../../data/ownerMockData'

export default function OwnerFinances() {
  const [txns, setTxns] = useState(initialTxns)
  const [filterType, setFilterType] = useState('all') // all, income, expense

  const totalIncome = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalWithdrawn = txns.filter(t => t.category === 'withdrawal' || t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const walletBalance = totalIncome - totalWithdrawn

  const filteredTxns = txns.filter(t => {
    if (filterType === 'all') return true
    if (filterType === 'income') return t.type === 'income'
    if (filterType === 'expense') return t.category === 'withdrawal' || t.type === 'expense'
    return true
  })

  return (
    <div className="own-finances">
      <div className="owner-page-head">
        <div>
          <h1 className="owner-page-title">Hồ sơ Tài chính Stable 🪙</h1>
          <p className="owner-page-sub">Theo dõi tiền thưởng thi đấu thắng giải và lịch sử rút tiền về tài khoản ngân hàng liên kết.</p>
        </div>
      </div>

      {/* Finance Summary Cards */}
      <div className="owner-stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 28 }}>
        <div className="owner-stat-card">
          <span>Tổng tiền thưởng nhận</span>
          <strong style={{ color: '#4ade80' }}>+{totalIncome.toLocaleString()} VND</strong>
        </div>
        <div className="owner-stat-card">
          <span>Tổng tiền đã rút</span>
          <strong style={{ color: '#f87171' }}>-{totalWithdrawn.toLocaleString()} VND</strong>
        </div>
        <div className="owner-stat-card">
          <span>Số dư ví hiện tại</span>
          <strong style={{ color: '#4ade80' }}>
            {walletBalance.toLocaleString()} VND
          </strong>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="owner-card">
        <div className="owner-card-head">
          <h3>Lịch sử giao dịch tài chính</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              className={`owner-btn owner-btn--sm ${filterType === 'all' ? 'owner-btn--gold' : 'owner-btn--ghost'}`}
              onClick={() => setFilterType('all')}
            >
              Tất cả
            </button>
            <button 
              className={`owner-btn owner-btn--sm ${filterType === 'income' ? 'owner-btn--gold' : 'owner-btn--ghost'}`}
              onClick={() => setFilterType('income')}
            >
              Tiền thưởng
            </button>
            <button 
              className={`owner-btn owner-btn--sm ${filterType === 'expense' ? 'owner-btn--gold' : 'owner-btn--ghost'}`}
              onClick={() => setFilterType('expense')}
            >
              Rút tiền
            </button>
          </div>
        </div>
        
        <div className="owner-table-wrap">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Mã GD</th>
                <th>Ngày giao dịch</th>
                <th>Mô tả</th>
                <th>Phân loại</th>
                <th>Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxns.map((txn) => (
                <tr key={txn.id}>
                  <td>{txn.id}</td>
                  <td>{txn.date}</td>
                  <td style={{ color: '#fff', fontWeight: 500 }}>{txn.description}</td>
                  <td>
                    <span className={`owner-badge owner-badge--${
                      txn.category === 'prize_money' ? 'green' : 'red'
                    }`}>
                      {txn.category === 'prize_money' ? 'Tiền thưởng' : 'Rút tiền'}
                    </span>
                  </td>
                  <td style={{ color: txn.type === 'income' ? '#4ade80' : '#f87171', fontWeight: 600, fontSize: 14 }}>
                    {txn.type === 'income' ? '+' : '-'}{txn.amount.toLocaleString()} VND
                  </td>
                </tr>
              ))}
              {filteredTxns.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 20, color: '#555' }}>
                    Không có giao dịch nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
