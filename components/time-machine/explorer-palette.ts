import type { ThemeDefinition } from '@/theme';

export type TimeMachineExplorerPalette = {
  background: string;
  selectionBand: string;
  selectionBorder: string;
  selectedText: string;
  mutedText: string;
  edgeFadeOpaque: string;
  edgeFadeTransparent: string;
  backPressed: string;
};

export const getTimeMachineExplorerPalette = (
  theme: ThemeDefinition
): TimeMachineExplorerPalette => {
  if (theme.mode === 'dark') {
    return {
      background: theme.palette.slate950,
      selectionBand: 'rgba(237, 231, 222, 0.08)',
      selectionBorder: 'rgba(237, 231, 222, 0.12)',
      selectedText: theme.palette.slate100,
      mutedText: 'rgba(237, 231, 222, 0.34)',
      edgeFadeOpaque: theme.palette.slate950,
      edgeFadeTransparent: 'rgba(21, 19, 15, 0)',
      backPressed: 'rgba(237, 231, 222, 0.08)',
    };
  }

  return {
    background: theme.palette.slate50,
    selectionBand: 'rgba(28, 26, 22, 0.06)',
    selectionBorder: 'rgba(28, 26, 22, 0.10)',
    selectedText: theme.palette.midnight,
    mutedText: 'rgba(28, 26, 22, 0.34)',
    edgeFadeOpaque: theme.palette.slate50,
    edgeFadeTransparent: 'rgba(247, 244, 238, 0)',
    backPressed: 'rgba(28, 26, 22, 0.06)',
  };
};
