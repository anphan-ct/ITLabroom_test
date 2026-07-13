import { CONST_APIS } from "../constants/apis.constant";
import { CONST_METHODS } from "../constants/methods.constant";
import { fetcher } from "../helpers/fetcher.helper";

export const loanRequestService = {
  getAdminLoanRequests: (trangThai = "all", page = 1, params = {}) => {
    const query = new URLSearchParams({ trang_thai: trangThai, page, per_page: 15, ...params }).toString();

    return fetcher(`${CONST_APIS.LOAN_REQUESTS.ADMIN_INDEX}?${query}`, {
      method: CONST_METHODS.GET,
    });
  },
  approveLoanRequest: (loanRequestId, action, computerIds = [], machineConditions = []) => {
    return fetcher(CONST_APIS.LOAN_REQUESTS.ADMIN_APPROVAL(loanRequestId), {
      method: CONST_METHODS.PATCH,
      body: {
        action,
        computer_ids: computerIds,
        machine_conditions: machineConditions,
      },
    });
  },
  createAdminLoanRequest: (data) => {
    return fetcher(CONST_APIS.LOAN_REQUESTS.ADMIN_STORE, {
      method: CONST_METHODS.POST,
      body: data,
    });
  },
  updateAdminLoanRequest: (id, data) => {
    return fetcher(CONST_APIS.LOAN_REQUESTS.ADMIN_UPDATE(id), {
      method: CONST_METHODS.PUT,
      body: data,
    });
  },
  deleteAdminLoanRequest: (id) => {
    return fetcher(CONST_APIS.LOAN_REQUESTS.ADMIN_DELETE(id), {
      method: CONST_METHODS.DELETE,
    });
  },
};
