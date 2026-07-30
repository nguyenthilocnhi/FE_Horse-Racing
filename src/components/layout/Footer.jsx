import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer-section">
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Horse Racing. Tất cả quyền được bảo lưu.</p>
        <div className="footer-links">
          <a href="#privacy">Quyền riêng tư</a>
          <span>·</span>
          <a href="#terms">Điều khoản dịch vụ</a>
          <span>·</span>
          <a href="#support">Hỗ trợ</a>
            <ul>
            <li><a href="mailto:support@horseracing.com">support@horseracing.com</a></li>
            <li><a href="tel:+84123456789">+84 123 456 789</a></li>
            </ul>
        </div>
      </div>
    </footer>
  )
}
