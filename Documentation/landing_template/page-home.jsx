/* global React, Icon, DashboardMock, Sparkline, navigate */

function Hero() {
  return (
    <section
      style={{
        position: "relative",
        paddingTop: "calc(var(--header-h) + var(--s-10))",
        paddingBottom: "var(--s-11)",
        background: "linear-gradient(180deg, #F4F8FC 0%, #FFFFFF 70%)",
        overflow: "hidden",
      }}
    >
      {/* subtle grid pattern */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 80%)",
          opacity: 0.4,
        }}
      />
      <div className="container" style={{ position: "relative" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1fr",
            gap: "var(--s-9)",
            alignItems: "center",
          }}
        >
          <div className="fade-up">
            <div className="row gap-2 center" style={{ marginBottom: 20 }}>
              <span className="badge">
                <Icon name="sparkles" size={12} /> Now with predictive fuel
                anomaly detection
              </span>
            </div>
            <h1 style={{ marginBottom: 20 }}>
              Real-time fleet intelligence —{" "}
              <span style={{ color: "var(--primary)" }}>
                from tank to truck.
              </span>
            </h1>
            <p
              style={{
                fontSize: 18,
                color: "var(--text-2)",
                maxWidth: 540,
                marginBottom: 32,
                lineHeight: 1.55,
              }}
            >
              One operations layer for vehicle tracking, fuel audit, tank stock
              and PTS pump control. Built for fleets that move fuel — not just
              data.
            </p>
            <div className="row gap-3" style={{ marginBottom: 36 }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate("onboarding")}
              >
                Start free 14-day trial <Icon name="arrow_right" size={16} />
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => navigate("pricing")}
              >
                <Icon name="play" size={14} /> See live pricing
              </button>
            </div>
            <div className="row gap-6 wrap">
              {[
                { label: "No card required" },
                { label: "Setup in <1 day" },
                { label: "Cancel anytime" },
              ].map((i) => (
                <div
                  key={i.label}
                  className="row gap-2 center"
                  style={{ fontSize: 13, color: "var(--text-2)" }}
                >
                  <Icon
                    name="check_circle"
                    size={16}
                    style={{ color: "var(--success)" }}
                  />{" "}
                  {i.label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <DashboardMock />
            {/* Floating KPI cards */}
            <FloatCard top="-24px" right="-24px" delay={0.2}>
              <div className="row gap-2 center">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: "var(--success-tint)",
                    color: "var(--success)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Icon name="check" size={18} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Reconciled today
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: 18, fontWeight: 600 }}
                  >
                    R 142,890.00
                  </div>
                </div>
              </div>
            </FloatCard>
            <FloatCard bottom="-20px" left="-32px" delay={0.4}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 4,
                }}
              >
                Fuel anomaly avoided
              </div>
              <div className="row gap-2 center">
                <Sparkline
                  data={[2, 3, 2, 4, 3, 8, 3, 2]}
                  color="var(--danger)"
                  width={64}
                  height={20}
                />
                <div
                  className="mono"
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--danger)",
                  }}
                >
                  -318 L
                </div>
              </div>
              <div
                style={{ fontSize: 11, color: "var(--text-2)", marginTop: 4 }}
              >
                T-21 · pump 4 · 14:02
              </div>
            </FloatCard>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatCard({ children, top, right, bottom, left, delay = 0 }) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        right,
        bottom,
        left,
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-3)",
        padding: "12px 14px",
        boxShadow: "var(--el-3)",
        animation: `fadeUp 700ms ease ${delay}s both`,
        zIndex: 2,
      }}
    >
      {children}
    </div>
  );
}

function TrustStrip() {
  const logos = [
    "NORDEN GROUP",
    "AURORA MINING",
    "PETROFLOW",
    "CARGILINE",
    "ZAMBELI ENERGY",
    "OASIS LOGISTICS",
  ];
  return (
    <section
      style={{
        padding: "var(--s-8) 0",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface-2)",
      }}
    >
      <div className="container">
        <div
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--text-2)",
            marginBottom: 28,
          }}
        >
          Trusted by operators moving 4.2 billion litres of fuel a year
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "var(--s-6)",
          }}
        >
          {logos.map((l) => (
            <div
              key={l}
              style={{
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                fontSize: 12,
                color: "var(--text-3)",
                letterSpacing: "0.06em",
                padding: "6px 0",
                borderTop: "1px solid var(--border-strong)",
                borderBottom: "1px solid var(--border-strong)",
              }}
            >
              {l}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  const features = [
    {
      icon: "map",
      title: "GPS tracking",
      body: "Live position, geofences and route history at 5-second resolution across every vehicle in the fleet.",
    },
    {
      icon: "fuel",
      title: "Fuel audit",
      body: "Match every dispense against the receiving tank. Catch ghost litres before they reach the P&L.",
    },
    {
      icon: "tank",
      title: "Tank inventory",
      body: "ATG-grade visibility on tank stock, deliveries and shrinkage — for one site or two hundred.",
    },
    {
      icon: "gauge",
      title: "PTS pump control",
      body: "Authorise pumps with RFID, driver PIN or vehicle ID. Stop unauthorised dispenses at the nozzle.",
    },
    {
      icon: "bell",
      title: "Event engine alarms",
      body: "Composable rules across vehicles, tanks and drivers. Route to email, SMS or webhook.",
    },
    {
      icon: "chart",
      title: "Advanced reporting",
      body: "Per-site, per-vehicle, per-driver, per-shift. Schedule, export, or pipe straight to your warehouse.",
    },
  ];
  return (
    <section className="section">
      <div className="container">
        <div style={{ maxWidth: 720, marginBottom: 56 }}>
          <span className="eyebrow">Capabilities</span>
          <h2 style={{ marginTop: 12, marginBottom: 16 }}>
            Everything an operator needs in one console.
          </h2>
          <p style={{ fontSize: 17, color: "var(--text-2)" }}>
            Six tightly integrated modules. No bolt-ons, no integrations to
            babysit, no dashboards that don't agree with each other.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "var(--s-4)",
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="card"
              style={{
                padding: 28,
                transition: "border-color 200ms, transform 200ms",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.transform = "none";
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: "var(--primary-tint-2)",
                  color: "var(--primary)",
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 20,
                }}
              >
                <Icon name={f.icon} size={22} />
              </div>
              <h4 style={{ fontSize: 18, marginBottom: 8 }}>{f.title}</h4>
              <p
                style={{
                  color: "var(--text-2)",
                  fontSize: 14,
                  marginBottom: 16,
                }}
              >
                {f.body}
              </p>
              <a
                href="#/solutions"
                className="row gap-1 center"
                style={{
                  color: "var(--primary)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
                onClick={(e) => {
                  e.preventDefault();
                  navigate("solutions");
                }}
              >
                Learn more <Icon name="arrow_right" size={14} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Connect",
      body: "Plug into your existing GPS units, ATGs and PTS pumps. We support 40+ device protocols out of the box.",
      icon: "link",
    },
    {
      n: "02",
      title: "Monitor",
      body: "Live operations in one console — vehicles, tanks, drivers, sites. Every signal, every second, in one timeline.",
      icon: "pulse",
    },
    {
      n: "03",
      title: "Act",
      body: "Compose rules. Authorise pumps. Issue warnings. Generate reports. Close the loop without leaving the app.",
      icon: "zap",
    },
  ];
  return (
    <section className="section" style={{ background: "var(--surface-2)" }}>
      <div className="container">
        <div
          style={{
            textAlign: "center",
            maxWidth: 680,
            margin: "0 auto var(--s-9)",
          }}
        >
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            How it works
          </span>
          <h2 style={{ marginTop: 12, marginBottom: 16 }}>
            From signal to action in three steps.
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "var(--s-6)",
            position: "relative",
          }}
        >
          {/* connecting line */}
          <div
            style={{
              position: "absolute",
              top: 36,
              left: "16.6%",
              right: "16.6%",
              height: 1,
              borderTop: "1px dashed var(--border-strong)",
              zIndex: 0,
            }}
          />
          {steps.map((s, i) => (
            <div
              key={s.n}
              style={{ position: "relative", zIndex: 1, textAlign: "center" }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  margin: "0 auto var(--s-4)",
                  borderRadius: "50%",
                  background: "#fff",
                  border: "1px solid var(--border)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--primary)",
                  boxShadow: "var(--el-1)",
                }}
              >
                <Icon name={s.icon} size={28} />
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 12,
                  color: "var(--text-3)",
                  letterSpacing: "0.1em",
                  marginBottom: 6,
                }}
              >
                STEP {s.n}
              </div>
              <h3 style={{ fontSize: 22, marginBottom: 10 }}>{s.title}</h3>
              <p
                style={{
                  color: "var(--text-2)",
                  fontSize: 14,
                  maxWidth: 280,
                  margin: "0 auto",
                }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IndustryStrip() {
  const inds = [
    { i: "truck", t: "Logistics" },
    { i: "pickaxe", t: "Mining" },
    { i: "hard_hat", t: "Construction" },
    { i: "fuel", t: "Retail Fuel" },
    { i: "building_2", t: "Public Sector" },
    { i: "leaf", t: "Agriculture" },
  ];
  return (
    <section className="section">
      <div className="container">
        <div
          className="row between"
          style={{ alignItems: "flex-end", marginBottom: 40 }}
        >
          <div>
            <span className="eyebrow">Industries</span>
            <h2 style={{ marginTop: 12 }}>
              Built for operators who can't afford guesswork.
            </h2>
          </div>
          <a
            href="#/industries"
            className="btn btn-link"
            onClick={(e) => {
              e.preventDefault();
              navigate("industries");
            }}
          >
            All industries <Icon name="arrow_right" size={14} />
          </a>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 12,
          }}
        >
          {inds.map((i) => (
            <a
              href="#/industries"
              key={i.t}
              onClick={(e) => {
                e.preventDefault();
                navigate("industries");
              }}
              style={{
                padding: "24px 16px",
                textAlign: "center",
                border: "1px solid var(--border)",
                borderRadius: 8,
                background: "#fff",
                transition: "all 180ms",
                cursor: "pointer",
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.background = "var(--primary-tint-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "#fff";
              }}
            >
              <Icon
                name={i.i}
                size={28}
                style={{
                  color: "var(--primary)",
                  margin: "0 auto 12px",
                  display: "block",
                }}
              />
              <div style={{ fontSize: 13, fontWeight: 600 }}>{i.t}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingTeaser() {
  const plans = [
    {
      name: "Free Trial",
      price: "$0",
      body: "14-day full-feature trial. Up to 5 vehicles, 1 site.",
    },
    {
      name: "Starter",
      price: "$249",
      body: "Up to 25 vehicles, 2 sites. Tracking + fuel audit.",
    },
    {
      name: "Growth",
      price: "$649",
      featured: true,
      body: "Up to 100 vehicles, 10 sites. PTS + alarms + reports.",
    },
    {
      name: "Pro",
      price: "$1,490",
      body: "Up to 400 vehicles, 50 sites. Workflows + API access.",
    },
  ];
  return (
    <section className="section" style={{ background: "var(--surface-2)" }}>
      <div className="container">
        <div
          style={{
            textAlign: "center",
            maxWidth: 640,
            margin: "0 auto var(--s-8)",
          }}
        >
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            Pricing
          </span>
          <h2 style={{ marginTop: 12, marginBottom: 16 }}>
            Simple, transparent, by the vehicle.
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-2)" }}>
            Live pricing in your currency. No quote calls for plans under 400
            vehicles.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {plans.map((p) => (
            <div
              key={p.name}
              className="card"
              style={{
                padding: 24,
                border: p.featured
                  ? "1.5px solid var(--primary)"
                  : "1px solid var(--border)",
                boxShadow: p.featured ? "var(--el-3)" : "none",
                position: "relative",
              }}
            >
              {p.featured && (
                <span
                  className="badge"
                  style={{ position: "absolute", top: -10, right: 16 }}
                >
                  Most popular
                </span>
              )}
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-2)",
                  marginBottom: 6,
                }}
              >
                {p.name}
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 10 }}>
                {p.price}
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--text-3)",
                    fontWeight: 500,
                  }}
                >
                  /mo
                </span>
              </div>
              <p
                style={{ fontSize: 13, color: "var(--text-2)", minHeight: 56 }}
              >
                {p.body}
              </p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => navigate("pricing")}
          >
            See full pricing <Icon name="arrow_right" size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 880 }}>
        <div
          className="card"
          style={{
            padding: "var(--s-9)",
            textAlign: "center",
            background: "linear-gradient(180deg, #fff, var(--primary-tint-2))",
          }}
        >
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              marginBottom: 24,
              color: "var(--text)",
            }}
          >
            "Tenacity paid for itself in week three. We caught a 4,000-litre
            monthly leak that audits had missed for two years."
          </div>
          <div
            className="row gap-3 center"
            style={{ justifyContent: "center" }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--surface-3)",
                display: "grid",
                placeItems: "center",
                color: "var(--text-2)",
                fontWeight: 600,
              }}
            >
              MK
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Mosa Khoza</div>
              <div style={{ fontSize: 13, color: "var(--text-2)" }}>
                Head of Operations · Norden Group
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section
      className="section"
      style={{
        background: "var(--surface-ink)",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.15,
          background:
            "radial-gradient(circle at 30% 50%, var(--primary) 0%, transparent 60%), radial-gradient(circle at 80% 30%, #00B7C3 0%, transparent 50%)",
        }}
      />
      <div
        className="container"
        style={{ position: "relative", textAlign: "center" }}
      >
        <h2
          style={{
            color: "#fff",
            marginBottom: 20,
            fontSize: "clamp(32px, 4vw, 48px)",
          }}
        >
          Stop guessing. Start operating.
        </h2>
        <p
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.75)",
            maxWidth: 560,
            margin: "0 auto 36px",
          }}
        >
          Set up Tenacity on your fleet in under a day. Run a 14-day trial, on
          us.
        </p>
        <div className="row gap-3" style={{ justifyContent: "center" }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate("onboarding")}
          >
            Start free trial <Icon name="arrow_right" size={16} />
          </button>
          <button
            className="btn btn-lg"
            onClick={() => navigate("pricing")}
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            View pricing
          </button>
        </div>
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <main>
      <Hero />
      <TrustStrip />
      <FeatureGrid />
      <HowItWorks />
      <IndustryStrip />
      <PricingTeaser />
      <Testimonial />
      <FinalCTA />
    </main>
  );
}

window.HomePage = HomePage;
