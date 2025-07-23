import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-xl text-center space-y-6 p-6">
        <h1 className="text-4xl font-bold">Commission Tracker</h1>
        <p className="text-lg text-gray-700">
          Track referrals, commissions, and invite your partners—all in one
          place.
        </p>

        <SignedOut>
          <SignInButton>
            <button className="bg-blue-600 text-white px-6 py-2 rounded">
              Sign In / Sign Up
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <div className="space-x-4">
            <UserButton />
            <a
              href="/dashboard"
              className="bg-green-600 text-white px-6 py-2 rounded"
            >
              Go to Dashboard
            </a>
          </div>
        </SignedIn>
      </div>
    </main>
  );
}
