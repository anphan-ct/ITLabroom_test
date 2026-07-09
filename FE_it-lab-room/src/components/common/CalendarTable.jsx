export default function CalendarTable({ data }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Thứ</th>
            <th className="px-4 py-3 text-left">Thời gian</th>
            <th className="px-4 py-3 text-left">Phòng</th>
            <th className="px-4 py-3 text-left">Môn học</th>
            <th className="px-4 py-3 text-left">Lớp</th>
            <th className="px-4 py-3 text-left">Giảng viên</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{item.day}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{item.time}</td>
              <td className="whitespace-nowrap px-4 py-3 font-semibold text-blue-700">{item.room}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{item.subject}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{item.className}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{item.teacher}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
