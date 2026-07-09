import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Save, Search, Trash2, X } from "lucide-react";
import AppShell from "../../common/AppShell";
import DataTable from "../../common/DataTable";
import SectionCard from "../../common/SectionCard";
import {
  addClassStudentFromApi,
  deleteClassStudentFromApi,
  getClassFromApi,
  getClassStudentOptionsFromApi,
  getClassStudentsFromApi,
} from "../../../services/class.service";

const defaultForm = {
  ma_sinh_vien: "",
};

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
  const [studentOptionKeyword, setStudentOptionKeyword] = useState("");
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentOptions, setStudentOptions] = useState([]);
  const [formData, setFormData] = useState(defaultForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const loadData = useCallback(async () => {
    const [classResponse, studentsResponse, optionsResponse] = await Promise.all([
      getClassFromApi(classId),
      getClassStudentsFromApi(classId, { per_page: 100 }),
      getClassStudentOptionsFromApi(classId),
    ]);

    const item = classResponse.data;

    setClassroom({
      code: item.ma_lop,
      courseYear: item.nien_khoa,
      advisor: item.giang_vien?.ho_ten || "Chưa phân công",
    });

    setStudents((studentsResponse.data?.students || []).map(mapStudent));
    setStudentOptions(optionsResponse.data?.students || []);
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

  const selectableStudents = useMemo(
    () => studentOptions.filter((student) => !student.is_in_class),
    [studentOptions]
  );

  const filteredSelectableStudents = useMemo(() => {
    const keyword = studentOptionKeyword.trim().toLowerCase();

    if (!keyword) {
      return selectableStudents;
    }

    return selectableStudents.filter((student) =>
      [
        student.student_code,
        student.full_name,
        student.email,
        student.class_code,
        student.course_year,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [selectableStudents, studentOptionKeyword]);

  const openCreateForm = () => {
    setFormData(defaultForm);
    setStudentOptionKeyword("");
    setShowForm(true);
    setError("");
    setSuccessMessage("");
  };

  const closeForm = () => {
    if (isSubmitting) return;

    setShowForm(false);
    setFormData(defaultForm);
    setStudentOptionKeyword("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      await addClassStudentFromApi(classId, {
        ma_sinh_vien: Number(formData.ma_sinh_vien),
      });
      setSuccessMessage("Đã thêm sinh viên vào lớp học.");
      setShowForm(false);
      setFormData(defaultForm);
      setStudentOptionKeyword("");
      await loadData();
    } catch (apiError) {
      setError(apiError.message || "Không thể thêm sinh viên vào lớp học.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Gỡ sinh viên ${student.code} khỏi lớp học này?`)) {
      return;
    }

    setProcessingId(student.id);
    setError("");
    setSuccessMessage("");

    try {
      await deleteClassStudentFromApi(classId, student.id);
      setSuccessMessage(`Đã gỡ sinh viên ${student.code} khỏi lớp học.`);
      await loadData();
    } catch (apiError) {
      setError(apiError.message || "Không thể gỡ sinh viên khỏi lớp học.");
    } finally {
      setProcessingId(null);
    }
  };

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

            {!showForm && (
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={17} />
                Thêm sinh viên
              </button>
            )}

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

        {successMessage && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successMessage}
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

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Thêm sinh viên vào lớp
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Tìm kiếm và chọn sinh viên chưa thuộc lớp học.
                </p>
              </div>

              <p className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {filteredSelectableStudents.length}/{selectableStudents.length} có thể thêm
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)_auto] lg:items-center">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={studentOptionKeyword}
                  onChange={(event) => setStudentOptionKeyword(event.target.value)}
                  placeholder="Tìm MSSV, họ tên, email, lớp..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <select
                required
                value={formData.ma_sinh_vien}
                onChange={(event) =>
                  setFormData({ ma_sinh_vien: event.target.value })
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Chọn sinh viên</option>
                {filteredSelectableStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {[
                      student.student_code,
                      student.full_name,
                      student.class_code ? `Lớp ${student.class_code}` : "",
                    ]
                      .filter(Boolean)
                      .join(" - ")}
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <X size={16} />
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  <Save size={16} />
                  {isSubmitting ? "Đang lưu" : "Thêm sinh viên"}
                </button>
              </div>
            </div>
          </form>
        )}

        <DataTable
          columns={[
            { key: "code", title: "MSSV" },
            { key: "name", title: "Họ tên" },
            { key: "email", title: "Email" },
            { key: "course", title: "Niên khóa" },
            { key: "status", title: "Trạng thái", isStatus: true },
            {
              key: "actions",
              title: "Thao tác",
              render: (_, student) => (
                <button
                  type="button"
                  onClick={() => handleDelete(student)}
                  disabled={processingId === student.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 px-3 py-1 text-rose-700 transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <Trash2 size={14} />
                  {processingId === student.id ? "Đang xóa" : "Xóa"}
                </button>
              ),
            },
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
