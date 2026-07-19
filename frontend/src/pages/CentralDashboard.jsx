import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, Building2, BookOpen, Plus, Users, Download, Trash2, LogOut, X, Wallet, Layers, KeyRound } from "lucide-react";
import { Btn, Field, inputClass, StampBadge, fmtDate, fmtMoney, Card, StatCard, useToast } from "../components/ui";
import { branchApi, ledgerApi, exportApi, authApi, downloadBlob } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";

export default function CentralDashboard() {
  const [tab, setTab] = useState("branches");
  const [branches, setBranches] = useState([]);
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [newPw, setNewPw] = useState("");
  const [formErr, setFormErr] = useState("");
  const [creating, setCreating] = useState(false);

  const [rows, setRows] = useState([]);
  const [net, setNet] = useState(0);
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [loadingLedger, setLoadingLedger] = useState(false);

  const [showChangePw, setShowChangePw] = useState(false);
  const [curPw, setCurPw] = useState("");
  const [newCentralPw, setNewCentralPw] = useState("");
  const [changePwErr, setChangePwErr] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const [resetBranchTarget, setResetBranchTarget] = useState(null); // { id, name }
  const [resetPwValue, setResetPwValue] = useState("");
  const [resetPwErr, setResetPwErr] = useState("");
  const [resettingPw, setResettingPw] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const loadBranches = useCallback(async () => {
    const { data } = await branchApi.list();
    setBranches(data);
  }, []);

  const loadLedger = useCallback(async () => {
    setLoadingLedger(true);
    try {
      const params = {};
      if (filterBranch !== "all") params.branchId = filterBranch;
      if (filterDate) params.date = filterDate;
      const { data } = await ledgerApi.central(params);
      setRows(data.transactions);
      setNet(data.net);
    } finally {
      setLoadingLedger(false);
    }
  }, [filterBranch, filterDate]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    if (tab === "ledger") loadLedger();
  }, [tab, loadLedger]);

  async function addBranch() {
    setFormErr("");
    if (!newName.trim() || !newId.trim() || !newPw.trim()) {
      setFormErr("All fields are required.");
      return;
    }
    setCreating(true);
    try {
      await branchApi.create({ name: newName.trim(), loginId: newId.trim().toLowerCase(), password: newPw });
      setNewName("");
      setNewId("");
      setNewPw("");
      await loadBranches();
      toast(`Branch "${newName.trim()}" created.`, "success");
    } catch (err) {
      setFormErr(err.response?.data?.error || "Could not create branch.");
    } finally {
      setCreating(false);
    }
  }

  async function removeBranch(id) {
    if (!window.confirm("Remove this branch? Its students and transactions will be deleted too.")) return;
    await branchApi.remove(id);
    await loadBranches();
    toast("Branch removed.", "success");
  }

  async function exportCentral() {
    const { data } = await exportApi.central();
    downloadBlob(data, `central-ledger-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast("Central Excel downloaded.", "success");
  }

  async function exportBranch(id, loginId) {
    const { data } = await exportApi.branch(id);
    downloadBlob(data, `${loginId}-ledger-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast("Branch Excel downloaded.", "success");
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  async function submitChangePassword() {
    setChangePwErr("");
    if (!curPw || !newCentralPw) {
      setChangePwErr("Both fields are required.");
      return;
    }
    setChangingPw(true);
    try {
      await authApi.changeCentralPassword(curPw, newCentralPw);
      toast("Central password updated.", "success");
      setShowChangePw(false);
      setCurPw("");
      setNewCentralPw("");
    } catch (err) {
      setChangePwErr(err.response?.data?.error || "Could not change password.");
    } finally {
      setChangingPw(false);
    }
  }

  async function submitResetBranchPassword() {
    setResetPwErr("");
    if (!resetPwValue || resetPwValue.length < 6) {
      setResetPwErr("Password must be at least 6 characters.");
      return;
    }
    setResettingPw(true);
    try {
      await branchApi.resetPassword(resetBranchTarget.id, resetPwValue);
      toast(`Password reset for "${resetBranchTarget.name}".`, "success");
      setResetBranchTarget(null);
      setResetPwValue("");
    } catch (err) {
      setResetPwErr(err.response?.data?.error || "Could not reset password.");
    } finally {
      setResettingPw(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink text-paper px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark size={20} />
          <span className="font-serif text-lg">Central Office</span>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="ghost" onClick={() => setShowChangePw(true)} className="!border-paper/40 !text-paper hover:!bg-white/10">
            <KeyRound size={14} /> Change Password
          </Btn>
          <Btn variant="ghost" onClick={handleLogout} className="!border-paper/40 !text-paper hover:!bg-white/10">
            <LogOut size={14} /> Logout
          </Btn>
        </div>
      </header>

      <nav className="bg-[#EFE6D0] border-b border-border px-6 flex gap-1">
        {[
          { id: "branches", label: "Branches", icon: Building2 },
          { id: "ledger", label: "All Data", icon: BookOpen },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-all duration-200 ${
              tab === t.id ? "border-gold text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </nav>

      <main className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Branches" value={branches.length} icon={Building2} tone="ink" />
          <StatCard label="Students" value={branches.reduce((s, b) => s + (b._count?.students ?? 0), 0)} icon={Users} tone="gold" />
          <StatCard label="Total Entries" value={branches.reduce((s, b) => s + (b._count?.transactions ?? 0), 0)} icon={Layers} tone="green" />
          <StatCard label="View" value={tab === "branches" ? "Branches" : "All Data"} icon={Wallet} tone="red" />
        </div>

        {tab === "branches" && (
          <div className="grid md:grid-cols-2 gap-6 animate-[fadeSlideIn_0.2s_ease-out]">
            <div className="bg-card border border-border rounded-md p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="font-serif text-lg text-ink mb-4 flex items-center gap-2">
                <Plus size={18} /> Add New Branch
              </h3>
              <Field label="Branch Name">
                <input className={inputClass} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Sector 14 Branch" />
              </Field>
              <Field label="Branch ID (login username)">
                <input className={inputClass} value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="lowercase-with-hyphens" />
              </Field>
              <Field label="Branch Password">
                <input className={inputClass} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 6 characters" />
              </Field>
              {formErr && <p className="text-xs text-red font-mono mb-2">{formErr}</p>}
              <Btn variant="gold" onClick={addBranch} disabled={creating} className="w-full mt-2">
                <Plus size={15} /> {creating ? "Creating…" : "Create Branch"}
              </Btn>
            </div>

            <div className="bg-card border border-border rounded-md p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="font-serif text-lg text-ink mb-4 flex items-center gap-2">
                <Users size={18} /> Existing Branches ({branches.length})
              </h3>
              {branches.length === 0 && <p className="text-sm text-muted font-serif">No branches yet.</p>}
              <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                {branches.map((b) => (
                  <div key={b.id} className="flex items-center justify-between bg-paper border border-borderLight rounded-sm px-3 py-2 hover:border-gold/50 transition-colors">
                    <div>
                      <p className="font-serif text-text">{b.name}</p>
                      <p className="text-xs font-mono text-muted">
                        id: {b.loginId} · {b._count?.students ?? 0} students · {b._count?.transactions ?? 0} entries
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setResetBranchTarget({ id: b.id, name: b.name })}
                        title="Reset branch password"
                        className="p-2 rounded-sm hover:bg-[#EFE6D0] text-gold"
                      >
                        <KeyRound size={16} />
                      </button>
                      <button onClick={() => exportBranch(b.id, b.loginId)} title="Download branch Excel" className="p-2 rounded-sm hover:bg-[#EFE6D0] text-ink">
                        <Download size={16} />
                      </button>
                      <button onClick={() => removeBranch(b.id)} title="Remove branch" className="p-2 rounded-sm hover:bg-[#EFE6D0] text-red">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "ledger" && (
          <div className="bg-card border border-border rounded-md p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <Field label="Branch">
                <select className={inputClass} value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
                  <option value="all">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Date">
                <input type="date" className={inputClass} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
              </Field>
              {filterDate && (
                <Btn variant="ghost" onClick={() => setFilterDate("")}>
                  <X size={14} /> Clear date
                </Btn>
              )}
              <div className="ml-auto flex gap-2">
                <Btn variant="primary" onClick={exportCentral}>
                  <Download size={15} /> Export Central Excel (all branches)
                </Btn>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <StampBadge tone="ink">{rows.length} entries</StampBadge>
              <StampBadge tone={net >= 0 ? "green" : "red"}>Net: {fmtMoney(net)}</StampBadge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-ink text-left font-mono uppercase text-xs text-textMuted">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Branch</th>
                    <th className="py-2 pr-3">Acc No</th>
                    <th className="py-2 pr-3">Student</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-borderLight hover:bg-paper/70 transition-colors">
                      <td className="py-2 pr-3 font-mono text-textMuted">{fmtDate(r.date)}</td>
                      <td className="py-2 pr-3">{r.branch.name}</td>
                      <td className="py-2 pr-3 font-mono">{r.student.accNo}</td>
                      <td className="py-2 pr-3">{r.student.name}</td>
                      <td className="py-2 pr-3">
                        <StampBadge tone={r.type === "CREDIT" ? "green" : "red"}>{r.type === "CREDIT" ? "Credit" : "Debit"}</StampBadge>
                      </td>
                      <td className="py-2 pr-3 text-right font-mono">{fmtMoney(r.amount)}</td>
                    </tr>
                  ))}
                  {!loadingLedger && rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted font-serif">
                        No entries match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showChangePw && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-[fadeSlideIn_0.15s_ease-out]">
          <div className="bg-card border-2 border-ink rounded-md max-w-sm w-full p-6 shadow-xl animate-[modalPop_0.2s_ease-out]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-sm bg-ink/10 flex items-center justify-center">
                <KeyRound size={18} className="text-ink" />
              </div>
              <h3 className="font-serif text-lg text-ink">Change Central Password</h3>
            </div>
            <Field label="Current Password">
              <input
                type="password"
                autoFocus
                className={inputClass}
                value={curPw}
                onChange={(e) => {
                  setCurPw(e.target.value);
                  setChangePwErr("");
                }}
              />
            </Field>
            <Field label="New Password">
              <input
                type="password"
                className={inputClass}
                value={newCentralPw}
                onChange={(e) => {
                  setNewCentralPw(e.target.value);
                  setChangePwErr("");
                }}
                onKeyDown={(e) => e.key === "Enter" && submitChangePassword()}
              />
            </Field>
            {changePwErr && <p className="text-xs text-red font-mono mb-2">{changePwErr}</p>}
            <div className="flex gap-2 mt-3">
              <Btn
                variant="ghost"
                className="flex-1"
                disabled={changingPw}
                onClick={() => {
                  setShowChangePw(false);
                  setCurPw("");
                  setNewCentralPw("");
                  setChangePwErr("");
                }}
              >
                Cancel
              </Btn>
              <Btn variant="primary" className="flex-1" onClick={submitChangePassword} disabled={changingPw}>
                {changingPw ? "Saving…" : "Update Password"}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {resetBranchTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-[fadeSlideIn_0.15s_ease-out]">
          <div className="bg-card border-2 border-gold rounded-md max-w-sm w-full p-6 shadow-xl animate-[modalPop_0.2s_ease-out]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-sm bg-gold/15 flex items-center justify-center">
                <KeyRound size={18} className="text-gold" />
              </div>
              <h3 className="font-serif text-lg text-ink">Reset Password — {resetBranchTarget.name}</h3>
            </div>
            <p className="text-sm text-textMuted font-serif mb-3">
              This immediately replaces the branch's password. Share the new one with the branch head securely.
            </p>
            <Field label="New Branch Password">
              <input
                type="text"
                autoFocus
                className={inputClass}
                value={resetPwValue}
                onChange={(e) => {
                  setResetPwValue(e.target.value);
                  setResetPwErr("");
                }}
                onKeyDown={(e) => e.key === "Enter" && submitResetBranchPassword()}
                placeholder="At least 6 characters"
              />
            </Field>
            {resetPwErr && <p className="text-xs text-red font-mono mb-2">{resetPwErr}</p>}
            <div className="flex gap-2 mt-3">
              <Btn
                variant="ghost"
                className="flex-1"
                disabled={resettingPw}
                onClick={() => {
                  setResetBranchTarget(null);
                  setResetPwValue("");
                  setResetPwErr("");
                }}
              >
                Cancel
              </Btn>
              <Btn variant="gold" className="flex-1" onClick={submitResetBranchPassword} disabled={resettingPw}>
                {resettingPw ? "Saving…" : "Reset Password"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
