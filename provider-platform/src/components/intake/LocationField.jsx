import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";

export default function LocationField({ value, onChange, disabled = false }) {
  const { data = [], isLoading, error } = useQuery({ queryKey: ["facility-locations"], queryFn: () => base44.entities.FacilityLocation.list("name", 20) });
  const selected = data.find((location) => location.name === value);
  return <div className="space-y-1">
    <Label className="text-xs text-muted-foreground">Location</Label>
    <select aria-label="Location" className="h-8 w-full border rounded bg-background text-foreground px-2 text-sm" value={selected ? value : ""} disabled={disabled || isLoading} onChange={(e) => onChange(e.target.value)}>
      <option value="">{isLoading ? "Loading locations…" : "Choose location"}</option>
      {data.map((location) => <option key={location.id} value={location.name}>{location.name}</option>)}
    </select>
    {selected && <p className="text-xs text-muted-foreground">{selected.address}</p>}
    {error && <p className="text-xs text-destructive">Locations could not be loaded. Please refresh.</p>}
  </div>;
}