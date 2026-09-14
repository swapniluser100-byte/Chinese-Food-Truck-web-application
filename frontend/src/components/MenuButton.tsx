import { useNavigate } from "react-router-dom";
import type { MenuItem } from "../types";
import { MenuImage } from "./MenuImage";

// Tap-friendly button for the Staff Home top-10 grid (4 per row).
export function MenuButton({ item }: { item: MenuItem }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/staff/order/${item.id}`)}
      className="tap-target bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden flex flex-col text-left"
    >
      <MenuImage
        imageRefId={item.image_ref_id}
        category={item.category}
        name={item.name}
        className="w-full aspect-square object-cover"
      />
      <div className="p-1.5">
        <div className="font-semibold text-xs leading-tight line-clamp-2">{item.name}</div>
        <div className="text-brand-600 font-bold text-sm mt-0.5">₹{item.rate}</div>
      </div>
    </button>
  );
}
