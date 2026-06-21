import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/routes/routeMap';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loginId, setLoginId] = useState('admin001');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({ loginId, password });
      navigate(ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="auth-form">
      <div className="auth-form__header">
        <div className="h3">Welcome Back</div>
        <div className="text-xs">Sign in to continue to Furnexa</div>
      </div>

      {error && <div style={{ color: 'var(--status-danger)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-sm)' }}>{error}</div>}

      <div className="auth-form__fields">
        <div className="input-group">
          <label className="input-label">Login ID</label>
          <input type="text" value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="Enter your login ID" className="input-field" required />
        </div>

        <div className="input-group">
          <label className="input-label">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="input-field" required />
        </div>
      </div>

      <button type="submit" className="btn btn--primary" style={{ width: '100%', padding: 'var(--space-sm)' }} disabled={isLoading}>
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>

      <div className="auth-form__links">
        <Link to={ROUTES.FORGOT_PASSWORD} className="auth-link">Forgot password?</Link>
        <Link to={ROUTES.SIGNUP} className="auth-link">Create account</Link>
      </div>
    </form>
  );
}
