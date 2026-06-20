import { createContext, useContext, useState, type ReactNode } from 'react';
import { useAuthStore } from './auth.store';

// ─── Interfaces ──────────────────────────────────────────────────

export interface Product {
  id: string;
  code: string;
  name: string;
  category: 'Raw Material' | 'Finished Good' | 'Service';
  salesPrice: number;
  costPrice: number;
  reorderPoint: number;
  procureOnDemand: boolean;
  procurementType?: 'PURCHASE' | 'MANUFACTURING';
  defaultVendorId?: string;
  defaultBomId?: string;
  onHand: number;
  reserved: number;
  freeToUse: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  date: string;
  direction: 'IN' | 'OUT';
  quantity: number;
  sourceType: 'ADJUSTMENT' | 'SO' | 'PO' | 'MO';
  sourceReference: string;
  performedBy: string;
  reason: string;
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
}

export interface Bom {
  id: string;
  code: string;
  name: string;
  finishedProductId: string;
  referenceQuantity: number;
}

interface DbContextState {
  products: Product[];
  stockMovements: StockMovement[];
  vendors: Vendor[];
  boms: Bom[];
  addProduct: (product: Omit<Product, 'id' | 'onHand' | 'reserved' | 'freeToUse'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  adjustStock: (productId: string, direction: 'IN' | 'OUT', quantity: number, reason: string) => void;
}

// ─── Mock Preloads ───────────────────────────────────────────────

const INITIAL_VENDORS: Vendor[] = [
  { id: 'VEND-001', code: 'VND-SHARMA', name: 'Sharma Lumber Yard', email: 'orders@sharmalumber.com', phone: '+91 98765 43210' },
  { id: 'VEND-002', code: 'VND-FASTEN', name: 'Fasteners Depot', email: 'sales@fastenersdepot.in', phone: '+91 87654 32109' },
  { id: 'VEND-003', code: 'VND-FINISH', name: 'Finishing Touches Co.', email: 'support@finishingco.com', phone: '+91 76543 21098' },
];

const INITIAL_BOMS: Bom[] = [
  { id: 'BOM-001', code: 'BOM-CHAIR-STD', name: 'Wooden Chair BoM Standard', finishedProductId: 'PROD-003', referenceQuantity: 1 },
  { id: 'BOM-002', code: 'BOM-TABLE-STD', name: 'Dining Table Standard BoM', finishedProductId: 'PROD-004', referenceQuantity: 1 },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PROD-001',
    code: 'TEAK-WOOD-PLK',
    name: 'Teak Wood Planks (6ft)',
    category: 'Raw Material',
    salesPrice: 500,
    costPrice: 300,
    reorderPoint: 50,
    procureOnDemand: false,
    onHand: 120,
    reserved: 30,
    freeToUse: 90,
  },
  {
    id: 'PROD-002',
    code: 'WDN-TBL-LEG',
    name: 'Wooden Table Leg',
    category: 'Raw Material',
    salesPrice: 150,
    costPrice: 80,
    reorderPoint: 100,
    procureOnDemand: true,
    procurementType: 'PURCHASE',
    defaultVendorId: 'VEND-001',
    onHand: 85,
    reserved: 40,
    freeToUse: 45,
  },
  {
    id: 'PROD-003',
    code: 'WDN-DIN-CHR',
    name: 'Wooden Dining Chair',
    category: 'Finished Good',
    salesPrice: 2500,
    costPrice: 1200,
    reorderPoint: 15,
    procureOnDemand: true,
    procurementType: 'MANUFACTURING',
    defaultBomId: 'BOM-001',
    onHand: 18,
    reserved: 5,
    freeToUse: 13,
  },
  {
    id: 'PROD-004',
    code: 'CLS-DIN-TBL',
    name: 'Classic Dining Table',
    category: 'Finished Good',
    salesPrice: 12000,
    costPrice: 7500,
    reorderPoint: 8,
    procureOnDemand: true,
    procurementType: 'MANUFACTURING',
    defaultBomId: 'BOM-002',
    onHand: 6,
    reserved: 4,
    freeToUse: 2,
  },
  {
    id: 'PROD-005',
    code: 'STL-ASY-SCR',
    name: 'Steel Assembly Screws',
    category: 'Raw Material',
    salesPrice: 5,
    costPrice: 2,
    reorderPoint: 200,
    procureOnDemand: false,
    onHand: 850,
    reserved: 150,
    freeToUse: 700,
  },
];

const INITIAL_MOVEMENTS: StockMovement[] = [
  { id: 'MVT-001', productId: 'PROD-001', date: '2026-06-10T10:00:00Z', direction: 'IN', quantity: 120, sourceType: 'ADJUSTMENT', sourceReference: 'ADJ-001', performedBy: 'Admin User', reason: 'Initial inventory load' },
  { id: 'MVT-002', productId: 'PROD-002', date: '2026-06-11T11:30:00Z', direction: 'IN', quantity: 100, sourceType: 'PO', sourceReference: 'PO-001', performedBy: 'Admin User', reason: 'Supplier purchase receipt' },
  { id: 'MVT-003', productId: 'PROD-002', date: '2026-06-12T09:15:00Z', direction: 'OUT', quantity: 15, sourceType: 'MO', sourceReference: 'MO-001', performedBy: 'Admin User', reason: 'Material staging for chairs production' },
  { id: 'MVT-004', productId: 'PROD-003', date: '2026-06-12T17:00:00Z', direction: 'IN', quantity: 15, sourceType: 'MO', sourceReference: 'MO-001', performedBy: 'Admin User', reason: 'Finished production output' },
  { id: 'MVT-005', productId: 'PROD-003', date: '2026-06-13T14:45:00Z', direction: 'OUT', quantity: 4, sourceType: 'SO', sourceReference: 'SO-001', performedBy: 'Admin User', reason: 'Customer delivery fulfillment' },
  { id: 'MVT-006', productId: 'PROD-004', date: '2026-06-14T10:30:00Z', direction: 'IN', quantity: 5, sourceType: 'MO', sourceReference: 'MO-002', performedBy: 'Admin User', reason: 'Production output table completion' },
  { id: 'MVT-007', productId: 'PROD-005', date: '2026-06-15T08:00:00Z', direction: 'IN', quantity: 1000, sourceType: 'PO', sourceReference: 'PO-002', performedBy: 'Admin User', reason: 'Purchase replenishment' },
  { id: 'MVT-008', productId: 'PROD-005', date: '2026-06-16T13:20:00Z', direction: 'OUT', quantity: 150, sourceType: 'MO', sourceReference: 'MO-002', performedBy: 'Admin User', reason: 'Table assembly fasteners consumption' },
  { id: 'MVT-009', productId: 'PROD-001', date: '2026-06-17T15:10:00Z', direction: 'OUT', quantity: 10, sourceType: 'MO', sourceReference: 'MO-002', performedBy: 'Admin User', reason: 'Table top preparation' },
  { id: 'MVT-010', productId: 'PROD-004', date: '2026-06-18T16:40:00Z', direction: 'IN', quantity: 2, sourceType: 'MO', sourceReference: 'MO-003', performedBy: 'Admin User', reason: 'Custom dining table order finished' },
];

// ─── Context & Provider ──────────────────────────────────────────

const DbContext = createContext<DbContextState | null>(null);

export function DbProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(INITIAL_MOVEMENTS);
  const [vendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [boms] = useState<Bom[]>(INITIAL_BOMS);

  const addProduct = (input: Omit<Product, 'id' | 'onHand' | 'reserved' | 'freeToUse'>) => {
    const code = input.code || `PROD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newProduct: Product = {
      ...input,
      id: `PROD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      code,
      onHand: 0,
      reserved: 0,
      freeToUse: 0,
    };
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const merged = { ...p, ...updatedFields };
          // enforce constraints
          merged.freeToUse = merged.onHand - merged.reserved;
          return merged;
        }
        return p;
      })
    );
  };

  const adjustStock = (productId: string, direction: 'IN' | 'OUT', quantity: number, reason: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const delta = direction === 'IN' ? quantity : -quantity;
          const newOnHand = Math.max(0, p.onHand + delta);
          const newFreeToUse = newOnHand - p.reserved;
          return {
            ...p,
            onHand: newOnHand,
            freeToUse: newFreeToUse,
          };
        }
        return p;
      })
    );

    const adjustmentId = `ADJ-${Math.floor(100 + Math.random() * 900)}`;
    const newMovement: StockMovement = {
      id: `MVT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      productId,
      date: new Date().toISOString(),
      direction,
      quantity,
      sourceType: 'ADJUSTMENT',
      sourceReference: adjustmentId,
      performedBy: user?.name || 'Guest User',
      reason,
    };

    setStockMovements((prev) => [newMovement, ...prev]);
  };

  return (
    <DbContext.Provider
      value={{
        products,
        stockMovements,
        vendors,
        boms,
        addProduct,
        updateProduct,
        adjustStock,
      }}
    >
      {children}
    </DbContext.Provider>
  );
}

export function useDb() {
  const ctx = useContext(DbContext);
  if (!ctx) {
    throw new Error('useDb must be used within a DbProvider');
  }
  return ctx;
}
