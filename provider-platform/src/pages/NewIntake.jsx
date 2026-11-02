import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRole } from "@/lib/useRole";
import ScreenshotIntake from "@/components/intake/ScreenshotIntake";
import StructuredIntake from "@/components/intake/StructuredIntake";

export default function NewIntake() {
  const navigate = useNavigate();
  const { role } = useRole();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">New Intake</h2>
        <p className="text-sm text-muted-foreground">
          Every intake becomes a patient-specific draft. The system never infers or completes clinical values — missing
          data blocks finalisation until a human provides it.
        </p>
      </div>
      <Tabs defaultValue="screenshot">
        <TabsList>
          <TabsTrigger value="screenshot">Infocare Document (OCR)</TabsTrigger>
          <TabsTrigger value="structured">Structured Form</TabsTrigger>
        </TabsList>
        <TabsContent value="screenshot">
          <ScreenshotIntake
            role={role}
            onCreated={(p) => navigate(`/prescriptions/${p.id}`)}
            onQuarantined={() => navigate("/")}
          />
        </TabsContent>
        <TabsContent value="structured">
          <StructuredIntake role={role} onCreated={(p) => navigate(`/prescriptions/${p.id}`)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}