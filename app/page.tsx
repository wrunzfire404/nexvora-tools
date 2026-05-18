"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#09090b",
        color: "#fafafa",
        fontFamily: "var(--font-geist-sans), -apple-system, sans-serif",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          height: 56,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nexlogo.png" alt="Nexvora" style={{ width: 28, height: 28, borderRadius: 6 }} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>Nexvora</span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={() => router.push("/generate")}
            style={{
              background: "#fff",
              color: "#09090b",
              border: "none",
              borderRadius: 6,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Open App
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          maxWidth: 600,
          margin: "0 auto",
          padding: "80px 24px 48px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 42px)",
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            margin: "0 0 12px",
          }}
        >
          AI Creative Tools
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.6,
            margin: "0 auto 28px",
            maxWidth: 420,
          }}
        >
          Product photo, UGC video, image generation, upscaler — powered by multiple AI APIs. Gratis.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          <button
            onClick={() => router.push("/product")}
            style={{
              background: "#fff",
              color: "#09090b",
              border: "none",
              borderRadius: 6,
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Get Started →
          </button>
          <button
            onClick={() => window.open("https://www.magnific.com/api", "_blank")}
            style={{
              background: "transparent",
              color: "#fafafa",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Get API Key
          </button>
        </div>
      </section>

      {/* Tools */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 64px" }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16, fontWeight: 500 }}>
          Available Tools
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 10,
          }}
        >
          {[
            { title: "Product Photo Generator", desc: "Foto produk berbagai background", href: "/product", api: "Magnific" },
            { title: "UGC Video Creator", desc: "Video UGC untuk iklan & sosmed", href: "/ugc", api: "Magnific" },
            { title: "Image Generation", desc: "Generate gambar dari teks", href: "/generate", api: "Magnific" },
            { title: "Motion Control", desc: "Transfer gerakan video ke foto", href: "/motion", api: "Magnific" },
            { title: "Image Upscaler", desc: "Perbesar & pertajam gambar", href: "/upscale", api: "Magnific" },
            { title: "Image Expand", desc: "Perluas area gambar dengan AI", href: "/expand", api: "Magnific" },
            { title: "Image Relight", desc: "Ubah pencahayaan foto", href: "/relight", api: "Magnific" },
            { title: "Video Generation", desc: "Coming soon", href: "/video", api: "—", disabled: true },
          ].map((tool) => (
            <button
              key={tool.href}
              onClick={() => !tool.disabled && router.push(tool.href)}
              disabled={tool.disabled}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.07)",
                background: tool.disabled ? "transparent" : "rgba(255,255,255,0.02)",
                cursor: tool.disabled ? "not-allowed" : "pointer",
                opacity: tool.disabled ? 0.35 : 1,
                textAlign: "left",
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!tool.disabled) {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                e.currentTarget.style.background = tool.disabled ? "transparent" : "rgba(255,255,255,0.02)";
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#fafafa" }}>{tool.title}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{tool.desc}</div>
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap", marginLeft: 12 }}>
                {tool.api}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Bottom */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 48px" }}>
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            padding: "20px 24px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Mulai dalam 2 menit</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
              Daftar gratis → copy API key → paste di Nexvora → selesai.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href="https://www.magnific.com/api"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fafafa",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Magnific ↗
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "16px 24px",
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Nexvora Tools</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Independent project</span>
      </footer>
    </div>
  );
}
