export function Field({ label, children, error = "" }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {error && <span className="block text-xs font-semibold text-rose-600">{error}</span>}
    </label>
  );
}

export function TextInput({ value, onChange, placeholder, type = "text", disabled = false, min }) {
  return (
    <input
      type={type}
      lang="vi"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
    />
  );
}

export function SelectInput({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
    >
      {children}
    </select>
  );
}
