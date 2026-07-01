const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "") + "/api";

const TOKEN_KEY = "kbt_auth_token";

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const hasBody = options.body != null;

  // Only attach Content-Type when there is a body — sending it on GET requests
  // triggers an unnecessary CORS preflight that fails when Render is cold-starting.
  // Authorization is always included when a token exists (required for protected routes).
  const headers: Record<string, string> = {};
  if (hasBody) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { ...headers, ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || "Request failed");
  }
  return res.json();
}

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    request<AuthUser>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<AuthUser>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),
  me: () => request<AuthUser>("/auth/me"),
  updateProfile: (data: Partial<AuthUser>) =>
    request<AuthUser>("/auth/profile", { method: "PATCH", body: JSON.stringify(data) }),
};

// Store
export const storeApi = {
  listProducts: (params: { search?: string; category?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.category) qs.set("category", params.category);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return request<{ products: StoreProduct[]; total: number; page: number; limit: number; categories: string[] }>(
      `/store/products${qs.toString() ? `?${qs}` : ""}`
    );
  },
  getProduct: (id: number) => request<StoreProduct>(`/store/products/${id}`),
  getOrders: () => request<StoreOrder[]>("/store/orders"),
  getOrder: (id: number) => request<StoreOrder>(`/store/orders/${id}`),
};

// Cart
export const cartApi = {
  get: () => request<Cart>("/cart"),
  addItem: (productId: number, quantity = 1) =>
    request<Cart>("/cart/items", { method: "POST", body: JSON.stringify({ productId, quantity }) }),
  updateItem: (id: number, quantity: number) =>
    request<Cart>(`/cart/items/${id}`, { method: "PATCH", body: JSON.stringify({ quantity }) }),
  removeItem: (id: number) => request<Cart>(`/cart/items/${id}`, { method: "DELETE" }),
  clear: () => request<Cart>("/cart", { method: "DELETE" }),
};

// Checkout
export const checkoutApi = {
  place: (data: CheckoutData) =>
    request<CheckoutResult>("/checkout", { method: "POST", body: JSON.stringify(data) }),
  initiateOzow: (paymentId: number) =>
    request<{ redirectUrl: string; mode?: string }>("/payments/ozow/initiate", {
      method: "POST",
      body: JSON.stringify({ paymentId }),
    }),
  testConfirm: (paymentId: number) =>
    request<{ success: boolean; orderNumber: string }>(`/payments/test-confirm/${paymentId}`, { method: "POST" }),
};

// Types
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  role: "customer" | "admin";
  createdAt?: string;
  token?: string;
}

export interface StoreProduct {
  id: number;
  title: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  status: string;
  inventory: number;
  imageUrl: string | null;
  category: string | null;
  sku: string | null;
  createdAt: string;
}

export interface CartItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    title: string;
    price: number;
    compareAtPrice: number | null;
    imageUrl: string | null;
    inventory: number;
    sku: string | null;
    status: string;
  };
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface StoreOrderItem {
  id: number;
  productId: number | null;
  productTitle: string;
  productSku: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface StoreOrder {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  itemCount: number;
  shippingName: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingProvince: string | null;
  shippingPostalCode: string | null;
  createdAt: string;
  items: StoreOrderItem[];
}

export interface CheckoutData {
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  notes?: string;
  paymentMethod: "ozow" | "cod";
}

export interface CheckoutResult {
  orderId: number;
  orderNumber: string;
  paymentId: number;
  total: number;
  paymentMethod: string;
  status: string;
}
