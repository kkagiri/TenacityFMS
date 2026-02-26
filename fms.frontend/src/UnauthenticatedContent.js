/**
 * File: UnauthenticatedContent.js
 * Purpose: Defines routes for guests and preserves the originally requested route for post-login redirect.
 * Dependencies: react-router-dom, SingleCard layout, LoginForm component
 * Last Modified: 2026-02-25
 *
 * Key Functions/Components:
 * - RedirectToLoginWithReturnUrl: Redirects unknown guest routes to login with a safe redirect query.
 * - UnauthenticatedContent: Renders login route and guest fallback route.
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SingleCard } from './layouts';
import { LoginForm } from './components';

const RedirectToLoginWithReturnUrl = () => {
  const location = useLocation();
  const returnUrl = `${location.pathname}${location.search}${location.hash}`;

  return (
    <Navigate
      to={`/login?redirect=${encodeURIComponent(returnUrl)}`}
      replace
    />
  );
};

export default function UnauthenticatedContent() {
  return (
    <Routes>
      <Route
        path='/login'
        element={
          <SingleCard title="Sign In">
            <LoginForm />
          </SingleCard>
        }
      />



      <Route path='*' element={<RedirectToLoginWithReturnUrl />}></Route>
    </Routes>
  );
}
