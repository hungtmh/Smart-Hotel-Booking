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
  const { signIn, signOut, signInWithGoogle } = useAuth();
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

  async function handleGoogleLogin() {
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Không thể đăng nhập bằng Google.');
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

        <div className="auth-divider">
          <span>hoặc</span>
        </div>
        <button onClick={handleGoogleLogin} className="btn-google">
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Đăng nhập với Google
        </button>

        <p className="auth-footer-text">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
