import React, { useEffect, useState, useCallback } from "react";
import type {
  NamedItem,
  Stats,
  CollectionKind,
  ConditionRequest,
  AllergyRequest,
  RuleType,
  RuleScope,
  Comparator,
  Gender,
  NutritionRuleResponse,
  ConditionResponse,
  AllergyResponse,
  CreationRuleAI,
} from "../types/clinical";
import {
  fetchStats,
  searchConditionsByName,
  searchAllergiesByName,
  updateCondition,
  updateAllergy,
  deleteCondition,
  deleteAllergy,
  fetchAllergiesPage,
  fetchConditionsPage,
  createCondition,
  createAllergy,
  addRuleAI,
  deleteNutritionRule,
  updateNutritionRule,
  getAllergyById,
  getConditionById,
} from "../service/clinical.service";
import { fetchTagsAutocomplete, createTag } from "../service/tag.service";
import { isRequestCanceled } from "../service/helpers";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Settings,
  Save,
  X,
  ClipboardList,
  Info,
} from "lucide-react";

/* ================= helpers ================= */
function errorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const maybeMsg = (err as { message?: string }).message;
    if (typeof maybeMsg === "string" && maybeMsg.length) return maybeMsg;
  }
  return "Đã xảy ra lỗi";
}

function mapTopToStats(arr: unknown): { name: string; count: number }[] {
  if (!Array.isArray(arr)) return [];
  return (arr as unknown[]).map((x) => {
    const i = typeof x === "object" && x ? (x as Record<string, unknown>) : {};
    const name = String(i.name ?? i.label ?? i.title ?? i.id ?? "");
    const count = Number(i.count ?? i.value ?? i.total ?? 0);
    return { name, count };
  });
}

/* ========= Validate theo NutritionRuleUpdateDto ========= */
const ALLOWED_NUTRIENTS = new Set([
  "PROTEIN",
  "CARB",
  "FAT",
  "FIBER",
  "SODIUM",
  "SUGAR",
  "WATER",
]);

function validateRuleErrors(d: NutritionRuleResponse): string[] {
  const errs: string[] = [];

  if (d.targetType === "NUTRIENT") {
    if (
      !d.targetCode ||
      !ALLOWED_NUTRIENTS.has(String(d.targetCode).toUpperCase())
    ) {
      errs.push(
        "Bạn phải chọn targetCode hợp lệ (PROTEIN, CARB, FAT, FIBER, SODIUM, SUGAR, WATER)."
      );
    }
    if (!d.comparator) {
      errs.push("Bạn phải chọn comparator.");
    } else {
      const hasMin = d.thresholdMin != null && d.thresholdMin !== ("" as any);
      const hasMax = d.thresholdMax != null && d.thresholdMax !== ("" as any);

      switch (d.comparator) {
        case "BETWEEN":
          if (!hasMin || !hasMax)
            errs.push("BETWEEN yêu cầu cả thresholdMin và thresholdMax.");
          if (
            hasMin &&
            hasMax &&
            Number(d.thresholdMin) > Number(d.thresholdMax)
          ) {
            errs.push("Ngưỡng min phải ≤ max.");
          }
          break;
        case "EQ":
          if (!hasMin || !hasMax)
            errs.push("EQ yêu cầu cả thresholdMin và thresholdMax.");
          if (
            hasMin &&
            hasMax &&
            Number(d.thresholdMin) !== Number(d.thresholdMax)
          ) {
            errs.push("EQ yêu cầu thresholdMin = thresholdMax.");
          }
          break;
        case "LT":
        case "LTE":
          if (!hasMax) errs.push("LT/LTE yêu cầu chỉ có thresholdMax.");
          if (hasMin) errs.push("LT/LTE không được thiết lập thresholdMin.");
          break;
        case "GT":
        case "GTE":
          if (!hasMin) errs.push("GT/GTE yêu cầu chỉ có thresholdMin.");
          if (hasMax) errs.push("GT/GTE không được thiết lập thresholdMax.");
          break;
        default:
          errs.push("Comparator không hợp lệ.");
      }
    }
  } else {
    // FOOD_TAG: ngưỡng & comparator phải vắng
    if (d.comparator) errs.push("FOOD_TAG không dùng comparator.");
    if (d.thresholdMin != null && d.thresholdMin !== ("" as any))
      errs.push("FOOD_TAG không dùng thresholdMin.");
    if (d.thresholdMax != null && d.thresholdMax !== ("" as any))
      errs.push("FOOD_TAG không dùng thresholdMax.");
    if (d.perKg) errs.push("FOOD_TAG không dùng 'Tính theo kg'.");
  }

  if (!d.message || !d.message.trim()) errs.push("Thông điệp là bắt buộc.");

  return errs;
}
/* ================= Small UI atoms ================= */
function TotalPill({
  label,
  value,
  loading = false,
}: {
  label: string;
  value?: number;
  loading?: boolean;
}) {
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-medium">
      {label}:{" "}
      {loading ? (
        <span className="inline-block w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      ) : typeof value === "number" ? (
        <span className="tabular-nums">{value.toLocaleString()}</span>
      ) : (
        <span>—</span>
      )}
    </span>
  );
}
function NoticeDialog({
  open,
  title = "Không thể thực hiện",
  description,
  onClose,
  actionText = "Đã hiểu",
}: {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  actionText?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-[92vw] max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 grid place-items-center border border-amber-100">
            <Info size={18} />
          </div>
          <h4 className="text-base font-semibold">{title}</h4>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-slate-600 whitespace-pre-wrap">
            {description}
          </p>
        </div>
        <div className="px-5 py-4 flex items-center justify-end">
          <button
            className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            onClick={onClose}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Xóa",
  cancelText = "Huỷ",
  onConfirm,
  onCancel,
  isBusy = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isBusy?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={isBusy ? undefined : onCancel}
      />
      <div className="relative z-10 w-[92vw] max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-100">
          <h4 className="text-base font-semibold">{title}</h4>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-3">
          <button
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
            onClick={onCancel}
            disabled={isBusy}
          >
            {cancelText}
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 inline-flex items-center gap-2"
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy && (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-medium text-slate-700 inline-flex items-center">
      {children} {required && <span className="ml-1 text-rose-600">*</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  min,
  step,
}: {
  value: any;
  onChange: (v: any) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  min?: number;
  step?: number;
}) {
  return (
    <input
      value={value ?? ""}
      onChange={(e) => {
        if (type === "number") {
          const raw = e.target.value;
          if (raw === "") {
            onChange("");
            return;
          }
          // tránh NaN, ép min
          let num = Number(raw);
          if (Number.isNaN(num)) {
            onChange("");
            return;
          }
          if (typeof min === "number" && num < min) num = min;
          onChange(num);
        } else {
          onChange(e.target.value);
        }
      }}
      onKeyDown={(e) => {
        if (type === "number") {
          if (e.key === "-" || e.key.toLowerCase() === "e") {
            e.preventDefault();
          }
        }
      }}
      type={type}
      disabled={disabled}
      min={type === "number" ? min : undefined}
      step={type === "number" ? step : undefined}
      className={`mt-1 w-full rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100 ${
        disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""
      }`}
      placeholder={placeholder}
      inputMode={type === "number" ? "numeric" : undefined}
    />
  );
}

/**
 * Select tổng quát
 */
function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value?: T | "" | null;
  onChange: (v: T | "") => void;
  options: { label: string; value: T | "" }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={(value ?? "") as string}
      onChange={(e) => onChange(e.target.value as T | "")}
      disabled={disabled}
      className={`mt-1 w-full rounded-xl px-3 py-2 border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-green-100 ${
        disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""
      }`}
    >
      <option value="" disabled>
        {placeholder ?? "Chọn..."}
      </option>
      {options.map((op) => (
        <option key={String(op.value)} value={op.value as string}>
          {op.label}
        </option>
      ))}
    </select>
  );
}

/* ==================== RULES: view + quick add + edit form ==================== */
const RULE_TYPE_OPTS: { label: string; value: RuleType }[] = [
  { label: "TRÁNH", value: "AVOID" },
  { label: "HẠN CHẾ", value: "LIMIT" },
  { label: "ƯU TIÊN", value: "PREFER" },
];
const SCOPE_OPTS: { label: string; value: RuleScope }[] = [
  { label: "MÓN", value: "ITEM" },
  { label: "BỮA", value: "MEAL" },
  { label: "NGÀY", value: "DAY" },
];
const CMP_OPTS: { label: string; value: Comparator | "" }[] = [
  { label: "KHÔNG", value: "" },
  { label: "<", value: "LT" },
  { label: "≤", value: "LTE" },
  { label: "=", value: "EQ" },
  { label: "≥", value: "GTE" },
  { label: ">", value: "GT" },
  { label: "KHOẢNG", value: "BETWEEN" },
];
const GENDER_OPTS: { label: string; value: Gender | "" }[] = [
  { label: "KHÔNG", value: "" },
  { label: "NAM", value: "MALE" },
  { label: "NỮ", value: "FEMALE" },
  { label: "KHÁC", value: "OTHER" },
];
const TARGET_CODE_OPTS: { label: string; value: string }[] = [
  { label: "KHÔNG", value: "" },
  { label: "PROTEIN", value: "PROTEIN" },
  { label: "CARB", value: "CARB" },
  { label: "FAT", value: "FAT" },
  { label: "FIBER", value: "FIBER" },
  { label: "SODIUM", value: "SODIUM" },
  { label: "SUGAR", value: "SUGAR" },
  { label: "WATER", value: "WATER" },
];

type RuleOwner = {
  kind: CollectionKind;
  ownerId: string;
  ownerName: string;
  rules: NutritionRuleResponse[];
};

function RuleCard({
  rule,
  onEdit,
  onDelete,
}: {
  rule: NutritionRuleResponse;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const badge = (text: string) => (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
      {text}
    </span>
  );
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {badge(rule.ruleType)}
          {badge(rule.scope)}
          {badge(
            `${rule.targetType}${rule.targetCode ? `:${rule.targetCode}` : ""}`
          )}
          {badge(`cmp:${rule.comparator ?? "—"}`)}
        </div>
        <div className="inline-flex gap-2">
          <button
            className="px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs inline-flex items-center gap-1"
            onClick={onEdit}
          >
            <Pencil size={14} /> Sửa
          </button>
          <button
            className="px-2 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs inline-flex items-center gap-1"
            onClick={onDelete}
          >
            <Trash2 size={14} /> Xoá
          </button>
        </div>
      </div>
      <div className="text-xs text-slate-600">
        {rule.comparator === "BETWEEN"
          ? `Ngưỡng: ${rule.thresholdMin ?? "?"} - ${rule.thresholdMax ?? "?"}`
          : `Ngưỡng: ${rule.thresholdMin ?? "?"}`}
        {" · "}Theo kg: {String(rule.perKg)}
        {" · "}Tần suất/phạm vi: {rule.frequencyPerScope ?? "—"}
        {" · "}Giới tính: {rule.applicableSex ?? "—"} · Tuổi:{" "}
        {rule.ageMin || rule.ageMax
          ? `${rule.ageMin ?? "—"} - ${rule.ageMax ?? "—"}`
          : "—"}
      </div>
      <div className="text-xs text-slate-600">
        Thẻ: {rule.tags?.length ? rule.tags.join(", ") : "—"}
      </div>
      <div className="text-sm text-slate-800">📝 {rule.message}</div>
      {rule.source && (
        <div className="text-xs text-slate-500">🔗 {rule.source}</div>
      )}
    </div>
  );
}

/* ========= Tag UI type ========= */
type UITag = { id: string; nameCode: string; description?: string | null };

function CreateTagModal({
  open,
  initialName = "",
  onClose,
  onCreate,
  creating = false,
}: {
  open: boolean;
  initialName?: string;
  onClose: () => void;
  onCreate: (payload: { nameCode: string; description?: string }) => void;
  creating?: boolean;
}) {
  const [nameCode, setNameCode] = useState(initialName);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setNameCode(initialName);
      setDescription("");
    }
  }, [open, initialName]);

  if (!open) return null;
  const canSave = nameCode.trim().length > 0 && !creating;

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={creating ? undefined : onClose}
      />
      <div className="relative z-10 w-[92vw] max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-base font-semibold">Thêm Tag</div>
          <button
            className="h-9 w-9 grid place-items-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            onClick={creating ? undefined : onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <FieldLabel required>nameCode</FieldLabel>
            <Input
              value={nameCode}
              onChange={setNameCode}
              placeholder="VD: LOW_SODIUM"
            />
          </div>
          <div>
            <FieldLabel>Mô tả (tuỳ chọn)</FieldLabel>
            <Input
              value={description}
              onChange={setDescription}
              placeholder="Mô tả ngắn…"
            />
          </div>
        </div>

        <div className="px-5 py-4 flex items-center justify-end gap-3">
          <button
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
            onClick={onClose}
            disabled={creating}
          >
            Huỷ
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 inline-flex items-center gap-2"
            onClick={() =>
              onCreate({
                nameCode: nameCode.trim(),
                description: description.trim() || undefined,
              })
            }
            disabled={!canSave}
          >
            {creating && (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full" />
            )}
            Thêm
          </button>
        </div>
      </div>
    </div>
  );
}
/* ========= Rule Edit Modal (v2: có Tag picker) ========= */

function RuleEditModal({
  open,
  initial,
  onClose,
  onSubmit,
  saving = false,
  onSelectedTagUUIDsChange,
}: {
  open: boolean;
  initial: NutritionRuleResponse | null;
  onClose: () => void;
  onSubmit: (next: NutritionRuleResponse) => void;
  saving?: boolean;
  onSelectedTagUUIDsChange?: (uuids: string[]) => void;
}) {
  const [draft, setDraft] = useState<NutritionRuleResponse | null>(initial);
  const [errors, setErrors] = useState<string[]>([]);

  // Tag state
  const [tagQuery, setTagQuery] = useState("");
  const [tagOptions, setTagOptions] = useState<UITag[]>([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<UITag[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const set = <K extends keyof NutritionRuleResponse>(
    k: K,
    v: NutritionRuleResponse[K]
  ) => setDraft({ ...(draft as NutritionRuleResponse), [k]: v });

  useEffect(() => {
    if (!draft) return;
    if (draft.targetType === "FOOD_TAG" && draft.scope !== "ITEM") {
      set("scope", "ITEM" as any);
    }
  }, [draft?.targetType]);

  useEffect(() => {
    setDraft(initial);
    setErrors([]); // reset lỗi khi mở lại
    const initSelected = (initial?.tags ?? []).map((name) => ({
      id: name,
      nameCode: name,
      description: "",
    }));
    setSelectedTags(initSelected);
  }, [initial]);

  // autocomplete
  useEffect(() => {
    if (!open) return;
    const q = tagQuery.trim();
    if (!q) {
      setTagOptions([]);
      setTagError(null);
      return;
    }
    const ctl = new AbortController();
    (async () => {
      try {
        setTagLoading(true);
        setTagError(null);
        const res = await fetchTagsAutocomplete(q, 8, ctl.signal);
        const opts = (res ?? []).map<UITag>((t) => ({
          id: t.id,
          nameCode: t.nameCode,
          description: t.description ?? "",
        }));
        setTagOptions(opts);
      } catch (e) {
        if (isRequestCanceled(e)) return;
        setTagError(errorMessage(e));
        setTagOptions([]);
      } finally {
        setTagLoading(false);
      }
    })();
    return () => ctl.abort();
  }, [open, tagQuery]);

  // báo UUID list ra ngoài cho Drawer submit (chỉ UUID hợp lệ)
  useEffect(() => {
    onSelectedTagUUIDsChange?.(
      selectedTags
        .map((t) => t.id)
        .filter((id) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            id
          )
        )
    );
  }, [selectedTags, onSelectedTagUUIDsChange]);

  if (!open || !draft) return null;

  const asOptional = <T,>(v: T | ""): T | undefined =>
    v === "" ? undefined : (v as T);

  const isFoodTag = draft.targetType === "FOOD_TAG";

  const addExistingTag = (t: UITag) => {
    if (selectedTags.some((x) => x.id === t.id || x.nameCode === t.nameCode))
      return;
    setSelectedTags((prev) => [...prev, t]);
    setTagQuery("");
  };
  const removeTag = (idOrName: string) => {
    setSelectedTags((prev) =>
      prev.filter((x) => x.id !== idOrName && x.nameCode !== idOrName)
    );
  };

  const openCreateTag = () => {
    setCreateOpen(true);
  };

  const doCreateTag = async (payload: {
    nameCode: string;
    description?: string;
  }) => {
    const nameCode = payload.nameCode.trim();
    if (!nameCode) return;
    try {
      setCreatingTag(true);
      await createTag({
        nameCode,
        description: payload.description ?? "",
      });
      const created: UITag = {
        id: nameCode,
        nameCode: nameCode,
        description: payload.description ?? "",
      };
      addExistingTag(created);
      setCreateOpen(false);
      setTagQuery("");
    } catch (e) {
      alert(errorMessage(e));
    } finally {
      setCreatingTag(false);
    }
  };

  const doSubmit = () => {
    if (!draft) return;
    const errs = validateRuleErrors(draft);
    if (errs.length) {
      setErrors(errs);
      return;
    }
    const next: NutritionRuleResponse = {
      ...draft,
      tags: selectedTags.map((t) => t.nameCode),
    } as NutritionRuleResponse;
    onSubmit(next);
  };

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative z-10 w-[92vw] max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-base font-semibold">Cập nhật quy tắc</div>
          <button
            className="h-9 w-9 grid place-items-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Hàng 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <FieldLabel required>Loại quy tắc</FieldLabel>
              <Select<RuleType>
                value={draft.ruleType}
                onChange={(v) => set("ruleType", v as RuleType)}
                options={RULE_TYPE_OPTS}
                placeholder="Chọn loại quy tắc"
                disabled={draft.targetType === "NUTRIENT"}
              />
            </div>
            <div>
              <FieldLabel required>Phạm vi</FieldLabel>
              <Select<RuleScope>
                value={draft.scope}
                onChange={(v) => set("scope", v as RuleScope)}
                options={SCOPE_OPTS}
                placeholder="Chọn phạm vi"
                disabled={draft.targetType === "FOOD_TAG"}
              />
            </div>
            <div>
              <FieldLabel required>Loại mục tiêu</FieldLabel>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {draft.targetType}
                </span>
              </div>
            </div>
          </div>

          {/* Hàng 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <FieldLabel>Mã mục tiêu</FieldLabel>
              <Select<string>
                value={(draft.targetCode ?? "") as string}
                onChange={(v) => set("targetCode", asOptional(v) as any)}
                options={TARGET_CODE_OPTS}
                placeholder="Chọn mã"
                disabled={draft.targetType === "FOOD_TAG"}
              />
            </div>
            <div>
              <FieldLabel>Comparator</FieldLabel>
              <Select<Comparator>
                value={(draft.comparator as any) ?? ""}
                onChange={(v) => set("comparator", asOptional(v) as any)}
                options={CMP_OPTS as any}
                placeholder="Chọn toán tử"
                disabled={draft.targetType === "FOOD_TAG"}
              />
            </div>
            <div>
              <FieldLabel>Tính theo kg</FieldLabel>
              <div className="mt-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.perKg)}
                    onChange={(e) =>
                      set("perKg", Boolean(e.target.checked) as any)
                    }
                    className="h-4 w-4 rounded border-slate-300"
                    disabled={draft.targetType === "FOOD_TAG"}
                  />
                  <span>Tính theo cân nặng (kg)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Hàng 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <FieldLabel>Ngưỡng tối thiểu</FieldLabel>
              <Input
                type="number"
                min={0}
                value={draft.thresholdMin ?? ""}
                onChange={(v) =>
                  set("thresholdMin", v === "" ? ("" as any) : Number(v))
                }
                placeholder="VD: 50"
                disabled={draft.targetType === "FOOD_TAG"}
              />
            </div>
            <div>
              <FieldLabel>Ngưỡng tối đa</FieldLabel>
              <Input
                type="number"
                min={0}
                value={draft.thresholdMax ?? ""}
                onChange={(v) =>
                  set("thresholdMax", v === "" ? ("" as any) : Number(v))
                }
                placeholder="VD: 100"
                disabled={draft.targetType === "FOOD_TAG"}
              />
            </div>
            <div>
              <FieldLabel>Tần suất trong phạm vi</FieldLabel>
              <Input
                type="number"
                min={0}
                value={draft.frequencyPerScope ?? ""}
                onChange={(v) =>
                  set("frequencyPerScope", v === "" ? ("" as any) : Number(v))
                }
                placeholder="VD: 1, 2 ..."
              />
            </div>
          </div>

          {/* Hàng 4 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <FieldLabel>Giới tính</FieldLabel>
              <Select<Gender>
                value={(draft.applicableSex as any) ?? ""}
                onChange={(v) => set("applicableSex", asOptional(v) as any)}
                options={GENDER_OPTS as any}
                placeholder="Chọn giới tính"
              />
            </div>
            <div>
              <FieldLabel>Tuổi tối thiểu</FieldLabel>
              <Input
                type="number"
                min={0}
                value={draft.ageMin ?? ""}
                onChange={(v) =>
                  set("ageMin", v === "" ? ("" as any) : Number(v))
                }
                placeholder="VD: 18"
              />
            </div>
            <div>
              <FieldLabel>Tuổi tối đa</FieldLabel>
              <Input
                type="number"
                min={0}
                value={draft.ageMax ?? ""}
                onChange={(v) =>
                  set("ageMax", v === "" ? ("" as any) : Number(v))
                }
                placeholder="VD: 65"
              />
            </div>
          </div>

          {/* Hàng 5: Message, Source + Tag Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Thông điệp</FieldLabel>
              <textarea
                value={draft.message}
                onChange={(e) => set("message", e.target.value)}
                className="mt-1 w-full min-h-24 rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100"
                placeholder="VD: Hạn chế natri cho bệnh nhân tăng huyết áp…"
              />
            </div>

            <div>
              <FieldLabel>Nguồn tham khảo</FieldLabel>
              <Input
                value={draft.source ?? ""}
                onChange={(v) => set("source", v)}
                placeholder="URL/Tài liệu tham khảo"
              />

              {/* TAG PICKER */}
              {isFoodTag && (
                <div className="mt-3">
                  <FieldLabel>Thẻ (autocomplete, có thể thêm mới)</FieldLabel>

                  {/* Ô nhập + nút Thêm */}
                  <div className="mt-1 flex items-center gap-2 relative">
                    <input
                      className="flex-1 rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100"
                      placeholder="Nhập để tìm thẻ…"
                      value={tagQuery}
                      onChange={(e) => setTagQuery(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                      onClick={openCreateTag}
                      disabled={!tagQuery.trim()}
                      title="Thêm tag mới"
                    >
                      Thêm tag
                    </button>

                    {/* Dropdown kết quả */}
                    {!!tagQuery.trim() && (
                      <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-10 rounded-xl border border-slate-200 bg-white shadow">
                        {tagLoading ? (
                          <div className="p-3 text-sm text-slate-500">
                            Đang tìm…
                          </div>
                        ) : tagError ? (
                          <div className="p-3 text-sm text-rose-600">
                            Lỗi: {tagError}
                          </div>
                        ) : tagOptions.length > 0 ? (
                          <ul className="max-h-56 overflow-auto divide-y divide-slate-100">
                            {tagOptions.map((op) => (
                              <li
                                key={op.id}
                                className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                                onClick={() => addExistingTag(op)}
                              >
                                <div className="font-medium">{op.nameCode}</div>
                                {op.description && (
                                  <div className="text-xs text-slate-500 line-clamp-1">
                                    {op.description}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-3 text-sm text-slate-600">
                            Không tìm thấy kết quả cho “{tagQuery}”.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected tags */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTags.length === 0 ? (
                      <span className="text-xs text-slate-500">
                        Chưa chọn thẻ nào
                      </span>
                    ) : (
                      selectedTags.map((t) => (
                        <span
                          key={`${t.id}-${t.nameCode}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs"
                          title={t.description ?? ""}
                        >
                          {t.nameCode}
                          <button
                            className="ml-1 text-slate-500 hover:text-slate-800"
                            onClick={() => removeTag(t.id || t.nameCode)}
                            title="Xoá"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="px-5">
            <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
              <div className="font-semibold mb-1">
                Vui lòng sửa {errors.length} lỗi:
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
            onClick={onClose}
            disabled={saving}
          >
            Đóng
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 inline-flex items-center gap-2"
            onClick={doSubmit}
            disabled={saving || !draft.message.trim()}
          >
            {saving && (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full" />
            )}
            <Save size={16} />
            Cập nhật
          </button>
        </div>
      </div>
      <CreateTagModal
        open={createOpen}
        initialName={tagQuery.trim()}
        onClose={() => setCreateOpen(false)}
        onCreate={doCreateTag}
        creating={creatingTag}
      />
    </div>
  );
}

/* ===================== Drawer: thêm submit update ===================== */
function RuleDrawer({
  open,
  owner,
  onClose,
  onMutate,
  onRulesChange,
}: {
  open: boolean;
  owner: RuleOwner | null;
  onClose: () => void;
  onMutate?: () => void;
  onRulesChange?: (ownerId: string, rules: NutritionRuleResponse[]) => void;
}) {
  const [rules, setRules] = useState<NutritionRuleResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [quickMsg, setQuickMsg] = useState("");
  const [adding, setAdding] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editing, setEditing] = useState<NutritionRuleResponse | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [deletingRule, setDeletingRule] = useState(false);

  // NoticeDialog state (xoá rule fail)
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("Không thể xoá quy tắc");
  const [noticeDesc, setNoticeDesc] = useState<string | undefined>(undefined);

  const selectedTagUUIDsRef = React.useRef<string[]>([]);

  const defer = (fn: () => void) => {
    queueMicrotask(fn);
  };

  const refreshRules = useCallback(async () => {
    if (!owner) return;
    try {
      setLoading(true);
      setErr(null);
      const res =
        owner.kind === "conditions"
          ? await getConditionById(owner.ownerId)
          : await getAllergyById(owner.ownerId);

      const latest = res?.data?.nutritionRules ?? [];
      setRules(latest);
      defer(() => onRulesChange?.(owner.ownerId, latest));
    } catch (e) {
      setErr(errorMessage(e));
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, [owner, onRulesChange]);

  // Khi mở drawer hoặc đổi owner => refetch từ BE (không dùng state tạm)
  useEffect(() => {
    if (!open || !owner) return;
    refreshRules();
  }, [open, owner, refreshRules]);

  const startEdit = (r: NutritionRuleResponse) => {
    setEditing(r);
    setEditOpen(true);
  };

  // build payload đúng DTO
  function buildUpdatePayload(
    r: NutritionRuleResponse,
    selectedTagUUIDs: string[]
  ) {
    if (r.targetType === "NUTRIENT") {
      return {
        ruleType: r.ruleType,
        scope: r.scope,
        targetType: "NUTRIENT",
        targetCode: r.targetCode ?? undefined,
        comparator: r.comparator ?? undefined,
        thresholdMin: r.thresholdMin ?? undefined,
        thresholdMax: r.thresholdMax ?? undefined,
        perKg: Boolean(r.perKg),
        frequencyPerScope: r.frequencyPerScope ?? undefined,
        applicableSex: r.applicableSex ?? undefined,
        ageMin: r.ageMin ?? undefined,
        ageMax: r.ageMax ?? undefined,
        source: r.source ?? undefined,
        active: true,
        foodTags: [],
        message: r.message,
      } as any;
    }
    // FOOD_TAG
    return {
      ruleType: r.ruleType,
      scope: r.scope,
      targetType: "FOOD_TAG",
      targetCode: undefined,
      comparator: undefined,
      thresholdMin: undefined,
      thresholdMax: undefined,
      perKg: false,
      frequencyPerScope: r.frequencyPerScope ?? undefined,
      applicableSex: r.applicableSex ?? undefined,
      ageMin: r.ageMin ?? undefined,
      ageMax: r.ageMax ?? undefined,
      source: r.source ?? undefined,
      active: true,
      foodTags: selectedTagUUIDs,
      message: r.message,
    } as any;
  }

  // === resolve nameCode -> UUID cho các tag cũ, rồi gộp với UUID đã chọn ===
  async function resolveTagUUIDsFromNames(
    nameCodes: string[]
  ): Promise<string[]> {
    const out: string[] = [];
    for (const name of nameCodes) {
      const q = (name ?? "").trim();
      if (!q) continue;
      try {
        const res = await fetchTagsAutocomplete(q, 1);
        const t = Array.isArray(res) ? res[0] : null;
        if (
          t?.id &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            t.id
          )
        ) {
          out.push(t.id);
        }
      } catch {
        // bỏ qua tag không resolve được
      }
    }
    return Array.from(new Set(out));
  }

  const submitEdit = async (next: NutritionRuleResponse) => {
    if (!owner) return;
    try {
      setEditSaving(true);
      let foodTagUUIDs = selectedTagUUIDsRef.current || [];
      if (next.targetType === "FOOD_TAG") {
        const names = Array.isArray(next.tags) ? next.tags : [];
        const namesToResolve = names.filter(
          (n) =>
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              n
            )
        );
        const resolved = await resolveTagUUIDsFromNames(namesToResolve);
        foodTagUUIDs = Array.from(new Set([...foodTagUUIDs, ...resolved]));
      }

      const payload = buildUpdatePayload(next, foodTagUUIDs);
      await updateNutritionRule(next.id, payload as any);
      await refreshRules();

      setEditOpen(false);
      setEditing(null);
      onMutate?.();
    } catch (e) {
      alert(errorMessage(e));
    } finally {
      setEditSaving(false);
    }
  };

  const askDelete = (id: string) => {
    setToDelete(id);
    setConfirmOpen(true);
  };

  const isUUID = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      s
    );

  const doDelete = async () => {
    if (!toDelete || !owner) return;
    try {
      setDeletingRule(true);
      if (isUUID(toDelete)) {
        await deleteNutritionRule(toDelete);
      }

      // 🔄 Refetch thay vì filter state cục bộ để tránh “lệch” dữ liệu
      await refreshRules();

      onMutate?.();
    } catch (e) {
      setNoticeTitle("Không thể xoá quy tắc");
      setNoticeDesc(
        (errorMessage(e) || "").includes("constraint")
          ? "Quy tắc đang được tham chiếu hoặc không thể xoá do ràng buộc dữ liệu."
          : errorMessage(e)
      );
      setNoticeOpen(true);
    } finally {
      setDeletingRule(false);
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const quickAdd = async () => {
    if (!quickMsg.trim() || !owner) return;
    try {
      setAdding(true);
      const payload: CreationRuleAI = {
        message: quickMsg.trim(),
        ...(owner.kind === "conditions"
          ? { conditionId: owner.ownerId }
          : { allergyId: owner.ownerId }),
      };
      await addRuleAI(payload);
      await refreshRules();

      setQuickMsg("");
      onMutate?.();
    } catch (e) {
      alert(errorMessage(e));
    } finally {
      setAdding(false);
    }
  };

  if (!open || !owner) return null;

  return (
    <div className="fixed inset-0 z-70">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[720px] bg-white shadow-2xl border-l border-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Quy tắc cho</div>
            <div className="text-base font-semibold text-slate-900">
              [{owner.kind === "conditions" ? "Bệnh nền" : "Dị ứng"}]{" "}
              {owner.ownerName}
            </div>
          </div>
          <button
            className="h-9 w-9 grid place-items-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            onClick={onClose}
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Add */}
        <div className="p-4 border-b border-slate-100">
          <div className="text-sm font-semibold text-slate-700 mb-2">
            Thêm quy tắc nhanh
          </div>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100"
              placeholder="Nhập quy tắc mới ở đây…"
              value={quickMsg}
              onChange={(e) => setQuickMsg(e.target.value)}
            />
            <button
              onClick={quickAdd}
              disabled={adding || !quickMsg.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 text-white px-3 py-2 hover:bg-green-700 disabled:opacity-60"
              title="Thêm"
            >
              {adding && (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full" />
              )}
              <Plus size={16} />
              Thêm
            </button>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Bạn có thể sửa chi tiết sau khi thêm.
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-auto">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700 inline-flex items-center gap-2">
              <ClipboardList size={16} />
              Danh sách quy tắc ({rules.length})
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-slate-500">Đang tải…</div>
          ) : err ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
              Lỗi tải quy tắc: {err}
            </div>
          ) : rules.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 text-slate-600 px-4 py-3 text-sm">
              Chưa có quy tắc nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {rules.map((r) => (
                <RuleCard
                  key={r.id}
                  rule={r}
                  onEdit={() => startEdit(r)}
                  onDelete={() => askDelete(r.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
          Tip: thêm nhanh bằng message, sửa chi tiết bằng nút “Sửa”.
        </div>
      </div>

      {/* Edit modal */}
      <RuleEditModal
        open={editOpen}
        initial={editing}
        onClose={() => setEditOpen(false)}
        onSubmit={submitEdit}
        saving={editSaving}
        onSelectedTagUUIDsChange={(uuids) =>
          (selectedTagUUIDsRef.current = uuids)
        }
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={confirmOpen}
        title="Xác nhận xoá quy tắc"
        description="Bạn có chắc muốn xoá quy tắc này?"
        onConfirm={doDelete}
        onCancel={() => setConfirmOpen(false)}
        isBusy={deletingRule}
      />

      {/* Notice xoá thất bại */}
      <NoticeDialog
        open={noticeOpen}
        title={noticeTitle}
        description={noticeDesc}
        onClose={() => setNoticeOpen(false)}
        actionText="Đã hiểu"
      />
    </div>
  );
}

/* ===================== EDIT NAME MODAL ===================== */
type UIItem = {
  id: string;
  name: string;
  nutritionRules: NutritionRuleResponse[];
};

function EditNameModal({
  open,
  title,
  draft,
  setDraft,
  onClose,
  onSave,
  isSaving = false,
  externalError,
  clearServerError,
}: {
  open: boolean;
  title: string;
  draft: NamedItem;
  setDraft: React.Dispatch<React.SetStateAction<NamedItem>>;
  onClose: () => void;
  onSave: () => void;
  isSaving?: boolean;
  externalError?: string | null;
  clearServerError?: () => void;
}) {
  const name = draft?.name ?? "";
  const hasServerError = Boolean(externalError && externalError.trim());
  const canSave = name.trim().length > 0 && !isSaving;

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={isSaving ? undefined : onClose}
      />
      <div className="relative z-10 w-[92vw] max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-100">
          <h4 className="text-base font-semibold">{title}</h4>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <FieldLabel required>Tên</FieldLabel>
            <input
              autoFocus
              className={`mt-1 w-full rounded-xl px-3 py-2 focus:outline-none focus:ring-4 border ${
                hasServerError
                  ? "border-rose-300 focus:ring-rose-100"
                  : "border-slate-200 focus:ring-green-100"
              }`}
              placeholder="VD: Đái tháo đường tuýp 2 / Dị ứng hải sản"
              value={name}
              onChange={(e) => {
                if (hasServerError) clearServerError?.();
                setDraft((p) => ({ ...p, name: e.target.value }));
              }}
              aria-invalid={hasServerError}
              aria-describedby={
                hasServerError ? "name-server-error" : undefined
              }
            />
            {hasServerError && (
              <p
                id="name-server-error"
                className="mt-2 text-sm font-medium text-rose-600"
              >
                {externalError}
              </p>
            )}
          </div>
        </div>

        <div className="px-5 py-4 flex items-center justify-end gap-3">
          <button
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
            onClick={onClose}
            disabled={isSaving}
          >
            Đóng
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 inline-flex items-center gap-2"
            onClick={onSave}
            disabled={!canSave}
          >
            {isSaving && (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full" />
            )}
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== Collection Block ===================== */
function CollectionBlock({
  kind,
  title,
  icon,
  onMutate,
}: {
  kind: CollectionKind;
  title: string;
  icon: React.ReactNode;
  onMutate?: () => void;
}) {
  const [stats, setStatsState] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [items, setItems] = useState<UIItem[]>([]);
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<UIItem[]>([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // NoticeDialog state (xoá condition/allergy fail)
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState(
    `Không thể xoá ${kind === "conditions" ? "bệnh nền" : "dị ứng"}`
  );
  const [noticeDesc, setNoticeDesc] = useState<string | undefined>(undefined);

  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<NamedItem | null>(null);
  const [draft, setDraft] = useState<NamedItem>({ id: "", name: "" });
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleOwner, setRuleOwner] = useState<RuleOwner | null>(null);

  const openRules = (it: UIItem) => {
    setRuleOwner({
      kind,
      ownerId: it.id,
      ownerName: it.name,
      rules: it.nutritionRules ?? [],
    });
    setRuleOpen(true);
  };

  const loadStatsCb = useCallback(async () => {
    try {
      setLoadingStats(true);
      const overviewStats = await fetchStats();
      setStatsState(
        kind === "conditions"
          ? {
              total: overviewStats.getTotalConditions,
              top: mapTopToStats(overviewStats.top5Condition),
            }
          : {
              total: overviewStats.getTotalAllergies,
              top: mapTopToStats(overviewStats.top5Allergy),
            }
      );
    } finally {
      setLoadingStats(false);
    }
  }, [kind]);

  const loadPageCb = useCallback(
    async (p: number) => {
      try {
        setIsLoading(true);
        setListError(null);

        if (kind === "allergies") {
          const res = await fetchAllergiesPage(p, 12);
          const slice = res.data;
          const mapped: UIItem[] = (slice?.content ?? []).map(
            (x: AllergyResponse) => ({
              id: String(x.id),
              name: x.name,
              nutritionRules: x.nutritionRules ?? [],
            })
          );
          setItems(mapped);
          setIsLast(Boolean(slice?.last) || mapped.length < 12);
        } else {
          const res = await fetchConditionsPage(p, 12);
          const slice = res.data;
          const mapped: UIItem[] = (slice?.content ?? []).map(
            (x: ConditionResponse) => ({
              id: String(x.id),
              name: x.name,
              nutritionRules: x.nutritionRules ?? [],
            })
          );
          setItems(mapped);
          setIsLast(Boolean(slice?.last) || mapped.length < 12);
        }
      } catch (e: unknown) {
        const msg = errorMessage(e);
        setListError(msg);
        if (/HTTP 401/.test(msg)) setIsLast(true);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    },
    [kind]
  );

  const handleRulesChange = useCallback(
    (ownerId: string, nextRules: NutritionRuleResponse[]) => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === ownerId ? { ...it, nutritionRules: nextRules } : it
        )
      );
      setSearchResults((prev) =>
        prev.map((it) =>
          it.id === ownerId ? { ...it, nutritionRules: nextRules } : it
        )
      );
    },
    []
  );

  useEffect(() => {
    setItems([]);
    setPage(0);
    setIsLast(false);
    setQuery("");
    setSearchResults([]);
    setSearching(false);
    setSearchError(null);

    loadStatsCb();
    loadPageCb(0);
  }, [kind, loadStatsCb, loadPageCb]);

  // search
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearching(false);
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    setSearching(true);
    setSearchError(null);
    const controller = new AbortController();
    const t = (window as any).setTimeout(async () => {
      try {
        if (kind === "conditions") {
          const resp = await searchConditionsByName(
            q,
            0,
            20,
            controller.signal
          );
          const slice = resp?.data;
          const mapped: UIItem[] = (slice?.content ?? []).map(
            (x: ConditionResponse) => ({
              id: String(x.id),
              name: x.name,
              nutritionRules: x.nutritionRules ?? [],
            })
          );
          setSearchResults(mapped);
        } else {
          const resp = await searchAllergiesByName(q, 0, 20, controller.signal);
          const slice = resp?.data;
          const mapped: UIItem[] = (slice?.content ?? []).map(
            (x: AllergyResponse) => ({
              id: String(x.id),
              name: x.name,
              nutritionRules: x.nutritionRules ?? [],
            })
          );
          setSearchResults(mapped);
        }
      } catch (e: unknown) {
        if (isRequestCanceled(e)) return;
        setSearchError(errorMessage(e));
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      (window as any).clearTimeout(t);
      controller.abort();
    };
  }, [query, kind]);

  const goPrev = () => {
    if (isLoading || page === 0) return;
    const p = page - 1;
    setPage(p);
    loadPageCb(p);
  };
  const goNext = () => {
    if (isLoading || isLast) return;
    const p = page + 1;
    setPage(p);
    loadPageCb(p);
  };

  const refresh = () => {
    if (isLoading) return;
    setQuery("");
    setSearchResults([]);
    setSearching(false);
    setSearchError(null);
    loadStatsCb();
    loadPageCb(page);
  };

  const askDelete = (id: string) => {
    setToDelete(id);
    setConfirmOpen(true);
  };
  const doDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      if (kind === "conditions") await deleteCondition(toDelete);
      else await deleteAllergy(toDelete);
      await loadStatsCb();
      onMutate?.();
      loadPageCb(page);
    } catch (e: unknown) {
      setNoticeTitle(
        `Không thể xoá ${kind === "conditions" ? "bệnh nền" : "dị ứng"}`
      );
      setNoticeDesc(
        (errorMessage(e) || "").includes("constraint")
          ? "Mục này đang được tham chiếu bởi hồ sơ/luật dinh dưỡng, nên không thể xoá."
          : errorMessage(e)
      );
      setNoticeOpen(true);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setDraft({ id: "", name: "" });
    setServerError(null);
    setOpenModal(true);
  };

  const openEdit = (it: NamedItem) => {
    setEditing(it);
    setDraft({ id: it.id, name: it.name });
    setServerError(null);
    setOpenModal(true);
  };

  const save = async () => {
    try {
      setSaving(true);
      setServerError(null);
      const name = draft.name.trim();
      if (!name) return;

      if (editing) {
        if (kind === "conditions")
          await updateCondition(editing.id, { name } as ConditionRequest);
        else await updateAllergy(editing.id, { name } as AllergyRequest);

        await loadPageCb(page);
        await loadStatsCb();
        onMutate?.();
        setOpenModal(false);
        setEditing(null);
      } else {
        if (kind === "conditions") await createCondition({ name });
        else await createAllergy({ name });

        setPage(0);
        await loadStatsCb();
        await loadPageCb(0);
        onMutate?.();
        setOpenModal(false);
      }
    } catch (e: unknown) {
      const msg = errorMessage(e);
      const pretty = /HTTP 409/i.test(msg)
        ? msg.replace(/^HTTP 409:\s*/i, "")
        : msg;
      setServerError(pretty);
    } finally {
      setSaving(false);
    }
  };

  const totalValue =
    typeof stats?.total === "number" ? (stats.total as number) : undefined;
  const totalLabel = kind === "conditions" ? "Tổng bệnh nền" : "Tổng dị ứng";
  const data = query ? searchResults : items;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-emerald-50 text-emerald-700 p-2">
            {icon}
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <TotalPill
            label={totalLabel}
            value={totalValue}
            loading={loadingStats}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 hover:bg-slate-50"
            disabled={isLoading}
            title="Làm mới"
          >
            {isLoading && (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full" />
            )}
            <span>Làm mới</span>
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 text-white px-3.5 py-2.5 hover:bg-green-700 shadow"
          >
            <Plus size={18} /> Thêm{" "}
            {kind === "conditions" ? "bệnh nền" : "dị ứng"}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold text-slate-700 mb-3">
          Tìm theo tên
        </div>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100"
            placeholder={`Nhập tên ${
              kind === "conditions" ? "bệnh nền" : "dị ứng"
            }…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              {searching
                ? "Đang tìm…"
                : searchError
                ? "Lỗi tìm"
                : `${query ? searchResults.length : items.length} kết quả`}
            </div>
          )}
        </div>
      </div>

      {/* Errors */}
      {!query && listError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3">
          Lỗi tải danh sách: {listError}
        </div>
      )}
      {query && searchError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3">
          Lỗi tìm kiếm: {searchError}
        </div>
      )}

      {/* Cards */}
      {query && !searching && !searchError && data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
            <Search size={18} className="text-slate-400" />
          </div>

          <div className="text-sm text-slate-600">
            Không tìm thấy{" "}
            <span className="font-semibold text-slate-800">
              {kind === "conditions" ? "bệnh nền" : "dị ứng"}
            </span>{" "}
            nào khớp với{" "}
            <span className="mx-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-slate-800 border border-amber-100">
              “{query}”
            </span>
            .
          </div>

          <div className="mt-2 text-xs text-slate-500">
            Hãy thử từ khóa khác hoặc{" "}
            <button
              type="button"
              onClick={() => setQuery("")}
              className="underline decoration-dotted hover:text-slate-700"
            >
              xóa từ khóa
            </button>
            .
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.map((it) => (
            <div
              key={it.id}
              className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col"
            >
              <div className="p-4 flex-1 flex flex-col">
                <div
                  className="text-base font-semibold text-slate-900 line-clamp-2"
                  title={it.name}
                >
                  {it.name}
                </div>

                <div className="mt-2 text-xs text-slate-600 inline-flex items-center gap-2">
                  <ClipboardList size={14} />
                  <span>{it.nutritionRules?.length ?? 0} quy tắc</span>
                </div>

                <div className="mt-auto pt-3 grid grid-cols-3 gap-2">
                  <button
                    className="h-10 px-3 rounded-lg inline-flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    onClick={() => openRules(it)}
                    title="Quản lý quy tắc"
                  >
                    <Settings size={16} />
                    <span className="text-sm">Luật</span>
                  </button>

                  <button
                    className="h-10 px-3 rounded-lg inline-flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => openEdit(it)}
                    title="Chỉnh sửa"
                  >
                    <Pencil size={16} />
                    <span className="text-sm">Sửa</span>
                  </button>

                  <button
                    className="h-10 px-3 rounded-lg inline-flex items-center justify-center gap-2 bg-rose-600 text-white hover:bg-rose-700"
                    onClick={() => askDelete(it.id)}
                    title="Xoá"
                  >
                    <Trash2 size={16} />
                    <span className="text-sm">Xoá</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!query && (
        <div className="pt-3 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm">
            <button
              onClick={goPrev}
              disabled={isLoading || page === 0}
              className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Trang trước"
              title="Trang trước"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 group-hover:border-slate-300">
                <ChevronLeft size={18} />
              </span>
              <span className="text-sm font-medium hidden sm:inline">
                Trước
              </span>
            </button>

            <div className="mx-1 min-w-[90px] text-center text-sm text-slate-600">
              Trang{" "}
              <span className="font-semibold text-slate-900">{page + 1}</span>
            </div>

            <button
              onClick={goNext}
              disabled={isLoading || isLast}
              className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Trang sau"
              title="Trang sau"
            >
              <span className="text-sm font-medium hidden sm:inline">Sau</span>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 group-hover:border-slate-300">
                <ChevronRight size={18} />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <EditNameModal
        open={openModal}
        title={`${editing ? "Chỉnh sửa" : "Thêm"} ${
          kind === "conditions" ? "bệnh nền" : "dị ứng"
        }`}
        draft={draft}
        setDraft={setDraft}
        onClose={() => setOpenModal(false)}
        onSave={save}
        isSaving={saving}
        externalError={serverError}
        clearServerError={() => setServerError(null)}
      />

      {/* Drawer Quy tắc */}
      <RuleDrawer
        open={ruleOpen}
        owner={ruleOwner}
        onClose={() => setRuleOpen(false)}
        onMutate={onMutate}
        onRulesChange={handleRulesChange}
      />

      {/* Confirm xoá */}
      <ConfirmDialog
        open={confirmOpen}
        title={`Xác nhận xoá ${kind === "conditions" ? "bệnh nền" : "dị ứng"}`}
        description="Bạn có chắc muốn xoá mục này?"
        onConfirm={doDelete}
        onCancel={() => setConfirmOpen(false)}
        isBusy={deleting}
      />

      {/* Notice xoá thất bại */}
      <NoticeDialog
        open={noticeOpen}
        title={noticeTitle}
        description={noticeDesc}
        onClose={() => setNoticeOpen(false)}
        actionText="Đã hiểu"
      />
    </div>
  );
}

/* ===================== Main page ===================== */
export default function ClinicalPage() {
  const [condStats, setCondStats] = useState<Stats | null>(null);
  const [allergStats, setAllergStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadBottomStats = useCallback(async () => {
    try {
      setLoading(true);
      const overviewStats = await fetchStats();
      setCondStats({
        total: overviewStats.getTotalConditions,
        top: mapTopToStats(overviewStats.top5Condition),
      });
      setAllergStats({
        total: overviewStats.getTotalAllergies,
        top: mapTopToStats(overviewStats.top5Allergy),
      });
    } catch (e) {
      console.error("Failed to load bottom stats:", e);
      setCondStats({ total: 0, top: [] });
      setAllergStats({ total: 0, top: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBottomStats();
  }, [loadBottomStats]);

  const TopCard = ({ title, s }: { title: string; s: Stats | null }) => {
    const arr = Array.isArray(s?.top) ? s!.top : [];
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">{title}</div>
        </div>
        {loading ? (
          <div className="text-slate-500 text-sm">Đang tải…</div>
        ) : arr.length === 0 ? (
          <div className="text-slate-400 text-sm">Chưa có dữ liệu</div>
        ) : (
          <ul className="space-y-2">
            {arr.slice(0, 5).map((t, idx) => {
              const total =
                typeof s?.total === "number" ? (s!.total as number) : 0;
              const pct =
                total > 0 ? Math.round((t.count * 1000) / total) / 10 : 0;
              return (
                <li
                  key={t.name + idx}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-right text-slate-500">
                      {idx + 1}.
                    </span>
                    <span className="font-medium">{t.name}</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    {t.count.toLocaleString()}{" "}
                    <span className="text-slate-400">({pct}%)</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">
          Quản lý bệnh nền, dị ứng & quy tắc dinh dưỡng
        </h1>
      </div>

      <CollectionBlock
        kind="conditions"
        title="Bệnh nền"
        icon={<Activity size={18} />}
        onMutate={loadBottomStats}
      />

      <div className="mt-2">
        <CollectionBlock
          kind="allergies"
          title="Dị ứng"
          icon={<AlertTriangle size={18} />}
          onMutate={loadBottomStats}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopCard title="Top 5 bệnh nền xuất hiện nhiều nhất" s={condStats} />
        <TopCard title="Top 5 dị ứng xuất hiện nhiều nhất" s={allergStats} />
      </div>

      <div className="text-slate-400 text-sm text-center py-6">
        Đã hết dữ liệu
      </div>
    </div>
  );
}
