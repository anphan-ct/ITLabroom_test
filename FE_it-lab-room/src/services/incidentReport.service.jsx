import { CONST_APIS } from "../constants/apis.constant";
import { CONST_METHODS } from "../constants/methods.constant";
import { fetcher } from "../helpers/fetcher.helper";

/**
 * Lấy danh sách báo cáo sự cố (admin), hỗ trợ search, filter, phân trang.
 */
export function getIncidentReports(params = {}) {
  const queryParts = [];
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.status) queryParts.push(`status=${params.status}`);
  if (params.severity) queryParts.push(`severity=${params.severity}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  return fetcher(`${CONST_APIS.INCIDENT_REPORTS.INDEX}${queryString}`, {
    method: CONST_METHODS.GET,
  });
}

/**
 * Cập nhật trạng thái báo cáo sự cố (admin) — tiếp nhận/từ chối.
 */
export function updateIncidentReportStatus(id, action) {
  return fetcher(CONST_APIS.INCIDENT_REPORTS.UPDATE_STATUS(id), {
    method: CONST_METHODS.PATCH,
    body: { action },
  });
}

/**
 * Lấy danh sách báo cáo sự cố của chính người đăng nhập (student/teacher).
 */
export function getMyIncidentReports(role, params = {}) {
  const apiMap = {
    teacher: CONST_APIS.TEACHER_INCIDENT_REPORTS.INDEX,
    student: CONST_APIS.STUDENT_INCIDENT_REPORTS.INDEX,
  };

  const queryParts = [];
  if (params.page) queryParts.push(`page=${params.page}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  return fetcher(`${apiMap[role]}${queryString}`, {
    method: CONST_METHODS.GET,
  });
}

/**
 * Tạo báo cáo sự cố mới (student/teacher).
 */
export function createIncidentReport(role, payload) {
  const apiMap = {
    teacher: CONST_APIS.TEACHER_INCIDENT_REPORTS.STORE,
    student: CONST_APIS.STUDENT_INCIDENT_REPORTS.STORE,
  };

  return fetcher(apiMap[role], {
    method: CONST_METHODS.POST,
    body: payload,
  });
}
