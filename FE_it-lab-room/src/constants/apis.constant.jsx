export const CONST_APIS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    GOOGLE_LOGIN: "/api/auth/google-login",
    ADMIN_LOGIN: "/api/auth/admin/login",
    STUDENT_LOGIN: "/api/auth/students/login",
    TEACHER_LOGIN: "/api/auth/teachers/login",
  },
  // Quản lý tài khoản người dùng
  USERS: {
    INDEX: "/api/admin/users",
    STORE: "/api/admin/users",
    IMPORT: "/api/admin/users/import",
    SHOW: (id) => `/api/admin/users/${id}`,
    UPDATE: (id) => `/api/admin/users/${id}`,
    TOGGLE_STATUS: (id) => `/api/admin/users/${id}/toggle-status`,
    RESET_PASSWORD: (id) => `/api/admin/users/${id}/reset-password`,
    DESTROY: (id) => `/api/admin/users/${id}`,
  },
  // Phòng ban (dropdown)
  DEPARTMENTS: {
    INDEX: "/api/admin/departments",
  },
  COMPUTER_IMPORTS: {
    INDEX: "/api/admin/computer-imports",
    STORE: "/api/admin/computer-imports",
    CODE: "/api/admin/computer-imports/code",
    SHOW: (id) => `/api/admin/computer-imports/${id}`,
  },
  ROOMS: {
    INDEX: "/api/admin/rooms",
    STORE: "/api/admin/rooms",
    SHOW: (id) => `/api/admin/rooms/${id}`,
    COMPUTERS: (id) => `/api/admin/rooms/${id}/computers`,
    UPDATE: (id) => `/api/admin/rooms/${id}`,
    DESTROY: (id) => `/api/admin/rooms/${id}`,
  },
  SUBJECTS: {
    INDEX: "/api/admin/subjects",
    STORE: "/api/admin/subjects",
    SHOW: (id) => `/api/admin/subjects/${id}`,
    UPDATE: (id) => `/api/admin/subjects/${id}`,
    DESTROY: (id) => `/api/admin/subjects/${id}`,
  },
  CLASSES: {
    INDEX: "/api/admin/classes",
    STORE: "/api/admin/classes",
    OPTIONS: "/api/admin/classes/options",
    SHOW: (id) => `/api/admin/classes/${id}`,
    STUDENTS: (id) => `/api/admin/classes/${id}/students`,
    STUDENT_OPTIONS: (id) => `/api/admin/classes/${id}/students/options`,
    STUDENT_DETAIL: (classId, studentId) => `/api/admin/classes/${classId}/students/${studentId}`,
    UPDATE: (id) => `/api/admin/classes/${id}`,
    DESTROY: (id) => `/api/admin/classes/${id}`,
  },
  ACADEMIC_YEARS: {
    INDEX: "/api/admin/academic-years",
    STORE: "/api/admin/academic-years",
    SHOW: (id) => `/api/admin/academic-years/${id}`,
    UPDATE: (id) => `/api/admin/academic-years/${id}`,
    DESTROY: (id) => `/api/admin/academic-years/${id}`,
  },
  COURSE_SECTIONS: {
    INDEX: "/api/admin/course-sections",
    STORE: "/api/admin/course-sections",
    OPTIONS: "/api/admin/course-sections/options",
    SHOW: (id) => `/api/admin/course-sections/${id}`,
    STUDENTS: (id) => `/api/admin/course-sections/${id}/students`,
    STUDENT_OPTIONS: (id) => `/api/admin/course-sections/${id}/students/options`,
    STUDENT_DETAIL: (courseSectionId, studentDetailId) => `/api/admin/course-sections/${courseSectionId}/students/${studentDetailId}`,
    STUDENT_BY_STUDENT: (courseSectionId, studentId) => `/api/admin/course-sections/${courseSectionId}/students/by-student/${studentId}`,
    UPDATE: (id) => `/api/admin/course-sections/${id}`,
    DESTROY: (id) => `/api/admin/course-sections/${id}`,
  },
  SCHEDULES: {
    INDEX: "/api/admin/computer-lab-schedules",
    STORE: "/api/admin/computer-lab-schedules",
    IMPORT: "/api/admin/computer-lab-schedules/import",
    OPTIONS: "/api/admin/computer-lab-schedules/options",
    SHOW: (id) => `/api/admin/computer-lab-schedules/${id}`,
    UPDATE: (id) => `/api/admin/computer-lab-schedules/${id}`,
    DESTROY: (id) => `/api/admin/computer-lab-schedules/${id}`,
  },
  TEACHER_SCHEDULES: {
    INDEX: "/api/teacher/computer-lab-schedules",
  },
  TEACHER_ROOM_BOOKINGS: {
    INDEX: "/api/teacher/room-bookings",
    STORE: "/api/teacher/room-bookings",
    AVAILABILITY: "/api/teacher/room-bookings/availability",
    CANCEL: (id) => `/api/teacher/room-bookings/${id}/cancel`,
  },
  TEACHER_ATTENDANCE: {
    SCHEDULE: (scheduleId) => `/api/teacher/attendance/schedules/${scheduleId}`,
  },
  ADMIN_ROOM_BOOKINGS: {
    INDEX: "/api/admin/room-bookings",
    UPDATE: (id) => `/api/admin/room-bookings/${id}`,
  },
  STUDENT_SCHEDULES: {
    INDEX: "/api/student/computer-lab-schedules",
  },
  STUDENT_ATTENDANCE: {
    SCHEDULE: (scheduleId) => `/api/student/attendance/schedules/${scheduleId}`,
    CHECK_IN: (scheduleId) => `/api/student/attendance/schedules/${scheduleId}/check-in`,
  },
  COMPUTERS: {
    INDEX: "/api/admin/computers",
    SHOW: (id) => `/api/admin/computers/${id}`,
    GENERATE_QR_CODE: (id) => `/api/admin/computers/${id}/qr-code`,
    UPDATE: (id) => `/api/admin/computers/${id}`,
    DESTROY: (id) => `/api/admin/computers/${id}`,
  },
  COMPUTER_TRANSFERS: {
    INDEX: "/api/admin/computer-transfers",
    STORE: "/api/admin/computer-transfers",
  },
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || "";
