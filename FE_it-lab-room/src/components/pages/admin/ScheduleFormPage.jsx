import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Save } from "lucide-react";
import AppShell from "../../common/AppShell";
import SectionCard from "../../common/SectionCard";
import {
  createComputerLabScheduleFromApi,
  getComputerLabScheduleFromApi,
  getComputerLabScheduleOptionsFromApi,
  updateComputerLabScheduleFromApi,
} from "../../../services/schedules.service";

const scheduleTypes = [
  { label: "Lý thuyết", value: "LyThuyet" },
  { label: "Thực hành", value: "ThucHanh" },
];

const lessonOptions = Array.from({ length: 12 }, (_, index) => index + 1);

const initialForm = {
  studyDate: "",
  day: "",
  roomId: "",
  classId: "",
  courseSectionId: "",
  teacherId: "",
  weekId: "",
  lessonStart: 1,
  lessonEnd: 3,
  scheduleType: "ThucHanh",
  bookingRequestId: "",
  status: "scheduled",
  note: "",
};

const emptyOptions = {
  rooms: [],
  classes: [],
  course_sections: [],
  teachers: [],
  weeks: [],
};

function getDayLabel(dateValue) {
  if (!dateValue) return "";

  const labels = [
    "Chủ nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];

  return labels[new Date(`${dateValue}T00:00:00`).getDay()];
}

function mapHistoryToForm(history) {
  return {
    studyDate: history.ngay_hoc_cu_the || "",
    day: history.thu_trong_tuan || "",
    roomId: String(history.ma_phong || ""),
    classId: String(history.ma_lop || ""),
    courseSectionId: String(history.ma_lop_hoc_phan || ""),
    teacherId: String(history.ma_giang_vien || ""),
    weekId: String(history.ma_tuan || ""),
    lessonStart: history.so_tiet_bat_dau || 1,
    lessonEnd: history.so_tiet_ket_thuc || 1,
    scheduleType: history.loai_lich || "ThucHanh",
    bookingRequestId: String(history.ma_dat_phong_may || ""),
    status: history.trang_thai || "scheduled",
    note: history.ghi_chu || "",
  };
}

function getCourseSectionRelatedData(options, courseSectionId) {
  return options.course_sections.find(
    (courseSection) => String(courseSection.id) === String(courseSectionId)
  );
}

function findWeekByDate(weeks, dateValue) {
  if (!dateValue) return null;

  return weeks.find(
    (week) => dateValue >= week.start_date && dateValue <= week.end_date
  );
}

function getInitialFormFromOptions(options) {
  const firstCourseSection = options.course_sections[0];
  const firstRoomId = firstCourseSection?.room_id || options.rooms[0]?.id || "";
  const firstTeacherId =
    firstCourseSection?.teacher_id || options.teachers[0]?.id || "";

  return {
    ...initialForm,
    roomId: String(firstRoomId),
    classId: String(firstCourseSection?.class_id || ""),
    courseSectionId: String(firstCourseSection?.id || ""),
    teacherId: String(firstTeacherId),
  };
}

function getApiErrorMessage(error) {
  const validationErrors = error.payload?.data;

  if (validationErrors && typeof validationErrors === "object") {
    const firstMessages = Object.values(validationErrors)[0];

    if (Array.isArray(firstMessages) && firstMessages[0]) {
      return firstMessages[0];
    }
  }

  return error.message || "Không thể lưu lịch phòng máy.";
}

function FloatingField({ label, required = false, children, className = "" }) {
  return (
    <label className={`relative block pt-2 ${className}`}>
      <span className="absolute left-4 top-0 z-10 bg-white px-2 text-sm font-semibold text-slate-500">
        {label}
        {required ? " (*)" : ""}
      </span>
      {children}
    </label>
  );
}

const controlClassName =
  "h-16 w-full rounded-2xl border border-slate-300 bg-white px-5 text-base font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function ScheduleFormPage() {
  const navigate = useNavigate();
  const { scheduleId } = useParams();
  const isEditing = Boolean(scheduleId);

  const [formData, setFormData] = useState(initialForm);
  const [options, setOptions] = useState(emptyOptions);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const requests = [getComputerLabScheduleOptionsFromApi()];

    if (isEditing) {
      requests.push(getComputerLabScheduleFromApi(scheduleId));
    }

    Promise.all(requests)
      .then(([optionsResponse, historyResponse]) => {
        if (!isMounted) return;

        const nextOptions = optionsResponse.data || emptyOptions;
        setOptions(nextOptions);

        if (isEditing) {
          const mappedForm = mapHistoryToForm(historyResponse.data);
          const relatedCourseSection = getCourseSectionRelatedData(
            nextOptions,
            mappedForm.courseSectionId
          );

          setFormData({
            ...mappedForm,
            classId: String(
              relatedCourseSection?.class_id || mappedForm.classId || ""
            ),
            teacherId: String(
              mappedForm.teacherId ||
                relatedCourseSection?.teacher_id ||
                nextOptions.teachers[0]?.id ||
                ""
            ),
          });

          return;
        }

        setFormData(getInitialFormFromOptions(nextOptions));
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(apiError.message || "Không thể tải dữ liệu lịch phòng máy.");
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
  }, [isEditing, scheduleId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const numericFields = ["lessonStart", "lessonEnd"];

    setFormData((currentData) => {
      const nextData = {
        ...currentData,
        [name]: numericFields.includes(name) ? Number(value) : value,
      };

      if (name === "studyDate") {
        const matchedWeek = findWeekByDate(options.weeks, value);

        nextData.day = getDayLabel(value);
        nextData.weekId = matchedWeek ? String(matchedWeek.id) : "";
      }

      if (name === "courseSectionId") {
        const matchedCourseSection = getCourseSectionRelatedData(
          options,
          value
        );

        nextData.classId = String(matchedCourseSection?.class_id || "");
        nextData.teacherId = String(
          matchedCourseSection?.teacher_id ||
            currentData.teacherId ||
            options.teachers[0]?.id ||
            ""
        );
        nextData.roomId = String(
          matchedCourseSection?.room_id || currentData.roomId || ""
        );
      }

      return nextData;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const weekId = formData.weekId;

    if (
      !formData.studyDate ||
      !formData.day ||
      !formData.roomId ||
      !formData.courseSectionId ||
      !formData.teacherId
    ) {
      setError(
        "Vui lòng nhập đầy đủ lớp học phần, phòng máy, giảng viên và ngày học."
      );
      return;
    }

    if (!weekId) {
      setError(
        "Ngày học chưa thuộc tuần nào. Vui lòng chọn ngày nằm trong tuần đã có."
      );
      return;
    }

    if (
      Number(formData.lessonStart) < 1 ||
      Number(formData.lessonEnd) > 12 ||
      Number(formData.lessonStart) > Number(formData.lessonEnd)
    ) {
      setError(
        "Khoảng tiết phải từ tiết 1 đến tiết 12 và tiết bắt đầu không được lớn hơn tiết kết thúc."
      );
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const payload = {
        ma_phong: Number(formData.roomId),
        ma_lop: formData.classId ? Number(formData.classId) : null,
        ma_lop_hoc_phan: Number(formData.courseSectionId),
        ma_giang_vien: Number(formData.teacherId),
        ma_tuan: Number(weekId),
        ngay_hoc_cu_the: formData.studyDate,
        thu_trong_tuan: formData.day,
        so_tiet_bat_dau: Number(formData.lessonStart),
        so_tiet_ket_thuc: Number(formData.lessonEnd),
        loai_lich: formData.scheduleType,
        ma_dat_phong_may: formData.bookingRequestId
          ? Number(formData.bookingRequestId)
          : null,
        trang_thai: formData.status,
        ghi_chu: formData.note || null,
      };

      if (isEditing) {
        await updateComputerLabScheduleFromApi(scheduleId, payload);
      } else {
        await createComputerLabScheduleFromApi(payload);
      }

      navigate("/admin/schedules");
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell
      role="admin"
      title={isEditing ? "Sửa lịch phòng máy" : "Thêm lịch phòng thủ công"}
      subtitle="Tạo lịch sử dụng phòng máy theo lớp học phần, phòng và khoảng tiết"
    >
      <SectionCard
        title={isEditing ? "Cập nhật lịch phòng" : "Thêm lịch phòng thủ công"}
      >
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
            Đang tải dữ liệu lịch phòng máy...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto grid max-w-4xl gap-5">
            <FloatingField label="Lớp học phần" required>
              <select
                name="courseSectionId"
                value={formData.courseSectionId}
                onChange={handleChange}
                className={`${controlClassName} border-blue-500 ring-2 ring-blue-100`}
              >
                <option value="">Chọn lớp học phần</option>
                {options.course_sections.map((courseSection) => (
                  <option key={courseSection.id} value={courseSection.id}>
                    {courseSection.code} - {courseSection.subject}
                  </option>
                ))}
              </select>
            </FloatingField>

            <FloatingField label="Phòng máy" required>
              <select
                name="roomId"
                value={formData.roomId}
                onChange={handleChange}
                className={controlClassName}
              >
                <option value="">Chọn phòng máy</option>
                {options.rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.code} - {room.name}
                  </option>
                ))}
              </select>
            </FloatingField>

            <FloatingField label="Ngày học" required>
              <input
                type="date"
                name="studyDate"
                value={formData.studyDate}
                onChange={handleChange}
                className={controlClassName}
              />
            </FloatingField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FloatingField label="Tiết bắt đầu">
                <select
                  name="lessonStart"
                  value={formData.lessonStart}
                  onChange={handleChange}
                  className={controlClassName}
                >
                  {lessonOptions.map((lesson) => (
                    <option key={lesson} value={lesson}>
                      Tiết {lesson}
                    </option>
                  ))}
                </select>
              </FloatingField>

              <FloatingField label="Tiết kết thúc">
                <select
                  name="lessonEnd"
                  value={formData.lessonEnd}
                  onChange={handleChange}
                  className={controlClassName}
                >
                  {lessonOptions.map((lesson) => (
                    <option key={lesson} value={lesson}>
                      Tiết {lesson}
                    </option>
                  ))}
                </select>
              </FloatingField>
            </div>

            <FloatingField label="Loại lịch">
              <select
                name="scheduleType"
                value={formData.scheduleType}
                onChange={handleChange}
                className={controlClassName}
              >
                {scheduleTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </FloatingField>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            )}

            <div className="grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-[1fr_auto]">
              <Link
                to="/admin/schedules"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </Link>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 text-sm font-bold uppercase text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <Save size={16} />
                {isSaving ? "Đang lưu" : "Lưu lịch phòng"}
              </button>
            </div>
          </form>
        )}
      </SectionCard>
    </AppShell>
  );
}
