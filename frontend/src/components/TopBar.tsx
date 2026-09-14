import { Link, useLocation } from "react-router-dom";

interface Tab {
  to: string;
  label: string;
}

export function TopBar({ title, tabs }: { title: string; tabs?: Tab[] }) {
  const location = useLocation();
  return (
    <div className="sticky top-0 z-10 bg-brand-500 text-white shadow">
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">{title}</span>
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
                  active ? "bg-white text-brand-600 font-semibold" : "bg-brand-600/50"
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
