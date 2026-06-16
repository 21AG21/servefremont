import type { Metadata } from "next";
import SubmitForm from "@/components/SubmitForm";

export const metadata: Metadata = {
  title: "For organizations — ServeFremont",
  description:
    "List your volunteer opportunities on ServeFremont. Free, verified, and in front of local students.",
};

export default function ForOrganizationsPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <h1 className="font-display text-2xl font-medium text-ink">
        For organizations
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-ink">
        ServeFremont is a free, student-built map that helps Fremont students
        find your volunteer opportunities. There&apos;s no cost and no ads — and
        every listing links straight to your own signup process, so it sends you
        motivated volunteers without adding to your inbox.
      </p>

      <ul className="mt-4 flex flex-col gap-2 text-sm text-ink">
        <li>• A free, accurate listing in front of local students</li>
        <li>• Verified in person and re-confirmed each quarter</li>
        <li>• Edit or remove your listing anytime with one email</li>
      </ul>

      <h2 className="mt-6 font-display text-lg font-medium text-ink">
        Submit your organization
      </h2>
      <p className="mt-1 mb-4 text-sm text-ink-soft">
        Tell us a little and we&apos;ll follow up to verify the details.
      </p>

      <SubmitForm />
    </main>
  );
}
