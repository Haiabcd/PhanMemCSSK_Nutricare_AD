import React, { useRef, useId, useEffect, useMemo, useState } from "react";
import { Leaf, X } from "lucide-react";
import type {
  IngredientCreationRequest,
  IngredientUpdateRequest,
} from "../../types/ingredients";
import {
  createIngredient,
  updateIngredient,
} from "../../service/ingredients.service";
import type { NutritionRequest, Unit } from "../../types/types";

/* ===== Common UI bits ===== */
function Label({
  children,
  required = false,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function FieldHintError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 mt-1">{message}</p>;
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  id,
  title,
  error,
  onBlur,
}: {
  value: string | number | undefined;
  onChange: (v: string | number | undefined) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  id?: string;
  title?: string;
  error?: string;
  onBlur?: () => void;
}) {
  const hasError = Boolean(error);
  return (
    <>
      <input
        id={id}
        title={title || placeholder || "input"}
        value={value ?? ""}
        onChange={(e) =>
          onChange(
            type === "number"
              ? e.target.value === ""
                ? undefined
                : Number(e.target.value)
              : e.target.value
          )
        }
        onBlur={onBlur}
        placeholder={placeholder ?? ""}
        type={type}
        aria-invalid={hasError}
        className={`w-full h-11 px-3 rounded-xl border focus:outline-none focus:ring-4 ${hasError
          ? "border-rose-300 focus:ring-rose-100"
          : "border-slate-200 focus:ring-green-100"
          }`}
      />
      <FieldHintError message={error} />
    </>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  id,
  title,
  error,
}: {
  value?: string;
  onChange: (v?: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
  title?: string;
  error?: string;
}) {
  const hasError = Boolean(error);
  return (
    <>
      <select
        id={id}
        title={title || placeholder || "select"}
        className={`w-full h-11 px-3 rounded-xl border bg-white focus:outline-none focus:ring-4 ${hasError
          ? "border-rose-300 focus:ring-rose-100"
          : "border-slate-200 focus:ring-green-100"
          }`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        aria-invalid={hasError}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <FieldHintError message={error} />
    </>
  );
}

/** ImagePicker: trả File để gửi BE + preview URL để hiển thị */
function ImagePicker({
  previewUrl,
  onPickedFile,
  onClear,
  inputId,
}: {
  previewUrl?: string;
  onPickedFile: (file: File, previewUrl: string) => void;
  onClear?: () => void;
  inputId?: string;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  const pick = () => ref.current?.click();
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onPickedFile(file, url);
    e.currentTarget.value = "";
  };
  return (
    <div className="space-y-2">
      {previewUrl ? (
        <div className="space-y-2">
          <img
            src={previewUrl}
            alt="preview"
            className="w-full max-h-40 object-cover rounded-xl border"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={pick}
              className="px-3 py-2.5 rounded-xl border border-slate-2 00 bg-white hover:bg-slate-50 text-slate-700"
            >
              Đổi ảnh…
            </button>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              >
                Xoá ảnh
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
          title="Chọn tệp"
        >
          Chọn tệp…
        </button>
      )}
      <input
        ref={ref}
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handle}
      />
      {!previewUrl && (
        <div className="text-xs text-slate-500">
          Chọn ảnh từ máy của bạn (JPEG/PNG…)
        </div>
      )}
    </div>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-[95vw] max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 grid place-items-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Leaf size={18} />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            aria-label="Đóng"
            title="Đóng"
          >
            ✕
          </button>
        </div>
        <div className="p-6 max-h-[75vh] overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ===== Validation ===== */
type ErrorMap = Partial<
  Record<
    | "name"
    | "calories"
    | "proteinG"
    | "carbG"
    | "fatG"
    | "fiberG"
    | "sodiumMg"
    | "sugarMg"
    | "unit"
    | "image",
    string
  >
>;

const NUTRIENT_KEYS: Array<keyof ErrorMap> = [
  "calories",
  "proteinG",
  "carbG",
  "fatG",
  "fiberG",
  "sodiumMg",
  "sugarMg",
];

function isEmptyString(v?: string) {
  return !v || v.trim() === "";
}

/* ===== Inner Form ===== */
function IngredientForm({
  form,
  setForm,
  errors,
  setErrors,
  aliases,
  setAliases,
  aliasError,
  setAliasError,
  imagePreview,
  setImageFileAndPreview,
}: {
  form: {
    name: string;
    unit: string; // "G" | "ML" | "L" | "MG"
    calories?: number;
    proteinG?: number;
    carbG?: number;
    fatG?: number;
    fiberG?: number;
    sodiumMg?: number;
    sugarMg?: number;
  };
  setForm: (fn: (prev: any) => any) => void;
  errors: ErrorMap;
  setErrors: React.Dispatch<React.SetStateAction<ErrorMap>>;
  aliases: string[];
  setAliases: (v: string[]) => void;
  aliasError?: string;
  setAliasError: (msg?: string) => void;
  imagePreview?: string;
  setImageFileAndPreview: (file?: File, previewUrl?: string) => void;
}) {
  const nameId = useId();
  const imgId = useId();
  const unitId = useId();

  // validate helpers
  const validateName = (name?: string) => {
    setErrors((e) => ({
      ...e,
      name: isEmptyString(name) ? "Vui lòng nhập tên" : undefined,
    }));
  };

  // normalize số
  useEffect(() => {
    const normalized: any = {};
    NUTRIENT_KEYS.forEach((k) => {
      const v = (form as any)[k] as number | undefined;
      if (v === undefined || v === (null as unknown as number)) {
        normalized[k] = 0;
      }
    });
    if (Object.keys(normalized).length) {
      setForm((prev: any) => ({ ...prev, ...normalized }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // aliases
  const [aliasInput, setAliasInput] = useState("");
  const addAlias = () => {
    const val = aliasInput.trim();
    if (!val) return;
    if (val.length > 100) {
      setAliasError("Mỗi alias tối đa 100 ký tự");
      return;
    }
    const exists = aliases.some((a) => a.toLowerCase() === val.toLowerCase());
    if (exists) {
      setAliasError("Alias đã tồn tại");
      return;
    }
    setAliases([...aliases, val]);
    setAliasInput("");
    setAliasError(undefined);
  };
  const removeAlias = (a: string) => {
    setAliases(aliases.filter((x) => x !== a));
    if (aliasError) setAliasError(undefined);
  };
  const onAliasKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addAlias();
    }
  };

  const unitReadable = form.unit.toLowerCase(); // g/ml/l/mg

  return (
    <div className="space-y-6">
      {/* Hàng 1: Tên – Ảnh */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 space-y-2">
          <Label htmlFor={nameId} required>
            Tên nguyên liệu
          </Label>
          <TextInput
            id={nameId}
            title="Tên nguyên liệu"
            value={form.name}
            onChange={(v) =>
              setForm((prev: any) => ({ ...prev, name: String(v ?? "") }))
            }
            onBlur={() => validateName(form.name)}
            placeholder="Ví dụ: Ức gà"
            error={errors.name}
          />
        </div>

        <div className="xl:col-span-5 space-y-2">
          <Label htmlFor={imgId} required>
            Ảnh
          </Label>
          <ImagePicker
            inputId={imgId}
            previewUrl={imagePreview}
            onPickedFile={(file, url) => setImageFileAndPreview(file, url)}
            onClear={() => setImageFileAndPreview(undefined, undefined)}
          />
          <FieldHintError message={errors.image} />
        </div>
      </div>

      {/* Hàng 2: Aliases */}
      <div className="space-y-2">
        <Label>Aliases (bí danh)</Label>
        <div className="flex items-center gap-2">
          <input
            value={aliasInput}
            onChange={(e) => {
              setAliasInput(e.target.value);
              if (aliasError) setAliasError(undefined);
            }}
            onKeyDown={onAliasKeyDown}
            className="flex-1 h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100"
            placeholder="Nhập alias và nhấn Enter"
          />
          <button
            type="button"
            onClick={addAlias}
            className="h-11 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            Thêm
          </button>
        </div>
        <FieldHintError message={aliasError} />
        {!!aliases.length && (
          <div className="flex flex-wrap gap-2 mt-2">
            {aliases.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs border-slate-200"
              >
                {a}
                <button
                  type="button"
                  className="ml-1 text-slate-500 hover:text-rose-600"
                  onClick={() => removeAlias(a)}
                  title="Xoá"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hàng 3: Đơn vị */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-2">
          <Label htmlFor={unitId} required>
            Đơn vị
          </Label>
          <Select
            id={unitId}
            title="Đơn vị"
            value={form.unit}
            onChange={(v) =>
              setForm((prev: any) => ({
                ...prev,
                unit: (v || "G").toUpperCase(),
              }))
            }
            options={["G", "ML", "L", "MG"]}
          />
          <FieldHintError message={errors.unit} />
        </div>
      </div>

      {/* Hàng 4: Dinh dưỡng trên 100 đơn vị */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-slate-700">
          Dinh dưỡng trên 100 {unitReadable}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <Label>Calo</Label>
            <TextInput
              type="number"
              value={form.calories}
              onChange={(v) =>
                setForm((prev: any) => ({
                  ...prev,
                  calories: v as number | undefined,
                }))
              }
              placeholder="kcal"
              error={errors.calories}
            />
          </div>
          <div className="space-y-2">
            <Label>Protein</Label>
            <TextInput
              type="number"
              value={form.proteinG}
              onChange={(v) =>
                setForm((prev: any) => ({
                  ...prev,
                  proteinG: v as number | undefined,
                }))
              }
              placeholder="g"
              error={errors.proteinG}
            />
          </div>
          <div className="space-y-2">
            <Label>Carb</Label>
            <TextInput
              type="number"
              value={form.carbG}
              onChange={(v) =>
                setForm((prev: any) => ({
                  ...prev,
                  carbG: v as number | undefined,
                }))
              }
              placeholder="g"
              error={errors.carbG}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Fat</Label>
            <TextInput
              type="number"
              value={form.fatG}
              onChange={(v) =>
                setForm((prev: any) => ({
                  ...prev,
                  fatG: v as number | undefined,
                }))
              }
              placeholder="g"
              error={errors.fatG}
            />
          </div>
          <div className="space-y-2">
            <Label>Fiber</Label>
            <TextInput
              type="number"
              value={form.fiberG}
              onChange={(v) =>
                setForm((prev: any) => ({
                  ...prev,
                  fiberG: v as number | undefined,
                }))
              }
              placeholder="g"
              error={errors.fiberG}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Sodium</Label>
            <TextInput
              type="number"
              value={form.sodiumMg}
              onChange={(v) =>
                setForm((prev: any) => ({
                  ...prev,
                  sodiumMg: v as number | undefined,
                }))
              }
              placeholder="mg"
              error={errors.sodiumMg}
            />
          </div>
          <div className="space-y-2">
            <Label>Sugar</Label>
            <TextInput
              type="number"
              value={form.sugarMg}
              onChange={(v) =>
                setForm((prev: any) => ({
                  ...prev,
                  sugarMg: v as number | undefined,
                }))
              }
              placeholder="mg"
              error={errors.sugarMg}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Map dữ liệu & Component chính ===== */
type AnyItem = any; // IngredientResponse | Ingredient

function mapItemToForm(item: AnyItem) {
  const per100 = (item?.per100 as any) || {};
  return {
    name: item?.name ?? "",
    unit: String(item?.unit ?? item?.servingUnit ?? "G").toUpperCase(),
    calories:
      typeof per100.kcal === "number"
        ? per100.kcal
        : typeof item?.kcalPer100g === "number"
          ? item.kcalPer100g
          : typeof item?.calories === "number"
            ? item.calories
            : 0,
    proteinG:
      typeof per100.proteinG === "number"
        ? per100.proteinG
        : typeof item?.proteinG === "number"
          ? item.proteinG
          : 0,
    carbG:
      typeof per100.carbG === "number"
        ? per100.carbG
        : typeof item?.carbG === "number"
          ? item.carbG
          : 0,
    fatG:
      typeof per100.fatG === "number"
        ? per100.fatG
        : typeof item?.fatG === "number"
          ? item.fatG
          : 0,
    fiberG:
      typeof per100.fiberG === "number"
        ? per100.fiberG
        : typeof item?.fiberG === "number"
          ? item.fiberG
          : 0,
    sodiumMg:
      typeof per100.sodiumMg === "number"
        ? per100.sodiumMg
        : typeof item?.sodiumMg === "number"
          ? item.sodiumMg
          : 0,
    sugarMg:
      typeof per100.sugarMg === "number"
        ? per100.sugarMg
        : typeof item?.sugarMg === "number"
          ? item.sugarMg
          : 0,
  };
}

function getImageUrlFromItem(item?: AnyItem): string | undefined {
  return item?.imageUrl ?? item?.image ?? undefined;
}

function getAliasesFromItem(item?: AnyItem): string[] {
  return Array.isArray(item?.aliases) ? item.aliases : [];
}

function getIdFromItem(item?: AnyItem): string | undefined {
  const id = item?.id;
  return typeof id === "string" ? id : id ? String(id) : undefined;
}

export default function AddAndUpdate({
  open,
  isEdit,
  initialItem,
  onClose,
  onSaved,
}: {
  open: boolean;
  isEdit: boolean;
  initialItem?: AnyItem | null;
  onClose: () => void;
  onSaved?: (updated?: AnyItem) => void;
}) {

  const [errors, setErrors] = useState<ErrorMap>({});
  const [aliasError, setAliasError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ảnh: lưu File để gửi BE + preview để hiển thị
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    undefined
  );

  // Aliases
  const [aliases, setAliases] = useState<string[]>([]);

  // Form state
  const [form, setForm] = useState({
    name: "",
    unit: "G", // G (default) | ML | L | MG
    calories: undefined as number | undefined,
    proteinG: undefined as number | undefined,
    carbG: undefined as number | undefined,
    fatG: undefined as number | undefined,
    fiberG: undefined as number | undefined,
    sodiumMg: undefined as number | undefined,
    sugarMg: undefined as number | undefined,
  });

  // Reset / Prefill khi mở modal
  useEffect(() => {
    if (!open) return;

    setErrors({});
    setAliasError(undefined);
    setIsSubmitting(false);

    if (isEdit && initialItem) {
      const mapped = mapItemToForm(initialItem);
      setForm({
        name: mapped.name ?? "",
        unit: String(mapped.unit || "G").toUpperCase(),
        calories: mapped.calories ?? 0,
        proteinG: mapped.proteinG ?? 0,
        carbG: mapped.carbG ?? 0,
        fatG: mapped.fatG ?? 0,
        fiberG: mapped.fiberG ?? 0,
        sodiumMg: mapped.sodiumMg ?? 0,
        sugarMg: mapped.sugarMg ?? 0,
      });
      setAliases(getAliasesFromItem(initialItem));
      setImageFile(undefined); // khi edit, preview từ URL; user đổi ảnh thì set file
      setImagePreview(getImageUrlFromItem(initialItem));
    } else {
      // thêm mới
      setForm({
        name: "",
        unit: "G",
        calories: 0,
        proteinG: 0,
        carbG: 0,
        fatG: 0,
        fiberG: 0,
        sodiumMg: 0,
        sugarMg: 0,
      });
      setAliases([]);
      setImageFile(undefined);
      setImagePreview(undefined);
    }
  }, [open, isEdit, initialItem]);

  const setImageFileAndPreview = (file?: File, previewUrl?: string) => {
    setImageFile(file);
    setImagePreview(previewUrl);
    setErrors((prev) => ({ ...prev, image: undefined }));
  };

  // Cho phép submit khi có tên & có ảnh (ảnh cũ khi edit hoặc ảnh file khi thêm mới)
  const canSubmit = useMemo(() => {
    const hasName = !!form.name && form.name.trim().length > 0;
    const hasImage = !!imageFile || !!imagePreview;
    return hasName && hasImage && !isSubmitting;
  }, [form.name, imageFile, imagePreview, isSubmitting]);

  const buildCreationPayload = (): IngredientCreationRequest => {
    const per100: NutritionRequest = {
      kcal: form.calories ?? 0,
      proteinG: form.proteinG ?? 0,
      carbG: form.carbG ?? 0,
      fatG: form.fatG ?? 0,
      fiberG: form.fiberG ?? 0,
      sodiumMg: form.sodiumMg ?? 0,
      sugarMg: form.sugarMg ?? 0,
    };

    if (!imageFile) {
      throw new Error("IMAGE_REQUIRED");
    }

    const unit = (form.unit.toUpperCase() as Unit) ?? ("G" as Unit);

    return {
      name: form.name || "",
      per100,
      image: imageFile,
      aliases,
      unit,
    };
  };

  const buildUpdatePayload = (): IngredientUpdateRequest => {
    const per100: NutritionRequest = {
      kcal: form.calories ?? 0,
      proteinG: form.proteinG ?? 0,
      carbG: form.carbG ?? 0,
      fatG: form.fatG ?? 0,
      fiberG: form.fiberG ?? 0,
      sodiumMg: form.sodiumMg ?? 0,
      sugarMg: form.sugarMg ?? 0,
    };

    const unit = (form.unit.toUpperCase() as Unit) ?? ("G" as Unit);

    // Image là optional khi update (nếu user không chọn file mới thì không gửi field image)
    return {
      name: form.name || "",
      per100,
      image: imageFile as any, // service sẽ chỉ append nếu có file
      aliases,
      unit,
    };
  };

  const handleSave = async () => {
    try {
      setErrors({});
      setAliasError(undefined);

      // validate chung
      if (!form.name?.trim()) {
        setErrors((prev) => ({ ...prev, name: "Vui lòng nhập tên" }));
        return;
      }

      if (!isEdit) {
        // create: bắt buộc ảnh
        if (!imageFile) {
          setErrors((prev) => ({ ...prev, image: "Vui lòng chọn ảnh" }));
          return;
        }
      } else {
        // edit: chấp nhận ảnh cũ (imagePreview) hoặc ảnh mới (imageFile)
        if (!imageFile && !imagePreview) {
          setErrors((prev) => ({ ...prev, image: "Vui lòng chọn ảnh" }));
          return;
        }
      }

      setIsSubmitting(true);

      if (isEdit) {
        const id = getIdFromItem(initialItem);
        if (!id) {
          setErrors((prev) => ({
            ...prev,
            name: "Thiếu ID nguyên liệu để cập nhật.",
          }));
          return;
        }
        const payload = buildUpdatePayload();
        console.log("Updating ingredient", id, payload);
        await updateIngredient(id, payload);

        // Tự build lại object updated dựa trên initialItem + form hiện tại
        const updatedPer100 = {
          ...(initialItem?.per100 ?? {}),
          kcal: form.calories ?? 0,
          proteinG: form.proteinG ?? 0,
          carbG: form.carbG ?? 0,
          fatG: form.fatG ?? 0,
          fiberG: form.fiberG ?? 0,
          sodiumMg: form.sodiumMg ?? 0,
          sugarMg: form.sugarMg ?? 0,
        };

        const updated: AnyItem = {
          ...initialItem,
          id,
          name: form.name,
          unit: form.unit.toUpperCase(),
          per100: updatedPer100,
          aliases,
        };

        // Nếu có preview (ảnh cũ hoặc ảnh mới) thì cho UI dùng luôn
        if (imagePreview) {
          (updated as any).imageUrl = imagePreview;
          (updated as any).image = imagePreview;
        }

        onSaved?.(updated);
      } else {
        const payload = buildCreationPayload();
        await createIngredient(payload);

        // Thêm mới: không có id từ BE, để parent refetch
        onSaved?.();
      }

      onClose();

    } catch (e) {
      const rawMsg = (e as { message?: string })?.message ?? "";
      const msgLower = rawMsg.toLowerCase();

      // ====== ❶ Lỗi 409: trùng tên ======
      if (
        /\b409\b/.test(rawMsg) ||
        /đã tồn tại/i.test(rawMsg) ||
        /duplicate|exists/i.test(msgLower)
      ) {
        setErrors((prev) => ({
          ...prev,
          name: "Nguyên liệu đã tồn tại. Vui lòng nhập tên khác.",
        }));
        return;
      }

      // ====== ❷ Lỗi 400 liên quan ảnh ======
      if (/\b400\b/.test(rawMsg) && /(image|ảnh)/i.test(msgLower)) {
        setErrors((prev) => ({
          ...prev,
          image: "Ảnh không hợp lệ. Vui lòng chọn ảnh khác.",
        }));
        return;
      }

      // ====== ❸ Lỗi 413: ảnh quá lớn ======
      if (/\b413\b/.test(rawMsg) || /too large|kích thước/i.test(msgLower)) {
        setErrors((prev) => ({
          ...prev,
          image: "Ảnh quá lớn. Hãy chọn ảnh kích thước nhỏ hơn.",
        }));
        return;
      }

      // ====== ❹ Lỗi 5xx: lỗi hệ thống, không bind vào field name ======
      if (
        /\b(500|501|502|503|504)\b/.test(rawMsg) ||
        /http\s+5\d{2}/i.test(rawMsg)
      ) {
        console.error("Server error when saving ingredient:", rawMsg, e);
        window.alert(
          "Hệ thống đang gặp sự cố khi xử lý nguyên liệu. Vui lòng thử lại sau."
        );
        return;
      }

      // ====== ❺ Các lỗi khác: gắn vào field name như cũ ======
      setErrors((prev) => ({
        ...prev,
        name:
          rawMsg ||
          (isEdit
            ? "Cập nhật nguyên liệu thất bại. Vui lòng thử lại."
            : "Thêm nguyên liệu thất bại. Vui lòng thử lại."),
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Cập nhật nguyên liệu" : "Thêm nguyên liệu"}
    >
      <IngredientForm
        form={form}
        setForm={(fn) =>
          setForm((prev) => (typeof fn === "function" ? fn(prev) : fn))
        }
        errors={errors}
        setErrors={setErrors}
        aliases={aliases}
        setAliases={setAliases}
        aliasError={aliasError}
        setAliasError={setAliasError}
        imagePreview={imagePreview}
        setImageFileAndPreview={setImageFileAndPreview}
      />
      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          className="px-4 py-2 rounded-xl border border-slate-200"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Huỷ
        </button>
        <button
          className={`px-4 py-2 rounded-xl text-white inline-flex items-center gap-2 ${canSubmit
            ? "bg-green-600 hover:bg-green-700"
            : "bg-slate-300 cursor-not-allowed"
            }`}
          onClick={handleSave}
          disabled={!canSubmit}
        >
          {isSubmitting && (
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full" />
          )}
          {isEdit ? "Cập nhật" : "Thêm"}
        </button>
      </div>
    </Modal>
  );
}
