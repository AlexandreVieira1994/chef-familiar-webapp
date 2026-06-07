export function stableImageUrl(url: string | null | undefined, seed: string, size: "recipe" | "ingredient") {
  if (!url) return null;
  if (!url.startsWith("https://source.unsplash.com/")) return url;

  const lock = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  if (size === "recipe") return `https://loremflickr.com/1200/800/food?lock=${1000 + lock}`;
  return `https://loremflickr.com/320/240/food?lock=${2000 + lock}`;
}
