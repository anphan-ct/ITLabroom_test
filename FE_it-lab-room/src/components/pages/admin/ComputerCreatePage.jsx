import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, QrCode, Save } from "lucide-react";
import AppShell from "../../common/AppShell";
import SectionCard from "../../common/SectionCard";
import { Field, SelectInput, TextInput } from "./adminFormControls";
import {
  generateComputerQrCodeFromApi,
  getComputerFromApi,
  updateComputerFromApi,
} from "../../../services/computer.service";
import { getRoomsFromApi } from "../../../services/room.service";

const statuses = [
  { label: "Hoạt động", value: "active" },
  { label: "Hỏng", value: "broken" },
  { label: "Bảo trì", value: "maintenance" },
];

const initialForm = {
  code: "",
  name: "",
  roomId: "",
  position: "",
  qrCode: "",
  cpuBrand: "Intel",
  cpuModel: "",
  ramBrand: "",
  ramCapacity: "8GB",
  graphicCardType: "",
  graphicCardName: "",
  mainboard: "",
  monitor: "",
  keyboard: "",
  mouse: "",
  hdd: "",
  ssd: "",
  status: "active",
  note: "",
};

const cpuBrands = ["Intel", "AMD", "Apple M"];
const ramCapacities = ["4GB", "8GB", "16GB", "32GB", "64GB"];
const graphicCardOptions = ["Card Onboard", "Card Rời"];
const hddCapacities = ["500GB", "1TB", "2TB"];
const ssdCapacities = ["128GB", "256GB", "512GB", "1TB", "2TB"];

function joinText(...parts) {
  return parts.map((part) => part.trim()).filter(Boolean).join(" ");
}

function splitByKnownPrefix(value, prefixes, defaultPrefix = "") {
  const normalizedValue = value || "";
  const prefix = prefixes.find((item) => normalizedValue.toLowerCase().startsWith(item.toLowerCase()));

  if (!prefix) {
    return {
      prefix: defaultPrefix,
      rest: normalizedValue,
    };
  }

  return {
    prefix,
    rest: normalizedValue.slice(prefix.length).trim(),
  };
}

function splitRam(value) {
  const normalizedValue = value || "";
  const capacity = ramCapacities.find((item) => normalizedValue.toLowerCase().endsWith(item.toLowerCase()));

  if (!capacity) {
    return {
      brand: normalizedValue,
      capacity: "",
    };
  }

  return {
    brand: normalizedValue.slice(0, -capacity.length).trim(),
    capacity,
  };
}

function splitGraphicCard(value) {
  const normalizedValue = value || "";

  if (normalizedValue.toLowerCase().startsWith("card rời")) {
    return {
      type: "Card Rời",
      name: normalizedValue.slice("Card Rời".length).trim(),
    };
  }

  return {
    type: normalizedValue || "",
    name: "",
  };
}

function getGraphicCardName(formData) {
  if (formData.graphicCardType !== "Card Rời") {
    return formData.graphicCardType;
  }

  return joinText(formData.graphicCardType, formData.graphicCardName);
}

function mapComputerToForm(computer) {
  const cpu = splitByKnownPrefix(computer.bo_xu_ly, cpuBrands, "Intel");
  const ram = splitRam(computer.ram);
  const graphicCard = splitGraphicCard(computer.card_do_hoa);

  return {
    code: computer.ma_may || "",
    name: computer.ten_may || "",
    roomId: computer.ma_phong?.toString() || "",
    position: computer.vi_tri || "",
    qrCode: computer.ma_qr || "",
    cpuBrand: cpu.prefix,
    cpuModel: cpu.rest,
    ramBrand: ram.brand,
    ramCapacity: ram.capacity || "8GB",
    graphicCardType: graphicCard.type,
    graphicCardName: graphicCard.name,
    mainboard: computer.bo_mach_chu || "",
    monitor: computer.man_hinh || "",
    keyboard: computer.ban_phim || "",
    mouse: computer.chuot || "",
    hdd: computer.hdd || "",
    ssd: computer.ssd || "",
    status: computer.trang_thai || "active",
    note: computer.ghi_chu || "",
  };
}

function getApiErrorMessage(error) {
  const validationErrors = error.payload?.data;

  if (validationErrors && typeof validationErrors === "object") {
    const firstMessages = Object.values(validationErrors)[0];

    if (Array.isArray(firstMessages) && firstMessages[0]) {
      return firstMessages[0];
    }
  }

  return error.message || "Không thể lưu máy tính.";
}

export default function ComputerCreatePage() {
  const navigate = useNavigate();
  const { computerId } = useParams();
  const isEditing = Boolean(computerId);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const requests = isEditing
      ? [getRoomsFromApi({ includeStorage: true }), getComputerFromApi(computerId)]
      : [getRoomsFromApi({ includeStorage: true })];

    Promise.all(requests)
      .then(([roomsResponse, computerResponse]) => {
        if (!isMounted) {
          return;
        }

        const nextRooms = roomsResponse.data || [];
        setRooms(nextRooms);

        if (isEditing) {
          setFormData(mapComputerToForm(computerResponse.data));
        } else {
          setFormData((currentData) => ({
            ...currentData,
            roomId: nextRooms[0]?.id?.toString() || "",
          }));
        }
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(apiError.message || "Không thể tải dữ liệu máy tính.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [computerId, isEditing]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
      ...(name === "graphicCardType" && value !== "Card Rời" ? { graphicCardName: "" } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.code.trim() || !formData.name.trim() || !formData.roomId) {
      setError("Vui lòng nhập đầy đủ mã máy, tên máy và phòng.");
      return;
    }

    if (!isEditing) {
      setError("Vui lòng tạo máy mới thông qua chức năng phiếu nhập máy.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await updateComputerFromApi(computerId, {
        ma_phong: Number(formData.roomId),
        ma_may: formData.code.trim().toUpperCase(),
        ten_may: formData.name.trim(),
        vi_tri: formData.position.trim() || null,
        ma_qr: formData.qrCode.trim() || null,
        bo_xu_ly: joinText(formData.cpuBrand, formData.cpuModel) || null,
        ram: joinText(formData.ramBrand, formData.ramCapacity) || null,
        card_do_hoa: getGraphicCardName(formData) || null,
        bo_mach_chu: formData.mainboard.trim() || null,
        man_hinh: formData.monitor.trim() || null,
        ban_phim: formData.keyboard.trim() || null,
        chuot: formData.mouse.trim() || null,
        hdd: formData.hdd.trim() || null,
        ssd: formData.ssd.trim() || null,
        trang_thai: formData.status,
        ghi_chu: formData.note.trim() || null,
      });
      navigate("/admin/computers");
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateQrCode = async () => {
    if (!isEditing) {
      setError("Vui lòng tạo máy mới thông qua chức năng phiếu nhập máy.");
      return;
    }

    setError("");
    setIsGeneratingQr(true);

    try {
      const response = await generateComputerQrCodeFromApi(computerId);
      setFormData(mapComputerToForm(response.data));
    } catch (apiError) {
      setError(apiError.message || "Không thể tạo mã QR cho máy tính.");
    } finally {
      setIsGeneratingQr(false);
    }
  };

  return (
    <AppShell
      role="admin"
      title={isEditing ? "Sửa máy tính" : "Thêm máy tính"}
      subtitle={isEditing ? "Cập nhật thông tin định danh, cấu hình và trạng thái máy tính" : "Tạo thông tin định danh, cấu hình và trạng thái máy tính"}
    >
      <SectionCard
        title="Thông tin máy tính"
        rightAction={
          <Link
            to="/admin/computers"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Quay lại
          </Link>
        }
      >
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
            Đang tải dữ liệu máy tính...
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h3 className="text-sm font-bold text-slate-900">Thông tin máy tính</h3>
            </div>

            <Field label="Mã máy">
              <TextInput
                value={formData.code}
                onChange={(value) => handleChange({ target: { name: "code", value } })}
                placeholder="VD: PC022"
              />
            </Field>

            <Field label="Tên máy">
              <TextInput
                value={formData.name}
                onChange={(value) => handleChange({ target: { name: "name", value } })}
                placeholder="VD: Máy 22"
              />
            </Field>

            <Field label="Phòng">
              <SelectInput value={formData.roomId} onChange={(value) => handleChange({ target: { name: "roomId", value } })}>
                <option value="">Chọn phòng</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.ma_phong} - {room.ten_phong}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Trạng thái">
              <SelectInput value={formData.status} onChange={(value) => handleChange({ target: { name: "status", value } })}>
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Vị trí">
              <TextInput
                value={formData.position}
                onChange={(value) => handleChange({ target: { name: "position", value } })}
                placeholder="VD: Dãy A - Máy 01"
              />
            </Field>

            <Field label="Mã QR">
              <div className="flex gap-2">
                <TextInput
                  value={formData.qrCode || ""}
                  onChange={(value) => handleChange({ target: { name: "qrCode", value } })}
                  placeholder="VD: QR-PC022"
                />
                <button
                  type="button"
                  onClick={handleGenerateQrCode}
                  disabled={isGeneratingQr}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  <QrCode size={16} />
                  {isGeneratingQr ? "Đang tạo" : "Tạo lại mã QR"}
                </button>
              </div>
            </Field>
          </div>

          <div className="grid gap-4 rounded-lg border border-blue-200 bg-white p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h3 className="text-sm font-bold text-blue-700">Cấu hình chung</h3>
            </div>

            <Field label="Hãng CPU">
              <SelectInput value={formData.cpuBrand} onChange={(value) => handleChange({ target: { name: "cpuBrand", value } })}>
                {cpuBrands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Thế hệ / Mã CPU">
              <TextInput
                value={formData.cpuModel}
                onChange={(value) => handleChange({ target: { name: "cpuModel", value } })}
                placeholder="VD: Core i5 12400F"
              />
            </Field>

            <Field label="Hãng RAM">
              <TextInput
                value={formData.ramBrand}
                onChange={(value) => handleChange({ target: { name: "ramBrand", value } })}
                placeholder="VD: Kingston"
              />
            </Field>

            <Field label="Dung lượng RAM">
              <SelectInput value={formData.ramCapacity} onChange={(value) => handleChange({ target: { name: "ramCapacity", value } })}>
                <option value="">Chọn dung lượng RAM</option>
                {ramCapacities.map((capacity) => (
                  <option key={capacity} value={capacity}>{capacity}</option>
                ))}
              </SelectInput>
            </Field>

            <div className={formData.graphicCardType === "Card Rời" ? "" : "sm:col-span-2"}>
              <Field label="Card đồ họa">
                <SelectInput value={formData.graphicCardType} onChange={(value) => handleChange({ target: { name: "graphicCardType", value } })}>
                  <option value="">Chọn card đồ họa</option>
                  {graphicCardOptions.map((card) => (
                    <option key={card} value={card}>{card}</option>
                  ))}
                </SelectInput>
              </Field>
            </div>

            {formData.graphicCardType === "Card Rời" && (
              <Field label="Tên Card Rời">
                <TextInput
                  value={formData.graphicCardName}
                  onChange={(value) => handleChange({ target: { name: "graphicCardName", value } })}
                  placeholder="VD: RTX 3060"
                />
              </Field>
            )}

            <div className="sm:col-span-2">
              <Field label="Bo mạch chủ">
                <TextInput
                  value={formData.mainboard}
                  onChange={(value) => handleChange({ target: { name: "mainboard", value } })}
                  placeholder="VD: H610M"
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Màn hình">
                <TextInput
                  value={formData.monitor}
                  onChange={(value) => handleChange({ target: { name: "monitor", value } })}
                  placeholder="VD: Dell 21.5 inch"
                />
              </Field>
            </div>

            <Field label="HDD">
              <SelectInput value={formData.hdd} onChange={(value) => handleChange({ target: { name: "hdd", value } })}>
                <option value="">Không có HDD</option>
                {hddCapacities.map((capacity) => (
                  <option key={capacity} value={capacity}>{capacity}</option>
                ))}
                {formData.hdd && !hddCapacities.includes(formData.hdd) && (
                  <option value={formData.hdd}>{formData.hdd}</option>
                )}
              </SelectInput>
            </Field>

            <Field label="SSD">
              <SelectInput value={formData.ssd} onChange={(value) => handleChange({ target: { name: "ssd", value } })}>
                <option value="">Không có SSD</option>
                {ssdCapacities.map((capacity) => (
                  <option key={capacity} value={capacity}>{capacity}</option>
                ))}
                {formData.ssd && !ssdCapacities.includes(formData.ssd) && (
                  <option value={formData.ssd}>{formData.ssd}</option>
                )}
              </SelectInput>
            </Field>

            <Field label="Bàn phím">
              <TextInput
                value={formData.keyboard}
                onChange={(value) => handleChange({ target: { name: "keyboard", value } })}
                placeholder="VD: HP"
              />
            </Field>

            <Field label="Chuột">
              <TextInput
                value={formData.mouse}
                onChange={(value) => handleChange({ target: { name: "mouse", value } })}
                placeholder="VD: HP"
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Ghi chú">
                <TextInput
                  value={formData.note || ""}
                  onChange={(value) => handleChange({ target: { name: "note", value } })}
                  placeholder="Ghi chú máy tính"
                />
              </Field>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <Link
              to="/admin/computers"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Save size={16} />
              {isSaving ? "Đang lưu" : "Lưu máy tính"}
            </button>
          </div>
        </form>
        )}
      </SectionCard>
    </AppShell>
  );
}
