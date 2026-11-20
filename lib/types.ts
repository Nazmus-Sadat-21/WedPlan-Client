export type ServiceStatus = "pending" | "approved" | "rejected"

export type ServiceAvailability = boolean | "active" | "inactive"

export type BookingStatus = "pending" | "accepted" | "rejected" | "cancelled"

/** User document returned by the admin `GET /users` endpoint. */
export interface AdminUser {
  _id: string
  name?: string | null
  email?: string | null
  emailVerified?: boolean
  image?: string | null
  role?: string
  isBlocked?: boolean
  subscriptionPlan?: string
  createdAt?: string
}

export interface Vendor {
  _id: string
  name: string
  email?: string | null
  image?: string | null
  businessName?: string
}

export interface Service {
  _id: string
  serviceName: string
  category: string
  description: string
  price: number
  location: string
  images?: string[] | null
  status: ServiceStatus | string
  availability?: ServiceAvailability
  createdAt?: string
  /** The Express API may return the vendor populated or as a raw id. */
  vendor?: Vendor
  vendorId?: string | Vendor
}

/** Vendor details embedded in a customer booking by `GET /bookings/customer/:id`. */
export interface BookingVendor {
  _id: string
  name?: string | null
  email?: string | null
  image?: string | null
  businessName?: string | null
}

/** Customer details embedded in a vendor booking by `GET /bookings/vendor/:id`. */
export interface BookingCustomer {
  _id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

/** A customer booking enriched with its service and vendor documents. */
export interface Booking {
  _id: string
  serviceId: string
  vendorId: string
  customerId: string
  eventDate: string
  eventLocation: string
  message?: string
  status: BookingStatus | string
  createdAt?: string
  /** Populated by the API; null if the service was removed after booking. */
  service?: Service | null
  /** Populated by the API; null if the vendor account no longer exists. */
  vendor?: BookingVendor | null
  /** Populated by `GET /bookings/vendor/:vendorId` for the vendor dashboard. */
  customer?: BookingCustomer | null
}

/** Vendor details embedded in an admin transaction by `GET /transactions`. */
export interface TransactionVendor {
  _id: string
  name?: string | null
  email?: string | null
  image?: string | null
  businessName?: string | null
}

/** A premium subscription payment saved by the verified Stripe webhook. */
export interface Transaction {
  _id: string
  vendorId: string
  plan: string
  amount: number
  currency: string
  stripeSessionId?: string
  stripeSubscriptionId?: string | null
  status: string
  createdAt?: string
  /** Populated by the admin `GET /transactions` endpoint. */
  vendor?: TransactionVendor | null
  vendorEmail?: string | null
}
