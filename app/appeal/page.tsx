import Link from 'next/link';

// A placeholder destination for the "your account is banned" notification
// link. Real appeal/discussion-with-admins functionality (the Socket.io
// live-chat feature discussed separately) comes later — for now this just
// gives the notification link somewhere real to land, with a clear
// "coming soon" message instead of a dead link or a 404.
export default function AppealPage() {
  return (
    <div className="mx-auto max-w-lg rounded-xl2 border border-border bg-white p-8 text-center shadow-card-lg">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 3.5c-3 0-5.4 2.4-5.4 5.4v3.3c0 .6-.2 1.2-.6 1.7L4.5 15.6c-.6.8 0 2 1 2h13c1 0 1.6-1.2 1-2l-1.5-1.7c-.4-.5-.6-1.1-.6-1.7V8.9c0-3-2.4-5.4-5.4-5.4Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="mt-4 text-xl font-extrabold text-navy">Appeal your account status</h1>
      <p className="mt-2 text-sm text-muted">
        Direct messaging with an admin to appeal a ban or restriction is coming soon. When it launches, you&apos;ll
        be able to explain your side and get a response right here.
      </p>
      <button
        disabled
        className="mt-5 w-full cursor-not-allowed rounded-full bg-border py-3 text-sm font-bold text-muted"
      >
        Start an appeal — coming soon
      </button>
      <Link href="/profile" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
        ← Back to your profile
      </Link>
    </div>
  );
}
