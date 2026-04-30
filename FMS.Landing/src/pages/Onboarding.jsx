import React, { Fragment, useMemo, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { navigate } from "../components/Layout.jsx";

const INDUSTRIES = [
  "Logistics & Transport",
  "Mining",
  "Construction",
  "Retail Fuel",
  "Public Sector",
  "Agriculture",
  "Other",
];
const COUNTRIES = [
  "South Africa",
  "Kenya",
  "Nigeria",
  "Ghana",
  "United Kingdom",
  "United States",
  "Australia",
  "United Arab Emirates",
  "India",
  "Other",
];
const FLEET_SIZES = ["1 – 10", "11 – 50", "51 – 200", "201 – 500", "500+"];
const SITE_COUNTS = ["1", "2 – 5", "6 – 20", "21 – 50", "50+"];
const PLAN_CHOICES = [
  { code: "free", name: "Free Trial", price: "Free for 14 days" },
  { code: "starter", name: "Starter", price: "$249/mo" },
  { code: "growth", name: "Growth", price: "$649/mo", featured: true },
  { code: "pro", name: "Pro", price: "$1,490/mo" },
];

function Stepper({ step }) {
  const labels = ["Company", "Plan", "Contact"];
  return (
    <div className="row gap-2 center" style={{ marginBottom: 40 }}>
      {labels.map((l, i) => {
        const idx = i + 1;
        const done = step > idx;
        const current = step === idx;
        return (
          <Fragment key={l}>
            <div className="row gap-2 center">
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: done
                    ? "var(--success)"
                    : current
                      ? "var(--primary)"
                      : "var(--surface-3)",
                  color: done || current ? "#fff" : "var(--text-3)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "all 200ms",
                }}
              >
                {done ? <Icon name="check" size={14} /> : idx}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: current ? 600 : 500,
                  color: current ? "var(--text)" : "var(--text-2)",
                }}
              >
                {l}
              </div>
            </div>
            {i < labels.length - 1 && (
              <div
                style={{
                  width: 48,
                  height: 1,
                  background: done ? "var(--success)" : "var(--border-strong)",
                }}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function Field({ label, hint, error, required, children }) {
  return (
    <div className="field">
      <label>
        {label}
        {required && (
          <span style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>
        )}
      </label>
      {children}
      {error ? (
        <div className="err">
          <Icon name="x" size={12} />
          {error}
        </div>
      ) : hint ? (
        <div className="hint">{hint}</div>
      ) : null}
    </div>
  );
}

function Step1Company({ data, set, errors }) {
  return (
    <div>
      <h2 style={{ fontSize: 28, marginBottom: 8 }}>
        Tell us about your company
      </h2>
      <p className="muted" style={{ marginBottom: 32 }}>
        So we can pre-configure the right modules for your trial.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Field label="Company name" required error={errors.companyName}>
          <input
            className={"input" + (errors.companyName ? " invalid" : "")}
            value={data.companyName || ""}
            onChange={(e) => set("companyName", e.target.value)}
            placeholder="e.g. Norden Group"
          />
        </Field>
        <Field label="Industry" required error={errors.industry}>
          <select
            className={"select" + (errors.industry ? " invalid" : "")}
            value={data.industry || ""}
            onChange={(e) => set("industry", e.target.value)}
          >
            <option value="">Select industry…</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Country" required error={errors.country}>
          <select
            className={"select" + (errors.country ? " invalid" : "")}
            value={data.country || ""}
            onChange={(e) => set("country", e.target.value)}
          >
            <option value="">Select country…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fleet size" required error={errors.fleetSize}>
          <select
            className={"select" + (errors.fleetSize ? " invalid" : "")}
            value={data.fleetSize || ""}
            onChange={(e) => set("fleetSize", e.target.value)}
          >
            <option value="">Select fleet size…</option>
            {FLEET_SIZES.map((c) => (
              <option key={c} value={c}>
                {c} vehicles
              </option>
            ))}
          </select>
        </Field>
        <Field label="Number of sites" required error={errors.siteCount}>
          <select
            className={"select" + (errors.siteCount ? " invalid" : "")}
            value={data.siteCount || ""}
            onChange={(e) => set("siteCount", e.target.value)}
          >
            <option value="">Select…</option>
            {SITE_COUNTS.map((c) => (
              <option key={c} value={c}>
                {c} sites
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

function Step2Plan({ data, set, errors }) {
  return (
    <div>
      <h2 style={{ fontSize: 28, marginBottom: 8 }}>
        Choose your starting plan
      </h2>
      <p className="muted" style={{ marginBottom: 32 }}>
        You can switch any time. Trials never auto-charge.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {PLAN_CHOICES.map((p) => (
          <label
            key={p.code}
            style={{
              display: "flex",
              gap: 14,
              padding: 18,
              border:
                data.plan === p.code
                  ? "2px solid var(--primary)"
                  : "1px solid var(--border-strong)",
              borderRadius: 8,
              cursor: "pointer",
              background:
                data.plan === p.code ? "var(--primary-tint-2)" : "#fff",
              position: "relative",
            }}
          >
            <input
              type="radio"
              name="plan"
              value={p.code}
              checked={data.plan === p.code}
              onChange={() => set("plan", p.code)}
              style={{ marginTop: 2, accentColor: "var(--primary)" }}
            />
            <div style={{ flex: 1 }}>
              <div className="row between center" style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</div>
                {p.featured && (
                  <span className="badge" style={{ fontSize: 10 }}>
                    Recommended
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-2)" }}>
                {p.price}
              </div>
            </div>
          </label>
        ))}
      </div>
      {errors.plan && (
        <div className="err" style={{ marginBottom: 20 }}>
          <Icon name="x" size={12} />
          {errors.plan}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <Field label="Billing currency" required>
          <select
            className="select"
            value={data.currency || "USD"}
            onChange={(e) => set("currency", e.target.value)}
          >
            {["USD", "EUR", "GBP", "ZAR", "KES", "AUD"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Billing cycle" required>
          <select
            className="select"
            value={data.cycle || "annual"}
            onChange={(e) => set("cycle", e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual (save 18%)</option>
          </select>
        </Field>
      </div>
      <Field
        label="Notes for our team"
        hint="Anything specific we should know about your operation? (optional)"
      >
        <textarea
          className="textarea"
          rows={3}
          value={data.notes || ""}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="e.g. We run depot fuel at 6 sites and need PTS configured for RFID at days 1."
          maxLength={1000}
        />
      </Field>
    </div>
  );
}

function Step3Contact({ data, set, errors }) {
  return (
    <div>
      <h2 style={{ fontSize: 28, marginBottom: 8 }}>
        Last step — who should we contact?
      </h2>
      <p className="muted" style={{ marginBottom: 32 }}>
        Sales follows up within 1 business day.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <Field label="Full name" required error={errors.fullName}>
          <input
            className={"input" + (errors.fullName ? " invalid" : "")}
            value={data.fullName || ""}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="Jane Doe"
          />
        </Field>
        <Field label="Job title" error={errors.jobTitle}>
          <input
            className={"input" + (errors.jobTitle ? " invalid" : "")}
            value={data.jobTitle || ""}
            onChange={(e) => set("jobTitle", e.target.value)}
            placeholder="Operations Manager"
          />
        </Field>
        <Field label="Work email" required error={errors.email}>
          <input
            className={"input" + (errors.email ? " invalid" : "")}
            type="email"
            value={data.email || ""}
            onChange={(e) => set("email", e.target.value)}
            placeholder="jane@company.com"
          />
        </Field>
        <Field label="Phone" hint="Optional — include country code">
          <input
            className="input"
            value={data.phone || ""}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+27 82 555 1234"
          />
        </Field>
      </div>
      <div
        style={{
          marginTop: 10,
          padding: 16,
          background: "var(--surface-2)",
          borderRadius: 6,
          marginBottom: 16,
        }}
      >
        <label className="check">
          <input
            type="checkbox"
            checked={!!data.consent}
            onChange={(e) => set("consent", e.target.checked)}
          />
          <span>
            I agree to be contacted by Tenacy FMS about my trial and related
            products. I can unsubscribe anytime.{" "}
            <a href="#" style={{ color: "var(--primary)" }}>
              Privacy policy
            </a>
            .
          </span>
        </label>
        {errors.consent && (
          <div className="err" style={{ marginTop: 8 }}>
            <Icon name="x" size={12} />
            {errors.consent}
          </div>
        )}
      </div>
      {/* honeypot */}
      <input
        type="text"
        name="company_url"
        style={{ position: "absolute", left: "-9999px" }}
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
      />
    </div>
  );
}

function SuccessState({ data }) {
  return (
    <div style={{ textAlign: "center", padding: "var(--s-9) 0" }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "var(--success-tint)",
          color: "var(--success)",
          display: "grid",
          placeItems: "center",
          margin: "0 auto var(--s-5)",
        }}
      >
        <Icon name="check" size={36} strokeWidth={2} />
      </div>
      <h2 style={{ fontSize: 32, marginBottom: 12 }}>You&apos;re in.</h2>
      <p
        style={{
          fontSize: 16,
          color: "var(--text-2)",
          maxWidth: 480,
          margin: "0 auto var(--s-7)",
        }}
      >
        Thanks {data.fullName?.split(" ")[0] || "—"}. Sales will be in touch
        within 1 business day at <strong>{data.email}</strong> to spin up your{" "}
        {PLAN_CHOICES.find((p) => p.code === data.plan)?.name || "Tenacy"}{" "}
        environment.
      </p>
      <div
        className="card"
        style={{
          maxWidth: 440,
          margin: "0 auto var(--s-7)",
          textAlign: "left",
          padding: 20,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 12,
            fontWeight: 600,
          }}
        >
          Request reference
        </div>
        <div
          className="mono"
          style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}
        >
          OB-2026-{Math.floor(Math.random() * 90000 + 10000)}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: 13,
          }}
        >
          <div className="row between">
            <span className="muted">Plan</span>
            <span style={{ fontWeight: 600 }}>
              {PLAN_CHOICES.find((p) => p.code === data.plan)?.name}
            </span>
          </div>
          <div className="row between">
            <span className="muted">Company</span>
            <span style={{ fontWeight: 600 }}>{data.companyName}</span>
          </div>
          <div className="row between">
            <span className="muted">Country</span>
            <span style={{ fontWeight: 600 }}>{data.country}</span>
          </div>
        </div>
      </div>
      <div className="row gap-3" style={{ justifyContent: "center" }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => navigate("home")}
        >
          Back to home
        </button>
        <button
          className="btn btn-secondary btn-lg"
          onClick={() => alert("Sign in → existing /login")}
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const initialPlan = useMemo(() => {
    const m = window.location.hash.match(/plan=([a-z]+)/);
    return m ? m[1] : "growth";
  }, []);
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    plan: initialPlan,
    currency: "USD",
    cycle: "annual",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!data.companyName?.trim()) e.companyName = "Required";
      if (!data.industry) e.industry = "Required";
      if (!data.country) e.country = "Required";
      if (!data.fleetSize) e.fleetSize = "Required";
      if (!data.siteCount) e.siteCount = "Required";
    } else if (step === 2) {
      if (!data.plan) e.plan = "Choose a plan to continue";
    } else if (step === 3) {
      if (!data.fullName?.trim()) e.fullName = "Required";
      if (!data.email?.trim()) e.email = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
        e.email = "Enter a valid email";
      if (!data.consent) e.consent = "Please confirm to continue";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    if (step < 3) setStep(step + 1);
    else submit();
  };
  const submit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 700);
  };

  return (
    <main
      style={{
        background: "var(--surface-2)",
        minHeight: "calc(100vh - var(--header-h))",
      }}
    >
      <section
        style={{
          paddingTop: "calc(var(--header-h) + var(--s-7))",
          paddingBottom: "var(--s-9)",
        }}
      >
        <div className="container" style={{ maxWidth: 760 }}>
          <div
            className="card card-glow"
            style={{ padding: "var(--s-9)", background: "#fff" }}
          >
            {submitted ? (
              <SuccessState data={data} />
            ) : (
              <>
                <Stepper step={step} />
                {step === 1 && (
                  <Step1Company data={data} set={set} errors={errors} />
                )}
                {step === 2 && (
                  <Step2Plan data={data} set={set} errors={errors} />
                )}
                {step === 3 && (
                  <Step3Contact data={data} set={set} errors={errors} />
                )}
                <div
                  className="row between center"
                  style={{
                    marginTop: 40,
                    paddingTop: 24,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <button
                    className="btn btn-ghost"
                    onClick={() =>
                      step > 1 ? setStep(step - 1) : navigate("home")
                    }
                  >
                    <Icon name="chevron_left" size={14} />
                    {step === 1 ? "Cancel" : "Back"}
                  </button>
                  <div className="row gap-3 center">
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>
                      Step {step} of 3
                    </span>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={next}
                      disabled={submitting}
                    >
                      {submitting
                        ? "Submitting…"
                        : step === 3
                          ? "Submit"
                          : "Continue"}
                      {!submitting && <Icon name="arrow_right" size={14} />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          {!submitted && (
            <div
              style={{
                textAlign: "center",
                marginTop: 24,
                fontSize: 13,
                color: "var(--text-3)",
              }}
            >
              <Icon
                name="lock"
                size={12}
                style={{ verticalAlign: "middle", marginRight: 6 }}
              />
              Your information is encrypted in transit. We never share with
              third parties.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
