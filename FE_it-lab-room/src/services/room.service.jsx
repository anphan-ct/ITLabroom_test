import { CONST_APIS } from "../constants/apis.constant";
import { CONST_METHODS } from "../constants/methods.constant";
import { fetcher } from "../helpers/fetcher.helper";

export function getRoomsFromApi(params = {}) {
  const queryParams = new URLSearchParams();

  if (params.includeStorage) {
    queryParams.set("include_storage", "1");
  }

  const queryString = queryParams.toString();

  return fetcher(`${CONST_APIS.ROOMS.INDEX}${queryString ? `?${queryString}` : ""}`, {
    method: CONST_METHODS.GET,
  });
}

export function createRoomFromApi(payload) {
  return fetcher(CONST_APIS.ROOMS.STORE, {
    method: CONST_METHODS.POST,
    body: payload,
  });
}

export function getRoomFromApi(id) {
  return fetcher(CONST_APIS.ROOMS.SHOW(id), {
    method: CONST_METHODS.GET,
  });
}

export function getRoomComputersFromApi(id) {
  return fetcher(CONST_APIS.ROOMS.COMPUTERS(id), {
    method: CONST_METHODS.GET,
  });
}

export function updateRoomFromApi(id, payload) {
  return fetcher(CONST_APIS.ROOMS.UPDATE(id), {
    method: CONST_METHODS.PUT,
    body: payload,
  });
}

export function deleteRoomFromApi(id) {
  return fetcher(CONST_APIS.ROOMS.DESTROY(id), {
    method: CONST_METHODS.DELETE,
  });
}

/**
 * Lấy danh sách phòng máy theo role (admin/teacher/student).
 * Admin dùng ROOMS, teacher dùng TEACHER_ROOMS, student dùng STUDENT_ROOMS.
 */
export function getRoomsForRole(role) {
  const apiMap = {
    admin: CONST_APIS.ROOMS.INDEX,
    teacher: CONST_APIS.TEACHER_ROOMS.INDEX,
    student: CONST_APIS.STUDENT_ROOMS.INDEX,
  };
  return fetcher(apiMap[role], { method: CONST_METHODS.GET });
}

/**
 * Lấy máy tính + thiết bị theo phòng, chọn endpoint theo role.
 */
export function getRoomComputersForRole(role, id) {
  const apiMap = {
    admin: CONST_APIS.ROOMS.COMPUTERS,
    teacher: CONST_APIS.TEACHER_ROOMS.COMPUTERS,
    student: CONST_APIS.STUDENT_ROOMS.COMPUTERS,
  };
  return fetcher(apiMap[role](id), { method: CONST_METHODS.GET });
}
