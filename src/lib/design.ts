/**
 * 全站設計規範 — 按鈕層級、文字層級、版面結構
 *
 * 使用方式：
 *   import { btn, tx, layout } from '../../lib/design';
 *   <button className={btn.secondary}>...</button>
 *   <h1 className={tx.pageTitle}>...</h1>
 */

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON HIERARCHY (按鈕重要度層級)
// ─────────────────────────────────────────────────────────────────────────────
export const btn = {
  /**
   * L1 Primary — 最重要的主 CTA（確認入庫、確認新增進貨、儲存）
   * 每個畫面通常只有一個。大尺寸、全寬、主色底。
   */
  primary:
    'w-full bg-primary text-primary-foreground font-bold rounded-xl py-3.5 text-sm text-center active:scale-95 transition-transform disabled:opacity-40',

  /**
   * L2 Secondary — 頁面標題區域的操作按鈕（新增作品、新增配方、新增材料、上傳）
   * 深色膠囊形、小字、含 icon。
   */
  secondary:
    'flex items-center gap-1.5 bg-gray-900 text-white font-bold rounded-full py-2 px-3.5 text-xs active:scale-95 transition-transform shrink-0',

  /**
   * L3 Tertiary — 次要操作（加入進貨清單、登錄進貨、多選）
   * 淺色膠囊形。
   */
  tertiary:
    'flex items-center gap-1.5 bg-gray-100 text-gray-700 font-bold rounded-full py-1.5 px-3 text-xs active:scale-95 transition-colors hover:bg-gray-200 shrink-0',

  /**
   * L4 Icon — 僅有圖示的操作（返回、編輯、關閉）
   * 圓形、無底色，hover 時出現底色。
   */
  icon: 'p-2 rounded-full text-foreground/50 hover:bg-gray-100 hover:text-foreground transition-colors active:scale-95',

  /**
   * L5 Danger — 刪除、移除等破壞性操作
   * 預設低調，hover 時變紅。
   */
  danger:
    'p-1.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0',

  /**
   * Chip（篩選用）— 被選中 / 未選中兩種狀態
   * 使用時依條件切換：isOn ? btn.chipOn : btn.chipOff
   */
  chipOn:
    'px-3 py-1.5 rounded-full text-[11px] font-bold bg-black text-white shrink-0 whitespace-nowrap active:scale-95 transition-all',
  chipOff:
    'px-3 py-1.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 shrink-0 whitespace-nowrap active:scale-95 transition-all hover:bg-gray-200',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY HIERARCHY (文字重要度層級)
// ─────────────────────────────────────────────────────────────────────────────
export const tx = {
  /** T1 — 頁面標題 (h1)：每頁最多一個 */
  pageTitle: 'text-2xl font-bold text-foreground leading-tight',

  /** T2 — 區塊標題 (h2/h3)：區段名稱、卡片標題、表單分區 */
  sectionTitle: 'text-base font-bold text-foreground',

  /** T3 — 列表項目主文字：材料名、配方名、作品名 */
  itemTitle: 'text-sm font-bold leading-tight',

  /** T4 — 表單欄位標籤、小標題 */
  label: 'text-xs font-medium text-foreground/55',

  /** T5 — 輔助資訊：計數、日期、來源名 */
  meta: 'text-xs text-foreground/50',

  /** T6 — 最小說明文字：提示說明、備註 */
  caption: 'text-[10px] text-gray-400 leading-relaxed',

  /** 價格文字（突顯用） */
  price: 'text-sm font-bold text-primary',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT CONSTANTS (版面結構)
// ─────────────────────────────────────────────────────────────────────────────
export const layout = {
  /**
   * 頂層頁 header 容器（sticky top-0）
   * 作品、配方、材料、進貨清單、設定 共用
   */
  pageHeader: 'sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100',

  /** 頂層頁 header 內部 row（固定高度 56px） */
  pageHeaderRow: 'flex items-center justify-between h-14 px-4 max-w-5xl mx-auto',

  /**
   * 子頁 header 容器（detail / form 頁）
   * 材料詳情、新增/編輯材料、配方詳情 共用
   */
  subHeader: 'sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100',

  /** 子頁 header 內部 row（固定高度 52px） */
  subHeaderRow: 'flex items-center justify-between h-13 px-4 max-w-5xl mx-auto',

  /** 頁面 body 通用 padding（頂層頁面內容區） */
  body: 'px-4 max-w-5xl mx-auto',

  /** 卡片格 grid：手機 2 欄，平板 3 欄，桌機 4 欄以上 */
  materialGrid: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5',
} as const;
