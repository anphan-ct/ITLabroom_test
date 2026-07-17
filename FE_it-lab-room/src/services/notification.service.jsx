import { CONST_APIS } from "../constants/apis.constant";
import { CONST_METHODS } from "../constants/methods.constant";
import { fetcher } from "../helpers/fetcher.helper";

export function getNotificationsFromApi(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const endpoint = query.toString()
    ? `${CONST_APIS.NOTIFICATIONS.INDEX}?${query.toString()}`
    : CONST_APIS.NOTIFICATIONS.INDEX;

  return fetcher(endpoint, {
    method: CONST_METHODS.GET,
  });
}

export function getUnreadNotificationCountFromApi() {
  return fetcher(CONST_APIS.NOTIFICATIONS.UNREAD_COUNT, {
    method: CONST_METHODS.GET,
  });
}

export function markNotificationAsReadFromApi(id) {
  return fetcher(CONST_APIS.NOTIFICATIONS.MARK_READ(id), {
    method: CONST_METHODS.PATCH,
  });
}

export function markAllNotificationsAsReadFromApi() {
  return fetcher(CONST_APIS.NOTIFICATIONS.MARK_ALL_READ, {
    method: CONST_METHODS.PATCH,
  });
}
