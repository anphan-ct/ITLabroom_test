<?php

use App\Http\Controllers\admin\AcademicYearController;
use App\Http\Controllers\admin\AuthController as AdminAuthController;
use App\Http\Controllers\admin\ClassStudentController;
use App\Http\Controllers\admin\ComputerController;
use App\Http\Controllers\admin\ComputerImportController;
use App\Http\Controllers\admin\ComputerLabScheduleController;
use App\Http\Controllers\admin\ComputerTransferController;
use App\Http\Controllers\admin\CourseSectionController;
use App\Http\Controllers\admin\CourseSectionStudentController;
use App\Http\Controllers\admin\DepartmentController;
use App\Http\Controllers\admin\IncidentReportController as AdminIncidentReportController;
use App\Http\Controllers\admin\LoanRequestController as AdminLoanRequestController;
use App\Http\Controllers\admin\MaintenanceTicketController as AdminMaintenanceTicketController;
use App\Http\Controllers\admin\RepairLogController as AdminRepairLogController;
use App\Http\Controllers\admin\ReturnRequestController as AdminReturnRequestController;
use App\Http\Controllers\admin\RoomBookingController as AdminRoomBookingController;
use App\Http\Controllers\admin\RoomController;
use App\Http\Controllers\admin\SchoolClassController;
use App\Http\Controllers\admin\SubjectController;
use App\Http\Controllers\admin\UserController;
use App\Http\Controllers\common\AuthController as CommonAuthController;
use App\Http\Controllers\common\IncidentReportController as CommonIncidentReportController;
use App\Http\Controllers\student\AttendanceController as StudentAttendanceController;
use App\Http\Controllers\student\AuthController as StudentAuthController;
use App\Http\Controllers\student\ComputerLabScheduleController as StudentComputerLabScheduleController;
use App\Http\Controllers\teacher\AttendanceController as TeacherAttendanceController;
use App\Http\Controllers\teacher\AuthController as TeacherAuthController;
use App\Http\Controllers\teacher\ComputerLabScheduleController as TeacherComputerLabScheduleController;
use App\Http\Controllers\teacher\RoomBookingController as TeacherRoomBookingController;
use Illuminate\Support\Facades\Route;

// Nhóm API đăng nhập chuẩn RESTful cho admin, sinh viên và giảng viên.
Route::prefix('auth')->group(function () {
    // Endpoint chung cho giao diện đăng nhập gộp.
    Route::post('/login', [CommonAuthController::class, 'login']);
    Route::post('/google-login', [CommonAuthController::class, 'googleLogin']);

    // Login.
    Route::post('/admin/login', [AdminAuthController::class, 'login']);
    Route::post('/students/login', [StudentAuthController::class, 'login']);
    Route::post('/teachers/login', [TeacherAuthController::class, 'login']);

    // Google login.
    Route::post('/admin/google-login', [AdminAuthController::class, 'googleLogin']);
    Route::post('/students/google-login', [StudentAuthController::class, 'googleLogin']);
    Route::post('/teachers/google-login', [TeacherAuthController::class, 'googleLogin']);
});

// API tra cứu thông tin máy tính sau khi app mobile quét mã QR.
Route::get('/scan/{qrCode}', [ComputerController::class, 'showByQrCode']);
Route::middleware('auth:sanctum')->get('/computers/qr/{qrCode}', [ComputerController::class, 'showByQrCode']);

// Lịch giảng dạy và lịch học được lọc theo tài khoản đăng nhập dành cho giảng viên.
Route::middleware(['auth:sanctum', 'abilities:teacher'])->group(function () {
    Route::get('/teacher/computer-lab-schedules', [TeacherComputerLabScheduleController::class, 'index']);
    Route::get('/teacher/attendance/schedules/{computerLabSchedule}', [TeacherAttendanceController::class, 'showBySchedule']);
    Route::patch('/teacher/attendance/schedules/{computerLabSchedule}/status', [TeacherAttendanceController::class, 'updateStatus']);
    Route::post('/teacher/attendance/schedules/{computerLabSchedule}/students/{student}/check-in', [TeacherAttendanceController::class, 'checkInStudent']);
    Route::get('/teacher/room-bookings', [TeacherRoomBookingController::class, 'index']);
    Route::get('/teacher/room-bookings/availability', [TeacherRoomBookingController::class, 'availability']);
    Route::post('/teacher/room-bookings', [TeacherRoomBookingController::class, 'store']);
    Route::patch('/teacher/room-bookings/{id}/cancel', [TeacherRoomBookingController::class, 'cancel']);

    // Báo cáo sự cố của giảng viên.
    Route::get('/teacher/incident-reports', [CommonIncidentReportController::class, 'index']);
    Route::post('/teacher/incident-reports', [CommonIncidentReportController::class, 'store']);

    // Phòng máy và máy tính/thiết bị chỉ đọc, dùng cho form báo cáo sự cố.
    Route::get('/teacher/rooms', [RoomController::class, 'index']);
    Route::get('/teacher/rooms/{room}/computers', [RoomController::class, 'computers']);
});

// Nhóm API dành cho sinh viên.
Route::middleware(['auth:sanctum', 'abilities:student'])->group(function () {
    Route::get('/student/computer-lab-schedules', [StudentComputerLabScheduleController::class, 'index']);
    Route::get('/student/attendance/schedules/{computerLabSchedule}', [StudentAttendanceController::class, 'showBySchedule']);
    Route::post('/student/attendance/schedules/{computerLabSchedule}/check-in', [StudentAttendanceController::class, 'checkIn']);

    // Báo cáo sự cố của sinh viên.
    Route::get('/student/incident-reports', [CommonIncidentReportController::class, 'index']);
    Route::post('/student/incident-reports', [CommonIncidentReportController::class, 'store']);

    // Phòng máy và máy tính/thiết bị chỉ đọc, dùng cho form báo cáo sự cố.
    Route::get('/student/rooms', [RoomController::class, 'index']);
    Route::get('/student/rooms/{room}/computers', [RoomController::class, 'computers']);
});

// Nhóm API dành cho admin.
Route::middleware(['auth:sanctum', 'abilities:admin'])->group(function () {
    // Nhóm API quản lý tài khoản người dùng.
    Route::prefix('admin/users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::post('/import', [UserController::class, 'import']);
        Route::get('/roles', [UserController::class, 'getRoles']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::patch('/{user}/toggle-status', [UserController::class, 'toggleStatus']);
        Route::patch('/{user}/reset-password', [UserController::class, 'resetPassword']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
    });

    // API lấy danh sách phòng ban cho dropdown.
    Route::get('admin/departments', [DepartmentController::class, 'index']);

    // Nhóm API duyệt yêu cầu đặt phòng.
    Route::prefix('admin/room-bookings')->group(function () {
        Route::get('/', [AdminRoomBookingController::class, 'index']);
        Route::patch('/{roomBooking}', [AdminRoomBookingController::class, 'update']);
    });

    // Nhóm API quản trị lớp học và xem sinh viên theo từng lớp.
    Route::prefix('admin/classes')->group(function () {
        Route::get('/', [SchoolClassController::class, 'index']);
        Route::post('/', [SchoolClassController::class, 'store']);
        Route::get('/options', [SchoolClassController::class, 'options']);
        Route::get('/{class}/students/options', [ClassStudentController::class, 'options']);
        Route::get('/{class}/students', [ClassStudentController::class, 'index']);
        Route::post('/{class}/students', [ClassStudentController::class, 'store']);
        Route::put('/{class}/students/{student}', [ClassStudentController::class, 'update']);
        Route::delete('/{class}/students/{student}', [ClassStudentController::class, 'destroy']);
        Route::get('/{class}', [SchoolClassController::class, 'show']);
        Route::put('/{class}', [SchoolClassController::class, 'update']);
        Route::delete('/{class}', [SchoolClassController::class, 'destroy']);
    });

    // Nhóm API quản trị năm học.
    Route::prefix('admin/academic-years')->group(function () {
        Route::get('/', [AcademicYearController::class, 'index']);
        Route::post('/', [AcademicYearController::class, 'store']);
        Route::get('/{academicYear}', [AcademicYearController::class, 'show']);
        Route::put('/{academicYear}', [AcademicYearController::class, 'update']);
        Route::delete('/{academicYear}', [AcademicYearController::class, 'destroy']);
    });

    // Nhóm API quản trị lớp học phần và phân công giảng viên.
    Route::prefix('admin/course-sections')->group(function () {
        Route::get('/', [CourseSectionController::class, 'index']);
        Route::post('/', [CourseSectionController::class, 'store']);
        Route::get('/options', [CourseSectionController::class, 'options']);
        Route::get('/{courseSection}/students/options', [CourseSectionStudentController::class, 'options']);
        Route::get('/{courseSection}/students', [CourseSectionStudentController::class, 'index']);
        Route::post('/{courseSection}/students', [CourseSectionStudentController::class, 'store']);
        Route::delete('/{courseSection}/students/by-student/{student}', [CourseSectionStudentController::class, 'destroyByStudent']);
        Route::put('/{courseSection}/students/{courseSectionStudent}', [CourseSectionStudentController::class, 'update']);
        Route::delete('/{courseSection}/students/{courseSectionStudent}', [CourseSectionStudentController::class, 'destroy']);
        Route::get('/{courseSection}', [CourseSectionController::class, 'show']);
        Route::put('/{courseSection}', [CourseSectionController::class, 'update']);
        Route::delete('/{courseSection}', [CourseSectionController::class, 'destroy']);
    });

    // Nhóm API quản trị phòng máy.
    Route::prefix('admin/rooms')->group(function () {
        Route::get('/', [RoomController::class, 'index']);
        Route::post('/', [RoomController::class, 'store']);
        Route::get('/{room}/computers', [RoomController::class, 'computers']);
        Route::get('/{room}', [RoomController::class, 'show']);
        Route::put('/{room}', [RoomController::class, 'update']);
        Route::delete('/{room}', [RoomController::class, 'destroy']);
    });

    // Nhóm API quản trị môn học.
    Route::prefix('admin/subjects')->group(function () {
        Route::get('/', [SubjectController::class, 'index']);
        Route::post('/', [SubjectController::class, 'store']);
        Route::get('/{subject}', [SubjectController::class, 'show']);
        Route::put('/{subject}', [SubjectController::class, 'update']);
        Route::delete('/{subject}', [SubjectController::class, 'destroy']);
    });

    // Nhóm API quản trị lịch sử dụng phòng máy.
    Route::prefix('admin/computer-lab-schedules')->group(function () {
        Route::get('/', [ComputerLabScheduleController::class, 'index']);
        Route::post('/', [ComputerLabScheduleController::class, 'store']);
        Route::post('/import', [ComputerLabScheduleController::class, 'import']);
        Route::get('/options', [ComputerLabScheduleController::class, 'options']);
        Route::get('/{computerLabSchedule}', [ComputerLabScheduleController::class, 'show']);
        Route::put('/{computerLabSchedule}', [ComputerLabScheduleController::class, 'update']);
        Route::delete('/{computerLabSchedule}', [ComputerLabScheduleController::class, 'destroy']);
    });

    // Nhóm API quản trị máy tính.
    Route::prefix('admin/computers')->group(function () {
        Route::get('/', [ComputerController::class, 'index']);
        Route::patch('/{computer}/qr-code', [ComputerController::class, 'generateQrCode']);
        Route::get('/{computer}', [ComputerController::class, 'show']);
        Route::put('/{computer}', [ComputerController::class, 'update']);
        Route::delete('/{computer}', [ComputerController::class, 'destroy']);
    });

    // Nhóm API quản trị phiếu nhập máy, tự sinh máy tính theo số lượng nhập.
    Route::prefix('admin/computer-imports')->group(function () {
        Route::get('/', [ComputerImportController::class, 'index']);
        Route::post('/', [ComputerImportController::class, 'store']);
        Route::get('/code', [ComputerImportController::class, 'generateCode']);
        Route::get('/{computerImport}', [ComputerImportController::class, 'show']);
    });

    // Nhóm API điều chuyển máy tính giữa các phòng.
    Route::prefix('admin/computer-transfers')->group(function () {
        Route::get('/', [ComputerTransferController::class, 'index']);
        Route::post('/', [ComputerTransferController::class, 'store']);
    });

    // Nhóm API quản lý báo cáo sự cố.
    Route::prefix('admin/incident-reports')->group(function () {
        Route::get('/', [AdminIncidentReportController::class, 'index']);
        Route::patch('/{incidentReport}/status', [AdminIncidentReportController::class, 'updateStatus']);
    });

    // Nhóm API quản lý phiếu bảo trì.
    Route::prefix('admin/maintenance-tickets')->group(function () {
        Route::get('/', [AdminMaintenanceTicketController::class, 'index']);
        Route::put('/{maintenanceTicket}', [AdminMaintenanceTicketController::class, 'update']);
    });

    // Nhóm API quản lý nhật ký sửa chữa.
    Route::prefix('admin/repair-logs')->group(function () {
        Route::get('/', [AdminRepairLogController::class, 'index']);
    });

    // Nhóm API duyệt phiếu mượn máy.
    Route::prefix('admin/loan-requests')->group(function () {
        Route::get('/', [AdminLoanRequestController::class, 'index']);
        Route::post('/', [AdminLoanRequestController::class, 'store']);
        Route::patch('/{loanRequest}/assign-computers', [AdminLoanRequestController::class, 'assignComputers']);
    });

    // Nhóm API xác nhận phiếu trả máy.
    Route::prefix('admin/return-requests')->group(function () {
        Route::get('/', [AdminReturnRequestController::class, 'index']);
        Route::post('/', [AdminReturnRequestController::class, 'store']);
        Route::patch('/{returnRequest}/confirmation', [AdminReturnRequestController::class, 'confirm']);
    });
});
