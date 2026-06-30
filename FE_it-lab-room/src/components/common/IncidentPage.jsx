import { useLocation } from "react-router-dom";
import AppShell from "./AppShell";
import IncidentForm from "./IncidentForm";
import SectionCard from "./SectionCard";

export default function IncidentPage({
  role,
  title,
  subtitle,
  sectionTitle = "Form báo hỏng",
}) {
  const { state } = useLocation();

  return (
    <AppShell role={role} title={title} subtitle={subtitle}>
      <SectionCard title={sectionTitle}>
        <IncidentForm
          role={role}
          initialComputerCode={state?.computerCode}
          initialRoomId={state?.roomId || state?.room || ""}
        />
      </SectionCard>
    </AppShell>
  );
}
