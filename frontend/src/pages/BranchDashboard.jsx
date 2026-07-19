import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Search, ArrowDownCircle, ArrowUpCircle, Download, LogOut, BookOpen, X, Users, Wallet } from "lucide-react";
import { Btn, Field, inputClass, StampBadge, PasswordConfirmModal, fmtDate, fmtMoney, StatCard, useToast } from "../components/ui";
import { studentApi, transactionApi, exportApi, downloadBlob } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function BranchDashboard() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const branch = session?.branch;

  const [tab, setTab] = useState("add");
  const [studentCount, setStudentCount] = useState(0);

  const [studentForm, setStudentForm] = useState({ name: "", dob: "", fatherName: "", accNo: "", pollNo: "" });
  const [addErr, setAddErr] = useState("");
  const [addOk, setAddOk] = useState("");
  const [saving, setSaving] = useState(false);

  const [searchAcc, setSearchAcc] = useState("");
  const [foundStudent, setFoundStudent] = useState(null);
  const [searchErr, setSearchErr] = useState("");
  const [txType, setTxType] = useState("CREDIT");
  const [txAmount, setTxAmount] = useState("");
  const [txDate, setTxDate] = useState(todayStr());
  const [pendingTx, setPendingTx] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmErr, setConfirmErr] = useState("");

  const [ledgerRows, setLedgerRows] = useState([]);
  const [ledgerNet, setLedgerNet] = useState(0);
  const [ledgerFilterDate, setLedgerFilterDate] = useState("");

  const refreshStudentCount = useCallback(async () => {
    const { data } = await studentApi.list();
    setStudentCount(data.length);
  }, []);

  const loadLedger = useCallback(async () => {
    const { data } = await transactionApi.list(ledgerFilterDate || undefined);
    setLedgerRows(data.transactions);
    setLedgerNet(data.net);
  }, [ledgerFilterDate]);

  useEffect(() => {
    refreshStudentCount();
  }, [refreshStudentCount]);

  useEffect(() => {
    if (tab === "ledger") loadLedger();
  }, [tab, loadLedger]);

  async function saveStudent() {
    setAddErr("");
    setAddOk("");
    const { name, dob, fatherName, accNo, pollNo } = studentForm;
    if (!name.trim() || !dob.trim() || !fatherName.trim() || !accNo.trim() || !pollNo.trim()) {
      setAddErr("All fields are required.");
      return;
    }
    setSaving(true);
    try {
      await studentApi.add({ name: name.trim(), dob, fatherName: fatherName.trim(), accNo: accNo.trim(), pollNo: pollNo.trim() });
      setStudentForm({ name: "", dob: "", fatherName: "", accNo: "", pollNo: "" });
      setAddOk("Student added.");
      refreshStudentCount();
      toast(`${name.trim()} enrolled successfully.`, "success");
    } catch (err) {
      setAddErr(err.response?.data?.error || "Could not save student.");
    } finally {
      setSaving(false);
    }
  }

  async function doSearch() {
    setSearchErr("");
    setFoundStudent(null);
    try {
      const { data } = await studentApi.search(searchAcc.trim());
      setFoundStudent(data);
    } catch (err) {
      setSearchErr(err.response?.data?.error || "No student found with this account number.");
    }
  }

  function requestTransaction() {
    if (!foundStudent) return;
    const amt = parseFloat(txAmount);
    if (!amt || amt <= 0) {
      setSearchErr("Enter a valid amount.");
      return;
    }
    setSearchErr("");
    setConfirmErr("");
    setPendingTx({ accNo: foundStudent.accNo, type: txType, amount: amt, date: txDate });
  }

  async function confirmTransaction(password) {
    setConfirming(true);
    setConfirmErr("");
    try {
      await transactionApi.add({ ...pendingTx, password });
      setPendingTx(null);
      setTxAmount("");
      toast(`${pendingTx.type === "CREDIT" ? "Credit" : "Debit"} of ${fmtMoney(pendingTx.amount)} recorded.`, "success");
      if (tab === "ledger") loadLedger();
    } catch (err) {
      setConfirmErr(err.response?.data?.error || "Could not save entry.");
    } finally {
      setConfirming(false);
    }
  }

  async function exportOwn() {
    const { data } = await exportApi.mine();
    downloadBlob(data, `${branch.loginId}-ledger-${todayStr()}.xlsx`);
    toast("Ledger exported to Excel.", "success");
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  if (!branch) return null;

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink text-paper px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={20} />
          <span className="font-serif text-lg">{branch.name}</span>
          <span className="text-xs font-mono text-border">({branch.loginId})</span>
        </div>
        <Btn variant="ghost" onClick={handleLogout} className="!border-paper/40 !text-paper hover:!bg-white/10">
          <LogOut size={14} /> Logout
        </Btn>
      </header>

      <nav className="bg-[#EFE6D0] border-b border-border px-6 flex gap-1">
        {[
          { id: "add", label: "Add Student", icon: Plus },
          { id: "tx", label: "Credit / Debit", icon: Search },
          { id: "ledger", label: "Ledger", icon: BookOpen },
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

      <main className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard label="Students Enrolled" value={studentCount} icon={Users} tone="gold" />
          <StatCard label="Signed in as" value={branch.name} icon={Wallet} tone="ink" />
        </div>

        {tab === "add" && (
          <div className="bg-card border border-border rounded-md p-5 shadow-sm hover:shadow-md transition-shadow duration-200 max-w-lg animate-[fadeSlideIn_0.2s_ease-out]">
            <h3 className="font-serif text-lg text-ink mb-4">Enrol a Student</h3>
            <Field label="Full Name">
              <input className={inputClass} value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} />
            </Field>
            <Field label="Date of Birth">
              <input type="date" className={inputClass} value={studentForm.dob} onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })} />
            </Field>
            <Field label="Father's Name">
              <input className={inputClass} value={studentForm.fatherName} onChange={(e) => setStudentForm({ ...studentForm, fatherName: e.target.value })} />
            </Field>
            <Field label="Account Number">
              <input className={inputClass} value={studentForm.accNo} onChange={(e) => setStudentForm({ ...studentForm, accNo: e.target.value })} placeholder="Unique per branch" />
            </Field>
            <Field label="Poll No">
              <input className={inputClass} value={studentForm.pollNo} onChange={(e) => setStudentForm({ ...studentForm, pollNo: e.target.value })} />
            </Field>
            {addErr && <p className="text-xs text-red font-mono mb-2">{addErr}</p>}
            {addOk && <p className="text-xs text-green font-mono mb-2">{addOk}</p>}
            <Btn variant="gold" onClick={saveStudent} disabled={saving} className="w-full mt-1">
              <Plus size={15} /> {saving ? "Saving…" : "Save Student"}
            </Btn>
            <p className="text-xs text-muted font-mono mt-3">{studentCount} students enrolled in this branch.</p>
          </div>
        )}

        {tab === "tx" && (
          <div className="bg-card border border-border rounded-md p-5 shadow-sm hover:shadow-md transition-shadow duration-200 max-w-lg">
            <h3 className="font-serif text-lg text-ink mb-1">Find Student &amp; Record Entry</h3>
            <p className="text-xs text-muted font-mono mb-4">Search by account number or poll number</p>
            <div className="flex gap-2 mb-4">
              <input
                className={inputClass}
                placeholder="Account no. or poll no."
                value={searchAcc}
                onChange={(e) => setSearchAcc(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
              />
              <Btn variant="primary" onClick={doSearch}>
                <Search size={15} />
              </Btn>
            </div>
            {searchErr && <p className="text-xs text-red font-mono mb-3">{searchErr}</p>}

            {foundStudent && (
              <div className="bg-paper border border-borderLight rounded-sm p-4 mb-4">
                <p className="font-serif text-text text-lg">{foundStudent.name}</p>
                <p className="text-xs font-mono text-muted mt-1">
                  Acc No: {foundStudent.accNo} · DOB: {fmtDate(foundStudent.dob)} · Father: {foundStudent.fatherName} · Poll No: {foundStudent.pollNo}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Field label="Type">
                    <select className={inputClass} value={txType} onChange={(e) => setTxType(e.target.value)}>
                      <option value="CREDIT">Credit (deposit)</option>
                      <option value="DEBIT">Debit (withdraw)</option>
                    </select>
                  </Field>
                  <Field label="Date">
                    <input type="date" className={inputClass} value={txDate} onChange={(e) => setTxDate(e.target.value)} />
                  </Field>
                </div>
                <Field label="Amount (₹)">
                  <input type="number" min="0" step="0.01" className={inputClass} value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="e.g. 5" />
                </Field>
                <Btn variant={txType === "CREDIT" ? "green" : "red"} onClick={requestTransaction} className="w-full mt-1">
                  {txType === "CREDIT" ? <ArrowDownCircle size={15} /> : <ArrowUpCircle size={15} />}
                  Record {txType === "CREDIT" ? "Credit" : "Debit"}
                </Btn>
              </div>
            )}
          </div>
        )}

        {tab === "ledger" && (
          <div className="bg-card border border-border rounded-md p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <Field label="Filter by Date">
                <input type="date" className={inputClass} value={ledgerFilterDate} onChange={(e) => setLedgerFilterDate(e.target.value)} />
              </Field>
              {ledgerFilterDate && (
                <Btn variant="ghost" onClick={() => setLedgerFilterDate("")}>
                  <X size={14} /> Clear
                </Btn>
              )}
              <div className="ml-auto">
                <Btn variant="primary" onClick={exportOwn}>
                  <Download size={15} /> Export Branch Excel
                </Btn>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <StampBadge tone="ink">{ledgerRows.length} entries</StampBadge>
              <StampBadge tone={ledgerNet >= 0 ? "green" : "red"}>Net: {fmtMoney(ledgerNet)}</StampBadge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-ink text-left font-mono uppercase text-xs text-textMuted">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Acc No</th>
                    <th className="py-2 pr-3">Student</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerRows.map((t) => (
                    <tr key={t.id} className="border-b border-borderLight hover:bg-paper/70 transition-colors">
                      <td className="py-2 pr-3 font-mono text-textMuted">{fmtDate(t.date)}</td>
                      <td className="py-2 pr-3 font-mono">{t.student.accNo}</td>
                      <td className="py-2 pr-3">{t.student.name}</td>
                      <td className="py-2 pr-3">
                        <StampBadge tone={t.type === "CREDIT" ? "green" : "red"}>{t.type === "CREDIT" ? "Credit" : "Debit"}</StampBadge>
                      </td>
                      <td className="py-2 pr-3 text-right font-mono">{fmtMoney(t.amount)}</td>
                    </tr>
                  ))}
                  {ledgerRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted font-serif">
                        No entries yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {pendingTx && (
        <PasswordConfirmModal
          title={`Confirm ${pendingTx.type === "CREDIT" ? "Credit" : "Debit"} of ${fmtMoney(pendingTx.amount)}`}
          confirming={confirming}
          errorMessage={confirmErr}
          onConfirm={confirmTransaction}
          onCancel={() => {
            setPendingTx(null);
            setConfirmErr("");
          }}
        />
      )}
    </div>
  );
}
