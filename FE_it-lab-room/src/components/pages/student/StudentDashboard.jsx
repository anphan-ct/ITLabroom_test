import { CalendarDays, Cpu, QrCode, TriangleAlert } from "lucide-react";
import AppShell from "../../common/AppShell";
import StatCard from "../../common/StatCard";
import SectionCard from "../../common/SectionCard";
import CalendarTable from "../../common/CalendarTable";
import { schedules } from "../../../data/mockData";

export default function StudentDashboard() {
  return (
    <AppShell role="student" title="Dashboard Sinh viên" subtitle="Lịch học, máy tính và báo hỏng thiết bị">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Lịch tuần này" value="05" desc="Buổi học thực hành" icon={<CalendarDays size={22} />} />
        <StatCard title="Máy đang dùng" value="PC015" desc="Phòng PM02" icon={<Cpu size={22} />} />
        <StatCard title="Điểm danh" value="04/05" desc="Số buổi có mặt" icon={<QrCode size={22} />} />
        <StatCard title="Báo lỗi" value="01" desc="Phiếu đang xử lý" icon={<TriangleAlert size={22} />} />
      </div>

      <div className="mt-6">
        <SectionCard title="Lịch học gần nhất">
          <CalendarTable data={schedules} />
        </SectionCard>
      </div>
    </AppShell>
  );
}
