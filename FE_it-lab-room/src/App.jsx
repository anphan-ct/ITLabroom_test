import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./components/common/Login.jsx";
import { ProtectedRoute, PublicOnlyAnyRoute } from "./components/common/ProtectedRoute.jsx";
import AdminDashboard from "./components/pages/admin/AdminDashboard.jsx";
import UsersPage from "./components/pages/admin/UsersPage.jsx";
import UserFormPage from "./components/pages/admin/UserFormPage.jsx";
import ClassesPage from "./components/pages/admin/ClassesPage.jsx";
import ClassFormPage from "./components/pages/admin/ClassFormPage.jsx";
import ClassStudentsPage from "./components/pages/admin/ClassStudentsPage.jsx";
import SubjectsPage from "./components/pages/admin/SubjectsPage.jsx";
import SubjectFormPage from "./components/pages/admin/SubjectFormPage.jsx";
import RoomsPage from "./components/pages/admin/RoomsPage.jsx";
import RoomFormPage from "./components/pages/admin/RoomFormPage.jsx";
import RoomComputersPage from "./components/pages/admin/RoomComputersPage.jsx";
import ComputerDetailPage from "./components/pages/admin/ComputerDetailPage.jsx";
import ComputersPage from "./components/pages/admin/ComputersPage.jsx";
import ComputerCreatePage from "./components/pages/admin/ComputerCreatePage.jsx";
import MaintenancePage from "./components/pages/admin/MaintenancePage.jsx";
import MaintenanceTicketsPage from "./components/pages/admin/MaintenanceTicketsPage.jsx";
import SchedulesPage from "./components/pages/admin/SchedulesPage.jsx";
import ScheduleFormPage from "./components/pages/admin/ScheduleFormPage.jsx";
import LoanRequestsManagePage from "./components/pages/teacher/LoanRequestsManagePage.jsx";
import LoanReturnLayoutPage from "./components/pages/admin/LoanReturnLayoutPage.jsx";
import LoanRequestsTab from "./components/pages/admin/LoanRequestsTab.jsx";
import ReturnRequestsTab from "./components/pages/admin/ReturnRequestsTab.jsx";
import RoomBookingsManagePage from "./components/pages/admin/RoomBookingsManagePage.jsx";
import ComputerImportDetailPage from "./components/pages/admin/ComputerImportDetailPage.jsx";
import ComputerImportsPage from "./components/pages/admin/ComputerImportsPage.jsx";
import ComputerReturnDetailsPage from "./components/pages/admin/ComputerReturnDetailsPage.jsx";
import ComputerReturnsPage from "./components/pages/teacher/ComputerReturnsPage.jsx";
import ComputerTransfersPage from "./components/pages/admin/ComputerTransfersPage.jsx";
import CourseSectionsPage from "./components/pages/admin/CourseSectionsPage.jsx";
import CourseSectionFormPage from "./components/pages/admin/CourseSectionFormPage.jsx";
import CourseSectionStudentsPage from "./components/pages/admin/CourseSectionStudentsPage.jsx";
import AcademicYearsPage from "./components/pages/admin/AcademicYearsPage.jsx";
import AcademicYearFormPage from "./components/pages/admin/AcademicYearFormPage.jsx";
import AcademicYearWeeksPage from "./components/pages/admin/AcademicYearWeeksPage.jsx";
import LoanDetailsPage from "./components/pages/admin/LoanDetailsPage.jsx";
import RepairLogsPage from "./components/pages/admin/RepairLogsPage.jsx";

import TeacherSchedulePage from "./components/pages/teacher/TeacherSchedulePage.jsx";
import AttendancePage from "./components/pages/teacher/AttendancePage.jsx";
import TeacherScheduleAttendancePage from "./components/pages/teacher/TeacherScheduleAttendancePage.jsx";
import RoomBookingPage from "./components/pages/teacher/RoomBookingPage.jsx";
import IncidentPage from "./components/common/IncidentPage.jsx";

import StudentSchedulePage from "./components/pages/student/StudentSchedulePage.jsx";
import StudentIncidentPage from "./components/pages/student/StudentIncidentPage.jsx";
import StudentAttendancePage from "./components/pages/student/StudentAttendancePage.jsx";
import StudentAttendanceDetailPage from "./components/pages/student/StudentAttendanceDetailPage.jsx";
import StudentAttendanceClassHistoryPage from "./components/pages/student/StudentAttendanceClassHistoryPage.jsx";
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<PublicOnlyAnyRoute><Login /></PublicOnlyAnyRoute>} />

      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute role="admin"><UsersPage /></ProtectedRoute>} />
      <Route path="/admin/users/create" element={<ProtectedRoute role="admin"><UserFormPage /></ProtectedRoute>} />
      <Route path="/admin/users/:userId/edit" element={<ProtectedRoute role="admin"><UserFormPage /></ProtectedRoute>} />
      <Route path="/admin/users/students" element={<ProtectedRoute role="admin"><UsersPage type="students" /></ProtectedRoute>} />
      <Route path="/admin/users/students/create" element={<ProtectedRoute role="admin"><UserFormPage defaultRole="Sinh viên" /></ProtectedRoute>} />
      <Route path="/admin/users/teachers" element={<ProtectedRoute role="admin"><UsersPage type="teachers" /></ProtectedRoute>} />
      <Route path="/admin/users/teachers/create" element={<ProtectedRoute role="admin"><UserFormPage defaultRole="Giảng viên" /></ProtectedRoute>} />
      <Route path="/admin/courses/*" element={<ProtectedRoute role="admin"><Navigate to="/admin/classes" replace /></ProtectedRoute>} />
      <Route path="/admin/classes" element={<ProtectedRoute role="admin"><ClassesPage /></ProtectedRoute>} />
      <Route path="/admin/classes/create" element={<ProtectedRoute role="admin"><ClassFormPage /></ProtectedRoute>} />
      <Route path="/admin/classes/:classId/edit" element={<ProtectedRoute role="admin"><ClassFormPage /></ProtectedRoute>} />
      <Route path="/admin/classes/:classId/students" element={<ProtectedRoute role="admin"><ClassStudentsPage /></ProtectedRoute>} />
      <Route path="/admin/subjects" element={<ProtectedRoute role="admin"><SubjectsPage /></ProtectedRoute>} />
      <Route path="/admin/subjects/create" element={<ProtectedRoute role="admin"><SubjectFormPage /></ProtectedRoute>} />
      <Route path="/admin/subjects/:subjectId/edit" element={<ProtectedRoute role="admin"><SubjectFormPage /></ProtectedRoute>} />
      <Route path="/admin/academic-years" element={<ProtectedRoute role="admin"><AcademicYearsPage /></ProtectedRoute>} />
      <Route path="/admin/academic-years/create" element={<ProtectedRoute role="admin"><AcademicYearFormPage /></ProtectedRoute>} />
      <Route path="/admin/academic-years/:academicYearId/weeks" element={<ProtectedRoute role="admin"><AcademicYearWeeksPage /></ProtectedRoute>} />
      <Route path="/admin/academic-years/:academicYearId/edit" element={<ProtectedRoute role="admin"><AcademicYearFormPage /></ProtectedRoute>} />
      <Route path="/admin/rooms" element={<ProtectedRoute role="admin"><RoomsPage /></ProtectedRoute>} />
      <Route path="/admin/rooms/create" element={<ProtectedRoute role="admin"><RoomFormPage /></ProtectedRoute>} />
      <Route path="/admin/rooms/:roomId/edit" element={<ProtectedRoute role="admin"><RoomFormPage /></ProtectedRoute>} />
      <Route path="/admin/rooms/:roomId/computers" element={<ProtectedRoute role="admin"><RoomComputersPage /></ProtectedRoute>} />
      <Route path="/admin/computers" element={<ProtectedRoute role="admin"><ComputersPage /></ProtectedRoute>} />
      <Route path="/admin/computers/:computerId" element={<ProtectedRoute role="admin"><ComputerDetailPage /></ProtectedRoute>} />
      <Route path="/admin/computers/create" element={<ProtectedRoute role="admin"><ComputerCreatePage /></ProtectedRoute>} />
      <Route path="/admin/computers/:computerId/edit" element={<ProtectedRoute role="admin"><ComputerCreatePage /></ProtectedRoute>} />
      <Route path="/admin/maintenance" element={<ProtectedRoute role="admin"><MaintenancePage /></ProtectedRoute>} />
      <Route path="/admin/maintenance-tickets" element={<ProtectedRoute role="admin"><MaintenanceTicketsPage /></ProtectedRoute>} />
      <Route path="/admin/schedules" element={<ProtectedRoute role="admin"><SchedulesPage /></ProtectedRoute>} />
      <Route path="/admin/schedules/create" element={<ProtectedRoute role="admin"><ScheduleFormPage /></ProtectedRoute>} />
      <Route path="/admin/schedules/:scheduleId/edit" element={<ProtectedRoute role="admin"><ScheduleFormPage /></ProtectedRoute>} />
      <Route path="/admin/computer-imports" element={<ProtectedRoute role="admin"><ComputerImportsPage /></ProtectedRoute>} />
      <Route path="/admin/computer-imports/:importId" element={<ProtectedRoute role="admin"><ComputerImportDetailPage /></ProtectedRoute>} />
      <Route
        path="/admin/loan-approvals"
        element={<ProtectedRoute role="admin"><Navigate to="/admin/loan-return/loans" replace /></ProtectedRoute>}
      />
      <Route
        path="/admin/return-approvals"
        element={<ProtectedRoute role="admin"><Navigate to="/admin/loan-return/returns" replace /></ProtectedRoute>}
      />
      <Route path="/admin/loan-return" element={<ProtectedRoute role="admin"><LoanReturnLayoutPage /></ProtectedRoute>}>
        <Route index element={<Navigate to="loans" replace />} />
        <Route path="loans" element={<LoanRequestsTab />} />
        <Route path="returns" element={<ReturnRequestsTab />} />
      </Route>
      <Route
        path="/admin/room-bookings"
        element={<ProtectedRoute role="admin"><RoomBookingsManagePage /></ProtectedRoute>}
      />
      <Route path="/admin/course-sections" element={<ProtectedRoute role="admin"><CourseSectionsPage /></ProtectedRoute>} />
      <Route path="/admin/course-sections/create" element={<ProtectedRoute role="admin"><CourseSectionFormPage /></ProtectedRoute>} />
      <Route path="/admin/course-sections/:courseSectionId/edit" element={<ProtectedRoute role="admin"><CourseSectionFormPage /></ProtectedRoute>} />
      <Route path="/admin/course-sections/:courseSectionId/students" element={<ProtectedRoute role="admin"><CourseSectionStudentsPage /></ProtectedRoute>} />
      <Route path="/admin/repair-logs" element={<ProtectedRoute role="admin"><RepairLogsPage /></ProtectedRoute>} />
      <Route path="/admin/computer-transfers" element={<ProtectedRoute role="admin"><ComputerTransfersPage /></ProtectedRoute>} />
      <Route path="/teacher" element={<ProtectedRoute role="teacher"><Navigate to="/teacher/schedules" replace /></ProtectedRoute>} />
      <Route path="/teacher/schedules" element={<ProtectedRoute role="teacher"><TeacherSchedulePage /></ProtectedRoute>} />
      <Route path="/teacher/attendance" element={<ProtectedRoute role="teacher"><AttendancePage /></ProtectedRoute>} />
      <Route path="/teacher/attendance/schedules/:scheduleId" element={<ProtectedRoute role="teacher"><TeacherScheduleAttendancePage /></ProtectedRoute>} />
      <Route path="/teacher/loan-requests" element={<ProtectedRoute role="teacher"><LoanRequestsManagePage /></ProtectedRoute>} />
      <Route path="/teacher/loan-details" element={<ProtectedRoute role="teacher"><LoanDetailsPage /></ProtectedRoute>} />
      <Route path="/teacher/computer-returns" element={<ProtectedRoute role="teacher"><ComputerReturnsPage /></ProtectedRoute>} />
      <Route path="/teacher/computer-return-details" element={<ProtectedRoute role="teacher"><ComputerReturnDetailsPage /></ProtectedRoute>} />
      <Route
        path="/teacher/incidents"
        element={
          <ProtectedRoute role="teacher">
            <IncidentPage
              role="teacher"
              title="Báo cáo sự cố"
              subtitle="Giảng viên gửi lỗi máy tính hoặc thiết bị"
              sectionTitle="Tạo báo cáo sự cố mới"
            />
          </ProtectedRoute>
        }
      />
      <Route path="/teacher/bookings" element={<ProtectedRoute role="teacher"><RoomBookingPage /></ProtectedRoute>} />

      <Route path="/student" element={<ProtectedRoute role="student"><Navigate to="/student/schedules" replace /></ProtectedRoute>} />
      <Route path="/student/schedules" element={<ProtectedRoute role="student"><StudentSchedulePage /></ProtectedRoute>} />
      <Route path="/student/computers" element={<ProtectedRoute role="student"><Navigate to="/student/incidents" replace /></ProtectedRoute>} />
      <Route path="/student/incidents" element={<ProtectedRoute role="student"><StudentIncidentPage /></ProtectedRoute>} />
      <Route path="/student/attendance" element={<ProtectedRoute role="student"><StudentAttendancePage /></ProtectedRoute>} />
      <Route path="/student/attendance/history" element={<ProtectedRoute role="student"><Navigate to="/student/attendance" replace /></ProtectedRoute>} />
      <Route path="/student/attendance/history/:classCode" element={<ProtectedRoute role="student"><StudentAttendanceClassHistoryPage /></ProtectedRoute>} />
      <Route path="/student/attendance/:scheduleId" element={<ProtectedRoute role="student"><StudentAttendanceDetailPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
