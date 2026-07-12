import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import AppShell from "../../common/AppShell";
import DataTable from "../../common/DataTable";
import SectionCard from "../../common/SectionCard";
import StatusBadge from "../../common/StatusBadge";
import {
  getComputerFromApi,
  getComputerQrImageUrl,
} from "../../../services/computer.service";
import { getComputerTransfers } from "../../../services/computerTransfer.service";
import { getRepairLogs } from "../../../services/repairLog.service";
import { loanRequestService } from "../../../services/loanRequest.service";
import { returnRequestService } from "../../../services/returnRequest.service";
import { REPAIR_RESULT_LABELS } from "../../../constants/incident.constant";
import { formatDateTimeDisplay } from "../../../helpers/date-display.helper";

function getStatusLabel(status) {
  const statusLabels = {
    active: "Hoạt động",
    broken: "Hỏng",
    maintenance: "Bảo trì",
    borrowed: "Đang mượn",
  };

  return statusLabels[status] || status || "";
}

function SpecItem({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value || "-"}</div>
    </div>
  );
}

function NoteItem({ value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 sm:col-span-2 lg:col-span-4">
      <div className="text-xs font-bold uppercase text-slate-500">Ghi chú</div>
      <div className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-900">
        {value || "-"}
      </div>
    </div>
  );
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getRoomLabel(room) {
  if (!room) {
    return "-";
  }

  return [room.ma_phong, room.ten_phong].filter(Boolean).join(" - ") || "-";
}

function HistoryButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-lg border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"
      }`}
    >
      {children}
    </button>
  );
}

function getPaginatorItems(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
}

function buildLoanReturnHistories(loanItems, returnItems, computerId) {
  const normalizedComputerId = Number(computerId);
  const histories = [];

  loanItems.forEach((loan) => {
    (loan.details || [])
      .filter((detail) => Number(detail.ma_may_tinh) === normalizedComputerId)
      .forEach((detail) => {
        histories.push({
          id: `loan-${loan.id}-${detail.id}`,
          type: "Mượn",
          code: loan.ma_phieu_muon || `#${loan.id}`,
          person: loan.nguoi_muon || loan.ten_giang_vien || "-",
          time: loan.ngay_muon,
          status: loan.trang_thai,
          condition: detail.tinh_trang_khi_muon,
          returnStatus: detail.trang_thai_tra,
          note: detail.ghi_chu || loan.ly_do_muon || "",
        });
      });
  });

  returnItems.forEach((returnRequest) => {
    (returnRequest.details || [])
      .filter((detail) => Number(detail.ma_may_tinh) === normalizedComputerId)
      .forEach((detail) => {
        histories.push({
          id: `return-${returnRequest.id}-${detail.id}`,
          type: "Trả",
          code: returnRequest.ma_phieu_tra || `#${returnRequest.id}`,
          person: returnRequest.nguoi_muon || returnRequest.ten_giang_vien || "-",
          time: returnRequest.thoi_gian_tra,
          status: returnRequest.trang_thai,
          condition: detail.tinh_trang_khi_tra,
          returnStatus: "",
          note: detail.ghi_chu || returnRequest.ghi_chu || "",
        });
      });
  });

  return histories.sort((a, b) => String(b.time || "").localeCompare(String(a.time || "")));
}

export default function ComputerDetailPage() {
  const { computerId } = useParams();
  const [computer, setComputer] = useState(null);
  const [activeHistory, setActiveHistory] = useState("");
  const [transferHistories, setTransferHistories] = useState([]);
  const [repairHistories, setRepairHistories] = useState([]);
  const [loanReturnHistories, setLoanReturnHistories] = useState([]);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const normalizedComputerId = Number(computerId);

    setError("");
    setHistoryError("");
    setActiveHistory("");
    setTransferHistories([]);
    setRepairHistories([]);
    setLoanReturnHistories([]);

    if (!computerId || Number.isNaN(normalizedComputerId)) {
      if (isMounted) {
        setComputer(null);
        setError("Không xác định được mã máy tính.");
      }
      return () => {
        isMounted = false;
      };
    }

    getComputerFromApi(normalizedComputerId)
      .then((computerResponse) => {
        if (isMounted) {
          setComputer(computerResponse.data);
        }
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(apiError.message || "Không thể tải thông tin máy tính.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [computerId]);

  const loadHistory = (historyType) => {
    const normalizedComputerId = Number(computerId);

    setActiveHistory(historyType);
    setHistoryError("");

    if (!computerId || Number.isNaN(normalizedComputerId)) {
      setHistoryError("Không xác định được mã máy tính.");
      return;
    }

    if (historyType === "transfer" && transferHistories.length > 0) {
      return;
    }

    if (historyType === "repair" && repairHistories.length > 0) {
      return;
    }

    if (historyType === "loan-return" && loanReturnHistories.length > 0) {
      return;
    }

    setIsHistoryLoading(true);

    const request = historyType === "transfer"
      ? getComputerTransfers({ computer_id: normalizedComputerId })
      : historyType === "repair"
        ? getRepairLogs({ ma_may_tinh: normalizedComputerId })
        : Promise.all([
            loanRequestService.getAdminLoanRequests("all", 1, { ma_may_tinh: normalizedComputerId }),
            returnRequestService.getAdminReturnRequests("all", 1, { ma_may_tinh: normalizedComputerId }),
          ]);

    request
      .then((response) => {
        if (historyType === "transfer") {
          setTransferHistories(response.data || []);
          return;
        }

        if (historyType === "loan-return") {
          const [loanResponse, returnResponse] = response;
          setLoanReturnHistories(buildLoanReturnHistories(
            getPaginatorItems(loanResponse),
            getPaginatorItems(returnResponse),
            normalizedComputerId
          ));
          return;
        }

        setRepairHistories(response.data || []);
      })
      .catch((apiError) => {
        setHistoryError(apiError.message || "Không thể tải lịch sử của máy tính.");
      })
      .finally(() => {
        setIsHistoryLoading(false);
      });
  };

  const handlePrintQrCode = () => {
    if (!computer?.ma_qr) {
      setError("Máy tính này chưa có mã QR để in.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=520,height=720");

    if (!printWindow) {
      setError("Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép pop-up rồi thử lại.");
      return;
    }

    const qrImageUrl = getComputerQrImageUrl(computer.ma_qr, 320);
    const roomLabel = [computer.phong?.ma_phong, computer.phong?.ten_phong].filter(Boolean).join(" - ");

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>In mã QR ${escapeHtml(computer.ma_may)}</title>
          <style>
            @page { size: 80mm 100mm; margin: 6mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              color: #0f172a;
              font-family: Arial, sans-serif;
              background: #ffffff;
            }
            .label {
              width: 100%;
              min-height: 88mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 8px;
              border: 1px solid #cbd5e1;
              padding: 12px;
              text-align: center;
            }
            .title {
              font-size: 18px;
              font-weight: 800;
              line-height: 1.2;
            }
            .room {
              font-size: 12px;
              font-weight: 700;
              color: #475569;
            }
            img {
              width: 58mm;
              height: 58mm;
              image-rendering: crisp-edges;
            }
            .code {
              max-width: 100%;
              overflow-wrap: anywhere;
              font-size: 10px;
              color: #334155;
            }
            .screen-actions {
              margin: 14px auto;
              display: flex;
              justify-content: center;
              gap: 8px;
            }
            button {
              border: 0;
              border-radius: 6px;
              background: #2563eb;
              color: #ffffff;
              cursor: pointer;
              font-size: 13px;
              font-weight: 700;
              padding: 8px 12px;
            }
            @media print {
              .screen-actions { display: none; }
              .label { border-color: #000000; }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="title">${escapeHtml(computer.ma_may)}</div>
            <div class="room">${escapeHtml(roomLabel || computer.ten_may || "")}</div>
            <img src="${qrImageUrl}" alt="QR ${escapeHtml(computer.ma_may)}" />
            <div class="code">${escapeHtml(computer.ma_qr)}</div>
          </div>
          <div class="screen-actions">
            <button type="button" onclick="window.print()">In mã QR</button>
            <button type="button" onclick="window.close()">Đóng</button>
          </div>
          <script>
            const image = document.querySelector("img");
            image.addEventListener("load", () => {
              window.focus();
              setTimeout(() => window.print(), 250);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AppShell
      role="admin"
      title={computer ? `Máy tính ${computer.ma_may}` : "Chi tiết máy tính"}
      subtitle="Thông tin định danh, phòng máy và cấu hình thiết bị"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/computers"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách máy
          </Link>

          <HistoryButton
            active={activeHistory === "transfer"}
            onClick={() => loadHistory("transfer")}
          >
            Lịch sử điều chuyển
          </HistoryButton>

          <HistoryButton
            active={activeHistory === "repair"}
            onClick={() => loadHistory("repair")}
          >
            Lịch sử sửa chữa
          </HistoryButton>

          <HistoryButton
            active={activeHistory === "loan-return"}
            onClick={() => loadHistory("loan-return")}
          >
            Lịch sử mượn trả
          </HistoryButton>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}
        {computer && (
          <>
            <SectionCard title="Thông tin máy tính">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SpecItem label="Mã máy" value={computer.ma_may} />
                <SpecItem label="Tên máy" value={computer.ten_may} />
                <SpecItem label="Mã phòng" value={computer.phong?.ma_phong} />
                <SpecItem label="Tên phòng" value={computer.phong?.ten_phong} />
                <SpecItem label="Vị trí" value={computer.vi_tri} />
                <SpecItem label="Mã QR" value={computer.ma_qr} />
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="text-xs font-bold uppercase text-slate-500">Trạng thái</div>
                  <div className="mt-2">
                    <StatusBadge value={getStatusLabel(computer.trang_thai)} />
                  </div>
                </div>
                <NoteItem value={computer.ghi_chu} />
              </div>
            </SectionCard>

            <SectionCard
              title="Mã QR"
              rightAction={
                <button
                  type="button"
                  onClick={handlePrintQrCode}
                  disabled={!computer.ma_qr}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Printer size={16} />
                  In mã QR
                </button>
              }
            >
              {computer.ma_qr ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="w-fit rounded-lg border border-slate-200 bg-white p-3">
                    <img
                      src={getComputerQrImageUrl(computer.ma_qr, 180)}
                      alt={`QR ${computer.ma_may}`}
                      className="h-[180px] w-[180px]"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">Giá trị mã QR</p>
                    <p className="mt-2 break-all text-base font-bold text-slate-900">{computer.ma_qr}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                  Máy tính này chưa có mã QR.
                </div>
              )}
            </SectionCard>

            <SectionCard title="Cấu hình máy">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SpecItem label="CPU" value={computer.bo_xu_ly} />
                <SpecItem label="RAM" value={computer.ram} />
                <SpecItem label="Card đồ họa" value={computer.card_do_hoa} />
                <SpecItem label="Bo mạch chủ" value={computer.bo_mach_chu} />
                <SpecItem label="Màn hình" value={computer.man_hinh} />
                <SpecItem label="Bàn phím" value={computer.ban_phim} />
                <SpecItem label="Chuột" value={computer.chuot} />
                <SpecItem label="HDD" value={computer.hdd} />
                <SpecItem label="SSD" value={computer.ssd} />
              </div>
            </SectionCard>

            {historyError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                {historyError}
              </div>
            )}

            {activeHistory === "transfer" && (
              <SectionCard title="Lịch sử điều chuyển">
                <DataTable
                  columns={[
                    {
                      key: "phong_cu",
                      title: "Phòng cũ",
                      render: (value) => getRoomLabel(value),
                    },
                    {
                      key: "phong_moi",
                      title: "Phòng mới",
                      render: (value) => getRoomLabel(value),
                    },
                    {
                      key: "nguoi_dieu_chuyen",
                      title: "Người điều chuyển",
                      render: (value) => value?.ho_ten || "-",
                    },
                    {
                      key: "thoi_gian_dieu_chuyen",
                      title: "Thời gian",
                      render: (value) => formatDateTimeDisplay(value, false),
                    },
                    { key: "ly_do", title: "Lý do", render: (value) => value || "-" },
                    { key: "ghi_chu", title: "Ghi chú", render: (value) => value || "-" },
                  ]}
                  data={transferHistories}
                  emptyText={isHistoryLoading ? "Đang tải lịch sử điều chuyển..." : "Chưa có lịch sử điều chuyển"}
                />
              </SectionCard>
            )}

            {activeHistory === "repair" && (
              <SectionCard title="Lịch sử sửa chữa">
                <DataTable
                  columns={[
                    {
                      key: "ma_phieu_bao_tri",
                      title: "Phiếu BT",
                      render: (value) => (value ? `#${value}` : "-"),
                    },
                    {
                      key: "thoi_gian_sua",
                      title: "Thời gian sửa",
                      render: (value) => formatDateTimeDisplay(value, false),
                    },
                    { key: "noi_dung_sua", title: "Nội dung sửa", render: (value) => value || "-" },
                    {
                      key: "ket_qua",
                      title: "Kết quả",
                      render: (value) => <StatusBadge value={REPAIR_RESULT_LABELS[value] || value || "-"} />,
                    },
                    {
                      key: "chi_phi",
                      title: "Chi phí",
                      render: (value) => Number(value || 0).toLocaleString("vi-VN"),
                    },
                    {
                      key: "nguoi_sua",
                      title: "Người sửa",
                      render: (value) => value?.ho_ten || "-",
                    },
                  ]}
                  data={repairHistories}
                  emptyText={isHistoryLoading ? "Đang tải lịch sử sửa chữa..." : "Chưa có lịch sử sửa chữa"}
                />
              </SectionCard>
            )}

            {activeHistory === "loan-return" && (
              <SectionCard title="Lịch sử mượn trả">
                <DataTable
                  columns={[
                    { key: "type", title: "Loại" },
                    { key: "code", title: "Mã phiếu" },
                    { key: "person", title: "Người mượn" },
                    {
                      key: "time",
                      title: "Thời gian",
                      render: (value) => formatDateTimeDisplay(value, false),
                    },
                    {
                      key: "status",
                      title: "Trạng thái phiếu",
                      render: (value) => <StatusBadge value={value || "-"} />,
                    },
                    { key: "condition", title: "Tình trạng máy", render: (value) => getStatusLabel(value) || value || "-" },
                    { key: "returnStatus", title: "Trạng thái trả", render: (value) => value || "-" },
                    { key: "note", title: "Ghi chú", render: (value) => value || "-" },
                  ]}
                  data={loanReturnHistories}
                  emptyText={isHistoryLoading ? "Đang tải lịch sử mượn trả..." : "Chưa có lịch sử mượn trả"}
                />
              </SectionCard>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
