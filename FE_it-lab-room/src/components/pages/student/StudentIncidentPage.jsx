import { useLocation } from "react-router-dom";
import AppShell from "../../common/AppShell";
import IncidentForm from "../../common/IncidentForm";
import SectionCard from "../../common/SectionCard";

export default function StudentIncidentPage() {
  const { state } = useLocation();

  return (
    <AppShell role="student" title="Báo hỏng thiết bị" subtitle="Sinh viên cập nhật tình trạng máy tính hoặc thiết bị phòng máy">
      <SectionCard title="Form báo hỏng">
        <IncidentForm
          role="student"
          initialComputerCode={state?.computerCode}
          initialRoomId={state?.roomId || state?.room || ""}
        />
      </SectionCard>
    </AppShell>
  );
}
