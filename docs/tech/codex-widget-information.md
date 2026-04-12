# HistoriqHomeHeroWidget — Implementation & Fix Guide

> Last updated: April 2026  
> Branch: `codex/widgets-medium-large-ios`

---

## Overview

The app has a native iOS WidgetKit extension (`HistoriqHomeHeroWidget`) that mirrors the home screen hero carousel. It supports `systemMedium` and `systemLarge` families and rotates through up to 5 historical events hourly.

The widget was initially scaffolded by Codex but never successfully built or installed. This document covers the full system architecture, the problems that were found, and exactly how each was fixed.

---

## System Architecture

### Data Flow (App → Widget)

```
app/(tabs)/index.tsx
  └─ heroCarouselItems (useDailyDigestEvents)
       └─ heroWidgetCards (useMemo)
            └─ useHomeWidgetSync (hooks/use-home-widget-sync.ts)
                 └─ createHomeHeroWidgetPayload (services/widgets/home-hero-widget-payload.ts)
                      └─ setHomeHeroWidgetPayload (services/widgets/widget-bridge.ts)
                           └─ NativeModules.HistoriqWidgetBridge (ObjC bridge)
                                └─ UserDefaults(suiteName: "group.com.ilyastorun.histora")
                                     └─ HistoriqHomeHeroWidget.swift (WidgetKit reads on timeline refresh)
```

### Key Files

| File | Role |
|------|------|
| `types/widgets.ts` | TypeScript contract for the widget payload |
| `services/widgets/home-hero-widget-payload.ts` | Converts hero cards → versioned JSON payload |
| `services/widgets/widget-bridge.ts` | RN→Native bridge; writes to App Group UserDefaults |
| `hooks/use-home-widget-sync.ts` | React hook that triggers sync on home screen |
| `ios/HistoriqHomeHeroWidget/HistoriqHomeHeroWidget.swift` | Full widget implementation (provider, view, models) |
| `ios/HistoriqHomeHeroWidget/HistoriqHomeHeroWidgetBundle.swift` | `@main` entry point |
| `ios/HistoriqHomeHeroWidget/HistoriqHomeHeroWidget.entitlements` | App Group entitlement |
| `ios/HistoriqHomeHeroWidget/Info.plist` | Extension metadata |
| `ios/codexdeneme/HistoriqWidgetBridge.m` | ObjC `RCTBridgeModule` that writes payload to App Group |
| `ios/codexdeneme/HistoriqWidgetReloader.swift` | Helper that calls `WidgetCenter.shared.reloadTimelines()` |
| `ios/codexdeneme/codexdeneme.entitlements` | Main app App Group entitlement |

### App Group

All cross-process data sharing uses the App Group `group.com.ilyastorun.histora`.

- The native bridge writes the JSON payload to: `UserDefaults(suiteName: "group.com.ilyastorun.histora")` under key `home_hero_payload_v1`
- The widget reads from the same suite name + key during `getTimeline()`
- Both targets declare the App Group in their `.entitlements` files
- **Important**: `AsyncStorage` (the RN fallback in `widget-bridge.ts`) writes to the app sandbox, NOT the App Group — the widget cannot read it. The native bridge path is required.

### Payload Contract

The widget receives a versioned JSON blob (`HomeHeroWidgetPayload`, currently `version: 2`):

```json
{
  "version": 2,
  "generatedAt": "ISO8601",
  "baseTimestamp": "ISO8601",
  "baseIndex": 0,
  "rotationCadence": "hourly",
  "timezone": "Europe/Istanbul",
  "deepLinkTemplate": "historiq://event/{id}?source=home-widget&index={index}",
  "events": [ /* up to 5 HomeHeroWidgetEventSnapshot */ ],
  "families": ["systemMedium", "systemLarge"],
  "theme": { "light": { ... }, "dark": { ... } }
}
```

Each event snapshot has family-aware text (title/summary/meta with char limits) and an `imageUri` for the hero image.

### Timeline Rotation

The widget calculates which event to show at a given time:

```
resolvedIndex = (baseIndex + elapsedHours) % eventCount
```

Where `elapsedHours` is computed from `baseTimestamp` (the moment the payload was written). This means:
- Hour 0: event at `baseIndex`
- Hour 1: next event
- Hour N: wraps around

The timeline is pre-built for 24 hours ahead. WidgetKit is told to refresh after 1 hour via `.after(now + 3600)` policy.

### Image Loading

WidgetKit **does not support `AsyncImage`** — widgets render statically with no runtime network access. Images are pre-downloaded during `getTimeline()` using `URLSession.shared.data(from:)`. All unique events in the payload are downloaded concurrently via `withTaskGroup`. Each `HomeHeroWidgetEntry` holds `imageData: Data?`. If a download fails, the widget gracefully falls back to the themed gradient background.

### Native Bridge (RN → iOS)

The bridge is an ObjC `RCTBridgeModule` (`ios/codexdeneme/HistoriqWidgetBridge.m`):

- `setHomeHeroPayload(payloadJson)` — writes JSON string to App Group UserDefaults, then calls `reloadTimelinesOfKind`
- `reloadAllTimelines` — calls `WidgetCenter.shared.reloadAllTimelines()` via the Swift helper

RN 0.81 with New Architecture uses bridgeless mode, but includes an interop layer that wraps legacy `RCTBridgeModule` modules automatically. `NativeModules.HistoriqWidgetBridge` resolves correctly without conversion to TurboModule.

The `widget-bridge.ts` TypeScript side:
1. Attempts native bridge first
2. Falls back to `AsyncStorage` if bridge is unavailable (but this fallback does NOT feed the widget)

---

## Problems Found & How They Were Fixed

### Problem 1: `RCTAppDependencyProvider.h: No such file or directory`

**Root cause**: The file lives at `ios/build/generated/ios/RCTAppDependencyProvider.h` and is generated by React Native codegen during `pod install`. The `.gitignore` rule `/ios/*` gitignores this entire directory, so after a fresh clone or `rm -rf ios/build`, the file is gone. The `ReactAppDependencyProvider` pod sources files from this path.

**Fix**: Run `pod install` from `ios/`. The `prepare_react_native_project!` + `use_react_native!` calls in the Podfile trigger codegen as a side effect, regenerating all files under `ios/build/generated/ios/`.

```bash
cd ios && pod install
```

**Note for future contributors**: Always run `pod install` after a fresh clone or after cleaning `ios/build/`. Do not attempt to commit `ios/build/generated/` — it's intentionally gitignored.

---

### Problem 2: `RCTNewArchEnabled` in Widget Info.plist

**Root cause**: Codex added `<key>RCTNewArchEnabled</key><true/>` to `ios/HistoriqHomeHeroWidget/Info.plist`. This flag belongs only in the main app's plist. Having it in the widget extension plist caused the React Native build system to attempt processing codegen artifacts for the widget target.

**Fix**: Removed the key entirely from `ios/HistoriqHomeHeroWidget/Info.plist`.

---

### Problem 3: Missing `PBXTargetDependency` (Build Order)

**Root cause**: The `project.pbxproj` had `dependencies = ();` for both targets. The main app embedded the widget `.appex` via the "Embed App Extensions" copy phase but had no explicit build dependency on the widget target. This made build order non-deterministic.

**Fix**: Added a `PBXContainerItemProxy` and `PBXTargetDependency` entry in `project.pbxproj` linking `codexdeneme → HistoriqHomeHeroWidget`. The codexdeneme target's `dependencies` array now references this entry.

---

### Problem 4: Build Cycle (RNFB Script Phase)

**Root cause**: Adding the explicit target dependency (Problem 3) exposed a pre-existing build cycle:

```
Embed App Extensions (copy widget.appex)
  → [CP-User] [RNFB] Core Configuration (input: codexdeneme.app/Info.plist)
  → ProcessInfoPlistFile (output: codexdeneme.app/Info.plist)
  → Embed App Extensions  ← CYCLE
```

The Firebase RNFB script had `$(BUILT_PRODUCTS_DIR)/$(INFOPLIST_PATH)` as its `inputPaths`. This caused Xcode's build system to create a dependency on the entire app bundle directory, which included the widget `.appex` inside `PlugIns/`, creating a circular dependency.

**Fix**: In `project.pbxproj`, for the `250BA6018DEFDA852E5D728A` script phase:
- Added `alwaysOutOfDate = 1` (unchecks "Based on dependency analysis")
- Cleared `inputPaths` to `()`

This makes the script always run unconditionally, removing it from the dependency graph. The script itself uses `$(BUILT_PRODUCTS_DIR)/$(INFOPLIST_PATH)` internally, which still works at runtime.

---

### Problem 5: `AsyncImage` in WidgetKit

**Root cause**: The original Swift code used `AsyncImage(url:)` to load hero images. WidgetKit renders widget views statically — there is no network access at render time. `AsyncImage` always falls back to the `default` case (solid color background).

**Fix**: Replaced with URLSession-based pre-downloading in the timeline provider:

```swift
// In getTimeline(), before building entries:
let imageDataMap = await downloadAllImages(for: payload)

// Each entry now carries the pre-fetched image data:
struct HomeHeroWidgetEntry: TimelineEntry {
  let imageData: Data?
  // ...
}

// In the view:
if let imageData = entry.imageData, let uiImage = UIImage(data: imageData) {
  Image(uiImage: uiImage).resizable().scaledToFill()
}
```

All events are downloaded concurrently using `withTaskGroup`. Failed downloads fall back gracefully to the gradient-only background.

---

### Problem 6: `UIImage` Not in Scope

**Root cause**: WidgetKit extensions don't automatically import UIKit. `UIImage` was undefined.

**Fix**: Added `import UIKit` at the top of `HistoriqHomeHeroWidget.swift`.

---

### Problem 7: `NSExtensionPrincipalClass` in Info.plist (Install Failure)

**Root cause**: The original Info.plist had:

```xml
<key>NSExtension</key>
<dict>
  <key>NSExtensionPointIdentifier</key>
  <string>com.apple.widgetkit-extension</string>
  <key>NSExtensionPrincipalClass</key>
  <string>$(PRODUCT_MODULE_NAME).HistoriqHomeHeroWidgetBundle</string>
</dict>
```

WidgetKit extensions use `@main` on the `WidgetBundle` struct — the Swift compiler resolves the entry point, not the plist. Having `NSExtensionPrincipalClass` (or `NSExtensionMainStoryboard`) is explicitly **not allowed** for `com.apple.widgetkit-extension` and causes `xcrun simctl install` to reject the app:

```
App installation failed: Appex bundle defines NSExtensionPrincipalClass,
which is not allowed for the extension point com.apple.widgetkit-extension
```

**Fix**: Removed `NSExtensionPrincipalClass` from the `NSExtension` dict. The final plist `NSExtension` block:

```xml
<key>NSExtension</key>
<dict>
  <key>NSExtensionPointIdentifier</key>
  <string>com.apple.widgetkit-extension</string>
</dict>
```

---

## Important Warnings

### Do NOT run `expo prebuild --clean`

The widget target (`HistoriqHomeHeroWidget`) and its native bridge (`HistoriqWidgetBridge.m`, `HistoriqWidgetReloader.swift`) were added manually to the Xcode project. There is **no Expo config plugin** managing them. Running `expo prebuild --clean` will regenerate `project.pbxproj` from scratch, destroying all widget configuration.

The `.gitignore` is carefully set to preserve the widget files:
```
/ios/*
!/ios/HistoriqHomeHeroWidget/
/ios/HistoriqHomeHeroWidget/*
!/ios/HistoriqHomeHeroWidget/Info.plist
!/ios/HistoriqHomeHeroWidget/HistoriqHomeHeroWidget.swift
!/ios/HistoriqHomeHeroWidget/HistoriqHomeHeroWidgetBundle.swift
!/ios/HistoriqHomeHeroWidget/HistoriqHomeHeroWidget.entitlements
!/ios/codexdeneme/HistoriqWidgetBridge.m
!/ios/codexdeneme/HistoriqWidgetReloader.swift
!/ios/codexdeneme/codexdeneme.entitlements
!/ios/codexdeneme.xcodeproj/project.pbxproj
```

If `expo prebuild` must be run, back up `project.pbxproj` first and re-apply the widget target changes manually.

### After a fresh clone, always run `pod install`

Generated codegen files (`ios/build/generated/ios/`) are gitignored. The build will fail without them.

```bash
cd ios && pod install
```

---

## Deployment Checklist

Before submitting to App Store:
- [ ] App Group `group.com.ilyastorun.histora` is registered in the Apple Developer portal
- [ ] Both the main app and widget target have the App Group entitlement provisioned
- [ ] Widget bundle ID `com.ilyastorun.histora.widget` has a valid provisioning profile
- [ ] Widget bundle ID is a sub-bundle of the main app ID (`com.ilyastorun.histora`)
- [ ] Deep link scheme `historiq://` is registered in `app.config.js`

---

## Future Work

- **Expo Config Plugin**: Create a config plugin to manage the widget target in `project.pbxproj` so `expo prebuild` doesn't destroy it.
- **Image caching**: Pre-downloaded images are not persisted between timeline refreshes. Consider saving to the App Group container for faster subsequent loads.
- **Android support**: The `widget-bridge.ts` AsyncStorage fallback currently does nothing useful on Android. A Glance/AppWidget implementation would need its own bridge writing to `SharedPreferences`.
- **`systemSmall` family**: Current implementation only supports medium and large. Small size would need a reduced layout (year pill + title only).
