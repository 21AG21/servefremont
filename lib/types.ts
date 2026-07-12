// Public-facing types. Note: internal contact fields (coordinator name/email/
// phone, internal notes) are deliberately NOT represented here, so they can
// never leak onto the public site.

export type Organization = {
  id: string;
  name: string;
  mission?: string;
  address?: string;
  city?: string; // parsed from address, used for the location filter
  lat?: number;
  lng?: number;
  website?: string;
  orgType?: string;
  categories: string[];
};

export type Opportunity = {
  id: string;
  title: string;
  orgId?: string;
  orgName?: string;
  city?: string; // pulled from the linked organization
  lat?: number; // pulled from the linked organization
  lng?: number; // pulled from the linked organization
  categories: string[]; // pulled from the linked organization
  minAge?: number;
  guardianRequiredUnder?: number;
  adultsOnly: boolean;
  signsHourForms: boolean | null; // null = not yet confirmed either way
  accepting: "yes" | "no" | "waitlist" | "unknown";
  scheduleType?: string;
  scheduleNotes?: string;
  description?: string;
  transitNotes?: string;
  walkableFrom: string[]; // high schools this is walkable from
  groupFriendly: boolean;
  onboarding?: string;
  onboardingTime?: string;
  costNotes?: string;
  howToStartUrl?: string;
  verifiedAt?: string; // ISO date string, e.g. "2026-06-15"
};
