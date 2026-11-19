/**
 * Background art that switches source by screen shape: the portrait cover on phones,
 * the wide banner from md up. <picture> means only the matching image is downloaded.
 * `className`/props go on the <img>, so callers style it exactly like a plain image.
 */
export function ResponsiveArt({
  banner,
  cover,
  ...img
}: { banner: string; cover: string } & Omit<React.ComponentProps<"img">, "src">) {
  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={cover} />
      <img src={banner} alt="" {...img} />
    </picture>
  );
}
