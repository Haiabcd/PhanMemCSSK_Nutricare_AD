// src/components/Ingredients/AddAndUpdate.tsx
import React, { useRef, useId, useEffect, useMemo, useState } from "react";
import { Leaf } from "lucide-react";
import type { IngredientDraft } from "../../types/ingredients";
import { createIngredient, updateIngredient } from "../../service/ingredients.service";

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
}: {
    value: string | number | undefined;
    onChange: (v: string | number | undefined) => void;
    placeholder?: string;
    type?: React.HTMLInputTypeAttribute;
    id?: string;
    title?: string;
    error?: string;
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
                            ? e.target.value === "" ? undefined : Number(e.target.value)
                            : e.target.value
                    )
                }
                placeholder={placeholder ?? ""}
                type={type}
                aria-invalid={hasError}
                className={`w-full h-11 px-3 rounded-xl border focus:outline-none focus:ring-4 ${hasError ? "border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:ring-green-100"
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
                className={`w-full h-11 px-3 rounded-xl border bg-white focus:outline-none focus:ring-4 ${hasError ? "border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:ring-green-100"
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

function NumberInput({
    value,
    onChange,
    id,
    title,
    placeholder,
    suffix,
    error,
}: {
    value?: number;
    onChange: (n?: number) => void;
    id?: string;
    title?: string;
    placeholder?: string;
    suffix?: string;
    error?: string;
}) {
    const hasError = Boolean(error);
    return (
        <div className="relative">
            <input
                id={id}
                title={title || placeholder || "number"}
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                placeholder={placeholder ?? ""}
                type="number"
                inputMode="decimal"
                aria-invalid={hasError}
                className={`w-full h-11 pr-12 pl-3 rounded-xl border focus:outline-none focus:ring-4 ${hasError ? "border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:ring-green-100"
                    }`}
            />
            {suffix && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    {suffix}
                </span>
            )}
            <FieldHintError message={error} />
        </div>
    );
}

function ImagePicker({
    value,
    onPicked,
    onClear,
    inputId,
}: {
    value?: string;
    onPicked: (dataUrl: string) => void;
    onClear?: () => void;
    inputId?: string;
}) {
    const ref = useRef<HTMLInputElement | null>(null);
    const pick = () => ref.current?.click();
    const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => onPicked(String(reader.result));
        reader.readAsDataURL(file);
        e.currentTarget.value = "";
    };
    return (
        <div className="space-y-2">
            {value ? (
                <div className="space-y-2">
                    <img src={value} alt="preview" className="w-full max-h-40 object-cover rounded-xl border" />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={pick}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
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
            <input ref={ref} id={inputId} type="file" accept="image/*" className="hidden" onChange={handle} />
            {!value && <div className="text-xs text-slate-500">Chọn ảnh từ máy của bạn (JPEG/PNG…)</div>}
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
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
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
                <div className="p-6 max-h-[75vh] overflow-y-auto scrollbar-hide">{children}</div>
            </div>
        </div>
    );
}

/* ===== Validation ===== */
type ErrorMap = Partial<
    Record<
        | "name"
        | "servingSize"
        | "servingUnit"
        | "unitWeightGram"
        | "calories"
        | "proteinG"
        | "carbG"
        | "fatG"
        | "fiberG"
        | "sodiumMg"
        | "sugarMg",
        string
    >
>;

const LABELS: Record<keyof ErrorMap, string> = {
    name: "Tên",
    servingSize: "Khẩu phần",
    servingUnit: "Đơn vị khẩu phần",
    unitWeightGram: "Trọng lượng 1 đơn vị",
    calories: "Calo",
    proteinG: "Protein",
    carbG: "Carb",
    fatG: "Fat",
    fiberG: "Fiber",
    sodiumMg: "Sodium",
    sugarMg: "Sugar",
};

const NUMERIC_KEYS: Array<keyof ErrorMap> = [
    "servingSize",
    "unitWeightGram",
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

/* ===== Form ===== */
function IngredientForm({
    draft,
    setDraft,
    errors,
    setErrors,
}: {
    draft: IngredientDraft;
    setDraft: (v: IngredientDraft) => void;
    errors: ErrorMap;
    setErrors: React.Dispatch<React.SetStateAction<ErrorMap>>;
}) {
    const nameId = useId();
    const imgId = useId();
    const descId = useId();
    const servingSizeId = useId();
    const servingUnitId = useId();
    const unitWeightId = useId();

    // --- validate helpers ---
    const validateName = (name?: string) => {
        setErrors((e) => ({ ...e, name: isEmptyString(name) ? "Vui lòng nhập tên" : undefined }));
    };
    const validateSelectRequired = (key: keyof ErrorMap, value?: string) => {
        setErrors((e) => ({ ...e, [key]: isEmptyString(value) ? `Vui lòng chọn ${LABELS[key]}` : undefined }));
    };
    const validateNumberRequired = (key: keyof ErrorMap, val?: number) => {
        // 0 hợp lệ; undefined (xoá rỗng) => lỗi
        setErrors((e) => ({ ...e, [key]: val === undefined ? `Vui lòng nhập ${LABELS[key]}` : undefined }));
    };

    // --- normalize: set 0 cho tất cả số nếu thiếu ---
    useEffect(() => {
        const normalized: Partial<IngredientDraft> = {};
        NUMERIC_KEYS.forEach((k) => {
            const v = draft[k as keyof IngredientDraft] as unknown as number | undefined;
            if (v === undefined || v === (null as unknown as number)) {
                (normalized as any)[k] = 0;
            }
        });
        if (Object.keys(normalized).length) setDraft({ ...draft, ...normalized });
        // validate ban đầu (text/select)
        validateName(draft.name);
        validateSelectRequired("servingUnit", draft.servingUnit);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-6">
            {/* Hàng 1: Tên (7) – Ảnh (5) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                <div className="xl:col-span-7 space-y-2">
                    <Label htmlFor={nameId} required>
                        Tên nguyên liệu
                    </Label>
                    <TextInput
                        id={nameId}
                        title="Tên nguyên liệu"
                        value={draft.name}
                        onChange={(v) => {
                            const name = String(v ?? "");
                            setDraft({ ...draft, name });
                            validateName(name);
                        }}
                        placeholder="Ví dụ: Ức gà"
                        error={errors.name}
                    />
                </div>

                <div className="xl:col-span-5 space-y-2">
                    <Label htmlFor={imgId}>Ảnh</Label>
                    <ImagePicker
                        inputId={imgId}
                        value={draft.image}
                        onPicked={(dataUrl) => setDraft({ ...draft, image: dataUrl })}
                        onClear={() => setDraft({ ...draft, image: "" })}
                    />
                    {/* Không validate ảnh */}
                </div>
            </div>

            {/* Hàng 2: Mô tả */}
            <div className="space-y-2">
                <Label htmlFor={descId}>Mô tả</Label>
                <textarea
                    id={descId}
                    title="Mô tả"
                    value={draft.description ?? ""}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    rows={3}
                    placeholder="Mô tả ngắn về nguyên liệu..."
                    className="w-full min-h-[88px] px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100"
                />
                {/* Không validate mô tả */}
            </div>

            {/* Hàng 3: Khẩu phần – Đơn vị – Trọng lượng 1 đơn vị */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                    <Label htmlFor={servingSizeId}>Khẩu phần</Label>
                    <NumberInput
                        id={servingSizeId}
                        title="Khẩu phần"
                        value={draft.servingSize}
                        onChange={(v) => {
                            setDraft({ ...draft, servingSize: v });
                            validateNumberRequired("servingSize", v);
                        }}
                        placeholder="1"
                        error={errors.servingSize}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor={servingUnitId}>Đơn vị khẩu phần</Label>
                    <Select
                        id={servingUnitId}
                        title="Đơn vị khẩu phần"
                        value={draft.servingUnit}
                        onChange={(v) => {
                            setDraft({ ...draft, servingUnit: v });
                            validateSelectRequired("servingUnit", v);
                        }}
                        placeholder="Chọn đơn vị"
                        options={["tô", "chén", "ly", "đĩa", "phần", "cốc", "cái", "miếng", "G", "ML"]}
                        error={errors.servingUnit}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor={unitWeightId}>Trọng lượng 1 đơn vị</Label>
                    <NumberInput
                        id={unitWeightId}
                        title="Trọng lượng 1 đơn vị"
                        value={draft.unitWeightGram}
                        onChange={(v) => {
                            setDraft({ ...draft, unitWeightGram: v });
                            validateNumberRequired("unitWeightGram", v);
                        }}
                        placeholder="gram"
                        suffix="g"
                        error={errors.unitWeightGram}
                    />
                </div>
            </div>

            {/* Hàng 4: Calo – Protein – Carb */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                    <Label>Calo</Label>
                    <NumberInput
                        value={draft.calories}
                        onChange={(v) => {
                            setDraft({ ...draft, calories: v });
                            validateNumberRequired("calories", v);
                        }}
                        suffix="kcal"
                        error={errors.calories}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Protein</Label>
                    <NumberInput
                        value={draft.proteinG}
                        onChange={(v) => {
                            setDraft({ ...draft, proteinG: v });
                            validateNumberRequired("proteinG", v);
                        }}
                        suffix="g"
                        error={errors.proteinG}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Carb</Label>
                    <NumberInput
                        value={draft.carbG}
                        onChange={(v) => {
                            setDraft({ ...draft, carbG: v });
                            validateNumberRequired("carbG", v);
                        }}
                        suffix="g"
                        error={errors.carbG}
                    />
                </div>
            </div>

            {/* Hàng 5: Fat – Fiber */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label>Fat</Label>
                    <NumberInput
                        value={draft.fatG}
                        onChange={(v) => {
                            setDraft({ ...draft, fatG: v });
                            validateNumberRequired("fatG", v);
                        }}
                        suffix="g"
                        error={errors.fatG}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Fiber</Label>
                    <NumberInput
                        value={draft.fiberG}
                        onChange={(v) => {
                            setDraft({ ...draft, fiberG: v });
                            validateNumberRequired("fiberG", v);
                        }}
                        suffix="g"
                        error={errors.fiberG}
                    />
                </div>
            </div>

            {/* Hàng 6: Sodium – Sugar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label>Sodium</Label>
                    <NumberInput
                        value={draft.sodiumMg}
                        onChange={(v) => {
                            setDraft({ ...draft, sodiumMg: v });
                            validateNumberRequired("sodiumMg", v);
                        }}
                        suffix="mg"
                        error={errors.sodiumMg}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Sugar</Label>
                    <NumberInput
                        value={draft.sugarMg}
                        onChange={(v) => {
                            setDraft({ ...draft, sugarMg: v });
                            validateNumberRequired("sugarMg", v);
                        }}
                        suffix="mg"
                        error={errors.sugarMg}
                    />
                </div>
            </div>
        </div>
    );
}

/* ===== Component chính ===== */
export default function AddAndUpdate({
    open,
    isEdit,
    draft,
    setDraft,
    onClose,
    onSave,
}: {
    open: boolean;
    isEdit: boolean;
    draft: IngredientDraft;
    setDraft: (v: IngredientDraft) => void;
    onClose: () => void;
    onSave: (createdOrUpdated: IngredientDraft) => void;
}) {
    const [errors, setErrors] = useState<ErrorMap>({});

    const isFormValid = useMemo(() => {
        // Tất cả input (trừ ảnh, mô tả) phải không lỗi
        const KEYS: Array<keyof ErrorMap> = [
            "name",
            "servingSize",
            "servingUnit",
            "unitWeightGram",
            "calories",
            "proteinG",
            "carbG",
            "fatG",
            "fiberG",
            "sodiumMg",
            "sugarMg",
        ];
        return KEYS.every((k) => !errors[k]);
    }, [errors]);

    const handleSave = async () => {
        if (!isFormValid) {
            alert("Vui lòng điền đầy đủ thông tin bắt buộc.");
            return;
        }
        try {
            const result =
                isEdit && draft.id ? await updateIngredient(draft.id, draft) : await createIngredient(draft);
            onSave(result);
            onClose();
        } catch (e) {
            const msg =
                (e as { message?: string })?.message ||
                (isEdit ? "Cập nhật nguyên liệu thất bại" : "Thêm nguyên liệu thất bại");
            alert(msg);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={isEdit ? "Cập nhật nguyên liệu" : "Thêm nguyên liệu"}>
            <IngredientForm draft={draft} setDraft={setDraft} errors={errors} setErrors={setErrors} />
            <div className="mt-5 flex items-center justify-end gap-3">
                <button className="px-4 py-2 rounded-xl border border-slate-200" onClick={onClose}>
                    Huỷ
                </button>
                <button
                    className={`px-4 py-2 rounded-xl text-white ${isFormValid ? "bg-green-600 hover:bg-green-700" : "bg-slate-300 cursor-not-allowed"
                        }`}
                    onClick={handleSave}
                    disabled={!isFormValid}
                >
                    {isEdit ? "Lưu thay đổi" : "Thêm nguyên liệu"}
                </button>
            </div>
        </Modal>
    );
}
