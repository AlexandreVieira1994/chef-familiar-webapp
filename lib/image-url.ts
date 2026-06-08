export function stableImageUrl(url: string | null | undefined, seed: string, size: "recipe" | "ingredient") {
  if (!url) return null;
  if (!url.startsWith("https://source.unsplash.com/")) return url;

  const lock = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  const tags = url.split("?")[1]?.split("&")[0]?.trim() || "food";
  const safeTags = tags
    .split(",")
    .map((tag) => encodeURIComponent(tag.trim().replace(/\s+/g, "-")))
    .filter(Boolean)
    .slice(0, 4)
    .join(",");

  if (size === "recipe") return `https://loremflickr.com/1200/800/${safeTags || "recipe"}?lock=${1000 + lock}`;
  return `https://loremflickr.com/320/240/${safeTags || "ingredient"}?lock=${2000 + lock}`;
}
