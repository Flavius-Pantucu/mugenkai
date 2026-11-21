import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getCatalog } from "@/server/catalog";

export const alt = "Mugenkai: watch anime and read manga";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";

/** Link preview: a random anime banner each request (getCatalog reads the DB per request, so this is never prerendered). */
export default async function OpengraphImage() {
  const { anime } = await getCatalog();
  const pick = anime[Math.floor(Math.random() * anime.length)];

  // Inline the banner so a slow or dead image host falls back to the plain background instead of failing the preview.
  let banner: string | null = null;
  try {
    const res = await fetch(pick.bannerImage, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const type = res.headers.get("content-type") ?? "image/jpeg";
      banner = `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
    }
  } catch {}

  const png = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#061013" }}>
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt="" width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }} />
        )}
        <div
          style={{
            // Satori ignores `inset`, so size it explicitly.
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 64,
            background: "linear-gradient(180deg, rgba(6,16,19,0.15) 0%, rgba(6,16,19,0.6) 55%, #061013 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <svg width="88" height="62" viewBox="4 6 40 28">
              <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2ec4b6" />
                  <stop offset="50%" stopColor="#5fd9cc" />
                  <stop offset="100%" stopColor="#9cebe1" />
                </linearGradient>
              </defs>
              <path
                d="M 8 20 C 8 14 12 10 16 10 C 20 10 22 14 24 20 C 26 26 28 30 32 30 C 36 30 40 26 40 20 C 40 14 36 10 32 10 C 28 10 26 14 24 20 C 22 26 20 30 16 30 C 12 30 8 26 8 20 Z"
                fill="url(#g)"
              />
            </svg>
            <div style={{ fontSize: 76, fontWeight: 700, color: "#ffffff" }}>Mugenkai</div>
          </div>
          <div style={{ marginTop: 12, fontSize: 32, color: "#9cebe1" }}>Watch anime and read manga, all in one place.</div>
          <div style={{ marginTop: 8, fontSize: 22, color: "rgba(255,255,255,0.6)" }}>{pick.title}</div>
        </div>
      </div>
    ),
    size,
  );

  // ImageResponse only makes PNG (1-2 MB for a photo); WhatsApp and Messenger skip previews that large.
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": contentType } });
}
