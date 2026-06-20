import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routeMap';

export default function SignupPage() {
  return (
    <form className="auth-form">
      <div className="auth-form__header">
        <div className="h3">Create Account</div>
        <div className="text-xs">Register for a new Mini ERP account</div>
      </div>

      <div className="auth-form__fields">
        <div className="input-group"><label className="input-label">Login ID</label><input type="text" placeholder="6-12 characters" className="input-field" /></div>
        <div className="input-group"><label className="input-label">Full Name</label><input type="text" placeholder="Enter your full name" className="input-field" /></div>
        <div className="input-group"><label className="input-label">Email</label><input type="email" placeholder="you@company.com" className="input-field" /></div>
        <div className="input-group"><label className="input-label">Password</label><input type="password" placeholder="Min 8 chars" className="input-field" /></div>
        <div className="input-group"><label className="input-label">Confirm Password</label><input type="password" placeholder="Re-enter password" className="input-field" /></div>
      </div>

      <button type="button" className="btn btn--primary" style={{ width: '100%', padding: 'var(--space-sm)' }}>
        Create Account
      </button>

      <div style={{ textAlign: 'center', fontSize: 'var(--text-xs)', marginTop: 'var(--space-xs)' }}>
        Already have an account? <Link to={ROUTES.LOGIN} className="auth-link">Sign in</Link>
      </div>
    </form>
  );
}
