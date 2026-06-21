import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routeMap';
import { useThemeStore } from '@/store/theme.store';
import { usd } from './format';
import {
  Armchair,
  Banknote,
  BedDouble,
  Hammer,
  Heart,
  LampFloor,
  Moon,
  PackageCheck,
  Palette,
  PencilRuler,
  Ruler,
  ShoppingBag,
  Sofa,
  Sparkles,
  Sun,
  Truck,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import './landing.css';
import HeroFrameCanvas from './HeroFrameCanvas';

import MosaicCarousel from './MosaicCarousel';
import SmudgeRevealer from './SmudgeRevealer';

const features = [
  {
    icon: Sofa,
    variant: 'feature-icon-peach',
    title: 'Room-wise Collections',
    desc: 'Browse coordinated sofas, beds, tables, and storage pieces designed to work together across every room.',
  },
  {
    icon: Banknote,
    variant: 'feature-icon-warm',
    title: 'Transparent Pricing',
    desc: 'Compare materials, finishes, delivery costs, and installation options before you place an order.',
  },
  {
    icon: Ruler,
    variant: 'feature-icon-teal',
    title: 'Size & Fit Guidance',
    desc: 'Check dimensions, room fit, and layout notes so every piece feels intentional at home.',
  },
  {
    icon: Palette,
    variant: 'feature-icon-peach',
    title: 'Finish Studio',
    desc: 'Choose fabrics, wood tones, hardware, and color palettes that match your interior style.',
  },
  {
    icon: Warehouse,
    variant: 'feature-icon-teal',
    title: 'Live Inventory',
    desc: 'See what is ready to ship, what can be customized, and when workshop-made pieces will arrive.',
  },
  {
    icon: Sparkles,
    variant: 'feature-icon-warm',
    title: 'Style Suggestions',
    desc: 'Get personalized furniture pairings and decor ideas based on your room, budget, and taste.',
  },
];

const steps = [
  { num: '01', icon: Armchair, title: 'Pick your room', desc: 'Start with living, dining, bedroom, or workspace needs.' },
  { num: '02', icon: PencilRuler, title: 'Match the fit', desc: 'Review dimensions, finishes, and layout-friendly options.' },
  { num: '03', icon: ShoppingBag, title: 'Customize & order', desc: 'Choose materials, confirm pricing, and reserve stock.' },
  { num: '04', icon: Truck, title: 'Deliver & install', desc: 'Track delivery, assembly, and after-care from one place.' },
];

const testimonials = [
  {
    stars: '*****',
    text: 'Furnexa made furnishing our apartment feel simple. The coordinated room sets saved us weeks of browsing.',
    name: 'Priya Sharma',
    role: 'New Homeowner',
  },
  {
    stars: '*****',
    text: 'The pricing and delivery timeline were clear from the start. Our dining table arrived exactly as promised.',
    name: 'Arjun Mehta',
    role: 'Interior Client',
  },
  {
    stars: '****+',
    text: 'I loved being able to compare fabrics and wood finishes before ordering a custom sofa for my studio.',
    name: 'Divya Reddy',
    role: 'Studio Owner',
  },
];



function BrandLogo() {
  return (
    <span className="landing-logo-text" style={{ fontFamily: 'Flexing, sans-serif', letterSpacing: '0.08em' }}>
      <Armchair
        size={28}
        style={{
          display: 'inline-block',
          marginInlineEnd: '8px',
          verticalAlign: 'middle',
          color: 'var(--cl-accent)',
        }}
      />
      Furnexa
    </span>
  );
}

export default function LandingPage() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="traveloop-landing" style={{ background: 'var(--cl-bg)' }}>
      <div className="hero-scroll-track" style={{ height: '600vh' }}>
        <section className="landing-hero hero-sticky">
          <div className="landing-navbar landing-navbar-hero">
            <Link to={ROUTES.LANDING} className="landing-nav-logo">
              <BrandLogo />
            </Link>

            <div className="landing-nav-links">
              <a href="#features" className="landing-nav-link">
                Features
              </a>
              <a href="#how-it-works" className="landing-nav-link">
                How it works
              </a>
              <a href="#collections" className="landing-nav-link">
                Collections
              </a>
            </div>

            <div className="landing-nav-actions">
              <button
                type="button"
                onClick={toggleTheme}
                className="landing-theme-toggle"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link
                to={ROUTES.LOGIN}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--cl-text-muted)' }}
              >
                Sign In
              </Link>
              <Link to={ROUTES.SIGNUP} className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          </div>

          <div className="hero-canvas-bg">
            <HeroFrameCanvas />
          </div>

          <div className="hero-scroll-hint" aria-label="Scroll to explore">
            <div className="scroll-mouse">
              <div className="scroll-mouse-wheel" />
            </div>
            <span className="scroll-mouse-label">Scroll to explore</span>
          </div>
        </section>
      </div>

      {/* <MosaicCarousel /> */}
      {/* <SmudgeRevealer /> */}

      <section id="features" style={{ padding: 'var(--sp-3xl) var(--sp-xl)', background: 'var(--cl-bg)' }}>
        <div style={{ maxWidth: 'var(--max-w-2xl)', margin: '0 auto' }}>
          <div className="landing-section-header">
            <div className="landing-section-label">Everything you need</div>
            <h2 className="landing-section-title">Your complete furniture shopping toolkit</h2>
            <p className="landing-section-desc">
              From first moodboard to final installation, Furnexa helps you choose pieces that
              fit your space, style, and budget.
            </p>
          </div>

          <div className="features-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className={`feature-icon ${f.variant}`}>
                  <f.icon size={28} />
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" style={{ padding: '0 var(--sp-xl) var(--sp-3xl)' }}>
        <div style={{ maxWidth: 'var(--max-w-2xl)', margin: '0 auto' }}>
          <div className="how-section">
            <div className="landing-section-header" style={{ marginBottom: 'var(--sp-xl)' }}>
              <div className="landing-section-label" style={{ color: 'var(--cl-warm)' }}>
                Simple process
              </div>
              <h2 className="landing-section-title" style={{ color: 'var(--cl-text-on-surface)' }}>
                Furnish your space in 4 easy steps
              </h2>
            </div>

            <div className="how-steps">
              {steps.map((s) => (
                <div key={s.num} className="how-step">
                  <div className="how-step-num">{s.num}</div>
                  <div className="how-step-icon">
                    <s.icon size={32} />
                  </div>
                  <div>
                    <div className="how-step-title">{s.title}</div>
                    <div className="how-step-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      <section style={{ padding: '0 var(--sp-xl) var(--sp-3xl)', background: 'var(--cl-bg-alt)' }}>
        <div style={{ maxWidth: 'var(--max-w-2xl)', margin: '0 auto', paddingTop: 'var(--sp-3xl)' }}>
          <div className="landing-section-header">
            <div className="landing-section-label">Social proof</div>
            <h2 className="landing-section-title">What customers say</h2>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((t) => (
              <div key={t.name} className="testimonial-card">
                <div className="testimonial-stars">{t.stars}</div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="avatar avatar-sm">{t.name[0]}</div>
                  <div>
                    <div className="testimonial-author-name">{t.name}</div>
                    <div className="testimonial-author-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'var(--sp-3xl) var(--sp-xl)' }}>
        <div style={{ maxWidth: 'var(--max-w-2xl)', margin: '0 auto' }}>
          <div className="cta-section">
            <h2 className="cta-title">Ready to furnish your next room?</h2>
            <p className="cta-desc">
              Join Furnexa customers who shop smarter with curated collections, clear pricing,
              and delivery support from selection to setup.
            </p>
            <div className="cta-actions">
              <Link
                to={ROUTES.SIGNUP}
                className="btn btn-lg"
                style={{
                  background: 'var(--cl-text-on-surface)',
                  color: 'var(--cl-accent)',
                  fontWeight: 'var(--fw-bold)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }}
              >
                Get Started
              </Link>
              <Link
                to={ROUTES.LOGIN}
                className="btn btn-lg"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: 'var(--cl-text-on-surface)',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-inner">
          <div>
            <Link
              to={ROUTES.LANDING}
              className="landing-nav-logo"
              style={{ marginBottom: 'var(--sp-md)', textDecoration: 'none' }}
            >
              <BrandLogo />
            </Link>
            <p className="footer-brand-desc">
              The all-in-one furniture platform for modern homes. Discover, customize, order,
              and install pieces made for real living.
            </p>
          </div>

          <div>
            <div className="footer-col-title">Product</div>
            <ul className="footer-links">
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#how-it-works">How it works</a>
              </li>
              <li>
                <Link to={ROUTES.LOGIN}>Sign In</Link>
              </li>
              <li>
                <Link to={ROUTES.SIGNUP}>Get Started</Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Shop</div>
            <ul className="footer-links">
              <li>
                <a href="#collections">Collections</a>
              </li>
              <li>
                <a href="#features">Room Collections</a>
              </li>
              <li>
                <a href="#features">Transparent Pricing</a>
              </li>
              <li>
                <a href="#features">Style Suggestions</a>
              </li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Company</div>
            <ul className="footer-links">
              <li>
                <a href="#">About</a>
              </li>
              <li>
                <a href="#">Privacy Policy</a>
              </li>
              <li>
                <a href="#">Terms of Service</a>
              </li>
              <li>
                <a href="#">Contact</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-copy">
            © {new Date().getFullYear()} Furnexa. Made with{' '}
            <Heart
              size={12}
              fill="var(--cl-accent)"
              color="var(--cl-accent)"
              style={{ display: 'inline-block', margin: '0 2px' }}
            />{' '}
            for beautiful homes.
          </span>
          <div style={{ display: 'flex', gap: 'var(--sp-md)' }}>
            <a
              href="#"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-xs)',
                fontSize: 'var(--fs-xs)',
                color: 'var(--text-muted)',
              }}
            >
              Twitter
            </a>
            <a
              href="#"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-xs)',
                fontSize: 'var(--fs-xs)',
                color: 'var(--text-muted)',
              }}
            >
              Instagram
            </a>
            <a
              href="#"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-xs)',
                fontSize: 'var(--fs-xs)',
                color: 'var(--text-muted)',
              }}
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
