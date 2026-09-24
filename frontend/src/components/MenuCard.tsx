import { useNavigate } from "react-router-dom";
import type { MenuItem } from "../types";
import { MenuImage } from "./MenuImage";

// Smaller card used for search results.
export function MenuCard({ item }: { item: MenuItem }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/staff/order/${item.id}`)}
      className="tap-target bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex items-center gap-3 text-left p-2.5 w-full"
    >
      <MenuImage
        imageRefId={item.image_ref_id}
        category={item.category}
        name={item.name}
        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.name}</div>
        <div className="text-xs text-neutral-500">{item.category}</div>
      </div>
      <span className="bg-brand-700 text-white font-bold text-sm rounded-full px-3 py-1">₹{item.rate}</span>
    </button>
  );
}
