import { useState } from "react";
import { X } from "lucide-react";

export default function MaskingEditor({ src, masks, onMasksChange }) {
  const [drawing, setDrawing] = useState(null);
  let wrapRef = null;

  const toNorm = (e) => {
    const rect = wrapRef.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e;
    return {
      x: Math.min(Math.max((pt.clientX - rect.left) / rect.width, 0), 1),
      y: Math.min(Math.max((pt.clientY - rect.top) / rect.height, 0), 1),
    };
  };

  const start = (e) => {
    e.preventDefault();
    const p = toNorm(e);
    setDrawing({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };
  const move = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const p = toNorm(e);
    setDrawing({ ...drawing, x1: p.x, y1: p.y });
  };
  const end = () => {
    if (drawing) {
      const box = {
        x: Math.min(drawing.x0, drawing.x1),
        y: Math.min(drawing.y0, drawing.y1),
        w: Math.abs(drawing.x1 - drawing.x0),
        h: Math.abs(drawing.y1 - drawing.y0),
      };
      if (box.w > 0.005 && box.h > 0.005) onMasksChange([...masks, box]);
    }
    setDrawing(null);
  };

  const pct = (v) => `${v * 100}%`;
  const previewStyle = drawing && {
    left: pct(Math.min(drawing.x0, drawing.x1)),
    top: pct(Math.min(drawing.y0, drawing.y1)),
    width: pct(Math.abs(drawing.x1 - drawing.x0)),
    height: pct(Math.abs(drawing.y1 - drawing.y0)),
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Optional masking — drag boxes over information you want to hide before upload, or run extraction without
        adding any masks. The original stays on this page for verification.
      </p>
      <div
        className="relative inline-block max-w-full touch-none select-none"
        ref={(el) => (wrapRef = el)}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      >
        <img
          src={src}
          alt="Source screenshot — drag to mask"
          draggable={false}
          className="block max-w-full max-h-[60vh] rounded border cursor-crosshair"
        />
        {masks.map((m, i) => (
          <div
            key={i}
            className="absolute bg-black"
            style={{ left: pct(m.x), top: pct(m.y), width: pct(m.w), height: pct(m.h) }}
          >
            <button
              type="button"
              title="Remove this mask"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onMasksChange(masks.filter((_, idx) => idx !== i));
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {previewStyle && <div className="absolute bg-black/50 pointer-events-none" style={previewStyle} />}
      </div>
      {masks.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No masks added — you can run extraction now, or draw boxes to hide sensitive information.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {masks.length} masked region{masks.length > 1 ? "s" : ""} — click the × on a box to remove it.
        </p>
      )}
    </div>
  );
}