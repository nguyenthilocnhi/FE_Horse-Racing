import React, { useState } from 'react'
import { financialLog as initialTxns, ownerProfile } from '../../../data/ownerMockData'

export default function OwnerFinances() {
  const [txns, setTxns] = useState(initialTxns)
  const [filterType, setFilterType] = useState('all') // all, income, expense

  const totalIncome = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const netEarnings = totalIncome - totalExpense

  const filteredTxns = txns.filter(t => {
    if (filterType === 'all') return true
    return t.type === filterType
  })

  return (
    <div className="own-finances">
      <div className="owner-page-head">
        <div>
          <h1 className="owner-page-title">Hồ sơ Tài chính Stable 🪙</h1>
          <p className="owner-page-sub">Theo dõi tiền thưởng thi đấu, ngân sách trả lương jockey và chi phí đăng ký giải đấu.</p>
        </div>
      </div>

      {/* Finance Summary Cards */}
      <div className="owner-stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 28 }}>
        <div className="owner-stat-card">
          <span>Tổng thu nhập thưởng</span>
          <strong style={{ color: '#4ade80' }}>+{totalIncome.toLocaleString()} VND</strong>
        </div>
        <div className="owner-stat-card">
          <span>Tổng chi trả phí</span>
          <strong style={{ color: '#f87171' }}>-{totalExpense.toLocaleString()} VND</strong>
        </div>
        <div className="owner-stat-card">
          <span>Lợi nhuận ròng</span>
          <strong style={{ color: netEarnings >= 0 ? '#4ade80' : '#f87171' }}>
            {netEarnings >= 0 ? '+' : ''}{netEarnings.toLocaleString()} VND
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
              Khoản thu
            </button>
            <button 
              className={`owner-btn owner-btn--sm ${filterType === 'expense' ? 'owner-btn--gold' : 'owner-btn--ghost'}`}
              onClick={() => setFilterType('expense')}
            >
              Khoản chi
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
                      txn.category === 'prize_money' ? 'green' : txn.category === 'jockey_fee' ? 'red' : 'gray'
                    }`}>
                      {txn.category === 'prize_money' ? 'Tiền thưởng' : txn.category === 'jockey_fee' ? 'Phí Jockey' : txn.category === 'registration_fee' ? 'Lệ phí giải' : 'Y tế/Bảo dưỡng'}
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
