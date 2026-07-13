export type Trip = {
  id: number;
  name: string;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  member_count: number;
  expense_total: number;
  cover?: string | null;
};
export type Member = {
  id: number;
  name: string;
  color: string;
  user_id?: number | null;
};
export type Category = {
  id: number;
  name: string;
  color: string;
  icon: string;
};
export type Expense = {
  id: number;
  title: string;
  amount: number;
  date: string;
  paid_by: number;
  paid_by_name: string;
  category_id: number;
  category_name: string;
  category_color: string;
  participant_ids: number[];
  paid_from_fund?: number;
};
export type Contribution = {
  id: number;
  member_id: number;
  member_name: string;
  member_color: string;
  amount: number;
  date: string;
  note: string | null;
};
export type Dashboard = {
  total: number;
  expense_count: number;
  byCategory: { name: string; color: string; amount: number }[];
  byMember: {
    name: string;
    color: string;
    paid: number;
    share: number;
    balance: number;
  }[];
  settlements: { from: string; to: string; amount: number }[];
  fundTotal: number;
  fundSpent: number;
};
const call = async <T>(path: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  const isForm = options.body instanceof FormData;
  const res = await fetch("/api" + path, {
    ...options,
    headers: {
      ...(!isForm ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({ error: `Ошибка сервера (${res.status})` }));
    throw new Error(body.error);
  }
  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return undefined as T;
  return res.json() as Promise<T>;
};
export const api = {
  auth: (mode: "login" | "register", body: unknown) =>
    call<{ token: string; user: { name: string; email: string } }>(
      `/auth/${mode}`,
      { method: "POST", body: JSON.stringify(body) },
    ),
  trips: () => call<Trip[]>("/trips"),
  createTrip: (body: unknown) =>
    call<Trip>("/trips", { method: "POST", body: JSON.stringify(body) }),
  trip: (id: string) =>
    call<{
      trip: Trip;
      members: Member[];
      categories: Category[];
      expenses: Expense[];
      dashboard: Dashboard;
      contributions: Contribution[];
      can_delete: boolean;
    }>(`/trips/${id}`),
  updateTrip: (id: string, body: unknown) =>
    call<Trip>(`/trips/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteTrip: (id: string) =>
    call<void>(`/trips/${id}`, { method: "DELETE" }),
  addMember: (id: string, body: unknown) =>
    call<Member>(`/trips/${id}/members`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  invite: (id: string, body: unknown) =>
    call<Member>(`/trips/${id}/invite`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateMember: (id: number, body: unknown) =>
    call<Member>(`/members/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteMember: (id: number) =>
    call<void>(`/members/${id}`, { method: "DELETE" }),
  addCategory: (id: string, body: unknown) =>
    call<Category>(`/trips/${id}/categories`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateCategory: (id: number, body: unknown) =>
    call<Category>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteCategory: (id: number) =>
    call<void>(`/categories/${id}`, { method: "DELETE" }),
  addContribution: (id: string, body: unknown) =>
    call<Contribution>(`/trips/${id}/contributions`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteContribution: (id: number) =>
    call<void>(`/contributions/${id}`, { method: "DELETE" }),
  uploadCover: (id: string, file: File) => {
    const body = new FormData();
    body.append("cover", file);
    return call<{ cover: string }>(`/trips/${id}/cover`, {
      method: "POST",
      body,
    });
  },
  addExpense: (id: string, body: unknown) =>
    call<Expense>(`/trips/${id}/expenses`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateExpense: (id: number, body: unknown) =>
    call<Expense>(`/expenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteExpense: (id: number) =>
    call<void>(`/expenses/${id}`, { method: "DELETE" }),
  me: () =>
    call<{ id: number; name: string; email: string; avatar: string | null }>(
      "/me",
    ),
  updateMe: (body: unknown) =>
    call<{ id: number; name: string; email: string; avatar: string | null }>(
      "/me",
      { method: "PATCH", body: JSON.stringify(body) },
    ),
  updatePassword: (body: unknown) =>
    call<{ ok: boolean }>("/me/password", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  uploadAvatar: (file: File) => {
    const body = new FormData();
    body.append("avatar", file);
    return call<{
      id: number;
      name: string;
      email: string;
      avatar: string | null;
    }>("/me/avatar", { method: "POST", body });
  },
};
