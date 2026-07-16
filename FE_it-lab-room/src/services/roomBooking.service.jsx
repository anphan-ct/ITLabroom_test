import { CONST_APIS } from "../constants/apis.constant";
import { CONST_METHODS } from "../constants/methods.constant";
import { fetcher } from "../helpers/fetcher.helper";

export function getTeacherRoomBookingsFromApi(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const endpoint = query.toString()
    ? `${CONST_APIS.TEACHER_ROOM_BOOKINGS.INDEX}?${query.toString()}`
    : CONST_APIS.TEACHER_ROOM_BOOKINGS.INDEX;

  return fetcher(endpoint, {
    method: CONST_METHODS.GET,
  });
}

export function createTeacherRoomBookingFromApi(payload) {
  return fetcher(CONST_APIS.TEACHER_ROOM_BOOKINGS.STORE, {
    method: CONST_METHODS.POST,
    body: payload,
  });
}

export function createQuickTeacherRoomBookingFromApi(payload) {
  return fetcher(CONST_APIS.TEACHER_ROOM_BOOKINGS.QUICK_STORE, {
    method: CONST_METHODS.POST,
    body: payload,
  });
}

export function getAvailableRoomsFromApi(params) {
  const query = new URLSearchParams(params);

  return fetcher(`${CONST_APIS.TEACHER_ROOM_BOOKINGS.AVAILABILITY}?${query.toString()}`, {
    method: CONST_METHODS.GET,
  });
}

export function getAdminRoomBookingsFromApi(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const endpoint = query.toString()
    ? `${CONST_APIS.ADMIN_ROOM_BOOKINGS.INDEX}?${query.toString()}`
    : CONST_APIS.ADMIN_ROOM_BOOKINGS.INDEX;

  return fetcher(endpoint, { method: CONST_METHODS.GET });
}

export function updateAdminRoomBookingFromApi(id, approvalStatus) {
  return fetcher(CONST_APIS.ADMIN_ROOM_BOOKINGS.UPDATE(id), {
    method: "PATCH",
    body: { approval_status: approvalStatus },
  });
}
export function cancelTeacherRoomBookingFromApi(id) {
  return fetcher(CONST_APIS.TEACHER_ROOM_BOOKINGS.CANCEL(id), {
    method: "PATCH",
  });
}
