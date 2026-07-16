<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ComputerLabScheduleImportRequest;
use App\Http\Requests\ComputerLabScheduleRequest;
use App\Http\Resources\ComputerLabScheduleImportResource;
use App\Http\Resources\ComputerLabScheduleResource;
use App\Http\Resources\RoomUsageFormOptionsResource;
use App\Models\ComputerLabSchedule;
use App\Models\CourseSection;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\Week;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Throwable;

class ComputerLabScheduleController extends Controller
{
    public function index(ComputerLabScheduleRequest $request)
    {
        try {
            $data = $request->validated();
            $keyword = $data['keyword'] ?? null;

            $schedules = ComputerLabSchedule::query()
                ->select([
                    'id',
                    'ma_phong',
                    'ma_lop',
                    'ma_lop_hoc_phan',
                    'ma_giang_vien',
                    'ma_tuan',
                    'ngay_hoc_cu_the',
                    'thu_trong_tuan',
                    'so_tiet_bat_dau',
                    'so_tiet_ket_thuc',
                    'loai_lich',
                    'ma_dat_phong_may',
                    'trang_thai',
                    'ghi_chu',
                ])
                ->with($this->scheduleRelations())
                ->when(
                    $data['room_id'] ?? null,
                    fn ($query, $roomId) =>
                        $query->where('ma_phong', $roomId)
                )
                ->when(
                    $data['week_id'] ?? null,
                    fn ($query, $weekId) =>
                        $query->where('ma_tuan', $weekId)
                )
                ->when($keyword, function ($query) use ($keyword) {
                    $this->applySearch($query, $keyword);
                })
                ->orderByDesc('ngay_hoc_cu_the')
                ->orderBy('so_tiet_bat_dau')
                ->paginate($data['per_page'] ?? 20);

            return response()->json([
                'status' => true,
                'message' => 'Lấy danh sách lịch phòng máy thành công',
                'error_code' => 200,
                'data' => [
                    'items' => ComputerLabScheduleResource::collection(
                        $schedules
                    ),
                    'pagination' => [
                        'current_page' => $schedules->currentPage(),
                        'per_page' => $schedules->perPage(),
                        'total' => $schedules->total(),
                        'last_page' => $schedules->lastPage(),
                    ],
                ],
            ], 200);
        } catch (Throwable $e) {
            return $this->serverErrorResponse();
        }
    }

    public function options(Request $request)
    {
        try {
            $request->validate([]);

            $options = [
                'rooms' => Room::query()
                    ->select(['id', 'ma_phong', 'ten_phong'])
                    ->where('ma_phong', '!=', 'KHO')
                    ->orderBy('ma_phong')
                    ->get(),

                'classes' => SchoolClass::query()
                    ->select(['id', 'ma_lop'])
                    ->orderBy('ma_lop')
                    ->get(),

                'courseSections' => CourseSection::query()
                    ->select(['id', 'ma_lop_hoc_phan', 'ma_mon', 'ma_lop', 'ma_phong'])
                    ->with([
                        'subject:id,ten_mon',
                        'class:id,ma_lop',
                        'room:id,ma_phong,ten_phong',
                        'assignments:id,ma_giang_vien,ma_lop_hoc_phan',
                        'assignments.teacher:id,ma_nguoi_dung,ma_giang_vien',
                        'assignments.teacher.user:id,ho_ten',
                    ])
                    ->orderBy('ma_lop_hoc_phan')
                    ->get(),

                'teachers' => Teacher::query()
                    ->select([
                        'id',
                        'ma_nguoi_dung',
                        'ma_giang_vien',
                    ])
                    ->with('user:id,ho_ten')
                    ->orderBy('ma_giang_vien')
                    ->get(),

                'weeks' => Week::query()
                    ->select([
                        'id',
                        'ma_nam_hoc',
                        'so_tuan',
                        'ngay_bat_dau',
                        'ngay_ket_thuc',
                    ])
                    ->with('academicYear:id,ten_nam_hoc')
                    ->orderByDesc('ngay_bat_dau')
                    ->get(),
            ];

            return response()->json([
                'status' => true,
                'message' => 'Lấy dữ liệu tạo lịch phòng máy thành công',
                'error_code' => 200,
                'data' => new RoomUsageFormOptionsResource($options),
            ], 200);
        } catch (Throwable $e) {
            return $this->serverErrorResponse();
        }
    }

    public function store(ComputerLabScheduleRequest $request)
    {
        try {
            $data = $request->validated();

            $invalidResponse = $this->validateWeekAndDay($data);

            if ($invalidResponse) {
                return $invalidResponse;
            }

            $result = DB::transaction(function () use ($data) {
                $this->lockScheduleResources($data);

                $conflict = $this->findConflict($data);

                if ($conflict) {
                    return $conflict;
                }

                return ComputerLabSchedule::create(
                    $this->scheduleData($data)
                );
            });

            if (is_string($result)) {
                return $this->conflictResponse($result);
            }

            $this->loadScheduleRelations($result);

            return response()->json([
                'status' => true,
                'message' => 'Tạo lịch phòng máy thành công',
                'error_code' => 201,
                'data' => new ComputerLabScheduleResource($result),
            ], 201);
        } catch (Throwable $e) {
            return $this->serverErrorResponse();
        }
    }

    public function import(ComputerLabScheduleImportRequest $request)
    {
        try {
            $rows = $request->validated()['schedules'];
            $successItems = collect();
            $errors = [];

            $maps = $this->scheduleImportMaps();

            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2;

                try {
                    $data = $this->normalizeImportRow($row, $maps);
                    $validator = Validator::make(
                        $data,
                        $this->scheduleImportRules(),
                        $this->scheduleImportMessages()
                    );

                    if ($validator->fails()) {
                        throw new \RuntimeException(
                            implode(' ', $validator->errors()->all())
                        );
                    }

                    $data = $validator->validated();
                    $invalidResponse = $this->validateWeekAndDay($data);

                    if ($invalidResponse) {
                        $payload = $invalidResponse->getData(true);
                        $firstMessages = array_values(
                            $payload['data'] ?? []
                        )[0] ?? [];

                        throw new \RuntimeException(
                            $firstMessages[0] ?? $payload['message']
                        );
                    }

                    $createdSchedule = DB::transaction(function () use ($data) {
                        // Mỗi dòng được khóa và kiểm tra trùng giống luồng tạo lịch thủ công.
                        $this->lockScheduleResources($data);

                        $conflict = $this->findConflict($data);

                        if ($conflict) {
                            throw new \RuntimeException(
                                $this->conflictMessage($conflict)
                            );
                        }

                        return ComputerLabSchedule::create(
                            $this->scheduleData($data)
                        );
                    });

                    $this->loadScheduleRelations($createdSchedule);
                    $successItems->push($createdSchedule);
                } catch (Throwable $e) {
                    $errors[] = "Dòng {$rowNumber}: " . $e->getMessage();
                }
            }

            return response()->json([
                'status' => count($errors) === 0,
                'message' => count($errors) === 0
                    ? 'Nhập lịch phòng máy từ CSV thành công'
                    : 'Nhập lịch phòng máy từ CSV hoàn tất, có dòng lỗi',
                'error_code' => count($errors) === 0 ? 201 : 207,
                'data' => new ComputerLabScheduleImportResource([
                    'success_count' => $successItems->count(),
                    'error_count' => count($errors),
                    'total' => count($rows),
                    'errors' => $errors,
                    'items' => $successItems,
                ]),
            ], count($errors) === 0 ? 201 : 207);
        } catch (Throwable $e) {
            return $this->serverErrorResponse();
        }
    }

    public function show(ComputerLabScheduleRequest $request,ComputerLabSchedule $computerLabSchedule) {
        try {
            $request->validate([]);

            $this->loadScheduleRelations($computerLabSchedule);

            return response()->json([
                'status' => true,
                'message' => 'Lấy chi tiết lịch phòng máy thành công',
                'error_code' => 200,
                'data' => new ComputerLabScheduleResource(
                    $computerLabSchedule
                ),
            ], 200);
        } catch (Throwable $e) {
            return $this->serverErrorResponse();
        }
    }

    public function update(ComputerLabScheduleRequest $request,ComputerLabSchedule $computerLabSchedule) {
        try {
            $data = $request->validated();

            $invalidResponse = $this->validateWeekAndDay($data);

            if ($invalidResponse) {
                return $invalidResponse;
            }

            $result = DB::transaction(
                function () use ($data, $computerLabSchedule) {
                    $this->lockScheduleResources($data);

                    $conflict = $this->findConflict(
                        $data,
                        $computerLabSchedule->id
                    );

                    if ($conflict) {
                        return $conflict;
                    }

                    $computerLabSchedule->update(
                        $this->scheduleData($data)
                    );

                    return $computerLabSchedule;
                }
            );

            if (is_string($result)) {
                return $this->conflictResponse($result);
            }

            $result->refresh();
            $this->loadScheduleRelations($result);

            return response()->json([
                'status' => true,
                'message' => 'Cập nhật lịch phòng máy thành công',
                'error_code' => 200,
                'data' => new ComputerLabScheduleResource($result),
            ], 200);
        } catch (Throwable $e) {
            return $this->serverErrorResponse();
        }
    }

    public function destroy(Request $request,ComputerLabSchedule $computerLabSchedule) {
        try {
            $request->validate([]);

            $deleted = DB::transaction(
                function () use ($computerLabSchedule) {
                    // Khóa lịch để không phát sinh dữ liệu trong lúc xóa.
                    $lockedSchedule = ComputerLabSchedule::query()
                        ->whereKey($computerLabSchedule->id)
                        ->lockForUpdate()
                        ->firstOrFail();

                    $lockedSchedule->loadCount([
                        'attendanceRecords',
                        'teacherComputerRecords',
                    ]);

                    if (
                        $lockedSchedule->attendance_records_count > 0
                        || $lockedSchedule
                            ->teacher_computer_records_count > 0
                    ) {
                        return false;
                    }

                    $lockedSchedule->delete();

                    return true;
                }
            );

            if (! $deleted) {
                return response()->json([
                    'status' => false,
                    'message' => 'Không thể xóa lịch vì đã có dữ liệu điểm danh hoặc ghi nhận máy',
                    'error_code' => 409,
                    'data' => '',
                ], 409);
            }

            return response()->json([
                'status' => true,
                'message' => 'Xóa lịch phòng máy thành công',
                'error_code' => 200,
                'data' => '',
            ], 200);
        } catch (Throwable $e) {
            return $this->serverErrorResponse();
        }
    }

    private function applySearch($query, string $keyword): void
    {
        $query->where(function ($subQuery) use ($keyword) {
            $subQuery
                ->where(
                    'thu_trong_tuan',
                    'like',
                    "%{$keyword}%"
                )
                ->orWhere(
                    'loai_lich',
                    'like',
                    "%{$keyword}%"
                )
                ->orWhere(
                    'trang_thai',
                    'like',
                    "%{$keyword}%"
                )
                ->orWhereHas(
                    'room',
                    fn ($roomQuery) => $roomQuery
                        ->where(
                            'ma_phong',
                            'like',
                            "%{$keyword}%"
                        )
                        ->orWhere(
                            'ten_phong',
                            'like',
                            "%{$keyword}%"
                        )
                )
                ->orWhereHas(
                    'class',
                    fn ($classQuery) => $classQuery->where(
                        'ma_lop',
                        'like',
                        "%{$keyword}%"
                    )
                )
                ->orWhereHas(
                    'courseSection',
                    fn ($courseQuery) => $courseQuery
                        ->where(
                            'ma_lop_hoc_phan',
                            'like',
                            "%{$keyword}%"
                        )
                        ->orWhereHas(
                            'subject',
                            fn ($subjectQuery) =>
                                $subjectQuery->where(
                                    'ten_mon',
                                    'like',
                                    "%{$keyword}%"
                                )
                        )
                )
                ->orWhereHas(
                    'teacher.user',
                    fn ($userQuery) => $userQuery->where(
                        'ho_ten',
                        'like',
                        "%{$keyword}%"
                    )
                );
        });
    }

    private function lockScheduleResources(array $data): void
    {
        // Khóa các tài nguyên để request đồng thời không tạo lịch trùng.
        Room::query()
            ->whereKey($data['ma_phong'])
            ->lockForUpdate()
            ->firstOrFail();

        Teacher::query()
            ->whereKey($data['ma_giang_vien'])
            ->lockForUpdate()
            ->firstOrFail();

        CourseSection::query()
            ->whereKey($data['ma_lop_hoc_phan'])
            ->lockForUpdate()
            ->firstOrFail();
    }

    private function findConflict(array $data,?int $ignoredScheduleId = null): ?string {
        if ($data['trang_thai'] === 'cancelled') {
            return null;
        }

        $conflictFields = [
            'room_conflict' => [
                'ma_phong',
                $data['ma_phong'],
            ],
            'teacher_conflict' => [
                'ma_giang_vien',
                $data['ma_giang_vien'],
            ],
            'course_section_conflict' => [
                'ma_lop_hoc_phan',
                $data['ma_lop_hoc_phan'],
            ],
        ];

        foreach ($conflictFields as $conflict => [$field, $value]) {
            $exists = ComputerLabSchedule::query()
                ->when(
                    $ignoredScheduleId,
                    fn ($query) => $query->where(
                        'id',
                        '!=',
                        $ignoredScheduleId
                    )
                )
                ->where($field, $value)
                ->whereDate(
                    'ngay_hoc_cu_the',
                    $data['ngay_hoc_cu_the']
                )
                ->where('trang_thai', '!=', 'cancelled')
                ->where(
                    'so_tiet_bat_dau',
                    '<=',
                    $data['so_tiet_ket_thuc']
                )
                ->where(
                    'so_tiet_ket_thuc',
                    '>=',
                    $data['so_tiet_bat_dau']
                )
                ->exists();

            if ($exists) {
                return $conflict;
            }
        }

        $bookingConflict = RoomBooking::query()
            ->where('ma_phong', $data['ma_phong'])
            ->whereDate('ngay_dat', $data['ngay_hoc_cu_the'])
            ->where('trang_thai_duyet', 'approved')
            ->when(
                $data['ma_dat_phong_may'] ?? null,
                fn ($query, $bookingId) => $query->where('id', '!=', $bookingId)
            )
            ->where('tiet_bat_dau', '<=', $data['so_tiet_ket_thuc'])
            ->where('tiet_ket_thuc', '>=', $data['so_tiet_bat_dau'])
            ->exists();

        if ($bookingConflict) {
            return 'room_booking_conflict';
        }

        return null;
    }

    private function scheduleImportMaps(): array
    {
        return [
            'rooms' => Room::query()->pluck('id', 'ma_phong')->all(),
            'courseSections' => CourseSection::query()
                ->select(['id', 'ma_lop_hoc_phan', 'ma_lop'])
                ->with([
                    'assignments' => fn ($query) => $query
                        ->select([
                            'id',
                            'ma_giang_vien',
                            'ma_lop_hoc_phan',
                            'trang_thai',
                        ])
                        ->orderByRaw("trang_thai = 'active' desc")
                        ->orderBy('id'),
                ])
                ->get()
                ->keyBy('ma_lop_hoc_phan')
                ->all(),
        ];
    }

    private function normalizeImportRow(array $row, array $maps): array
    {
        $studyDate = $this->importValue($row, [
            'ngay_hoc_cu_the',
            'ngay_hoc',
            'study_date',
        ]);
        $studyDate = $this->normalizeImportDate($studyDate);

        // CSV dùng mã nghiệp vụ để dễ nhập, controller đổi sang khóa chính trước khi validate.
        $courseSectionCode = $this->importValue($row, [
            'ma_lop_hoc_phan',
            'lop_hoc_phan',
            'course_section_code',
        ]);
        $roomCode = $this->importValue($row, [
            'ma_phong',
            'phong',
            'room_code',
        ]);
        $courseSection = $this->mapImportCourseSection(
            $maps['courseSections'],
            $courseSectionCode
        );
        $teacherId = $this->resolveImportTeacherId($courseSection);

        return [
            'ma_phong' => $this->mapImportCode(
                $maps['rooms'],
                $roomCode,
                'Mã phòng không tồn tại hoặc đang trống.'
            ),
            'ma_lop' => $courseSection->ma_lop,
            'ma_lop_hoc_phan' => $courseSection->id,
            'ma_giang_vien' => $teacherId,
            'ma_tuan' => $this->resolveImportWeekId($row, $studyDate),
            'ngay_hoc_cu_the' => $studyDate,
            'thu_trong_tuan' => $this->importValue($row, [
                'thu_trong_tuan',
                'thu',
                'day',
            ]) ?: $this->dayLabelFromDate($studyDate),
            'so_tiet_bat_dau' => $this->importValue($row, [
                'so_tiet_bat_dau',
                'tiet_bat_dau',
                'lesson_start',
            ]),
            'so_tiet_ket_thuc' => $this->importValue($row, [
                'so_tiet_ket_thuc',
                'tiet_ket_thuc',
                'lesson_end',
            ]),
            'loai_lich' => $this->importValue($row, [
                'loai_lich',
                'schedule_type',
            ]) ?: 'ThucHanh',
            'ma_dat_phong_may' => null,
            'trang_thai' => $this->importValue($row, [
                'trang_thai',
                'status',
            ]) ?: 'scheduled',
            'ghi_chu' => $this->importValue($row, [
                'ghi_chu',
                'note',
            ]) ?: null,
        ];
    }

    private function mapImportCourseSection(
        array $map,
        string $code
    ): CourseSection {
        if ($code === '' || ! array_key_exists($code, $map)) {
            throw new \RuntimeException(
                'Mã lớp học phần không tồn tại hoặc đang trống.'
            );
        }

        return $map[$code];
    }

    private function resolveImportTeacherId(CourseSection $courseSection): int
    {
        $assignment = $courseSection->assignments->first();

        if (! $assignment?->ma_giang_vien) {
            throw new \RuntimeException(
                'Lớp học phần chưa có giảng viên được phân công.'
            );
        }

        return (int) $assignment->ma_giang_vien;
    }

    private function mapImportCode(
        array $map,
        string $code,
        string $message
    ): int
    {
        if ($code === '' || ! array_key_exists($code, $map)) {
            throw new \RuntimeException($message);
        }

        return (int) $map[$code];
    }

    private function importValue(array $row, array $keys): string
    {
        foreach ($keys as $key) {
            if (array_key_exists($key, $row)) {
                return trim((string) $row[$key]);
            }
        }

        return '';
    }

    private function normalizeImportDate(string $date): string
    {
        if ($date === '') {
            return '';
        }

        foreach (['Y-m-d', 'd/m/Y', 'd-m-Y'] as $format) {
            try {
                return Carbon::createFromFormat($format, $date)->format('Y-m-d');
            } catch (Throwable $e) {
                continue;
            }
        }

        return $date;
    }

    private function resolveImportWeekId(array $row, string $studyDate): ?int
    {
        $weekId = $this->importValue($row, ['ma_tuan', 'week_id']);

        if ($weekId !== '') {
            return (int) $weekId;
        }

        $weekNumber = $this->importValue($row, ['so_tuan', 'week_number']);

        if ($weekNumber !== '') {
            return Week::query()
                ->where('so_tuan', $weekNumber)
                ->orderByDesc('id')
                ->value('id');
        }

        if ($studyDate === '') {
            return null;
        }

        return Week::query()
            ->whereDate('ngay_bat_dau', '<=', $studyDate)
            ->whereDate('ngay_ket_thuc', '>=', $studyDate)
            ->orderByDesc('id')
            ->value('id');
    }

    private function dayLabelFromDate(string $studyDate): string
    {
        if ($studyDate === '') {
            return '';
        }

        $dayLabels = [
            1 => 'Thứ 2',
            2 => 'Thứ 3',
            3 => 'Thứ 4',
            4 => 'Thứ 5',
            5 => 'Thứ 6',
            6 => 'Thứ 7',
            7 => 'Chủ nhật',
        ];

        try {
            return $dayLabels[Carbon::parse($studyDate)->dayOfWeekIso] ?? '';
        } catch (Throwable $e) {
            return '';
        }
    }

    private function scheduleImportRules(): array
    {
        return [
            'ma_phong' => ['required', 'integer', 'exists:phong_may,id'],
            'ma_lop' => ['nullable', 'integer', 'exists:lop_hoc,id'],
            'ma_lop_hoc_phan' => ['required', 'integer', 'exists:lop_hoc_phan,id'],
            'ma_giang_vien' => ['required', 'integer', 'exists:giang_vien,id'],
            'ma_tuan' => ['required', 'integer', 'exists:tuan,id'],
            'ngay_hoc_cu_the' => ['required', 'date_format:Y-m-d'],
            'thu_trong_tuan' => [
                'required',
                'string',
                Rule::in([
                    'Thứ 2',
                    'Thứ 3',
                    'Thứ 4',
                    'Thứ 5',
                    'Thứ 6',
                    'Thứ 7',
                    'Chủ nhật',
                ]),
            ],
            'so_tiet_bat_dau' => ['required', 'integer', 'min:1', 'max:12'],
            'so_tiet_ket_thuc' => [
                'required',
                'integer',
                'min:1',
                'max:12',
                'gte:so_tiet_bat_dau',
            ],
            'loai_lich' => [
                'required',
                'string',
                Rule::in([
                    'LyThuyet',
                    'ThucHanh',
                    'ChinhThuc',
                    'DatPhong',
                    'BoSung',
                ]),
            ],
            'ma_dat_phong_may' => ['nullable', 'integer', 'exists:dat_phong_may,id'],
            'trang_thai' => [
                'required',
                'string',
                Rule::in(['scheduled', 'completed', 'cancelled', 'open', 'closed']),
            ],
            'ghi_chu' => ['nullable', 'string'],
        ];
    }

    private function scheduleImportMessages(): array
    {
        return [
            'ma_phong.required' => 'Mã phòng không tồn tại hoặc đang trống.',
            'ma_lop.exists' => 'Mã lớp không tồn tại.',
            'ma_lop_hoc_phan.required' => 'Mã lớp học phần không tồn tại hoặc đang trống.',
            'ma_giang_vien.required' => 'Mã giảng viên không tồn tại hoặc đang trống.',
            'ma_tuan.required' => 'Không xác định được tuần học.',
            'ma_tuan.exists' => 'Tuần học không tồn tại.',
            'ngay_hoc_cu_the.required' => 'Ngày học là bắt buộc.',
            'ngay_hoc_cu_the.date_format' => 'Ngày học phải có định dạng Y-m-d.',
            'thu_trong_tuan.required' => 'Thứ trong tuần là bắt buộc.',
            'thu_trong_tuan.in' => 'Thứ trong tuần không hợp lệ.',
            'so_tiet_bat_dau.required' => 'Tiết bắt đầu là bắt buộc.',
            'so_tiet_bat_dau.integer' => 'Tiết bắt đầu phải là số nguyên.',
            'so_tiet_bat_dau.min' => 'Tiết bắt đầu phải từ 1 trở lên.',
            'so_tiet_bat_dau.max' => 'Tiết bắt đầu không được vượt quá 12.',
            'so_tiet_ket_thuc.required' => 'Tiết kết thúc là bắt buộc.',
            'so_tiet_ket_thuc.integer' => 'Tiết kết thúc phải là số nguyên.',
            'so_tiet_ket_thuc.gte' => 'Tiết kết thúc phải lớn hơn hoặc bằng tiết bắt đầu.',
            'so_tiet_ket_thuc.max' => 'Tiết kết thúc không được vượt quá 12.',
            'loai_lich.in' => 'Loại lịch không hợp lệ.',
            'trang_thai.in' => 'Trạng thái lịch không hợp lệ.',
            'ghi_chu.string' => 'Ghi chú không hợp lệ.',
        ];
    }

    private function scheduleData(array $data): array
    {
        return [
            'ma_phong' => $data['ma_phong'],
            'ma_lop' => $data['ma_lop'] ?? null,
            'ma_lop_hoc_phan' => $data['ma_lop_hoc_phan'],
            'ma_giang_vien' => $data['ma_giang_vien'],
            'ma_tuan' => $data['ma_tuan'],
            'ngay_hoc_cu_the' => $data['ngay_hoc_cu_the'],
            'thu_trong_tuan' => $data['thu_trong_tuan'],
            'so_tiet_bat_dau' => $data['so_tiet_bat_dau'],
            'so_tiet_ket_thuc' => $data['so_tiet_ket_thuc'],
            'loai_lich' => $data['loai_lich'],
            'ma_dat_phong_may' =>
                $data['ma_dat_phong_may'] ?? null,
            'trang_thai' => $data['trang_thai'],
            'ghi_chu' => $data['ghi_chu'] ?? null,
        ];
    }

    private function validateWeekAndDay(array $data)
    {
        $week = Week::query()
            ->select([
                'id',
                'ngay_bat_dau',
                'ngay_ket_thuc',
            ])
            ->findOrFail($data['ma_tuan']);

        $studyDate = Carbon::createFromFormat(
            'Y-m-d',
            $data['ngay_hoc_cu_the']
        )->startOfDay();

        $weekStartDate = Carbon::parse($week->ngay_bat_dau)->startOfDay();
        $weekEndDate = Carbon::parse($week->ngay_ket_thuc)->endOfDay();

        $dayLabels = [
            1 => 'Thứ 2',
            2 => 'Thứ 3',
            3 => 'Thứ 4',
            4 => 'Thứ 5',
            5 => 'Thứ 6',
            6 => 'Thứ 7',
            7 => 'Chủ nhật',
        ];

        if (! $studyDate->betweenIncluded($weekStartDate, $weekEndDate)) {
            return response()->json([
                'status' => false,
                'message' => 'Ngày học không nằm trong tuần đã chọn',
                'error_code' => 422,
                'data' => [
                    'ngay_hoc_cu_the' => [
                        'Ngày học không nằm trong tuần đã chọn.',
                    ],
                ],
            ], 422);
        }

        if ($dayLabels[$studyDate->dayOfWeekIso] !== $data['thu_trong_tuan']) {
            return response()->json([
                'status' => false,
                'message' => 'Ngày học không khớp với thứ trong tuần',
                'error_code' => 422,
                'data' => [
                    'thu_trong_tuan' => [
                        'Thứ trong tuần không khớp với ngày học.',
                    ],
                ],
            ], 422);
        }

        return null;
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

    private function loadScheduleRelations(
        ComputerLabSchedule $schedule
    ): void {
        $schedule->load($this->scheduleRelations());
    }

    private function conflictResponse(string $conflict)
    {
        return response()->json([
            'status' => false,
            'message' => $this->conflictMessage($conflict),
            'error_code' => 409,
            'data' => '',
        ], 409);
    }

    private function conflictMessage(string $conflict): string
    {
        $messages = [
            'room_conflict' =>
                'Phòng máy đã có lịch trùng ngày và khoảng tiết',

            'teacher_conflict' =>
                'Giảng viên đã có lịch trùng ngày và khoảng tiết',

            'course_section_conflict' =>
                'Lớp học phần đã có lịch trùng ngày và khoảng tiết',

            'room_booking_conflict' =>
                'Phòng máy đã có đăng ký mượn phòng trùng ngày và khoảng tiết',
        ];

        return $messages[$conflict] ?? 'Lịch phòng máy bị trùng';
    }

    private function serverErrorResponse()
    {
        return response()->json([
            'status' => false,
            'message' => 'Hiện tại tôi không thể xử lí yêu cầu của bạn',
            'error_code' => 500,
            'data' => '',
        ], 500);
    }
}
