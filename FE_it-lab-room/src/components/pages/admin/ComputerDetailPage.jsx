import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, QrCode } from "lucide-react";
import AppShell from "../../common/AppShell";
import SectionCard from "../../common/SectionCard";
import StatusBadge from "../../common/StatusBadge";
import {
  generateComputerQrCodeFromApi,
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

export default function ComputerDetailPage() {
  const { computerId } = useParams();
  const [computer, setComputer] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

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

  const handleGenerateQrCode = async () => {
    setError("");
    setSuccessMessage("");
    setIsGeneratingQr(true);

    try {
      const response = await generateComputerQrCodeFromApi(computerId);
      setComputer(response.data);
      setSuccessMessage("Đã tạo mã QR máy tính.");
    } catch (apiError) {
      setError(apiError.message || "Không thể tạo mã QR cho máy tính.");
    } finally {
      setIsGeneratingQr(false);
    }
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
        {successMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successMessage}
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

            <SectionCard title="Mã QR">
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
