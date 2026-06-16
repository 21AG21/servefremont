// Maps an Airtable category name to a Tailwind background + text class pair,
// so category pills are color-coded and scannable. Unknown categories fall
// back to a neutral gray.

const CATEGORY_STYLES: Record<string, string> = {
  "Food Security": "bg-orange-100 text-orange-900",
  Seniors: "bg-pink-100 text-pink-900",
  "Immigrant Services": "bg-violet-100 text-violet-900",
  Education: "bg-blue-100 text-blue-900",
  Environment: "bg-green-100 text-green-900",
  Animals: "bg-amber-100 text-amber-900",
  Health: "bg-teal-100 text-teal-900",
};

const FALLBACK = "bg-gray-100 text-gray-800";

export function categoryClasses(category: string): string {
  return CATEGORY_STYLES[category] ?? FALLBACK;
}
