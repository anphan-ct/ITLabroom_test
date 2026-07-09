import { BookOpen, CalendarDays, QrCode, TriangleAlert } from "lucide-react";
import AppShell from "../../common/AppShell";
import StatCard from "../../common/StatCard";
import SectionCard from "../../common/SectionCard";
import CalendarTable from "../../common/CalendarTable";
import { schedules } from "../../../data/mockData";

export default function TeacherDashboard() {
  return (
    <AppShell role="teacher" title="Dashboard Giảng viên" subtitle="Lịch dạy, điểm danh và báo cáo sự cố">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Ca giảng dạy" value="08" desc="Trong tuần này" icon={<BookOpen size={22} />} />
        <StatCard title="Lịch hôm nay" value="02" desc="Phòng máy đã đăng ký" icon={<CalendarDays size={22} />} />
        <StatCard title="Điểm danh" value="01" desc="Buổi cần cập nhật" icon={<QrCode size={22} />} />
        <StatCard title="Sự cố mới" value="03" desc="Thiết bị cần báo cáo" icon={<TriangleAlert size={22} />} />
      </div>

      <div className="mt-6">
        <SectionCard title="Lịch giảng dạy gần nhất">
          <CalendarTable data={schedules} />
        </SectionCard>
      </div>
    </AppShell>
  );
}
