import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Landmark, Building2, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { Btn, Field, inputClass } from "../components/ui";
import { authApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [mode, setMode] = useState("select"); // select | central | branch
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submitCentral() {
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.centralLogin(loginId, password);
      login(data.token, { role: "CENTRAL", loginId: data.loginId });
      navigate("/central");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submitBranch() {
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.branchLogin(loginId, password);
      login(data.token, { role: "BRANCH", branch: data.branch });
      navigate("/branch");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMode("select");
    setError("");
    setLoginId("");
    setPassword("");
  }

  return (
    <div className="min-h-screen bg-paper flex items-stretch">
      {/* Left branding panel — hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-ink items-center justify-center p-12">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #F6F1E4 1.5px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-gold/10 blur-3xl" />

        <div className="relative max-w-sm text-paper">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-md bg-gold/15 border border-gold/30 mb-6">
            <BookOpen size={26} className="text-gold" />
          </div>
          <h1 className="font-serif text-4xl leading-tight mb-4">Sadhan Passbook</h1>
          <p className="text-paper/70 font-serif text-base leading-relaxed">
            A single, honest register for every branch — every deposit and withdrawal
            recorded, signed, and reconciled centrally.
          </p>
          <div className="mt-10 flex flex-col gap-3 text-sm font-mono text-paper/60">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" /> Branch-isolated access
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" /> Password-verified entries
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" /> Date-wise Excel export
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center gap-2 mb-2">
              <BookOpen size={26} className="text-ink" />
              <h1 className="font-serif text-2xl text-ink tracking-tight">Sadhan Passbook</h1>
            </div>
            <p className="text-textMuted text-sm font-mono">Branch &amp; Central Ledger Register</p>
          </div>

          <div className="bg-card border border-border rounded-md shadow-sm p-7 transition-all duration-200">
            {mode === "select" && (
              <div className="animate-[fadeSlideIn_0.2s_ease-out]">
                <h2 className="font-serif text-xl text-ink mb-1">Welcome back</h2>
                <p className="text-sm text-muted font-serif mb-6">Choose how you'd like to sign in.</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setMode("central")}
                    className="group flex items-center justify-between gap-3 w-full py-3.5 px-4 rounded-sm bg-ink text-paper hover:bg-inkLight transition-all duration-150 active:scale-[0.98]"
                  >
                    <span className="flex items-center gap-3">
                      <Landmark size={18} />
                      <span className="text-left">
                        <span className="block font-medium text-sm">Central Office</span>
                        <span className="block text-xs text-paper/60 font-mono">Manage all branches</span>
                      </span>
                    </span>
                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button
                    onClick={() => setMode("branch")}
                    className="group flex items-center justify-between gap-3 w-full py-3.5 px-4 rounded-sm bg-gold text-[#241C10] hover:bg-goldLight transition-all duration-150 active:scale-[0.98]"
                  >
                    <span className="flex items-center gap-3">
                      <Building2 size={18} />
                      <span className="text-left">
                        <span className="block font-medium text-sm">Branch Login</span>
                        <span className="block text-xs text-[#241C10]/60 font-mono">Enrol students &amp; record entries</span>
                      </span>
                    </span>
                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            )}

            {mode !== "select" && (
              <div className="animate-[fadeSlideIn_0.2s_ease-out]">
                <div className="flex items-center gap-2 mb-5">
                  <div className={`w-9 h-9 rounded-sm flex items-center justify-center ${mode === "central" ? "bg-ink/10" : "bg-gold/15"}`}>
                    {mode === "central" ? <Landmark size={17} className="text-ink" /> : <Building2 size={17} className="text-gold" />}
                  </div>
                  <h2 className="font-serif text-lg text-ink">{mode === "central" ? "Central Office" : "Branch Login"}</h2>
                </div>
                <Field label={mode === "central" ? "Central Login ID" : "Branch Login ID"}>
                  <input
                    className={inputClass}
                    value={loginId}
                    autoFocus
                    onChange={(e) => {
                      setLoginId(e.target.value);
                      setError("");
                    }}
                  />
                </Field>
                <Field label="Password">
                  <input
                    type="password"
                    className={inputClass}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (mode === "central" ? submitCentral() : submitBranch())}
                  />
                </Field>
                {error && (
                  <p className="text-xs text-red font-mono mb-2 bg-red/5 border border-red/20 rounded-sm px-2 py-1.5">{error}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <Btn variant="ghost" className="flex-1" onClick={reset}>
                    <ArrowLeft size={14} /> Back
                  </Btn>
                  <Btn
                    variant={mode === "central" ? "primary" : "gold"}
                    className="flex-1"
                    onClick={mode === "central" ? submitCentral : submitBranch}
                    disabled={loading}
                  >
                    <Lock size={14} /> {loading ? "Signing in…" : "Sign In"}
                  </Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
