import type { MenuItem, OrderUnit, OrderWithItems, Settings } from "./types";

const BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

function adminToken(): string | null {
  return localStorage.getItem("admin_token");
}

async function request<T>(path: string, opts: RequestInit = {}, admin = false): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts.headers as Record<string, string>) };
  if (admin) {
    const token = adminToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Menu (public)
  getTopMenu: () => request<{ items: MenuItem[] }>("/api/menu/top"),
  getMenu: () => request<{ items: MenuItem[] }>("/api/menu"),
  searchMenu: (q: string) => request<{ items: MenuItem[] }>(`/api/menu/search?q=${encodeURIComponent(q)}`),
  getMenuItem: (id: number) => request<{ item: MenuItem }>(`/api/menu/${id}`),

  // Orders (staff)
  createOrder: (payload: {
    customer_name?: string;
    instructions?: string;
    items: { menu_item_id: number; quantity: number; rate: number; unit: OrderUnit; grams?: number }[];
  }) => request<{ order: OrderWithItems }>("/api/orders", { method: "POST", body: JSON.stringify(payload) }),
  getOrder: (id: number) => request<{ order: OrderWithItems }>(`/api/orders/${id}`),
  listOrders: (status?: string) =>
    request<{ orders: OrderWithItems[] }>(`/api/orders${status ? `?status=${status}` : ""}`),
  startPreparation: (id: number) => request<{ order: OrderWithItems }>(`/api/orders/${id}/start-preparation`, { method: "POST" }),
  completeOrder: (id: number) => request<{ order: OrderWithItems }>(`/api/orders/${id}/complete`, { method: "POST" }),
  qrUrl: (id: number) => `${BASE}/api/orders/${id}/qr`,
  imageUrl: (key: string) => `${BASE}/api/images/${key}`,

  // Kitchen
  getKitchenOrders: () => request<{ orders: OrderWithItems[] }>("/api/kitchen/orders"),
  startInKitchen: (id: number) => request<{ order: OrderWithItems }>(`/api/kitchen/orders/${id}/start`, { method: "POST" }),
  markReady: (id: number) => request<{ order: OrderWithItems }>(`/api/kitchen/orders/${id}/ready`, { method: "POST" }),

  // Admin
  adminLogin: (password: string) => request<{ token: string }>("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) }),
  adminGetMenu: () => request<{ items: MenuItem[] }>("/api/admin/menu", {}, true),
  adminCreateMenuItem: (item: Partial<MenuItem>) =>
    request<{ item: MenuItem }>("/api/admin/menu", { method: "POST", body: JSON.stringify(item) }, true),
  adminUpdateMenuItem: (id: number, item: Partial<MenuItem>) =>
    request<{ item: MenuItem }>(`/api/admin/menu/${id}`, { method: "PUT", body: JSON.stringify(item) }, true),
  adminDeleteMenuItem: (id: number) => request<{ ok: boolean }>(`/api/admin/menu/${id}`, { method: "DELETE" }, true),
  adminUploadImage: async (file: File): Promise<{ key: string }> => {
    const token = adminToken();
    const res = await fetch(`${BASE}/api/admin/images`, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: file,
    });
    if (!res.ok) {
      let message = `Upload failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch {
        // ignore
      }
      throw new Error(message);
    }
    return res.json();
  },
  adminListOrders: (params: { date?: string; status?: string } = {}) => {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "") as [string, string][];
    const qs = new URLSearchParams(entries).toString();
    return request<{ orders: OrderWithItems[] }>(`/api/admin/orders${qs ? `?${qs}` : ""}`, {}, true);
  },
  adminSummary: (date?: string) =>
    request<{
      date: string;
      totals: { order_count: number; total_sales: number; items_sold: number };
      byItem: { item_name: string; quantity: number; revenue: number }[];
      byStatus: { status: string; count: number }[];
    }>(`/api/admin/summary${date ? `?date=${date}` : ""}`, {}, true),
  adminExportCsv: async (date: string): Promise<Blob> => {
    const token = adminToken();
    const res = await fetch(`${BASE}/api/admin/export?date=${date}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`Export failed (${res.status})`);
    return res.blob();
  },

  // Branding
  getSettings: () => request<{ settings: Settings }>("/api/settings"),
  adminUpdateSettings: (settings: Settings) =>
    request<{ settings: Settings }>("/api/admin/settings", { method: "PUT", body: JSON.stringify(settings) }, true),
};

export function setAdminToken(token: string) {
  localStorage.setItem("admin_token", token);
}
export function clearAdminToken() {
  localStorage.removeItem("admin_token");
}
export function hasAdminToken() {
  return !!adminToken();
}
export { adminToken };
