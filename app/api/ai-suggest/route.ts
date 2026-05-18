import { NextRequest, NextResponse } from "next/server";

const GEMINI_TEXT_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Available styles for the AI to choose from
const STYLE_OPTIONS = `
1. hero-reveal - Produk muncul dramatis dari kegelapan, volumetric lighting, luxury feel
2. 360-showcase - Produk berputar 360 derajat, turntable style, studio lighting
3. floating-premium - Produk melayang di udara, particle effects, premium gradient
4. splash-dynamic - Efek percikan air/liquid, energetic, fresh feel
5. lifestyle-context - Setting lifestyle natural, morning light, bokeh, aspirational
6. zoom-detail - Macro close-up ke detail dan tekstur produk
7. unboxing - Efek unboxing/reveal dari packaging
8. neon-glow - Neon lights futuristik, cyberpunk, tech vibes
`;

export async function POST(request: NextRequest) {
  try {
    const { description, geminiKey } = await request.json();

    if (!description) {
      return NextResponse.json({ error: "Description required" }, { status: 400 });
    }

    if (!geminiKey) {
      return NextResponse.json({ error: "Gemini API key required" }, { status: 401 });
    }

    const prompt = `Kamu adalah senior creative director di agency iklan ternama dengan 15 tahun pengalaman membuat video iklan produk. 

Berdasarkan deskripsi produk berikut, pilih SATU style video yang paling cocok untuk membuat video iklan produk ini terlihat premium dan menarik.

Deskripsi produk: "${description}"

Pilihan style:
${STYLE_OPTIONS}

RULES:
- Jawab HANYA dengan ID style (contoh: hero-reveal)
- Jangan tambahkan penjelasan apapun
- Pilih berdasarkan: jenis produk, warna, mood, target audience
- Skincare/beauty → floating-premium atau lifestyle-context
- Tech/gadget → neon-glow atau hero-reveal  
- Food/drink → splash-dynamic
- Fashion/luxury → hero-reveal atau lifestyle-context
- Produk dengan detail menarik → zoom-detail
- Produk dalam box → unboxing
- Kalau ragu, pilih 360-showcase (universal)

Style yang dipilih:`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 20,
      },
    };

    const response = await fetch(`${GEMINI_TEXT_URL}?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      return NextResponse.json(
        { error: err?.error?.message || "Gemini API error", fallback: "360-showcase" },
        { status: 200 } // Return 200 with fallback so it doesn't break the flow
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() || "";

    // Extract style ID from response
    const validStyles = ["hero-reveal", "360-showcase", "floating-premium", "splash-dynamic", "lifestyle-context", "zoom-detail", "unboxing", "neon-glow"];
    const matched = validStyles.find((s) => text.includes(s));

    return NextResponse.json({ style: matched || "360-showcase" });
  } catch (error) {
    console.error("AI suggest error:", error);
    return NextResponse.json({ style: "360-showcase" }); // Always return a fallback
  }
}
