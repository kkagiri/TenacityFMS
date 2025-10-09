/**
 * File: single-card.js
 * Purpose: Layout wrapper for unauthenticated views (e.g., login) with centered card presentation
 * Dependencies: devextreme-react/scroll-view, single-card.scss
 * Last Modified: 2025-10-08
 *
 * Key Functions/Components:
 * - SingleCard: Renders children inside a vertically and horizontally centered card layout
 */

import React from 'react';
import './single-card.scss';

export default function SingleCard({ title, description, children }) {
  return (
    <div className="single-card-container tw-min-h-screen tw-bg-slate-100 tw-flex tw-items-center tw-justify-center tw-p-6">
      <div className="single-card-inner tw-w-full tw-max-w-5xl tw-flex tw-flex-col tw-items-center tw-gap-10">
        <div className="single-card-hero tw-text-center tw-flex tw-flex-col tw-gap-3">
          <span className="tw-text-sm tw-uppercase tw-tracking-[0.28em] tw-text-slate-400">Fleet Management System</span>
          <h1 className="tw-text-3xl tw-font-semibold tw-text-slate-700">{title}</h1>
          {description ? (
            <p className="tw-text-base tw-text-slate-500 tw-max-w-xl tw-mx-auto">{description}</p>
          ) : null}
        </div>

        <div className={'single-card-scroll'}>
          <div className={'dx-card single-card-card'}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
