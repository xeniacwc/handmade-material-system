import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import localforage from 'localforage';
import {
  fetchAllData,
  dbAddTag,
  dbAddType,
  dbAddSource,
  dbAddMaterial,
  dbAddMaterials,
  dbUpdateMaterial,
  dbAddBatch,
  dbAddRecipe,
  dbAddProduct,
  dbSaveProductRecord,
  dbAddNamingOption,
  dbDeleteNamingOption,
  dbAddShoppingItem,
  dbUpdateShoppingItem,
  dbDeleteShoppingItem,
} from '../lib/db';

export interface MaterialTag { id: string; name: string; }
export interface MaterialType { id: string; name: string; defaultUnit: string; }
export interface PurchaseSource { id: string; name: string; }
export interface NamingOption {
  id: string;
  category: string;
  value: string;
}

export interface ShoppingItem {
  id: string;
  materialId: string;
  sourceId: string | null;
  quantity: number;
  unitCost: number;
  createdAt: number;
}

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
  majorCategory: 'wire' | 'bead' | 'hardware';
  attributes: Record<string, any>;
  notes: string;
  createdAt: number;
}

export interface RecipeItem { materialId: string; quantity: number; }
export interface Recipe { id: string; name: string; items: RecipeItem[]; notes?: string; createdAt: number; }

export interface Product { id: string; name: string; image: string | null; recipeId: string | null; createdAt: number; }
export interface ConsumedBatch { batchId: string; materialId: string; quantity: number; unitCost: number; }
export interface ProductRecord { id: string; productId: string; totalCost: number; consumedBatches: ConsumedBatch[]; createdAt: number; }

type SyncStatus = 'idle' | 'loading' | 'syncing' | 'error';

interface AppState {
  tags: MaterialTag[];
  types: MaterialType[];
  sources: PurchaseSource[];
  materials: Material[];
  batches: MaterialBatch[];
  recipes: Recipe[];
  products: Product[];
  productRecords: ProductRecord[];
  namingOptions: NamingOption[];
  shoppingItems: ShoppingItem[];

  // Sync state
  syncStatus: SyncStatus;
  syncError: string | null;

  // Actions
  loadFromSupabase: () => Promise<void>;
  addTag: (t: MaterialTag) => void;
  addType: (t: MaterialType) => void;
  addSource: (s: PurchaseSource) => void;
  addMaterial: (m: Material) => void;
  addMaterials: (m: Material[]) => void;
  updateMaterial: (id: string, m: Partial<Material>) => void;
  addBatch: (b: MaterialBatch) => void;
  addRecipe: (r: Recipe) => void;
  addProduct: (p: Product) => void;
  addNamingOption: (n: NamingOption) => void;
  deleteNamingOption: (id: string) => void;

  // Shopping List
  addShoppingItem: (s: ShoppingItem) => void;
  updateShoppingItem: (id: string, s: Partial<ShoppingItem>) => void;
  removeShoppingItem: (id: string) => void;
  checkoutShoppingItems: (itemsToCheckout: ShoppingItem[]) => void;

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
      namingOptions: [],
      shoppingItems: [],
      syncStatus: 'idle',
      syncError: null,

      // ── Load all data from Supabase on startup ──
      loadFromSupabase: async () => {
        set({ syncStatus: 'loading', syncError: null });
        try {
          const data = await fetchAllData();
          // Merge types: keep defaults if Supabase returns empty
          const types = data.types.length > 0 ? data.types : defaultTypes;
          set({
            ...data,
            types,
            syncStatus: 'idle',
          });
        } catch (err) {
          console.error('[Supabase] loadFromSupabase error:', err);
          set({ syncStatus: 'error', syncError: String(err) });
        }
      },

      addTag: (t) => {
        set((s) => ({ tags: [...s.tags, t] }));
        dbAddTag(t).catch((e) => console.error('[Supabase] addTag:', e));
      },

      addType: (t) => {
        set((s) => ({ types: [...s.types, t] }));
        dbAddType(t).catch((e) => console.error('[Supabase] addType:', e));
      },

      addSource: (s_obj) => {
        set((s) => ({ sources: [...s.sources, s_obj] }));
        dbAddSource(s_obj).catch((e) => console.error('[Supabase] addSource:', e));
      },

      addMaterial: (m) => {
        set((s) => ({ materials: [m, ...s.materials] }));
        dbAddMaterial(m).catch((e) => console.error('[Supabase] addMaterial:', e));
      },

      addMaterials: (batchMaterials) => {
        set((s) => ({ materials: [...batchMaterials, ...s.materials] }));
        dbAddMaterials(batchMaterials).catch((e) => console.error('[Supabase] addMaterials:', e));
      },

      updateMaterial: (id, updated) => {
        set((s) => ({
          materials: s.materials.map(m => m.id === id ? { ...m, ...updated } : m)
        }));
        dbUpdateMaterial(id, updated).catch((e) => console.error('[Supabase] updateMaterial:', e));
      },

      addBatch: (b) => {
        set((s) => ({ batches: [b, ...s.batches] }));
        dbAddBatch(b).catch((e) => console.error('[Supabase] addBatch:', e));
      },

      addRecipe: (r) => {
        set((s) => ({ recipes: [r, ...s.recipes] }));
        dbAddRecipe(r).catch((e) => console.error('[Supabase] addRecipe:', e));
      },

      addProduct: (p) => {
        set((s) => ({ products: [p, ...s.products] }));
        dbAddProduct(p).catch((e) => console.error('[Supabase] addProduct:', e));
      },

      addNamingOption: (n) => {
        set((s) => ({ namingOptions: [...s.namingOptions, n] }));
        dbAddNamingOption(n).catch((e) => console.error('[Supabase] addNamingOption:', e));
      },

      deleteNamingOption: (id) => {
        set((s) => ({ namingOptions: s.namingOptions.filter(no => no.id !== id) }));
        dbDeleteNamingOption(id).catch((e) => console.error('[Supabase] deleteNamingOption:', e));
      },

      addShoppingItem: (si) => {
        set((s) => ({ shoppingItems: [si, ...s.shoppingItems] }));
        dbAddShoppingItem(si).catch((e) => console.error('[Supabase] addShoppingItem:', e));
      },

      updateShoppingItem: (id, partial) => {
        set((s) => ({
          shoppingItems: s.shoppingItems.map(item => item.id === id ? { ...item, ...partial } : item)
        }));
        dbUpdateShoppingItem(id, partial).catch((e) => console.error('[Supabase] updateShoppingItem:', e));
      },

      removeShoppingItem: (id) => {
        set((s) => ({ shoppingItems: s.shoppingItems.filter(i => i.id !== id) }));
        dbDeleteShoppingItem(id).catch((e) => console.error('[Supabase] deleteShoppingItem:', e));
      },

      checkoutShoppingItems: (itemsToCheckout) => {
        const now = Date.now();
        const ids = itemsToCheckout.map(i => i.id);
        
        // Remove from shoppingItems state immediately
        set((s) => ({ shoppingItems: s.shoppingItems.filter(i => !ids.includes(i.id)) }));
        
        // Convert to batches and add to local state
        const newBatches: MaterialBatch[] = itemsToCheckout.map((item, idx) => ({
          id: crypto.randomUUID(),
          materialId: item.materialId,
          sourceId: item.sourceId,
          totalPrice: item.unitCost * item.quantity,
          quantity: item.quantity,
          remaining: item.quantity,
          unitCost: item.unitCost,
          createdAt: now + idx,
        }));
        set((s) => ({ batches: [...newBatches, ...s.batches] }));
        
        // Make DB calls
        ids.forEach(id => dbDeleteShoppingItem(id).catch(e => console.error('Delete SI error:', e)));
        newBatches.forEach(b => dbAddBatch(b).catch(e => console.error('Add batch error:', e)));
      },

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

          if (qtyNeeded > 0) {
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

        // Sync to Supabase async
        dbSaveProductRecord(record, updatedBatches).catch((e) =>
          console.error('[Supabase] createProductRecord:', e)
        );
      }
    }),
    {
      name: 'craft-manager-storage-v2',
      storage: createJSONStorage(() => storage),
    }
  )
);
