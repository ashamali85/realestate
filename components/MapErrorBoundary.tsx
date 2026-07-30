'use client';

import { Component, type ReactNode } from 'react';
import { t, type Locale } from '@/lib/i18n';

/**
 * Catches any error thrown by the map (render or Google internals) and shows
 * the manual latitude/longitude inputs instead of crashing the whole page.
 */
export class MapErrorBoundary extends Component<
  { locale: Locale; initialLat?: number | null; initialLng?: number | null; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: {
    locale: Locale;
    initialLat?: number | null;
    initialLng?: number | null;
    children: ReactNode;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Map failed, using manual entry:', error);
  }

  render() {
    if (this.state.hasError) {
      const { locale, initialLat, initialLng } = this.props;
      return (
        <div>
          <div className="alert alert-info">{t('f_pick_on_map', locale)}</div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="latitude">{t('f_lat', locale)}</label>
              <input
                id="latitude"
                name="latitude"
                inputMode="decimal"
                defaultValue={typeof initialLat === 'number' ? initialLat : ''}
                placeholder="29.3759"
              />
            </div>
            <div className="field">
              <label htmlFor="longitude">{t('f_lng', locale)}</label>
              <input
                id="longitude"
                name="longitude"
                inputMode="decimal"
                defaultValue={typeof initialLng === 'number' ? initialLng : ''}
                placeholder="47.9774"
              />
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
