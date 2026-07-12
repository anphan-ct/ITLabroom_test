import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";

export default function DataTable({
  columns,
  data = [],
  getRowLink,
  onRowClick,
  rowClassName,
  emptyText = "Chưa có dữ liệu để hiển thị",
  isLoading = false,
}) {
  const navigate = useNavigate();

  const handleRowClick = (event, row) => {
    const rowLink = getRowLink?.(row);

    if (event.target.closest("a,button,input,select,textarea")) {
      return;
    }

    if (onRowClick) {
      onRowClick(row);
      return;
    }

    if (rowLink) {
      navigate(rowLink);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="app-scrollbar overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-sm font-medium text-slate-500"
                  colSpan={columns.length}
                >
                  Đang tải...
                </td>
              </tr>
            ) : data.length > 0 ? data.map((row) => (
              <tr
                key={row.id}
                onClick={(event) => handleRowClick(event, row)}
                className={`transition hover:bg-blue-50/60 ${getRowLink || onRowClick ? "cursor-pointer" : ""} ${rowClassName?.(row) || ""}`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="max-w-[280px] px-4 py-3.5 align-top leading-6 text-slate-700"
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : col.isStatus
                        ? <StatusBadge value={row[col.key]} />
                        : row[col.key]}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td
                  className="px-4 py-10 text-center text-sm font-medium text-slate-500"
                  colSpan={columns.length}
                >
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
