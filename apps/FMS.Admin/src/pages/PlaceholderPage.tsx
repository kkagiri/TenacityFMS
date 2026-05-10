/**
 * File:          PlaceholderPage.tsx
 * Purpose:       Lightweight placeholder for Phase 2 operator modules.
 * Dependencies:  React
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - PlaceholderPage(): Displays a module shell until backend endpoints land.
 */

type PlaceholderPageProps = {
  title: string;
  icon: string;
};

export default function PlaceholderPage({ title, icon }: PlaceholderPageProps) {
  return (
    <div className="operator-page">
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className={`${icon} m365-page-header__icon`} />
          <h2 className="m365-page-header__title">{title}</h2>
        </div>
      </div>
      <div className="m365-info-banner">
        <i className="fa-light fa-circle-info m365-info-banner__icon" />
        <span className="m365-info-banner__text">
          This module is scaffolded and ready for its operator API endpoints.
        </span>
      </div>
    </div>
  );
}
