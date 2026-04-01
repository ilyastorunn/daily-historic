# Onboarding Progress Timeline - Implementation Prompt

## 🎯 Objective
Create a visual progress indicator for the onboarding flow that uses a historical timeline illustration instead of a traditional progress bar. The timeline shows 7 eras (Prehistory → Contemporary) and fills them with color as the user progresses through onboarding steps.

---

## 📋 Requirements Summary

### Visual Behavior
- **Default state**: All 7 icons in gray outline (#A89B8C)
- **Step 1 (initial)**: First icon (cave) is already colored (#6B8E7F)
- **Progressive coloring**: Each completed step colors the next icon
- **Completed icons stay colored**: Already-colored icons remain green
- **Smooth animation**: 150ms ease-out transition when icon color changes
- **No fill**: Icons remain as outline only - just change stroke color from gray to green

### Technical Specs
- **Component name**: `OnboardingProgressTimeline`
- **Asset location**: `/assets/pics/progressBar.png` (1600x325px PNG with transparent background)
- **Replace**: Current "Step X of 7" text and green progress bar in onboarding header
- **Animation library**: Use `react-native-reanimated` for smooth color transitions
- **Accessibility**: Announce progress changes to VoiceOver/TalkBack

---

## 🗂️ File Structure

```
components/
  onboarding/
    OnboardingProgressTimeline.tsx    (NEW - main component)
    
app/
  screens/
    onboarding/
      _layout.tsx                      (UPDATE - replace existing progress bar)
      
assets/
  pics/
    progressBar.png                    (ALREADY EXISTS - 1600x325px)
```

---

## 📐 Component Specification

### `components/onboarding/OnboardingProgressTimeline.tsx`

Create a new React Native component with the following specs:

#### Props Interface
```typescript
interface OnboardingProgressTimelineProps {
  currentStep: number;  // 1-7
}
```

#### Implementation Details

**Asset Handling:**
- Load PNG from `/assets/pics/progressBar.png`
- Use `react-native-tint-color` or `ColorMatrix` to recolor icons
- Divide image into 7 equal sections (width / 7 = ~228px per icon)

**Icon Regions (X coordinates):**
```typescript
const ICON_REGIONS = [
  { start: 0,    end: 228  },  // Icon 1: Prehistory (cave)
  { start: 228,  end: 456  },  // Icon 2: Ancient (temple)
  { start: 456,  end: 684  },  // Icon 3: Medieval (castle)
  { start: 684,  end: 912  },  // Icon 4: Exploration (ship)
  { start: 912,  end: 1140 },  // Icon 5: Industrial (factory)
  { start: 1140, end: 1368 },  // Icon 6: Modern (skyscrapers)
  { start: 1368, end: 1600 },  // Icon 7: Contemporary (tech building)
];
```

**Color Logic:**
```typescript
// For each icon region:
// - If iconIndex < currentStep: use ACCENT_COLOR (#6B8E7F)
// - If iconIndex >= currentStep: use INACTIVE_COLOR (#A89B8C)

const ACCENT_COLOR = '#6B8E7F';    // Sage green (completed)
const INACTIVE_COLOR = '#A89B8C';  // Warm gray (pending)
```

**Animation Approach:**

**Option A: Simple Tint (Recommended)**
```typescript
// Use 7 copies of the PNG, each with a different tint
// Show/hide with opacity based on currentStep
{ICON_REGIONS.map((region, index) => (
  <Animated.Image
    key={index}
    source={require('@/assets/pics/progressBar.png')}
    style={{
      tintColor: index < currentStep ? ACCENT_COLOR : INACTIVE_COLOR,
      opacity: animatedOpacity[index], // 150ms transition
    }}
  />
))}
```

**Option B: ColorMatrix Filter (More complex but single image)**
```typescript
// Use react-native-color-matrix-image-filters
// Apply different color matrices to different regions
// This is more performant but harder to implement
```

**Recommendation**: Start with **Option A** (tint-based) for simplicity.

#### Accessibility
```typescript
accessibilityLabel={`Progress: Step ${currentStep} of 7`}
accessibilityRole="progressbar"
accessibilityValue={{ min: 0, max: 7, now: currentStep }}
```

---

## 🔧 Integration Points

### Update `app/screens/onboarding/_layout.tsx`

**Find:**
```tsx
// Current progress indicator (approximately lines 50-70)
<View style={styles.progressContainer}>
  <Text>Step {currentStep} of 7</Text>
  <View style={styles.progressBar}>
    <View style={[styles.progressFill, { width: `${progress}%` }]} />
  </View>
</View>
```

**Replace with:**
```tsx
import OnboardingProgressTimeline from '@/components/onboarding/OnboardingProgressTimeline';

<OnboardingProgressTimeline currentStep={currentStep} />
```

**Styling:**
```typescript
// Add to stylesheet
timelineContainer: {
  width: '100%',
  height: 50,  // Adjust based on desired height
  marginVertical: 16,
  paddingHorizontal: 20,
}
```

---

## 🎨 Animation Specifications

### Timing
- **Duration**: 150ms
- **Easing**: `Easing.out(Easing.ease)`
- **Trigger**: When `currentStep` prop changes

### Implementation with Reanimated
```typescript
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing 
} from 'react-native-reanimated';

// Inside component
const iconOpacities = ICON_REGIONS.map(() => useSharedValue(0.5));

useEffect(() => {
  ICON_REGIONS.forEach((region, index) => {
    iconOpacities[index].value = withTiming(
      index < currentStep ? 1 : 0.5,
      { duration: 150, easing: Easing.out(Easing.ease) }
    );
  });
}, [currentStep]);
```

---

## 🧪 Testing Checklist

### Visual Tests
- [ ] All 7 icons visible on initial load
- [ ] First icon (cave) is green on Step 1
- [ ] Icons progressively turn green as steps advance
- [ ] Icons return to gray when navigating backward
- [ ] Animation is smooth (150ms, no jank)
- [ ] Works on both iOS and Android
- [ ] Looks good on different screen sizes (iPhone SE to iPad)

### Edge Cases
- [ ] Step 1: Only cave is green
- [ ] Step 7: All icons are green
- [ ] Rapid step changes don't break animation
- [ ] Navigation backward works correctly
- [ ] Notification permission skip (Step 5→6 or 5→7): Progress continues normally

### Accessibility
- [ ] VoiceOver announces "Progress: Step X of 7"
- [ ] TalkBack works correctly
- [ ] High contrast mode supported (if applicable)

---

## 📝 Implementation Steps

1. **Create Component File**
   - `components/onboarding/OnboardingProgressTimeline.tsx`
   - Set up basic structure with props interface

2. **Load Asset**
   - Import PNG from `/assets/pics/progressBar.png`
   - Calculate icon region widths (1600px / 7 ≈ 228px each)

3. **Implement Tinting Logic**
   - Create 7 image instances OR use single image with overlay masks
   - Apply color based on `currentStep`
   - Set up tintColor property

4. **Add Animation**
   - Use `react-native-reanimated` for smooth transitions
   - Animate color/opacity changes on step change
   - 150ms duration, ease-out easing

5. **Integrate into Onboarding**
   - Update `_layout.tsx` to use new component
   - Remove old progress bar code
   - Test navigation between steps

6. **Accessibility**
   - Add proper ARIA labels
   - Test with VoiceOver/TalkBack

7. **Polish**
   - Adjust sizing/spacing to match NorthStar design
   - Ensure works on all screen sizes
   - Performance check (no dropped frames)

---

## 🎯 Expected Outcome

### Before (Current)
```
┌──────────────────────────┐
│ ← Step 3 of 7       Skip │
│ ▓▓▓▓▓░░░░░░░░░░░░   │  ← Green bar
└──────────────────────────┘
```

### After (New)
```
┌──────────────────────────────────────────┐
│ ←                              Skip      │
│ 🏛️ 🏰 🚢 🏭 🏙️ 🏢 🛸                  │  ← Timeline
│ ━━ ━━ ━━ ── ── ── ──                    │
│ (green icons: completed, gray: pending)  │
└──────────────────────────────────────────┘
```

**Visual:**
- Icons 1-3: Green outline (#6B8E7F)
- Icons 4-7: Gray outline (#A89B8C)
- Smooth transition when step changes

---

## 🚨 Important Notes

### Colors (From NorthStar.md)
- **Accent green**: `#6B8E7F` (completed icons)
- **Neutral gray**: `#A89B8C` (inactive icons)
- **No fill**: Icons remain as outline only - do NOT fill solid

### Asset Details
- **File**: `/assets/pics/progressBar.png`
- **Size**: 1600x325px
- **Format**: PNG with transparent background
- **Content**: 7 historical era icons + connecting line at bottom
- **Style**: Thin line art, all in same color (will be tinted)

### Step Mapping (7 Steps)
```typescript
const STEP_LABELS = [
  'Welcome',           // Step 1
  'Choose Categories', // Step 2  
  'Focus by Era',      // Step 3
  'Preview',           // Step 4
  'Notifications',     // Step 5
  'Reminder Time',     // Step 6 (conditional - only if notifications enabled)
  'Account Setup',     // Step 7
];
```

**Special case**: If user declines notifications in Step 5, Step 6 is skipped. However, the progress timeline should still show normal progression (no visual gap). The step counting logic already handles this in the onboarding context.

### Performance Considerations
- Use `useMemo` for icon region calculations
- Consider `react-native-fast-image` if performance issues
- Avoid re-rendering entire component on unrelated state changes

---

## 📚 Reference Files

Check these project files for context:
- `app/screens/onboarding/_layout.tsx` - Current progress bar implementation
- `components/onboarding/OnboardingContext.tsx` - Step management logic
- `theme/` - Color tokens and spacing
- `documentations/NorthStar.md` - Design principles

---

## ✅ Success Criteria

The implementation is complete when:

1. ✅ Timeline displays all 7 icons clearly
2. ✅ First icon is green on initial load (Step 1)
3. ✅ Icons progressively turn green as user advances
4. ✅ Color transition animates smoothly (150ms)
5. ✅ Icons revert to gray when navigating backward
6. ✅ Works on iOS and Android without visual glitches
7. ✅ Accessibility labels work correctly
8. ✅ No performance issues (maintains 60fps)
9. ✅ Matches NorthStar design principles (calm, minimal)

---

## 🤔 Questions / Clarifications Needed?

If anything is unclear during implementation:

1. **Icon positioning**: If icons aren't evenly spaced, adjust ICON_REGIONS manually
2. **Color intensity**: If green is too strong, reduce opacity to 0.8
3. **Animation feel**: If 150ms feels too fast/slow, adjust in 50ms increments
4. **Asset issues**: If PNG looks blurry, check if it's being loaded at correct resolution

**Good luck! This will look amazing when done.** 🎨✨
