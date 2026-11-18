import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api-client";
import type { Tenant } from "@/app/(admin)/tenants/page";

// =============================================================================
// zustand Global Store: useTenantStore
//
// काय करतो:
// 1. सर्व Tenants ची माहिती एकच ठिकाणी मॅनेज करतो.
// 2. जेव्हा भाडेकरू ॲड/एडिट/डिलीट होतो, तेव्हा अखंड सिंक ठेवतो.
// =============================================================================

interface TenantState {
  tenants: Tenant[];
  loading: boolean;
  error: string | null;

  fetchTenants: (forceRefresh?: boolean) => Promise<void>;
  addTenant: (payload: Omit<Tenant, "_id">) => Promise<Tenant>;
  updateTenant: (id: string, payload: Partial<Tenant>) => Promise<Tenant>;
  deleteTenant: (id: string) => Promise<void>;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      tenants: [],
      loading: false,
      error: null,

      fetchTenants: async (forceRefresh = false) => {
        if (get().tenants.length > 0 && !forceRefresh) return;

        set({ loading: true, error: null });
        try {
          const res = await api.get<Tenant[] | { data: Tenant[] }>("/tenants");
          const list = Array.isArray(res) ? res : res.data ?? [];
          set({ tenants: list, loading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Failed to load tenants",
            loading: false,
          });
        }
      },

      addTenant: async (payload) => {
        set({ loading: true, error: null });
        try {
          const res = await api.post<Tenant | { data: Tenant }>("/tenants", payload);
          const created = ((res && "data" in res && res.data ? res.data : res) as Tenant) || {
            _id: `t-${Date.now()}`,
            ...payload,
          };

          set((state) => ({
            tenants: [created, ...state.tenants],
            loading: false,
          }));
          return created;
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      updateTenant: async (id, payload) => {
        set({ loading: true, error: null });
        try {
          await api.put(`/tenants/${id}`, payload);
          set((state) => ({
            tenants: state.tenants.map((t) => (t._id === id ? { ...t, ...payload } : t)),
            loading: false,
          }));
          const updated = get().tenants.find((t) => t._id === id)!;
          return updated;
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      deleteTenant: async (id) => {
        set({ loading: true, error: null });
        try {
          await api.delete(`/tenants/${id}`);
          set((state) => ({
            tenants: state.tenants.filter((t) => t._id !== id),
            loading: false,
          }));
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },
    }),
    {
      name: "rental_zustand_tenants",
      partialize: (state) => ({ tenants: state.tenants }),
    },
  ),
);
