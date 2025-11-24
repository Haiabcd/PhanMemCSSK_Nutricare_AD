import React, {
  useRef,
  useId,
  useState,
  useEffect,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import {
  Apple,
  Search,
  Utensils,
  Timer,
  Flame,
  Dumbbell,
  X,
} from "lucide-react";
import type { IngredientResponse } from "../../types/ingredients";
import type {
  FoodCreationRequest,
  FoodPatchRequest,
  SuggestionAI,
  FoodResponse,
} from "../../types/meals";
import {
  createFood,
  suggestDescription,
  updateFood,
} from "../../service/meals.service";
import { autocompleteIngredients } from "../../service/ingredients.service";
import { fetchTagsAutocomplete } from "../../service/tag.service";
import { isRequestCanceled } from "../../service/helpers";

/* ======================= Helpers ======================= */
function vnSlotToBE(s: string): "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" {
  switch (s) {
    case "Bữa sáng":
      return "BREAKFAST";
    case "Bữa trưa":
      return "LUNCH";
    case "Bữa chiều":
      return "DINNER";
    case "Bữa phụ":
      return "SNACK";
    default:
      return "SNACK";
  }
}
function beToVnSlot(s: string) {
  switch (s) {
    case "BREAKFAST":
      return "Bữa sáng";
    case "LUNCH":
      return "Bữa trưa";
    case "DINNER":
      return "Bữa chiều";
    case "SNACK":
      return "Bữa phụ";
    default:
      return s;
  }
}
function dataURLtoFile(dataUrl: string, filename = "image.png"): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] ?? "image/png";
  const bstr = atob(arr[1] ?? "");
  let n = bstr.length;
  const u8 = new Uint8Array(n);
  while (n--) u8[n] = bstr.charCodeAt(n);
  return new File([u8], filename, { type: mime });
}

/* ======================= Primitives ======================= */
function PillToggle(props: any) {
  const { active, onClick, children } = props;
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm transition ${active
        ? "bg-emerald-600 text-white shadow"
        : "bg-white text-slate-700 hover:bg-slate-50"
        }`}
      type="button"
      title={String(children)}
    >
      {children}
    </button>
  );
}
function Label(props: any) {
  const { children, required = false, htmlFor, hint } = props;
  return (
    <div className="flex items-baseline justify-between">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {children} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}
function FieldHintError({ message }: any) {
  if (!message) return null;
  return <p className="text-xs text-red-600 mt-1">{message}</p>;
}
function TextInput(props: any) {
  const {
    value,
    onChange,
    placeholder,
    type = "text",
    id,
    title,
    error,
    leftIcon,
    inputRef,
    onFocus,
    onKeyDown,
  } = props;
  const hasError = Boolean(error);
  return (
    <>
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </span>
        )}
        <input
          ref={inputRef}
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
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? ""}
          type={type}
          aria-invalid={hasError}
          className={`w-full h-11 ${leftIcon ? "pl-10" : "pl-3"
            } pr-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 ${hasError ? "focus:ring-rose-100" : "focus:ring-emerald-100"
            }`}
        />
      </div>
      <FieldHintError message={error} />
    </>
  );
}
function Select(props: any) {
  const { value, onChange, options, placeholder, id, title, error } = props;
  const hasError = Boolean(error);
  return (
    <>
      <select
        id={id}
        title={title || placeholder || "select"}
        className={`w-full h-11 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 ${hasError ? "focus:ring-rose-100" : "focus:ring-emerald-100"
          }`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        aria-invalid={hasError}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {(options || []).map((opt: string) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <FieldHintError message={error} />
    </>
  );
}
function ImagePicker({
  value,
  previewUrl,
  onPicked,
  onPickedFile,
  onClear,
  inputId,
}: any) {
  const ref = useRef<HTMLInputElement | null>(null);
  const pick = () => ref.current?.click();
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPicked(String(reader.result));
    reader.readAsDataURL(file);
    onPickedFile?.(file);
    e.currentTarget.value = "";
  };
  const shown = previewUrl || value;
  return (
    <div className="space-y-2">
      {shown ? (
        <div className="space-y-2">
          <img
            src={shown}
            alt="preview"
            className="w-full max-h-40 object-cover rounded-xl border border-slate-200"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={pick}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              title="Đổi ảnh"
            >
              Đổi ảnh…
            </button>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                title="Xoá ảnh"
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
      {!shown && (
        <div className="text-xs text-slate-500">
          Chọn ảnh từ máy của bạn (JPEG/PNG…)
        </div>
      )}
    </div>
  );
}
function Modal(props: any) {
  const { open, onClose, title, children } = props;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-[95vw] max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 grid place-items-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Apple size={18} />
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
function Section(props: any) {
  const { icon, title, children } = props;
  return (
    <div className="rounded-2xl bg-white">
      {(title || icon) && (
        <div className="px-1 py-1 flex items-center gap-2">
          {icon}
          {title && <h4 className="font-semibold text-slate-800">{title}</h4>}
        </div>
      )}
      <div className="p-0">{children}</div>
    </div>
  );
}
function NumberInput(props: any) {
  const { value, onChange, id, title, placeholder, suffix, error } = props;
  const hasError = Boolean(error) || (typeof value === "number" && value < 0);
  return (
    <div className="relative">
      <input
        id={id}
        title={title || placeholder || "number"}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          const num = raw === "" ? undefined : Number(raw);
          const safe =
            typeof num === "number" && !Number.isNaN(num)
              ? Math.max(0, num)
              : num;
          onChange(safe);
        }}
        placeholder={placeholder ?? ""}
        inputMode="decimal"
        type="number"
        min={0}
        step="any"
        aria-invalid={hasError}
        className={`w-full h-11 pr-12 pl-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 ${hasError ? "focus:ring-rose-100" : "focus:ring-emerald-100"
          }`}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
          {suffix}
        </span>
      )}
      <FieldHintError
        message={hasError ? error || "Không được nhập số âm" : undefined}
      />
    </div>
  );
}

function getScrollParent(node: HTMLElement | null): HTMLElement | Window {
  if (!node) return window;
  let cur: HTMLElement | null = node.parentElement;
  while (cur && cur !== document.body) {
    const s = window.getComputedStyle(cur);
    if (/(auto|scroll|overlay)/.test(s.overflowY)) return cur;
    cur = cur.parentElement;
  }
  return window;
}

function useElementRect(el: HTMLElement | null) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!el) return;

    const update = () => setRect(el.getBoundingClientRect());
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    const sp = getScrollParent(el);
    const onScroll = () => update();

    // nghe scroll ở parent (hoặc window) + capture ở document cho an toàn
    if (sp === window) {
      window.addEventListener("scroll", onScroll, { passive: true });
    } else {
      (sp as HTMLElement).addEventListener("scroll", onScroll, {
        passive: true,
      });
    }
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      if (sp === window) {
        window.removeEventListener("scroll", onScroll);
      } else {
        (sp as HTMLElement).removeEventListener("scroll", onScroll);
      }
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", update);
    };
  }, [el]);

  return rect;
}

function IngredientAutocomplete({
  onSelect,
}: {
  onSelect: (ing: IngredientResponse) => void;
}) {
  const inputId = useId();
  const debounceRef = useRef<number | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [list, setList] = useState<IngredientResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);

  const rect = useElementRect(inputRef.current);
  const cancelSearchNow = () => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (ctrlRef.current) {
      ctrlRef.current.abort();
      ctrlRef.current = null;
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!query.trim()) {
      cancelSearchNow();
      setList([]);
      setOpen(false);
      setHighlight(-1);
      return;
    }

    // huỷ cái cũ trước khi tạo mới
    cancelSearchNow();
    setLoading(true);

    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    debounceRef.current = window.setTimeout(async () => {
      try {
        const data = await autocompleteIngredients(query, 10, ctrl.signal);
        setList(data as IngredientResponse[]);
        setOpen(true);
        setHighlight(Array.isArray(data) && data.length ? 0 : -1);
      } catch (e) {
        if (isRequestCanceled(e)) return;
        console.warn("autocompleteIngredients failed:", e);
        setList([]);
        setOpen(false);
      } finally {
        setLoading(false);
        ctrlRef.current = null;
        debounceRef.current = null;
      }
    }, 200);

    return () => cancelSearchNow();
  }, [query]);

  useEffect(() => {
    const onDocPointerDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      const insideInput = !!(
        inputRef.current &&
        t &&
        inputRef.current.contains(t)
      );
      const insideDropdown = !!(
        dropdownRef.current &&
        t &&
        dropdownRef.current.contains(t)
      );
      if (insideInput || insideDropdown) return;
      setOpen(false);
      cancelSearchNow();
    };
    document.addEventListener("mousedown", onDocPointerDown);
    return () => document.removeEventListener("mousedown", onDocPointerDown);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !list.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % list.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + list.length) % list.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = list[highlight] ?? list[0];
      if (item) {
        onSelect(item);
        setQuery("");
        setList([]);
        setOpen(false);
        inputRef.current?.focus();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      cancelSearchNow();
    }
  };

  const dropdownStyle = React.useMemo(() => {
    if (!rect) return undefined as React.CSSProperties | undefined;
    const sp = getScrollParent(inputRef.current);
    let parentTop = 0,
      parentBottom = window.innerHeight;
    if (sp !== window) {
      const r = (sp as HTMLElement).getBoundingClientRect();
      parentTop = r.top;
      parentBottom = r.bottom;
    }
    const estimated = Math.min(288, Math.max(list.length, 1) * 48);
    const spaceBelow = parentBottom - rect.bottom;
    const spaceAbove = rect.top - parentTop;

    const showAbove = spaceBelow < estimated + 12 && spaceAbove > spaceBelow;
    const desiredTop = showAbove
      ? rect.top - Math.min(estimated, spaceAbove) - 8
      : rect.bottom + 6;
    const top = Math.max(8, Math.min(desiredTop, window.innerHeight - 8 - 24));
    return {
      position: "fixed" as const,
      top,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(
        estimated,
        showAbove ? spaceAbove - 12 : spaceBelow - 12
      ),
      overflow: "auto",
      zIndex: 10000,
    };
  }, [rect, list.length]);

  return (
    <div className="relative">
      <div className="relative">
        <TextInput
          id={inputId}
          value={query}
          onChange={(v: any) => setQuery(String(v ?? ""))}
          placeholder="Nhập tên nguyên liệu cần tìm ........."
          leftIcon={<Search size={16} />}
          inputRef={inputRef}
          onFocus={() => query && setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            Đang tìm…
          </span>
        )}
      </div>

      {open &&
        list.length > 0 &&
        rect &&
        createPortal(
          <div
            ref={dropdownRef}
            className="z-10000 fixed overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl"
            style={dropdownStyle}
          >
            {list.map((ing, idx) => (
              <button
                type="button"
                key={ing.id}
                className={`w-full text-left flex items-center gap-3 px-3 py-3 hover:bg-slate-50 ${idx === highlight ? "bg-slate-50" : ""
                  }`}
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => {
                  onSelect(ing);
                  setOpen(false);
                  setQuery("");
                  setList([]);
                  inputRef.current?.focus();
                }}
                title={ing.name}
              >
                {ing.imageUrl ? (
                  <img
                    src={ing.imageUrl}
                    alt={ing.name}
                    className="h-9 w-9 object-cover rounded-lg border border-slate-200"
                  />
                ) : (
                  <div className="h-9 w-9 grid place-items-center rounded-lg border border-slate-200 text-slate-400">
                    <Dumbbell size={14} />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate font-medium text-sm">{ing.name}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {ing.aliases?.join(", ")}
                  </div>
                </div>
                <div className="ml-auto text-xs text-slate-500">{ing.unit}</div>
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

/* ======================= Tags (autocomplete + multi) ======================= */
type UITag = { id: string; nameCode: string; description?: string | null };

async function autocompleteTags(
  q: string,
  limit = 10,
  signal?: AbortSignal
): Promise<UITag[]> {
  const data = await fetchTagsAutocomplete(q, limit, signal);
  return (data ?? []).map((t: any) => ({
    id: t.id,
    nameCode: t.nameCode,
    description: t.description ?? "",
  }));
}

function TagPicker({
  value,
  onChange,
}: {
  value: UITag[]; // mảng tag đã chọn (id + nameCode)
  onChange: (tags: UITag[]) => void; // trả ra mảng tag đầy đủ
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<UITag[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setOptions([]);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await autocompleteTags(q, 8, ctl.signal);
        setOptions(res);
      } catch (e) {
        if (isRequestCanceled(e)) return;
        console.warn("autocompleteTags failed:", e);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [query]);

  const add = (t: UITag) => {
    if (value.some((x) => x.id === t.id)) return;
    onChange([...value, t]);
    setQuery("");
  };
  const remove = (uuid: string) => {
    onChange(value.filter((t) => t.id !== uuid));
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <TextInput
          value={query}
          onChange={(v: any) => setQuery(String(v ?? ""))}
          placeholder="Nhập để tìm thẻ…"
          leftIcon={<Search size={16} />}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            Đang tìm…
          </span>
        )}
      </div>

      {!!query.trim() && !loading && (
        <div className="rounded-xl border border-slate-200 bg-white shadow">
          {options.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">
              Không tìm thấy kết quả cho “{query}”
            </div>
          ) : (
            <ul className="max-h-56 overflow-auto divide-y divide-slate-100">
              {options.map((op) => (
                <li
                  key={op.id}
                  className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                  onClick={() => add(op)}
                  title={op.description || op.nameCode}
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
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {value.length === 0 ? (
          <span className="text-xs text-slate-500">Chưa chọn thẻ nào</span>
        ) : (
          value.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm shadow-sm"
              title={tag.description || tag.nameCode}
            >
              <span className="max-w-48 truncate font-medium">
                {tag.nameCode}
              </span>
              <button
                className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-emerald-100 text-emerald-700 hover:text-emerald-900"
                onClick={() => remove(tag.id)}
                title="Xoá"
                aria-label={`Xoá ${tag.nameCode}`}
              >
                <X size={14} />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

/* ======================= Form ======================= */
function MealForm(props: any) {
  const {
    draft,
    setDraft,
    errors,
    setErrors,
    imageFile,
    setImageFile,
    previewUrl,
    setPreviewUrl,
    isEdit,
  } = props;

  const nameId = useId(),
    imgId = useId();
  const servingId = useId(),
    servingNameId = useId(),
    servingGramId = useId();

  const [aiLoading, setAiLoading] = useState(false);

  const validateSelectRequired = (key: string, value?: string) => {
    setErrors((e: any) => ({
      ...e,
      [key]: !value?.trim() ? `Vui lòng chọn ${key}` : undefined,
    }));
  };
  const validateNumberRequired = (key: string, val?: number) => {
    setErrors((e: any) => ({
      ...e,
      [key]: val === undefined ? `Vui lòng nhập ${key}` : undefined,
    }));
  };

  useEffect(() => {
    if (!isEdit) {
      setDraft((d: FoodResponse) => ({
        ...d,
        defaultServing: d.defaultServing ?? 1,
        servingGram: d.servingGram,
        cookMinutes: d.cookMinutes,
        nutrition: {
          kcal: d.nutrition?.kcal,
          proteinG: d.nutrition?.proteinG,
          carbG: d.nutrition?.carbG,
          fatG: d.nutrition?.fatG,
          fiberG: d.nutrition?.fiberG,
          sodiumMg: d.nutrition?.sodiumMg,
          sugarMg: d.nutrition?.sugarMg,
        },
      }));
    }
    validateSelectRequired("servingName", draft.servingName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addIngredient = (ing: IngredientResponse) => {
    const item = {
      ingredientId: String(ing.id),
      name: ing.name,
      unit: ing.unit,
      imageUrl: ing.imageUrl,
      quantity: 100,
    };
    const current = draft.ingredients || [];
    const idx = current.findIndex(
      (x: any) => x.ingredientId === item.ingredientId
    );
    const next =
      idx >= 0
        ? current.map((x: any, i: number) =>
          i === idx ? { ...x, quantity: x.quantity + item.quantity } : x
        )
        : [...current, item];
    setDraft({ ...draft, ingredients: next });
  };

  const buildLocalDescription = () => {
    const name = draft.name || "Món ăn";
    const slots = draft.mealSlots?.length
      ? draft.mealSlots.map(beToVnSlot).join(", ")
      : "các bữa ăn trong ngày";
    const ings = (draft.ingredients || [])
      .map((i: any) => `${i.name} ${i.quantity}${i.unit ?? ""}`)
      .join(", ");
    const n = draft.nutrition || ({} as any);
    const parts = [
      `${name} phù hợp cho: ${slots}.`,
      ings ? `Nguyên liệu dự kiến: ${ings}.` : undefined,
      `Thời gian nấu ~${draft.cookMinutes || 0} phút.`,
      `Dinh dưỡng/khẩu phần: ${n.kcal || 0} kcal, ${n.proteinG || 0
      }g protein, ${n.carbG || 0}g carb, ${n.fatG || 0}g fat, ${n.fiberG || 0
      }g fiber, ${n.sodiumMg || 0}mg sodium, ${n.sugarMg || 0}mg sugar.`,
    ].filter(Boolean);
    return parts.join(" ");
  };

  const generateDescription = async () => {
    try {
      setAiLoading(true);
      let img: File | undefined = imageFile;
      if (!img && previewUrl?.startsWith("data:"))
        img = dataURLtoFile(previewUrl);

      const payload: SuggestionAI = {
        image: img,
        dishName: draft.name || "Món ăn",
        nutrition: {
          kcal: draft.nutrition?.kcal ?? 0,
          proteinG: draft.nutrition?.proteinG ?? 0,
          carbG: draft.nutrition?.carbG ?? 0,
          fatG: draft.nutrition?.fatG ?? 0,
          fiberG: draft.nutrition?.fiberG ?? 0,
          sodiumMg: draft.nutrition?.sodiumMg ?? 0,
          sugarMg: draft.nutrition?.sugarMg ?? 0,
        },
      };

      const text = await suggestDescription(payload);
      setDraft({ ...draft, description: text });
    } catch (e) {
      console.error("suggestDescription failed:", e);
      setDraft({ ...draft, description: buildLocalDescription() });
    } finally {
      setAiLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Thông tin cơ bản */}
      <Section
        icon={<Utensils size={16} className="text-emerald-600" />}
        title="Thông tin cơ bản"
      >
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-7 space-y-2">
            <Label htmlFor={nameId} required>
              Tên món ăn
            </Label>
            <TextInput
              id={nameId}
              title="Tên món ăn"
              value={draft.name}
              onChange={(v: any) => {
                const name = String(v ?? "");
                setDraft({ ...draft, name });
                setErrors((e: any) => ({ ...e, name: undefined }));
              }}
              placeholder="Ví dụ: Cơm tấm sườn"
              leftIcon={<Utensils size={16} />}
              error={errors.name}
            />
          </div>
          <div className="xl:col-span-5 space-y-2">
            <Label
              htmlFor={imgId}
              hint={isEdit ? "Tùy chọn" : "Bắt buộc khi thêm mới"}
            >
              Ảnh
            </Label>
            <ImagePicker
              inputId={imgId}
              value={draft.imageUrl}
              previewUrl={previewUrl}
              onPicked={(dataUrl: string) => setPreviewUrl(dataUrl)}
              onPickedFile={(f: File) => setImageFile(f)}
              onClear={() => {
                setPreviewUrl("");
                setImageFile(undefined);
              }}
            />
          </div>
        </div>
      </Section>

      {/* Khẩu phần & Đơn vị */}
      <Section title="Khẩu phần & Đơn vị">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <Label htmlFor={servingId}>Khẩu phần mặc định</Label>
            <NumberInput
              id={servingId}
              title="Khẩu phần"
              value={draft.defaultServing}
              onChange={(v: number | undefined) => {
                setDraft({ ...draft, defaultServing: v });
                validateNumberRequired("defaultServing", v);
              }}
              placeholder="1"
              error={errors.defaultServing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={servingNameId}>Đơn vị khẩu phần</Label>
            <Select
              id={servingNameId}
              title="Đơn vị khẩu phần"
              value={draft.servingName}
              onChange={(v: string | undefined) => {
                setDraft({ ...draft, servingName: v || "" });
                validateSelectRequired("servingName", v);
              }}
              placeholder="Chọn đơn vị"
              options={[
                "tô",
                "chén",
                "ly",
                "đĩa",
                "phần",
                "cốc",
                "cái",
                "miếng",
              ]}
              error={errors.servingName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={servingGramId}>Trọng lượng 1 đơn vị</Label>
            <NumberInput
              id={servingGramId}
              title="Trọng lượng 1 đơn vị"
              value={draft.servingGram}
              onChange={(v: number | undefined) => {
                setDraft({ ...draft, servingGram: v });
                validateNumberRequired("servingGram", v);
              }}
              placeholder="gram"
              suffix="g"
              error={errors.servingGram}
            />
          </div>
        </div>
      </Section>

      {/* Dinh dưỡng */}
      <Section
        icon={<Flame size={16} className="text-amber-600" />}
        title="Dinh dưỡng (trên khẩu phần)"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <Label>Thời gian nấu</Label>
            <NumberInput
              value={draft.cookMinutes}
              onChange={(v: number | undefined) => {
                setDraft({ ...draft, cookMinutes: v });
                validateNumberRequired("cookMinutes", v);
              }}
              suffix="phút"
              error={errors.cookMinutes}
            />
          </div>
          <div className="space-y-2">
            <Label>Calo</Label>
            <NumberInput
              value={draft.nutrition.kcal}
              onChange={(v: number | undefined) =>
                setDraft({
                  ...draft,
                  nutrition: { ...draft.nutrition, kcal: v },
                })
              }
              suffix="kcal"
              error={errors.kcal}
            />
          </div>
          <div className="space-y-2">
            <Label>Protein</Label>
            <NumberInput
              value={draft.nutrition.proteinG}
              onChange={(v: number | undefined) =>
                setDraft({
                  ...draft,
                  nutrition: { ...draft.nutrition, proteinG: v },
                })
              }
              suffix="g"
              error={errors.proteinG}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          <div className="space-y-2">
            <Label>Carb</Label>
            <NumberInput
              value={draft.nutrition.carbG}
              onChange={(v: number | undefined) =>
                setDraft({
                  ...draft,
                  nutrition: { ...draft.nutrition, carbG: v },
                })
              }
              suffix="g"
              error={errors.carbG}
            />
          </div>
          <div className="space-y-2">
            <Label>Fat</Label>
            <NumberInput
              value={draft.nutrition.fatG}
              onChange={(v: number | undefined) =>
                setDraft({
                  ...draft,
                  nutrition: { ...draft.nutrition, fatG: v },
                })
              }
              suffix="g"
              error={errors.fatG}
            />
          </div>
          <div className="space-y-2">
            <Label>Fiber</Label>
            <NumberInput
              value={draft.nutrition.fiberG}
              onChange={(v: number | undefined) =>
                setDraft({
                  ...draft,
                  nutrition: { ...draft.nutrition, fiberG: v },
                })
              }
              suffix="g"
              error={errors.fiberG}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <div className="space-y-2">
            <Label>Sodium</Label>
            <NumberInput
              value={draft.nutrition.sodiumMg}
              onChange={(v: number | undefined) =>
                setDraft({
                  ...draft,
                  nutrition: { ...draft.nutrition, sodiumMg: v },
                })
              }
              suffix="mg"
              error={errors.sodiumMg}
            />
          </div>
          <div className="space-y-2">
            <Label>Sugar</Label>
            <NumberInput
              value={draft.nutrition.sugarMg}
              onChange={(v: number | undefined) =>
                setDraft({
                  ...draft,
                  nutrition: { ...draft.nutrition, sugarMg: v },
                })
              }
              suffix="mg"
              error={errors.sugarMg}
            />
          </div>
        </div>
      </Section>

      {/* Bữa ăn */}
      <Section
        icon={<Timer size={16} className="text-indigo-600" />}
        title={
          <span>
            Bữa ăn (chọn nhiều) <span className="text-red-500">*</span>
          </span>
        }
      >
        <div className="flex flex-wrap gap-2">
          {(["Bữa sáng", "Bữa trưa", "Bữa chiều", "Bữa phụ"] as const).map(
            (vn) => {
              const be = vnSlotToBE(vn) as MealSlot;

              // đảm bảo là mảng MealSlot[]
              const slots = (draft.mealSlots ?? []) as MealSlot[];
              const active = slots.includes(be);
              type MealSlot = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
              return (
                <PillToggle
                  key={vn}
                  active={active}
                  onClick={() => {
                    const has = slots.includes(be);
                    const next: MealSlot[] = has
                      ? slots.filter((s) => s !== be)
                      : [...slots, be];
                    setDraft({ ...draft, mealSlots: next });
                  }}
                >
                  {vn}
                </PillToggle>
              );
            }
          )}
        </div>
      </Section>

      {/* Mô tả + AI */}
      <Section>
        <div className="space-y-2">
          <Label hint="Có thể để trống hoặc tạo tự động">Mô tả</Label>
          <textarea
            title="Mô tả"
            value={draft.description ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            rows={3}
            placeholder="Mô tả ngắn về món ăn..."
            className="w-full min-h-[88px] px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-100"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={generateDescription}
              disabled={!draft.name?.trim() || aiLoading}
              className={`px-3 py-2 rounded-xl text-white ${!draft.name?.trim() || aiLoading
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
                }`}
            >
              {aiLoading
                ? "Đang tạo…"
                : !draft.name?.trim()
                  ? "Nhập tên món để dùng AI"
                  : "Tạo mô tả bằng AI"}
            </button>
          </div>
        </div>
      </Section>

      {/* Thẻ */}
      <Section title="Thẻ (Tags) - VD: Hải sản, thịt đỏ, ...">
        <TagPicker
          value={(draft.tags || []).map((t: any) => ({
            id: String(t.id),
            nameCode: String(t.nameCode),
            description: t.description ?? "",
          }))}
          onChange={(tags) => {
            setDraft({
              ...draft,
              tags: tags.map((t) => ({
                id: t.id,
                nameCode: t.nameCode,
              })) as any,
            });
          }}
        />
      </Section>

      {/* Nguyên liệu */}
      <Section
        icon={<Dumbbell size={16} className="text-rose-600" />}
        title="Nguyên liệu"
      >
        <div className="space-y-3">
          <IngredientAutocomplete
            onSelect={(ing) => addIngredient(ing as IngredientResponse)}
          />
          {(draft.ingredients?.length ?? 0) > 0 && (
            <div className="mt-1 space-y-2">
              {(draft.ingredients || []).map((ing: any) => (
                <div
                  key={ing.ingredientId}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200"
                >
                  {ing.imageUrl ? (
                    <img
                      src={ing.imageUrl}
                      alt={ing.name}
                      className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="h-12 w-12 grid place-items-center rounded-lg border border-slate-200 text-slate-400">
                      <Dumbbell size={16} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{ing.name}</div>
                    <div className="text-xs text-slate-500">
                      Đơn vị: {ing.unit}
                    </div>
                  </div>
                  <div className="ml-auto w-36">
                    <NumberInput
                      value={ing.quantity}
                      onChange={(v: number | undefined) => {
                        const current = draft.ingredients || [];
                        const next = current.map((x: any) =>
                          x.ingredientId === ing.ingredientId
                            ? { ...x, quantity: v ?? 0 }
                            : x
                        );
                        setDraft({ ...draft, ingredients: next });
                      }}
                      suffix={ing.unit}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const current = draft.ingredients || [];
                      const next = current.filter(
                        (x: any) => x.ingredientId !== ing.ingredientId
                      );
                      setDraft({ ...draft, ingredients: next });
                    }}
                    className="ml-2 h-10 w-10 grid place-items-center rounded-lg border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100"
                    title="Xoá nguyên liệu"
                    aria-label={`Xoá ${ing.name}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

/* ======================= Component chính ======================= */
export default function AddAndUpdate(props: {
  open: boolean;
  isEdit: boolean;
  draft: FoodResponse;
  setDraft: React.Dispatch<React.SetStateAction<FoodResponse>>;
  onClose: () => void;
  onSave?: (food: FoodResponse) => void;
}) {
  const { open, isEdit, draft, setDraft, onClose, onSave } = props;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [initialTagObjs, setInitialTagObjs] = useState<
    { id: string; nameCode: string }[]
  >(
    Array.isArray(draft?.tags)
      ? draft.tags.map((t: any) => ({
        id: String(t.id),
        nameCode: String(t.nameCode),
      }))
      : []
  );

  useEffect(() => {
    if (open) {
      setErrors({});
      setPreviewUrl("");
      setImageFile(undefined);
      setInitialTagObjs(
        Array.isArray(draft?.tags)
          ? draft.tags.map((t: any) => ({
            id: String(t.id),
            nameCode: String(t.nameCode),
          }))
          : []
      );
    }
  }, [open, draft?.tags]);

  const toStrictNutrition = (
    n?: FoodResponse["nutrition"]
  ): FoodCreationRequest["nutrition"] => ({
    kcal: n?.kcal ?? 0,
    proteinG: n?.proteinG ?? 0,
    carbG: n?.carbG ?? 0,
    fatG: n?.fatG ?? 0,
    fiberG: n?.fiberG ?? 0,
    sodiumMg: n?.sodiumMg ?? 0,
    sugarMg: n?.sugarMg ?? 0,
  });

  const buildFoodCreationRequest = (): FoodCreationRequest => {
    let file: File | undefined = imageFile;
    if (!file && previewUrl?.startsWith("data:"))
      file = dataURLtoFile(previewUrl);

    return {
      name: draft.name,
      description: draft.description || "",
      defaultServing: draft.defaultServing ?? 1,
      servingName: draft.servingName ?? "phần",
      servingGram: draft.servingGram ?? 0,
      cookMinutes: draft.cookMinutes ?? 0,
      nutrition: toStrictNutrition(draft.nutrition),
      mealSlots: (draft.mealSlots || []) as FoodCreationRequest["mealSlots"],
      tags: (draft.tags || []).map((t: any) => String(t.id)),
      image: file as File,
      ingredients: (draft.ingredients || []).map((i: any) => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
      })),
    };
  };

  const buildFoodPatchRequest = (): FoodPatchRequest => {
    let file: File | undefined = imageFile;
    if (!file && previewUrl?.startsWith("data:"))
      file = dataURLtoFile(previewUrl);
    return {
      name: draft.name,
      description: draft.description || "",
      defaultServing: draft.defaultServing ?? 1,
      servingName: draft.servingName || undefined,
      servingGram: draft.servingGram ?? 0,
      cookMinutes: draft.cookMinutes ?? 0,
      nutrition: toStrictNutrition(draft.nutrition),
      mealSlots: (draft.mealSlots || []) as FoodPatchRequest["mealSlots"],
      tags: (draft.tags || []).map((t: any) => String(t.id)),
      image: file,
      ingredients: (draft.ingredients || []).map((i: any) => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
      })),
    };
  };

  const handleSave = async () => {
    const hasName = !!draft.name?.trim();
    const hasSlots =
      Array.isArray(draft.mealSlots) && draft.mealSlots.length > 0;
    const hasNewImageForCreate =
      !!imageFile || (previewUrl && previewUrl.startsWith("data:"));

    if (!hasName || !hasSlots) return;
    if (!isEdit && !hasNewImageForCreate) return;

    try {
      if (isEdit) {
        const req = buildFoodPatchRequest();
        // nếu updateFood không trả về gì, thay bằng: const updated = { ...draft };
        const updated = await updateFood(String(draft.id), req);
        onSave?.(updated ?? draft);
      } else {
        const req = buildFoodCreationRequest();
        const created = await createFood(req);
        onSave?.(created);
      }
      onClose();
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (/409/.test(msg) || /đã tồn tại/i.test(msg)) {
        setErrors((prev) => ({
          ...prev,
          name: isEdit ? "Tên món bị trùng" : "Món ăn đã tồn tại",
        }));
        return;
      }
      setErrors((prev) => ({
        ...prev,
        name: msg || (isEdit ? "Cập nhật món thất bại" : "Tạo món thất bại"),
      }));
    }
  };

  const canSubmit = isEdit
    ? !!draft.name?.trim() &&
    Array.isArray(draft.mealSlots) &&
    draft.mealSlots.length > 0
    : !!draft.name?.trim() &&
    Array.isArray(draft.mealSlots) &&
    draft.mealSlots.length > 0 &&
    (imageFile || (previewUrl && previewUrl.startsWith("data:")));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Cập nhật món ăn" : "Thêm món ăn"}
    >
      <MealForm
        draft={draft}
        setDraft={setDraft}
        errors={errors}
        setErrors={setErrors}
        imageFile={imageFile}
        setImageFile={setImageFile}
        previewUrl={previewUrl}
        setPreviewUrl={setPreviewUrl}
        initialTagObjs={initialTagObjs}
        isEdit={isEdit}
      />
      <div className="pt-4 mt-6">
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
            onClick={onClose}
          >
            Huỷ
          </button>
          <button
            className={`px-4 py-2 rounded-xl text-white ${canSubmit
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-slate-300 cursor-not-allowed"
              }`}
            onClick={handleSave}
            disabled={!canSubmit}
          >
            {isEdit ? "Lưu thay đổi" : "Thêm món"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
