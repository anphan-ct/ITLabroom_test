import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import AppShell from "../../common/AppShell";
import SectionCard from "../../common/SectionCard";
import StatusBadge from "../../common/StatusBadge";
import {
  getComputerFromApi,
  getComputerQrImageUrl,
} from "../../../services/computer.service";

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

export default function ComputerDetailPage() {
  const { computerId } = useParams();
  const [computer, setComputer] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    getComputerFromApi(computerId)
      .then((response) => {
        if (isMounted) {
          setComputer(response.data);
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
        <Link
          to="/admin/computers"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách máy
        </Link>

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
          </>
        )}
      </div>
    </AppShell>
  );
}
