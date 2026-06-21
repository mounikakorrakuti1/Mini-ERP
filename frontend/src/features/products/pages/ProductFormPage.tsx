import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDb } from '@/store/db.store';
import { ROUTES } from '@/routes/routeMap';
import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import { ProductForm } from '../components/ProductForm';

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { addProduct, updateProduct } = useDb();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      api.get(`/products/${id}`).then(res => {
        setProduct(res.data.data);
      }).catch(() => {
        setError('Failed to load product');
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  const handleSubmit = async (data: any) => {
    try {
      if (isEdit && id) {
        await updateProduct(id, data);
      } else {
        await addProduct(data);
      }
      navigate(ROUTES.PRODUCTS);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save product.');
    }
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>Loading product details...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <button type="button" className="btn btn--icon" onClick={() => navigate(ROUTES.PRODUCTS)}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="h2">{isEdit ? 'Edit Product' : 'New Product'}</h1>
      </div>

      {error && (
        <div style={{ padding: 'var(--space-sm) var(--space-md)', backgroundColor: 'rgba(229,62,62,0.08)', border: '1px solid var(--status-danger)', borderRadius: '8px', color: 'var(--status-danger)', fontSize: 'var(--text-sm)' }}>
          {error}
        </div>
      )}

      <ProductForm 
        initialData={product} 
        onSubmit={handleSubmit} 
        onCancel={() => navigate(ROUTES.PRODUCTS)} 
      />
    </div>
  );
}
