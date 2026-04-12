import { useEffect, useMemo } from 'react';

import type { HomeHeroWidgetCardSnapshot, HomeHeroWidgetFamily } from '@/types/widgets';
import { trackEvent } from '@/services/analytics';
import { createHomeHeroWidgetPayload } from '@/services/widgets/home-hero-widget-payload';
import { setHomeHeroWidgetPayload } from '@/services/widgets/widget-bridge';

interface UseHomeWidgetSyncArgs {
  cards: HomeHeroWidgetCardSnapshot[];
  baseIndex?: number;
  timezone?: string;
  appScheme?: string;
  families?: HomeHeroWidgetFamily[];
  enabled?: boolean;
}

export const useHomeWidgetSync = ({
  cards,
  baseIndex = 0,
  timezone,
  appScheme,
  families,
  enabled = true,
}: UseHomeWidgetSyncArgs) => {
  const payload = useMemo(() => {
    if (!enabled || cards.length === 0) {
      return null;
    }

    return createHomeHeroWidgetPayload({
      cards,
      baseIndex,
      timezone,
      appScheme,
      families,
    });
  }, [appScheme, baseIndex, cards, enabled, families, timezone]);

  useEffect(() => {
    if (!payload) {
      return;
    }

    const sync = async () => {
      try {
        const mode = await setHomeHeroWidgetPayload(payload);
        trackEvent('widget_payload_synced', {
          event_count: payload.events.length,
          base_index: payload.baseIndex,
          mode,
        });
      } catch (error) {
        trackEvent('widget_payload_synced', {
          event_count: payload.events.length,
          base_index: payload.baseIndex,
          mode: 'error',
        });
        console.error('[Widget] failed to sync home hero payload', error);
      }
    };

    void sync();
  }, [payload]);
};
