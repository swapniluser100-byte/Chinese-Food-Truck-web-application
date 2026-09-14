import { useNavigate } from "react-router-dom";
import type { MenuItem } from "../types";
import { MenuImage } from "./MenuImage";

// Tap-friendly photo tile for the Staff Home menu grid (4 per row).
// Name + price sit in a dark caption band over the bottom of the image so
// they stay readable regardless of the photo underneath.
export function MenuButton({ item }: { item: MenuItem }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/staff/order/${item.id}`)}
      className="tap-target relative aspect-square rounded-xl shadow-md overflow-hidden text-left"
    >
      <MenuImage
        imageRefId={item.image_ref_id}
        category={item.category}
        name={item.name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent pt-4 pb-1.5 px-1.5">
        <div className="font-semibold text-xs leading-tight line-clamp-2 text-white">{item.name}</div>
        <div className="text-white font-bold text-sm mt-0.5">₹{item.rate}</div>
      </div>
    </button>
  );
}
