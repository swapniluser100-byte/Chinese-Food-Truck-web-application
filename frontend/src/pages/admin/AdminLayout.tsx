import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { clearAdminToken, hasAdminToken } from "../../api";
import { TopBar } from "../../components/TopBar";

export function AdminLayout() {
  const navigate = useNavigate();

  if (!hasAdminToken()) {
    return <Navigate to="/admin/login" replace />;
  }

  function logout() {
    clearAdminToken();
    navigate("/admin/login");
  }

  return (
    <div className="pb-8">
      <TopBar
        title="Admin Portal"
        tabs={[
          { to: "/admin/menu", label: "Menu" },
          { to: "/admin/orders", label: "Orders" },
          { to: "/admin/summary", label: "Reports" },
          { to: "/admin/branding", label: "Branding" },
        ]}
      />
      <div className="px-4 pt-2 flex justify-end">
        <button onClick={logout} className="text-sm text-neutral-500 underline">
          Log out
        </button>
      </div>
      <Outlet />
    </div>
  );
}
