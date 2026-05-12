/**
 * File:          LoginPage.tsx
 * Purpose:       Platform-operator login page for FMS.Admin.
 * Dependencies:  react-router-dom, Redux auth slice
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - LoginPage(): Authenticates against /api/v1/operator/login.
 */

import { FormEvent, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { loginOperator } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

type LocationState = {
  from?: { pathname?: string };
};

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, claims, loading, error } = useAppSelector(
    (state) => state.auth,
  );
  const user = useAppSelector((state) => state.auth.user);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const isOperator = Boolean(
    token &&
      ((claims.tenantKind === "system" && claims.isPlatformOperator) ||
        user?.id === "system-administrator" ||
        user?.userName === "system-admin" ||
        user?.roles.includes("Administrator")),
  );
  const returnTo =
    (location.state as LocationState | null)?.from?.pathname || "/";

  useEffect(() => {
    if (isOperator) {
      navigate(returnTo, { replace: true });
    }
  }, [isOperator, navigate, returnTo]);

  if (isOperator) {
    return <Navigate to={returnTo} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await dispatch(loginOperator({ username, password }));

    if (loginOperator.fulfilled.match(result)) {
      navigate(returnTo, { replace: true });
    }
  };

  return (
    <main className="operator-login">
      <section
        className="operator-login__panel"
        aria-labelledby="operator-login-title"
      >
        <div className="operator-login__brand-mark">F</div>
        <h1 id="operator-login-title">FMS Admin</h1>
        <p>Sign in with a platform-operator account.</p>

        <form className="operator-login__form" onSubmit={handleSubmit}>
          <label className="m365-field">
            <span>Username</span>
            <input
              className="m365-input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="m365-field">
            <span>Password</span>
            <input
              className="m365-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <div
              className="m365-info-banner m365-info-banner--error"
              role="alert"
            >
              <i className="fa-light fa-circle-exclamation m365-info-banner__icon" />
              <span className="m365-info-banner__text">{error}</span>
            </div>
          )}

          <button
            className="m365-btn m365-btn--primary operator-login__submit"
            type="submit"
            disabled={loading}
          >
            <i className="fa-light fa-right-to-bracket" />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
