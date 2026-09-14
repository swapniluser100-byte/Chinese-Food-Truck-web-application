import { useEffect, useState } from "react";
import { api } from "../api";

const CATEGORY_EMOJI: Record<string, string> = {
  Rice: "🍚",
  Noodles: "🍜",
  Starters: "🍗",
  Soup: "🥣",
};

const CATEGORY_COLOR: Record<string, string> = {
  Rice: "from-amber-200 to-amber-400",
  Noodles: "from-yellow-200 to-orange-400",
  Starters: "from-red-200 to-red-400",
  Soup: "from-emerald-200 to-emerald-400",
};

interface Props {
  imageRefId: string;
  category: string;
  name: string;
  className?: string;
}

// Real photos live in R2, served via GET /api/images/{image_ref_id}. Until a
// photo is uploaded for an item, we render a category-colored placeholder so
// every menu item always has a visible "image" on screen.
export function MenuImage({ imageRefId, category, name, className }: Props) {
  const [failed, setFailed] = useState(!imageRefId);
  useEffect(() => setFailed(!imageRefId), [imageRefId]);

  const emoji = CATEGORY_EMOJI[category] ?? "🥡";
  const gradient = CATEGORY_COLOR[category] ?? "from-neutral-200 to-neutral-400";

  if (failed) {
    return (
      <div
        className={`${className ?? ""} bg-gradient-to-br ${gradient} flex flex-col items-center justify-center text-center px-2`}
        role="img"
        aria-label={name}
      >
        <span className="text-5xl leading-none">{emoji}</span>
      </div>
    );
  }

  return <img src={api.imageUrl(imageRefId)} alt={name} className={className} onError={() => setFailed(true)} />;
}
