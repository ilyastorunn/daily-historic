import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

import type {
  AccountSelection,
  CategoryOption,
  EraOption,
  PushPermission,
} from '@/contexts/onboarding-context';

export type ReactionValue = 'appreciate' | 'insight';
export type ReactionMap = Record<string, ReactionValue>;

export interface UserEngagementState {
  savedEventIds: string[];
  reactions: ReactionMap;
}

export interface OnboardingData {
  /** Optional display name supplied during onboarding (if available). */
  displayName?: string;
  /** Account pathway selected; null represents anonymous/skip. */
  accountSelection: AccountSelection | null;
  /** Email captured when the user chooses the email path. */
  emailAddress?: string;
  /** Detected or user-confirmed timezone identifier (IANA). */
  timezone: string;
  /** Chosen content categories, empty if skipped with `categoriesSkipped`. */
  categories: CategoryOption[];
  /** Indicates the user explicitly skipped category selection. */
  categoriesSkipped: boolean;
  /** Selected historical eras of interest. */
  eras: EraOption[];
  /** Whether daily notifications are enabled. */
  notificationEnabled: boolean;
  /** Reminder time in HH:mm when notifications are enabled. */
  notificationTime?: string;
  /** Result of the push permission step. */
  pushPermission: PushPermission;
  /** Whether the hero preview step was marked as seen. */
  heroPreviewSeen: boolean;
  /** User's theme preference: light, dark, or system (follows device). */
  themePreference?: 'light' | 'dark' | 'system';
  /** Optional free-form notes or future extensions. */
  additionalNotes?: string;
}

export interface UserProfile extends OnboardingData, UserEngagementState {
  uid: string;
  onboardingCompleted: boolean;
  createdAt?: FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
}

export interface UserDocument extends OnboardingData {
  uid: string;
  onboardingCompleted: boolean;
  savedEventIds?: string[] | FirebaseFirestoreTypes.FieldValue;
  reactions?: ReactionMap | FirebaseFirestoreTypes.FieldValue;
  createdAt?: FirebaseFirestoreTypes.FieldValue | FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.FieldValue | FirebaseFirestoreTypes.Timestamp;
}
