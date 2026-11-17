import Image from "next/image"
import Link from "next/link"

import { Logo } from "@/components/Shared/Logo"
import { RedirectIfAuthed } from "@/components/auth/RedirectIfAuthed"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <RedirectIfAuthed />
      <div className="grid min-h-svh lg:grid-cols-2">
        {/* Branding panel */}
        <div className="relative hidden isolate overflow-hidden lg:block">
          <Image
            src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80"
            alt="Wedding reception tables decorated with flowers and candles"
            fill
            sizes="50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-primary/20" />
          <div className="relative flex h-full flex-col justify-between p-10 text-primary-foreground">
            <div className="w-fit rounded-2xl bg-background/10 p-2 backdrop-blur-sm [&_span]:text-white">
              <Logo />
            </div>
            <blockquote className="max-w-md space-y-4">
              <p className="font-heading text-3xl leading-snug font-medium text-balance">
                &ldquo;We found our venue, photographer and caterer in one
                weekend — everything else just fell into place.&rdquo;
              </p>
              <footer className="text-sm text-primary-foreground/80">
                Aisha &amp; Rahim — married June 2025
              </footer>
            </blockquote>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col px-4 py-8 sm:px-8">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
            <div className="mb-8 flex justify-center lg:hidden">
              <Logo />
            </div>
            {children}
          </div>
          <div className="mx-auto w-full max-w-md">
            <p className="text-center text-xs text-muted-foreground">
              <Link
                href="/"
                className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                ← Back to WedPlan home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
