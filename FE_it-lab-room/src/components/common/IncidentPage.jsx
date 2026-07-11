import { useState } from "react";
import { useLocation } from "react-router-dom";
import { List, Plus } from "lucide-react";
import AppShell from "./AppShell";
import IncidentForm from "./IncidentForm";
import IncidentHistoryList from "./IncidentHistoryList";
import SectionCard from "./SectionCard";

export default function IncidentPage({
  role,
  title,
  subtitle,
}) {
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
    <AppShell role={role} title={title} subtitle={subtitle}>
      <SectionCard
        title={view === "form" ? "Tạo báo cáo sự cố mới" : "Lịch sử báo sự cố"}
        rightAction={rightAction}
      >
        {view === "form" ? (
          <IncidentForm
            role={role}
            initialComputerCode={state?.computerCode}
            initialRoomId={state?.roomId || state?.room || ""}
            initialTitle={state?.title || ""}
            initialIncidentType={state?.incidentType || ""}
            initialSeverity={state?.severity || ""}
            initialDescription={state?.description || ""}
          />
        ) : (
          <IncidentHistoryList role={role} />
        )}
      </SectionCard>
    </AppShell>
  );
}
