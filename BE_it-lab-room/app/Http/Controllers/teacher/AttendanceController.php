<?php

namespace App\Http\Controllers\teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\TeacherAttendanceRequest;
use App\Http\Requests\TeacherBulkAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\ComputerLabScheduleResource;
use App\Models\Attendance;
use App\Models\Computer;
use App\Models\ComputerLabSchedule;
use App\Models\CourseSectionStudent;
use App\Models\Student;
use App\Support\AttendanceWindow;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class AttendanceController extends Controller
{
    private const ATTENDANCE_TIMEZONE = 'Asia/Ho_Chi_Minh';

    public function showBySchedule(TeacherAttendanceRequest $request, ComputerLabSchedule $computerLabSchedule): JsonResponse
    {
        try {
            $request->validated();
            $teacher = $request->user()?->teacher;

            if (! $teacher) {
                return response()->json([
                    'status' => false,
                    'message' => 'Tài khoản chưa có hồ sơ giảng viên',
                    'error_code' => 403,
                    'data' => '',
                ], 403);
            }

            if ((int) $computerLabSchedule->ma_giang_vien !== (int) $teacher->id) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bạn không có quyền xem điểm danh của lịch dạy này',
                    'error_code' => 403,
                    'data' => '',
                ], 403);
            }

            $computerLabSchedule->load([
                'room:id,ma_phong,ten_phong',
                'class:id,ma_lop',
                'courseSection:id,ma_lop_hoc_phan,ma_mon',
                'courseSection.subject:id,ten_mon',
                'teacher:id,ma_nguoi_dung,ma_giang_vien',
                'teacher.user:id,ho_ten',
                'week:id,so_tuan,ngay_bat_dau,ngay_ket_thuc',
            ]);

            $studentIds = $this->scheduleStudentIds($computerLabSchedule);
            $students = Student::query()
                ->select(['id', 'ma_nguoi_dung', 'ma_lop', 'ma_sinh_vien', 'nien_khoa'])
                ->with(['user:id,ho_ten,email', 'class:id,ma_lop'])
                ->whereIn('id', $studentIds)
                ->orderBy('ma_sinh_vien')
                ->get();

            $attendanceRecords = Attendance::query()
                ->select(['id', 'ma_lich_su_dung', 'ma_sinh_vien', 'thoi_gian_check_in', 'trang_thai', 'ghi_chu'])
                ->where('ma_lich_su_dung', $computerLabSchedule->id)
                ->whereIn('ma_sinh_vien', $studentIds)
                ->get()
                ->keyBy('ma_sinh_vien');
            $presentCount = $attendanceRecords->where('trang_thai', 'present')->count();

            // Ghép danh sách sinh viên của buổi học với bản ghi điểm danh nếu sinh viên đã quét QR.
            $attendanceItems = $students->map(fn (Student $student) => [
                'student' => $student,
                'attendance' => $attendanceRecords->get($student->id),
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Lấy danh sách sinh viên điểm danh thành công',
                'error_code' => 200,
                'data' => [
                    'schedule' => new ComputerLabScheduleResource($computerLabSchedule),
                    'attendance_window' => AttendanceWindow::resolve($computerLabSchedule),
                    'summary' => [
                        'total_students' => $students->count(),
                        'checked_in_students' => $presentCount,
                        'absent_students' => max(0, $students->count() - $presentCount),
                    ],
                    'students' => AttendanceResource::collection($attendanceItems),
                ],
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Không thể lấy danh sách sinh viên điểm danh',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    public function updateStatus(TeacherAttendanceRequest $request, ComputerLabSchedule $computerLabSchedule): JsonResponse
    {
        try {
            $data = $request->validated();
            $teacher = $request->user()?->teacher;

            if (! $teacher) {
                return response()->json([
                    'status' => false,
                    'message' => 'Tài khoản chưa có hồ sơ giảng viên',
                    'error_code' => 403,
                    'data' => '',
                ], 403);
            }

            if ((int) $computerLabSchedule->ma_giang_vien !== (int) $teacher->id) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bạn không có quyền cập nhật điểm danh của lịch dạy này',
                    'error_code' => 403,
                    'data' => '',
                ], 403);
            }

            if (in_array($computerLabSchedule->trang_thai, ['completed', 'cancelled'], true)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Không thể cập nhật điểm danh cho lịch đã kết thúc hoặc đã hủy',
                    'error_code' => 409,
                    'data' => '',
                ], 409);
            }

            $window = AttendanceWindow::resolve($computerLabSchedule);
            if ($data['attendance_status'] === 'open' && $window['is_expired']) {
                return response()->json([
                    'status' => false,
                    'message' => 'Không thể mở điểm danh vì lịch học đã hết giờ',
                    'error_code' => 409,
                    'data' => $window,
                ], 409);
            }

            // Giảng viên chủ động mở/đóng điểm danh bằng cột trạng thái sẵn có của lịch sử dụng phòng máy.
            $computerLabSchedule->forceFill([
                'trang_thai' => $data['attendance_status'],
            ])->save();

            $computerLabSchedule->load([
                'room:id,ma_phong,ten_phong',
                'class:id,ma_lop',
                'courseSection:id,ma_lop_hoc_phan,ma_mon',
                'courseSection.subject:id,ten_mon',
                'teacher:id,ma_nguoi_dung,ma_giang_vien',
                'teacher.user:id,ho_ten',
                'week:id,so_tuan,ngay_bat_dau,ngay_ket_thuc',
            ]);

            $isOpen = $data['attendance_status'] === 'open';

            return response()->json([
                'status' => true,
                'message' => $isOpen ? 'Mở điểm danh thành công' : 'Đóng điểm danh thành công',
                'error_code' => 200,
                'data' => [
                    'schedule' => new ComputerLabScheduleResource($computerLabSchedule),
                    'attendance_window' => $this->attendanceWindow($computerLabSchedule),
                ],
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Không thể cập nhật trạng thái điểm danh',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    public function checkInStudent(
        TeacherAttendanceRequest $request,
        ComputerLabSchedule $computerLabSchedule,
        Student $student
    ): JsonResponse {
        try {
            $data = $request->validated();
            $teacher = $request->user()?->teacher;

            if (! $teacher) {
                return response()->json([
                    'status' => false,
                    'message' => 'Tài khoản chưa có hồ sơ giảng viên',
                    'error_code' => 403,
                    'data' => '',
                ], 403);
            }

            if ((int) $computerLabSchedule->ma_giang_vien !== (int) $teacher->id) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bạn không có quyền điểm danh cho lịch dạy này',
                    'error_code' => 403,
                    'data' => '',
                ], 403);
            }

            if (! $this->scheduleStudentIds($computerLabSchedule)->contains((int) $student->id)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Sinh viên không thuộc lịch học này',
                    'error_code' => 422,
                    'data' => '',
                ], 422);
            }

            $window = AttendanceWindow::resolve($computerLabSchedule);
            if ($window['status'] !== 'open') {
                return response()->json([
                    'status' => false,
                    'message' => $window['status'] === 'closed' ? 'Điểm danh đã đóng' : 'Điểm danh chưa mở',
                    'error_code' => 409,
                    'data' => $window,
                ], 409);
            }

            $computer = null;
            if (($data['ma_may_tinh'] ?? null) || ($data['ma_qr'] ?? null)) {
                $computer = $this->resolveComputer($data);
                if (! $computer) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Không tìm thấy máy tính để điểm danh',
                        'error_code' => 404,
                        'data' => '',
                    ], 404);
                }

                if ((int) $computer->ma_phong !== (int) $computerLabSchedule->ma_phong) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Máy tính không thuộc phòng học của lịch này',
                        'error_code' => 422,
                        'data' => '',
                    ], 422);
                }

                if ($computer->trang_thai !== 'active') {
                    return response()->json([
                        'status' => false,
                        'message' => 'Máy tính hiện không ở trạng thái hoạt động',
                        'error_code' => 422,
                        'data' => '',
                    ], 422);
                }
            }

            $attendance = DB::transaction(function () use ($computerLabSchedule, $student, $computer, $data) {
                $existingAttendance = Attendance::query()
                    ->where('ma_lich_su_dung', $computerLabSchedule->id)
                    ->where('ma_sinh_vien', $student->id)
                    ->lockForUpdate()
                    ->first();

                if ($existingAttendance) {
                    $existingAttendance->update([
                        'ma_may_tinh' => $computer?->id,
                        'thoi_gian_check_in' => $existingAttendance->thoi_gian_check_in ?? Carbon::now(self::ATTENDANCE_TIMEZONE),
                        'trang_thai' => 'present',
                        'ghi_chu' => $data['note'] ?? 'Giảng viên điểm danh hộ',
                    ]);

                    return $existingAttendance;
                }

                // Cho phép nhiều sinh viên điểm danh cùng một máy khi giảng viên điểm danh hộ.
                return Attendance::query()->create([
                    'ma_lich_su_dung' => $computerLabSchedule->id,
                    'ma_sinh_vien' => $student->id,
                    'ma_may_tinh' => $computer?->id,
                    'thoi_gian_check_in' => Carbon::now(self::ATTENDANCE_TIMEZONE),
                    'trang_thai' => 'present',
                    'ghi_chu' => $data['note'] ?? 'Giảng viên điểm danh hộ',
                ]);
            });

            $student->load(['user:id,ho_ten,email', 'class:id,ma_lop']);

            return response()->json([
                'status' => true,
                'message' => 'Điểm danh sinh viên thành công',
                'error_code' => 200,
                'data' => [
                    'attendance_window' => $window,
                    'student' => new AttendanceResource([
                        'student' => $student,
                        'attendance' => $attendance,
                    ]),
                ],
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Không thể điểm danh sinh viên',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    public function bulkSave(
        TeacherBulkAttendanceRequest $request,
        ComputerLabSchedule $computerLabSchedule
    ): JsonResponse {
        try {
            $data = $request->validated();
            $teacher = $request->user()?->teacher;

            if (! $teacher) {
                return response()->json([
                    'status' => false,
                    'message' => 'Tài khoản chưa có hồ sơ giảng viên',
                    'error_code' => 403,
                    'data' => '',
                ], 403);
            }

            if ((int) $computerLabSchedule->ma_giang_vien !== (int) $teacher->id) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bạn không có quyền điểm danh cho lịch dạy này',
                    'error_code' => 403,
                    'data' => '',
                ], 403);
            }

            $window = AttendanceWindow::resolve($computerLabSchedule);
            if ($window['status'] !== 'open') {
                return response()->json([
                    'status' => false,
                    'message' => $window['status'] === 'closed' ? 'Điểm danh đã đóng' : 'Điểm danh chưa mở',
                    'error_code' => 409,
                    'data' => $window,
                ], 409);
            }

            $computer = null;
            if ($data['ma_may_tinh'] ?? null) {
                $computer = $this->resolveComputer(['ma_may_tinh' => $data['ma_may_tinh']]);

                if (! $computer) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Không tìm thấy máy tính để điểm danh',
                        'error_code' => 404,
                        'data' => '',
                    ], 404);
                }

                if ((int) $computer->ma_phong !== (int) $computerLabSchedule->ma_phong) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Máy tính không thuộc phòng học của lịch này',
                        'error_code' => 422,
                        'data' => '',
                    ], 422);
                }

                if ($computer->trang_thai !== 'active') {
                    return response()->json([
                        'status' => false,
                        'message' => 'Máy tính hiện không ở trạng thái hoạt động',
                        'error_code' => 422,
                        'data' => '',
                    ], 422);
                }
            }

            $allowedStudentIds = $this->scheduleStudentIds($computerLabSchedule);
            $submittedStudentIds = collect($data['attendances'])
                ->pluck('student_id')
                ->map(fn ($studentId) => (int) $studentId);

            if ($submittedStudentIds->diff($allowedStudentIds)->isNotEmpty()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Danh sách điểm danh có sinh viên không thuộc lịch học này',
                    'error_code' => 422,
                    'data' => '',
                ], 422);
            }

            $attendanceRows = collect($data['attendances'])
                ->keyBy(fn (array $item) => (int) $item['student_id']);

            DB::transaction(function () use ($attendanceRows, $computerLabSchedule, $computer, $data) {
                $existingRecords = Attendance::query()
                    ->where('ma_lich_su_dung', $computerLabSchedule->id)
                    ->whereIn('ma_sinh_vien', $attendanceRows->keys())
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('ma_sinh_vien');

                $now = Carbon::now(self::ATTENDANCE_TIMEZONE);

                $attendanceRows->each(function (array $item, int $studentId) use ($existingRecords, $computerLabSchedule, $computer, $data, $now) {
                    $status = $item['attendance_status'];
                    $record = $existingRecords->get($studentId);

                    $payload = [
                        'ma_lich_su_dung' => $computerLabSchedule->id,
                        'ma_sinh_vien' => $studentId,
                        'ma_lop_hoc_phan' => $computerLabSchedule->ma_lop_hoc_phan,
                        'ma_may_tinh' => $status === 'present' ? $computer?->id : null,
                        'thoi_gian_check_in' => $status === 'present' ? ($record?->thoi_gian_check_in ?? $now) : null,
                        'trang_thai' => $status,
                        'ghi_chu' => $data['note'] ?? 'Giảng viên lưu điểm danh',
                    ];

                    if ($record) {
                        $record->update($payload);
                        return;
                    }

                    Attendance::query()->create($payload);
                });
            });

            $studentIds = $this->scheduleStudentIds($computerLabSchedule);
            $students = Student::query()
                ->select(['id', 'ma_nguoi_dung', 'ma_lop', 'ma_sinh_vien', 'nien_khoa'])
                ->with(['user:id,ho_ten,email', 'class:id,ma_lop'])
                ->whereIn('id', $studentIds)
                ->orderBy('ma_sinh_vien')
                ->get();

            $attendanceRecords = Attendance::query()
                ->select(['id', 'ma_lich_su_dung', 'ma_sinh_vien', 'thoi_gian_check_in', 'trang_thai', 'ghi_chu'])
                ->where('ma_lich_su_dung', $computerLabSchedule->id)
                ->whereIn('ma_sinh_vien', $studentIds)
                ->get()
                ->keyBy('ma_sinh_vien');

            $attendanceItems = $students->map(fn (Student $student) => [
                'student' => $student,
                'attendance' => $attendanceRecords->get($student->id),
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Lưu điểm danh thành công',
                'error_code' => 200,
                'data' => [
                    'attendance_window' => $window,
                    'summary' => [
                        'total_students' => $students->count(),
                        'checked_in_students' => $attendanceRecords->where('trang_thai', 'present')->count(),
                        'absent_students' => $attendanceRecords->where('trang_thai', 'absent')->count(),
                    ],
                    'students' => AttendanceResource::collection($attendanceItems),
                ],
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Không thể lưu điểm danh sinh viên',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    private function scheduleStudentIds(ComputerLabSchedule $schedule)
    {
        $classStudentIds = $schedule->ma_lop
            ? Student::query()
                ->where('ma_lop', $schedule->ma_lop)
                ->whereDoesntHave('courseSectionDetails', function ($detailQuery) use ($schedule) {
                    $detailQuery
                        ->where('ma_lop_hoc_phan', $schedule->ma_lop_hoc_phan)
                        ->where('trang_thai', 'inactive');
                })
                ->pluck('id')
            : collect();

        $courseSectionStudentIds = CourseSectionStudent::query()
            ->where('ma_lop_hoc_phan', $schedule->ma_lop_hoc_phan)
            ->where('trang_thai', 'active')
            ->pluck('ma_sinh_vien');

        return $classStudentIds
            ->merge($courseSectionStudentIds)
            ->map(fn ($studentId) => (int) $studentId)
            ->unique()
            ->values();
    }

    private function resolveComputer(array $data): ?Computer
    {
        return Computer::query()
            ->select(['id', 'ma_phong', 'ma_may', 'ten_may', 'vi_tri', 'ma_qr', 'trang_thai'])
            ->when($data['ma_may_tinh'] ?? null, fn ($query, $computerId) => $query->whereKey($computerId))
            ->when($data['ma_qr'] ?? null, fn ($query, $qrCode) => $query->where('ma_qr', $qrCode))
            ->first();
    }

    private function attendanceWindow(ComputerLabSchedule $schedule): array
    {
        return AttendanceWindow::resolve($schedule);
    }
}
