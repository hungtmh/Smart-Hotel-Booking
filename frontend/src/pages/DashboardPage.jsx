import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BANK_CONFIG } from '../components/BookingModal';

/**
 * Trang Dashboard hiển thị thông tin tài khoản Khách hàng & Lịch sử đặt phòng.
 */
export default function DashboardPage() {
  const { user, profile, loading, isAuthenticated, isAdmin, signOut } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const [lastUpdated, setLastUpdated] = useState(null);
  const [payingBookingId, setPayingBookingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [bookingTimeFilter, setBookingTimeFilter] = useState('all');

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      signOut();
    }
  }, [isAuthenticated, isAdmin, signOut]);

  useEffect(() => {
    if (!user || isAdmin) return;

    const fetchBookings = async () => {
      setBookingsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('http://localhost:8080/api/bookings/my', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          setBookings(await res.json());
          setLastUpdated(new Date()); // Ghi thời điểm cập nhật
        }
      } catch (err) {
        console.error('Lỗi khi lấy lịch sử booking:', err);
      } finally {
        setBookingsLoading(false);
      }
    };

    // Gọi ngay lần đầu khi vào trang
    fetchBookings();

    // Tự động gọi lại mỗi 60 giây để cập nhật trạng thái từ cron job Supabase
    const interval = setInterval(fetchBookings, 60000);

    // Dọn dẹp interval khi rời khỏi trang
    return () => clearInterval(interval);
  }, [user, isAdmin]);

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đặt phòng này không?')) return;
    setCancellingId(bookingId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:8080/api/bookings/${bookingId}/cancel`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.bookingId === bookingId ? { ...b, status: 'CANCELLED' } : b));
        setPayingBookingId(null);
      } else {
        const data = await res.json();
        alert(data.message || 'Không thể hủy booking.');
      }
    } catch {
      alert('Lỗi kết nối.');
    } finally {
      setCancellingId(null);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(type);
    setTimeout(() => setCopySuccess(''), 2500);
  };

  const payBooking = async (bookingId) => {
    if (!window.confirm('Xác nhận giả lập thanh toán thành công?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:8080/api/public/payment/confirm/${bookingId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.bookingId === bookingId ? { ...b, status: 'CONFIRMED' } : b));
        setPayingBookingId(null);
        alert('Thanh toán thành công (giả lập)!');
      } else {
        const data = await res.json();
        alert(data.message || 'Không thể thanh toán booking.');
      }
    } catch {
      alert('Lỗi kết nối.');
    }
  };

  const statusConfig = {
    PENDING:   { label: 'Chờ xác nhận', className: 'status-pending' },
    CONFIRMED: { label: 'Đã xác nhận',  className: 'status-confirmed' },
    CANCELLED: { label: 'Đã hủy',       className: 'status-cancelled' },
    COMPLETED: { label: 'Hoàn thành',   className: 'status-completed' },
  };

  const displayName = profile?.fullName || user?.email || 'Khách hàng';
  const avatarInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
  const loyaltyTier = profile?.loyaltyTier || 'MEMBER';
  const loyaltyPoints = profile?.loyaltyPoints || 0;
  const upcomingBookings = bookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED').length;
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
  const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })
    : 'Mới tham gia';
  const filteredBookings = bookings.filter((booking) => {
    if (bookingTimeFilter === 'all') return true;
    const checkIn = new Date(booking.checkInDate);
    const now = new Date();
    if (bookingTimeFilter === 'upcoming') return checkIn >= now;
    if (bookingTimeFilter === 'completed') return booking.status === 'COMPLETED';

    const days = Number(bookingTimeFilter);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    return checkIn >= fromDate;
  });

  const formatBookingDate = (value) => {
    const date = new Date(value);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className="loading-page"><div className="spinner"></div></div>;
  }

  if (!isAuthenticated || isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <section className="dashboard-hero">
          <div className="dashboard-hero-content">
            <div className="profile-avatar" aria-hidden="true">
              {avatarInitials || 'U'}
            </div>
            <div className="dashboard-header">
              <span className="dashboard-eyebrow">Tài khoản thành viên</span>
              <h1>{displayName}</h1>
              <p className="dashboard-welcome">
                Quản lý thông tin cá nhân, điểm thưởng và lịch sử đặt phòng của bạn.
              </p>
              <div className="dashboard-badges">
                <span className={`tier-badge ${(loyaltyTier || 'MEMBER').toLowerCase()}`}>
                  {loyaltyTier}
                </span>
                <span className="role-badge user">{profile?.role || 'USER'}</span>
              </div>
            </div>
          </div>
          <Link to="/search" className="dashboard-hero-action">
            Tìm phòng
          </Link>
        </section>

        <div className="dashboard-grid">
          <div className="dash-card profile-card account-overview-card">
            <div className="dash-card-header">
              <h2>Thông tin cá nhân</h2>
              <span className="account-status-dot">Đã xác thực</span>
            </div>
            <div className="profile-details">
              <div className="profile-row">
                <span className="profile-label">Email</span>
                <span className="profile-value">{user?.email}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Họ tên</span>
                <span className="profile-value">{profile?.fullName || 'Chưa cập nhật'}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Số điện thoại</span>
                <span className="profile-value">{profile?.phoneNumber || 'Chưa cập nhật'}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Hạng thẻ</span>
                <span className={`tier-badge ${(profile?.loyaltyTier || 'MEMBER').toLowerCase()}`}>
                  {loyaltyTier}
                </span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Điểm thưởng</span>
                <span className="profile-value points">
                  {loyaltyPoints.toLocaleString('vi-VN')} điểm
                </span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Thành viên từ</span>
                <span className="profile-value">{memberSince}</span>
              </div>
            </div>
          </div>

          <div className="dash-card stat-card stat-card-primary">
            <div className="stat-icon">↗</div>
            <div className="stat-info">
              <span className="stat-number">{upcomingBookings}</span>
              <span className="stat-label">Chuyến đi sắp tới</span>
            </div>
          </div>
          <div className="dash-card stat-card">
            <div className="stat-icon">✓</div>
            <div className="stat-info">
              <span className="stat-number">{completedBookings}</span>
              <span className="stat-label">Đã hoàn thành</span>
            </div>
          </div>
          <div className="dash-card stat-card">
            <div className="stat-icon">!</div>
            <div className="stat-info">
              <span className="stat-number">{pendingBookings}</span>
              <span className="stat-label">Chờ thanh toán</span>
            </div>
          </div>
        </div>

        {/* Lịch sử đặt phòng */}
        <div className="bookings-section">
          <div className="bookings-section-header">
            <div className="bookings-title-block">
              <h2>Lịch sử đặt phòng <span aria-hidden="true">✦</span></h2>
              <p>Theo dõi và quản lý các đơn đặt phòng của bạn</p>
              {lastUpdated && (
                <span className="last-updated-hint">
                  Tự động cập nhật · {lastUpdated.toLocaleTimeString('vi-VN')}
                </span>
              )}
            </div>
            <label className="booking-filter-control">
              <span aria-hidden="true">▣</span>
              <select
                value={bookingTimeFilter}
                onChange={(e) => setBookingTimeFilter(e.target.value)}
                aria-label="Lọc lịch sử đặt phòng theo thời gian"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="30">30 ngày gần đây</option>
                <option value="90">90 ngày gần đây</option>
                <option value="upcoming">Sắp tới</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </label>
          </div>

          {bookingsLoading ? (
            <div className="bookings-loading">
              <div className="spinner"></div>
              <span>Đang tải lịch sử đặt phòng...</span>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bookings-empty">
              <div className="no-results-icon">🏨</div>
              <h3>Chưa có đặt phòng nào</h3>
              <p>Bạn chưa đặt phòng nào. Hãy khám phá các phòng tuyệt vời của chúng tôi!</p>
              <Link to="/search" className="btn-primary"
                 style={{ textDecoration: 'none', display: 'inline-block', padding: '10px 24px', borderRadius: '8px', marginTop: '8px' }}>
                Tìm phòng ngay
              </Link>
            </div>
          ) : (
            <div className="bookings-list">
              {filteredBookings.map((booking) => {
                const sc = statusConfig[booking.status] || { label: booking.status, className: 'status-pending' };
                const bookingImage = booking.roomImage || booking.hotelImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600';
                return (
                  <div key={booking.bookingId}>
                    <div className="booking-item">
                      <div className="booking-item-left">
                        <div className="booking-room-image-wrapper">
                          <img
                            src={bookingImage}
                            alt={booking.hotelName || booking.roomTypeName}
                            className="booking-room-image"
                            loading="lazy"
                          />
                        </div>
                        <div className="booking-item-info">
                          <div className="booking-title-row">
                            <h3 className="booking-room-name">{booking.roomTypeName}</h3>
                            <span className="booking-room-number">Phòng {booking.roomNumber}</span>
                          </div>
                          <p className="booking-hotel-name">{booking.hotelName} — {booking.hotelCity}</p>
                          {booking.roomDescription && (
                            <p className="booking-room-desc">{booking.roomDescription}</p>
                          )}
                          <div className="booking-meta-grid">
                            <span className="booking-meta-item">
                              <span className="booking-meta-icon" aria-hidden="true">▣</span>
                              <strong>Nhận phòng</strong>
                              {formatBookingDate(booking.checkInDate)}
                            </span>
                            <span className="booking-meta-item">
                              <span className="booking-meta-icon" aria-hidden="true">▦</span>
                              <strong>Trả phòng</strong>
                              {formatBookingDate(booking.checkOutDate)}
                            </span>
                            <span className="booking-meta-item">
                              <span className="booking-meta-icon" aria-hidden="true">◷</span>
                              <strong>Thời gian</strong>
                              {booking.numNights} đêm
                            </span>
                            <span className="booking-meta-item">
                              <span className="booking-meta-icon" aria-hidden="true">♙</span>
                              <strong>Khách</strong>
                              {booking.numAdults} người lớn{booking.numChildren > 0 && `, ${booking.numChildren} trẻ em`}
                            </span>
                          </div>
                          <div className="booking-room-specs">
                            {booking.areaSqm && <span>{booking.areaSqm} m²</span>}
                            {(booking.capacityAdults || booking.capacityChildren) && (
                              <span>
                                Tối đa {booking.capacityAdults || 0} NL
                                {booking.capacityChildren > 0 && ` + ${booking.capacityChildren} TE`}
                              </span>
                            )}
                            {booking.roomBasePrice && (
                              <span>{booking.roomBasePrice.toLocaleString('vi-VN')} ₫/đêm</span>
                            )}
                          </div>
                          {booking.specialRequests && (
                            <p className="booking-requests">Ghi chú: {booking.specialRequests}</p>
                          )}
                        </div>
                      </div>
                      <div className="booking-item-right">
                        <span className={`booking-status-badge ${sc.className}`}>{sc.label}</span>
                        <div className="booking-total">
                          {booking.totalAmount?.toLocaleString('vi-VN')} ₫
                        </div>
                        <div className="booking-id">
                          Mã #{booking.bookingId?.slice(0, 8).toUpperCase()}
                        </div>
                        {booking.status === 'PENDING' && (
                          <div className="booking-actions">
                            <button
                              onClick={() => setPayingBookingId(payingBookingId === booking.bookingId ? null : booking.bookingId)}
                              className="booking-pay-button"
                            >
                              Thanh toán
                            </button>
                            <button
                              onClick={() => cancelBooking(booking.bookingId)}
                              disabled={cancellingId === booking.bookingId}
                              className="booking-cancel-button"
                            >
                              {cancellingId === booking.bookingId ? 'Đang hủy...' : 'Hủy'}
                            </button>
                          </div>
                        )}
                        {booking.status !== 'PENDING' && (
                          <div className="booking-actions">
                            <button
                              type="button"
                              className="booking-detail-button"
                              onClick={() => alert(`Mã đặt phòng: ${booking.bookingId}\nPhòng: ${booking.roomTypeName}\nKhách sạn: ${booking.hotelName}`)}
                            >
                              Xem chi tiết
                            </button>
                            <Link to="/search" className="booking-rebook-button">
                              Đặt lại
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  {/* QR Payment panel inline */}
                  {booking.status === 'PENDING' && payingBookingId === booking.bookingId && (
                    <div style={{ marginTop: '12px', padding: '16px', background: 'rgba(99,102,241,0.08)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.25)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#a5b4fc', fontWeight: 600 }}>
                          Quét mã QR bên dưới để thanh toán và xác nhận đặt phòng
                        </p>
                        <button onClick={() => payBooking(booking.bookingId)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#10b981', color: 'white', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                          Bypass Thanh Toán
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <img
                          src={`https://qr.sepay.vn/img?acc=${BANK_CONFIG.ACCOUNT_NO}&bank=${BANK_CONFIG.BANK_ID}&amount=${booking.totalAmount}&des=PAY%20${booking.bookingId?.slice(0, 8).toUpperCase()}`}
                          alt="VietQR"
                          style={{ width: '160px', height: '160px', borderRadius: '10px', border: '2px solid rgba(99,102,241,0.4)' }}
                        />
                        <div style={{ fontSize: '13px', lineHeight: 1.9, color: '#cbd5e1' }}>
                          <div><span style={{ color: '#94a3b8' }}>Ngân hàng:</span> <strong style={{ color: '#e2e8f0' }}>{BANK_CONFIG.BANK_NAME}</strong></div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#94a3b8' }}>STK:</span>
                            <strong style={{ color: '#e2e8f0' }}>{BANK_CONFIG.ACCOUNT_NO}</strong>
                            <button onClick={() => copyToClipboard(BANK_CONFIG.ACCOUNT_NO, 'acc_' + booking.bookingId)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: '11px', cursor: 'pointer' }}>
                              {copySuccess === 'acc_' + booking.bookingId ? '✓ Đã chép' : 'Copy'}
                            </button>
                          </div>
                          <div><span style={{ color: '#94a3b8' }}>Chủ TK:</span> <strong style={{ color: '#e2e8f0' }}>{BANK_CONFIG.ACCOUNT_NAME}</strong></div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#94a3b8' }}>Số tiền:</span>
                            <strong style={{ color: '#34d399', fontSize: '15px' }}>{booking.totalAmount?.toLocaleString('vi-VN')} ₫</strong>
                            <button onClick={() => copyToClipboard(String(booking.totalAmount), 'amt_' + booking.bookingId)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: '11px', cursor: 'pointer' }}>
                              {copySuccess === 'amt_' + booking.bookingId ? '✓ Đã chép' : 'Copy'}
                            </button>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#94a3b8' }}>Nội dung:</span>
                            <strong style={{ color: '#e2e8f0' }}>PAY {booking.bookingId?.slice(0, 8).toUpperCase()}</strong>
                            <button onClick={() => copyToClipboard(`PAY ${booking.bookingId?.slice(0, 8).toUpperCase()}`, 'desc_' + booking.bookingId)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: '11px', cursor: 'pointer' }}>
                              {copySuccess === 'desc_' + booking.bookingId ? '✓ Đã chép' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
