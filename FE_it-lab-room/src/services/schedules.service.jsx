import { CONST_APIS } from "../constants/apis.constant";
import { CONST_METHODS } from "../constants/methods.constant";
import { fetcher } from "../helpers/fetcher.helper";

export function getComputerLabSchedulesFromApi(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  const endpoint = queryString
    ? `${CONST_APIS.SCHEDULES.INDEX}?${queryString}`
    : CONST_APIS.SCHEDULES.INDEX;

  return fetcher(endpoint, { method: CONST_METHODS.GET });
}

export function getComputerLabScheduleOptionsFromApi() {
  return fetcher(CONST_APIS.SCHEDULES.OPTIONS, {
    method: CONST_METHODS.GET,
  });
}

export function createComputerLabScheduleFromApi(payload) {
  return fetcher(CONST_APIS.SCHEDULES.STORE, {
    method: CONST_METHODS.POST,
    body: payload,
  });
}

export function importComputerLabSchedulesFromApi(payload) {
  return fetcher(CONST_APIS.SCHEDULES.IMPORT, {
    method: CONST_METHODS.POST,
    body: payload,
  });
}

export function getComputerLabScheduleFromApi(id) {
  return fetcher(CONST_APIS.SCHEDULES.SHOW(id), {
    method: CONST_METHODS.GET,
  });
}

export function updateComputerLabScheduleFromApi(id, payload) {
  return fetcher(CONST_APIS.SCHEDULES.UPDATE(id), {
    method: CONST_METHODS.PUT,
    body: payload,
  });
}

export function deleteComputerLabScheduleFromApi(id) {
  return fetcher(CONST_APIS.SCHEDULES.DESTROY(id), {
    method: CONST_METHODS.DELETE,
  });
}

export function getTeacherComputerLabSchedulesFromApi(params = {}) {
  return getRoleComputerLabSchedules(
    CONST_APIS.TEACHER_SCHEDULES.INDEX,
    params,
  );
}

export function getStudentComputerLabSchedulesFromApi(params = {}) {
  return getRoleComputerLabSchedules(
    CONST_APIS.STUDENT_SCHEDULES.INDEX,
    params,
  );
}

function getRoleComputerLabSchedules(endpoint, params) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const queryString = query.toString();

  return fetcher(queryString ? `${endpoint}?${queryString}` : endpoint, {
    method: CONST_METHODS.GET,
  });
}
