import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

export default function IntakeSource({ intake }) {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["intake-source", intake.id], queryFn: async () => (await base44.functions.invoke("getIntakeSource", { intake_id: intake.id })).data, refetchInterval: 240000 });
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading source…</p>;
  if (error) return <button className="text-sm text-destructive underline" onClick={() => refetch()}>Could not load source. Retry</button>;
  if (!data?.url) return <p className="text-sm text-muted-foreground">No source file saved.</p>;
  const isPdf = data.file_type === "application/pdf" || /\.pdf(?:\?|$)/i.test(data.url);
  const isWord = data.file_type?.includes("wordprocessingml") || /\.docx(?:\?|$)/i.test(data.url);
  return <div className="space-y-2">
    {isPdf ? <iframe src={data.url} title="Redacted source document" className="w-full h-[60vh] border rounded" /> : !isWord && <Image src={data.url} fittingType="fit" className="w-full rounded border max-h-[70vh]" />}
    <a href={data.url} target="_blank" rel="noreferrer" className="text-xs underline">Open saved source</a>
  </div>;
}