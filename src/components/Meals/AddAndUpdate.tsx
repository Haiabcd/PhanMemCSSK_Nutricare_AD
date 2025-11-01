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
import type { FoodCreationRequest, SuggestionAI } from "../../types/meals";
import {
  createMeal,
  updateMeal,
  suggestDescription,
} from "../../service/meals.service";
import { autocompleteIngredients } from "../../service/ingredients.service";

/* ======================= Helpers ======================= */

function vnSlotToBE(s: string): "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" {
  switch (s) {
    case "Bữa sáng":
      return "BREAKFAST";
    case "Bữa trưa":
      return "LUNCH";
    case "Bữa chiều":
      return "DINNER";
    default:
      return "SNACK";
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
      className={`px-3 py-1.5 rounded-full text-sm transition ${
        active
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
          className={`w-full h-11 ${
            leftIcon ? "pl-10" : "pl-3"
          } pr-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 ${
            hasError ? "focus:ring-rose-100" : "focus:ring-emerald-100"
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
        className={`w-full h-11 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 ${
          hasError ? "focus:ring-rose-100" : "focus:ring-emerald-100"
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

/** ImagePicker: trả về cả dataURL và File thật nếu có */
function ImagePicker(props: any) {
  const { value, onPicked, onPickedFile, onClear, inputId } = props;
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
  return (
    <div className="space-y-2">
      {value ? (
        <div className="space-y-2">
          <img
            src={value}
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
      {!value && (
        <div className="text-xs text-slate-500">
          Chọn ảnh từ máy của bạn (JPEG/PNG…)
        </div>
      )}
    </div>
  );
}

/* ======================= Modal & Layout ======================= */

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

/** Section tối giản: bỏ border khung để giao diện “nhẹ” hơn */
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
  const hasError = Boolean(error);
  return (
    <div className="relative">
      <input
        id={id}
        title={title || placeholder || "number"}
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? undefined : Number(v));
        }}
        placeholder={placeholder ?? ""}
        inputMode="decimal"
        type="number"
        aria-invalid={hasError}
        className={`w-full h-11 pr-12 pl-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 ${
          hasError ? "focus:ring-rose-100" : "focus:ring-emerald-100"
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

/* ======================= Validation ======================= */

const LABELS: Record<string, string> = {
  name: "Tên",
  servingSize: "Khẩu phần",
  servingUnit: "Đơn vị khẩu phần",
  unitWeightGram: "Trọng lượng 1 đơn vị",
  cookTimeMin: "Thời gian nấu",
  calories: "Calo",
  proteinG: "Protein",
  carbG: "Carb",
  fatG: "Fat",
  fiberG: "Fiber",
  sodiumMg: "Sodium",
  sugarMg: "Sugar",
  slots: "Bữa ăn",
};

const NUMERIC_KEYS = [
  "servingSize",
  "unitWeightGram",
  "cookTimeMin",
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

/* ======================= Ingredient Autocomplete ======================= */

function useElementRect(el: HTMLElement | null) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    if (!el) return;
    const update = () => setRect(el.getBoundingClientRect());
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [list, setList] = useState<IngredientResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [highlight, setHighlight] = useState<number>(-1);

  const rect = useElementRect(inputRef.current);

  useEffect(() => {
    if (!query.trim()) {
      setList([]);
      setOpen(false);
      setHighlight(-1);
      return;
    }
    let alive = true;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(undefined);
        const data = await autocompleteIngredients(query, 10, ctrl.signal);
        if (!alive) return;
        setList(data as unknown as IngredientResponse[]);
        setOpen(true);
        setHighlight((data as any[]).length ? 0 : -1);
      } catch (e) {
        if (!alive) return;
        setError((e as { message?: string })?.message || "Không thể tải gợi ý");
        setList([]);
        setOpen(false);
      } finally {
        if (alive) setLoading(false);
      }
    }, 180);
    return () => {
      alive = false;
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const onDocPointerDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      const insideInput = !!(
        inputRef.current &&
        target &&
        inputRef.current.contains(target)
      );
      const insideDropdown = !!(
        dropdownRef.current &&
        target &&
        dropdownRef.current.contains(target)
      );
      if (insideInput || insideDropdown) return;
      setOpen(false);
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
    }
  };

  const dropdownStyle = React.useMemo(() => {
    if (!rect) return undefined as React.CSSProperties | undefined;
    const estHeight = Math.min(288, Math.max(list.length, 1) * 48);
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < estHeight + 12;
    const top = showAbove ? rect.top - estHeight - 8 : rect.bottom + 4;
    return {
      top,
      left: rect.left,
      width: rect.width,
      maxHeight: 288,
    } as React.CSSProperties;
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

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

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
                className={`w-full text-left flex items-center gap-3 px-3 py-3 hover:bg-slate-50 ${
                  idx === highlight ? "bg-slate-50" : ""
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
                  <div className="truncate font-medium text-sm">
                    {(ing as any).name}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {(ing as any).aliases?.join(", ")}
                  </div>
                </div>
                <div className="ml-auto text-xs text-slate-500">
                  {(ing as any).unit}
                </div>
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

/* ======================= Form ======================= */
function MealForm(props: any) {
  const { draft, setDraft, errors, setErrors, setImageFile, imageFile } = props;
  const nameId = useId();
  const imgId = useId();
  const servingSizeId = useId();
  const servingUnitId = useId();
  const unitWeightId = useId();

  const [aiLoading, setAiLoading] = useState(false);

  const validateSelectRequired = (key: string, value?: string) => {
    setErrors((e: any) => ({
      ...e,
      [key]: isEmptyString(value) ? `Vui lòng chọn ${LABELS[key]}` : undefined,
    }));
  };
  const validateNumberRequired = (key: string, val?: number) => {
    setErrors((e: any) => ({
      ...e,
      [key]: val === undefined ? `Vui lòng nhập ${LABELS[key]}` : undefined,
    }));
  };

  useEffect(() => {
    const normalized: any = {};
    NUMERIC_KEYS.forEach((k) => {
      const mv = (draft as any)[k] as number | undefined;
      if (mv === undefined || (mv as any) === null) {
        normalized[k] = 0;
      }
    });
    if (Object.keys(normalized).length) setDraft({ ...draft, ...normalized });
    validateSelectRequired("servingUnit", draft.servingUnit);
    // Không validate required cho name/slots để không hiện text lỗi
    // (chỉ dùng dấu * và disable nút)
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
    const slots =
      draft.slots && draft.slots.length
        ? draft.slots.join(", ")
        : "các bữa ăn trong ngày";
    const ings = (draft.ingredients || [])
      .map((i: any) => `${i.name} ${i.quantity}${i.unit}`)
      .join(", ");
    const parts = [
      `${name} phù hợp cho: ${slots}.`,
      ings ? `Nguyên liệu dự kiến: ${ings}.` : undefined,
      `Thời gian nấu ~${draft.cookTimeMin || 0} phút.`,
      `Dinh dưỡng/khẩu phần: ${draft.calories || 0} kcal, ${
        draft.proteinG || 0
      }g protein, ${draft.carbG || 0}g carb, ${draft.fatG || 0}g fat, ${
        draft.fiberG || 0
      }g fiber, ${draft.sodiumMg || 0}mg sodium, ${
        draft.sugarMg || 0
      }mg sugar.`,
    ].filter(Boolean);
    return parts.join(" ");
  };

  const generateDescription = async () => {
    try {
      setAiLoading(true);

      let img: File | undefined = imageFile;
      const imgSrc = draft.image;
      if (!img && typeof imgSrc === "string" && imgSrc.startsWith("data:")) {
        img = dataURLtoFile(imgSrc);
      }

      const payload: SuggestionAI = {
        image: img,
        dishName: draft.name || "Món ăn",
        nutrition: {
          kcal: draft.calories ?? 0,
          proteinG: draft.proteinG ?? 0,
          carbG: draft.carbG ?? 0,
          fatG: draft.fatG ?? 0,
          fiberG: draft.fiberG ?? 0,
          sodiumMg: draft.sodiumMg ?? 0,
          sugarMg: draft.sugarMg ?? 0,
        },
      };

      const text = await suggestDescription(payload);
      setDraft({ ...draft, description: text });
    } catch (e) {
      const text = buildLocalDescription();
      setDraft({ ...draft, description: text });
      alert(
        (e as { message?: string })?.message ??
          "Không thể tạo mô tả, đã dùng gợi ý mặc định."
      );
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
                // xóa lỗi name (nếu là lỗi server cũ) khi user gõ lại
                setErrors((e: any) => ({ ...e, name: undefined }));
              }}
              placeholder="Ví dụ: Cơm tấm sườn"
              leftIcon={<Utensils size={16} />}
              // Chỉ hiển thị lỗi từ server (vd: Món ăn đã tồn tại)
              error={
                errors.name && !/Vui lòng nhập tên/i.test(errors.name)
                  ? errors.name
                  : undefined
              }
            />
          </div>
          <div className="xl:col-span-5 space-y-2">
            <Label htmlFor={imgId} hint="Tùy chọn">
              Ảnh
            </Label>
            <ImagePicker
              inputId={imgId}
              value={draft.image}
              onPicked={(dataUrl: string) =>
                setDraft({ ...draft, image: dataUrl })
              }
              onPickedFile={(f: File) => setImageFile(f)}
              onClear={() => {
                setDraft({ ...draft, image: "" });
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
            <Label htmlFor={servingSizeId}>Khẩu phần</Label>
            <NumberInput
              id={servingSizeId}
              title="Khẩu phần"
              value={draft.servingSize}
              onChange={(v: number | undefined) => {
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
              onChange={(v: string | undefined) => {
                setDraft({ ...draft, servingUnit: v });
                validateSelectRequired("servingUnit", v);
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
              error={errors.servingUnit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={unitWeightId}>Trọng lượng 1 đơn vị</Label>
            <NumberInput
              id={unitWeightId}
              title="Trọng lượng 1 đơn vị"
              value={draft.unitWeightGram}
              onChange={(v: number | undefined) => {
                setDraft({ ...draft, unitWeightGram: v });
                validateNumberRequired("unitWeightGram", v);
              }}
              placeholder="gram"
              suffix="g"
              error={errors.unitWeightGram}
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
              value={draft.cookTimeMin}
              onChange={(v: number | undefined) => {
                setDraft({ ...draft, cookTimeMin: v });
                validateNumberRequired("cookTimeMin", v);
              }}
              placeholder=""
              suffix="phút"
              error={errors.cookTimeMin}
            />
          </div>
          <div className="space-y-2">
            <Label>Calo</Label>
            <NumberInput
              value={draft.calories}
              onChange={(v: number | undefined) => {
                setDraft({ ...draft, calories: v });
                validateNumberRequired("calories", v);
              }}
              placeholder=""
              suffix="kcal"
              error={errors.calories}
            />
          </div>
          <div className="space-y-2">
            <Label>Protein</Label>
            <NumberInput
              value={draft.proteinG}
              onChange={(v: number | undefined) => {
                setDraft({ ...draft, proteinG: v });
                validateNumberRequired("proteinG", v);
              }}
              placeholder=""
              suffix="g"
              error={errors.proteinG}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          <div className="space-y-2">
            <Label>Carb</Label>
            <NumberInput
              value={draft.carbG}
              onChange={(v: number | undefined) => {
                setDraft({ ...draft, carbG: v });
                validateNumberRequired("carbG", v);
              }}
              suffix="g"
              error={errors.carbG}
            />
          </div>
          <div className="space-y-2">
            <Label>Fat</Label>
            <NumberInput
              value={draft.fatG}
              onChange={(v: number | undefined) => {
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
              onChange={(v: number | undefined) => {
                setDraft({ ...draft, fiberG: v });
                validateNumberRequired("fiberG", v);
              }}
              suffix="g"
              error={errors.fiberG}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <div className="space-y-2">
            <Label>Sodium</Label>
            <NumberInput
              value={draft.sodiumMg}
              onChange={(v: number | undefined) => {
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
              onChange={(v: number | undefined) => {
                setDraft({ ...draft, sugarMg: v });
                validateNumberRequired("sugarMg", v);
              }}
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
          {(["Bữa sáng", "Bữa trưa", "Bữa chiều", "Bữa phụ"] as string[]).map(
            (s) => (
              <PillToggle
                key={s}
                active={(draft.slots || []).includes(s)}
                onClick={() => {
                  const has = (draft.slots || []).includes(s);
                  const next = has
                    ? (draft.slots || []).filter((x: string) => x !== s)
                    : [...(draft.slots || []), s];
                  setDraft({ ...draft, slots: next });
                }}
              >
                {s}
              </PillToggle>
            )
          )}
        </div>
      </Section>

      {/* Mô tả */}
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
              onClick={async () => await generateDescription()}
              disabled={!draft.name?.trim() || aiLoading}
              className={`px-3 py-2 rounded-xl text-white ${
                !draft.name?.trim() || aiLoading
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

export default function AddAndUpdate(props: any) {
  const { open, isEdit, draft, setDraft, onClose, onSave } = props;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);

  // Reset lỗi mỗi khi modal mở
  useEffect(() => {
    if (open) setErrors({});
  }, [open]);

  const buildFoodCreationRequest = (): FoodCreationRequest => {
    // chuẩn hóa file ảnh
    let file: File | undefined = imageFile;
    if (
      !file &&
      typeof draft.image === "string" &&
      draft.image.startsWith("data:")
    ) {
      file = dataURLtoFile(draft.image);
    }

    const mealSlotsFlat = (draft.slots || [])
      .map((s: string) => vnSlotToBE(s))
      .filter(Boolean) as FoodCreationRequest["mealSlots"];

    return {
      name: draft.name,
      description: draft.description || "",
      defaultServing: draft.servingSize ?? 1,
      servingName: draft.servingUnit ?? "phần",
      servingGram: draft.unitWeightGram ?? 0,
      cookMinutes: draft.cookTimeMin ?? 0,
      nutrition: {
        kcal: draft.calories ?? 0,
        proteinG: draft.proteinG ?? 0,
        carbG: draft.carbG ?? 0,
        fatG: draft.fatG ?? 0,
        fiberG: draft.fiberG ?? 0,
        sodiumMg: draft.sodiumMg ?? 0,
        sugarMg: draft.sugarMg ?? 0,
      },
      mealSlots: mealSlotsFlat, // đảm bảo là mảng phẳng
      tags: [],
      image: file as File, // nếu không có file có thể bỏ append trong service
      ingredients: (draft.ingredients || []).map((i: any) => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
      })),
    };
  };

  const handleSave = async () => {
    // Bỏ text lỗi required: chỉ chặn submit
    if (!draft.name?.trim()) return;
    const hasSlots = Array.isArray(draft.slots) && draft.slots.length > 0;
    if (!hasSlots) return;

    try {
      if (isEdit && draft.id) {
        await updateMeal(draft.id, draft);
        onSave?.({ ...draft });
        onClose();
      } else {
        const req = buildFoodCreationRequest();
        const created = await createMeal(req);
        onSave?.(created);
        onClose();
      }
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (/409/.test(msg) || /đã tồn tại/i.test(msg)) {
        setErrors((prev) => ({ ...prev, name: "Món ăn đã tồn tại" }));
        return;
      }
      setErrors((prev) => ({
        ...prev,
        name: msg || (isEdit ? "Cập nhật món thất bại" : "Tạo món thất bại"),
      }));
    }
  };

  const hasName = !!draft.name?.trim();
  const hasSlots = Array.isArray(draft.slots) && draft.slots.length > 0;
  const canSubmit = hasName && hasSlots;

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
        setImageFile={setImageFile}
        imageFile={imageFile}
      />
      <div className="sticky bottom-0 pt-4 mt-6">
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
            onClick={onClose}
          >
            Huỷ
          </button>
          <button
            className={`px-4 py-2 rounded-xl text-white ${
              canSubmit
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
