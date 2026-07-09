import { Link, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  if (isAuthenticated && !isAdmin) {
    return <Navigate to="/search" replace />;
  }

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic',
      offset: 100,
    });

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing">
      {/* === HERO SECTION === */}
      <section className="hero-section">
        <div className="hero-bg" style={{ backgroundImage: "url('/hero.png')" }}></div>
        <div className="hero-overlay-gradient"></div>
        <div className="hero-content" data-aos="fade-up">
          <div className="hero-badge-premium" data-aos="fade-down" data-aos-delay="200">
            <span className="star-icon">★</span> 5-Star Luxury Experience
          </div>
          <h1 className="hero-title" data-aos="zoom-in" data-aos-delay="400">
            Nơi Đẳng Cấp <br/><span className="hero-highlight">Hội Tụ</span>
          </h1>
          <p className="hero-subtitle" data-aos="fade-up" data-aos-delay="600">
            Khám phá kỷ nguyên mới của sự xa hoa. Từ kiến trúc tinh tế đến dịch vụ đặc quyền, Smart Hotel mang đến trải nghiệm lưu trú vượt xa mọi kỳ vọng của bạn.
          </p>
          <div className="hero-actions" data-aos="fade-up" data-aos-delay="800">
            <Link to="/search" className="btn-primary btn-glow">Khám Phá Phòng</Link>
            <Link to="/register" className="btn-secondary btn-glass">Trở Thành Hội Viên</Link>
          </div>
        </div>
      </section>

      {/* === QUICK SEARCH BAR OVERLAY === */}
      <section className="quick-search-wrapper" data-aos="fade-up" data-aos-delay="1000">
        <div className="quick-search-glass">
          <div className="qs-input-group">
            <label>Điểm đến</label>
            <input type="text" placeholder="Thành phố, khách sạn..." />
          </div>
          <div className="qs-divider"></div>
          <div className="qs-input-group">
            <label>Nhận phòng - Trả phòng</label>
            <input type="text" placeholder="Chọn ngày..." />
          </div>
          <div className="qs-divider"></div>
          <div className="qs-input-group">
            <label>Khách</label>
            <input type="text" placeholder="2 Người lớn, 0 Trẻ em" />
          </div>
          <button className="btn-primary qs-btn">Tìm Kiếm</button>
        </div>
      </section>

      {/* === ABOUT US SECTION === */}
      <section className="about-section">
        <div className="about-grid">
          <div className="about-text" data-aos="fade-right">
            <h2 className="section-title">Triết Lý Của Sự <span className="text-gold">Hoàn Mỹ</span></h2>
            <p className="about-desc">
              Được thành lập với tầm nhìn tái định nghĩa sự sang trọng, Smart Hotel không chỉ là một nơi để lưu trú, mà là một điểm đến của nghệ thuật sống. Chúng tôi kết hợp kiến trúc đương đại với vẻ đẹp thiên nhiên, tạo nên những kiệt tác không gian vô song.
            </p>
            <p className="about-desc">
              Mỗi chi tiết tại khách sạn đều được chăm chút tỉ mỉ bởi các chuyên gia hàng đầu. Từ hương thơm đặc trưng tại sảnh chờ, đến công nghệ AI thông minh trong mỗi phòng nghỉ, tất cả nhằm mang đến sự thoải mái tuyệt đối cho những vị khách trân quý.
            </p>
            <Link to="/search" className="btn-outline-gold">Tìm Hiểu Thêm</Link>
          </div>
          <div className="about-image-wrapper" data-aos="fade-left">
            <img src="/lobby.png" alt="Luxury Lobby" className="about-img" />
            <div className="about-img-backdrop"></div>
          </div>
        </div>
      </section>

      {/* === AMENITIES SECTION === */}
      <section className="features-section" id="features">
        <div className="section-header-center" data-aos="fade-up">
          <h2 className="section-title">Đặc Quyền Thượng Lưu</h2>
          <p className="section-desc">Trải nghiệm những tiện ích đỉnh cao được thiết kế riêng cho bạn</p>
        </div>
        <div className="features-grid premium-grid">
          <div className="feature-card premium-image-card" data-aos="fade-up" data-aos-delay="100">
            <img src="/amenity_pool.png" alt="Hồ Bơi Vô Cực Trên Mây" className="premium-card-bg" />
            <div className="premium-card-overlay"></div>
            <div className="premium-card-content">
              <h3>Hồ Bơi Vô Cực Trên Mây</h3>
              <p>Đắm mình trong làn nước mát lạnh tại tầm cao 150m với view bao trọn thành phố lộng lẫy về đêm.</p>
            </div>
          </div>
          <div className="feature-card premium-image-card" data-aos="fade-up" data-aos-delay="200">
            <img src="/amenity_dining.png" alt="Ẩm Thực Michelin" className="premium-card-bg" />
            <div className="premium-card-overlay"></div>
            <div className="premium-card-content">
              <h3>Ẩm Thực Michelin</h3>
              <p>Hành trình vị giác đỉnh cao với thực đơn được thiết kế bởi các siêu đầu bếp quốc tế đạt sao Michelin.</p>
            </div>
          </div>
          <div className="feature-card premium-image-card" data-aos="fade-up" data-aos-delay="300">
            <img src="/amenity_spa.png" alt="Oasis Spa & Wellness" className="premium-card-bg" />
            <div className="premium-card-overlay"></div>
            <div className="premium-card-content">
              <h3>Oasis Spa & Wellness</h3>
              <p>Phục hồi năng lượng với các liệu pháp thiên nhiên bí truyền và trang thiết bị thư giãn tân tiến nhất.</p>
            </div>
          </div>
          <div className="feature-card premium-image-card" data-aos="fade-up" data-aos-delay="400">
            <img src="/amenity_smartroom.png" alt="Smart AI Room" className="premium-card-bg" />
            <div className="premium-card-overlay"></div>
            <div className="premium-card-content">
              <h3>Smart AI Room</h3>
              <p>Điều khiển ánh sáng, nhiệt độ, rèm cửa và giải trí chỉ bằng giọng nói với quản gia ảo tích hợp sẵn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* === ROOMS PREVIEW SECTION === */}
      <section className="rooms-section" id="rooms">
        <div className="section-header-center" data-aos="fade-up">
          <h2 className="section-title">Không Gian Nghỉ Dưỡng</h2>
          <p className="section-desc">Mỗi căn phòng là một tác phẩm nghệ thuật tôn vinh sự riêng tư</p>
        </div>
        <div className="rooms-grid">
          <div className="room-card premium-room-card" data-aos="fade-up" data-aos-delay="100">
            <div className="room-img-wrapper">
              <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600" alt="Deluxe Ocean View" loading="lazy" />
              <div className="room-overlay-grad"></div>
              <span className="room-price-tag">Từ 2.500.000₫ / đêm</span>
            </div>
            <div className="room-info">
              <h3>Deluxe Ocean View</h3>
              <p className="room-spec">Ban công hướng biển • 45m² • 2 người lớn</p>
              <div className="room-amenities">
                <span>Khóa Smart</span><span>Bồn tắm</span><span>Minibar</span>
              </div>
              <button className="btn-room-book">Đặt Phòng Này</button>
            </div>
          </div>
          <div className="room-card premium-room-card" data-aos="fade-up" data-aos-delay="200">
            <div className="room-img-wrapper">
              <img src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600" alt="Executive Suite" loading="lazy" />
              <div className="room-overlay-grad"></div>
              <span className="room-price-tag">Từ 4.800.000₫ / đêm</span>
            </div>
            <div className="room-info">
              <h3>Executive Suite</h3>
              <p className="room-spec">Phòng khách sang trọng • 75m² • Tầm nhìn Panorama</p>
              <div className="room-amenities">
                <span>Lounge Access</span><span>Jacuzzi</span><span>Ăn sáng</span>
              </div>
              <button className="btn-room-book">Đặt Phòng Này</button>
            </div>
          </div>
          <div className="room-card premium-room-card" data-aos="fade-up" data-aos-delay="300">
            <div className="room-img-wrapper">
              <img src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600" alt="Presidential Suite" loading="lazy" />
              <div className="room-overlay-grad"></div>
              <span className="room-price-tag">Từ 15.000.000₫ / đêm</span>
            </div>
            <div className="room-info">
              <h3>Presidential Villa</h3>
              <p className="room-spec">Biệt thự độc lập • 250m² • Hồ bơi vô cực riêng</p>
              <div className="room-amenities">
                <span>Quản gia 24/7</span><span>Xe đưa đón</span><span>Chef riêng</span>
              </div>
              <button className="btn-room-book">Đặt Phòng Này</button>
            </div>
          </div>
        </div>
        <div className="view-all-wrapper" data-aos="zoom-in" data-aos-delay="400">
          <Link to="/search" className="btn-outline-gold btn-large">Xem Toàn Bộ Hệ Thống Phòng</Link>
        </div>
      </section>

      {/* === TESTIMONIALS SECTION === */}
      <section className="testimonials-section">
        <div className="testimonials-bg"></div>
        <div className="testimonials-content">
          <h2 className="section-title" data-aos="fade-up">Đánh Giá Từ Thượng Khách</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card" data-aos="fade-right" data-aos-delay="200">
              <div className="quote-icon">"</div>
              <p className="testimonial-text">Kỳ nghỉ tuyệt vời nhất tôi từng trải qua. Dịch vụ hoàn hảo, phòng nghỉ lộng lẫy và ẩm thực không chê vào đâu được. Chắc chắn tôi sẽ quay lại.</p>
              <div className="testimonial-author">
                <div className="author-avatar" style={{backgroundImage: 'url(https://randomuser.me/api/portraits/women/44.jpg)'}}></div>
                <div className="author-info">
                  <h4>Nguyễn Thu Hà</h4>
                  <span>CEO, TechVision</span>
                </div>
              </div>
            </div>
            <div className="testimonial-card" data-aos="fade-left" data-aos-delay="400">
              <div className="quote-icon">"</div>
              <p className="testimonial-text">Ấn tượng mạnh mẽ với công nghệ Smart Room. Khách sạn thực sự tiên phong trong việc mang lại tiện nghi bằng AI mà vẫn giữ được sự riêng tư tuyệt đối.</p>
              <div className="testimonial-author">
                <div className="author-avatar" style={{backgroundImage: 'url(https://randomuser.me/api/portraits/men/32.jpg)'}}></div>
                <div className="author-info">
                  <h4>Trần Minh Dũng</h4>
                  <span>Travel Blogger</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === CTA SECTION === */}
      <section className="cta-section premium-cta">
        <div className="cta-content" data-aos="zoom-in">
          <h2>Đánh Thức Giác Quan Cùng Smart Hotel</h2>
          <p>Trở thành hội viên Elite ngay hôm nay để nhận ưu đãi giảm 20% cho đêm nghỉ đầu tiên, cùng hàng ngàn đặc quyền bất tận.</p>
          <Link to="/register" className="btn-primary btn-large btn-glow">
            Mở Khóa Đặc Quyền
          </Link>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="landing-footer premium-footer">
        <div className="footer-top" data-aos="fade-up">
          <div className="footer-brand-col">
            <div className="footer-logo-premium">
              <span className="logo-icon">M</span>
              <span className="logo-text">SMART HOTEL</span>
            </div>
            <p className="footer-slogan">Nghệ thuật của sự hiếu khách xa hoa.</p>
            <div className="social-links">
              <span>Fb</span> <span>Ig</span> <span>Tw</span> <span>Yt</span>
            </div>
          </div>
          <div className="footer-links-col">
            <h4>Khám Phá</h4>
            <Link to="/search">Phòng & Suites</Link>
            <a href="#features">Tiện Ích</a>
            <a href="#">Ẩm Thực</a>
            <a href="#">Spa & Wellness</a>
          </div>
          <div className="footer-links-col">
            <h4>Thành Viên</h4>
            <Link to="/login">Đăng Nhập</Link>
            <Link to="/register">Đăng Ký Elite</Link>
            <a href="#">Lợi Ích Cấp Bậc</a>
          </div>
          <div className="footer-contact-col">
            <h4>Liên Hệ</h4>
            <p>123 Đại Lộ Ánh Sáng, Quận 1, TP.HCM</p>
            <p>contact@smarthotel.com</p>
            <p>+84 1800 9999</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Smart Hotel & Resort. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#">Điều khoản sử dụng</a>
            <a href="#">Chính sách bảo mật</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
