import React from 'react'
import { Link } from 'react-router-dom'

export default function Header({ scrollActive }) {
  return (
    <header className={`home-header ${scrollActive ? 'home-header--scrolled' : ''}`}>
      <div className="home-header__brand">Đua Ngựa Cao Cấp</div>
      <nav className="home-nav">
        <a href="#home">Trang chủ</a>
        <a href="#about">Giới thiệu</a>
        <a href="#tournaments">Giải đấu</a>
        <a href="#horses">Ngựa</a>
        <a href="#rankings">Xếp hạng</a>
        <a href="#predictions">Dự đoán</a>
      </nav>
      <div className="home-actions">
        <Link to="/login" className="btn btn--solid">Đăng nhập</Link>
        <Link to="/register" className="btn btn--solid">Đăng ký</Link>
      </div>
    </header>
  )
}
