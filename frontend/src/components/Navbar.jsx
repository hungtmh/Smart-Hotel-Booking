import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Thanh dieu huong (Navbar) hien thi o dau moi trang.
 * Tu dong thay doi noi dung dua tren trang thai dang nhap va vai tro (Admin/User).
 */
export default function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-icon">M</span>
          <span className="nav-logo-text">Smart Marriott</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className="nav-link">Trang chủ</Link>

          {user ? (
            <>
              <Link to="/dashboard" className="nav-link">
                {isAdmin ? 'Bảng điều khiển' : 'Tài khoản'}
              </Link>
              <div className="nav-user-info">
                <span className="nav-user-name">
                  {profile?.fullName || user.email}
                </span>
                {isAdmin && <span className="nav-badge-admin">ADMIN</span>}
              </div>
              <button onClick={signOut} className="nav-btn-logout">
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Đăng nhập</Link>
              <Link to="/register" className="nav-btn-register">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
