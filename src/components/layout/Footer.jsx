import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer-section">
      <div className="footer-bottom">
        <p>© 2026 Equinox Racing. Tất cả quyền được bảo lưu.</p>
        <div className="footer-links">
          <a href="#privacy">Quyền riêng tư</a>
          <span>·</span>
          <a href="#terms">Điều khoản dịch vụ</a>
          <span>·</span>
          <a href="#support">Hỗ trợ</a>
            <ul>
            <li><a href="mailto:support@equinoxracing.com">support@equinoxracing.com</a></li>
            <li><a href="tel:+15551234567">+1 (555) 123-4567</a></li>
            </ul>
        </div>
      </div>
    </footer>
  )
}
