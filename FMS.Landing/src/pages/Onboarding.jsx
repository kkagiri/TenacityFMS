/**
 * File:          Onboarding.jsx
 * Purpose:       Three-step demo booking workflow.
 * Dependencies:  React, Icon component, Layout navigation helper
 * Last Modified: 2026-05-04
 *
 * Flow:
 *   Step 1 - Who do you fuel?            (sell / fleet / both)
 *   Step 2 - What do you want to manage? (path-specific modules, all pre-checked)
 *   Step 3 - Book your demo              (contact form)
 *   Done   - Confirmation + what happens next
 */
import React, { useMemo, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { navigate } from "../components/Layout.jsx";

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

const MODULES_BY_TYPE = {
  sell: [
    {
      code: "track-dispensed",
      name: "Track fuel dispensed",
      description: "Every transaction at the pump, by customer and product.",
      icon: "gauge",
    },
    {
      code: "track-stock",
      name: "Track stock",
      description: "Tank levels, deliveries, and reconciliation.",
      icon: "tank",
    },
    {
      code: "loyalty",
      name: "Loyalty & discounts",
      description: "Bonus, rewards, and discount cards for customers.",
      icon: "card",
    },
  ],
  fleet: [
    {
      code: "control-dispensing",
      name: "Control fuel dispensing",
      description: "Authorize who, what vehicle, and how much at the pump.",
      icon: "lock",
    },
    {
      code: "track-stock",
      name: "Track stock",
      description: "Tank levels, deliveries, and reconciliation.",
      icon: "tank",
    },
    {
      code: "track-fleet",
      name: "Track vehicle fleet",
      description: "GPS, consumption, and trip history per vehicle.",
      icon: "gps",
    },
  ],
  both: [
    {
      code: "track-dispensed",
      name: "Track fuel dispensed",
      description: "Customer transactions at the pump.",
      icon: "gauge",
    },
    {
      code: "control-dispensing",
      name: "Control fuel dispensing",
      description: "Authorize own fleet at the pump.",
      icon: "lock",
    },
    {
      code: "track-stock",
      name: "Track stock",
      description: "Tank levels, deliveries, and reconciliation.",
      icon: "tank",
    },
    {
      code: "loyalty",
      name: "Loyalty & discounts",
      description: "Bonus, rewards, and discount cards for customers.",
      icon: "card",
    },
    {
      code: "track-fleet",
      name: "Track vehicle fleet",
      description: "GPS, consumption, and trip history per vehicle.",
      icon: "gps",
    },
  ],
};

const COUNTRIES = [
  { code: "KE", name: "Kenya", dial: "+254" },
  { code: "UG", name: "Uganda", dial: "+256" },
  { code: "TZ", name: "Tanzania", dial: "+255" },
  { code: "RW", name: "Rwanda", dial: "+250" },
  { code: "ET", name: "Ethiopia", dial: "+251" },
  { code: "SS", name: "South Sudan", dial: "+211" },
  { code: "ZA", name: "South Africa", dial: "+27" },
  { code: "NG", name: "Nigeria", dial: "+234" },
  { code: "GH", name: "Ghana", dial: "+233" },
  { code: "OTHER", name: "Other", dial: "+" },
];

const STEPS = [
  { num: 1, label: "Operation" },
  { num: 2, label: "Modules" },
  { num: 3, label: "Book demo" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FieldError({ message }) {
  if (!message) return null;

  return (
    <div className="err" style={{ marginTop: 6 }}>
      <Icon name="x" size={12} />
      {message}
    </div>
  );
}

function StepIndicator({ current }) {
  return (
    <div
      className="row gap-3 center"
      style={{ justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}
    >
      {STEPS.map((step, index) => {
        const done = current > step.num;
        const active = current === step.num;

        return (
          <React.Fragment key={step.num}>
            <div className="row gap-2 center">
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: done
                    ? "var(--success)"
                    : active
                      ? "var(--primary)"
                      : "var(--surface-3)",
                  color: done || active ? "#fff" : "var(--text-3)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {done ? <Icon name="check" size={14} /> : step.num}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? "var(--text)" : "var(--text-2)",
                }}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span
                style={{ width: 32, height: 1, background: "var(--border)" }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function TextField({
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  optional,
  children,
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: 6,
        }}
      >
        {label}
        {optional && (
          <span className="muted" style={{ fontWeight: 400, marginLeft: 6 }}>
            (optional)
          </span>
        )}
      </label>
      {children || (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            height: 38,
            padding: "0 12px",
            border: error
              ? "1px solid var(--danger)"
              : "1px solid var(--border-strong)",
            borderRadius: 6,
            fontSize: 14,
            color: "var(--text)",
            background: "#fff",
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      )}
      <FieldError message={error} />
    </div>
  );
}

function FuelingTypeCard({ option, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        width: "100%",
        minHeight: 132,
        textAlign: "left",
        display: "flex",
        gap: 16,
        padding: 18,
        border: selected
          ? "2px solid var(--primary)"
          : "1px solid var(--border-strong)",
        borderRadius: 8,
        background: selected ? "var(--primary-tint-2)" : "#fff",
        color: "var(--text)",
        cursor: "pointer",
        transition: "border-color 120ms ease, background 120ms ease",
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 6,
          background: selected ? "#fff" : "var(--surface-3)",
          color: "var(--primary)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={option.icon} size={22} />
      </span>
      <span style={{ flex: 1 }}>
        <span
          className="row between center"
          style={{ marginBottom: 6, gap: 12 }}
        >
          <span style={{ fontSize: 16, fontWeight: 600 }}>{option.name}</span>
          {selected && (
            <span className="badge badge-success" style={{ flexShrink: 0 }}>
              Selected
            </span>
          )}
        </span>
        <span
          style={{
            display: "block",
            fontSize: 13,
            color: "var(--text-2)",
            lineHeight: 1.45,
          }}
        >
          {option.description}
        </span>
      </span>
    </button>
  );
}

function ModuleCard({ option, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      style={{
        width: "100%",
        textAlign: "left",
        display: "flex",
        gap: 14,
        padding: 16,
        border: selected
          ? "2px solid var(--primary)"
          : "1px solid var(--border-strong)",
        borderRadius: 8,
        background: selected ? "var(--primary-tint-2)" : "#fff",
        color: "var(--text)",
        cursor: "pointer",
        transition: "border-color 120ms ease, background 120ms ease",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 4,
          border: selected
            ? "2px solid var(--primary)"
            : "1.5px solid var(--border-strong)",
          background: selected ? "var(--primary)" : "#fff",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {selected && <Icon name="check" size={14} strokeWidth={3} />}
      </span>
      <span style={{ flex: 1 }}>
        <span className="row gap-2 center" style={{ marginBottom: 4 }}>
          <Icon name={option.icon} size={15} />
          <span style={{ fontSize: 15, fontWeight: 600 }}>{option.name}</span>
        </span>
        <span
          style={{
            display: "block",
            fontSize: 13,
            color: "var(--text-2)",
            lineHeight: 1.45,
          }}
        >
          {option.description}
        </span>
      </span>
    </button>
  );
}

function StepOne({ selected, onSelect, error }) {
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, marginBottom: 8 }}>Who do you fuel?</h2>
        <p className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>
          Pick the option that matches how fuel moves through your business.
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {FUELING_TYPES.map((option) => (
          <FuelingTypeCard
            key={option.code}
            option={option}
            selected={selected === option.code}
            onSelect={() => onSelect(option.code)}
          />
        ))}
      </div>
      <FieldError message={error} />
    </>
  );
}

function StepTwo({ modules, selectedModules, onToggle, error }) {
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, marginBottom: 8 }}>
          What do you want to manage?
        </h2>
        <p className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>
          Everything is pre-selected. Deselect anything that isn&apos;t relevant
          to your operation.
        </p>
      </div>
      <div className="col gap-3">
        {modules.map((option) => (
          <ModuleCard
            key={option.code}
            option={option}
            selected={selectedModules.includes(option.code)}
            onToggle={() => onToggle(option.code)}
          />
        ))}
      </div>
      <FieldError message={error} />
    </>
  );
}

function StepThree({ contact, errors, onChange }) {
  const country = COUNTRIES.find((item) => item.code === contact.country);

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, marginBottom: 8 }}>Book your demo</h2>
        <p className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>
          Share your details and our team will reach out within 24 hours to set
          up a live demo tailored to your operation.
        </p>
      </div>

      <div className="col gap-4">
        <TextField
          label="Full name"
          value={contact.name}
          onChange={(value) => onChange("name", value)}
          error={errors.name}
          placeholder="Jane Doe"
        />

        <TextField
          label="Work email"
          type="email"
          value={contact.email}
          onChange={(value) => onChange("email", value)}
          error={errors.email}
          placeholder="jane@company.com"
        />

        <TextField label="Phone" error={errors.phone}>
          <div className="row gap-2 center">
            <span
              style={{
                height: 38,
                padding: "0 12px",
                background: "var(--surface-3)",
                border: "1px solid var(--border-strong)",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text)",
                minWidth: 70,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {country?.dial || "+"}
            </span>
            <input
              type="tel"
              value={contact.phone}
              onChange={(event) => onChange("phone", event.target.value)}
              placeholder="712 345 678"
              style={{
                flex: 1,
                minWidth: 0,
                height: 38,
                padding: "0 12px",
                border: errors.phone
                  ? "1px solid var(--danger)"
                  : "1px solid var(--border-strong)",
                borderRadius: 6,
                fontSize: 14,
                color: "var(--text)",
                background: "#fff",
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </TextField>

        <TextField
          label="Company"
          value={contact.company}
          onChange={(value) => onChange("company", value)}
          error={errors.company}
          placeholder="Company Ltd."
        />

        <TextField label="Country" error={errors.country}>
          <select
            value={contact.country}
            onChange={(event) => onChange("country", event.target.value)}
            style={{
              width: "100%",
              height: 38,
              padding: "0 12px",
              border: "1px solid var(--border-strong)",
              borderRadius: 6,
              fontSize: 14,
              color: "var(--text)",
              background: "#fff",
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
            }}
          >
            {COUNTRIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </TextField>

        <TextField
          label="Role"
          optional
          value={contact.role}
          onChange={(value) => onChange("role", value)}
          placeholder="Operations Manager"
        />
      </div>
    </>
  );
}

function SuccessState({ data }) {
  const fuelingType = FUELING_TYPES.find(
    (option) => option.code === data.fuelingType,
  );
  const allModules = MODULES_BY_TYPE[data.fuelingType] || [];
  const pickedModules = allModules.filter((module) =>
    data.modules.includes(module.code),
  );
  const firstName = data.contact.name.trim().split(" ")[0] || "there";

  return (
    <div style={{ padding: "var(--s-7) 0" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
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
        <h2 style={{ fontSize: 32, marginBottom: 12 }}>
          Demo request received
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-2)",
            maxWidth: 520,
            margin: "0 auto",
            lineHeight: 1.55,
          }}
        >
          Thank you, {firstName}. Our team will reach out to{" "}
          <strong>{data.contact.email}</strong> within 24 hours.
        </p>
      </div>

      <div
        className="card"
        style={{ maxWidth: 540, margin: "0 auto var(--s-7)", padding: 24 }}
      >
        <div
          style={{
            fontSize: 12,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 14,
            fontWeight: 600,
          }}
        >
          What happens next
        </div>
        <ol
          className="col gap-3"
          style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}
        >
          {[
            "A short call from our team to confirm your demo time.",
            "Live demo walking through your selected modules with sample data shaped to your operation.",
            "Pilot setup discussion if it is a fit.",
          ].map((line, index) => (
            <li
              key={line}
              className="row gap-3"
              style={{ alignItems: "flex-start" }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--primary-tint)",
                  color: "var(--primary)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </span>
              <span style={{ fontSize: 14, lineHeight: 1.5 }}>{line}</span>
            </li>
          ))}
        </ol>
      </div>

      <div
        className="card"
        style={{
          maxWidth: 540,
          margin: "0 auto var(--s-7)",
          padding: 20,
          background: "var(--surface-2)",
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
          Your demo focus
        </div>
        <div className="col gap-2" style={{ fontSize: 14 }}>
          <div className="row between center">
            <span className="muted">Fueling model</span>
            <span style={{ fontWeight: 600 }}>{fuelingType?.name}</span>
          </div>
          <div className="row between" style={{ alignItems: "flex-start" }}>
            <span className="muted">Modules</span>
            <span
              style={{ fontWeight: 600, textAlign: "right", maxWidth: "70%" }}
            >
              {pickedModules.map((module) => module.name).join(", ") || "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="row gap-3" style={{ justifyContent: "center" }}>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => navigate("home")}
        >
          Back to home
        </button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState({
    fuelingType: null,
    modules: [],
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

  const availableModules = useMemo(
    () => (data.fuelingType ? MODULES_BY_TYPE[data.fuelingType] : []),
    [data.fuelingType],
  );

  const selectFuelingType = (code) => {
    setData((current) => ({
      ...current,
      fuelingType: code,
      modules: MODULES_BY_TYPE[code].map((module) => module.code),
    }));
    setErrors((current) => ({ ...current, fuelingType: undefined }));
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

  const updateContact = (key, value) => {
    setData((current) => ({
      ...current,
      contact: { ...current.contact, [key]: value },
    }));
    setErrors((current) => ({ ...current, [key]: undefined }));
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

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setSubmitted(true);
  };

  const back = () => setStep((current) => Math.max(1, current - 1));

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
          {!submitted && <StepIndicator current={step} />}
          <div
            className="card card-glow"
            style={{ padding: "var(--s-8)", background: "#fff" }}
          >
            {submitted ? (
              <SuccessState data={data} />
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
                    modules={availableModules}
                    selectedModules={data.modules}
                    onToggle={toggleModule}
                    error={errors.modules}
                  />
                )}
                {step === 3 && (
                  <StepThree
                    contact={data.contact}
                    errors={errors}
                    onChange={updateContact}
                  />
                )}

                <div
                  className="row between center"
                  style={{
                    marginTop: 32,
                    paddingTop: 20,
                    borderTop: "1px solid var(--border)",
                  }}
                >
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
                    {step === 3 ? "Submit" : "Next"}{" "}
                    <Icon name="arrow_right" size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
