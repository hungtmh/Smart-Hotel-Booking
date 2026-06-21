import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

/**
 * Trang Dashboard hien thi sau khi dang nhap.
 * Phan biet noi dung theo role: Admin thay bang dieu khien, User thay thong tin ca nhan.
 */
export default function DashboardPage() {
  const { user, profile, loading, isAdmin, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="loading-page"><div className="spinner"></div></div>;
  }

  // Chuyen huong ve trang dang nhap neu chua xac thuc
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>
            {isAdmin ? '🛡️ Bảng điều khiển Admin' : '👤 Tài khoản của tôi'}
          </h1>
          <p className="dashboard-welcome">
            Xin chào, <strong>{profile?.fullName || user?.email}</strong>!
          </p>
        </div>

        {/* Profile Card */}
        <div className="dashboard-grid">
          <div className="dash-card profile-card">
            <div className="dash-card-header">
              <h2>Thông tin cá nhân</h2>
              <span className={`role-badge ${isAdmin ? 'admin' : 'user'}`}>
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

          {/* Quick Stats / Actions */}
          {isAdmin ? (
            <>
              <div className="dash-card stat-card">
                <div className="stat-icon">🏨</div>
                <div className="stat-info">
                  <span className="stat-number">1</span>
                  <span className="stat-label">Khách sạn</span>
                </div>
              </div>
              <div className="dash-card stat-card">
                <div className="stat-icon">🚪</div>
                <div className="stat-info">
                  <span className="stat-number">16</span>
                  <span className="stat-label">Phòng</span>
                </div>
              </div>
              <div className="dash-card stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-info">
                  <span className="stat-number">0</span>
                  <span className="stat-label">Đơn đặt phòng</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="dash-card stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <span className="stat-number">0</span>
                  <span className="stat-label">Chuyến đi sắp tới</span>
                </div>
              </div>
              <div className="dash-card stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <span className="stat-number">0</span>
                  <span className="stat-label">Đã hoàn thành</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
