import { CONST_APIS } from "../constants/apis.constant";
import { CONST_METHODS } from "../constants/methods.constant";
import { fetcher } from "../helpers/fetcher.helper";

/**
 * Lấy danh sách nhật ký sửa chữa (admin), hỗ trợ search, filter, phân trang.
 */
export function getRepairLogs(params = {}) {
  const queryParts = [];
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.ma_phieu_bao_tri) queryParts.push(`ma_phieu_bao_tri=${params.ma_phieu_bao_tri}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  return fetcher(`${CONST_APIS.REPAIR_LOGS.INDEX}${queryString}`, {
    method: CONST_METHODS.GET,
  });
}

/**
 * Tạo nhật ký sửa chữa mới (admin).
 */
export function createRepairLog(payload) {
  return fetcher(CONST_APIS.REPAIR_LOGS.STORE, {
    method: CONST_METHODS.POST,
    body: payload,
  });
}
