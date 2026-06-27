import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Kiểm tra vai trò của email trước khi đăng nhập (tránh đăng nhập nhầm role)
      try {
        const roleRes = await fetch(`http://localhost:8080/api/public/auth/role?email=${encodeURIComponent(email)}`);
        if (roleRes.ok) {
          const { role } = await roleRes.json();
          if (role !== 'ADMIN') {
            setError('Tài khoản này không có quyền Quản trị viên hệ thống Smart Hotel Booking.');
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Không thể kiểm tra vai trò trước đăng nhập:', err);
      }

      // 2. Chỉ thực hiện đăng nhập khi vai trò hợp lệ
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page admin-login-page">
      <div className="auth-card admin-auth-card">
        <div className="auth-header">
          <div className="admin-logo-badge">🛡️</div>
          <h1>Admin Portal</h1>
          <p>Hệ Thống Quản Trị Khách Sạn Thượng Lưu</p>
        </div>

        <div className="role-admin-hint">
          🔐 Cảnh báo: Khu vực giới hạn chỉ dành cho Quản trị viên được cấp quyền hợp lệ.
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="admin-email">Email quản trị</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Mật khẩu</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary btn-full btn-admin" disabled={loading}>
            {loading ? 'Đang xác thực bảo mật...' : '⚙️ Đăng Nhập Hệ Thống'}
          </button>
        </form>
      </div>
    </div>
  );
}
