import React, { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { navigate } from "../components/Layout.jsx";

const CURRENCIES = [
  { code: "USD", symbol: "$", rate: 1, label: "US Dollar" },
  { code: "EUR", symbol: "€", rate: 0.92, label: "Euro" },
  { code: "GBP", symbol: "£", rate: 0.79, label: "British Pound" },
  { code: "ZAR", symbol: "R", rate: 18.5, label: "South African Rand" },
  { code: "KES", symbol: "KSh", rate: 129, label: "Kenyan Shilling" },
  { code: "AUD", symbol: "A$", rate: 1.52, label: "Australian Dollar" },
];

const PLANS = [
  {
    code: "free",
    name: "Free Trial",
    monthlyUsd: 0,
    desc: "Full-feature 14-day trial. Pick any plan after.",
    quotas: { vehicles: 5, users: 3, sites: 1, pumps: 2, sensors: 4 },
    features: [
      "GPS tracking",
      "Fuel audit basics",
      "1 alarm rule",
      "Email support",
    ],
    cta: "Start free trial",
    ctaRoute: "onboarding",
    trial: true,
  },
  {
    code: "starter",
    name: "Starter",
    monthlyUsd: 249,
    desc: "For small operators getting visibility for the first time.",
    quotas: { vehicles: 25, users: 10, sites: 2, pumps: 8, sensors: 16 },
    features: [
      "Everything in Trial",
      "Geofencing & route history",
      "Fuel audit + reconciliation",
      "5 alarm rules",
      "Standard reports",
      "Email + chat support",
    ],
    cta: "Start with Starter",
    ctaRoute: "onboarding",
  },
  {
    code: "growth",
    name: "Growth",
    monthlyUsd: 649,
    featured: true,
    desc: "The default for fleets running their own depot fuel.",
    quotas: { vehicles: 100, users: 30, sites: 10, pumps: 40, sensors: 80 },
    features: [
      "Everything in Starter",
      "PTS pump control",
      "Tank stock + ATG",
      "Unlimited alarm rules",
      "Driver scoring",
      "Scheduled reports",
      "Priority support",
    ],
    cta: "Start with Growth",
    ctaRoute: "onboarding",
  },
  {
    code: "pro",
    name: "Pro",
    monthlyUsd: 1490,
    desc: "Multi-site operators who need workflows and API.",
    quotas: { vehicles: 400, users: 100, sites: 50, pumps: 200, sensors: 400 },
    features: [
      "Everything in Growth",
      "Workflow automation",
      "API + webhooks",
      "Issue tracker + warning letters",
      "Custom report builder",
      "SSO (SAML/OIDC)",
      "24/7 priority support",
    ],
    cta: "Start with Pro",
    ctaRoute: "onboarding",
  },
  {
    code: "enterprise",
    name: "Enterprise",
    monthlyUsd: null,
    desc: "Multi-tenant deployments, custom SLAs, on-prem options.",
    quotas: {
      vehicles: "Unlimited",
      users: "Unlimited",
      sites: "Unlimited",
      pumps: "Unlimited",
      sensors: "Unlimited",
    },
    features: [
      "Everything in Pro",
      "Multi-tenancy",
      "Dedicated infra option",
      "Custom integrations",
      "Named CSM",
      "Custom SLA + DPA",
      "Onsite onboarding",
    ],
    cta: "Talk to sales",
    ctaRoute: "contact",
  },
];

function formatMoney(amount, currency) {
  if (amount === null || amount === undefined) return null;
  if (amount === 0) return "Free";
  const v = Math.round(amount * currency.rate);
  return currency.symbol + v.toLocaleString("en-US");
}

function PricingHero({ currency, setCurrency, cycle, setCycle }) {
  return (
    <section
      style={{
        paddingTop: "calc(var(--header-h) + var(--s-9))",
        paddingBottom: "var(--s-7)",
        background:
          "linear-gradient(180deg, var(--primary-tint-2) 0%, #FFFFFF 100%)",
        borderBottom: "1px solid var(--border)",
        textAlign: "center",
      }}
    >
      <div className="container" style={{ maxWidth: 760 }}>
        <span className="eyebrow" style={{ justifyContent: "center" }}>
          Pricing
        </span>
        <h1
          style={{
            marginTop: 16,
            marginBottom: 16,
            fontSize: "clamp(36px, 4.5vw, 56px)",
          }}
        >
          Pay by the vehicle, not by the surprise.
        </h1>
        <p style={{ fontSize: 18, color: "var(--text-2)", marginBottom: 36 }}>
          Live pricing in your currency. Switch plans anytime. Annual billing
          saves you 18%.
        </p>
        <div className="row gap-3 center" style={{ justifyContent: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 6px 4px 12px",
              background: "#fff",
              border: "1px solid var(--border-strong)",
              borderRadius: 999,
            }}
          >
            <Icon name="globe" size={14} style={{ color: "var(--text-2)" }} />
            <select
              value={currency.code}
              onChange={(e) =>
                setCurrency(CURRENCIES.find((c) => c.code === e.target.value))
              }
              style={{
                border: "none",
                background: "transparent",
                fontSize: 14,
                fontWeight: 600,
                padding: "6px 24px 6px 4px",
                appearance: "none",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              display: "inline-flex",
              padding: 4,
              background: "#fff",
              border: "1px solid var(--border-strong)",
              borderRadius: 999,
            }}
          >
            {[
              ["monthly", "Monthly"],
              ["annual", "Annual"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCycle(key)}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 999,
                  cursor: "pointer",
                  background: cycle === key ? "var(--primary)" : "transparent",
                  color: cycle === key ? "#fff" : "var(--text)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {label}
                {key === "annual" && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      background:
                        cycle === "annual"
                          ? "rgba(255,255,255,0.25)"
                          : "var(--success-tint)",
                      color: cycle === "annual" ? "#fff" : "var(--success)",
                      borderRadius: 999,
                      fontWeight: 700,
                    }}
                  >
                    SAVE 18%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan, currency, cycle }) {
  const price =
    plan.monthlyUsd === null
      ? null
      : cycle === "annual"
        ? plan.monthlyUsd * 0.82
        : plan.monthlyUsd;
  const formatted = formatMoney(price, currency);
  const featured = plan.featured;
  const isFree = plan.trial;

  return (
    <div
      style={{
        background: "#fff",
        border: featured
          ? "2px solid var(--primary)"
          : "1px solid var(--border)",
        borderRadius: "var(--r-3)",
        padding: "28px 24px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        boxShadow: featured ? "var(--el-3)" : "none",
      }}
    >
      {featured && (
        <span
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--primary)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 12px",
            borderRadius: 999,
            letterSpacing: "0.04em",
          }}
        >
          MOST POPULAR
        </span>
      )}
      {isFree && (
        <span
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--success)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 12px",
            borderRadius: 999,
            letterSpacing: "0.04em",
          }}
        >
          14 DAYS FREE
        </span>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <h3 style={{ fontSize: 18 }}>{plan.name}</h3>
      </div>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-2)",
          minHeight: 40,
          marginBottom: 20,
        }}
      >
        {plan.desc}
      </p>
      <div style={{ marginBottom: 24 }}>
        {formatted === null ? (
          <div
            style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}
          >
            Custom
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  fontFeatureSettings: "'tnum'",
                }}
              >
                {formatted}
              </span>
              {plan.monthlyUsd > 0 && (
                <span style={{ fontSize: 14, color: "var(--text-3)" }}>
                  /mo
                </span>
              )}
            </div>
            {cycle === "annual" && plan.monthlyUsd > 0 && (
              <div
                style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}
              >
                Billed annually as{" "}
                {formatMoney(plan.monthlyUsd * 0.82 * 12, currency)}
              </div>
            )}
            {cycle === "monthly" && plan.monthlyUsd > 0 && (
              <div
                style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}
              >
                Billed monthly
              </div>
            )}
            {plan.monthlyUsd === 0 && (
              <div
                style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}
              >
                No card required
              </div>
            )}
          </>
        )}
      </div>
      <button
        className={
          featured || isFree
            ? "btn btn-primary btn-block"
            : "btn btn-secondary btn-block"
        }
        style={{ marginBottom: 24 }}
        onClick={() =>
          navigate(
            plan.ctaRoute +
              (plan.code !== "free" && plan.code !== "enterprise"
                ? "?plan=" + plan.code
                : ""),
          )
        }
      >
        {plan.cta}
      </button>
      <div
        style={{
          padding: 14,
          background: "var(--surface-2)",
          borderRadius: 6,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            fontSize: 12,
          }}
        >
          {Object.entries(plan.quotas).map(([k, v]) => (
            <div
              key={k}
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <span
                style={{ color: "var(--text-2)", textTransform: "capitalize" }}
              >
                {k}
              </span>
              <span style={{ fontWeight: 600, fontFeatureSettings: "'tnum'" }}>
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {plan.features.map((f) => (
          <li
            key={f}
            style={{
              display: "flex",
              gap: 8,
              fontSize: 13,
              color: "var(--text)",
            }}
          >
            <Icon
              name="check"
              size={16}
              style={{ color: "var(--primary)", marginTop: 2 }}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComparisonTable({ currency, cycle }) {
  const rows = [
    ["Vehicles", ["5", "25", "100", "400", "Unlimited"]],
    ["Users", ["3", "10", "30", "100", "Unlimited"]],
    ["Sites", ["1", "2", "10", "50", "Unlimited"]],
    ["Pumps", ["2", "8", "40", "200", "Unlimited"]],
    ["Sensors", ["4", "16", "80", "400", "Unlimited"]],
    ["GPS tracking", [true, true, true, true, true]],
    ["Geofencing", [false, true, true, true, true]],
    ["Fuel audit", ["Basic", true, true, true, true]],
    ["Tank stock + ATG", [false, false, true, true, true]],
    ["PTS pump control", [false, false, true, true, true]],
    ["Alarm rules", ["1", "5", "Unlimited", "Unlimited", "Unlimited"]],
    ["Driver scoring", [false, false, true, true, true]],
    ["Workflow automation", [false, false, false, true, true]],
    ["API + webhooks", [false, false, false, true, true]],
    ["SSO (SAML/OIDC)", [false, false, false, true, true]],
    ["Multi-tenancy", [false, false, false, false, true]],
    ["Support", ["Email", "Email + chat", "Priority", "24/7", "Named CSM"]],
  ];
  return (
    <section className="section">
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            Compare
          </span>
          <h2 style={{ marginTop: 12 }}>Every feature, side by side.</h2>
        </div>
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "16px 20px",
                    fontWeight: 600,
                    fontSize: 13,
                    color: "var(--text-2)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Feature
                </th>
                {PLANS.map((p) => {
                  const price =
                    p.monthlyUsd === null
                      ? null
                      : cycle === "annual"
                        ? p.monthlyUsd * 0.82
                        : p.monthlyUsd;
                  return (
                    <th
                      key={p.code}
                      style={{
                        padding: "16px 12px",
                        textAlign: "center",
                        borderBottom: "1px solid var(--border)",
                        borderLeft: "1px solid var(--border)",
                        background: p.featured
                          ? "var(--primary-tint-2)"
                          : "var(--surface-2)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: p.featured
                            ? "var(--primary-pressed)"
                            : "var(--text)",
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-2)",
                          marginTop: 4,
                          fontFeatureSettings: "'tnum'",
                        }}
                      >
                        {price === null
                          ? "Custom"
                          : price === 0
                            ? "Free"
                            : formatMoney(price, currency) + "/mo"}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row[0]}
                  style={{ background: i % 2 ? "var(--surface-2)" : "#fff" }}
                >
                  <td
                    style={{
                      padding: "12px 20px",
                      fontWeight: 500,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {row[0]}
                  </td>
                  {row[1].map((cell, j) => (
                    <td
                      key={j}
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        borderBottom: "1px solid var(--border)",
                        borderLeft: "1px solid var(--border)",
                        fontFeatureSettings: "'tnum'",
                      }}
                    >
                      {cell === true ? (
                        <Icon
                          name="check"
                          size={18}
                          style={{
                            color: "var(--success)",
                            margin: "0 auto",
                            display: "inline-block",
                          }}
                        />
                      ) : cell === false ? (
                        <Icon
                          name="x"
                          size={16}
                          style={{
                            color: "var(--text-3)",
                            margin: "0 auto",
                            display: "inline-block",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 13 }}>{cell}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "Is there really a free trial?",
      a: "Yes. 14 days, full features (up to 5 vehicles and 1 site), no credit card required. After day 14 you pick a paid plan or your data archives in read-only for 30 days.",
    },
    {
      q: "How does billing work across currencies?",
      a: "Pricing is shown live in your selected currency, computed from our base USD rate. Once you sign up, your billing currency locks for the contract term — no surprise FX swings.",
    },
    {
      q: "Can I switch plans later?",
      a: "Anytime, both ways. Upgrades prorate immediately; downgrades take effect at your next billing cycle. No re-onboarding needed.",
    },
    {
      q: "What happens if I exceed my vehicle quota?",
      a: "We don't cut you off mid-shift. We surface the overage in-app and reach out within 48 hours to right-size your plan. No silent charges.",
    },
    {
      q: "Do you offer refunds?",
      a: "Annual plans are refundable pro-rata within the first 30 days, no questions asked. Monthly plans cancel at the end of the cycle.",
    },
    {
      q: "Are taxes included?",
      a: "Prices shown exclude VAT/GST. Applicable tax is calculated at checkout based on your billing address.",
    },
    {
      q: "How does Enterprise differ from Pro?",
      a: "Enterprise unlocks multi-tenant deployments, dedicated infrastructure, custom SLAs, named CSM, on-prem deployment options, and onsite onboarding. Talk to sales for a scoped quote.",
    },
  ];
  const [open, setOpen] = useState(0);
  return (
    <section className="section" style={{ background: "var(--surface-2)" }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            FAQ
          </span>
          <h2 style={{ marginTop: 12 }}>Quick answers before you commit.</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((it, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                style={{
                  width: "100%",
                  padding: "18px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text)",
                  textAlign: "left",
                }}
              >
                {it.q}
                <Icon
                  name="chevron_down"
                  size={18}
                  style={{
                    color: "var(--text-2)",
                    transition: "transform 200ms",
                    transform: open === i ? "rotate(180deg)" : "none",
                  }}
                />
              </button>
              {open === i && (
                <div
                  style={{
                    padding: "0 20px 20px",
                    color: "var(--text-2)",
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {it.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EnterpriseBanner() {
  return (
    <section className="section">
      <div className="container">
        <div
          style={{
            background:
              "linear-gradient(110deg, var(--surface-ink) 0%, #15243A 100%)",
            color: "#fff",
            borderRadius: 12,
            padding: "var(--s-9)",
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: "var(--s-7)",
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.2,
              background:
                "radial-gradient(circle at 90% 30%, var(--primary) 0%, transparent 50%)",
            }}
          />
          <div style={{ position: "relative" }}>
            <span
              className="badge"
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
            >
              Enterprise
            </span>
            <h2 style={{ color: "#fff", marginTop: 16, marginBottom: 16 }}>
              Need multi-tenant, on-prem, or 1,000+ vehicles?
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 16,
                marginBottom: 28,
              }}
            >
              Talk to our solutions team. Custom SLA, dedicated infra options,
              on-prem deployment, and a named CSM — all under one master
              agreement.
            </p>
            <div className="row gap-3">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate("contact")}
              >
                Talk to sales <Icon name="arrow_right" size={16} />
              </button>
              <button
                className="btn btn-lg"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
                onClick={() => navigate("contact")}
              >
                Download whitepaper
              </button>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            {[
              { i: "shield", t: "SOC 2 + ISO 27001" },
              { i: "lock", t: "Custom DPA + data residency" },
              { i: "user", t: "Named customer success manager" },
              { i: "layers", t: "On-prem or dedicated cloud" },
            ].map((c) => (
              <div
                key={c.t}
                className="row gap-3 center"
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.08)",
                    color: "var(--primary)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Icon name={c.i} size={16} />
                </div>
                <div style={{ fontSize: 14 }}>{c.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PricingPage() {
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [cycle, setCycle] = useState("annual");
  return (
    <main>
      <PricingHero
        currency={currency}
        setCurrency={setCurrency}
        cycle={cycle}
        setCycle={setCycle}
      />
      <section
        style={{ paddingTop: "var(--s-9)", paddingBottom: "var(--s-9)" }}
      >
        <div className="container-wide">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 16,
              alignItems: "stretch",
            }}
          >
            {PLANS.map((p) => (
              <PlanCard
                key={p.code}
                plan={p}
                currency={currency}
                cycle={cycle}
              />
            ))}
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: 32,
              fontSize: 13,
              color: "var(--text-3)",
            }}
          >
            All prices in {currency.code}.{" "}
            {cycle === "annual"
              ? "Annual billing — save 18%."
              : "Monthly billing — switch to annual to save 18%."}{" "}
            · 30-day money-back guarantee on annual plans.
          </div>
        </div>
      </section>
      <ComparisonTable currency={currency} cycle={cycle} />
      <FAQ />
      <EnterpriseBanner />
    </main>
  );
}
