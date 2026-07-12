/**
 * Helper xử lý định dạng tiền tệ để hiển thị
 */

// Format số tiền dạng "50.000 VNĐ", làm tròn về số nguyên (VNĐ không có phần lẻ)
export function formatCurrencyVND(value) {
  const number = Number(value) || 0;
  return `${number.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} VNĐ`;
}
