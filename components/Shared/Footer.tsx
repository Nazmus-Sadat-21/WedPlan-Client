import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"

import { Logo } from "@/components/Shared/Logo"

const EXPLORE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/browse-services", label: "Browse Services" },
  { href: "/sign-in", label: "Sign In" },
  { href: "/sign-up", label: "Create Account" },
] as const

const CATEGORY_LINKS = [
  "Photography & Videography",
  "Wedding Venues",
  "Decoration & Florist",
  "Catering Services",
] as const

/** Brand icons are not shipped with lucide, so they are inlined here. */
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072 1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.6786c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
    </svg>
  )
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  )
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M23.498 6.186a3.274 3.274 0 0 0-2.315-2.315C19.409 3.323 12 3.323 12 3.323s-7.409 0-9.183.548A3.274 3.274 0 0 0 .502 6.186C0 7.96 0 12 0 12s0 4.04.502 5.814a3.274 3.274 0 0 0 2.315 2.315c1.774.548 9.183.548 9.183.548s7.409 0 9.183-.548a3.274 3.274 0 0 0 2.315-2.315C24 16.04 24 12 24 12s0-4.04-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

const SOCIAL_LINKS = [
  { href: "https://facebook.com", label: "Facebook", icon: FacebookIcon },
  { href: "https://instagram.com", label: "Instagram", icon: InstagramIcon },
  { href: "https://x.com", label: "X (Twitter)", icon: XIcon },
  { href: "https://youtube.com", label: "YouTube", icon: YoutubeIcon },
] as const

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-rose-200/50 bg-[#2C2426] text-stone-200">
      {/* Soft background glow accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 -z-10 h-96 w-96 rounded-full bg-rose-950/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-10 -z-10 h-80 w-80 rounded-full bg-[#B76E79]/10 blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="[&_span]:text-stone-100">
              <Logo />
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-stone-400">
              WedPlan helps couples discover trusted wedding vendors, compare
              services, and book everything for their big day in one place.
            </p>
            <div className="flex items-center gap-2.5">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900/60 text-stone-300 shadow-2xs backdrop-blur-sm transition-all duration-300 hover:border-[#B76E79] hover:bg-[#B76E79] hover:text-white"
                >
                  <social.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-heading text-sm font-semibold tracking-wider text-stone-100 uppercase">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-400 transition-colors hover:text-[#C58970]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-heading text-sm font-semibold tracking-wider text-stone-100 uppercase">
              Categories
            </h3>
            <ul className="mt-4 space-y-2.5">
              {CATEGORY_LINKS.map((category) => (
                <li key={category}>
                  <Link
                    href={`/browse-services?category=${encodeURIComponent(category)}`}
                    className="text-sm text-stone-400 transition-colors hover:text-[#C58970]"
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading text-sm font-semibold tracking-wider text-stone-100 uppercase">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-stone-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#B76E79]" />
                122 Rosewood Avenue, Dhaka 1205
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-[#B76E79]" />
                <a
                  href="tel:+880155555555"
                  className="transition-colors hover:text-[#C58970]"
                >
                  +880 1555-555555
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-[#B76E79]" />
                <a
                  href="mailto:hello@wedplan.com"
                  className="transition-colors hover:text-[#C58970]"
                >
                  hello@wedplan.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-stone-800 pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-stone-500">
            © {new Date().getFullYear()} WedPlan. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-stone-500">
            <Link
              href="/"
              className="transition-colors hover:text-[#C58970]"
            >
              WedPlan
            </Link>
            — craft your celebration
          </p>
        </div>
      </div>
    </footer>
  )
}