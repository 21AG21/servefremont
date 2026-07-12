import ServeFremontApp from "@/components/ServeFremontApp";
import { getListings } from "@/lib/listings";

// Fetch on the server so the first HTML already contains the full list —
// no client fetch waterfall, and the listings are indexable.
export default async function Home() {
  try {
    const listings = await getListings();
    return <ServeFremontApp listings={listings} />;
  } catch {
    return (
      <ServeFremontApp listings={[]} error="Could not load listings from Airtable." />
    );
  }
}
