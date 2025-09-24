import { StyleSheet } from 'react-native';

import { lightTheme, spacing as spacingScale, radius as radiusScale } from '@/theme';

const theme = lightTheme;
const { colors } = theme;
const accentColor = colors.accentPrimary;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  header: {
    paddingHorizontal: spacingScale.xl,
    paddingTop: spacingScale.xl,
    paddingBottom: spacingScale.md,
    backgroundColor: colors.headerBackground,
  },
  progressText: {
    color: colors.textInverse,
    fontSize: 14,
    letterSpacing: 0.4,
  },
  progressBarTrack: {
    height: 6,
    width: '100%',
    backgroundColor: colors.progressTrack,
    borderRadius: radiusScale.pill,
    marginTop: spacingScale.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: accentColor,
    borderRadius: radiusScale.pill,
  },
  contentWrapper: {
    flex: 1,
    borderTopLeftRadius: radiusScale.xl,
    borderTopRightRadius: radiusScale.xl,
    backgroundColor: colors.screen,
    paddingHorizontal: spacingScale.xl,
    paddingTop: spacingScale.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacingScale.lg,
    paddingHorizontal: spacingScale.xl,
    paddingVertical: spacingScale.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.screen,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: accentColor,
    paddingVertical: spacingScale.lg,
    borderRadius: radiusScale.md,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingScale.lg,
    borderRadius: radiusScale.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  pressedButton: {
    opacity: 0.8,
  },
  secondaryButtonText: {
    color: accentColor,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.4,
  },
  disabledButtonText: {
    color: colors.textTertiary,
  },
  stepScroll: {
    paddingBottom: spacingScale.xxl,
    gap: spacingScale.xl,
  },
  heroCard: {
    backgroundColor: colors.heroBackground,
    padding: spacingScale.xl,
    borderRadius: radiusScale.xl,
    gap: spacingScale.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.heroBorder,
  },
  heroTitle: {
    color: colors.textInverse,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '600',
  },
  heroSubtitle: {
    color: colors.accentMuted,
    fontSize: 16,
    lineHeight: 22,
  },
  section: {
    gap: spacingScale.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionCopy: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stackGap: {
    gap: spacingScale.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radiusScale.card,
    padding: spacingScale.card,
    gap: spacingScale.sm,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
  },
  cardSelected: {
    borderWidth: 1,
    borderColor: accentColor,
    shadowOpacity: 0.12,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  cardTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  cardHint: {
    fontSize: 13,
    color: accentColor,
  },
  helperText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacingScale.lg,
    paddingVertical: spacingScale.sm,
    borderRadius: radiusScale.md,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inlinePrimaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: accentColor,
    paddingHorizontal: spacingScale.card,
    paddingVertical: spacingScale.sm,
    borderRadius: radiusScale.pill,
  },
  inlinePrimaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '600',
  },
  optionChip: {
    paddingHorizontal: spacingScale.card,
    paddingVertical: spacingScale.sm,
    borderRadius: radiusScale.pill,
    marginRight: spacingScale.md,
    marginBottom: spacingScale.md,
  },
  optionChipOutlined: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  optionChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: accentColor,
  },
  optionChipPressed: {
    opacity: 0.85,
  },
  optionChipText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  optionChipTextActive: {
    color: accentColor,
  },
  chipRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ghostButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacingScale.lg,
    paddingVertical: spacingScale.sm,
    borderRadius: radiusScale.pill,
    backgroundColor: colors.accentSoft,
  },
  ghostButtonPressed: {
    opacity: 0.85,
  },
  ghostButtonText: {
    color: accentColor,
    fontWeight: '600',
  },
  inlineButtonsRow: {
    flexDirection: 'row',
    gap: spacingScale.md,
    marginTop: spacingScale.md,
  },
  inlineGhostButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacingScale.lg,
    paddingVertical: spacingScale.sm,
    borderRadius: radiusScale.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  inlineGhostButtonActive: {
    backgroundColor: colors.accentSoft,
    borderColor: accentColor,
  },
  inlineGhostButtonPressed: {
    opacity: 0.85,
  },
  inlineGhostButtonText: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  inlineGhostButtonTextActive: {
    color: accentColor,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacingScale.md,
    backgroundColor: colors.screen,
    paddingHorizontal: spacingScale.xl,
  },
  bulletList: {
    gap: spacingScale.xs,
  },
  bulletItem: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

export { accentColor, colors, radiusScale, spacingScale, styles, theme };
