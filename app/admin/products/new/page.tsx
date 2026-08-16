import ProductForm from '@/components/ProductForm';

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-5 text-xl font-extrabold text-navy">Add product</h1>
      <ProductForm mode="create" />
    </div>
  );
}
