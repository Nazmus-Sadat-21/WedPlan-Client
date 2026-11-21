export const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_API ?? ""

export const API_ENDPOINTS = {
  services: `${API_BASE_URL}/services`,
  serviceById: (id: string) => `${API_BASE_URL}/services/${id}`,
  serviceStatus: (id: string) => `${API_BASE_URL}/services/${id}/status`,
  adminServices: `${API_BASE_URL}/admin/services`,
  adminServiceById: (id: string) => `${API_BASE_URL}/admin/services/${id}`,
  vendorServices: `${API_BASE_URL}/vendor/services`,
  users: `${API_BASE_URL}/users`,
  userById: (id: string) => `${API_BASE_URL}/users/${id}`,
  publicVendor: (id: string) => `${API_BASE_URL}/vendors/${id}`,
  blockUser: (id: string) => `${API_BASE_URL}/users/${id}/block`,
  unblockUser: (id: string) => `${API_BASE_URL}/users/${id}/unblock`,
  bookings: `${API_BASE_URL}/bookings`,
  customerBookings: (customerId: string) =>
    `${API_BASE_URL}/bookings/customer/${customerId}`,
  vendorBookings: (vendorId: string) =>
    `${API_BASE_URL}/bookings/vendor/${vendorId}`,
  cancelBooking: (id: string) => `${API_BASE_URL}/bookings/${id}/cancel`,
  bookingStatus: (id: string) => `${API_BASE_URL}/bookings/${id}/status`,
  createCheckoutSession: `${API_BASE_URL}/create-checkout-session`,
  transactionBySession: (sessionId: string) =>
    `${API_BASE_URL}/transactions/session/${sessionId}`,
  vendorTransactions: (vendorId: string) =>
    `${API_BASE_URL}/transactions/vendor/${vendorId}`,
  transactions: `${API_BASE_URL}/transactions`,
  UpdateProfile: `${API_BASE_URL}/users/update-profile`,
} as const

export const CURRENCY = "USD"
export const CURRENCY_LOCALE = "en-US"

export const SERVICE_CATEGORIES = [
  {
    name: "Photography & Videography",
    tagline: "Every moment, beautifully captured",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Wedding Venues",
    tagline: "Stunning settings for your big day",
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Decoration & Florist",
    tagline: "Fresh florals and dreamy decor",
    image:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Catering Services",
    tagline: "Delight every guest at the table",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Makeup & Styling",
    tagline: "Radiant looks for the big day",
    image:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Wedding Fashion",
    tagline: "Timeless attire for couples",
    image:
      "https://images.unsplash.com/photo-1550005809-91ad75fb315f?auto=format&fit=crop&w=900&q=80",
  },
] as const

/** Fallback cover images per category, used when a service has no image yet. */
export const CATEGORY_IMAGES: Record<string, string> = Object.fromEntries(
  SERVICE_CATEGORIES.map((category) => [category.name, category.image])
)

export const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80"

export const WHY_CHOOSE_WEDPLAN = [
  {
    icon: "verified",
    title: "Trusted Vendors",
    description:
      "Every vendor and service is reviewed by our team before it goes live, so you book with total confidence.",
  },
  {
    icon: "budget",
    title: "Transparent Pricing",
    description:
      "Clear per-service pricing with no hidden charges. Compare options and find what fits your budget.",
  },
  {
    icon: "concierge",
    title: "All-in-One Planning",
    description:
      "Venues, photography, catering, styling and more — discover and book every part of your wedding in one place.",
  },
  {
    icon: "support",
    title: "Dedicated Support",
    description:
      "Our planning specialists are on hand before and after every booking, from first enquiry to the big day.",
  },
] as const

export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Explore Services",
    description:
      "Browse curated wedding services across six categories, filtered by location and price.",
    icon: "search",
  },
  {
    step: "02",
    title: "Request a Booking",
    description:
      "Pick your date, share the event location and send a booking request to the vendor.",
    icon: "calendar",
  },
  {
    step: "03",
    title: "Confirm & Celebrate",
    description:
      "The vendor reviews your request and confirms. Track every booking from your dashboard.",
    icon: "heart",
  },
] as const
