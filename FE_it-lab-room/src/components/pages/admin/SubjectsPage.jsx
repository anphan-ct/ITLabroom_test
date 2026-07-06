import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import AppShell from "../../common/AppShell";
import SectionCard from "../../common/SectionCard";
import DataTable from "../../common/DataTable";
import { deleteSubjectFromApi, getSubjectsFromApi } from "../../../services/subject.service";

function mapSubject(subject) {
  return {
    id: subject.id,
    code: subject.ma_mon_hoc || "",
    name: subject.ten_mon,
    type: subject.loai_mon,
    credits: subject.so_tin_chi,
    note: subject.mo_ta || "",
  };
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getSubjectsFromApi()
      .then((response) => {
        if (isMounted) {
          setSubjects((response.data || []).map(mapSubject));
        }
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(apiError.message || "Không thể tải danh sách môn học.");
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
  }, []);

  const filteredSubjects = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return subjects.filter((subject) => {
      const searchContent = [subject.code, subject.name, subject.type, subject.credits, subject.note].join(" ").toLowerCase();
      return !keyword || searchContent.includes(keyword);
    });
  }, [subjects, searchKeyword]);

  const handleDelete = async (subject) => {
    const accepted = window.confirm(`Xóa môn học ${subject.name}?`);

    if (accepted) {
      setError("");
      setSuccessMessage("");
      setDeletingId(subject.id);

      try {
        await deleteSubjectFromApi(subject.id);
        setSubjects((currentSubjects) => currentSubjects.filter((item) => item.id !== subject.id));
        setSuccessMessage(`Đã xóa môn học ${subject.name}.`);
      } catch (apiError) {
        setError(apiError.message || "Không thể xóa môn học.");
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <AppShell role="admin" title="Quản lý môn học">
      <SectionCard
        rightAction={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tìm môn học"
                className="w-full min-w-[240px] rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:w-72"
              />
            </div>
            <Link
              to="/admin/subjects/create"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={17} />
              Thêm môn
            </Link>
          </div>
        }
        title="Danh sách môn học"
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
        <DataTable
          columns={[
            { key: "ordinal", title: "TT" },
            { key: "code", title: "Mã môn" },
            { key: "name", title: "Tên môn" },
            { key: "type", title: "Loại", render: (value) => value || "LT" },
            { key: "credits", title: "ĐVHP" },
            {
              key: "actions",
              title: "Thao tác",
              render: (_, subject) => (
                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/subjects/${subject.id}/edit`}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                  >
                    <Edit size={15} />
                    Sửa
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(subject)}
                    disabled={deletingId === subject.id}
                    className="inline-flex items-center gap-2 rounded-lg bg-rose-100 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <Trash2 size={15} />
                    {deletingId === subject.id ? "Đang xóa" : "Xóa"}
                  </button>
                </div>
              ),
            },
          ]}
          data={filteredSubjects.map((subject, index) => ({
            ...subject,
            ordinal: index + 1,
          }))}
          emptyText={isLoading ? "Đang tải danh sách môn học" : "Chưa có môn học"}
        />
      </SectionCard>
    </AppShell>
  );
}
