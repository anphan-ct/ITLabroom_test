import { CONST_APIS } from "../constants/apis.constant";
import { CONST_METHODS } from "../constants/methods.constant";
import { fetcher } from "../helpers/fetcher.helper";

export function getTeacherScheduleAttendanceFromApi(scheduleId) {
  return fetcher(CONST_APIS.TEACHER_ATTENDANCE.SCHEDULE(scheduleId), {
    method: CONST_METHODS.GET,
  });
}

export function updateTeacherAttendanceStatusFromApi(scheduleId, attendanceStatus) {
  return fetcher(CONST_APIS.TEACHER_ATTENDANCE.UPDATE_STATUS(scheduleId), {
    method: CONST_METHODS.PATCH,
    body: { attendance_status: attendanceStatus },
  });
}

export function checkInTeacherStudentAttendanceFromApi(scheduleId, studentId, payload) {
  return fetcher(CONST_APIS.TEACHER_ATTENDANCE.CHECK_IN_STUDENT(scheduleId, studentId), {
    method: CONST_METHODS.POST,
    body: {
      ...payload,
      note: payload?.note || "Giảng viên điểm danh hộ",
    },
  });
}

export function getStudentScheduleAttendanceFromApi(scheduleId) {
  return fetcher(CONST_APIS.STUDENT_ATTENDANCE.SCHEDULE(scheduleId), {
    method: CONST_METHODS.GET,
  });
}

export function checkInStudentAttendanceFromApi(scheduleId, payload) {
  return fetcher(CONST_APIS.STUDENT_ATTENDANCE.CHECK_IN(scheduleId), {
    method: CONST_METHODS.POST,
    body: payload,
  });
}
