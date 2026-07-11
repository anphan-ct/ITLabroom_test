import { CONST_APIS } from "../constants/apis.constant";
import { CONST_METHODS } from "../constants/methods.constant";
import { fetcher } from "../helpers/fetcher.helper";

export const returnRequestService = {
  getAdminReturnRequests: (trangThai = "all", page = 1) => {
    return fetcher(`${CONST_APIS.RETURN_REQUESTS.ADMIN_INDEX}?trang_thai=${trangThai}&page=${page}`, {
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
  createAdminReturnRequest: (data) => {
    return fetcher(CONST_APIS.RETURN_REQUESTS.ADMIN_STORE, {
      method: CONST_METHODS.POST,
      body: data,
    });
  },
  updateAdminReturnRequest: (id, data) => {
    return fetcher(CONST_APIS.RETURN_REQUESTS.ADMIN_UPDATE(id), {
      method: CONST_METHODS.PUT,
      body: data,
    });
  },
};
