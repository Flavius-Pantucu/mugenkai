import { iconImage } from "@/lib/icon-image";

// PNG icons for the web app manifest (Android/Chrome install wants 192 and 512).
export const dynamic = "force-static";
export const generateStaticParams = () => [{ size: "192" }, { size: "512" }];

export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size } = await ctx.params;
  return iconImage(size === "512" ? 512 : 192);
}
