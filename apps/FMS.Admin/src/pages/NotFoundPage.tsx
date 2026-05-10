/**
 * File:          NotFoundPage.tsx
 * Purpose:       FMS.Admin fallback route.
 * Dependencies:  react-router-dom
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - NotFoundPage(): Sends unknown routes back to the dashboard.
 */

import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="operator-page">
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-triangle-exclamation m365-page-header__icon" />
          <h2 className="m365-page-header__title">Page not found</h2>
        </div>
      </div>
      <Link className="m365-btn m365-btn--primary" to="/">
        <i className="fa-light fa-house" />
        Dashboard
      </Link>
    </div>
  );
}
