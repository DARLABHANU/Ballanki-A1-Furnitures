import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
export const api = axios.create({ baseURL: API_BASE_URL, headers: { "Content-Type": "application/json" }, timeout: 20000 });
api.interceptors.request.use(config => { const token = Cookies.get("access_token"); if(token) config.headers.Authorization = `Bearer ${token}`; return config; });
let refreshPromise: Promise<string> | null = null;
api.interceptors.response.use(response => response, async (error: AxiosError) => {
 const original = error.config as typeof error.config & { _retry?: boolean };
 const refresh = Cookies.get("refresh_token");
 if(error.response?.status !== 401 || !original || original._retry || original.url?.startsWith("/auth/login") || original.url?.startsWith("/auth/google") || original.url?.startsWith("/auth/signup") || !refresh) return Promise.reject(error);
 original._retry = true;
 try {
  if(!refreshPromise) refreshPromise = axios.post(API_BASE_URL + "/auth/refresh", {refresh_token: refresh}).then(({data}) => { setAuthCookies(data.access_token,data.refresh_token); return data.access_token as string; }).finally(() => { refreshPromise=null; });
  const token = await refreshPromise;
  original.headers.Authorization = `Bearer ${token}`;
  return api(original);
 } catch (e) { clearAuth(); if(typeof window !== "undefined" && !window.location.pathname.startsWith("/auth/")) window.location.assign("/auth/login"); return Promise.reject(e); }
});
export function setAuthCookies(accessToken: string, refreshToken: string) { const options = { sameSite: "Lax" as const, path: "/", secure: typeof location !== "undefined" && location.protocol === "https:" }; Cookies.set("access_token",accessToken,{...options,expires:1});Cookies.set("refresh_token",refreshToken,{...options,expires:7}); }
export function clearAuth() { for(const key of ["access_token","refresh_token","user_role","user_id"]) Cookies.remove(key,{path:"/"}); }
// ── Typed API helpers ─────────────────────────────────────────────────────────
export const authApi = {
  signup: (data: object) => api.post("/auth/signup", data),
  login: (data: object) => api.post("/auth/login", data),
  resendOtp: (data: object) => api.post("/auth/resend-otp", data),
  refresh: (data: object) => api.post("/auth/refresh", data),
  me: () => api.get("/auth/me"),
  changePassword: (data: object) => api.post("/auth/change-password", data),
  forgotPassword: (data: object) => api.post("/auth/forgot-password", data),
  resetPassword: (data: object) => api.post("/auth/reset-password", data),
  sendOtp: (data: { identifier: string; channel: "sms" | "email" }) => api.post("/auth/send-otp", data),
  verifyOtp: (data: { identifier: string; channel: "sms" | "email"; otpCode: string; role?: string }) => api.post("/auth/verify-otp", data),
  updatePayoutSettings: (data: object) => api.put("/auth/payout-settings", data),
  magicLinkRequest: (data: { email: string; role: string }) => api.post("/auth/magic-link-request", data),
  verifyMagicToken: (data: { token: string }) => api.post("/auth/verify-magic-token", data),
  googleLogin: (data: { idToken: string; password?: string }) => api.post("/auth/google", data),
  verifyEmailOtp: (data: { email: string; otp: string }) => api.post("/auth/verify-email-otp", data),
  updateProfile: (data: { full_name: string; phone?: string }) => api.put("/auth/profile", data),
};

export const productApi = {
  list: (params?: object) => api.get("/products", { params }),
  get: (id: string | number) => api.get(`/products/${id}`),
  create: (data: object) => api.post("/products", data),
  update: (id: string | number, data: object) => api.put(`/products/${id}`, data),
  delete: (id: string | number) => api.delete(`/products/${id}`),
  myProducts: (params?: object) => api.get("/products/merchant/my-products", { params }),
  upload: (data: { filename: string; base64: string; folder?: string }) => api.post("/upload", data),
  categories: () => api.get("/products/categories/all"),
  tags: () => api.get("/products/tags/all"),
  getReviews: (id: string | number) => api.get(`/products/${id}/reviews`),
  addReview: (id: string | number, data: { rating: number; comment: string; images?: string[] }) => api.post(`/products/${id}/reviews`, data),
};

export const cartApi = {
  get: () => api.get("/cart"),
  add: (data: object) => api.post("/cart/add", data),
  remove: (itemId: string | number) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete("/cart"),
};

export const orderApi = {
  list: (params?: object) => api.get("/orders", { params }),
  get: (id: string | number) => api.get(`/orders/${id}`),
  create: (data: object) => api.post("/orders", data),
  validateCoupon: (data: object) => api.post("/orders/validate-coupon", data),
  activeCoupons: () => api.get("/orders/active-coupons"),
  updateStatus: (id: string | number, data: object) => api.patch(`/orders/${id}/status`, data),
  merchantOrders: (params?: object) => api.get("/orders/merchant/incoming", { params }),
  createOrder: (data: { amount: number; currency?: string; receipt?: string }) => api.post("/create-order", data),
  razorpayVerify: (data: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    order_id?: string;
    payment_id?: string;
    signature?: string;
  }) => api.post("/orders/verify-payment", data),
  cancel: (id: string | number) => api.post(`/orders/${id}/cancel`),
  refund: (id: string | number, data?: object) => api.post(`/orders/${id}/refund`, data),
};

export const merchantApi = {
  createProfile: (data: object) => api.post("/merchant/profile", data),
  getProfile: () => api.get("/merchant/profile"),
  updateProfile: (data: object) => api.put("/merchant/profile", data),
  analytics: (days?: number) => api.get("/merchant/analytics", { params: { days } }),
  commissions: () => api.get("/merchant/commissions"),
  wallet: () => api.get("/merchant/wallet"),
  requestWithdrawal: (data: object) => api.post("/merchant/withdraw", data),
  withdrawals: (params?: object) => api.get("/merchant/withdrawals", { params }),
  settlements: (params?: object) => api.get("/merchant/settlements", { params }),
  bulkUploadProducts: (data: { csvData: string; imageMap?: Record<string, string> }) => api.post("/merchant/products/bulk-upload", data),
  reviews: (params?: object) => api.get("/merchant/reviews", { params }),
  customers: (params?: object) => api.get("/merchant/customers", { params }),
  coupons: () => api.get("/merchant/coupons"),
};

export const adminApi = {
  dashboard: (range: "month" | "last_month" | "year" = "month") => api.get("/admin/dashboard", { params: { range } }),
  users: (params?: object) => api.get("/admin/users", { params }),
  getUser: (id: string | number) => api.get(`/admin/users/${id}`),
  updateUser: (id: string | number, data: object) => api.patch(`/admin/users/${id}`, data),
  createUser: (data: object) => api.post("/admin/users", data),
  deleteUser: (id: string | number) => api.delete(`/admin/users/${id}`),
  merchants: (params?: object) => api.get("/admin/merchants", { params }),
  approveMerchant: (id: string | number, data: object) =>
    api.patch(`/admin/merchants/${id}/approval`, data),
  deleteMerchant: (id: string | number) => api.delete(`/admin/merchants/${id}`),
  orders: (params?: object) => api.get("/admin/orders", { params }),
  order: (id: string | number) => api.get(`/admin/orders/${id}`),
  deleteOrder: (id: string | number) => api.delete(`/admin/orders/${id}`),
  coupons: () => api.get("/admin/coupons"),
  createCoupon: (data: object) => api.post("/admin/coupons", data),
  updateCoupon: (id: string | number, data: object) => api.patch(`/admin/coupons/${id}`, data),
  deleteCoupon: (id: string | number) => api.delete(`/admin/coupons/${id}`),
  commissions: (params?: object) => api.get("/admin/commissions", { params }),
  payCommission: (id: string | number, data?: object) => api.patch(`/admin/commissions/${id}/pay`, data),
  deleteCommission: (id: string | number) => api.delete(`/admin/commissions/${id}`),
  salesAnalytics: (days?: number) => api.get("/admin/analytics/sales", { params: { days } }),
  products: (params?: object) => api.get("/admin/products", { params }),
  approveProduct: (id: string | number, data: { is_approved: boolean }) => api.patch(`/admin/products/${id}/approve`, data),
  deleteProduct: (id: string | number) => api.delete(`/admin/products/${id}`),
  withdrawals: (params?: object) => api.get("/admin/withdrawals", { params }),
  approveWithdrawal: (id: string | number, data: { status: "approved" | "rejected" }) =>
    api.patch(`/admin/withdrawals/${id}/approval`, data),
  payWithdrawal: (id: string | number, data?: { utr_number?: string; payment_method?: string; admin_notes?: string }) =>
    api.patch(`/admin/withdrawals/${id}/pay`, data),
  deleteWithdrawal: (id: string | number) => api.delete(`/admin/withdrawals/${id}`),
  settlements: (params?: object) => api.get("/admin/settlements", { params }),
  paySettlement: (id: string | number, data?: { utr_number?: string; payment_method?: string; admin_notes?: string }) =>
    api.patch(`/admin/settlements/${id}/pay`, data),
  deleteSettlement: (id: string | number) => api.delete(`/admin/settlements/${id}`),
  wallets: () => api.get("/admin/wallets"),
  returnRequests: (params?: object) => api.get("/admin/return-requests", { params }),
  approveReturnRequest: (id: string | number, data: { status: "approved" | "rejected", admin_notes?: string }) =>
    api.patch(`/admin/return-requests/${id}/approval`, data),
  completeReturnRequest: (id: string | number) => api.post(`/admin/return-requests/${id}/complete`),
  deleteReturnRequest: (id: string | number) => api.delete(`/admin/return-requests/${id}`),
};

export const supportApi = {
  lookup: (data: object) => api.post("/support/lookup", data),
  impersonate: (data: object) => api.post("/support/impersonate", data),
  endImpersonation: (auditLogId: string | number) =>
    api.post(`/support/impersonate/end/${auditLogId}`),
  auditLogs: (params?: object) => api.get("/support/audit-logs", { params }),
  userOrders: (userId: string | number) => api.get(`/support/user/${userId}/orders`),
  resetPassword: (userId: string | number, data: object) =>
    api.patch(`/support/user/${userId}/reset-password`, data),
  createTicket: (data: object) => api.post("/support/tickets", data),
  getMyTickets: () => api.get("/support/tickets"),
  getTicketDetails: (id: string | number) => api.get(`/support/tickets/${id}`),
  replyToTicket: (id: string | number, data: object) => api.post(`/support/tickets/${id}/reply`, data),
  getAllTickets: (params?: object) => api.get("/support/tickets/all", { params }),
  updateTicketStatus: (id: string | number, data: object) => api.patch(`/support/tickets/${id}/status`, data),
  agentReplyToTicket: (id: string | number, data: object) => api.post(`/support/tickets/${id}/agent-reply`, data),
};

export const conversationApi = {
  start: (product_id: string | number) => api.post("/conversations/init", { product_id }),
  messages: (id: string) => api.get(`/conversations/${id}/messages`),
  sendMessage: (id: string, content: string) => api.post(`/conversations/${id}/messages`, { content }),
  makeOffer: (id: string, proposed_price: number, message?: string) => api.post(`/conversations/${id}/offers`, { proposed_price, message }),
  acceptOffer: (id: string) => api.post(`/conversations/offers/${id}/accept`),
  rejectOffer: (id: string) => api.post(`/conversations/offers/${id}/reject`),
  merchantInbox: () => api.get("/merchant/conversations"),
};

export const notificationApi = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
};

export const addressApi = {
  list: () => api.get("/addresses"),
  create: (data: object) => api.post("/addresses", data),
  update: (id: string | number, data: object) => api.put(`/addresses/${id}`, data),
  delete: (id: string | number) => api.delete(`/addresses/${id}`),
};

export const wishlistApi = {
  get: () => api.get("/wishlist"),
  toggle: (productId: string | number) => api.post("/wishlist/toggle", { product_id: productId }),
};

export const promoterApi = {
  commissions: () => api.get("/promoter/commissions"),
  coupons: () => api.get("/promoter/coupons"),
  analytics: () => api.get("/promoter/analytics"),
};

export const reviewApi = {
  getForProduct: (productId: string | number) => api.get(`/products/${productId}/reviews`),
  createForProduct: (productId: string | number, data: { rating: number; comment?: string }) =>
    api.post(`/products/${productId}/reviews`, data),
  getForMerchant: () => api.get("/merchant/reviews"),
};
