import { useNavigate } from 'react-router-dom';
import { useDb } from '@/store/db.store';
import { ProductForm } from '../components/ProductForm';
import { ROUTES } from '@/routes/routeMap';
import type { ProductFormData } from '../products.validation';
import { ArrowLeft } from 'lucide-react';

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { addProduct } = useDb();

  const handleSubmit = (data: ProductFormData) => {
    addProduct(data);
    navigate(ROUTES.PRODUCTS);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div>
        <button
          className="btn btn--outline"
          onClick={() => navigate(ROUTES.PRODUCTS)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Catalog</span>
        </button>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.PRODUCTS)}
      />
    </div>
  );
}
