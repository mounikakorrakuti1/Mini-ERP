import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/routes/routeMap';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login();
    navigate(ROUTES.DASHBOARD);
  };

  return (
    <form onSubmit={handleLogin} className="auth-form">
      <div className="auth-form__header">
        <div className="h3">Welcome Back</div>
        <div className="text-xs">Sign in to continue to Mini ERP</div>
      </div>

      <div className="auth-form__fields">
        <div className="input-group">
          <label className="input-label">Login ID</label>
          <input type="text" defaultValue="admin001" placeholder="Enter your login ID" className="input-field" />
        </div>

        <div className="input-group">
          <label className="input-label">Password</label>
          <input type="password" defaultValue="password" placeholder="Enter your password" className="input-field" />
        </div>
      </div>

      <button type="submit" className="btn btn--primary" style={{ width: '100%', padding: 'var(--space-sm)' }}>
        Sign In
      </button>

      <div className="auth-form__links">
        <Link to={ROUTES.FORGOT_PASSWORD} className="auth-link">Forgot password?</Link>
        <Link to={ROUTES.SIGNUP} className="auth-link">Create account</Link>
      </div>
    </form>
  );
}
