import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Trang đăng nhập dành cho Khách hàng.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
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
          if (role === 'ADMIN') {
            setError('Tài khoản Quản trị viên không thể đăng nhập vào giao diện của Khách hàng.');
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Không thể kiểm tra vai trò trước đăng nhập:', err);
      }

      // 2. Chỉ thực hiện đăng nhập khi vai trò hợp lệ
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">M</span>
          <h1>Đăng nhập</h1>
          <p>Chào mừng bạn quay trở lại đặt phòng</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Mật khẩu</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>
          <button
            id="login-submit-btn"
            type="submit"
            className="btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="auth-footer-text">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
