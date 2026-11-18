import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api-client";
import { cleanProperty, type Property, type PropertyPayload } from "@/app/(admin)/properties/property-utils";

// =============================================================================
// zustand Global Store: usePropertyStore
//
// काय करतो:
// 1. सर्व Properties चा डेटा सेंट्रलाइज्ड (Global State) ठेवतो.
// 2. जेव्हा Dashboard, Properties किंवा Tenants पेज लोड होतो, तेव्हा डेटा पुन्हा पुन्हा
//    API कडून फेच न करता एकाच Store मधून Instant मिळतो.
// 3. fetchProperties, addProperty, updateProperty, deleteProperty या ॲक्शन्स देतो.
// 4. `persist` मिडलवेअर वापरल्यामुळे पेज रिफ्रेश केले तरी डेटा उडत नाही (LocalStorage cache).
// =============================================================================

interface PropertyState {
  properties: Property[];
  loading: boolean;
  error: string | null;

  // ॲक्शन्स (State बदलण्यासाठी फंक्शन्स)
  fetchProperties: (forceRefresh?: boolean) => Promise<void>;
  addProperty: (payload: PropertyPayload) => Promise<Property>;
  updateProperty: (id: string, payload: PropertyPayload) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
  updateOccupancyLocally: (propertyName: string, delta: number) => void;
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      properties: [],
      loading: false,
      error: null,

      // १. सर्व प्रॉपर्टीज आणणे (आधी Store मधील डेटा दाखवणे, नंतर API कॉल करणे)
      fetchProperties: async (forceRefresh = false) => {
        // जर आधीच डेटा असेल आणि फोर्स रिफ्रेश नसेल तर पुन्हा कॉल करू नका
        if (get().properties.length > 0 && !forceRefresh) {
          return;
        }

        set({ loading: true, error: null });
        try {
          const res = await api.get<Property[] | { data: Property[] }>("/properties");
          const list = Array.isArray(res) ? res : res.data ?? [];
          const cleaned = list.map(cleanProperty);
          set({ properties: cleaned, loading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Failed to load properties",
            loading: false,
          });
        }
      },

      // २. नवीन प्रॉपर्टी जोडणे
      addProperty: async (payload: PropertyPayload) => {
        set({ loading: true, error: null });
        try {
          const res = await api.post<Property | { data: Property }>("/properties", payload);
          const raw = (res && "data" in res && res.data ? res.data : res) as Property;
          const newProp = cleanProperty(raw);

          // ग्लोबल स्टेटमध्ये लगेच सर्वात पुढे ॲड करा
          set((state) => ({
            properties: [newProp, ...state.properties],
            loading: false,
          }));
          return newProp;
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      // ३. प्रॉपर्टी अपडेट करणे
      updateProperty: async (id: string, payload: PropertyPayload) => {
        set({ loading: true, error: null });
        try {
          const res = await api.put<Property | { data: Property }>(`/properties/${id}`, payload);
          const raw = (res && "data" in res && res.data ? res.data : res) as Property;
          const updated = cleanProperty(raw);

          set((state) => ({
            properties: state.properties.map((p) => (p._id === id || p.id === id ? updated : p)),
            loading: false,
          }));
          return updated;
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      // ४. प्रॉपर्टी डिलीट करणे
      deleteProperty: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await api.delete(`/properties/${id}`);
          set((state) => ({
            properties: state.properties.filter((p) => p._id !== id && p.id !== id),
            loading: false,
          }));
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      // ५. भाडेकरू ॲड/रिमूव्ह झाल्यावर ऑक्युपन्सी लगेच स्टेटमध्ये बदलणे
      updateOccupancyLocally: (propertyName: string, delta: number) => {
        set((state) => ({
          properties: state.properties.map((p) => {
            if (p.name !== propertyName) return p;
            const newOccupied = Math.max(0, Math.min(p.units, p.occupied + delta));
            const vacant = p.units - newOccupied;
            return {
              ...p,
              occupied: newOccupied,
              status: vacant <= 0 ? "Fully Leased" : `${vacant} Vacant`,
            };
          }),
        }));
      },
    }),
    {
      name: "rental_zustand_properties", // LocalStorage की चे नाव
      partialize: (state) => ({ properties: state.properties }), // फक्त properties सेव्ह करा
    },
  ),
);
