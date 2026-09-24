import { Link, useLocation } from "react-router-dom";
import { useBranding } from "../BrandingContext";

interface Tab {
  to: string;
  label: string;
}

export function TopBar({ title, tabs }: { title: string; tabs?: Tab[] }) {
  const location = useLocation();
  const { settings } = useBranding();

  return (
    <div className="sticky top-0 z-10 bg-brand-500 text-white shadow">
      <div className="px-4 py-3 flex items-center gap-2">
        {settings.logo_data_url ? (
          <img src={settings.logo_data_url} alt={settings.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <span className="text-2xl leading-none flex-shrink-0">🥡</span>
        )}
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="font-bold text-base truncate">{settings.name}</span>
            <span className="text-white/60 text-xs flex-shrink-0">•</span>
            <span className="text-sm text-white/90 truncate">{title}</span>
          </div>
          {settings.slogan && <div className="text-[11px] text-white/70 italic truncate leading-tight">{settings.slogan}</div>}
        </div>
      </div>
      {tabs && (
        <div className="flex px-2 pb-2 gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const active = location.pathname === tab.to;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                  active ? "bg-white text-brand-600 font-semibold" : "bg-white/15 hover:bg-white/25"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
