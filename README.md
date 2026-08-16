# Sabit Gadget's Zone

A Next.js 14 (App Router + TypeScript) e-commerce storefront and admin panel,
backed by MongoDB, with email-verified phone-or-email authentication and a
real Bangladeshi payment gateway.

## 1. Stack

| Concern         | Choice                                                                 |
|------------------|-------------------------------------------------------------------------|
| Framework        | Next.js 14, **App Router**, TypeScript (strict)                         |
| Styling          | Tailwind CSS                                                             |
| Database         | MongoDB via Mongoose                                                     |
| Shopper auth     | Registration collects name/phone/email/password/DOB/gender, proves EMAIL ownership via a 6-digit code sent through Resend (see `lib/emailOtp.ts` + `lib/resend.ts`), then creates the account. Login accepts either the phone number or the email, plus the password, through a single NextAuth (Auth.js) Credentials provider — see `lib/authOptions.ts`. Phone is stored but no longer OTP-verified. |
| Admin auth       | A single fixed credential pair from `.env`, exchanged for a signed, expiring session token (HMAC-SHA256 via Web Crypto) — see `lib/adminSession.ts`. No password hashing, since there's only ever one admin account; don't reuse this pattern for multi-user credentials. |
| Cart / Wishlist  | Client-side React Context + `localStorage` — no DB writes until checkout |
| Wallet balance   | Client-side React state only ("Add money" is a UI demo, not a real balance — nothing is charged or persisted) |
| Payments         | [DeshiPay](https://deshipay.themedokan.com) (bKash / Nagad / Rocket / Upay) — see §5 |
| Reviews          | One rating + comment per (order, product), unlockable only once that order ships — see §6 |

## 2. Project structure

```
app/
  layout.tsx, providers.tsx    # fonts + Cart/Wishlist/User context providers
  page.tsx                     # storefront home (reads Mongo directly, category-grouped)
  products/[id]/                # product detail + reviews
  cart/, wishlist/               # client-side, localStorage-backed
  login/                          # phone-or-email + password -> session
  onboarding/                      # legacy first-login profile form (name/dob/address) — unused by the current registration flow, kept for old sessions
  profile/                          # order history, reviews, demo wallet
  checkout/, checkout/success/, checkout/cancel/   # DeshiPay handoff + confirmation
  admin/
    layout.tsx                 # admin shell (sidebar nav)
    login/                      # admin login (no sidebar)
    dashboard/                   # stats (products/orders/users/revenue)
    products/                     # list, [id] edit, new/ create
    orders/                        # list + status update
    users/                          # list + add + remove
  api/
    auth/[...nextauth]/          # NextAuth handler (identifier-password Credentials provider)
    auth/email-otp/request/       # sends the 6-digit registration code via Resend, our own per-email rate limit
    auth/admin-login/              # admin login/logout, issues the signed admin cookie
    checkout/create-payment/        # re-prices cart from DB, opens a DeshiPay session
    checkout/verify/                 # THE ONLY place an order is marked paid
    webhooks/deshipay/                # untrusted "go check" nudge -> re-runs verify
    products/, products/[id]/          # GET public, POST/PUT/DELETE admin-only
    orders/, orders/[id]/               # GET (own orders / admin), PATCH admin-only
    users/, users/[id]/                  # GET/POST/DELETE admin-only
    users/me/, users/onboarding/          # signed-in shopper's own profile
    reviews/                               # GET public/own, POST gated on shipped order
components/                # Header, Footer, ProductCard, review + admin widgets…
contexts/                  # CartContext, WishlistContext, UserContext
lib/
  mongodb.ts               # cached Mongoose connection
  auth.ts, adminSession.ts, authConstants.ts   # signed admin session cookie
  authOptions.ts            # NextAuth config (identifier-password Credentials provider — phone OR email)
  emailOtp.ts                # generates/hashes/stores/verifies the 6-digit email code
  resend.ts                   # Resend client + branded OTP email template (inline logo via cid)
  otpRateLimit.ts            # per-email OTP request rate limiting
  deshipay.ts                 # DeshiPay API client (create-payment / verify)
  reviewAggregate.ts           # recomputes a product's rating average/count
  models/                       # Product, User, Order, Review, OtpRateLimit, EmailOtp
scripts/seed.ts             # inserts placeholder products
middleware.ts               # guards /admin/*, shopper-only pages, and write APIs
```

## 3. Run it locally

```bash
npm install
cp .env.example .env.local     # fill in every variable — see §4
npm run seed                    # optional: adds 6 placeholder products
npm run dev                     # http://localhost:3000
```

Admin login is at `/admin/login`, using whatever `ADMIN_EMAIL` /
`ADMIN_PASSWORD` you set in `.env.local` (there is no default — login
fails closed if these are unset).

Shopper registration is at `/register` — fill in name/phone/email/password/
DOB/gender, then enter the 6-digit code emailed to you (via Resend) to
create the account. Shopper login is at `/login` — enter **either** your
phone number or your email, plus your password.

**Resend sandbox limitation:** until you verify a sending domain in the
Resend dashboard, emails can only be delivered to the email address your
Resend account itself was signed up with, from the shared address
`onboarding@resend.dev`. You can still register multiple test accounts by
using Gmail's `+tag` trick (e.g. `you+test1@gmail.com`,
`you+test2@gmail.com`) — all land in the same inbox, but count as distinct
accounts. Once you verify a real domain, set `EMAIL_FROM` in `.env.local`
(see §4) and any real email address can register.

## 4. Environment variables

```
MONGODB_URI=                    # MongoDB Atlas or local connection string
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=            # random string; signs the admin session cookie

NEXTAUTH_SECRET=                  # random string; signs the shopper NextAuth JWT
NEXTAUTH_URL=                      # e.g. http://localhost:3000 in dev

# Resend (email OTP for registration) — https://resend.com/api-keys
RESEND_API_KEY=
# Optional: set once a domain is verified in Resend, e.g.
#   EMAIL_FROM="Sabit Gadget's Zone <otp@yourdomain.com>"
# Until then, falls back to Resend's shared sandbox address
# (onboarding@resend.dev), which can only deliver to the email your Resend
# account was signed up with.
EMAIL_FROM=

# Optional OTP rate-limit tuning (see lib/otpRateLimit.ts for defaults)
OTP_MAX_PER_WINDOW=5
OTP_WINDOW_MINUTES=60
OTP_MIN_SECONDS_BETWEEN_REQUESTS=60

# DeshiPay
DESHIPAY_API_KEY=
```

## 5. Payments (DeshiPay)

Checkout works like this:

1. `/checkout` sends the cart + an email to `POST /api/checkout/create-payment`.
2. That route **re-prices every line item from MongoDB** (never trusting
   client-sent prices), checks stock, creates a `pending` `Order`, and asks
   DeshiPay for a hosted `payment_url`.
3. The customer picks bKash / Nagad / Rocket / Upay on DeshiPay's hosted
   page and pays.
4. DeshiPay redirects back to `/checkout/success` (or `/checkout/cancel`)
   with a `transactionId`.
5. The success page calls `POST /api/checkout/verify`, which is **the only
   place an order is ever marked paid** — it always re-checks directly with
   DeshiPay's server-to-server verify endpoint, is idempotent, and only
   decrements stock / increments `sold` once, even under concurrent calls.
6. `POST /api/webhooks/deshipay` exists as a secondary nudge (DeshiPay
   doesn't document a signed-webhook mechanism, so its payload is never
   trusted by itself) — it just re-triggers the same verify step.

Known limitation: DeshiPay's free/entry plan collects payments into a
personal, not merchant, bKash/Nagad account. Fine for early testing; revisit
before real volume.

## 6. Email verification (registration)

1. `/register` collects name/phone/email/password/DOB/gender, then calls
   `POST /api/auth/email-otp/request`, which checks no account already
   uses that phone or email, applies a per-email rate limit
   (`lib/otpRateLimit.ts`), generates a 6-digit code, stores its bcrypt
   hash + a 10-minute expiry (`lib/models/EmailOtp.ts`), and emails it via
   Resend (`lib/resend.ts`) using a template with the logo embedded as a
   `cid` inline attachment (not a hosted URL or base64 data URI — the most
   reliable way to get a logo through Gmail/Outlook).
2. The code is entered into six separate boxes (`components/OtpInput.tsx`)
   — auto-advancing focus, paste support, and auto-submit the instant the
   6th digit lands, no button needed.
3. That submit calls `POST /api/auth/register` with the code alongside the
   rest of the form. The route re-checks the code against the stored hash
   (`lib/emailOtp.ts`) — never trusting the client — and only then creates
   the `User` document and signs them in.
4. A wrong code clears the boxes and shows an error, staying on the same
   step; a code is capped at 5 wrong guesses and a 10-minute lifetime
   before it has to be resent.

## 7. Reviews

A shopper can rate a product only if they actually ordered it, and only
once that specific order's status is `shipped` or `delivered` — enforced
in `POST /api/reviews`. One review per (order, product) pair; resubmitting
updates the same review. `lib/reviewAggregate.ts` recomputes the product's
`ratingAverage`/`ratingCount` after every write so product cards and the
detail page can read them with no extra join.

## 8. Data flow: admin action → storefront

There's no websocket/polling layer — pages are server components with
`export const dynamic = 'force-dynamic'`, so every request re-reads
MongoDB. That's the simplest correct way to make "admin adds a product" →
"shopper sees it" and "shopper checks out" → "admin sees the order" both
true without extra infrastructure.

## 9. Access control summary

- `/admin/*` pages and any non-GET request to `/api/products`,
  `/api/users`, `/api/orders` require a valid signed `admin_session`
  cookie (checked in `middleware.ts`).
- `GET /api/users` and `GET /api/orders` additionally require admin auth
  at the route-handler level (middleware only covers non-GET on those
  prefixes) — an unauthenticated caller gets only their *own* order
  history via their NextAuth session, never another shopper's, and never
  the full user list.
- `/profile`, `/checkout`, `/onboarding` require a valid NextAuth session
  (signed in with phone or email + password). A not-yet-onboarded session
  is redirected to `/onboarding`; an already-onboarded session hitting
  `/onboarding` is redirected to `/profile`. In practice every account
  created through `/register` is fully onboarded already, so this path is
  now only relevant to old sessions from before this flow existed.
- `/api/checkout/*` and `/api/webhooks/deshipay` are intentionally outside
  the middleware's admin-write matcher — checkout is a shopper action
  gated by its own session check, and the webhook must stay reachable by
  DeshiPay's servers with no session at all.

## 10. Deployment (Vercel, typical case)

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add every variable from §4 as Environment Variables in the Vercel
   project settings (use an Atlas connection string — a locally-run
   MongoDB isn't reachable from Vercel's servers).
4. Deploy. `next build` runs automatically.

## 11. Known gaps / next steps

- No image upload — products take an image **URL**. Add S3/Cloudinary
  upload as an enhancement if needed.
- No pagination on `/admin/products` or `/admin/orders` — fine for a
  demo-sized catalog, add it once product counts grow.
- Admin is a single fixed account — if you ever need more than one admin
  user, replace the env-credential check with a real per-admin-user
  credential store.
