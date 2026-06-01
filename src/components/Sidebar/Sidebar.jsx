import React from 'react'
import { Link } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        <ul className="sidebar-nav">
          <li className="sidebar-item"><Link to="/horses" className="sidebar-link">Ngựa</Link></li>
          <li className="sidebar-item"><Link to="#" className="sidebar-link">Giải đấu</Link></li>
          <li className="sidebar-item"><Link to="#" className="sidebar-link">Dự đoán</Link></li>
          <li className="sidebar-item"><Link to="#" className="sidebar-link">Xếp hạng</Link></li>
        </ul>
      </nav>
    </aside>
  )
}
