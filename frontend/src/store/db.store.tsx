import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useAuthStore } from './auth.store';
import { api } from '@/lib/api';

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
  available: number; // returned by balance endpoint
}

export interface StockMovement {
  id: string;
  productId: string;
  createdAt: string; // date field from API
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
  customers: any[];
  boms: Bom[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  addProduct: (product: any) => Promise<Product>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  adjustStock: (productId: string, direction: 'IN' | 'OUT', quantity: number, reason: string) => Promise<void>;
}

// ─── Context & Provider ──────────────────────────────────────────

const DbContext = createContext<DbContextState | null>(null);

export function DbProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [invRes, movRes, vndRes, bomRes, custRes] = await Promise.all([
        api.get('/inventory/summary'),
        api.get('/inventory/movements'),
        api.get('/vendors'),
        api.get('/bom'),
        api.get('/customers'),
      ]);
      // Normalize freeToUse (backend might return 'available')
      const normalizedProducts = invRes.data.data.map((p: any) => ({
        ...p,
        onHand: p.onHand || 0,
        reserved: p.reserved || 0,
        freeToUse: p.available || p.freeToUse || 0,
      }));
      setProducts(normalizedProducts);
      setStockMovements(movRes.data.data.map((m: any) => ({ ...m, date: m.createdAt })));
      setVendors(vndRes.data.data);
      setBoms(bomRes.data.data);
      setCustomers(custRes.data.data);
    } catch (error) {
      console.error('Failed to load DB data', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addProduct = async (input: any) => {
    const res = await api.post('/products', input);
    await refreshData();
    return res.data.data;
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    await api.patch(`/products/${id}`, updatedFields);
    await refreshData();
  };

  const adjustStock = async (productId: string, direction: 'IN' | 'OUT', quantity: number, reason: string) => {
    await api.post(`/products/${productId}/adjust-stock`, {
      direction,
      quantity,
      reason
    });
    await refreshData();
  };

  return (
    <DbContext.Provider
      value={{
        products,
        stockMovements,
        vendors,
        customers,
        boms,
        isLoading,
        refreshData,
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
