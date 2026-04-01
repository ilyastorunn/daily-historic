# Daily Historical Insights App — Tech Stack

## Client (Mobile)
- **Framework**: React Native (Expo-managed) with TypeScript for type safety and rapid iteration.
- **Navigation**: React Navigation (stack + bottom tabs) with deep linking for shareable events.
- **State Management**: React Context API + custom hooks (no Zustand) for global user profile, personalization settings, and feature flags.
- **Styling**: React Native StyleSheet with shared tokens (`theme/`) for colors, spacing, radius, typography; avoid NativeWind/Tailwind utilities to keep bundle lean.
- **Forms**: `react-hook-form` with zod schemas for onboarding validation.
- **Data Fetching**: `@tanstack/react-query` for caching, optimistic updates, and offline support.
- **Animations**: `react-native-reanimated` for micro-interactions and onboarding flows.
- **Media Handling**: Expo Image for optimized asset rendering and caching.
- **Internationalization**: `react-intl` (Phase 3) with locale packs.
- **Accessibility**: React Native Accessibility API + testing via jest-axe (where applicable).

## Backend & Infrastructure
- **Platform**: Supabase (PostgreSQL + Auth + Edge Functions) as primary backend.
  - Auth: Supabase Auth (email magic link, OAuth providers).
  - Database: Postgres schema for events, categories, personalization weights, user profiles.
  - Storage: Supabase Storage for media metadata and backups; production assets served via CDN.
  - Edge Functions: Event aggregation, personalization scoring, scheduled digests.
- **Content Ingestion**: Scheduled Supabase Functions triggered via cron to import and normalize datasets.
- **Search**: Supabase Postgres full-text search (Phase 1) with potential move to OpenSearch if scale demands.
- **Notifications**: Expo push service initially; Supabase functions trigger daily reminders and SendGrid emails.

## Services & Integrations
- **Analytics**: Amplitude SDK with proxying through Supabase Edge for compliance.
- **Error Monitoring**: Sentry (React Native + Edge Functions).
- **Feature Flags**: Supabase Remote Config table consumed via context hook.
- **Email/Digest**: SendGrid transactional templates; Supabase cron for scheduling.
- **Media CDN**: Cloudflare Images (or similar) layered on top of Supabase storage.

## Tooling & Quality
- **Package Management**: pnpm (workspace for app + shared packages).
- **Build & CI**: GitHub Actions with Expo EAS builds; lint/test gates on PRs.
- **Testing**:
  - Unit: Jest + Testing Library React Native.
  - Integration/E2E: Detox for core flows (onboarding, dashboard interactions).
  - Contract: OpenAPI schema tests for Supabase functions using Dredd.
- **Linting/Formatting**: ESLint (airbnb-typescript base), Prettier, TypeScript strict mode.
- **Secrets Management**: Expo secrets in local `.env` with Doppler (or 1Password) for team distribution.
- **Documentation**: Storybook for component previews; Linear for task tracking.

## Environments
- **Local**: Expo Go + Supabase local docker for iterative dev.
- **Staging**: Supabase project (United States region) with feature flag gating and internal beta testers via TestFlight/Play Internal.
- **Production**: Managed Supabase project with read replicas for analytics; Expo EAS production builds.

## Architectural Notes
- Prioritize offline resilience: cache last synced day via `react-query` persister and secure storage for auth tokens.
- Personalization service starts rule-based (Supabase SQL) and evolves to ML pipeline hosted via Supabase Edge or external serverless functions.
- Ensure modular data layer in the app (`/services/api`) to abstract Supabase client usage.
- Styling tokens module should expose hooks (`useTheme`) to enforce consistent spacing, typography, and color usage.
