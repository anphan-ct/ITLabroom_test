import { CONST_APIS } from "../constants/apis.constant";
import { CONST_METHODS } from "../constants/methods.constant";
import { fetcher } from "../helpers/fetcher.helper";

export const returnRequestService = {
  getAdminReturnRequests: (trangThai = "all", page = 1, params = {}) => {
    const query = new URLSearchParams({ trang_thai: trangThai, page, ...params }).toString();

    return fetcher(`${CONST_APIS.RETURN_REQUESTS.ADMIN_INDEX}?${query}`, {
      method: CONST_METHODS.GET,
    });
  },
  confirmReturnRequest: (returnRequestId, action, machineConditions = []) => {
    return fetcher(CONST_APIS.RETURN_REQUESTS.ADMIN_CONFIRMATION(returnRequestId), {
      method: CONST_METHODS.PATCH,
      body: {
        action,
        machine_conditions: machineConditions,
      },
    });
  },
  getTeacherReturnRequests: (page = 1) => {
    return fetcher(`${CONST_APIS.RETURN_REQUESTS.TEACHER_INDEX}?page=${page}`, {
      method: CONST_METHODS.GET,
    });
  },
  createTeacherReturnRequest: (data) => {
    return fetcher(CONST_APIS.RETURN_REQUESTS.TEACHER_STORE, {
      method: CONST_METHODS.POST,
      body: data,
    });
  },
};
