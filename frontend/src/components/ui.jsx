import React, { useState, createContext, useContext, useCallback } from "react";
import { ShieldCheck, CheckCircle2, XCircle, X as XIcon } from "lucide-react";

// ---------- toast notifications ----------
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, tone = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-xs">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2 px-4 py-3 rounded-sm shadow-lg border animate-[fadeSlideIn_0.25s_ease-out] ${
              t.tone === "error" ? "bg-[#FBEAEA] border-red text-red" : "bg-[#EAF3EE] border-green text-green"
            }`}
          >
            {t.tone === "error" ? <XCircle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
            <p className="text-sm font-serif flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100">
              <XIcon size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.push;
}

// ---------- card & stat card ----------
export function Card({ children, className = "" }) {
  return (
    <div className={`bg-card border border-border rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "ink" }) {
  const tones = {
    ink: "text-ink bg-ink/5",
    gold: "text-gold bg-gold/10",
    green: "text-green bg-green/10",
    red: "text-red bg-red/10",
  };
  return (
    <div className="bg-card border border-border rounded-md p-4 flex items-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {Icon && (
        <div className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 ${tones[tone]}`}>
          <Icon size={18} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-mono uppercase tracking-widest text-muted truncate">{label}</p>
        <p className="font-serif text-xl text-text truncate">{value}</p>
      </div>
    </div>
  );
}

export const inputClass =
  "w-full px-3 py-2 bg-card border border-border rounded-sm text-text font-serif focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold placeholder:text-muted";

export function StampBadge({ children, tone = "ink" }) {
  const tones = {
    ink: "bg-ink text-paper",
    gold: "bg-gold text-[#241C10]",
    green: "bg-green text-paper",
    red: "bg-red text-paper",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-mono tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-mono uppercase tracking-widest text-textMuted mb-1">{label}</span>
      {children}
    </label>
  );
}

export function Btn({ children, onClick, variant = "primary", type = "button", disabled, className = "" }) {
  const variants = {
    primary: "bg-ink text-paper hover:bg-inkLight disabled:opacity-40",
    gold: "bg-gold text-[#241C10] hover:bg-goldLight disabled:opacity-40",
    green: "bg-green text-paper hover:opacity-90 disabled:opacity-40",
    red: "bg-red text-paper hover:opacity-90 disabled:opacity-40",
    ghost: "bg-transparent border border-border text-text hover:bg-[#EFE6D0] disabled:opacity-40",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-sm text-sm font-medium tracking-wide transition-all duration-150 active:scale-[0.97] hover:shadow-sm flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function PasswordConfirmModal({ title, description, onConfirm, onCancel, confirming, errorMessage }) {
  const [pw, setPw] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-[fadeSlideIn_0.15s_ease-out]">
      <div className="bg-card border-2 border-ink rounded-md max-w-sm w-full p-6 shadow-xl animate-[modalPop_0.2s_ease-out]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-sm bg-gold/15 flex items-center justify-center">
            <ShieldCheck size={18} className="text-gold" />
          </div>
          <h3 className="font-serif text-lg text-ink">{title}</h3>
        </div>
        <p className="text-sm text-textMuted mb-3 font-serif">{description || "Re-enter the branch password to authorize this entry."}</p>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onConfirm(pw)}
          className={inputClass}
          placeholder="Branch password"
        />
        {errorMessage && <p className="text-xs text-red mt-2 font-mono">{errorMessage}</p>}
        <div className="flex gap-2 mt-5">
          <Btn variant="ghost" onClick={onCancel} className="flex-1" disabled={confirming}>
            Cancel
          </Btn>
          <Btn variant="gold" className="flex-1" onClick={() => onConfirm(pw)} disabled={confirming}>
            {confirming ? "Checking…" : "Confirm"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

export function fmtDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtMoney(n) {
  const v = Number(n) || 0;
  return "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
