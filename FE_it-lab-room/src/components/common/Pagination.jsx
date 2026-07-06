import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Component phân trang tái sử dụng.
 * Hiển thị nút Previous/Next + số trang hiện tại.
 */
export default function Pagination({ currentPage, lastPage, onPageChange }) {
  if (lastPage <= 1) return null;

  // Tính danh sách các trang hiển thị (tối đa 5 trang xung quanh trang hiện tại)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(lastPage, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={16} />
      </button>

      {pageNumbers[0] > 1 && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(1)}
            className="inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            1
          </button>
          {pageNumbers[0] > 2 && (
            <span className="px-1 text-sm text-slate-400">…</span>
          )}
        </>
      )}

      {pageNumbers.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg border px-2 text-sm font-medium transition ${
            page === currentPage
              ? "border-blue-500 bg-blue-600 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {page}
        </button>
      ))}

      {pageNumbers[pageNumbers.length - 1] < lastPage && (
        <>
          {pageNumbers[pageNumbers.length - 1] < lastPage - 1 && (
            <span className="px-1 text-sm text-slate-400">…</span>
          )}
          <button
            type="button"
            onClick={() => onPageChange(lastPage)}
            className="inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {lastPage}
          </button>
        </>
      )}

      <button
        type="button"
        disabled={currentPage >= lastPage}
        onClick={() => onPageChange(currentPage + 1)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
