"use client"

import Link from "next/link"

/**
 * Last-resort boundary: this replaces the root layout, so it must render its
 * own <html>/<body> and cannot rely on the app's global stylesheet or theme
 * provider. Inline styles keep it readable in every environment.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#FDFBF7",
          color: "#2c1a1f",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <main style={{ maxWidth: "32rem", textAlign: "center" }}>
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              background: "#FCE7EA",
              color: "#B76E79",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            !
          </div>
          <h1 style={{ margin: "20px 0 0", fontSize: 28, lineHeight: 1.2 }}>
            WedPlan couldn&apos;t start
          </h1>
          <p style={{ margin: "12px 0 0", color: "#6b5b60", lineHeight: 1.6 }}>
            An unexpected error stopped the application from loading. Retry the
            page, or come back in a few minutes.
          </p>
          <div
            style={{
              marginTop: 28,
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => retry()}
              style={{
                cursor: "pointer",
                border: "none",
                borderRadius: 999,
                padding: "12px 24px",
                background: "#B76E79",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                borderRadius: 999,
                padding: "12px 24px",
                border: "1px solid #e7d6da",
                background: "#fff",
                color: "#2c1a1f",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Back to home
            </Link>
          </div>
          {error && typeof error === "object" && "digest" in error ? (
            <p
              style={{
                marginTop: 20,
                fontSize: 11,
                color: "#9a8a8f",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              Reference: {String((error as { digest?: unknown }).digest ?? "")}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  )
}
