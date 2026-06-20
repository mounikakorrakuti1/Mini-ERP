import type { LucideIcon } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  icon: LucideIcon;
  description: string;
  moduleName: string;
}

export function PlaceholderPage({ title, icon: Icon, description, moduleName }: PlaceholderPageProps) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__header">
        <h1 className="h1">{title}</h1>
        <div className="text-sm">{moduleName} Module</div>
      </div>

      <div className="placeholder-page__card">
        <div className="placeholder-page__icon">
          <Icon size={40} />
        </div>
        
        <h2 className="h2">{title}</h2>
        
        <p className="placeholder-page__desc">
          {description}
        </p>
        
        <div>
          <span className="placeholder-page__badge">
            <span className="placeholder-page__pulse">
              <span className="placeholder-page__pulse-ring" />
              <span className="placeholder-page__pulse-dot" />
            </span>
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}
