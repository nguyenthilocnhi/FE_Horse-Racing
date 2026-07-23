import React, { useState } from 'react'

export default function RefereeProfile() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { }
    }
    return {
      fullName: 'Trọng tài Nguyễn Văn Trãi',
      email: 'referee.trai@horseracing.com',
      phone: '0988776655',
      license: 'REF-INT-2024-88',
      role: 'Trọng Tài Chính',
      experienceYears: 8,
      status: 'Đang hoạt động'
    }
  })

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ ...user })
  const [successMsg, setSuccessMsg] = useState('')

  const handleSave = (e) => {
    e.preventDefault()
    setUser(formData)
    localStorage.setItem('user', JSON.stringify(formData))
    setIsEditing(false)
    setSuccessMsg('Cập nhật thông tin hồ sơ thành công!')
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Hồ Sơ Trọng Tài</h1>
      <p style={{ color: '#aaa', marginBottom: '24px' }}>Quản lý thông tin cá nhân và bằng cấp chứng chỉ trọng tài</p>

      {successMsg && (
        <div style={{ background: '#14532d', color: '#4ade80', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
          {successMsg}
        </div>
      )}

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px' }}>
        {!isEditing ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Họ và Tên</label>
                <strong style={{ fontSize: '16px' }}>{user.fullName}</strong>
              </div>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Mã Số Trọng Tài</label>
                <strong style={{ fontSize: '16px', color: '#d4af37' }}>{user.license}</strong>
              </div>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Email</label>
                <span>{user.email}</span>
              </div>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Số Điện Thoại</label>
                <span>{user.phone}</span>
              </div>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Kinh Nghiệm</label>
                <span>{user.experienceYears} năm</span>
              </div>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Trạng Thái</label>
                <span style={{ color: '#4ade80' }}>● {user.status}</span>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: 'linear-gradient(180deg, #e6c564, #d4af37)',
                color: '#000',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Chỉnh Sửa Hồ Sơ
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#ccc' }}>Họ và Tên</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #444', borderRadius: '8px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#ccc' }}>Số Điện Thoại</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #444', borderRadius: '8px', color: '#fff' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button
                type="submit"
                style={{ background: '#d4af37', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Lưu Thay Đổi
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ background: 'transparent', color: '#ccc', border: '1px solid #555', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
