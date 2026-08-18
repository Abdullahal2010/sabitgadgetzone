'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Product } from '@/types';

export default function AdminProductRow({
  product,
  canEdit,
  canDelete
}: {
  product: Product;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${product.title}"?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/products/${product._id}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) router.refresh();
    else alert('Failed to delete product.');
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="flex items-center gap-2 py-2.5 pr-3">
        <img src={product.imageUrl} alt="" className="h-9 w-9 rounded-md object-cover" />
        <span className="text-sm font-medium text-navy">{product.title}</span>
      </td>
      <td className="py-2.5 pr-3 font-mono text-sm">৳{product.price.toLocaleString()}</td>
      <td className="py-2.5 pr-3 text-sm">{product.stock}</td>
      <td className="py-2.5 pr-3 text-sm text-muted">{product.category}</td>
      <td className="py-2.5 text-right">
        {canEdit && (
          <Link
            href={`/admin/products/${product._id}`}
            className="mr-3 text-sm font-semibold text-brand hover:underline"
          >
            Edit
          </Link>
        )}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm font-semibold text-red-500 hover:underline disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
        {!canEdit && !canDelete && <span className="text-xs text-muted">View only</span>}
      </td>
    </tr>
  );
}
