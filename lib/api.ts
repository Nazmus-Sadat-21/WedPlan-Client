import { API_ENDPOINTS } from "@/lib/constants"
import type { Service } from "@/lib/types"

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
