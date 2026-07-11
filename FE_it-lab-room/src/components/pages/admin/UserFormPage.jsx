import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Save,
  UploadCloud,
  FileSpreadsheet,
  FilePen,
  Loader2,
} from "lucide-react";
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

const roleAliasMap = {
  admin: "admin",
  "quản trị viên": "admin",
  "quản trị viên hệ thống": "admin",

  teacher: "teacher",
  "giảng viên": "teacher",

  student: "student",
  "sinh viên": "student",

  technician: "technician",
  "kỹ thuật viên": "technician",
};

function normalizeRole(value) {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();

  return roleAliasMap[normalizedValue] || normalizedValue;
}

function getRoleName(role) {
  return (
    role?.ten_vai_tro ||
    role?.role_name ||
    role?.name ||
    role?.title ||
    ""
  );
}

function getRoleLabel(role) {
  return (
    role?.mo_ta ||
    role?.description ||
    getRoleName(role)
  );
}

function getRoleSlugById(roles, roleId) {
  const selectedRole = roles.find(
    (role) => Number(role.id) === Number(roleId)
  );

  return normalizeRole(getRoleName(selectedRole));
}

function getRoleIdBySlug(roles, roleSlug) {
  const normalizedSlug = normalizeRole(roleSlug);

  const selectedRole = roles.find(
    (role) =>
      normalizeRole(getRoleName(role)) === normalizedSlug
  );

  return selectedRole?.id || "";
}

function getInitialFormData(roleId = "") {
  return {
    ma_vai_tro: roleId,
    ho_ten: "",
    email: "",
    mat_khau: "",
    so_dien_thoai: "",
    gioi_tinh: "",
    ngay_sinh: "",

    ma_sinh_vien: "",
    ma_lop: "",
    nien_khoa: "",

    ma_giang_vien: "",
    ma_phong_ban: "",
  };
}

export default function UserFormPage({
  defaultRole = "student",
}) {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [searchParams] = useSearchParams();

  const isEditing = Boolean(userId);

  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const [formData, setFormData] = useState(
    getInitialFormData()
  );

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] =
    useState(true);

  const [loadingUser, setLoadingUser] =
    useState(isEditing);

  const [userNotFound, setUserNotFound] =
    useState(false);

  const queryTab = searchParams.get("tab");
  const initialTab =
    queryTab === "csv" ? "csv" : "manual";

  const [activeTab, setActiveTab] =
    useState(initialTab);

  const [csvRows, setCsvRows] = useState([]);
  const [csvError, setCsvError] = useState("");
  const [toast, setToast] = useState(null);

  const currentRoleSlug = getRoleSlugById(
    roles,
    formData.ma_vai_tro
  );

  const isStudentRole =
    currentRoleSlug === "student";

  const isTeacherRole =
    currentRoleSlug === "teacher";

  const isAdminRole =
    currentRoleSlug === "admin";

  const isTechnicianRole =
    currentRoleSlug === "technician";

  const userCodeLabel = isTeacherRole
    ? "Mã giảng viên"
    : isStudentRole
      ? "Mã sinh viên"
      : "";

  const backPath = "/admin/users";

  const pageTitle = isEditing
    ? "Sửa người dùng"
    : "Thêm người dùng";

  const pageSubtitle = isEditing
    ? "Cập nhật thông tin tài khoản người dùng"
    : "Tạo tài khoản người dùng mới";

  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);

      try {
        const response = await getRolesFromApi();

        const roleData = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : [];

        setRoles(roleData);
      } catch (error) {
        console.error(
          "Lỗi khi lấy danh sách vai trò:",
          error
        );

        setRoles([]);
        setGeneralError(
          "Không thể tải danh sách vai trò."
        );
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    if (
      isEditing ||
      loadingRoles ||
      roles.length === 0
    ) {
      return;
    }

    const roleFromQuery =
      searchParams.get("role");

    const nextRoleId =
      getRoleIdBySlug(roles, roleFromQuery) ||
      getRoleIdBySlug(roles, defaultRole) ||
      getRoleIdBySlug(roles, "student") ||
      roles[0]?.id ||
      "";

    setFormData((prev) => ({
      ...prev,
      ma_vai_tro: String(nextRoleId),
    }));
  }, [
    defaultRole,
    isEditing,
    loadingRoles,
    roles,
    searchParams,
  ]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      setLoadingDropdowns(true);

      try {
        const [departmentResponse, classResponse] =
          await Promise.all([
            getDepartmentsFromApi(),
            getClassesFromApi(),
          ]);

        const departmentData = Array.isArray(
          departmentResponse?.data
        )
          ? departmentResponse.data
          : Array.isArray(
                departmentResponse?.data?.data
              )
            ? departmentResponse.data.data
            : [];

        const classData = Array.isArray(
          classResponse?.data
        )
          ? classResponse.data
          : Array.isArray(classResponse?.data?.data)
            ? classResponse.data.data
            : [];

        setDepartments(departmentData);
        setClasses(classData);
      } catch (error) {
        console.error(
          "Lỗi khi lấy dữ liệu dropdown:",
          error
        );
      } finally {
        setLoadingDropdowns(false);
      }
    };

    fetchDropdowns();
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (
      !isEditing ||
      loadingRoles ||
      roles.length === 0
    ) {
      return;
    }

    const fetchUser = async () => {
      setLoadingUser(true);

      try {
        const response = await getUserFromApi(userId);

        if (response?.status && response?.data) {
          const user = response.data;

          setFormData({
            ma_vai_tro: String(
              user.role_id ||
                user.ma_vai_tro ||
                user.role?.id ||
                ""
            ),

            ho_ten:
              user.full_name ||
              user.ho_ten ||
              "",

            email: user.email || "",

            mat_khau: "",

            so_dien_thoai:
              user.phone ||
              user.so_dien_thoai ||
              "",

            gioi_tinh:
              user.gender ||
              user.gioi_tinh ||
              "",

            ngay_sinh:
              user.date_of_birth ||
              user.ngay_sinh ||
              "",

            ma_sinh_vien:
              user.student?.student_code ||
              user.student?.ma_sinh_vien ||
              user.ma_sinh_vien ||
              "",

            ma_lop: String(
              user.student?.class_id ||
                user.student?.ma_lop ||
                user.ma_lop ||
                ""
            ),

            nien_khoa:
              user.student?.course_year ||
              user.student?.nien_khoa ||
              user.nien_khoa ||
              "",

            ma_giang_vien:
              user.teacher?.teacher_code ||
              user.teacher?.ma_giang_vien ||
              user.ma_giang_vien ||
              "",

            ma_phong_ban: String(
              user.teacher?.department_id ||
                user.teacher?.ma_phong_ban ||
                user.ma_phong_ban ||
                ""
            ),
          });
        } else {
          setUserNotFound(true);
        }
      } catch (error) {
        console.error(
          "Lỗi khi lấy thông tin người dùng:",
          error
        );

        setUserNotFound(true);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [
    isEditing,
    loadingRoles,
    roles.length,
    userId,
  ]);

  if (userNotFound) {
    return (
      <Navigate
        to="/admin/users"
        replace
      />
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => {
      const nextFormData = {
        ...prev,
        [name]: value,
      };

      if (name === "ma_vai_tro") {
        nextFormData.ma_sinh_vien = "";
        nextFormData.ma_lop = "";
        nextFormData.nien_khoa = "";

        nextFormData.ma_giang_vien = "";
        nextFormData.ma_phong_ban = "";
      }

      return nextFormData;
    });

    setFieldErrors((prev) => {
      const nextErrors = { ...prev };

      delete nextErrors[name];

      if (name === "ma_vai_tro") {
        delete nextErrors.ma_sinh_vien;
        delete nextErrors.ma_lop;
        delete nextErrors.nien_khoa;
        delete nextErrors.ma_giang_vien;
        delete nextErrors.ma_phong_ban;
      }

      return nextErrors;
    });

    setGeneralError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFieldErrors({});
    setGeneralError("");

    if (!formData.ma_vai_tro) {
      setFieldErrors({
        ma_vai_tro: "Vui lòng chọn vai trò.",
      });

      return;
    }

    const payload = {
      ma_vai_tro: Number(formData.ma_vai_tro),
      ho_ten: formData.ho_ten.trim(),
      email: formData.email.trim(),

      so_dien_thoai:
        formData.so_dien_thoai?.trim() || null,

      gioi_tinh:
        formData.gioi_tinh || null,

      ngay_sinh:
        formData.ngay_sinh || null,
    };

    if (!isEditing) {
      payload.mat_khau = formData.mat_khau;
    } else if (formData.mat_khau.trim()) {
      payload.mat_khau =
        formData.mat_khau.trim();
    }

    if (isStudentRole) {
      payload.ma_sinh_vien =
        formData.ma_sinh_vien.trim();

      payload.ma_lop = formData.ma_lop
        ? Number(formData.ma_lop)
        : null;

      payload.nien_khoa =
        formData.nien_khoa.trim();
    }

    if (isTeacherRole) {
      payload.ma_giang_vien =
        formData.ma_giang_vien.trim();

      payload.ma_phong_ban =
        formData.ma_phong_ban
          ? Number(formData.ma_phong_ban)
          : null;
    }

    setSubmitting(true);

    try {
      const response = isEditing
        ? await updateUserFromApi(
            userId,
            payload
          )
        : await createUserFromApi(payload);

      if (response?.status) {
        navigate(backPath);
      } else {
        setGeneralError(
          response?.message ||
            "Không thể lưu người dùng."
        );
      }
    } catch (error) {
      const serverErrors =
        error?.payload?.data ||
        error?.response?.data?.data ||
        error?.response?.data?.errors;

      if (
        error?.status === 422 ||
        error?.response?.status === 422
      ) {
        const mappedErrors = {};

        for (const [field, messages] of Object.entries(
          serverErrors || {}
        )) {
          mappedErrors[field] =
            Array.isArray(messages)
              ? messages[0]
              : messages;
        }

        setFieldErrors(mappedErrors);
      } else {
        setGeneralError(
          error?.message ||
            error?.response?.data?.message ||
            "Đã có lỗi xảy ra, vui lòng thử lại."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderFieldError = (name) => {
    if (!fieldErrors[name]) {
      return null;
    }

    return (
      <p className="mt-1 text-xs font-medium text-rose-600">
        {fieldErrors[name]}
      </p>
    );
  };

  const inputClass = (name) =>
    `h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white ${
      fieldErrors[name]
        ? "border-rose-400 bg-rose-50/30"
        : "border-slate-200"
    }`;

  const handleCsvFile = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setCsvError("");
    setCsvRows([]);

    const isCsv = file.name
      .toLowerCase()
      .endsWith(".csv");

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        let workbook;

        if (isCsv) {
          workbook = XLSX.read(
            loadEvent.target.result,
            {
              type: "string",
            }
          );
        } else {
          const data = new Uint8Array(
            loadEvent.target.result
          );

          workbook = XLSX.read(data, {
            type: "array",
          });
        }

        const firstSheetName =
          workbook.SheetNames[0];

        const worksheet =
          workbook.Sheets[firstSheetName];

        const rows = XLSX.utils.sheet_to_json(
          worksheet,
          {
            defval: "",
          }
        );

        if (!rows.length) {
          setCsvError(
            "File không có dữ liệu."
          );

          return;
        }

        const validRoleNames = roles.map((role) =>
          normalizeRole(getRoleName(role))
        );

        const invalidRow = rows.find(
          (row) =>
            !validRoleNames.includes(
              normalizeRole(row.role)
            )
        );

        if (invalidRow) {
          setCsvError(
            `Vai trò không hợp lệ: "${invalidRow.role}". Chỉ nhận: ${validRoleNames.join(", ")}.`
          );

          return;
        }

        setCsvRows(rows);
      } catch (error) {
        console.error(
          "Lỗi đọc file:",
          error
        );

        setCsvError(
          "Không thể đọc file. Vui lòng kiểm tra lại định dạng Excel hoặc CSV."
        );

        setCsvRows([]);
      }
    };

    reader.onerror = () => {
      setCsvError(
        "Không thể đọc file đã chọn."
      );

      setCsvRows([]);
    };

    if (isCsv) {
      reader.readAsText(file, "UTF-8");
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleImportCsv = async () => {
    if (!csvRows.length) {
      return;
    }

    setSubmitting(true);
    setCsvError("");
    setToast(null);

    try {
      const response =
        await importUsersFromApi({
          users: csvRows,
        });

      if (response?.status) {
        const successCount =
          response?.data?.success_count || 0;

        const errors =
          response?.data?.errors || [];

        if (errors.length > 0) {
          setCsvError(
            `Đã nhập thành công ${successCount}/${csvRows.length} tài khoản.\nCó ${errors.length} dòng lỗi:\n\n${errors.join("\n")}`
          );

          setToast({
            type: "warning",
            message: `Đã nhập ${successCount}/${csvRows.length}. Vui lòng xem chi tiết lỗi.`,
          });
        } else {
          setToast({
            type: "success",
            message: `Nhập thành công toàn bộ ${successCount} tài khoản!`,
          });

          setCsvRows([]);

          setTimeout(() => {
            navigate(backPath);
          }, 1500);
        }
      } else {
        setCsvError(
          response?.message ||
            "Nhập dữ liệu thất bại."
        );
      }
    } catch (error) {
      setCsvError(
        error?.message ||
          error?.response?.data?.message ||
          "Đã có lỗi xảy ra trong quá trình nhập dữ liệu."
      );

      setToast({
        type: "error",
        message: "Nhập dữ liệu thất bại!",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (
    loadingRoles ||
    loadingUser ||
    loadingDropdowns
  ) {
    return (
      <AppShell
        role="admin"
        title={pageTitle}
        subtitle={pageSubtitle}
      >
        <div className="flex items-center justify-center py-20">
          <Loader2
            size={32}
            className="animate-spin text-blue-500"
          />

          <span className="ml-3 text-sm text-slate-500">
            Đang tải dữ liệu...
          </span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      role="admin"
      title={pageTitle}
      subtitle={pageSubtitle}
    >
      {toast && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : toast.type === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      {!isEditing && (
        <div className="mb-5 flex gap-2">
          <button
            type="button"
            onClick={() =>
              setActiveTab("manual")
            }
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === "manual"
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FilePen size={16} />
            Thêm thủ công
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("csv")
            }
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === "csv"
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FileSpreadsheet size={16} />
            Nhập từ CSV
          </button>
        </div>
      )}

      {activeTab === "manual" || isEditing ? (
        <SectionCard title="Thông tin người dùng">
          <form
            onSubmit={handleSubmit}
            className="grid gap-5 lg:grid-cols-2"
          >
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Vai trò
              </span>

              <select
                name="ma_vai_tro"
                value={formData.ma_vai_tro}
                onChange={handleChange}
                className={inputClass(
                  "ma_vai_tro"
                )}
              >
                {roles.map((role) => (
                  <option
                    key={role.id}
                    value={String(role.id)}
                  >
                    {getRoleLabel(role)}
                  </option>
                ))}
              </select>

              {renderFieldError(
                "ma_vai_tro"
              )}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Họ tên
              </span>

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

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Email
              </span>

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

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                {isEditing
                  ? "Mật khẩu mới (bỏ trống nếu không đổi)"
                  : "Mật khẩu"}
              </span>

              <input
                type="password"
                name="mat_khau"
                value={formData.mat_khau}
                onChange={handleChange}
                placeholder={
                  isEditing
                    ? "Nhập mật khẩu mới (tùy chọn)"
                    : "Nhập mật khẩu"
                }
                className={inputClass(
                  "mat_khau"
                )}
              />

              {renderFieldError("mat_khau")}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Số điện thoại
              </span>

              <input
                type="tel"
                name="so_dien_thoai"
                value={
                  formData.so_dien_thoai
                }
                onChange={handleChange}
                placeholder="VD: 0900000001"
                className={inputClass(
                  "so_dien_thoai"
                )}
              />

              {renderFieldError(
                "so_dien_thoai"
              )}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Giới tính
              </span>

              <select
                name="gioi_tinh"
                value={formData.gioi_tinh}
                onChange={handleChange}
                className={inputClass(
                  "gioi_tinh"
                )}
              >
                <option value="">
                  Chưa cập nhật
                </option>

                {genders.map((gender) => (
                  <option
                    key={gender}
                    value={gender}
                  >
                    {gender}
                  </option>
                ))}
              </select>

              {renderFieldError(
                "gioi_tinh"
              )}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Ngày sinh
              </span>

              <input
                type="date"
                name="ngay_sinh"
                value={formData.ngay_sinh}
                onChange={handleChange}
                className={inputClass(
                  "ngay_sinh"
                )}
              />

              {renderFieldError("ngay_sinh")}
            </label>

            {isTeacherRole && (
              <>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    {userCodeLabel}
                  </span>

                  <input
                    type="text"
                    name="ma_giang_vien"
                    value={
                      formData.ma_giang_vien
                    }
                    onChange={handleChange}
                    placeholder="VD: GV0002"
                    className={inputClass(
                      "ma_giang_vien"
                    )}
                  />

                  {renderFieldError(
                    "ma_giang_vien"
                  )}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Phòng ban
                  </span>

                  <select
                    name="ma_phong_ban"
                    value={
                      formData.ma_phong_ban
                    }
                    onChange={handleChange}
                    className={inputClass(
                      "ma_phong_ban"
                    )}
                  >
                    <option value="">
                      Chọn phòng ban
                    </option>

                    {departments.map(
                      (department) => (
                        <option
                          key={department.id}
                          value={String(
                            department.id
                          )}
                        >
                          {department.department_name ||
                            department.ten_phong_ban ||
                            department.department_code ||
                            department.ma_phong_ban}
                        </option>
                      )
                    )}
                  </select>

                  {renderFieldError(
                    "ma_phong_ban"
                  )}
                </label>
              </>
            )}

            {isStudentRole && (
              <>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    {userCodeLabel}
                  </span>

                  <input
                    type="text"
                    name="ma_sinh_vien"
                    value={
                      formData.ma_sinh_vien
                    }
                    onChange={handleChange}
                    placeholder="VD: 0306231178"
                    className={inputClass(
                      "ma_sinh_vien"
                    )}
                  />

                  {renderFieldError(
                    "ma_sinh_vien"
                  )}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Niên khóa
                  </span>

                  <input
                    type="text"
                    name="nien_khoa"
                    value={formData.nien_khoa}
                    onChange={handleChange}
                    placeholder="VD: 2023-2026"
                    className={inputClass(
                      "nien_khoa"
                    )}
                  />

                  {renderFieldError(
                    "nien_khoa"
                  )}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Lớp học
                  </span>

                  <select
                    name="ma_lop"
                    value={formData.ma_lop}
                    onChange={handleChange}
                    className={inputClass(
                      "ma_lop"
                    )}
                  >
                    <option value="">
                      Chọn lớp học
                    </option>

                    {classes.map(
                      (classItem) => (
                        <option
                          key={classItem.id}
                          value={String(
                            classItem.id
                          )}
                        >
                          {classItem.ma_lop ||
                            classItem.class_code ||
                            classItem.ten_lop ||
                            classItem.class_name}
                        </option>
                      )
                    )}
                  </select>

                  {renderFieldError("ma_lop")}
                </label>
              </>
            )}

            {(isAdminRole ||
              isTechnicianRole) && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 lg:col-span-2">
                Vai trò này chỉ cần nhập thông
                tin tài khoản chung.
              </div>
            )}

            {generalError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 lg:col-span-2">
                {generalError}
              </div>
            )}

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
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={16} />
                )}

                {submitting
                  ? "Đang lưu..."
                  : "Lưu người dùng"}
              </button>
            </div>
          </form>
        </SectionCard>
      ) : (
        <SectionCard title="Nhập danh sách người dùng từ CSV">
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              File CSV cần có dòng đầu gồm các
              cột:{" "}
              <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">
                role,code,name,email,phone,password,course,classCode,departmentCode
              </code>

              <ul className="mt-2 list-disc pl-5">
                <li>
                  <strong>role</strong>: admin,
                  student, teacher hoặc technician
                </li>

                <li>
                  <strong>code</strong>: bắt buộc
                  với giảng viên và sinh viên
                </li>

                <li>
                  <strong>course</strong> và{" "}
                  <strong>classCode</strong>: chỉ
                  áp dụng cho sinh viên
                </li>

                <li>
                  <strong>
                    departmentCode
                  </strong>
                  : chỉ áp dụng cho giảng viên
                </li>
              </ul>
            </div>

            <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white text-sm text-slate-500 transition hover:border-blue-400 hover:bg-blue-50">
              <UploadCloud
                size={24}
                className="text-slate-400"
              />

              <span>
                Chọn file Excel hoặc CSV
              </span>

              <input
                type="file"
                accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
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
                      <th className="px-3 py-2">
                        Vai trò
                      </th>

                      <th className="px-3 py-2">
                        Mã
                      </th>

                      <th className="px-3 py-2">
                        Họ tên
                      </th>

                      <th className="px-3 py-2">
                        Email
                      </th>

                      <th className="px-3 py-2">
                        Niên khóa / Mã lớp
                      </th>

                      <th className="px-3 py-2">
                        Phòng ban
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {csvRows.map(
                      (row, index) => {
                        const rowRole =
                          normalizeRole(
                            row.role
                          );

                        return (
                          <tr
                            key={`${row.email}-${index}`}
                          >
                            <td className="px-3 py-2">
                              {row.role}
                            </td>

                            <td className="px-3 py-2">
                              {row.code}
                            </td>

                            <td className="px-3 py-2">
                              {row.name}
                            </td>

                            <td className="px-3 py-2">
                              {row.email}
                            </td>

                            <td className="px-3 py-2">
                              {rowRole ===
                              "student"
                                ? `${row.course || "-"} / ${row.classCode || "-"}`
                                : "-"}
                            </td>

                            <td className="px-3 py-2">
                              {rowRole ===
                              "teacher"
                                ? row.departmentCode ||
                                  "-"
                                : "-"}
                            </td>
                          </tr>
                        );
                      }
                    )}
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
                disabled={
                  !csvRows.length ||
                  submitting
                }
                onClick={handleImportCsv}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={16} />
                )}

                {submitting
                  ? "Đang nhập..."
                  : `Nhập ${csvRows.length || ""} tài khoản`}
              </button>
            </div>
          </div>
        </SectionCard>
      )}
    </AppShell>
  );
}