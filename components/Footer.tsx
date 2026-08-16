import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-10 bg-navy text-white">
      <div className="mx-auto grid max-w-[1560px] gap-8 px-5 py-10 md:grid-cols-4">
        <div>
          <h3 className="text-lg font-extrabold">Sabit Gadget&apos;s Zone</h3>
          <p className="mt-2 text-sm text-white/70">
            Your trusted hub for gadgets and home tech — quality, reliability and fast delivery,
            straight to your doorstep.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold text-white/90">Quick Links</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/">Shop</Link></li>
            <li><Link href="/cart">Cart</Link></li>
            <li><Link href="/wishlist">Wishlist</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold text-white/90">Account</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/login">Login</Link></li>
            <li><Link href="/profile">My account</Link></li>
            <li><Link href="/admin/login">Seller / Admin login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold text-white/90">Contact</h4>
          <p className="text-sm text-white/70">Dhaka, Bangladesh</p>
          <p className="text-sm text-white/70">support@sabitgadgets.com</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Sabit Gadget&apos;s Zone. All rights reserved.
      </div>
    </footer>
  );
}
