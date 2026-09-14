import { useNavigate } from "react-router-dom";
import type { MenuItem } from "../types";
import { MenuImage } from "./MenuImage";

// Big tap-friendly button for the Staff Home top-10 grid.
export function MenuButton({ item }: { item: MenuItem }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/staff/order/${item.id}`)}
      className="tap-target bg-white rounded-2xl shadow-md border border-neutral-200 overflow-hidden flex flex-col text-left"
    >
      <MenuImage
        imageRefId={item.image_ref_id}
        category={item.category}
        name={item.name}
        className="w-full h-28 object-cover"
      />
      <div className="p-3">
        <div className="font-semibold text-base leading-tight">{item.name}</div>
        <div className="text-brand-600 font-bold text-lg mt-1">₹{item.rate}</div>
      </div>
    </button>
  );
}
