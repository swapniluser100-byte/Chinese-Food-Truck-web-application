import { Navigate, Route, Routes } from "react-router-dom";
import { StaffHome } from "./pages/staff/Home";
import { StaffOrder } from "./pages/staff/Order";
import { StaffActiveOrders } from "./pages/staff/ActiveOrders";
import { StaffLayout } from "./pages/staff/StaffLayout";
import { Kitchen } from "./pages/kitchen/Kitchen";
import { AdminLogin } from "./pages/admin/Login";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { MenuManager } from "./pages/admin/MenuManager";
import { AdminOrders } from "./pages/admin/Orders";
import { AdminSummary } from "./pages/admin/Summary";
import { AdminBranding } from "./pages/admin/Branding";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/staff" replace />} />

      <Route element={<StaffLayout />}>
        <Route path="/staff" element={<StaffHome />} />
        <Route path="/staff/order" element={<StaffOrder />} />
        <Route path="/staff/order/:menuItemId" element={<StaffOrder />} />
        <Route path="/staff/orders" element={<StaffActiveOrders />} />
      </Route>

      <Route path="/kitchen" element={<Kitchen />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<Navigate to="/admin/menu" replace />} />
      <Route element={<AdminLayout />}>
        <Route path="/admin/menu" element={<MenuManager />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/summary" element={<AdminSummary />} />
        <Route path="/admin/branding" element={<AdminBranding />} />
      </Route>

      <Route path="*" element={<Navigate to="/staff" replace />} />
    </Routes>
  );
}
