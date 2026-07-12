import { CONST_APIS } from "../constants/apis.constant";
import { CONST_METHODS } from "../constants/methods.constant";
import { fetcher } from "../helpers/fetcher.helper";

// Lấy danh sách lịch sử điều chuyển máy tính
export function getComputerTransfers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${CONST_APIS.COMPUTER_TRANSFERS.INDEX}?${query}` : CONST_APIS.COMPUTER_TRANSFERS.INDEX;

  return fetcher(url, {
    method: CONST_METHODS.GET,
  });
}

// Tạo điều chuyển máy tính mới (cập nhật phòng + ghi log)
export function transferComputer(payload) {
  return fetcher(CONST_APIS.COMPUTER_TRANSFERS.STORE, {
    method: CONST_METHODS.POST,
    body: payload,
  });
}
