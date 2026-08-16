'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';

interface Props {
  mode: 'create' | 'edit';
  initial?: Product;
}

export default function ProductForm({ mode, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    price: initial?.price ?? 0,
    buyPrice: initial?.buyPrice ?? 0,
    imageUrl: initial?.imageUrl ?? '',
    stock: initial?.stock ?? 0,
    category: initial?.category ?? 'General'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const url = mode === 'create' ? '/api/products' : `/api/products/${initial?._id}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Something went wrong.');
      return;
    }
    router.push('/admin/products');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4 rounded-xl2 border border-border bg-white p-6">
      <label className="flex flex-col gap-1 text-sm font-medium text-navy">
        Title
        <input
          required
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-navy">
        Description
        <textarea
          required
          rows={4}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Selling price (৳)
          <input
            required
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => update('price', Number(e.target.value))}
            className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Buy / cost price (৳)
          <input
            type="number"
            min={0}
            value={form.buyPrice}
            onChange={(e) => update('buyPrice', Number(e.target.value))}
            className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-navy">
        Image URL
        <input
          required
          value={form.imageUrl}
          onChange={(e) => update('imageUrl', e.target.value)}
          placeholder="https://images.unsplash.com/..."
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Stock
          <input
            required
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => update('stock', Number(e.target.value))}
            className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Category
          <input
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-brand py-2.5 font-bold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? 'Saving…' : mode === 'create' ? 'Add product' : 'Save changes'}
      </button>
    </form>
  );
}
