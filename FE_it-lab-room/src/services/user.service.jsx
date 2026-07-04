import { CONST_APIS } from "../constants/apis.constant";
import { CONST_METHODS } from "../constants/methods.constant";
import { fetcher } from "../helpers/fetcher.helper";

/**
 * Lấy danh sách người dùng, hỗ trợ phân trang, lọc theo vai trò và tìm kiếm.
 * @param {Object} params - { page, role, search }
 */
export function getUsersFromApi(params = {}) {
  const queryParts = [];

  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.role) queryParts.push(`role=${params.role}`);
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  return fetcher(`${CONST_APIS.USERS.INDEX}${queryString}`, {
    method: CONST_METHODS.GET,
  });
}

/**
 * Lấy danh sách vai trò
 */
export function getRolesFromApi() {
  return fetcher(CONST_APIS.USERS.ROLES, {
    method: CONST_METHODS.GET,
  });
}

/**
 * Lấy chi tiết 1 người dùng theo ID.
 */
export function getUserFromApi(id) {
  return fetcher(CONST_APIS.USERS.SHOW(id), {
    method: CONST_METHODS.GET,
  });
}

/**
 * Tạo mới người dùng.
 */
export function createUserFromApi(payload) {
  return fetcher(CONST_APIS.USERS.STORE, {
    method: CONST_METHODS.POST,
    body: payload,
  });
}

/**
 * Nhập danh sách người dùng từ file.
 */
export function importUsersFromApi(payload) {
  return fetcher(CONST_APIS.USERS.IMPORT, {
    method: CONST_METHODS.POST,
    body: payload,
  });
}

/**
 * Cập nhật thông tin người dùng.
 */
export function updateUserFromApi(id, payload) {
  return fetcher(CONST_APIS.USERS.UPDATE(id), {
    method: CONST_METHODS.PUT,
    body: payload,
  });
}

/**
 * Khóa/Mở khóa tài khoản người dùng.
 */
export function toggleUserStatusFromApi(id) {
  return fetcher(CONST_APIS.USERS.TOGGLE_STATUS(id), {
    method: CONST_METHODS.PATCH,
  });
}

/**
 * Reset mật khẩu người dùng về mặc định (123456).
 */
export function resetUserPasswordFromApi(id) {
  return fetcher(CONST_APIS.USERS.RESET_PASSWORD(id), {
    method: CONST_METHODS.PATCH,
  });
}

/**
 * Xóa tài khoản người dùng.
 */
export function deleteUserFromApi(id) {
  return fetcher(CONST_APIS.USERS.DESTROY(id), {
    method: CONST_METHODS.DELETE,
  });
}

/**
 * Lấy danh sách phòng ban cho dropdown.
 */
export function getDepartmentsFromApi() {
  return fetcher(CONST_APIS.DEPARTMENTS.INDEX, {
    method: CONST_METHODS.GET,
  });
}

/**
 * Lấy danh sách lớp học cho dropdown.
 */
export function getClassesFromApi() {
  return fetcher(CONST_APIS.CLASSES.INDEX, {
    method: CONST_METHODS.GET,
  });
}
