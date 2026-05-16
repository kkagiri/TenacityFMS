/**
 * File:          Onboarding.jsx
 * Purpose:       Four-step tailored demo booking workflow.
 * Dependencies:  React, Icon component, Layout navigation helper, TweaksPanel
 * Last Modified: 2026-05-16
 *
 * Flow:
 *   Step 1 - Who do you fuel?            (sell / fleet / both)
 *   Step 2 - What do you want to manage? (path-specific modules, all pre-checked)
 *   Step 3 - Tell us about your setup    (scale and hardware context)
 *   Step 4 - Book your demo              (contact form)
 *   Done   - Confirmation + optional inline scheduler
 */
import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { navigate } from "../components/Layout.jsx";
import {
  TweakRadio,
  TweakSection,
  TweakSelect,
  TweakToggle,
  TweaksPanel,
  useTweaks,
} from "../components/TweaksPanel.jsx";

const TWEAK_DEFAULTS = {
  showTrustStrip: true,
  showReassureLine: true,
  useInlineScheduler: true,
  groupBothModules: true,
  path: "both",
  jumpStep: 1,
};

const FUELING_TYPES = [
  {
    code: "sell",
    name: "Sell fuel to others",
    description: "I run stations that dispense fuel to external customers.",
    icon: "fuel",
  },
  {
    code: "fleet",
    name: "Fuel my own fleet",
    description: "I run stations that fuel only my own vehicles and equipment.",
    icon: "truck",
  },
  {
    code: "both",
    name: "Both",
    description: "I sell fuel to customers and also fuel my own fleet.",
    icon: "layers",
  },
];

const MODULES = {
  "track-dispensed": {
    name: "Track fuel dispensed",
    description: "Every transaction at the pump, by customer and product.",
    icon: "gauge",
  },
  "control-dispensing": {
    name: "Control fuel dispensing",
    description: "Authorize who, what vehicle, and how much at the pump.",
    icon: "lock",
  },
  "track-stock": {
    name: "Track stock",
    description: "Tank levels, deliveries, and reconciliation.",
    icon: "tank",
  },
  loyalty: {
    name: "Loyalty & discounts",
    description: "Bonus, rewards, and discount cards for customers.",
    icon: "card",
  },
  "track-fleet": {
    name: "Track vehicle fleet",
    description: "GPS, consumption, and trip history per vehicle.",
    icon: "gps",
  },
};

const PATHS = {
  sell: { flat: ["track-dispensed", "track-stock", "loyalty"] },
  fleet: { flat: ["control-dispensing", "track-stock", "track-fleet"] },
  both: {
    flat: [
      "track-dispensed",
      "control-dispensing",
      "track-stock",
      "loyalty",
      "track-fleet",
    ],
    grouped: [
      {
        label: "For customers you sell to",
        items: ["track-dispensed", "loyalty"],
      },
      {
        label: "For your own fleet",
        items: ["control-dispensing", "track-fleet"],
      },
      { label: "Shared", items: ["track-stock"] },
    ],
  },
};

const COUNTRIES = [
  { code: "KE", name: "Kenya", dial: "+254" },
  { code: "UG", name: "Uganda", dial: "+256" },
  { code: "TZ", name: "Tanzania", dial: "+255" },
  { code: "RW", name: "Rwanda", dial: "+250" },
  { code: "ET", name: "Ethiopia", dial: "+251" },
  { code: "ZA", name: "South Africa", dial: "+27" },
  { code: "NG", name: "Nigeria", dial: "+234" },
  { code: "GH", name: "Ghana", dial: "+233" },
  { code: "OTHER", name: "Other", dial: "+" },
];

const STEPS = [
  { num: 1, label: "Operation" },
  { num: 2, label: "Modules" },
  { num: 3, label: "Setup" },
  { num: 4, label: "Book demo" },
];

const SITE_BUCKETS = ["1 site", "2-5", "6-10", "11-25", "25+"];
const VEHICLE_BUCKETS = ["1-10", "11-50", "51-200", "200+"];
const YESNO_GPS = [
  { value: "yes", label: "Yes, we have GPS already", icon: "check" },
  { value: "no", label: "No, we don't", icon: "x" },
  { value: "switch", label: "Have one, looking to switch", icon: "sparkles" },
];
const YESNO_FUEL = [
  { value: "yes", label: "Yes, we have one", icon: "check" },
  { value: "no", label: "No, just manual / dipstick", icon: "x" },
  { value: "switch", label: "Have one, looking to switch", icon: "sparkles" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ONBOARDING_STYLE = `
  .onboarding-shell{background:var(--surface-2);min-height:calc(100vh - var(--header-h))}
  .onboarding-section{padding:calc(var(--header-h) + var(--s-7)) 0 var(--s-9)}
  .onboarding-container{max-width:880px}
  .onboarding-trust{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px;padding:10px 12px;background:#fff;border:1px solid var(--border);border-radius:8px;font-size:13px;color:var(--text-2)}
  .onboarding-trust__label{font-weight:600;color:var(--text)}
  .onboarding-trust__logos{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
  .onboarding-logo{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
  .onboarding-logo__dot{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--primary-tint);color:var(--primary);font-size:10px;font-weight:700}
  .onboarding-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:24px}
  .onboarding-head h1{font-size:clamp(32px,4vw,46px);line-height:1.05}
  .onboarding-head__sub{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:14px;color:var(--text-2);justify-content:flex-end}
  .onboarding-meta{display:inline-flex;align-items:center;gap:6px;color:var(--text-3)}
  .onboarding-stepper{display:grid;grid-template-columns:auto 1fr auto 1fr auto 1fr auto;align-items:center;gap:10px;margin-bottom:24px}
  .onboarding-step{display:inline-flex;align-items:center;gap:8px;min-width:0;font-size:13px;font-weight:600;color:var(--text-3)}
  .onboarding-step__dot{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--surface-3);color:var(--text-3);font-size:12px;flex-shrink:0}
  .onboarding-step.is-active{color:var(--text)}
  .onboarding-step.is-active .onboarding-step__dot{background:var(--primary);color:#fff}
  .onboarding-step.is-done{color:var(--success)}
  .onboarding-step.is-done .onboarding-step__dot{background:var(--success);color:#fff}
  .onboarding-stepper__bar{height:1px;background:var(--border)}
  .onboarding-stepper__bar.is-done{background:var(--success)}
  .onboarding-card{padding:var(--s-8);background:#fff}
  .onboarding-step-title{font-size:28px;margin-bottom:8px}
  .onboarding-step-sub{font-size:14px;color:var(--text-2);line-height:1.55;margin-bottom:28px}
  .onboarding-fuel-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .onboarding-choice-card,.onboarding-module-card{width:100%;text-align:left;display:flex;gap:14px;padding:16px;border:1px solid var(--border-strong);border-radius:8px;background:#fff;color:var(--text);cursor:pointer;transition:border-color 120ms ease,background 120ms ease,box-shadow 120ms ease}
  .onboarding-choice-card:hover,.onboarding-module-card:hover{border-color:var(--primary);box-shadow:var(--el-1)}
  .onboarding-choice-card.is-on,.onboarding-module-card.is-on{border-color:var(--primary);background:var(--primary-tint-2);box-shadow:0 0 0 1px var(--primary)}
  .onboarding-choice-card{min-height:142px}
  .onboarding-choice-card__icon,.onboarding-module-card__icon,.onboarding-question__icon{width:36px;height:36px;border-radius:6px;background:var(--surface-3);color:var(--primary);display:grid;place-items:center;flex-shrink:0}
  .onboarding-choice-card.is-on .onboarding-choice-card__icon{background:#fff}
  .onboarding-choice-card__name,.onboarding-module-card__name{display:block;font-size:15px;font-weight:700;margin-bottom:5px}
  .onboarding-choice-card__desc,.onboarding-module-card__desc{display:block;font-size:13px;line-height:1.45;color:var(--text-2)}
  .onboarding-card-check{width:18px;height:18px;border-radius:50%;display:grid;place-items:center;border:1px solid var(--border-strong);color:#fff;flex-shrink:0}
  .is-on .onboarding-card-check{background:var(--primary);border-color:var(--primary)}
  .onboarding-module-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .onboarding-module-section{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);margin:20px 0 8px}
  .onboarding-module-section:first-of-type{margin-top:0}
  .onboarding-module-check{width:22px;height:22px;border-radius:4px;border:1px solid var(--border-strong);background:#fff;color:#fff;display:grid;place-items:center;flex-shrink:0;margin-top:2px}
  .onboarding-module-card.is-on .onboarding-module-check{background:var(--primary);border-color:var(--primary)}
  .onboarding-module-card__row{display:flex;align-items:center;gap:8px;margin-bottom:5px;color:var(--primary)}
  .onboarding-setup-question{padding:18px 0;border-top:1px solid var(--border)}
  .onboarding-setup-question:first-of-type{border-top:0;padding-top:0}
  .onboarding-question{display:flex;align-items:center;gap:12px;font-size:15px;font-weight:700}
  .onboarding-question__icon{width:28px;height:28px}
  .onboarding-hint{margin:5px 0 12px 40px;font-size:13px;color:var(--text-2)}
  .onboarding-options{display:flex;gap:8px;flex-wrap:wrap;margin-left:40px}
  .onboarding-pill{display:inline-flex;align-items:center;gap:7px;min-height:34px;padding:0 12px;border:1px solid var(--border-strong);border-radius:4px;background:#fff;color:var(--text);font:600 13px/1 var(--font-sans);cursor:pointer}
  .onboarding-pill:hover{background:var(--surface-2)}
  .onboarding-pill.is-on{border-color:var(--primary);background:var(--primary-tint);color:var(--primary-pressed)}
  .onboarding-note{display:inline-flex;align-items:center;gap:8px;margin:12px 0 0 40px;padding:9px 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface-2);font-size:13px;color:var(--text-2)}
  .onboarding-form{display:flex;flex-direction:column;gap:18px}
  .onboarding-form-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
  .onboarding-field label{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px}
  .onboarding-field__optional{font-weight:400;color:var(--text-3)}
  .onboarding-input,.onboarding-select{width:100%;height:38px;padding:0 12px;border:1px solid var(--border-strong);border-radius:4px;background:#fff;color:var(--text);font:14px/1 var(--font-sans);outline:none}
  .onboarding-select{appearance:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23605E5C' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>");background-repeat:no-repeat;background-position:right 10px center;padding-right:32px}
  .onboarding-input:hover,.onboarding-select:hover{border-color:var(--text-3)}
  .onboarding-input:focus,.onboarding-select:focus{border-color:var(--primary);box-shadow:0 0 0 1px var(--primary)}
  .onboarding-field.is-error .onboarding-input,.onboarding-field.is-error .onboarding-select,.onboarding-phone.is-error{border-color:var(--danger)}
  .onboarding-phone{display:flex;align-items:center;height:38px;border:1px solid var(--border-strong);border-radius:4px;background:#fff;overflow:hidden}
  .onboarding-phone__dial{height:100%;display:inline-flex;align-items:center;padding:0 12px;background:var(--surface-3);border-right:1px solid var(--border);font-size:13px;font-weight:700;color:var(--text)}
  .onboarding-phone input{flex:1;min-width:0;height:100%;border:0;outline:none;padding:0 12px;font:14px/1 var(--font-sans)}
  .onboarding-reassure{display:flex;align-items:center;gap:8px;margin-top:18px;padding:10px 12px;background:var(--surface-2);border:1px solid var(--border);border-radius:6px;color:var(--text-2);font-size:13px}
  .onboarding-error{display:flex;align-items:center;gap:6px;margin-top:8px;color:var(--danger);font-size:12px;font-weight:600}
  .onboarding-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:32px;padding-top:20px;border-top:1px solid var(--border)}
  .onboarding-success{text-align:center;padding:var(--s-6) 0 0}
  .onboarding-success__seal{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;margin:0 auto var(--s-5);background:var(--success-tint);color:var(--success)}
  .onboarding-success h2{font-size:32px;margin-bottom:10px}
  .onboarding-success p{max-width:560px;margin:0 auto 24px;color:var(--text-2);font-size:15px;line-height:1.55}
  .onboarding-recap{max-width:620px;margin:22px auto 0;text-align:left;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);padding:16px}
  .onboarding-recap__title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);margin-bottom:10px}
  .onboarding-recap__row{display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-top:1px solid var(--border);font-size:14px}
  .onboarding-recap__row:first-of-type{border-top:0}
  .onboarding-recap__key{color:var(--text-2)}
  .onboarding-recap__value{font-weight:700;text-align:right}
  .onboarding-success-actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:24px}
  .onboarding-scheduler{max-width:720px;margin:0 auto 22px;text-align:left;border:1px solid var(--border);border-radius:8px;background:#fff;overflow:hidden}
  .onboarding-scheduler__header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px;border-bottom:1px solid var(--border)}
  .onboarding-scheduler__title{font-size:15px;font-weight:700}
  .onboarding-scheduler__sub,.onboarding-tz{font-size:13px;color:var(--text-2)}
  .onboarding-tz{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
  .onboarding-scheduler__body{display:grid;grid-template-columns:1fr 220px;gap:18px;padding:16px}
  .onboarding-month{display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:700;margin-bottom:12px}
  .onboarding-nav{width:30px;height:30px;display:grid;place-items:center;border:1px solid var(--border);border-radius:4px;background:#fff;color:var(--text);cursor:pointer}
  .onboarding-nav:hover{background:var(--surface-2)}
  .onboarding-calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
  .onboarding-dow,.onboarding-day{height:32px;display:grid;place-items:center;font-size:12px}
  .onboarding-dow{color:var(--text-3);font-weight:700}
  .onboarding-day{border:0;background:transparent;border-radius:4px;color:var(--text-3);font:600 12px/1 var(--font-sans);padding:0}
  .onboarding-day:disabled{cursor:default}
  .onboarding-day.is-available{color:var(--text);background:var(--primary-tint);cursor:pointer}
  .onboarding-day.is-selected{background:var(--primary);color:#fff;font-weight:700}
  .onboarding-times{display:flex;flex-direction:column;gap:8px}
  .onboarding-times__label{font-size:13px;font-weight:700;margin-bottom:2px}
  .onboarding-slot{min-height:34px;border:1px solid var(--border-strong);border-radius:4px;background:#fff;color:var(--primary);font:700 13px/1 var(--font-sans);cursor:pointer}
  .onboarding-slot.is-selected{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 10px;background:var(--primary);border-color:var(--primary);color:#fff}
  .onboarding-confirm{display:flex;flex-direction:column;gap:10px;margin-top:8px;font-size:12px;color:var(--text-2)}
  .onboarding-confirm__meet{display:inline-flex;align-items:center;gap:6px}
  @media (max-width:760px){
    .onboarding-section{padding-top:calc(var(--header-h) + var(--s-5))}
    .onboarding-container{padding:0 var(--s-4)}
    .onboarding-trust,.onboarding-head,.onboarding-actions,.onboarding-scheduler__header{align-items:flex-start;flex-direction:column}
    .onboarding-trust__logos,.onboarding-head__sub{justify-content:flex-start}
    .onboarding-stepper{grid-template-columns:1fr;gap:8px}
    .onboarding-stepper__bar{display:none}
    .onboarding-card{padding:var(--s-6)}
    .onboarding-fuel-grid,.onboarding-module-grid,.onboarding-form-row,.onboarding-scheduler__body{grid-template-columns:1fr}
    .onboarding-actions .btn{width:100%}
    .onboarding-options,.onboarding-hint,.onboarding-note{margin-left:0}
    .onboarding-question{align-items:flex-start}
    .onboarding-recap__row{flex-direction:column;gap:4px}
    .onboarding-recap__value{text-align:left}
  }
`;

function FieldError({ message, className = "", style = {} }) {
  if (!message) return null;

  return (
    <div className={`onboarding-error ${className}`} style={style}>
      <Icon name="x" size={12} />
      {message}
    </div>
  );
}

function TrustStrip() {
  return (
    <div className="onboarding-trust">
      <span className="onboarding-trust__label">
        Trusted by fleets and station operators
      </span>
      <span className="onboarding-trust__logos">
        <span className="onboarding-logo">
          <span className="onboarding-logo__dot">AL</span> Acme Logistics
        </span>
        <span className="onboarding-logo">
          <span className="onboarding-logo__dot">NW</span> Northwind Fuel
        </span>
        <span className="onboarding-logo">
          <span className="onboarding-logo__dot">SP</span> Savanna Petroleum
        </span>
        <span className="onboarding-logo">
          <span className="onboarding-logo__dot">+</span> 40 more
        </span>
      </span>
    </div>
  );
}

function Stepper({ current }) {
  return (
    <div className="onboarding-stepper" data-screen-label="Stepper">
      {STEPS.map((item, index) => {
        const done = current > item.num;
        const active = current === item.num;

        return (
          <React.Fragment key={item.num}>
            <div
              className={[
                "onboarding-step",
                active ? "is-active" : "",
                done ? "is-done" : "",
              ].join(" ")}
            >
              <span className="onboarding-step__dot">
                {done ? <Icon name="check" size={14} /> : item.num}
              </span>
              <span>{item.label}</span>
            </div>
            {index < STEPS.length - 1 && (
              <span
                className={`onboarding-stepper__bar ${
                  done ? "is-done" : ""
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StepOne({ selected, onSelect, error }) {
  return (
    <div data-screen-label="01 Operation">
      <h2 className="onboarding-step-title">Who do you fuel?</h2>
      <p className="onboarding-step-sub">
        Pick the option that matches how fuel moves through your business.
      </p>

      <div className="onboarding-fuel-grid">
        {FUELING_TYPES.map((option) => (
          <button
            key={option.code}
            type="button"
            onClick={() => onSelect(option.code)}
            aria-pressed={selected === option.code}
            className={`onboarding-choice-card ${
              selected === option.code ? "is-on" : ""
            }`}
          >
            <span className="onboarding-choice-card__icon">
              <Icon name={option.icon} size={22} />
            </span>
            <span style={{ flex: 1 }}>
              <span className="onboarding-choice-card__name">
                {option.name}
              </span>
              <span className="onboarding-choice-card__desc">
                {option.description}
              </span>
            </span>
            <span className="onboarding-card-check">
              {selected === option.code && (
                <Icon name="check" size={12} strokeWidth={3} />
              )}
            </span>
          </button>
        ))}
      </div>
      <FieldError message={error} />
    </div>
  );
}

function ModuleCard({ code, selected, onToggle }) {
  const module = MODULES[code];

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`onboarding-module-card ${selected ? "is-on" : ""}`}
    >
      <span className="onboarding-module-check">
        {selected && <Icon name="check" size={14} strokeWidth={3} />}
      </span>
      <span style={{ flex: 1 }}>
        <span className="onboarding-module-card__row">
          <Icon name={module.icon} size={15} />
          <span className="onboarding-module-card__name">{module.name}</span>
        </span>
        <span className="onboarding-module-card__desc">
          {module.description}
        </span>
      </span>
    </button>
  );
}

function StepTwo({ path, selectedModules, onToggle, grouped, error }) {
  const isBoth = path === "both";
  const echo =
    path === "sell"
      ? "For operators who sell fuel,"
      : path === "fleet"
        ? "For operators fueling their own fleet,"
        : "For mixed operations,";

  return (
    <div data-screen-label="02 Modules">
      <h2 className="onboarding-step-title">What do you want to manage?</h2>
      <p className="onboarding-step-sub">
        <strong style={{ color: "var(--text)" }}>{echo}</strong> here is what
        we typically set up. Everything is pre-selected. Deselect anything that
        is not relevant.
      </p>

      {isBoth && grouped ? (
        PATHS.both.grouped.map((group) => (
          <React.Fragment key={group.label}>
            <div className="onboarding-module-section">{group.label}</div>
            <div className="onboarding-module-grid">
              {group.items.map((code) => (
                <ModuleCard
                  key={code}
                  code={code}
                  selected={selectedModules.includes(code)}
                  onToggle={() => onToggle(code)}
                />
              ))}
            </div>
          </React.Fragment>
        ))
      ) : (
        <div className="onboarding-module-grid">
          {PATHS[path].flat.map((code) => (
            <ModuleCard
              key={code}
              code={code}
              selected={selectedModules.includes(code)}
              onToggle={() => onToggle(code)}
            />
          ))}
        </div>
      )}
      <FieldError message={error} />
    </div>
  );
}

function SetupQuestion({ icon, title, hint, children, error }) {
  return (
    <div className="onboarding-setup-question">
      <div className="onboarding-question">
        <span className="onboarding-question__icon">
          <Icon name={icon} size={15} />
        </span>
        <span>{title}</span>
      </div>
      {hint && <p className="onboarding-hint">{hint}</p>}
      {children}
      <FieldError message={error} style={{ marginLeft: 40 }} />
    </div>
  );
}

function StepThreeSetup({ setup, set, modules, path, errors }) {
  const hasFleet =
    modules.includes("track-fleet") ||
    modules.includes("control-dispensing") ||
    path !== "sell";
  const hasStock = modules.includes("track-stock");
  const tracksFleet = modules.includes("track-fleet");

  return (
    <div data-screen-label="03 Setup">
      <h2 className="onboarding-step-title">Tell us about your setup</h2>
      <p className="onboarding-step-sub">
        A few quick details help our team tailor the demo to your scale and what
        you already have in place.
      </p>

      <SetupQuestion
        icon="layers"
        title={`How many ${
          path === "fleet" ? "fueling sites" : "branches or stations"
        } do you operate?`}
        hint="Including depots and internal pumps."
        error={errors.sites}
      >
        <div className="onboarding-options">
          {SITE_BUCKETS.map((bucket) => (
            <button
              key={bucket}
              type="button"
              className={`onboarding-pill ${
                setup.sites === bucket ? "is-on" : ""
              }`}
              onClick={() => set("sites", bucket)}
            >
              {bucket}
            </button>
          ))}
        </div>
      </SetupQuestion>

      {hasFleet && (
        <SetupQuestion
          icon="truck"
          title="How large is your fleet?"
          hint="Vehicles, generators, and equipment that take fuel."
          error={errors.vehicles}
        >
          <div className="onboarding-options">
            {VEHICLE_BUCKETS.map((bucket) => (
              <button
                key={bucket}
                type="button"
                className={`onboarding-pill ${
                  setup.vehicles === bucket ? "is-on" : ""
                }`}
                onClick={() => set("vehicles", bucket)}
              >
                {bucket} vehicles
              </button>
            ))}
          </div>
        </SetupQuestion>
      )}

      {tracksFleet && (
        <SetupQuestion
          icon="gps"
          title="Do you have GPS tracking on your vehicles today?"
          hint="We integrate with Teltonika, Concox, Queclink, Ruptela and others, or we can supply units."
          error={errors.gps}
        >
          <div className="onboarding-options">
            {YESNO_GPS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`onboarding-pill ${
                  setup.gps === option.value ? "is-on" : ""
                }`}
                onClick={() => set("gps", option.value)}
              >
                <Icon name={option.icon} size={12} strokeWidth={2.5} />
                {option.label}
              </button>
            ))}
          </div>
          {setup.gps === "no" && (
            <div className="onboarding-note">
              <Icon name="sparkles" size={13} />
              <span>
                No problem. We will include hardware options in your demo
                proposal.
              </span>
            </div>
          )}
          {setup.gps === "switch" && (
            <div className="onboarding-note">
              <Icon name="sparkles" size={13} />
              <span>
                Great. We will show how to migrate data and keep your existing
                units.
              </span>
            </div>
          )}
        </SetupQuestion>
      )}

      {hasStock && (
        <SetupQuestion
          icon="tank"
          title="Do you have a fuel monitoring system on your tanks?"
          hint="Automatic Tank Gauges (ATG), level probes, or similar."
          error={errors.tankMon}
        >
          <div className="onboarding-options">
            {YESNO_FUEL.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`onboarding-pill ${
                  setup.tankMon === option.value ? "is-on" : ""
                }`}
                onClick={() => set("tankMon", option.value)}
              >
                <Icon name={option.icon} size={12} strokeWidth={2.5} />
                {option.label}
              </button>
            ))}
          </div>
          {setup.tankMon === "no" && (
            <div className="onboarding-note">
              <Icon name="sparkles" size={13} />
              <span>
                We will walk you through pairing Zytrion with ATG hardware,
                supplied or sourced locally.
              </span>
            </div>
          )}
        </SetupQuestion>
      )}
    </div>
  );
}

function Field({ label, optional, error, children }) {
  return (
    <div className={`onboarding-field ${error ? "is-error" : ""}`}>
      <label>
        {label}
        {optional && (
          <span className="onboarding-field__optional">(optional)</span>
        )}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function StepFourContact({ contact, errors, set, showReassure }) {
  const country = COUNTRIES.find((item) => item.code === contact.country);

  return (
    <div data-screen-label="04 Book demo">
      <h2 className="onboarding-step-title">Book your demo</h2>
      <p className="onboarding-step-sub">
        Share your details and our team will reach out within 24 hours to set up
        a live demo tailored to your operation.
      </p>

      <div className="onboarding-form">
        <div className="onboarding-form-row">
          <Field label="Full name" error={errors.name}>
            <input
              className="onboarding-input"
              value={contact.name}
              onChange={(event) => set("name", event.target.value)}
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Work email" error={errors.email}>
            <input
              className="onboarding-input"
              type="email"
              value={contact.email}
              onChange={(event) => set("email", event.target.value)}
              placeholder="jane@company.com"
            />
          </Field>
        </div>
        <div className="onboarding-form-row">
          <Field label="Phone" error={errors.phone}>
            <div
              className={`onboarding-phone ${errors.phone ? "is-error" : ""}`}
            >
              <span className="onboarding-phone__dial">
                {country?.dial || "+"}
              </span>
              <input
                type="tel"
                value={contact.phone}
                onChange={(event) => set("phone", event.target.value)}
                placeholder="712 345 678"
              />
            </div>
          </Field>
          <Field label="Company" error={errors.company}>
            <input
              className="onboarding-input"
              value={contact.company}
              onChange={(event) => set("company", event.target.value)}
              placeholder="Company Ltd."
            />
          </Field>
        </div>
        <div className="onboarding-form-row">
          <Field label="Country" error={errors.country}>
            <select
              className="onboarding-select"
              value={contact.country}
              onChange={(event) => set("country", event.target.value)}
            >
              {COUNTRIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Role" optional>
            <input
              className="onboarding-input"
              value={contact.role}
              onChange={(event) => set("role", event.target.value)}
              placeholder="Operations Manager"
            />
          </Field>
        </div>
      </div>

      {showReassure && (
        <div className="onboarding-reassure">
          <Icon name="shield" size={14} />
          <span>
            No spam. We will call once to schedule. Your details stay private.
          </span>
        </div>
      )}
    </div>
  );
}

function nextWeekdays(count) {
  const out = [];
  const day = new Date();
  day.setHours(0, 0, 0, 0);

  while (out.length < count) {
    day.setDate(day.getDate() + 1);
    const dow = day.getDay();
    if (dow !== 0 && dow !== 6) out.push(new Date(day));
  }

  return out;
}

function fmtDay(day) {
  return day.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function fmtShort(day) {
  return day.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toIcsDate(day, time) {
  const [hour, minute] = time.split(":").map(Number);
  const value = new Date(day);
  value.setHours(hour, minute, 0, 0);
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function downloadCalendarInvite(booked, contact) {
  const start = toIcsDate(booked.day, booked.time);
  const [hour, minute] = booked.time.split(":").map(Number);
  const endDate = new Date(booked.day);
  endDate.setHours(hour, minute + 30, 0, 0);
  const end = endDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const summary = "Tenacity FMS tailored demo";
  const description = `Tailored demo for ${contact.company || "your operation"}`;
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tenacity FMS//Demo Booking//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@tenacity-fms`,
    `DTSTAMP:${toIcsDate(new Date(), "00:00")}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "LOCATION:Google Meet",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const url = URL.createObjectURL(
    new Blob([body], { type: "text/calendar;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "tenacity-fms-demo.ics";
  link.click();
  URL.revokeObjectURL(url);
}

function draftEmailCopy(booked, contact) {
  const subject = encodeURIComponent("Tenacity FMS demo booking");
  const body = encodeURIComponent(
    `Hi ${contact.name || "there"},\n\nYour tailored Tenacity FMS demo is booked for ${fmtShort(
      booked.day,
    )} at ${booked.time} Africa/Nairobi.\n\nA Google Meet link will be shared by email.\n`,
  );
  window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
}

function Scheduler({ onBooked }) {
  const days = useMemo(() => nextWeekdays(20), []);
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [calendarMonth, setCalendarMonth] = useState(
    new Date(days[0].getFullYear(), days[0].getMonth(), 1),
  );
  const [selectedTime, setSelectedTime] = useState(null);
  const slots = [
    "09:00",
    "09:30",
    "10:00",
    "11:00",
    "13:30",
    "14:00",
    "15:00",
    "16:00",
  ];

  const monthLabel = calendarMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const startWeekday = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1,
  ).getDay();
  const daysInMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0,
  ).getDate();
  const cells = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const findAvailableDay = (dateNumber) => {
    const cellDate = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      dateNumber,
    );
    return days.find((day) => sameDay(day, cellDate));
  };

  const shiftMonth = (delta) => {
    setCalendarMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  };

  return (
    <div className="onboarding-scheduler">
      <div className="onboarding-scheduler__header">
        <div>
          <div className="onboarding-scheduler__title">
            Pick a 30-minute slot
          </div>
          <div className="onboarding-scheduler__sub">
            Live demo over video. Reschedule any time.
          </div>
        </div>
        <div className="onboarding-tz">
          <Icon name="globe" size={13} />
          Africa/Nairobi (GMT+3)
        </div>
      </div>

      <div className="onboarding-scheduler__body">
        <div>
          <div className="onboarding-month">
            <button
              type="button"
              className="onboarding-nav"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              <Icon name="chevron_left" size={12} />
            </button>
            <span>{monthLabel}</span>
            <button
              type="button"
              className="onboarding-nav"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              <Icon name="chevron_right" size={12} />
            </button>
          </div>
          <div className="onboarding-calendar-grid">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <span key={`${day}-${index}`} className="onboarding-dow">
                {day}
              </span>
            ))}
            {cells.map((dateNumber, index) => {
              if (dateNumber === null) {
                return <span key={`blank-${index}`} className="onboarding-day" />;
              }

              const availableDay = findAvailableDay(dateNumber);
              const selected = availableDay && sameDay(availableDay, selectedDay);

              return (
                <button
                  key={dateNumber}
                  type="button"
                  className={[
                    "onboarding-day",
                    availableDay ? "is-available" : "",
                    selected ? "is-selected" : "",
                  ].join(" ")}
                  disabled={!availableDay}
                  onClick={() => {
                    setSelectedDay(availableDay);
                    setSelectedTime(null);
                  }}
                >
                  {dateNumber}
                </button>
              );
            })}
          </div>
        </div>

        <div className="onboarding-times">
          <div className="onboarding-times__label">{fmtDay(selectedDay)}</div>
          {slots.map((slot) => (
            <button
              key={slot}
              type="button"
              className={`onboarding-slot ${
                selectedTime === slot ? "is-selected" : ""
              }`}
              onClick={() => setSelectedTime(slot)}
            >
              {selectedTime === slot ? (
                <>
                  <span>{slot}</span>
                  <span style={{ display: "inline-flex", gap: 8 }}>
                    Confirm <Icon name="arrow_right" size={14} />
                  </span>
                </>
              ) : (
                slot
              )}
            </button>
          ))}
          {selectedTime && (
            <div className="onboarding-confirm">
              <span className="onboarding-confirm__meet">
                <Icon name="video" size={13} />
                Google Meet link will be emailed
              </span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  onBooked({ day: selectedDay, time: selectedTime })
                }
              >
                Book {selectedTime} <Icon name="arrow_right" size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SuccessState({ data, scheduler, booked, onBooked }) {
  const fueling = FUELING_TYPES.find(
    (option) => option.code === data.fuelingType,
  );
  const firstName = data.contact.name.trim().split(" ")[0] || "there";
  const moduleNames =
    data.modules.map((code) => MODULES[code]?.name).filter(Boolean).join(", ") ||
    "-";

  return (
    <div className="onboarding-success" data-screen-label="05 Success">
      <div className="onboarding-success__seal">
        <Icon name="check" size={36} strokeWidth={2.5} />
      </div>
      <h2>{booked ? "You're booked in" : "Demo request received"}</h2>
      <p>
        Thanks, {firstName}.{" "}
        {booked ? (
          <>
            We have sent the calendar invite to{" "}
            <strong>{data.contact.email}</strong>. See you on{" "}
            {fmtShort(booked.day)} at {booked.time}.
          </>
        ) : (
          <>
            Our team will reach out to <strong>{data.contact.email}</strong>{" "}
            within 24 hours.
          </>
        )}
      </p>

      {scheduler && !booked && (
        <>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 8,
              color: "var(--text)",
            }}
          >
            Or pick a time right now{" "}
            <span style={{ color: "var(--text-3)", fontWeight: 500 }}>
              (takes 10 seconds)
            </span>
          </div>
          <Scheduler onBooked={onBooked} />
        </>
      )}

      <div className="onboarding-recap">
        <div className="onboarding-recap__title">Your demo focus</div>
        <div className="onboarding-recap__row">
          <span className="onboarding-recap__key">Operation</span>
          <span className="onboarding-recap__value">{fueling?.name}</span>
        </div>
        <div className="onboarding-recap__row">
          <span className="onboarding-recap__key">Modules</span>
          <span className="onboarding-recap__value">{moduleNames}</span>
        </div>
        <div className="onboarding-recap__row">
          <span className="onboarding-recap__key">Company</span>
          <span className="onboarding-recap__value">
            {data.contact.company || "-"}
          </span>
        </div>
        {booked && (
          <div className="onboarding-recap__row">
            <span className="onboarding-recap__key">Scheduled</span>
            <span className="onboarding-recap__value">
              {fmtShort(booked.day)} - {booked.time} - Google Meet
            </span>
          </div>
        )}
      </div>

      <div className="onboarding-success-actions">
        {booked ? (
          <>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => downloadCalendarInvite(booked, data.contact)}
            >
              <Icon name="calendar" size={14} />
              Add to calendar
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={() => draftEmailCopy(booked, data.contact)}
            >
              <Icon name="mail" size={14} />
              Email me a copy
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={() => navigate("home")}
          >
            Back to home
          </button>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [step, setStep] = useState(tweaks.jumpStep || 1);
  const [submitted, setSubmitted] = useState((tweaks.jumpStep || 1) > 4);
  const [booked, setBooked] = useState(null);
  const [data, setData] = useState({
    fuelingType: tweaks.path,
    modules: PATHS[tweaks.path].flat.slice(),
    setup: { sites: "", vehicles: "", gps: "", tankMon: "" },
    contact: {
      name: "",
      email: "",
      phone: "",
      company: "",
      country: "KE",
      role: "",
    },
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const nextStep = tweaks.jumpStep || 1;
    setStep(Math.min(nextStep, 4));
    setSubmitted(nextStep > 4);
    if (nextStep <= 4) setBooked(null);
  }, [tweaks.jumpStep]);

  useEffect(() => {
    setData((current) => ({
      ...current,
      fuelingType: tweaks.path,
      modules: PATHS[tweaks.path].flat.slice(),
    }));
    setErrors({});
  }, [tweaks.path]);

  const setContact = (key, value) => {
    setData((current) => ({
      ...current,
      contact: { ...current.contact, [key]: value },
    }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const setSetup = (key, value) => {
    setData((current) => ({
      ...current,
      setup: { ...current.setup, [key]: value },
    }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const selectFuelingType = (code) => {
    setData((current) => ({
      ...current,
      fuelingType: code,
      modules: PATHS[code].flat.slice(),
    }));
    setTweak("path", code);
  };

  const toggleModule = (code) => {
    setData((current) => ({
      ...current,
      modules: current.modules.includes(code)
        ? current.modules.filter((moduleCode) => moduleCode !== code)
        : [...current.modules, code],
    }));
    setErrors((current) => ({ ...current, modules: undefined }));
  };

  const validateStep = () => {
    const nextErrors = {};

    if (step === 1 && !data.fuelingType) {
      nextErrors.fuelingType = "Pick the option that matches your operation.";
    }

    if (step === 2 && data.modules.length === 0) {
      nextErrors.modules = "Select at least one module to focus the demo.";
    }

    if (step === 3) {
      const hasFleet =
        data.modules.includes("track-fleet") ||
        data.modules.includes("control-dispensing") ||
        data.fuelingType !== "sell";
      const tracksFleet = data.modules.includes("track-fleet");
      const hasStock = data.modules.includes("track-stock");

      if (!data.setup.sites) nextErrors.sites = "Pick a size.";
      if (hasFleet && !data.setup.vehicles) {
        nextErrors.vehicles = "Pick a fleet size.";
      }
      if (tracksFleet && !data.setup.gps) {
        nextErrors.gps = "Tell us about your GPS setup.";
      }
      if (hasStock && !data.setup.tankMon) {
        nextErrors.tankMon = "Tell us about your tank monitoring.";
      }
    }

    if (step === 4) {
      const contact = data.contact;

      if (!contact.name.trim()) nextErrors.name = "Required.";
      if (!contact.email.trim()) nextErrors.email = "Required.";
      else if (!EMAIL_RE.test(contact.email)) {
        nextErrors.email = "Enter a valid email.";
      }
      if (!contact.phone.trim()) nextErrors.phone = "Required.";
      if (!contact.company.trim()) nextErrors.company = "Required.";
      if (!contact.country) nextErrors.country = "Required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;

    if (step < 4) {
      const nextStep = step + 1;
      setStep(nextStep);
      setTweak("jumpStep", nextStep);
      return;
    }

    setSubmitted(true);
    setTweak("jumpStep", 5);
  };

  const back = () => {
    if (submitted) {
      setSubmitted(false);
      setBooked(null);
      setStep(4);
      setTweak("jumpStep", 4);
      return;
    }

    const previousStep = Math.max(1, step - 1);
    setStep(previousStep);
    setTweak("jumpStep", previousStep);
  };

  const showPageTweaks = import.meta.env.DEV;

  return (
    <>
      <style>{ONBOARDING_STYLE}</style>
      <main className="onboarding-shell">
        <section className="onboarding-section">
          <div className="container onboarding-container">
            {tweaks.showTrustStrip && !submitted && <TrustStrip />}

            {!submitted && (
              <div className="onboarding-head">
                <h1>Get a tailored demo</h1>
                <div className="onboarding-head__sub">
                  <span>4 quick questions</span>
                  <span className="onboarding-meta">
                    <Icon name="clock" size={12} />
                    About 2 minutes
                  </span>
                </div>
              </div>
            )}

            {!submitted && <Stepper current={step} />}

            <div className="card card-glow onboarding-card">
              {submitted ? (
                <SuccessState
                  data={data}
                  scheduler={tweaks.useInlineScheduler}
                  booked={booked}
                  onBooked={(value) => setBooked(value)}
                />
              ) : (
                <>
                  {step === 1 && (
                    <StepOne
                      selected={data.fuelingType}
                      onSelect={selectFuelingType}
                      error={errors.fuelingType}
                    />
                  )}
                  {step === 2 && (
                    <StepTwo
                      path={data.fuelingType}
                      selectedModules={data.modules}
                      onToggle={toggleModule}
                      grouped={tweaks.groupBothModules}
                      error={errors.modules}
                    />
                  )}
                  {step === 3 && (
                    <StepThreeSetup
                      setup={data.setup}
                      set={setSetup}
                      modules={data.modules}
                      path={data.fuelingType}
                      errors={errors}
                    />
                  )}
                  {step === 4 && (
                    <StepFourContact
                      contact={data.contact}
                      errors={errors}
                      set={setContact}
                      showReassure={tweaks.showReassureLine}
                    />
                  )}

                  <div className="onboarding-actions">
                    {step === 1 ? (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => navigate("home")}
                      >
                        <Icon name="chevron_left" size={14} />
                        Cancel
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={back}
                      >
                        <Icon name="chevron_left" size={14} />
                        Back
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      onClick={next}
                    >
                      {step === 4 ? "Submit request" : "Next"}
                      <Icon name="arrow_right" size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {showPageTweaks && (
        <TweaksPanel title="Onboarding tweaks">
          <TweakSection label="Improvements">
            <TweakToggle
              label="Trust strip above stepper"
              value={tweaks.showTrustStrip}
              onChange={(value) => setTweak("showTrustStrip", value)}
            />
            <TweakToggle
              label="Reassurance line on booking"
              value={tweaks.showReassureLine}
              onChange={(value) => setTweak("showReassureLine", value)}
            />
            <TweakToggle
              label="Inline scheduler on success"
              value={tweaks.useInlineScheduler}
              onChange={(value) => setTweak("useInlineScheduler", value)}
            />
            <TweakToggle
              label="Group modules on Both path"
              value={tweaks.groupBothModules}
              onChange={(value) => setTweak("groupBothModules", value)}
            />
          </TweakSection>
          <TweakSection label="Flow">
            <TweakRadio
              label="Path"
              value={tweaks.path}
              options={[
                { value: "sell", label: "Sell" },
                { value: "fleet", label: "Fleet" },
                { value: "both", label: "Both" },
              ]}
              onChange={(value) => setTweak("path", value)}
            />
            <TweakSelect
              label="Jump to step"
              value={tweaks.jumpStep}
              options={[
                { value: 1, label: "1. Operation" },
                { value: 2, label: "2. Modules" },
                { value: 3, label: "3. Setup" },
                { value: 4, label: "4. Book demo" },
                { value: 5, label: "5. Success" },
              ]}
              onChange={(value) => setTweak("jumpStep", Number(value))}
            />
          </TweakSection>
        </TweaksPanel>
      )}
    </>
  );
}
