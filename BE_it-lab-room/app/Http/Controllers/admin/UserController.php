<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Throwable;

class UserController extends Controller
{
    /**
     * Lấy danh sách người dùng, hỗ trợ lọc theo vai trò, tìm kiếm, phân trang.
     * Eager load role, student (+ class), teacher (+ department) để tránh N+1.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = User::query()
                ->select(['id', 'ma_vai_tro', 'ho_ten', 'email', 'so_dien_thoai', 'gioi_tinh', 'ngay_sinh', 'trang_thai'])
                ->with([
                    'role:id,ten_vai_tro',
                    'student:id,ma_nguoi_dung,ma_sinh_vien,ma_lop,nien_khoa',
                    'student.class:id,ma_lop',
                    'teacher:id,ma_nguoi_dung,ma_giang_vien,ma_phong_ban',
                    'teacher.department:id,ma_phong_ban,ten_phong_ban',
                ]);

            // Lọc theo vai trò (ma_vai_tro: 1=admin, 2=student, 3=teacher)
            if ($request->filled('role')) {
                $query->where('ma_vai_tro', (int) $request->input('role'));
            }

            // Tìm kiếm theo tên, email, mã sinh viên, mã giảng viên
            if ($request->filled('search')) {
                $keyword = trim($request->input('search'));
                $query->where(function ($q) use ($keyword) {
                    $q->where('ho_ten', 'LIKE', "%{$keyword}%")
                        ->orWhere('email', 'LIKE', "%{$keyword}%")
                        ->orWhere('so_dien_thoai', 'LIKE', "%{$keyword}%")
                        // Tìm theo mã sinh viên
                        ->orWhereHas('student', function ($sq) use ($keyword) {
                            $sq->where('ma_sinh_vien', 'LIKE', "%{$keyword}%");
                        })
                        // Tìm theo mã giảng viên
                        ->orWhereHas('teacher', function ($tq) use ($keyword) {
                            $tq->where('ma_giang_vien', 'LIKE', "%{$keyword}%");
                        });
                });
            }

            // Sắp xếp mới nhất trước, phân trang 15 bản ghi
            $users = $query->orderByDesc('id')->paginate(15);

            return response()->json([
                'status' => true,
                'message' => 'Lấy danh sách người dùng thành công',
                'error_code' => 200,
                'data' => UserResource::collection($users),
                'pagination' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                ],
            ], 200);
        } catch (Throwable $e) {
            Log::error('UserController@index: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    /**
     * Lấy danh sách vai trò cho form và dropdown.
     */
    public function getRoles(): JsonResponse
    {
        try {
            $roles = \App\Models\Role::select(['id', 'ten_vai_tro'])->orderBy('id')->get();
            return response()->json([
                'status' => true,
                'message' => 'Lấy danh sách vai trò thành công',
                'error_code' => 200,
                'data' => $roles,
            ], 200);
        } catch (Throwable $e) {
            Log::error('UserController@getRoles: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    /**
     * Lấy chi tiết 1 người dùng theo ID, eager load đầy đủ quan hệ.
     */
    public function show(User $user): JsonResponse
    {
        try {
            $user->load([
                'role:id,ten_vai_tro',
                'student:id,ma_nguoi_dung,ma_sinh_vien,ma_lop,nien_khoa',
                'student.class:id,ma_lop',
                'teacher:id,ma_nguoi_dung,ma_giang_vien,ma_phong_ban',
                'teacher.department:id,ma_phong_ban,ten_phong_ban',
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Lấy thông tin người dùng thành công',
                'error_code' => 200,
                'data' => new UserResource($user),
            ], 200);
        } catch (Throwable $e) {
            Log::error('UserController@show: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    /**
     * Tạo mới người dùng. Dùng transaction vì ghi vào nhiều bảng (nguoi_dung + giang_vien/sinh_vien).
     * Vai trò 1: Admin (chỉ bảng nguoi_dung).
     * Vai trò 2: Sinh viên (bảng nguoi_dung + sinh_vien).
     * Vai trò 3: Giảng viên (bảng nguoi_dung + giang_vien).
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $roleId = (int) $data['ma_vai_tro'];

            $user = DB::transaction(function () use ($data, $roleId) {
                // Tạo bản ghi chính trong bảng nguoi_dung
                $user = User::create([
                    'ma_vai_tro' => $roleId,
                    'ho_ten' => trim($data['ho_ten']),
                    'email' => trim($data['email']),
                    'mat_khau' => Hash::make($data['mat_khau']),
                    'so_dien_thoai' => $data['so_dien_thoai'] ?? null,
                    'gioi_tinh' => $data['gioi_tinh'] ?? null,
                    'ngay_sinh' => $data['ngay_sinh'] ?? null,
                    'trang_thai' => 1, // Mặc định hoạt động
                ]);

                // Tạo bản ghi con cho sinh viên
                if ($roleId === 2) {
                    Student::create([
                        'ma_nguoi_dung' => $user->id,
                        'ma_sinh_vien' => strtoupper(trim($data['ma_sinh_vien'])),
                        'ma_lop' => $data['ma_lop'],
                        'nien_khoa' => trim($data['nien_khoa']),
                    ]);
                }

                // Tạo bản ghi con cho giảng viên
                if ($roleId === 3) {
                    Teacher::create([
                        'ma_nguoi_dung' => $user->id,
                        'ma_giang_vien' => strtoupper(trim($data['ma_giang_vien'])),
                        'ma_phong_ban' => $data['ma_phong_ban'],
                    ]);
                }

                return $user;
            });

            // Eager load quan hệ để trả resource đầy đủ
            $user->load([
                'role:id,ten_vai_tro',
                'student:id,ma_nguoi_dung,ma_sinh_vien,ma_lop,nien_khoa',
                'student.class:id,ma_lop',
                'teacher:id,ma_nguoi_dung,ma_giang_vien,ma_phong_ban',
                'teacher.department:id,ma_phong_ban,ten_phong_ban',
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Tạo tài khoản thành công',
                'error_code' => 201,
                'data' => new UserResource($user),
            ], 201);
        } catch (Throwable $e) {
            Log::error('UserController@store: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    /**
     * Cập nhật thông tin người dùng.
     * Dùng transaction vì cần cập nhật/tạo/xóa bản ghi con khi đổi vai trò.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        try {
            $data = $request->validated();
            $newRoleId = (int) $data['ma_vai_tro'];
            $oldRoleId = (int) $user->ma_vai_tro;

            DB::transaction(function () use ($user, $data, $newRoleId, $oldRoleId) {
                // Cập nhật bảng nguoi_dung
                $updateData = [
                    'ma_vai_tro' => $newRoleId,
                    'ho_ten' => trim($data['ho_ten']),
                    'email' => trim($data['email']),
                    'so_dien_thoai' => $data['so_dien_thoai'] ?? null,
                    'gioi_tinh' => $data['gioi_tinh'] ?? null,
                    'ngay_sinh' => $data['ngay_sinh'] ?? null,
                ];

                // Chỉ cập nhật mật khẩu nếu có gửi lên
                if (!empty($data['mat_khau'])) {
                    $updateData['mat_khau'] = Hash::make($data['mat_khau']);
                }

                $user->update($updateData);

                // Xử lý bản ghi con khi đổi vai trò: xóa bản ghi cũ nếu đổi vai trò
                if ($oldRoleId !== $newRoleId) {
                    // Xóa bản ghi sinh viên cũ nếu trước đây là sinh viên
                    if ($oldRoleId === 2 && $user->student) {
                        $user->student->delete();
                    }
                    // Xóa bản ghi giảng viên cũ nếu trước đây là giảng viên
                    if ($oldRoleId === 3 && $user->teacher) {
                        $user->teacher->delete();
                    }
                }

                // Cập nhật hoặc tạo mới bản ghi con sinh viên
                if ($newRoleId === 2) {
                    Student::updateOrCreate(
                        ['ma_nguoi_dung' => $user->id],
                        [
                            'ma_sinh_vien' => strtoupper(trim($data['ma_sinh_vien'])),
                            'ma_lop' => $data['ma_lop'],
                            'nien_khoa' => trim($data['nien_khoa']),
                        ]
                    );
                }

                // Cập nhật hoặc tạo mới bản ghi con giảng viên
                if ($newRoleId === 3) {
                    Teacher::updateOrCreate(
                        ['ma_nguoi_dung' => $user->id],
                        [
                            'ma_giang_vien' => strtoupper(trim($data['ma_giang_vien'])),
                            'ma_phong_ban' => $data['ma_phong_ban'],
                        ]
                    );
                }
            });

            // Reload user với quan hệ mới
            $user->refresh();
            $user->load([
                'role:id,ten_vai_tro',
                'student:id,ma_nguoi_dung,ma_sinh_vien,ma_lop,nien_khoa',
                'student.class:id,ma_lop',
                'teacher:id,ma_nguoi_dung,ma_giang_vien,ma_phong_ban',
                'teacher.department:id,ma_phong_ban,ten_phong_ban',
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Cập nhật tài khoản thành công',
                'error_code' => 200,
                'data' => new UserResource($user),
            ], 200);
        } catch (Throwable $e) {
            Log::error('UserController@update: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    /**
     * Đổi trạng thái tài khoản: Hoạt động (1), Khóa (0).
     * Khi khóa tài khoản, xóa toàn bộ token để buộc đăng xuất ngay lập tức.
     */
    public function toggleStatus(User $user): JsonResponse
    {
        try {
            $newStatus = (int) $user->trang_thai === 1 ? 0 : 1;
            $user->update(['trang_thai' => $newStatus]);

            // Khóa tài khoản → thu hồi toàn bộ token để buộc đăng xuất
            if ($newStatus === 0) {
                $user->tokens()->delete();
            }

            $statusLabel = $newStatus === 1 ? 'mở khóa' : 'khóa';

            return response()->json([
                'status' => true,
                'message' => "Đã {$statusLabel} tài khoản thành công",
                'error_code' => 200,
                'data' => [
                    'id' => $user->id,
                    'trang_thai' => $newStatus,
                ],
            ], 200);
        } catch (Throwable $e) {
            Log::error('UserController@toggleStatus: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    /**
     * Reset mật khẩu về giá trị mặc định (123456).
     * Xóa toàn bộ token để buộc đăng nhập lại với mật khẩu mới.
     */
    public function resetPassword(User $user): JsonResponse
    {
        try {
            $user->update([
                'mat_khau' => Hash::make('123456'),
            ]);

            // Xóa toàn bộ token để buộc đăng nhập lại
            $user->tokens()->delete();

            return response()->json([
                'status' => true,
                'message' => 'Reset mật khẩu thành công. Mật khẩu mới: 123456',
                'error_code' => 200,
                'data' => [
                    'id' => $user->id,
                ],
            ], 200);
        } catch (Throwable $e) {
            Log::error('UserController@resetPassword: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    /**
     * Xóa tài khoản người dùng.
     * Dùng transaction để xóa token + bản ghi con (sinh_vien/giang_vien) + bản ghi chính.
     * Bắt lỗi FK restrict khi giảng viên còn dữ liệu đặt phòng, mượn máy...
     */
    public function destroy(User $user): JsonResponse
    {
        try {
            DB::transaction(function () use ($user) {
                // Thu hồi toàn bộ token đăng nhập
                $user->tokens()->delete();

                // Xóa bản ghi con sinh viên (nếu có)
                if ($user->student) {
                    $user->student->delete();
                }

                // Xóa bản ghi con giảng viên (nếu có)
                if ($user->teacher) {
                    $user->teacher->delete();
                }

                // Xóa bản ghi chính trong bảng nguoi_dung
                $user->delete();
            });

            return response()->json([
                'status'     => true,
                'message'    => 'Xóa tài khoản thành công',
                'error_code' => 200,
                'data'       => '',
            ], 200);
        } catch (Throwable $e) {
            Log::error('UserController@destroy: ' . $e->getMessage());

            // Phát hiện lỗi FK restrict → trả thông báo rõ ràng cho người dùng
            if (str_contains($e->getMessage(), 'Cannot delete or update a parent row')) {
                return response()->json([
                    'status'     => false,
                    'message'    => 'Không thể xóa tài khoản vì còn dữ liệu liên quan (đặt phòng, mượn máy, lịch sử...)',
                    'error_code' => 409,
                    'data'       => '',
                ], 409);
            }

            return response()->json([
                'status'     => false,
                'message'    => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data'       => '',
            ], 500);
        }
    }

    /**
     * Nhập danh sách tài khoản từ file (CSV/Excel).
     * Dữ liệu nhận được là mảng các dòng (users).
     * Xử lý lưu từng dòng trong transaction riêng lẻ để đảm bảo an toàn.
     */
    public function import(Request $request): JsonResponse
    {
        try {
            $usersData = $request->input('users', []);
            if (!is_array($usersData) || empty($usersData)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Không có dữ liệu để nhập',
                    'error_code' => 400,
                    'data' => '',
                ], 400);
            }

            $successCount = 0;
            $errors = [];

            // Cache mapping
            $classes = \App\Models\SchoolClass::pluck('id', 'ma_lop')->toArray();
            $departments = \App\Models\Department::pluck('id', 'ma_phong_ban')->toArray();
            $roleMap = \App\Models\Role::pluck('id', 'ten_vai_tro')->toArray();

            foreach ($usersData as $index => $row) {
                $rowNum = $index + 2; // Dòng dữ liệu thật thường bắt đầu từ dòng 2 (sau header)
                try {
                    DB::beginTransaction();

                    $roleName = $row['role'] ?? '';
                    $roleId = $roleMap[$roleName] ?? null;
                    $roleSlug = $roleName; // Dùng trực tiếp do đã được validate

                    if (!$roleId) {
                        throw new \Exception("Vai trò không hợp lệ: '{$roleName}'");
                    }

                    // Map ma_lop cho Sinh viên
                    $maLop = null;
                    if ($roleSlug === 'student') {
                        $classCode = $row['classCode'] ?? '';
                        $maLop = $classes[$classCode] ?? null;
                        if (!$maLop) {
                            throw new \Exception("Mã lớp không tồn tại: '{$classCode}'");
                        }
                    }

                    // Map ma_phong_ban cho Giảng viên
                    $maPhongBan = null;
                    if ($roleSlug === 'teacher') {
                        $deptCode = $row['departmentCode'] ?? '';
                        $maPhongBan = $departments[$deptCode] ?? null;
                        if (!$maPhongBan) {
                            throw new \Exception("Mã phòng ban không tồn tại: '{$deptCode}'");
                        }
                    }

                    // Validation rules
                    $rules = [
                        'name' => 'required|string|max:255',
                        'email' => 'required|email|max:255|unique:nguoi_dung,email',
                        'password' => 'nullable|string|min:6',
                        'phone' => 'nullable|string|max:20',
                    ];

                    if ($roleSlug === 'student') {
                        $rules['code'] = 'required|string|max:50|unique:sinh_vien,ma_sinh_vien';
                        $rules['course'] = 'required|string|max:20';
                    } elseif ($roleSlug === 'teacher') {
                        $rules['code'] = 'required|string|max:50|unique:giang_vien,ma_giang_vien';
                    }

                    $validator = \Illuminate\Support\Facades\Validator::make($row, $rules, [
                        'name.required' => 'Họ tên là bắt buộc.',
                        'email.required' => 'Email là bắt buộc.',
                        'email.email' => 'Email không đúng định dạng.',
                        'email.unique' => 'Email đã tồn tại.',
                        'code.required' => 'Mã (code) là bắt buộc.',
                        'code.unique' => 'Mã đã tồn tại.',
                        'course.required' => 'Niên khóa là bắt buộc.',
                    ]);

                    if ($validator->fails()) {
                        throw new \Exception(implode(', ', $validator->errors()->all()));
                    }

                    // Tạo User
                    $user = User::create([
                        'ma_vai_tro' => $roleId,
                        'ho_ten' => trim($row['name']),
                        'email' => trim($row['email']),
                        'mat_khau' => Hash::make(!empty($row['password']) ? $row['password'] : '123456'),
                        'so_dien_thoai' => $row['phone'] ?? null,
                        'trang_thai' => 1,
                    ]);

                    // Tạo bản ghi phụ
                    if ($roleSlug === 'student') {
                        Student::create([
                            'ma_nguoi_dung' => $user->id,
                            'ma_sinh_vien' => strtoupper(trim($row['code'])),
                            'ma_lop' => $maLop,
                            'nien_khoa' => trim($row['course']),
                        ]);
                    } elseif ($roleSlug === 'teacher') {
                        Teacher::create([
                            'ma_nguoi_dung' => $user->id,
                            'ma_giang_vien' => strtoupper(trim($row['code'])),
                            'ma_phong_ban' => $maPhongBan,
                        ]);
                    }

                    DB::commit();
                    $successCount++;
                } catch (\Exception $e) {
                    DB::rollBack();
                    $emailInfo = !empty($row['email']) ? $row['email'] : 'N/A';
                    $errors[] = "Dòng {$rowNum} ({$emailInfo}): " . $e->getMessage();
                }
            }

            return response()->json([
                'status' => true,
                'message' => 'Quá trình nhập hoàn tất',
                'error_code' => 200,
                'data' => [
                    'success_count' => $successCount,
                    'errors' => $errors,
                    'total' => count($usersData)
                ]
            ], 200);

        } catch (\Throwable $e) {
            Log::error('UserController@import: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }
}
