import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routeMap';
import { useAuthStore } from '@/store/auth.store';

export default function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [formData, setFormData] = useState({ loginId: '', name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await register({
        loginId: formData.loginId,
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      navigate(ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form__header">
        <div className="h3">Create Account</div>
        <div className="text-xs">Register for a new Mini ERP account</div>
      </div>

      {error && <div style={{ color: 'var(--status-danger)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-sm)' }}>{error}</div>}

      <div className="auth-form__fields">
        <div className="input-group">
          <label className="input-label">Login ID</label>
          <input type="text" name="loginId" value={formData.loginId} onChange={handleChange} placeholder="6-12 characters" className="input-field" required />
        </div>
        <div className="input-group">
          <label className="input-label">Full Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" className="input-field" required />
        </div>
        <div className="input-group">
          <label className="input-label">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" className="input-field" required />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min 8 chars" className="input-field" required />
        </div>
        <div className="input-group">
          <label className="input-label">Confirm Password</label>
          <input type="password" name="confirm" value={formData.confirm} onChange={handleChange} placeholder="Re-enter password" className="input-field" required />
        </div>
      </div>

      <button type="submit" className="btn btn--primary" style={{ width: '100%', padding: 'var(--space-sm)' }} disabled={isLoading}>
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>

      <div style={{ textAlign: 'center', fontSize: 'var(--text-xs)', marginTop: 'var(--space-xs)' }}>
        Already have an account? <Link to={ROUTES.LOGIN} className="auth-link">Sign in</Link>
      </div>
    </form>
  );
}
