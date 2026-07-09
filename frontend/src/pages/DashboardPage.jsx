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
    } catch (err) {
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
                  <div key={booking.bookingId}>
                    <div className="booking-item">
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
                      {booking.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => setPayingBookingId(payingBookingId === booking.bookingId ? null : booking.bookingId)}
                            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            💳 Thanh toán
                          </button>
                          <button
                            onClick={() => cancelBooking(booking.bookingId)}
                            disabled={cancellingId === booking.bookingId}
                            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 600, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            {cancellingId === booking.bookingId ? 'Đang hủy...' : '❌ Hủy'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* QR Payment panel inline */}
                  {booking.status === 'PENDING' && payingBookingId === booking.bookingId && (
                    <div style={{ marginTop: '12px', padding: '16px', background: 'rgba(99,102,241,0.08)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.25)' }}>
                      <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#a5b4fc', fontWeight: 600 }}>
                        ⚠️ Quét mã QR bên dưới để thanh toán và xác nhận đặt phòng
                      </p>
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
