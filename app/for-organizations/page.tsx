import type { Metadata } from "next";
import SubmitForm from "@/components/SubmitForm";

export const metadata: Metadata = {
  title: "For organizations — ServeFremont",
  description:
    "List your volunteer opportunities on ServeFremont. Free, verified, and in front of local students.",
};

const UI =
  '-apple-system, BlinkMacSystemFont, var(--font-inter), "Segoe UI", system-ui, sans-serif';

export default function ForOrganizationsPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--sf-bg)",
        display: "flex",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "var(--sf-surface)",
          border: "1px solid var(--sf-border)",
          borderRadius: 14,
          padding: 24,
          boxShadow:
            "0 1px 2px var(--sf-shadow), 0 20px 44px -22px var(--sf-shadow-strong)",
          fontFamily: UI,
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ fontFamily: UI, fontSize: 20, fontWeight: 700, margin: 0, color: "var(--sf-text)" }}>
          For organizations
        </h1>

        <p style={{ fontSize: 12.5, lineHeight: 1.65, marginTop: 12, marginBottom: 0, color: "var(--sf-text-soft)" }}>
          ServeFremont is a free, student-built map that helps Fremont students
          find your volunteer opportunities. There&apos;s no cost and no ads — and
          every listing links straight to your own signup process, so it sends you
          motivated volunteers without adding to your inbox.
        </p>

        <ul
          style={{
            marginTop: 12,
            marginBottom: 0,
            paddingLeft: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: 12.5,
            color: "var(--sf-text-soft)",
          }}
        >
          <li>• A free, accurate listing in front of local students</li>
          <li>• Verified in person and re-confirmed each quarter</li>
          <li>• Edit or remove your listing anytime with one email</li>
        </ul>

        <h2 style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, marginTop: 20, marginBottom: 0, color: "var(--sf-text)" }}>
          Submit your organization
        </h2>
        <p style={{ fontSize: 12.5, marginTop: 4, marginBottom: 16, color: "var(--sf-text-muted)" }}>
          Tell us a little and we&apos;ll follow up to verify the details.
        </p>

        <SubmitForm />
      </div>
    </main>
  );
}
