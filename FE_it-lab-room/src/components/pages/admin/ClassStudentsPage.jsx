import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import AppShell from "../../common/AppShell";
import DataTable from "../../common/DataTable";
import SectionCard from "../../common/SectionCard";
import {
  getClassFromApi,
  getClassStudentsFromApi,
} from "../../../services/class.service";

function mapStudent(student) {
  const statusLabels = {
    active: "Hoạt động",
    inactive: "Tạm khóa",
  };

  return {
    id: student.id,
    userId: student.user_id,
    code: student.student_code,
    name: student.full_name,
    email: student.email,
    course: student.course_year,
    status: statusLabels[student.status] || student.status,
  };
}

export default function ClassStudentsPage() {
  const { classId } = useParams();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [classResponse, studentsResponse] = await Promise.all([
      getClassFromApi(classId),
      getClassStudentsFromApi(classId, { per_page: 100 }),
    ]);

    const item = classResponse.data;

    setClassroom({
      code: item.ma_lop,
      courseYear: item.nien_khoa,
      advisor: item.giang_vien?.ho_ten || "Chưa phân công",
    });

    setStudents((studentsResponse.data?.students || []).map(mapStudent));
  }, [classId]);

  useEffect(() => {
    let isMounted = true;

    const timeout = setTimeout(() => {
      loadData()
        .catch((apiError) => {
          if (isMounted) {
            setError(apiError.message || "Không thể tải danh sách sinh viên.");
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

  const filteredStudents = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return students.filter((student) => {
      return (
        !keyword ||
        student.name.toLowerCase().includes(keyword) ||
        (student.code || "").toLowerCase().includes(keyword) ||
        student.email.toLowerCase().includes(keyword)
      );
    });
  }, [searchKeyword, students]);

  return (
    <AppShell
      role="admin"
      title={`Sinh viên lớp ${classroom?.code || ""}`}
      subtitle={
        classroom ? `Niên khóa ${classroom.courseYear}` : "Đang tải thông tin lớp"
      }
    >
      <SectionCard
        title="Danh sách sinh viên"
        rightAction={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tìm MSSV, họ tên, email..."
                className="w-full min-w-[240px] rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:w-72"
              />
            </div>

            <Link
              to="/admin/classes"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Quay lại
            </Link>
          </div>
        }
      >
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="mb-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Mã lớp</p>
            <p className="mt-2 font-bold text-slate-900">
              {classroom?.code || "-"}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Niên khóa</p>
            <p className="mt-2 font-bold text-slate-900">
              {classroom?.courseYear || "-"}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Giảng viên</p>
            <p className="mt-2 font-bold text-slate-900">
              {classroom?.advisor || "-"}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Sinh viên</p>
            <p className="mt-2 font-bold text-slate-900">{students.length}</p>
          </div>
        </div>

        <DataTable
          columns={[
            { key: "code", title: "MSSV" },
            { key: "name", title: "Họ tên" },
            { key: "email", title: "Email" },
            { key: "course", title: "Niên khóa" },
            { key: "status", title: "Trạng thái", isStatus: true },
          ]}
          data={filteredStudents}
          emptyText={
            isLoading
              ? "Đang tải danh sách sinh viên"
              : "Không tìm thấy sinh viên thuộc lớp này"
          }
        />
      </SectionCard>
    </AppShell>
  );
}
