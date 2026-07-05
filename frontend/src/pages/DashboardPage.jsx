import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Trang Dashboard hiển thị thông tin tài khoản Khách hàng & Lịch sử đặt phòng.
 */
export default function DashboardPage() {
  const { user, profile, loading, isAuthenticated, isAdmin, signOut } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const [lastUpdated, setLastUpdated] = useState(null);

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

  const statusConfig = {
    PENDING:   { label: 'Chờ xác nhận', className: 'status-pending' },
    CONFIRMED: { label: 'Đã xác nhận',  className: 'status-confirmed' },
    CANCELLED: { label: 'Đã hủy',       className: 'status-cancelled' },
    COMPLETED: { label: 'Hoàn thành',   className: 'status-completed' },
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
        <div className="dashboard-header">
          <h1>👤 Tài khoản của tôi</h1>
          <p className="dashboard-welcome">
            Xin chào, <strong>{profile?.fullName || user?.email}</strong>!
          </p>
        </div>

        {/* Profile Card */}
        <div className="dashboard-grid">
          <div className="dash-card profile-card">
            <div className="dash-card-header">
              <h2>Thông tin cá nhân</h2>
              <span className="role-badge user">
                {profile?.role || 'USER'}
              </span>
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
                  {profile?.loyaltyTier || 'MEMBER'}
                </span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Điểm thưởng</span>
                <span className="profile-value points">
                  {profile?.loyaltyPoints?.toLocaleString() || 0} điểm
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="dash-card stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <span className="stat-number">
                {bookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED').length}
              </span>
              <span className="stat-label">Chuyến đi sắp tới</span>
            </div>
          </div>
          <div className="dash-card stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <span className="stat-number">
                {bookings.filter(b => b.status === 'COMPLETED').length}
              </span>
              <span className="stat-label">Đã hoàn thành</span>
            </div>
          </div>
        </div>

        {/* Lịch sử đặt phòng */}
        <div className="bookings-section">
          <div className="bookings-section-header">
            <h2>📋 Lịch sử đặt phòng</h2>
            {lastUpdated && (
              <span className="last-updated-hint">
                🔄 Tự động cập nhật · {lastUpdated.toLocaleTimeString('vi-VN')}
              </span>
            )}
          </div>

          {bookingsLoading ? (
            <div className="bookings-loading">
              <div className="spinner"></div>
              <span>Đang tải lịch sử đặt phòng...</span>
            </div>
          ) : bookings.length === 0 ? (
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
              {bookings.map((booking) => {
                const sc = statusConfig[booking.status] || { label: booking.status, className: 'status-pending' };
                return (
                  <div key={booking.bookingId} className="booking-item">
                    <div className="booking-item-left">
                      <div className="booking-room-icon">🏩</div>
                      <div className="booking-item-info">
                        <h3 className="booking-room-name">{booking.roomTypeName}</h3>
                        <p className="booking-hotel-name">📍 {booking.hotelName} — {booking.hotelCity}</p>
                        <p className="booking-dates">
                          📅 {new Date(booking.checkInDate).toLocaleString('vi-VN')}
                          &nbsp;→&nbsp;
                          {new Date(booking.checkOutDate).toLocaleString('vi-VN')}
                          &nbsp;({booking.numNights} đêm)
                        </p>
                        <p className="booking-guests">
                          👥 {booking.numAdults} người lớn
                          {booking.numChildren > 0 && `, ${booking.numChildren} trẻ em`}
                          &nbsp;•&nbsp; Phòng số {booking.roomNumber}
                        </p>
                        {booking.specialRequests && (
                          <p className="booking-requests">💬 {booking.specialRequests}</p>
                        )}
                      </div>
                    </div>
                    <div className="booking-item-right">
                      <span className={`booking-status-badge ${sc.className}`}>{sc.label}</span>
                      <div className="booking-total">
                        {booking.totalAmount?.toLocaleString('vi-VN')} ₫
                      </div>
                      <div className="booking-id">
                        #{booking.bookingId?.slice(0, 8).toUpperCase()}
                      </div>
                    </div>
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
