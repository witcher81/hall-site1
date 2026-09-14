/** רכיב העלאת קבצים בעברית — מחליף את Choose File המובנה */

type Props = {
  id: string;
  name?: string;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
  onChange?: (files: FileList | null) => void;
  /** טקסט הכפתור */
  buttonLabel?: string;
  /** שורת עזרה מתחת */
  helperText?: string;
  className?: string;
};

export default function HebrewFileInput({
  id,
  name,
  accept,
  multiple,
  required,
  disabled,
  onChange,
  buttonLabel = multiple ? "בחירת קבצים" : "בחירת קובץ",
  helperText,
  className = "",
}: Props) {
  return (
    <div className={`text-right ${className}`}>
      <label
        htmlFor={id}
        className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-full border border-emerald-950/25 bg-white px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:border-amber-400/70 hover:bg-amber-50/50 ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {buttonLabel}
      </label>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        required={required}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => onChange?.(e.target.files)}
      />
      {helperText ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
