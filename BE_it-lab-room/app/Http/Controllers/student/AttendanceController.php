<?php

namespace App\Http\Controllers\student;

use App\Http\Controllers\Controller;
use App\Http\Requests\StudentAttendanceRequest;
use App\Http\Resources\ComputerLabScheduleResource;
use App\Http\Resources\ComputerResource;
use App\Http\Resources\StudentAttendanceStatusResource;
use App\Models\Attendance;
use App\Models\Computer;
use App\Models\ComputerLabSchedule;
use App\Models\CourseSectionStudent;
use App\Support\AttendanceWindow;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class AttendanceController extends Controller
{
    private const ATTENDANCE_TIMEZONE = 'Asia/Ho_Chi_Minh';

    public function showBySchedule(
        StudentAttendanceRequest $request,
        ComputerLabSchedule $computerLabSchedule
    ): JsonResponse {
        try {
            $request->validated();
            $student = $request->user()?->student;

            if (! $student) {
                return $this->response(false, 'Tài khoản chưa có hồ sơ sinh viên', 403, '', 403);
            }

            if (! $this->studentCanUseSchedule($student->id, $student->ma_lop, $computerLabSchedule)) {
                return $this->response(false, 'Bạn không thuộc lịch học này', 403, '', 403);
            }

            $computerLabSchedule->load($this->scheduleRelations());
            $attendance = $this->studentAttendance($computerLabSchedule->id, $student->id);
            $computers = $this->availableComputers($computerLabSchedule);

            return $this->response(true, 'Lấy chi tiết điểm danh thành công', 200, [
                'schedule' => new ComputerLabScheduleResource($computerLabSchedule),
                'attendance_window' => $this->attendanceWindow($computerLabSchedule),
                'attendance' => new StudentAttendanceStatusResource([
                    'attendance' => $attendance,
                ]),
                'computers' => ComputerResource::collection($computers),
            ], 200);
        } catch (Throwable $e) {
            return $this->response(false, 'Không thể lấy chi tiết điểm danh', 500, '', 500);
        }
    }

    public function checkIn(
        StudentAttendanceRequest $request,
        ComputerLabSchedule $computerLabSchedule
    ): JsonResponse {
        try {
            $data = $request->validated();
            $student = $request->user()?->student;

            if (! $student) {
                return $this->response(false, 'Tài khoản chưa có hồ sơ sinh viên', 403, '', 403);
            }

            if (! $this->studentCanUseSchedule($student->id, $student->ma_lop, $computerLabSchedule)) {
                return $this->response(false, 'Bạn không thuộc lịch học này', 403, '', 403);
            }

            $window = $this->attendanceWindow($computerLabSchedule);
            if ($window['status'] === 'not_open') {
                return $this->response(false, 'Điểm danh chưa mở', 409, $window, 409);
            }

            if ($window['status'] === 'closed') {
                return $this->response(false, 'Điểm danh đã đóng', 409, $window, 409);
            }

            $computer = $this->resolveComputer($data);
            if (! $computer) {
                return $this->response(false, 'Không tìm thấy máy tính để điểm danh', 404, '', 404);
            }

            if ((int) $computer->ma_phong !== (int) $computerLabSchedule->ma_phong) {
                return $this->response(false, 'Máy tính không thuộc phòng học của lịch này', 422, '', 422);
            }

            if ($computer->trang_thai !== 'active') {
                return $this->response(false, 'Máy tính hiện không ở trạng thái hoạt động', 422, '', 422);
            }

            $attendance = DB::transaction(function () use ($student, $computer, $computerLabSchedule) {
                $existingAttendance = Attendance::query()
                    ->where('ma_lich_su_dung', $computerLabSchedule->id)
                    ->where('ma_sinh_vien', $student->id)
                    ->lockForUpdate()
                    ->first();

                if ($existingAttendance) {
                    return $existingAttendance;
                }

                // Cho phép nhiều sinh viên điểm danh cùng một máy khi thực tế phòng học cần dùng chung máy.
                // Ghi nhận điểm danh đúng thời điểm máy chủ để tránh gian lận giờ trên thiết bị.
                return Attendance::query()->create([
                    'ma_lich_su_dung' => $computerLabSchedule->id,
                    'ma_sinh_vien' => $student->id,
                    'ma_may_tinh' => $computer->id,
                    'thoi_gian_check_in' => Carbon::now(self::ATTENDANCE_TIMEZONE),
                    'trang_thai' => 'present',
                    'ghi_chu' => null,
                ]);
            });

            $attendance->load('computer:id,ma_may,ten_may,vi_tri,ma_qr');

            return $this->response(true, 'Điểm danh thành công', 200, [
                'attendance_window' => $window,
                'attendance' => new StudentAttendanceStatusResource([
                    'attendance' => $attendance,
                ]),
            ], 200);
        } catch (Throwable $e) {
            return $this->response(false, 'Không thể thực hiện điểm danh', 500, '', 500);
        }
    }

    private function studentCanUseSchedule(
        int $studentId,
        ?int $classId,
        ComputerLabSchedule $schedule
    ): bool {
        if ($schedule->ma_lop && (int) $schedule->ma_lop === (int) $classId) {
            return ! CourseSectionStudent::query()
                ->where('ma_lop_hoc_phan', $schedule->ma_lop_hoc_phan)
                ->where('ma_sinh_vien', $studentId)
                ->where('trang_thai', 'inactive')
                ->exists();
        }

        return CourseSectionStudent::query()
            ->where('ma_lop_hoc_phan', $schedule->ma_lop_hoc_phan)
            ->where('ma_sinh_vien', $studentId)
            ->where('trang_thai', 'active')
            ->exists();
    }

    private function studentAttendance(int $scheduleId, int $studentId): ?Attendance
    {
        return Attendance::query()
            ->select(['id', 'ma_lich_su_dung', 'ma_sinh_vien', 'ma_may_tinh', 'thoi_gian_check_in', 'trang_thai', 'ghi_chu'])
            ->with('computer:id,ma_may,ten_may,vi_tri,ma_qr')
            ->where('ma_lich_su_dung', $scheduleId)
            ->where('ma_sinh_vien', $studentId)
            ->first();
    }

    private function availableComputers(ComputerLabSchedule $schedule)
    {
        return Computer::query()
            ->select([
                'id',
                'ma_phong',
                'ma_may',
                'ten_may',
                'vi_tri',
                'ma_qr',
                'bo_xu_ly',
                'ram',
                'card_do_hoa',
                'bo_mach_chu',
                'man_hinh',
                'ban_phim',
                'chuot',
                'hdd',
                'ssd',
                'trang_thai',
                'ghi_chu',
            ])
            ->with('room:id,ma_phong,ten_phong')
            ->where('ma_phong', $schedule->ma_phong)
            ->where('trang_thai', 'active')
            ->orderBy('ma_may')
            ->get();
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

    private function scheduleRelations(): array
    {
        return [
            'room:id,ma_phong,ten_phong',
            'class:id,ma_lop',
            'courseSection:id,ma_lop_hoc_phan,ma_mon',
            'courseSection.subject:id,ten_mon',
            'teacher:id,ma_nguoi_dung,ma_giang_vien',
            'teacher.user:id,ho_ten',
            'week:id,so_tuan,ngay_bat_dau,ngay_ket_thuc',
        ];
    }

    private function response(
        bool $status,
        string $message,
        int $errorCode,
        mixed $data,
        int $httpCode
    ): JsonResponse {
        return response()->json([
            'status' => $status,
            'message' => $message,
            'error_code' => $errorCode,
            'data' => $data,
        ], $httpCode);
    }
}
