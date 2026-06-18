// Shape consumed by the front-end app. Populated from Airtable via /api/listings.
export type Listing = {
  id: string;
  title: string;
  org: string;
  category: string[];
  ageMin?: number;
  ageMax?: number;
  shiftLengthHours?: number;
  scheduleNotes?: string;
  nextSession?: string;
  lat?: number;
  lng?: number;
  verified?: string; // formatted, e.g. "Jun 2026"
  distance?: string;
  accepting: boolean;
  schedule?: string; // Recurring / One-time / Drop-in
  signsHourForms: boolean;
  nearTransit: boolean;
  groupsOK: boolean;
  priority: boolean;
  // Detail-page fields
  description?: string;
  onboarding?: string;
  onboardingTime?: string;
  howToStartSteps?: string[];
  howToStartUrl?: string;
  transitNotes?: string;
  address?: string;
  website?: string;
};
