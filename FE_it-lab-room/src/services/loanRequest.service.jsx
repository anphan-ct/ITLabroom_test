import { CONST_APIS } from "../constants/apis.constant";
import { CONST_METHODS } from "../constants/methods.constant";
import { fetcher } from "../helpers/fetcher.helper";

export const loanRequestService = {
  getAdminLoanRequests: (trangThai = "all", page = 1) => {
    return fetcher(`${CONST_APIS.LOAN_REQUESTS.ADMIN_INDEX}?trang_thai=${trangThai}&page=${page}`, {
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
  getTeacherLoanRequests: (page = 1) => {
    return fetcher(`${CONST_APIS.LOAN_REQUESTS.TEACHER_INDEX}?page=${page}`, {
      method: CONST_METHODS.GET,
    });
  },
  createTeacherLoanRequest: (data) => {
    return fetcher(CONST_APIS.LOAN_REQUESTS.TEACHER_STORE, {
      method: CONST_METHODS.POST,
      body: data,
    });
  },
};
