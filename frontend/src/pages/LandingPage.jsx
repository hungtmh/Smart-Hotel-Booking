import { Link } from 'react-router-dom';

/**
 * Trang Landing Page cao cap the hien thuong hieu khach san.
 * Bao gom: Hero Section, Diem noi bat, Loai phong, Footer.
 */
export default function LandingPage() {
  return (
    <div className="landing">
      {/* === HERO SECTION === */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="hero-badge">&#9733; Trải nghiệm đẳng cấp 5 sao</span>
          <h1 className="hero-title">
            Khám Phá <span className="hero-highlight">Kỳ Nghỉ</span> Trong Mơ
          </h1>
          <p className="hero-subtitle">
            Đắm mình trong không gian sang trọng với hồ bơi vô cực hướng biển,
            spa cao cấp và ẩm thực quốc tế tại Marriott Smart Resort.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn-primary">Đặt phòng ngay</Link>
            <a href="#rooms" className="btn-secondary">Xem phòng</a>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Phòng sang trọng</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Điểm đến</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">98%</span>
              <span className="stat-label">Khách hài lòng</span>
            </div>
          </div>
        </div>
      </section>

      {/* === FEATURES SECTION === */}
      <section className="features-section" id="features">
        <h2 className="section-title">Tại sao chọn chúng tôi?</h2>
        <p className="section-desc">Trải nghiệm dịch vụ đẳng cấp thế giới với công nghệ AI tiên tiến</p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>Trợ lý AI 24/7</h3>
            <p>Chatbot thông minh hỗ trợ đặt phòng, trả lời thắc mắc và gọi dịch vụ phòng chỉ bằng một tin nhắn.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Tìm kiếm thông minh</h3>
            <p>Mô tả phòng mơ ước bằng ngôn ngữ tự nhiên, AI sẽ tìm đúng phòng phù hợp nhất cho bạn.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Chương trình thành viên</h3>
            <p>Tích lũy điểm thưởng mỗi lần đặt phòng. Đổi điểm lấy ưu đãi độc quyền và nâng hạng thẻ.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Thanh toán an toàn</h3>
            <p>Hỗ trợ Stripe, MOMO, VNPAY. Mã hóa dữ liệu SSL và bảo mật thông tin khách hàng tuyệt đối.</p>
          </div>
        </div>
      </section>

      {/* === ROOMS PREVIEW SECTION === */}
      <section className="rooms-section" id="rooms">
        <h2 className="section-title">Phòng nghỉ nổi bật</h2>
        <p className="section-desc">Lựa chọn không gian hoàn hảo cho kỳ nghỉ của bạn</p>
        <div className="rooms-grid">
          <div className="room-card">
            <div className="room-img-wrapper">
              <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600" alt="Deluxe Ocean View" loading="lazy" />
              <span className="room-price-tag">2.500.000₫ / đêm</span>
            </div>
            <div className="room-info">
              <h3>Deluxe Ocean View</h3>
              <p>Ban công hướng biển • 35m² • 2 người lớn</p>
              <div className="room-amenities">
                <span>WiFi</span><span>Minibar</span><span>Két sắt</span>
              </div>
            </div>
          </div>
          <div className="room-card">
            <div className="room-img-wrapper">
              <img src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600" alt="Executive Suite" loading="lazy" />
              <span className="room-price-tag">4.800.000₫ / đêm</span>
            </div>
            <div className="room-info">
              <h3>Executive Suite</h3>
              <p>Phòng khách riêng • 65m² • Jacuzzi</p>
              <div className="room-amenities">
                <span>WiFi</span><span>Jacuzzi</span><span>Bữa sáng</span>
              </div>
            </div>
          </div>
          <div className="room-card">
            <div className="room-img-wrapper">
              <img src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600" alt="Presidential Suite" loading="lazy" />
              <span className="room-price-tag">12.000.000₫ / đêm</span>
            </div>
            <div className="room-info">
              <h3>Presidential Suite</h3>
              <p>Bể bơi riêng • 120m² • Quản gia 24/7</p>
              <div className="room-amenities">
                <span>Bể bơi</span><span>Quản gia</span><span>Bose Audio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === CTA SECTION === */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Sẵn sàng cho kỳ nghỉ tiếp theo?</h2>
          <p>Đăng ký ngay để nhận ưu đãi giảm 15% cho lần đặt phòng đầu tiên</p>
          <Link to="/register" className="btn-primary btn-large">
            Đăng ký miễn phí
          </Link>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">M</span>
            <span>Smart Marriott Booking</span>
          </div>
          <div className="footer-links">
            <a href="#features">Tính năng</a>
            <a href="#rooms">Phòng nghỉ</a>
            <Link to="/login">Đăng nhập</Link>
          </div>
          <p className="footer-copy">&copy; 2026 Smart Hotel Booking. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
