import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routeMap';

export default function ForgotPasswordPage() {
  return (
    <form className="auth-form">
      <div className="auth-form__header">
        <div className="h3">Forgot Password</div>
        <div className="text-xs">Enter your email to receive a password reset link</div>
      </div>

      <div className="auth-form__fields">
        <div className="input-group">
          <label className="input-label">Email Address</label>
          <input type="email" placeholder="you@company.com" className="input-field" />
        </div>
      </div>

      <button type="button" className="btn btn--primary" style={{ width: '100%', padding: 'var(--space-sm)' }}>
        Send Reset Link
      </button>

      <div style={{ textAlign: 'center', fontSize: 'var(--text-xs)' }}>
        Remember your password? <Link to={ROUTES.LOGIN} className="auth-link">Sign in</Link>
      </div>
    </form>
  );
}
