import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import localforage from 'localforage';

export interface MaterialTag { id: string; name: string; }
export interface MaterialType { id: string; name: string; defaultUnit: string; }
export interface PurchaseSource { id: string; name: string; }

export interface MaterialBatch {
  id: string;
  materialId: string;
  sourceId: string | null;
  totalPrice: number;
  quantity: number;
  remaining: number;
  unitCost: number;
  createdAt: number;
}

export interface Material {
  id: string;
  name: string;
  image: string | null;
  typeId: string;
  tagIds: string[];
  createdAt: number;
}

export interface RecipeItem { materialId: string; quantity: number; }
export interface Recipe { id: string; name: string; items: RecipeItem[]; notes?: string; createdAt: number; }

export interface Product { id: string; name: string; image: string | null; recipeId: string | null; createdAt: number; }
export interface ConsumedBatch { batchId: string; materialId: string; quantity: number; unitCost: number; }
export interface ProductRecord { id: string; productId: string; totalCost: number; consumedBatches: ConsumedBatch[]; createdAt: number; }

interface AppState {
  tags: MaterialTag[];
  types: MaterialType[];
  sources: PurchaseSource[];
  materials: Material[];
  batches: MaterialBatch[];
  recipes: Recipe[];
  products: Product[];
  productRecords: ProductRecord[];
  
  // Actions
  addTag: (t: MaterialTag) => void;
  addType: (t: MaterialType) => void;
  addSource: (s: PurchaseSource) => void;
  addMaterial: (m: Material) => void;
  updateMaterial: (id: string, m: Partial<Material>) => void;
  addBatch: (b: MaterialBatch) => void;
  addRecipe: (r: Recipe) => void;
  addProduct: (p: Product) => void;
  
  // Advanced Action
  createProductRecord: (productId: string, recipeId: string) => void;
}

localforage.config({ name: 'craft-manager-db', storeName: 'app_state' });
const storage: StateStorage = {
  getItem: async (n) => (await localforage.getItem(n)) || null,
  setItem: async (n, v) => await localforage.setItem(n, v),
  removeItem: async (n) => await localforage.removeItem(n),
};

// Initial default types
const defaultTypes: MaterialType[] = [
  { id: '1', name: '線材', defaultUnit: 'cm' },
  { id: '2', name: '珠珠', defaultUnit: '顆' }
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tags: [],
      types: defaultTypes,
      sources: [],
      materials: [],
      batches: [],
      recipes: [],
      products: [],
      productRecords: [],
      
      addTag: (t) => set((s) => ({ tags: [...s.tags, t] })),
      addType: (t) => set((s) => ({ types: [...s.types, t] })),
      addSource: (s_obj) => set((s) => ({ sources: [...s.sources, s_obj] })),
      addMaterial: (m) => set((s) => ({ materials: [m, ...s.materials] })),
      updateMaterial: (id, updated) => set((s) => ({
        materials: s.materials.map(m => m.id === id ? { ...m, ...updated } : m)
      })),
      addBatch: (b) => set((s) => ({ batches: [b, ...s.batches] })),
      addRecipe: (r) => set((s) => ({ recipes: [r, ...s.recipes] })),
      addProduct: (p) => set((s) => ({ products: [p, ...s.products] })),
      
      createProductRecord: (productId, recipeId) => {
        const state = get();
        const recipe = state.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        let totalCost = 0;
        const consumedList: ConsumedBatch[] = [];
        let updatedBatches = [...state.batches];

        for (const item of recipe.items) {
          let qtyNeeded = item.quantity;
          
          // Find batches for this material, sort by createdAt ASC (FIFO)
          const materialBatches = updatedBatches
            .filter(b => b.materialId === item.materialId)
            .sort((a, b) => a.createdAt - b.createdAt);

          // Get the latest batch unitCost for fallback (Option B)
          const latestBatch = materialBatches[materialBatches.length - 1];
          const fallbackCost = latestBatch ? latestBatch.unitCost : 0;

          for (const batch of materialBatches) {
            if (qtyNeeded <= 0) break;
            if (batch.remaining > 0) {
              const deduct = Math.min(batch.remaining, qtyNeeded);
              batch.remaining -= deduct;
              qtyNeeded -= deduct;
              totalCost += deduct * batch.unitCost;
              consumedList.push({ batchId: batch.id, materialId: item.materialId, quantity: deduct, unitCost: batch.unitCost });
            }
          }

          // Output warning/fallback to negative if not enough (Option B)
          if (qtyNeeded > 0) {
            // we deduct from the latest batch into negatives if it exists, otherwise we just record the cost based on 0
            totalCost += qtyNeeded * fallbackCost;
            if (latestBatch) {
              latestBatch.remaining -= qtyNeeded;
              consumedList.push({ batchId: latestBatch.id, materialId: item.materialId, quantity: qtyNeeded, unitCost: fallbackCost });
            } else {
              consumedList.push({ batchId: 'fallback', materialId: item.materialId, quantity: qtyNeeded, unitCost: 0 });
            }
          }
        }

        const record: ProductRecord = {
          id: crypto.randomUUID(),
          productId,
          totalCost,
          consumedBatches: consumedList,
          createdAt: Date.now()
        };

        set({
          batches: updatedBatches,
          productRecords: [record, ...state.productRecords]
        });
      }
    }),
    {
      name: 'craft-manager-storage-v2', // Changed storage key to force reset MVP data and use v2 schema
      storage: createJSONStorage(() => storage),
    }
  )
);
