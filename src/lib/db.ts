import { supabase } from './supabase';
import type {
  MaterialTag,
  MaterialType,
  PurchaseSource,
  Material,
  MaterialBatch,
  Recipe,
  RecipeItem,
  Product,
  ProductRecord,
  ConsumedBatch,
} from '../store/useStore';

// ──────────────────────────────────────────
// FETCH ALL (called on app startup)
// ──────────────────────────────────────────
export interface AllData {
  tags: MaterialTag[];
  types: MaterialType[];
  sources: PurchaseSource[];
  materials: Material[];
  batches: MaterialBatch[];
  recipes: Recipe[];
  products: Product[];
  productRecords: ProductRecord[];
}

export async function fetchAllData(): Promise<AllData> {
  const [
    { data: tagsRaw },
    { data: typesRaw },
    { data: sourcesRaw },
    { data: materialsRaw },
    { data: batchesRaw },
    { data: recipesRaw },
    { data: recipeItemsRaw },
    { data: productsRaw },
    { data: productRecordsRaw },
    { data: consumedBatchesRaw },
  ] = await Promise.all([
    supabase.from('material_tags').select('*'),
    supabase.from('material_types').select('*'),
    supabase.from('purchase_sources').select('*'),
    supabase.from('materials').select('*').order('created_at', { ascending: false }),
    supabase.from('material_batches').select('*').order('created_at', { ascending: false }),
    supabase.from('recipes').select('*').order('created_at', { ascending: false }),
    supabase.from('recipe_items').select('*'),
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('product_records').select('*').order('created_at', { ascending: false }),
    supabase.from('consumed_batches').select('*'),
  ]);

  // Rebuild recipes with items
  const recipes: Recipe[] = (recipesRaw || []).map((r) => ({
    id: r.id,
    name: r.name,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
    items: (recipeItemsRaw || [])
      .filter((i) => i.recipe_id === r.id)
      .map((i) => ({ materialId: i.material_id, quantity: i.quantity })),
  }));

  // Rebuild product records with consumed batches
  const productRecords: ProductRecord[] = (productRecordsRaw || []).map((pr) => ({
    id: pr.id,
    productId: pr.product_id,
    totalCost: pr.total_cost,
    createdAt: pr.created_at,
    consumedBatches: (consumedBatchesRaw || [])
      .filter((cb) => cb.record_id === pr.id)
      .map((cb) => ({
        batchId: cb.batch_id,
        materialId: cb.material_id,
        quantity: cb.quantity,
        unitCost: cb.unit_cost,
      })),
  }));

  return {
    tags: (tagsRaw || []).map((t) => ({ id: t.id, name: t.name })),
    types: (typesRaw || []).map((t) => ({ id: t.id, name: t.name, defaultUnit: t.default_unit })),
    sources: (sourcesRaw || []).map((s) => ({ id: s.id, name: s.name })),
    materials: (materialsRaw || []).map((m) => ({
      id: m.id,
      name: m.name,
      image: m.image,
      typeId: m.type_id,
      tagIds: m.tag_ids || [],
      createdAt: m.created_at,
    })),
    batches: (batchesRaw || []).map((b) => ({
      id: b.id,
      materialId: b.material_id,
      sourceId: b.source_id,
      totalPrice: b.total_price,
      quantity: b.quantity,
      remaining: b.remaining,
      unitCost: b.unit_cost,
      createdAt: b.created_at,
    })),
    recipes,
    products: (productsRaw || []).map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image,
      recipeId: p.recipe_id,
      createdAt: p.created_at,
    })),
    productRecords,
  };
}

// ──────────────────────────────────────────
// INSERT helpers
// ──────────────────────────────────────────
export async function dbAddTag(t: MaterialTag) {
  await supabase.from('material_tags').insert({ id: t.id, name: t.name });
}

export async function dbAddType(t: MaterialType) {
  await supabase.from('material_types').insert({ id: t.id, name: t.name, default_unit: t.defaultUnit });
}

export async function dbAddSource(s: PurchaseSource) {
  await supabase.from('purchase_sources').insert({ id: s.id, name: s.name });
}

export async function dbAddMaterial(m: Material) {
  await supabase.from('materials').insert({
    id: m.id,
    name: m.name,
    image: m.image,
    type_id: m.typeId,
    tag_ids: m.tagIds,
    created_at: m.createdAt,
  });
}

export async function dbUpdateMaterial(id: string, updated: Partial<Material>) {
  const patch: Record<string, unknown> = {};
  if (updated.name !== undefined) patch.name = updated.name;
  if (updated.image !== undefined) patch.image = updated.image;
  if (updated.typeId !== undefined) patch.type_id = updated.typeId;
  if (updated.tagIds !== undefined) patch.tag_ids = updated.tagIds;
  await supabase.from('materials').update(patch).eq('id', id);
}

export async function dbAddBatch(b: MaterialBatch) {
  await supabase.from('material_batches').insert({
    id: b.id,
    material_id: b.materialId,
    source_id: b.sourceId,
    total_price: b.totalPrice,
    quantity: b.quantity,
    remaining: b.remaining,
    unit_cost: b.unitCost,
    created_at: b.createdAt,
  });
}

export async function dbAddRecipe(r: Recipe) {
  // Insert recipe
  await supabase.from('recipes').insert({
    id: r.id,
    name: r.name,
    notes: r.notes ?? null,
    created_at: r.createdAt,
  });
  // Insert recipe items
  if (r.items.length > 0) {
    await supabase.from('recipe_items').insert(
      r.items.map((item: RecipeItem) => ({
        recipe_id: r.id,
        material_id: item.materialId,
        quantity: item.quantity,
      }))
    );
  }
}

export async function dbAddProduct(p: Product) {
  await supabase.from('products').insert({
    id: p.id,
    name: p.name,
    image: p.image,
    recipe_id: p.recipeId,
    created_at: p.createdAt,
  });
}

export async function dbSaveProductRecord(
  record: ProductRecord,
  updatedBatches: MaterialBatch[]
) {
  // Insert the production record
  await supabase.from('product_records').insert({
    id: record.id,
    product_id: record.productId,
    total_cost: record.totalCost,
    created_at: record.createdAt,
  });

  // Insert consumed batches detail
  if (record.consumedBatches.length > 0) {
    await supabase.from('consumed_batches').insert(
      record.consumedBatches.map((cb: ConsumedBatch) => ({
        record_id: record.id,
        batch_id: cb.batchId,
        material_id: cb.materialId,
        quantity: cb.quantity,
        unit_cost: cb.unitCost,
      }))
    );
  }

  // Update batch remaining values in Supabase
  const affectedBatchIds = new Set(record.consumedBatches.map((cb) => cb.batchId));
  for (const batchId of affectedBatchIds) {
    if (batchId === 'fallback') continue;
    const batch = updatedBatches.find((b) => b.id === batchId);
    if (batch) {
      await supabase
        .from('material_batches')
        .update({ remaining: batch.remaining })
        .eq('id', batchId);
    }
  }
}
