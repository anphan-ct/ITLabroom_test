import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays } from "lucide-react";
import AppShell from "../../common/AppShell";
import DataTable from "../../common/DataTable";
import SectionCard from "../../common/SectionCard";
import { getAcademicYearFromApi } from "../../../services/academicYear.service";

const statusLabels = {
  active: "Đang diễn ra",
  upcoming: "Sắp diễn ra",
  completed: "Đã kết thúc",
};

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

function mapAcademicYear(item) {
  return {
    id: item.id,
    name: item.ten_nam_hoc || "",
    startDate: item.ngay_bat_dau || "",
    endDate: item.ngay_ket_thuc || "",
    status: statusLabels[item.trang_thai] || item.trang_thai,
    weekCount: item.so_tuan ?? item.tuan?.length ?? 0,
    weeks: item.tuan || [],
  };
}

export default function AcademicYearWeeksPage() {
  const { academicYearId } = useParams();
  const [academicYear, setAcademicYear] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    const response = await getAcademicYearFromApi(academicYearId);
    setAcademicYear(mapAcademicYear(response.data || {}));
  }, [academicYearId]);

  useEffect(() => {
    let isMounted = true;

    loadData()
      .catch((apiError) => {
        if (isMounted) {
          setError(apiError.message || "Không thể tải danh sách tuần.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [loadData]);

  const weekRows = useMemo(() => {
    return (academicYear?.weeks || []).map((week) => ({
      ...week,
      weekName: `Tuần ${week.so_tuan}`,
      dateRange: `${formatDate(week.ngay_bat_dau)} - ${formatDate(week.ngay_ket_thuc)}`,
    }));
  }, [academicYear]);

  return (
    <AppShell
      role="admin"
      title={academicYear ? `Tuần học ${academicYear.name}` : "Danh sách tuần"}
      subtitle="Xem danh sách tuần được tạo theo năm học"
    >
      <SectionCard
        title="Danh sách tuần"
        rightAction={(
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/academic-years"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={17} />
              Năm học
            </Link>
          </div>
        )}
      >
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {academicYear && (
          <div className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Năm học</p>
              <p className="mt-1 font-semibold text-slate-900">{academicYear.name}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Thời gian</p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatDate(academicYear.startDate)} - {formatDate(academicYear.endDate)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Số tuần</p>
              <p className="mt-1 font-semibold text-slate-900">{academicYear.weekCount}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Trạng thái</p>
              <p className="mt-1 font-semibold text-slate-900">{academicYear.status}</p>
            </div>
          </div>
        )}

        <DataTable
          columns={[
            {
              key: "weekName",
              title: "Tuần",
              render: (value) => (
                <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
                  <CalendarDays size={16} className="text-blue-600" />
                  {value}
                </span>
              ),
            },
            { key: "ngay_bat_dau", title: "Ngày bắt đầu", render: formatDate },
            { key: "ngay_ket_thuc", title: "Ngày kết thúc", render: formatDate },
            { key: "dateRange", title: "Khoảng thời gian" },
          ]}
          data={weekRows}
          emptyText={isLoading ? "Đang tải danh sách tuần" : "Chưa có tuần học"}
        />
      </SectionCard>
    </AppShell>
  );
}
