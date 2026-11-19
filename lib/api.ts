import { API_ENDPOINTS } from "@/lib/constants"
import type { Service, ServiceAvailability, ServiceStatus } from "@/lib/types"

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.clone().json()
    if (typeof data === "string") return data
    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>
      const message =
        record.message ?? record.error ?? record.errors ?? undefined
      if (typeof message === "string" && message.trim() !== "") {
        return message
      }
    }
  } catch {
    // Response body was not JSON — fall through to the generic message.
  }
  return `Request failed with status ${response.status}`
}

/**
 * Fetch approved and active wedding services from the Express API.
 * Services are only used for display here; every mutation requires
 * authentication on the server.
 */
export async function fetchServices(
  options: { signal?: AbortSignal } = {}
): Promise<Service[]> {
  let response: Response
  try {
    response = await fetch(API_ENDPOINTS.services, {
      signal: options.signal,
      headers: { Accept: "application/json" },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error
    }
    throw new ApiError(
      "Unable to reach the WedPlan services right now. Please check your connection and try again."
    )
  }

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status)
  }

  const data: unknown = await response.json()
  if (!Array.isArray(data)) {
    throw new ApiError("Unexpected response from the server.")
  }
  return data as Service[]
}

export function fetchFeaturedServices(
  options: { signal?: AbortSignal } = {}
): Promise<Service[]> {
  return fetchServices(options)
}

/** Legacy records store a boolean; newer ones store "active"/"inactive". */
export function isServiceActive(service: Service): boolean {
  return service.availability === true || service.availability === "active"
}

/** Only approved and available services should appear publicly. */
export function isPublicService(service: Service): boolean {
  const status = String(service.status ?? "approved").toLowerCase()

  if (status === "rejected" || status === "pending") return false

  return isServiceActive(service)
}

/** Services belonging to one vendor (includes pending/rejected services). */
export async function fetchVendorServices(
  vendorId: string,
  options: { signal?: AbortSignal } = {}
): Promise<Service[]> {
  let response: Response
  try {
    response = await fetch(API_ENDPOINTS.vendorServices, {
      signal: options.signal,
      credentials: "include",
      headers: { Accept: "application/json" },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error
    }
    throw new ApiError(
      "Unable to reach your services right now. Please check your connection and try again."
    )
  }

  // Older API builds may not expose the protected vendor endpoint yet; fall
  // back to filtering the public catalogue by vendor id.
  if (response.status === 404) {
    const all = await fetchServices(options)
    return all.filter((service) => {
      if (typeof service.vendorId === "string") {
        return service.vendorId === vendorId
      }
      if (service.vendorId && typeof service.vendorId === "object") {
        return service.vendorId._id === vendorId
      }
      return service.vendor?._id === vendorId
    })
  }

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status)
  }

  const data: unknown = await response.json()
  if (!Array.isArray(data)) {
    throw new ApiError("Unexpected response from the server.")
  }
  return data as Service[]
}

export interface NewServiceInput {
  vendorId: string
  serviceName: string
  category: string
  description: string
  price: number
  location: string
  images: string[]
  /** Services created from the vendor form start pending until an admin reviews them. */
  status: ServiceStatus
  availability: ServiceAvailability
  createdAt: string
}

/**
 * Create a service for the signed-in vendor. The server must still verify the
 * session/role and apply the free-plan limit before inserting the document.
 */
export async function createService(input: NewServiceInput): Promise<Service> {
  let response: Response
  try {
    response = await fetch(API_ENDPOINTS.services, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    })
  } catch {
    throw new ApiError(
      "Unable to reach the WedPlan services right now. Please check your connection and try again."
    )
  }

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status)
  }

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    // An empty body is fine — the service was still created.
  }

  const insertedId = (payload as { insertedId?: unknown } | null)?.insertedId
  return {
    ...input,
    _id: typeof insertedId === "string" ? insertedId : `service-${Date.now()}`,
  }
}
