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
