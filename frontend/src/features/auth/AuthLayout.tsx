import { Outlet } from 'react-router-dom';
import { Factory } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-brand">
          <div className="auth-brand__logo">
            <Factory size={32} />
          </div>
          <div className="h2" style={{ color: 'var(--text-main)' }}>Furnexa</div>
          {/* <div className="text-sm">---------------------------------</div> */}
        </div>

        <div className="auth-card">
          <Outlet />
        </div>

        <div className="auth-footer">
          © 2026 Shiv Furniture Works. All rights reserved.
        </div>
      </div>
    </div>
  );
}
