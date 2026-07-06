import { CONST_APIS } from "../constants/apis.constant";
import { CONST_METHODS } from "../constants/methods.constant";
import { fetcher } from "../helpers/fetcher.helper";

export function getComputersFromApi(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${CONST_APIS.COMPUTERS.INDEX}?${query}` : CONST_APIS.COMPUTERS.INDEX;
  return fetcher(url, {
    method: CONST_METHODS.GET,
  });
}

export function getComputerFromApi(id) {
  return fetcher(CONST_APIS.COMPUTERS.SHOW(id), {
    method: CONST_METHODS.GET,
  });
}

export function updateComputerFromApi(id, payload) {
  return fetcher(CONST_APIS.COMPUTERS.UPDATE(id), {
    method: CONST_METHODS.PUT,
    body: payload,
  });
}

export function generateComputerQrCodeFromApi(id) {
  return fetcher(CONST_APIS.COMPUTERS.GENERATE_QR_CODE(id), {
    method: CONST_METHODS.PATCH,
  });
}

export function getComputerQrImageUrl(qrCode, size = 180) {
  if (!qrCode) {
    return "";
  }

  const encodedQrCode = encodeURIComponent(qrCode);

  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedQrCode}`;
}

export function deleteComputerFromApi(id) {
  return fetcher(CONST_APIS.COMPUTERS.DESTROY(id), {
    method: CONST_METHODS.DELETE,
  });
}
