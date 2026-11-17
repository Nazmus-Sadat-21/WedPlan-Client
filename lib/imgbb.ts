const IMGBB_ENDPOINT = "https://api.imgbb.com/1/upload"

/**
 * Upload an image file to ImgBB and return the hosted URL.
 * Throws an Error with a user-friendly message on failure so forms can
 * surface it as a toast.
 */
export async function uploadToImgbb(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY
  if (!apiKey) {
    throw new Error(
      "Image upload is not configured. Please set NEXT_PUBLIC_IMGBB_API_KEY."
    )
  }

  const formData = new FormData()
  formData.append("image", file)

  let response: Response
  try {
    response = await fetch(`${IMGBB_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      body: formData,
    })
  } catch {
    throw new Error(
      "Could not reach the image host. Check your connection and try again."
    )
  }

  if (!response.ok) {
    throw new Error(
      `Image upload failed (${response.status}). Please try a different image.`
    )
  }

  const payload: unknown = await response.json()
  const url = (payload as { data?: { url?: unknown; display_url?: unknown } })
    ?.data?.url

  if (typeof url !== "string" || url === "") {
    throw new Error("Image upload failed. Please try again.")
  }
  return url
}
