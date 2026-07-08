import { CONST_APIS } from "../constants/apis.constant";
import { CONST_METHODS } from "../constants/methods.constant";
import { fetcher } from "../helpers/fetcher.helper";

/**
 * Lấy danh sách phiếu bảo trì (admin), hỗ trợ search, filter, phân trang.
 */
export function getMaintenanceTickets(params = {}) {
  const queryParts = [];
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.status) queryParts.push(`status=${params.status}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  return fetcher(`${CONST_APIS.MAINTENANCE_TICKETS.INDEX}${queryString}`, {
    method: CONST_METHODS.GET,
  });
}


/**
 * Cập nhật phiếu bảo trì (admin).
 */
export function updateMaintenanceTicket(id, payload) {
  return fetcher(CONST_APIS.MAINTENANCE_TICKETS.UPDATE(id), {
    method: CONST_METHODS.PUT,
    body: payload,
  });
}
