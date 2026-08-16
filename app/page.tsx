import Image from 'next/image';
import { connectToDatabase } from '@/lib/mongodb';
import ProductModel from '@/lib/models/Product';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

async function getProducts(query?: string): Promise<Product[]> {
  await connectToDatabase();
  const filter = query ? { title: { $regex: query, $options: 'i' } } : {};
  const products = await ProductModel.find(filter).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(products));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'category';
}

export default async function HomePage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  const products = await getProducts(searchParams.q);
  const isSearching = Boolean(searchParams.q);

  // Group products by category, preserving the order categories first appear in.
  const categoryOrder: string[] = [];
  const categoryMap = new Map<string, Product[]>();
  for (const product of products) {
    const category = product.category || 'General';
    if (!categoryMap.has(category)) {
      categoryOrder.push(category);
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(product);
  }

  const heroPicks = products.slice(0, 3);

  return (
    <div>
      <div className="mb-7 grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        {/* ===== Sidebar ===== */}
        <aside className="h-fit overflow-hidden rounded-xl2 border border-border bg-white shadow-card">
          <div className="flex items-center gap-2.5 bg-brand px-4 py-3 text-[14.5px] font-bold text-white">
            <span>☰</span> All Categories
          </div>
          <ul>
            {categoryOrder.length === 0 ? (
              <li className="px-4 py-3 text-[13.3px] text-muted">No categories yet</li>
            ) : (
              categoryOrder.map((category) => {
                const thumb = categoryMap.get(category)?.[0]?.imageUrl;
                return (
                  <li key={category} className="border-b border-border last:border-b-0">
                    <a
                      href={`#cat-${slugify(category)}`}
                      className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-brand-light"
                    >
                      {thumb ? (
                        <span className="relative block h-[30px] w-[30px] flex-shrink-0 overflow-hidden rounded-md bg-brand-light">
                          <Image src={thumb} alt="" fill sizes="30px" className="object-cover" />
                        </span>
                      ) : (
                        <span className="block h-[30px] w-[30px] flex-shrink-0 rounded-md bg-brand-light" />
                      )}
                      <span className="flex-1 truncate text-[13.3px] font-medium text-navy">{category}</span>
                      <span className="flex-shrink-0 text-[#B8C6CE]">›</span>
                    </a>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        {/* ===== Hero banner ===== */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl2 bg-gradient-to-br from-navy via-brand-dark to-brand p-6 pb-4 text-white shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3.5">
            <div className="flex items-center gap-2">
              <span className="block h-[34px] w-[34px] overflow-hidden rounded-lg bg-white">
                <Image src="/logo.png" alt="Sabit Gadget's Zone logo" width={34} height={34} className="h-full w-full object-cover" />
              </span>
              <span className="text-[11px] font-bold leading-tight text-[#D9F1FB]">
                SABIT
                <br />
                GADGET&apos;S ZONE
              </span>
            </div>

            <div className="max-w-[330px]">
              <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-teal" /> নতুন কালেকশন লাইভ
              </span>
              <h2 className="mb-2.5 text-[27px] font-bold leading-tight">
                বড় ছাড়ে
                <br />
                গ্যাজেট কিনুন
              </h2>
              <span className="inline-block rounded-lg bg-white px-3.5 py-1.5 text-sm font-extrabold text-brand-dark">
                সর্বোচ্চ ১৫% ছাড়
              </span>
            </div>

            <div className="flex flex-wrap gap-4">
              {heroPicks.length === 0 ? (
                <span className="text-[11px] text-white/70">নতুন প্রোডাক্ট শীঘ্রই আসছে</span>
              ) : (
                heroPicks.map((product) => (
                  <div key={product._id} className="w-[96px] text-center">
                    <div className="relative mx-auto mb-1.5 h-[88px] w-[88px] overflow-hidden rounded-full border-[3px] border-white/50 bg-white shadow-card-lg">
                      <Image src={product.imageUrl} alt={product.title} fill sizes="88px" className="object-cover" />
                    </div>
                    <span className="inline-block truncate rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
                      {product.title}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="my-4 flex flex-wrap gap-2.5">
            <div className="flex min-w-[120px] flex-1 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[11px] font-semibold">
              🔄 বদলি সুবিধা
            </div>
            <div className="flex min-w-[120px] flex-1 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[11px] font-semibold">
              🛡️ সেরা মানের প্রোডাক্ট
            </div>
            <div className="flex min-w-[120px] flex-1 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[11px] font-semibold">
              🚚 সুপার ফাস্ট ডেলিভারি
            </div>
            <div className="flex min-w-[120px] flex-1 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[11px] font-semibold">
              ২৪/৭ কাস্টমার সাপোর্ট
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-full bg-white px-4 py-2 text-[11.5px] font-semibold text-navy">
            <span className="flex items-center gap-1.5">🌐 www.sabitgadgetzone.com</span>
            <span className="flex items-center gap-1.5">✉️ sabitgadgetzone09@gmail.com</span>
            <span className="flex items-center gap-1.5">📍 Feni, Chattogram</span>
          </div>
        </div>
      </div>

      {/* ===== Product sections ===== */}
      {isSearching ? (
        <div className="mb-8">
          <div className="mb-4 flex items-end justify-between border-b border-border pb-2">
            <h2 className="relative pb-2 text-[18.5px] font-extrabold text-navy after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-11 after:rounded after:bg-brand">
              Results for &quot;{searchParams.q}&quot;
              <span className="ml-2 text-sm font-normal text-muted">({products.length})</span>
            </h2>
          </div>
          {products.length === 0 ? (
            <div className="rounded-xl2 border border-dashed border-border bg-white p-10 text-center text-muted">
              No products matched your search.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-border bg-white p-10 text-center text-muted">
          No products yet. Log in as an admin and add your first product, or run{' '}
          <code className="rounded bg-brand-light px-1.5 py-0.5">npm run seed</code>.
        </div>
      ) : (
        categoryOrder.map((category) => {
          const categoryProducts = categoryMap.get(category) || [];
          return (
            <div key={category} id={`cat-${slugify(category)}`} className="mb-8 scroll-mt-24">
              <div className="mb-4 flex items-end justify-between">
                <h2 className="relative pb-2 text-[18.5px] font-extrabold uppercase tracking-wide text-navy after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-11 after:rounded after:bg-brand">
                  {category}
                  <span className="ml-2 text-sm font-normal normal-case text-muted">({categoryProducts.length})</span>
                </h2>
                <a
                  href={`#cat-${slugify(category)}`}
                  className="flex items-center gap-1.5 rounded-md bg-brand px-4 py-1.5 text-xs font-bold text-white transition hover:bg-brand-dark"
                >
                  সব দেখুন →
                </a>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {categoryProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
