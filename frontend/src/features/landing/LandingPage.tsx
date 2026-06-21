import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routeMap';
import {
  Factory, Package, ShoppingCart, Truck, Boxes,
  BarChart3, Workflow, ArrowRight, CheckCircle2, ChevronRight,
  Heart, Command
} from 'lucide-react';
import HeroFrameCanvas from './HeroFrameCanvas';
import MosaicCarousel from './MosaicCarousel';
import SmudgeRevealer from './SmudgeRevealer';
import './landing.css';

/* ── Data ─────────────────────────────────────────────────── */
const features = [
  {
    icon: Package,
    variant: 'feature-icon-peach',
    title: 'Product Catalogue',
    desc: 'Manage your complete product library with categories, pricing, BOMs, and procurement routes in one place.',
  },
  {
    icon: ShoppingCart,
    variant: 'feature-icon-teal',
    title: 'Sales Order Management',
    desc: 'Create, confirm, and deliver sales orders with automatic stock reservation and customer tracking.',
  },
  {
    icon: Truck,
    variant: 'feature-icon-warm',
    title: 'Purchase Orders',
    desc: 'Streamline vendor procurement. Raise POs, track deliveries, and auto-receive stock with full audit trails.',
  },
  {
    icon: Factory,
    variant: 'feature-icon-peach',
    title: 'Manufacturing',
    desc: 'Drive production from Bill of Materials. Schedule, start, and complete orders with component consumption.',
  },
  {
    icon: Boxes,
    variant: 'feature-icon-teal',
    title: 'Inventory & Ledger',
    desc: 'Real-time stock visibility with movement ledger, reorder alerts, and reconciliation reporting.',
  },
  {
    icon: Workflow,
    variant: 'feature-icon-warm',
    title: 'Smart Procurement',
    desc: 'AI-powered demand forecasting, low-stock alerts, and auto-recommendation engine for purchasing.',
  },
];

const steps = [
  { num: '01', icon: Package, title: 'Add your products',    desc: 'Define your catalogue, pricing, and BOMs in minutes.' },
  { num: '02', icon: ShoppingCart, title: 'Raise an order', desc: 'Create sales or purchase orders with one click.' },
  { num: '03', icon: Factory, title: 'Manufacture & stock', desc: 'Trigger production, track progress, auto-update inventory.' },
  { num: '04', icon: BarChart3, title: 'Analyze & grow',    desc: 'Live dashboards and drill-down analytics for every module.' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="furnexa-landing">
      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav ref={navRef} className={`landing-navbar ${scrolled ? '' : 'landing-navbar-hero'}`}>
        <div className="landing-nav-logo">
          <div className="landing-logo-mark">F</div>
          <span className="landing-logo-text">Furnexa</span>
        </div>
        <div className="landing-nav-links">
          <a href="#features"    className="landing-nav-link">Features</a>
          <a href="#how-it-works" className="landing-nav-link">Process</a>
          <a href="#visuals"      className="landing-nav-link">Visuals</a>
        </div>
        <div className="landing-nav-actions">
          <Link to={ROUTES.LOGIN} className="btn btn--primary" style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--cl-accent)', color: '#fff', fontSize: '0.875rem' }}>
            Sign In
          </Link>
          <Link to={ROUTES.SIGNUP} className="btn btn--primary" style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--cl-warm)', color: '#111', fontSize: '0.875rem' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Cinematic Hero ────────────────────────────────────── */}
      <div className="hero-scroll-track">
        <section className="landing-hero hero-sticky">
          <div className="hero-canvas-bg">
            <HeroFrameCanvas />
          </div>
          <div className="hero-canvas-scrim" />

          {/* New specific text overlay layout */}
          <div className="hero-text-overlay">
            <div className="hero-overlay-eyebrow">
              <span className="hero-badge-dot" style={{ background: 'currentColor', marginRight: 8, width: 6, height: 6, borderRadius: '50%' }} />
              Enterprise ERP Ready
            </div>
            <h1 className="hero-overlay-title">
              Run your entire business on <br />
              <span className="hero-overlay-accent">Furnexa</span>
            </h1>
            <p className="hero-overlay-desc">
              A modern, integrated ERP system for manufacturing. Manage products, orders, inventory, procurement, and teams in one place.
            </p>
            <div className="hero-overlay-cta">
              <Link to={ROUTES.SIGNUP} className="hero-cta-primary" style={{ padding: '12px 24px', background: 'var(--cl-accent)', color: '#fff', borderRadius: '8px', fontWeight: 600 }}>
                Start Free <ArrowRight size={16} style={{ marginLeft: 8, display: 'inline' }} />
              </Link>
              <Link to={ROUTES.LOGIN} className="hero-cta-secondary" style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}>
                Sign In
              </Link>
            </div>
          </div>

          <div className="hero-scroll-hint" aria-label="Scroll to explore">
            <div className="scroll-mouse">
              <div className="scroll-mouse-wheel" />
            </div>
            <span className="scroll-mouse-label">Scroll down</span>
          </div>
        </section>
      </div>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="landing-section">
        <div className="landing-section-header">
          <div className="landing-section-label">Everything you need</div>
          <h2 className="landing-section-title">Your complete business operations toolkit</h2>
          <p className="landing-section-desc">
            From raw materials to delivered goods — Furnexa covers every stage of your supply chain with precision and elegance.
          </p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className={`feature-icon ${f.variant}`}>
                <f.icon size={26} />
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Smudge Revealer Section ──────────────────────────── */}
      <SmudgeRevealer />

      {/* ── How It Works ─────────────────────────────────────── */}
      <section id="how-it-works" className="landing-section">
        <div className="how-section">
          <div className="landing-section-header" style={{ marginBottom: 40, textAlign: 'left', maxWidth: '100%' }}>
            <div className="landing-section-label">Process</div>
            <h2 className="landing-section-title" style={{ color: '#fff' }}>From zero to running in 4 steps</h2>
          </div>
          <div className="how-steps">
            {steps.map((s, i) => (
              <div key={i} className="how-step">
                <div className="how-step-num">{s.num}</div>
                <div className="how-step-icon">
                  <s.icon size={24} color="#F2CC8F" />
                </div>
                <div className="how-step-title">{s.title}</div>
                <div className="how-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mosaic Carousel Section ──────────────────────────── */}
      <div id="visuals">
        <MosaicCarousel />
      </div>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="landing-section">
        <div className="cta-section">
          <h2 className="cta-title">Ready to streamline your operations?</h2>
          <p className="cta-desc">
            Join manufacturing teams already running smarter with Furnexa. Set up your workspace in minutes.
          </p>
          <div className="cta-actions">
            <Link to={ROUTES.SIGNUP} className="btn btn--primary" style={{ padding: '14px 32px', fontSize: '1rem', background: '#F2CC8F', color: '#111', borderRadius: '12px' }}>
              Get Started Free <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div>
            <div className="landing-nav-logo">
              <div className="landing-logo-mark">F</div>
              <span className="landing-logo-text">Furnexa</span>
            </div>
            <p className="footer-brand-desc">
              The all-in-one ERP platform for modern manufacturing and distribution. Plan, produce, and deliver — all in one place.
            </p>
          </div>
          <div>
            <div className="footer-col-title">Product</div>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How it works</a></li>
              <li><Link to={ROUTES.LOGIN}>Sign In</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Platform</div>
            <ul className="footer-links">
              <li><a href="#features">Inventory</a></li>
              <li><a href="#features">Manufacturing</a></li>
              <li><a href="#features">Procurement</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Company</div>
            <ul className="footer-links">
              <li><a href="#">About</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">
            © {new Date().getFullYear()} Furnexa. Made with <Heart size={12} style={{ display: 'inline', color: 'var(--cl-accent)' }} /> for manufacturers.
          </span>
          <div className="footer-social-links" style={{ display: 'flex', gap: 16 }}>
            <a href="#" style={{ color: 'var(--cl-text-muted)', fontSize: 13 }}>Twitter</a>
            <a href="#" style={{ color: 'var(--cl-text-muted)', fontSize: 13 }}>LinkedIn</a>
            <a href="#" style={{ color: 'var(--cl-text-muted)', fontSize: 13 }}>GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
