import { useState } from "react";
import { useLocation } from "react-router-dom";
import { List, Plus } from "lucide-react";
import AppShell from "../../common/AppShell";
import IncidentForm from "../../common/IncidentForm";
import IncidentHistoryList from "../../common/IncidentHistoryList";
import SectionCard from "../../common/SectionCard";

export default function StudentIncidentPage() {
  const { state } = useLocation();
  const [view, setView] = useState("form");

  const toggleView = () => setView((v) => (v === "form" ? "history" : "form"));

  const rightAction = (
    <button
      onClick={toggleView}
      className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition"
    >
      {view === "form" ? (
        <>
          <List size={16} /> Lịch sử báo sự cố
        </>
      ) : (
        <>
          <Plus size={16} /> Tạo báo cáo mới
        </>
      )}
    </button>
  );

  return (
    <AppShell role="student" title="Báo hỏng thiết bị" subtitle="Sinh viên cập nhật tình trạng máy tính hoặc thiết bị phòng máy">
      <SectionCard
        title={view === "form" ? "Tạo báo cáo sự cố mới" : "Lịch sử báo sự cố"}
        rightAction={rightAction}
      >
        {view === "form" ? (
          <IncidentForm
            role="student"
            initialComputerCode={state?.computerCode}
            initialRoomId={state?.roomId || state?.room || ""}
          />
        ) : (
          <IncidentHistoryList role="student" />
        )}
      </SectionCard>
    </AppShell>
  );
}
