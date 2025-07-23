import { type Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Commission Tracker",
  description: "Track referrals, invite partners, and manage commissions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-neutral-950 text-white">
      <ClerkProvider
        signInForceRedirectUrl="/auth/complete"
        signUpForceRedirectUrl="/auth/complete"
        signInFallbackRedirectUrl="/auth/complete"
        signUpFallbackRedirectUrl="/auth/complete"
      >
        <body
          className={`${geistSans.variable} ${geistMono.variable} min-h-full font-sans antialiased`}
        >
          <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-neutral-950 to-neutral-900 border-b border-neutral-800 backdrop-blur-sm shadow-md">
            <div className="relative flex items-center justify-center h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-white">
                Commission Tracker
              </h1>
              <nav className="absolute right-4 sm:right-6 lg:right-8 flex items-center gap-3 text-sm font-medium">
                <SignedOut>
                  <SignInButton>
                    <button className="px-4 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-600">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="px-4 py-1.5 rounded-md bg-neutral-700 hover:bg-neutral-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500">
                      Sign Up
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </nav>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </body>
      </ClerkProvider>
    </html>
  );
}
