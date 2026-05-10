import React from "react";
import { Icon } from "../components/Icon.jsx";
import { navigate } from "../components/Layout.jsx";

// Lightweight placeholders for routes that aren't deeply designed
// (Solutions, Industries, About, Contact). Visually consistent with main pages
// so navigation feels complete.

function PlaceholderPage({ title, kicker, body, sections = [] }) {
  return (
    <main>
      <section
        style={{
          paddingTop: "calc(var(--header-h) + var(--s-9))",
          paddingBottom: "var(--s-8)",
          background:
            "linear-gradient(180deg, var(--primary-tint-2) 0%, #fff 100%)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          className="container"
          style={{ textAlign: "center", maxWidth: 720 }}
        >
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            {kicker}
          </span>
          <h1 style={{ marginTop: 16, marginBottom: 16 }}>{title}</h1>
          <p style={{ fontSize: 18, color: "var(--text-2)" }}>{body}</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            {sections.map((s) => (
              <div key={s.title} className="card">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    background: "var(--primary-tint-2)",
                    color: "var(--primary)",
                    display: "grid",
                    placeItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Icon name={s.icon} size={20} />
                </div>
                <h4 style={{ fontSize: 17, marginBottom: 8 }}>{s.title}</h4>
                <p className="muted" style={{ fontSize: 14 }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: 64,
              padding: 32,
              background: "var(--surface-2)",
              borderRadius: 8,
              border: "1px dashed var(--border-strong)",
            }}
          >
            <Icon
              name="layers"
              size={32}
              style={{ color: "var(--text-3)", marginBottom: 12 }}
            />
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Page in design</h3>
            <p className="muted" style={{ marginBottom: 20 }}>
              This page exists in the route map. Hi-fi pass focused on Home,
              Pricing, and Onboarding.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("home")}
            >
              ← Back to home
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export function SolutionsPage() {
  return (
    <PlaceholderPage
      kicker="Solutions"
      title="Six modules. One operations layer."
      body="Sticky-rail capability deep-dive: Fleet & Vehicle Management, Fuel & Tank Operations, Device & PTS Control, Real-time Dashboards, Alerts & Workflow Automation, Multi-tenant Administration."
      sections={[
        {
          icon: "truck",
          title: "Fleet & Vehicle Management",
          body: "Vehicle, VehicleTracking, Geofence, VehicleTransfer.",
        },
        {
          icon: "fuel",
          title: "Fuel & Tank Operations",
          body: "TankManagement, TankStock, FuelAudit, AutomatedReconciliation.",
        },
        {
          icon: "gauge",
          title: "Device & PTS Control",
          body: "PTS, PTSDevice, ATG, IoT Gateway.",
        },
        {
          icon: "chart",
          title: "Real-time Dashboards",
          body: "Live operations, scheduled reports, custom report builder.",
        },
        {
          icon: "bell",
          title: "Alerts & Workflow Automation",
          body: "EventEngine, Notification, IssueTracker, WarningLetter.",
        },
        {
          icon: "shield",
          title: "Multi-tenant Administration",
          body: "MultiTenancy, UserManagement, Site, Supplier.",
        },
      ]}
    />
  );
}

export function IndustriesPage() {
  return (
    <PlaceholderPage
      kicker="Industries"
      title="Built for fleets that move fuel."
      body="Logistics, Mining, Construction, Retail Fuel, Public Sector, Agriculture — six tailored configurations on the same platform."
      sections={[
        {
          icon: "truck",
          title: "Logistics",
          body: "Long-haul trucking, last-mile delivery, distribution networks.",
        },
        {
          icon: "pickaxe",
          title: "Mining",
          body: "Underground and open-pit fleet, depot fuel, RFID auth.",
        },
        {
          icon: "hard_hat",
          title: "Construction",
          body: "Off-road equipment, mobile bowsers, multi-site rotation.",
        },
        {
          icon: "fuel",
          title: "Retail Fuel",
          body: "Forecourt operations, multi-pump auth, ATG reconciliation.",
        },
        {
          icon: "building_2",
          title: "Public Sector",
          body: "Government fleet, ambulance, police, municipal services.",
        },
        {
          icon: "leaf",
          title: "Agriculture",
          body: "Farm fleet, irrigation, harvest cycle fuel planning.",
        },
      ]}
    />
  );
}

export function AboutPage() {
  return (
    <PlaceholderPage
      kicker="About"
      title="Operators building for operators."
      body="Mission, story, team, values, locations. We've spent a decade in fuel-bearing fleet ops and built the tool we always wished we had."
      sections={[
        {
          icon: "rocket",
          title: "Our mission",
          body: "Make fuel and fleet ops measurable, accountable, and boring — in the best possible way.",
        },
        {
          icon: "shield",
          title: "Our values",
          body: "Operator-first. Honest defaults. No vendor lock-in.",
        },
        {
          icon: "pin",
          title: "Where we are",
          body: "Cape Town · Nairobi · Dubai · London. Sales globally.",
        },
      ]}
    />
  );
}

export function ContactPage() {
  return (
    <PlaceholderPage
      kicker="Contact"
      title="Talk to a real human."
      body="For sales, support, partnerships, or media. We answer within 1 business day — usually much sooner."
      sections={[
        {
          icon: "mail",
          title: "sales@tenacyfms.com",
          body: "For pricing, demos, procurement and contracts.",
        },
        {
          icon: "user",
          title: "support@tenacyfms.com",
          body: "Existing customers — 24/7 for Pro and Enterprise.",
        },
        {
          icon: "phone",
          title: "+27 21 555 0100",
          body: "Cape Town HQ · Mon–Fri 08:00–17:00 SAST.",
        },
      ]}
    />
  );
}
