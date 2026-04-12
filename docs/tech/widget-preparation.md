# Widget Preparation (Medium + Large)

## Goal
Prepare a stable foundation for home screen widgets that mirror the Home hero carousel card design, starting with `systemMedium` and `systemLarge` families.

## What Is Added

### 1) Shared widget contract
- File: `types/widgets.ts`
- Defines a typed payload contract for:
  - Supported families (`systemMedium`, `systemLarge`)
  - Card content (title, summary, meta, year)
  - Visual tokens (colors, layout spacing, typography, vignette)
  - Deep link and image URI

### 2) Payload builder
- File: `services/widgets/home-hero-widget-payload.ts`
- Converts active Home hero card data into a versioned widget payload.
- Includes family-aware text limits so medium/large rendering can remain stable.
- Captures the same visual token values used by `app/(tabs)/index.tsx` hero card.

### 3) Bridge stub (RN -> native widget layer)
- File: `services/widgets/widget-bridge.ts`
- If native bridge exists (`NativeModules.HistoriqWidgetBridge`), sends JSON payload and requests timeline refresh.
- If bridge does not exist yet, stores payload in AsyncStorage key:
  - `@daily_historic/widgets/home_hero/v1`

### 4) Home sync hook
- File: `hooks/use-home-widget-sync.ts`
- Creates + syncs payload from active hero card, so native widget extension can later consume the same data contract.

## Integration Notes
- This is preparation only. Native widget extension targets are not added yet.
- Current fallback storage (AsyncStorage) is intentionally temporary and not widget-readable by iOS WidgetKit/Android AppWidget.
- In implementation phase, this bridge should write to:
  - iOS: App Group shared container
  - Android: SharedPreferences (or equivalent Glance-accessible store)

## Next Step Topics (for plan mode)
1. iOS WidgetKit extension setup and App Group entitlement strategy.
2. Android Glance/AppWidget receiver + update scheduler.
3. Shared deep-link route format validation.
4. Image loading policy for widget timelines (caching, fallback, timeout).
5. Update triggers (app open, digest refresh, midnight rollover, manual refresh).
6. Medium vs Large layout parity checklist against Home hero card.
