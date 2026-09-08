"use client";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#000",
          color: "#EAECEF",
          fontFamily: "system-ui, sans-serif",
          padding: "48px 24px",
        }}
      >
        <title>Something broke · BAS</title>
        <h1 style={{ fontSize: 28, margin: 0 }}>Something broke</h1>
        <p style={{ marginTop: 12, maxWidth: 480, color: "#848E9C", lineHeight: 1.6 }}>
          {error.message || "The marketplace hit an unexpected error."}
        </p>
        <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 8,
              border: 0,
              background: "#F0B90B",
              color: "#000",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <a
            href="/market"
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 8,
              border: "1px solid #3D3D3D",
              color: "#EAECEF",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Market
          </a>
          <a
            href="/docs/judges"
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 8,
              color: "#F0B90B",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Judge path
          </a>
        </div>
      </body>
    </html>
  );
}
