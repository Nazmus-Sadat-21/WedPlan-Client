export type ServiceStatus = "pending" | "approved" | "rejected"

export type BookingStatus = "pending" | "accepted" | "rejected" | "cancelled"

export interface Vendor {
  _id: string
  name: string
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
  availability?: boolean
  createdAt?: string
  /** The Express API may return the vendor populated or as a raw id. */
  vendor?: Vendor
  vendorId?: string | Vendor
}
