export interface ProductFormErrors {
  name?: string;
  reference?: string;
  salesPrice?: string;
  costPrice?: string;
  reorderPoint?: string;
  procurementType?: string;
  defaultVendorId?: string;
  defaultBomId?: string;
}

export interface ProductFormData {
  name: string;
  reference: string;
  category: 'RAW_MATERIAL' | 'FINISHED_GOOD' | 'SERVICE';
  salesPrice: number;
  costPrice: number;
  reorderPoint: number;
  procureOnDemand: boolean;
  procurementType?: 'PURCHASE' | 'MANUFACTURING';
  defaultVendorId?: string;
  defaultBomId?: string;
}

export function validateProduct(data: ProductFormData) {
  const errors: ProductFormErrors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Product name is required';
  }
  if (!data.reference || !data.reference.trim()) {
    errors.reference = 'Product code/reference is required';
  }
  if (isNaN(data.salesPrice) || data.salesPrice < 0) {
    errors.salesPrice = 'Sales price must be 0 or greater';
  }
  if (isNaN(data.costPrice) || data.costPrice < 0) {
    errors.costPrice = 'Cost price must be 0 or greater';
  }
  if (isNaN(data.reorderPoint) || data.reorderPoint < 0) {
    errors.reorderPoint = 'Reorder point must be 0 or greater';
  }

  if (data.procureOnDemand) {
    if (!data.procurementType) {
      errors.procurementType = 'Procurement type is required';
    } else if (data.procurementType === 'PURCHASE' && !data.defaultVendorId) {
      errors.defaultVendorId = 'Default vendor is required for Purchase';
    } else if (data.procurementType === 'MANUFACTURING' && !data.defaultBomId) {
      errors.defaultBomId = 'Default BoM is required for Manufacturing';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
