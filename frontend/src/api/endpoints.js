import client from "./client";

export const authApi = {
  centralLogin: (loginId, password) => client.post("/auth/central/login", { loginId, password }),
  branchLogin: (loginId, password) => client.post("/auth/branch/login", { loginId, password }),
  verifyBranchPassword: (password) => client.post("/auth/branch/verify-password", { password }),
};

export const branchApi = {
  create: (data) => client.post("/branches", data),
  list: () => client.get("/branches"),
  remove: (id) => client.delete(`/branches/${id}`),
};

export const studentApi = {
  add: (data) => client.post("/students", data),
  list: () => client.get("/students"),
  search: (q) => client.get("/students/search", { params: { q } }),
};

export const transactionApi = {
  add: (data) => client.post("/transactions", data),
  list: (date) => client.get("/transactions", { params: date ? { date } : {} }),
};

export const ledgerApi = {
  central: (params) => client.get("/ledger", { params }),
};

export const exportApi = {
  // These return a Blob; the caller triggers a browser download from it.
  mine: () => client.get("/export/mine", { responseType: "blob" }),
  central: () => client.get("/export/central", { responseType: "blob" }),
  branch: (branchId) => client.get(`/export/branch/${branchId}`, { responseType: "blob" }),
};

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
