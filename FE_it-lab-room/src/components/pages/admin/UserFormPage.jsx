import { useEffect, useState } from "react";
import * as XLSX from 'xlsx';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Save, UploadCloud, FileSpreadsheet, FilePen, Loader2 } from "lucide-react";
import AppShell from "../../common/AppShell";
import SectionCard from "../../common/SectionCard";
import {
  getUserFromApi,
  createUserFromApi,
  updateUserFromApi,
  getDepartmentsFromApi,
  getClassesFromApi,
  importUsersFromApi,
  getRolesFromApi,
} from "../../../services/user.service";

const genders = ["Nam", "Nữ"];

/**
 * Khởi tạo form data trống với vai trò mặc định.
 */
function getInitialFormData(roleId) {
  return {
    ma_vai_tro: roleId,
    ho_ten: "",
    email: "",
    mat_khau: "",
    so_dien_thoai: "",
    gioi_tinh: "",
    ngay_sinh: "",
    // Trường riêng sinh viên
    ma_sinh_vien: "",
    ma_lop: "",
    nien_khoa: "",
    // Trường riêng giảng viên
    ma_giang_vien: "",
    ma_phong_ban: "",
  };
}

export default function UserFormPage({ defaultRole = "Sinh viên" }) {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(userId);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    getRolesFromApi().then((res) => {
      if (res?.data) setRoles(res.data);
    });
  }, []);

  // Xác định vai trò mặc định từ query param hoặc prop
  const roleQueryMap = Object.fromEntries(roles.map((r) => [r.ten_vai_tro, r.id]));
  const queryRole = searchParams.get("role");
  const initialRoleId = roleQueryMap[queryRole] || roleQueryMap[defaultRole] || roleQueryMap["student"] || (roles[0]?.id ?? "");

  // State cho form
  const [formData, setFormData] = useState(getInitialFormData(initialRoleId));
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // State cho dữ liệu dropdown (fetch từ API)
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // State cho fetch chi tiết user khi edit
  const [loadingUser, setLoadingUser] = useState(isEditing);
  const [userNotFound, setUserNotFound] = useState(false);

  // Đọc tham số 'tab' từ URL. Nếu là 'csv' thì mở tab nhập CSV, ngược lại mở tab thủ công
  const queryTab = searchParams.get("tab");
  const initialTab = queryTab === "csv" ? "csv" : "manual";

  // Tab nhập liệu: thủ công hoặc CSV
  const [activeTab, setActiveTab] = useState(initialTab);

  // --- State riêng cho tab nhập CSV ---
  const [csvRows, setCsvRows] = useState([]);
  const [csvError, setCsvError] = useState("");
  const [toast, setToast] = useState(null);

  const roleId = Number(formData.ma_vai_tro);
  const currentRoleName = roles.find((r) => r.id === roleId)?.ten_vai_tro;
  const isStudentRole = currentRoleName === "student";
  const isTeacherRole = currentRoleName === "teacher";
  const isAdminRole = currentRoleName === "admin";
  const userCodeLabel = isTeacherRole ? "Mã giảng viên" : isStudentRole ? "Mã sinh viên" : "";

  const backPath = "/admin/users";
  const pageTitle = isEditing ? "Sửa người dùng" : "Thêm người dùng";
  const pageSubtitle = isEditing
    ? "Cập nhật thông tin tài khoản người dùng"
    : "Tạo tài khoản người dùng mới";

  // Fetch danh sách phòng ban và lớp học từ API khi mount
  useEffect(() => {
    const fetchDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const [deptRes, classRes] = await Promise.all([
          getDepartmentsFromApi(),
          getClassesFromApi(),
        ]);

        if (deptRes.status) setDepartments(deptRes.data || []);
        if (classRes.status) setClasses(classRes.data || []);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu dropdown:", error);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    fetchDropdowns();
  }, []);

  // Tự động ẩn toast sau 5 giây
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Fetch chi tiết user khi vào chế độ sửa
  useEffect(() => {
    if (!isEditing) return;

    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const response = await getUserFromApi(userId);
        if (response.status && response.data) {
          const user = response.data;

          // Map dữ liệu API sang form fields
          setFormData({
            ma_vai_tro: user.role_id,
            ho_ten: user.full_name || "",
            email: user.email || "",
            mat_khau: "", // Không hiển thị mật khẩu cũ
            so_dien_thoai: user.phone || "",
            gioi_tinh: user.gender || "",
            ngay_sinh: user.date_of_birth || "",
            // Sinh viên
            ma_sinh_vien: user.student?.student_code || "",
            ma_lop: user.student?.class_id || "",
            nien_khoa: user.student?.course_year || "",
            // Giảng viên
            ma_giang_vien: user.teacher?.teacher_code || "",
            ma_phong_ban: user.teacher?.department_id || "",
          });
        } else {
          setUserNotFound(true);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin user:", error);
        setUserNotFound(true);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [isEditing, userId]);

  // Redirect nếu không tìm thấy user khi edit
  if (userNotFound) {
    return <Navigate to="/admin/users" replace />;
  }

  /**
   * Xử lý thay đổi trường input.
   * Xóa lỗi field tương ứng khi người dùng sửa giá trị.
   */
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      // Đổi vai trò → reset trường đặc thù để tránh gửi dữ liệu sai
      if (name === "ma_vai_tro") {
        next.ma_sinh_vien = "";
        next.ma_lop = "";
        next.nien_khoa = "";
        next.ma_giang_vien = "";
        next.ma_phong_ban = "";
      }

      return next;
    });

    // Xóa lỗi field khi user sửa
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }

    setGeneralError("");
  };

  /**
   * Xử lý submit form: gọi createUserFromApi hoặc updateUserFromApi.
   * Catch lỗi 422 để hiển thị validation errors từng trường.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError("");

    // Build payload chỉ gồm các trường phù hợp với vai trò
    const payload = {
      ma_vai_tro: Number(formData.ma_vai_tro),
      ho_ten: formData.ho_ten.trim(),
      email: formData.email.trim(),
      so_dien_thoai: formData.so_dien_thoai?.trim() || null,
      gioi_tinh: formData.gioi_tinh || null,
      ngay_sinh: formData.ngay_sinh || null,
    };

    // Chỉ gửi mật khẩu khi tạo mới hoặc khi có nhập mật khẩu mới lúc sửa
    if (!isEditing) {
      payload.mat_khau = formData.mat_khau;
    } else if (formData.mat_khau.trim()) {
      payload.mat_khau = formData.mat_khau.trim();
    }

    // Thêm trường riêng cho sinh viên
    if (isStudentRole) {
      payload.ma_sinh_vien = formData.ma_sinh_vien.trim();
      payload.ma_lop = formData.ma_lop ? Number(formData.ma_lop) : null;
      payload.nien_khoa = formData.nien_khoa.trim();
    }

    // Thêm trường riêng cho giảng viên
    if (isTeacherRole) {
      payload.ma_giang_vien = formData.ma_giang_vien.trim();
      payload.ma_phong_ban = formData.ma_phong_ban ? Number(formData.ma_phong_ban):null;
    }

    setSubmitting(true);
    try {
      let response;
      if (isEditing) {
        response = await updateUserFromApi(userId, payload);
      } else {
        response = await createUserFromApi(payload);
      }

      if (response.status) {
        navigate(backPath);
      }
    } catch (error) {
      // Parse lỗi validation 422 từ backend và hiển thị theo từng field
      if (error.status === 422 && error.payload?.data) {
        const serverErrors = error.payload.data;
        const mapped = {};
        for (const [field, messages] of Object.entries(serverErrors)) {
          mapped[field] = Array.isArray(messages) ? messages[0] : messages;
        }
        setFieldErrors(mapped);
      } else {
        setGeneralError(error.message || "Đã có lỗi xảy ra, vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Component hiển thị lỗi dưới mỗi trường input.
   */
  const renderFieldError = (name) => {
    if (!fieldErrors[name]) {
      return null;
    }

    return <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors[name]}</p>;
  };

  // CSS class cho input, viền đỏ khi có lỗi
  const inputClass = (name) =>
    `h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white ${fieldErrors[name] ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
    }`;

  // --- Xử lý nhập file Excel / CSV ---
  const handleCsvFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvError("");

    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let workbook;
        if (isCsv) {
          // Đối với file CSV, đọc dưới dạng string (FileReader đã giải mã UTF-8)
          // để tránh lỗi mojibake (vỡ font tiếng Việt) khi file không có BOM.
          const text = e.target.result;
          workbook = XLSX.read(text, { type: 'string' });
        } else {
          // Đối với xlsx/xls, đọc mảng byte
          const data = new Uint8Array(e.target.result);
          workbook = XLSX.read(data, { type: 'array' });
        }

        // Lấy sheet đầu tiên
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // sheet_to_json sẽ tự động chuyển dòng đầu tiên thành key của Object
        const rows = XLSX.utils.sheet_to_json(worksheet);

        if (!rows || rows.length === 0) {
          setCsvError("File không có dữ liệu.");
          setCsvRows([]);
          return;
        }

        // Validate dữ liệu từ mảng JSON đã được parse
        const validRoleNames = roles.map((r) => r.ten_vai_tro);
        const invalidRow = rows.find((row) => !validRoleNames.includes(row.role));
        if (invalidRow) {
          setCsvError(`Vai trò không hợp lệ: "${invalidRow.role}". Chỉ nhận ${validRoleNames.join(", ")}.`);
          setCsvRows([]);
          return;
        }

        setCsvRows(rows);
      } catch {
        setCsvError("Không thể đọc file. Vui lòng kiểm tra lại định dạng file Excel/CSV.");
        setCsvRows([]);
      }
    };

    // Chọn cách đọc file tương ứng
    if (isCsv) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleImportCsv = async () => {
    if (!csvRows.length) return;

    setSubmitting(true);
    setCsvError("");
    setToast(null);

    try {
      // Gọi API import hàng loạt
      const response = await importUsersFromApi({ users: csvRows });

      if (response.status) {
        const { success_count, errors } = response.data;

        if (errors && errors.length > 0) {
          setCsvError(`Đã nhập thành công ${success_count}/${csvRows.length} tài khoản.\nCó ${errors.length} dòng lỗi:\n\n${errors.join("\n")}`);
          setToast({ type: "warning", message: `Đã nhập ${success_count}/${csvRows.length}. Vui lòng xem chi tiết lỗi.` });
        } else {
          setToast({ type: "success", message: `Nhập thành công toàn bộ ${success_count} tài khoản!` });
          // Nếu thành công hết thì làm trống bảng và chuyển về trang danh sách sau một chút delay
          setCsvRows([]);
          setTimeout(() => navigate(backPath), 1500);
        }
      }
    } catch (error) {
      setCsvError(error.message || "Đã có lỗi xảy ra trong quá trình nhập dữ liệu từ hệ thống.");
      setToast({ type: "error", message: "Nhập dữ liệu thất bại!" });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading spinner khi đang fetch dữ liệu
  if (loadingUser || loadingDropdowns) {
    return (
      <AppShell role="admin" title={pageTitle} subtitle={pageSubtitle}>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <span className="ml-3 text-sm text-slate-500">Đang tải dữ liệu...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="admin" title={pageTitle} subtitle={pageSubtitle}>
      {/* Toast thông báo kết quả thao tác */}
      {toast && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${toast.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : toast.type === "warning"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
        >
          {toast.message}
        </div>
      )}

      {/* Tab chuyển đổi thêm thủ công / nhập CSV (chỉ khi tạo mới) */}
      {!isEditing && (
        <div className="mb-5 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "manual"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
          >
            <FilePen size={16} />
            Thêm thủ công
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("csv")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "csv"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
          >
            <FileSpreadsheet size={16} />
            Nhập từ CSV
          </button>
        </div>
      )}

      {/* ===== TAB THÊM THỦ CÔNG / SỬA ===== */}
      {activeTab === "manual" || isEditing ? (
        <SectionCard title="Thông tin người dùng">
          <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-2">
            {/* Vai trò */}
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Vai trò</span>
              <select
                name="ma_vai_tro"
                value={formData.ma_vai_tro}
                onChange={handleChange}
                className={inputClass("ma_vai_tro")}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.ten_vai_tro}
                  </option>
                ))}
              </select>
              {renderFieldError("ma_vai_tro")}
            </label>

            {/* Họ tên */}
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Họ tên</span>
              <input
                type="text"
                name="ho_ten"
                value={formData.ho_ten}
                onChange={handleChange}
                placeholder="Nhập họ tên"
                className={inputClass("ho_ten")}
              />
              {renderFieldError("ho_ten")}
            </label>

            {/* Email */}
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@itlab.vn"
                className={inputClass("email")}
              />
              {renderFieldError("email")}
            </label>

            {/* Mật khẩu */}
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                {isEditing ? "Mật khẩu mới (bỏ trống nếu không đổi)" : "Mật khẩu"}
              </span>
              <input
                type="password"
                name="mat_khau"
                value={formData.mat_khau}
                onChange={handleChange}
                placeholder={isEditing ? "Nhập mật khẩu mới (tùy chọn)" : "Nhập mật khẩu"}
                className={inputClass("mat_khau")}
              />
              {renderFieldError("mat_khau")}
            </label>

            {/* Số điện thoại */}
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Số điện thoại</span>
              <input
                type="tel"
                name="so_dien_thoai"
                value={formData.so_dien_thoai}
                onChange={handleChange}
                placeholder="VD: 0900000001"
                className={inputClass("so_dien_thoai")}
              />
              {renderFieldError("so_dien_thoai")}
            </label>

            {/* Giới tính */}
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Giới tính</span>
              <select
                name="gioi_tinh"
                value={formData.gioi_tinh}
                onChange={handleChange}
                className={inputClass("gioi_tinh")}
              >
                <option value="">Chưa cập nhật</option>
                {genders.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {renderFieldError("gioi_tinh")}
            </label>

            {/* Ngày sinh */}
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Ngày sinh</span>
              <input
                type="date"
                name="ngay_sinh"
                value={formData.ngay_sinh}
                onChange={handleChange}
                className={inputClass("ngay_sinh")}
              />
              {renderFieldError("ngay_sinh")}
            </label>

            {/* === Trường riêng cho Giảng viên === */}
            {isTeacherRole && (
              <>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">{userCodeLabel}</span>
                  <input
                    type="text"
                    name="ma_giang_vien"
                    value={formData.ma_giang_vien}
                    onChange={handleChange}
                    placeholder="VD: GV0002"
                    className={inputClass("ma_giang_vien")}
                  />
                  {renderFieldError("ma_giang_vien")}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Phòng ban</span>
                  <select
                    name="ma_phong_ban"
                    value={formData.ma_phong_ban}
                    onChange={handleChange}
                    className={inputClass("ma_phong_ban")}
                  >
                    <option value="">Chọn phòng ban</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                  {renderFieldError("ma_phong_ban")}
                </label>
              </>
            )}

            {/* === Trường riêng cho Sinh viên === */}
            {isStudentRole && (
              <>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">{userCodeLabel}</span>
                  <input
                    type="text"
                    name="ma_sinh_vien"
                    value={formData.ma_sinh_vien}
                    onChange={handleChange}
                    placeholder="VD: 0306231178"
                    className={inputClass("ma_sinh_vien")}
                  />
                  {renderFieldError("ma_sinh_vien")}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Niên khóa</span>
                  <input
                    type="text"
                    name="nien_khoa"
                    value={formData.nien_khoa}
                    onChange={handleChange}
                    placeholder="VD: 2022-2026"
                    className={inputClass("nien_khoa")}
                  />
                  {renderFieldError("nien_khoa")}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Lớp học</span>
                  <select
                    name="ma_lop"
                    value={formData.ma_lop}
                    onChange={handleChange}
                    className={inputClass("ma_lop")}
                  >
                    <option value="">Chọn lớp học</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.ma_lop}
                      </option>
                    ))}
                  </select>
                  {renderFieldError("ma_lop")}
                </label>
              </>
            )}

            {/* Lỗi chung từ server */}
            {generalError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 lg:col-span-2">
                {generalError}
              </div>
            )}

            {/* Nút hành động */}
            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 lg:col-span-2">
              <Link
                to={backPath}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {submitting ? "Đang lưu..." : "Lưu người dùng"}
              </button>
            </div>
          </form>
        </SectionCard>
      ) : (
        /* ===== TAB NHẬP CSV ===== */
        <SectionCard title="Nhập danh sách người dùng từ CSV">
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              File CSV cần có dòng đầu (header) gồm các cột:{" "}
              <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">
                role,code,name,email,phone,password,course,classCode,departmentCode
              </code>
              <ul className="mt-2 list-disc pl-5">
                <li><strong>role</strong>: admin / student / teacher / technician</li>
                <li><strong>code</strong>: bắt buộc với Giảng viên, Sinh viên</li>
                <li><strong>course</strong>, <strong>classCode</strong>: chỉ áp dụng cho Sinh viên<br/>(classCode là mã lớp dạng chuỗi, ví dụ: CK23A — tra trong danh sách lớp học)</li>
                <li><strong>departmentCode</strong>: chỉ áp dụng cho Giảng viên<br/>(nhập mã phòng ban dạng chuỗi, ví dụ: CNTT — không phải số id)</li>
              </ul>
            </div>

            <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white text-sm text-slate-500 transition hover:border-blue-400 hover:bg-blue-50">
              <UploadCloud size={24} className="text-slate-400" />
              <input
                type="file"
                // Cập nhật accept để hỗ trợ cả CSV và Excel
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleCsvFile}
                className="hidden"
              />
            </label>

            {csvError && (
              <div className="whitespace-pre-wrap rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {csvError}
              </div>
            )}

            {csvRows.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Vai trò</th>
                      <th className="px-3 py-2">Mã</th>
                      <th className="px-3 py-2">Họ tên</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Niên khóa / Mã lớp</th>
                      <th className="px-3 py-2">Phòng ban</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {csvRows.map((row, index) => (
                      <tr key={`${row.email}-${index}`}>
                        <td className="px-3 py-2">{row.role}</td>
                        <td className="px-3 py-2">{row.code}</td>
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2">{row.email}</td>
                        <td className="px-3 py-2">
                          {row.role === "student" ? `${row.course ?? "-"} / ${row.classCode ?? "-"}` : "-"}
                        </td>
                        <td className="px-3 py-2">
                          {row.role === "teacher" ? (row.departmentCode ?? "-") : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
              <Link
                to={backPath}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </Link>
              <button
                type="button"
                disabled={!csvRows.length || submitting}
                onClick={handleImportCsv}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {submitting ? "Đang nhập..." : `Nhập ${csvRows.length || ""} tài khoản`}
              </button>
            </div>
          </div>
        </SectionCard>
      )}
    </AppShell>
  );
}