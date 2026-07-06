/**
 * Helper xử lý ngày giờ để hiển thị
 * Đảm bảo cắt chuỗi trực tiếp mà không dùng new Date() để tránh lỗi lệch timezone.
 */

export function parseDateString(value) {
  if (!value) return null;
  
  // value could be "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss.000000Z" or "YYYY-MM-DD HH:mm:ss"
  const isIso = value.includes('T');
  const hasSpace = value.includes(' ');
  
  let datePart = value;
  let timePart = "00:00:00";
  
  if (isIso) {
    const parts = value.split('T');
    datePart = parts[0];
    timePart = parts[1] ? parts[1].replace('Z', '').split('.')[0] : "00:00:00";
  } else if (hasSpace) {
    const parts = value.split(' ');
    datePart = parts[0];
    timePart = parts[1];
  }
  
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  
  if (!year || !month || !day) return null;
  
  return {
    year,
    month,
    day,
    hour: hour || 0,
    minute: minute || 0,
    second: second || 0
  };
}

export function formatDateDisplay(value) {
  if (!value) return "—";
  const parsed = parseDateString(value);
  if (!parsed) return "—";
  
  const d = String(parsed.day).padStart(2, '0');
  const m = String(parsed.month).padStart(2, '0');
  const yyyy = parsed.year;
  
  return `${d}/${m}/${yyyy}`;
}

export function formatDateTimeDisplay(value) {
  if (!value) return "—";
  const parsed = parseDateString(value);
  if (!parsed) return "—";
  
  const d = parsed.day; // không padding số 0 theo yêu cầu
  const m = parsed.month; // không padding số 0 theo yêu cầu
  const yyyy = parsed.year;
  
  const HH = String(parsed.hour).padStart(2, '0');
  const mm = String(parsed.minute).padStart(2, '0');
  const ss = String(parsed.second).padStart(2, '0');
  
  return `${HH}:${mm}:${ss} ${d}/${m}/${yyyy}`;
}
