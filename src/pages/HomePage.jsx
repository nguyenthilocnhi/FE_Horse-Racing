import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/home.css";

const NAV_LINKS = [
  { href: "#home", label: "Trang chủ" },
  { href: "#featured-tournament", label: "Giải đấu" },
  { href: "#top-horses", label: "Ngựa" },
  { href: "#top-jockeys", label: "Kỵ sĩ" },
  { href: "#platform", label: "Nền tảng" },
];

const HERO_STATS = [
  { value: "48+", label: "Giải đấu/năm" },
  { value: "1.2K", label: "Ngựa đua" },
  { value: "320+", label: "Kỵ sĩ" },
  { value: "98%", label: "Hài lòng" },
];



const TOP_HORSES = [
  {
    rank: 1,
    name: "Aurelius",
    meta: "5 tuổi • 12 chiến thắng • Chuyên gia nước rút",
    img: "/images/horse-1.png",
  },
  {
    rank: 2,
    name: "Midnight Star",
    meta: "4 tuổi • 9 chiến thắng • Chuyên gia mọi điều kiện",
    img: "/images/horse-2.png",
  },
  {
    rank: 3,
    name: "Velvet Thunder",
    meta: "6 tuổi • 15 chiến thắng • Nhà vô địch cự ly dài",
    img: "/images/horse-3.png",
  },
];

const TOP_JOCKEYS = [
  {
    rank: 1,
    name: "L. Anderson",
    meta: "320 chiến thắng • Bậc thầy chính xác",
    img: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=60",
  },
  {
    rank: 2,
    name: "M. Rodriguez",
    meta: "289 chiến thắng • Kỵ sĩ chiến thuật",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=60",
  },
  {
    rank: 3,
    name: "S. Nakamura",
    meta: "270 chiến thắng • Chiến lược gia đường đua",
    img: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=400&q=60",
  },
];

const PLATFORM_FEATURES = [
  {
    icon: "◈",
    title: "Quản lý giải đấu",
    desc: "Lập lịch, đăng ký và theo dõi sự kiện trên một bảng điều khiển thống nhất.",
  },
  {
    icon: "◎",
    title: "Phân tích hiệu suất",
    desc: "Thống kê thời gian, phong độ và lịch sử thi đấu theo thời gian thực.",
  },
  {
    icon: "◆",
    title: "Dự đoán thông minh",
    desc: "Công cụ hỗ trợ quyết định dựa trên dữ liệu lịch sử và xu hướng mùa giải.",
  },
];

function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const hugeTextRef = useRef(null);

  const featuredTournament = {
    title: "Cúp Vàng Hoàng Gia 2026",
    location: "Ascot Grand Arena",
    dateMeta: "12 Tháng 9, 2026 • Ascot Grand Arena • Giải thưởng 1,2 triệu USD",
    desc: "Sự kiện đua thượng hạng nơi các trang trại hàng đầu tranh tài trên sân cỏ và đường tổng hợp. Theo dõi thời gian trực tiếp, danh sách kỵ sĩ và phân tích chuyên sâu.",
    highlights: ["24 đội tham gia", "Phát sóng trực tiếp HD", "Khu VIP & hospitality"]
  };

  useScrollReveal();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!hugeTextRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      hugeTextRef.current.style.transform =
        `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="home-page">
      <div className="home-bg">
        <img
          src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=2000&q=80"
          alt="Ngựa trắng đang phi"
        />
        <div className="hero-overlay" />
      </div>

      <div className="huge-text" ref={hugeTextRef}>
        HORSE
      </div>

      <header className={`home-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="home-header-inner">
          <Link to="/" className="home-logo">
            <span className="horse-icon">♞</span>
            <span>Horse Racing</span>
          </Link>

          <nav className={`home-nav ${menuOpen ? "is-open" : ""}`}>
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="auth-buttons">
            <Link to="/login" className="login-btn">
              Đăng nhập
            </Link>
            <Link to="/register" className="register-btn">
              Đăng ký
            </Link>
          </div>

          <button
            type="button"
            className={`menu-toggle ${menuOpen ? "is-open" : ""}`}
            aria-label="Mở menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main id="home" className="home-main">
        <div className="hero-tags">
          <span>Sức mạnh</span>
          <span>•</span>
          <span>Thanh lịch</span>
          <span>•</span>
          <span>Tốc độ</span>
        </div>

        <section className="hero-content fade-in">
          <span className="hero-label">Quản lý Giải đấu Cao cấp</span>
          <h1>
            Dẫn đầu cuộc đua
            <br />
            <em>đem lại chiến thắng</em>
          </h1>
          <p>
            Nền tảng quản lý giải đua ngựa hàng đầu cho ban tổ chức, huấn luyện viên,
            kỵ sĩ và người hâm mộ — tất cả trong một giao diện sang trọng, chính xác và hiện đại.
          </p>
          <div className="hero-actions">
            <a href="#featured-tournament" className="gold-btn">
              Khám phá Giải đấu
            </a>
          </div>
        </section>

        <div className="hero-stats fade-in-delay">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="hero-stat">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </main>

      <div className="home-sections">
        <section
          id="featured-tournament"
          className="section featured-tournament reveal"
        >
          <div className="home-container">
            <div className="section-header">
              <span className="section-eyebrow">Sự kiện trọng điểm</span>
              <h2>Giải đấu nổi bật</h2>
              <p className="sub">
                Sự kiện ngọc quý của mùa giải — nơi tinh hoa đua ngựa hội tụ
              </p>
            </div>

            <div className="featured-grid">
              <div className="featured-image">
                <img
                  src="/images/featured-tournament.png"
                  alt={`${featuredTournament.title} — ngựa đua trên đường đua`}
                />
                <div className="featured-image-overlay" />
                <span className="featured-badge">Trực tiếp 2026</span>
                <div className="featured-image-caption">
                  <span>{featuredTournament.location}</span>
                  <strong>{featuredTournament.title}</strong>
                </div>
              </div>
              <div className="featured-body">
                <h3>{featuredTournament.title}</h3>
                <p className="meta">
                  {featuredTournament.dateMeta}
                </p>
                <p className="desc">
                  {featuredTournament.desc}
                </p>
                <ul className="featured-highlights">
                  {featuredTournament.highlights.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>



        <section id="top-horses" className="section top-horses reveal">
          <div className="home-container">
            <div className="section-header">
              <span className="section-eyebrow">Bảng xếp hạng</span>
              <h2>Ngựa hàng đầu</h2>
              <p className="sub">Những ứng cử viên mạnh nhất mùa giải</p>
            </div>

            <div className="horses-grid">
              {TOP_HORSES.map((horse) => (
                <article key={horse.name} className="horse-card">
                  <div className="horse-thumb">
                    <img src={horse.img} alt={horse.name} />
                    <span className="rank-badge">#{horse.rank}</span>
                  </div>
                  <div className="horse-body">
                    <h4>{horse.name}</h4>
                    <p>{horse.meta}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="top-jockeys" className="section top-jockeys reveal">
          <div className="home-container">
            <div className="section-header">
              <span className="section-eyebrow">Elite riders</span>
              <h2>Kỵ sĩ hàng đầu</h2>
              <p className="sub">Những kỵ sĩ quyết định kết quả từng chặng đua</p>
            </div>

            <div className="jockeys-list">
              {TOP_JOCKEYS.map((jockey) => (
                <article key={jockey.name} className="jockey-card">
                  <span className="jockey-rank">#{jockey.rank}</span>
                  <img
                    src={jockey.img}
                    alt={jockey.name}
                    className="jockey-avatar"
                  />
                  <div className="jockey-info">
                    <h4>{jockey.name}</h4>
                    <p>{jockey.meta}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="platform" className="section platform-section reveal">
          <div className="home-container">
            <div className="section-header section-header--center">
              <span className="section-eyebrow">Tại sao chọn Horse Racing</span>
              <h2>Nền tảng toàn diện cho đua ngựa</h2>
              <p className="sub">
                Công nghệ hiện đại kết hợp trải nghiệm cao cấp — từ ban tổ chức đến người hâm mộ
              </p>
            </div>

            <div className="features-grid">
              {PLATFORM_FEATURES.map((feature) => (
                <article key={feature.title} className="feature-card">
                  <span className="feature-icon">{feature.icon}</span>
                  <h4>{feature.title}</h4>
                  <p>{feature.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section cta-section reveal">
          <div className="home-container">
            <div className="cta-banner">
              <div className="cta-banner-content">
                <span className="section-eyebrow">Bắt đầu ngay</span>
                <h2>Sẵn sàng dẫn đầu mùa giải mới?</h2>
                <p>
                  Tạo tài khoản miễn phí để quản lý giải đấu, theo dõi ngựa đua
                  và truy cập phân tích chuyên sâu.
                </p>
              </div>
              <div className="cta-banner-actions">
                <Link to="/register" className="gold-btn">
                  Đăng ký miễn phí
                </Link>
                <Link to="/login" className="outline-btn">
                  Đăng nhập
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="home-footer">
        <div className="home-container">
          <div className="footer-top">
            <div className="footer-brand">
              <span className="horse-icon">♞</span>
              <div>
                <h3>Horse Racing</h3>
                <p>
                  Nền tảng quản lý và điều hành giải đua ngựa chuyên nghiệp. Cung cấp giải pháp số hóa toàn diện từ ban tổ chức đến chủ ngựa, kỵ sĩ, trọng tài và khán giả.
                </p>
              </div>
            </div>

            <div className="footer-links">
              <h4>Khám phá</h4>
              <a href="#featured-tournament">Giải đấu nổi bật</a>
              <a href="#top-horses">Ngựa hàng đầu</a>
              <a href="#top-jockeys">Kỵ sĩ hàng đầu</a>
            </div>

            <div className="footer-contact">
              <h4>Thông tin liên hệ</h4>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📧</span> <a href="mailto:support@horseracing.com" style={{ color: 'inherit', textDecoration: 'none' }}>support@horseracing.com</a>
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📞</span> <a href="tel:+84123456789" style={{ color: 'inherit', textDecoration: 'none' }}>+84 123 456 789</a>
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📍</span> <span>TP. Hồ Chí Minh, Việt Nam</span>
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontSize: '13px', marginTop: '6px' }}>
                <span>●</span> <span>Hệ thống trực tuyến 24/7</span>
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Horse Racing Management System. Bảo lưu mọi quyền.</p>
            <p>Giải pháp công nghệ điều hành đua ngựa tiêu chuẩn quốc tế.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

