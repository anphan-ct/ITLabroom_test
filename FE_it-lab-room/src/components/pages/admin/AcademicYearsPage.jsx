import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Edit, Plus, Search, Trash2 } from "lucide-react";
import AppShell from "../../common/AppShell";
import DataTable from "../../common/DataTable";
import SectionCard from "../../common/SectionCard";
import {
  deleteAcademicYearFromApi,
  getAcademicYearsFromApi,
} from "../../../services/academicYear.service";

const statusTabs = [
  { key: "", label: "Tất cả" },
  { key: "active", label: "Đang diễn ra" },
  { key: "upcoming", label: "Sắp diễn ra" },
  { key: "completed", label: "Đã kết thúc" },
];

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
    rawStatus: item.trang_thai,
    weekCount: item.so_tuan ?? item.tuan?.length ?? 0,
    weeks: item.tuan || [],
  };
}

function getApiErrorMessage(error, fallback) {
  const validationErrors = error.payload?.data;

  if (validationErrors && typeof validationErrors === "object") {
    const firstMessages = Object.values(validationErrors)[0];

    if (Array.isArray(firstMessages) && firstMessages[0]) {
      return firstMessages[0];
    }
  }

  return error.message || fallback;
}

export default function AcademicYearsPage() {
  const [items, setItems] = useState([]);
  const [activeStatus, setActiveStatus] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = useCallback(async () => {
    const params = {};

    if (activeStatus) {
      params.status = activeStatus;
    }

    const response = await getAcademicYearsFromApi(params);
    const mappedItems = (response.data || []).map(mapAcademicYear);
    setItems(mappedItems);
  }, [activeStatus]);

  useEffect(() => {
    let isMounted = true;

    const timeout = setTimeout(() => {
      loadData()
        .catch((apiError) => {
          if (isMounted) {
            setError(apiError.message || "Không thể tải danh sách năm học.");
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [loadData]);

  const filteredItems = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return items.filter((item) => {
      const searchContent = [
        item.name,
        formatDate(item.startDate),
        formatDate(item.endDate),
        item.status,
      ].join(" ").toLowerCase();

      return !keyword || searchContent.includes(keyword);
    });
  }, [items, searchKeyword]);

  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa năm học ${item.name}?`)) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setDeletingId(item.id);

    try {
      await deleteAcademicYearFromApi(item.id);
      setSuccessMessage(`Đã xóa năm học ${item.name}.`);
      await loadData();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Không thể xóa năm học."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppShell role="admin" title="Quản lý năm học" subtitle="Tạo năm học và tự động chia danh sách tuần học">
      <SectionCard
        title="Danh sách năm học"
        rightAction={(
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tìm tên năm học"
                className="w-full min-w-[240px] rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:w-72"
              />
            </div>
            <Link
              to="/admin/academic-years/create"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={17} />
              Thêm năm học
            </Link>
          </div>
        )}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveStatus(tab.key)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeStatus === tab.key
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        )}

        <DataTable
          columns={[
            { key: "name", title: "Tên năm học" },
            { key: "startDate", title: "Ngày bắt đầu", render: formatDate },
            { key: "endDate", title: "Ngày kết thúc", render: formatDate },
            { key: "weekCount", title: "Số tuần" },
            { key: "status", title: "Trạng thái", isStatus: true },
            {
              key: "actions",
              title: "Thao tác",
              render: (_, item) => (
                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/academic-years/${item.id}/weeks`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-100 px-3 py-1 text-sky-700 transition hover:bg-sky-200"
                  >
                    <CalendarDays size={14} />
                    Tuần
                  </Link>
                  <Link
                    to={`/admin/academic-years/${item.id}/edit`}
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1 text-amber-700 transition hover:bg-amber-200"
                  >
                    <Edit size={14} />
                    Sửa
                  </Link>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      handleDelete(item);
                    }}
                    disabled={deletingId === item.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 px-3 py-1 text-rose-700 transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <Trash2 size={14} />
                    {deletingId === item.id ? "Đang xóa" : "Xóa"}
                  </button>
                </div>
              ),
            },
          ]}
          data={filteredItems}
          getRowLink={(item) => `/admin/academic-years/${item.id}/weeks`}
          emptyText={isLoading ? "Đang tải danh sách năm học" : "Chưa có năm học"}
        />
      </SectionCard>
    </AppShell>
  );
}
