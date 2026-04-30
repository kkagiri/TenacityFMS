/* global React, ReactDOM, Header, Footer, useHashRoute, navigate, HomePage, PricingPage, OnboardingPage, SolutionsPage, IndustriesPage, AboutPage, ContactPage, TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakSelect, TweakSlider, TweakToggle, TweakColor */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primary": "#0078D4",
  "fontFamily": "Segoe UI",
  "density": "default",
  "radius": 4,
  "darkHero": true
}/*EDITMODE-END*/;

const FONT_OPTIONS = {
  "Segoe UI": '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  "Inter": '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  "IBM Plex Sans": '"IBM Plex Sans", -apple-system, system-ui, sans-serif',
  "Söhne / system": '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
};

function applyTweaks(t) {
  const root = document.documentElement;
  // Primary derivatives
  root.style.setProperty("--primary", t.primary);
  root.style.setProperty("--primary-hover", shade(t.primary, -8));
  root.style.setProperty("--primary-pressed", shade(t.primary, -16));
  root.style.setProperty("--primary-tint", tint(t.primary, 0.85));
  root.style.setProperty("--primary-tint-2", tint(t.primary, 0.93));
  // Font
  root.style.setProperty("--font-sans", FONT_OPTIONS[t.fontFamily] || FONT_OPTIONS["Segoe UI"]);
  root.style.setProperty("--font-display", FONT_OPTIONS[t.fontFamily] || FONT_OPTIONS["Segoe UI"]);
  // Radius
  root.style.setProperty("--r-2", t.radius + "px");
  root.style.setProperty("--r-3", (t.radius + 4) + "px");
  root.style.setProperty("--r-card", (t.radius + 4) + "px");
  // Density
  root.setAttribute("data-density", t.density);
  // Dark hero CTA section
  root.style.setProperty("--surface-ink", t.darkHero ? "#0B1220" : "#1f2933");
}

// helpers
function hexToRgb(h) { const m = h.replace("#",""); return [parseInt(m.slice(0,2),16), parseInt(m.slice(2,4),16), parseInt(m.slice(4,6),16)]; }
function rgbToHex(r,g,b) { return "#" + [r,g,b].map(v => Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join(""); }
function shade(hex, pct) { const [r,g,b] = hexToRgb(hex); const f = 1 + pct/100; return rgbToHex(r*f, g*f, b*f); }
function tint(hex, amt) { const [r,g,b] = hexToRgb(hex); return rgbToHex(r + (255-r)*amt, g + (255-g)*amt, b + (255-b)*amt); }

function App() {
  const route = useHashRoute();
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => { applyTweaks(tweaks); }, [tweaks]);

  // strip query from route for switch
  const baseRoute = route.split("?")[0];
  let page;
  switch (baseRoute) {
    case "pricing": page = <PricingPage/>; break;
    case "onboarding": page = <OnboardingPage/>; break;
    case "solutions": page = <SolutionsPage/>; break;
    case "industries": page = <IndustriesPage/>; break;
    case "about": page = <AboutPage/>; break;
    case "contact": page = <ContactPage/>; break;
    case "home":
    default: page = <HomePage/>;
  }

  return (
    <>
      <Header current={baseRoute || "home"}/>
      {page}
      <Footer/>
      <TweaksPanel title="Tweaks">
        <TweakSection label="Brand">
          <TweakColor label="Primary color" value={tweaks.primary} onChange={v => setTweak("primary", v)}/>
          <TweakSelect label="Preset" value={tweaks.primary} onChange={v => setTweak("primary", v)}
            options={[
              {value: "#0078D4", label: "Fluent Blue"},
              {value: "#005A9E", label: "Deep Sea"},
              {value: "#5B5FC7", label: "Indigo"},
              {value: "#0E7C5C", label: "Pine"},
              {value: "#A33BC2", label: "Orchid"},
              {value: "#C04B26", label: "Ember"},
              {value: "#1E2A38", label: "Graphite"},
            ]}/>
        </TweakSection>
        <TweakSection label="Typography">
          <TweakSelect label="Font family" value={tweaks.fontFamily} onChange={v => setTweak("fontFamily", v)}
            options={["Segoe UI", "Inter", "IBM Plex Sans", "Söhne / system"]}/>
        </TweakSection>
        <TweakSection label="Layout">
          <TweakRadio label="Density" value={tweaks.density} onChange={v => setTweak("density", v)}
            options={[{value: "dense", label: "Dense"}, {value: "default", label: "Default"}, {value: "comfortable", label: "Air"}]}/>
          <TweakSlider label="Corner radius" value={tweaks.radius} onChange={v => setTweak("radius", v)} min={0} max={16} step={1} unit="px"/>
        </TweakSection>
        <TweakSection label="Hero CTA">
          <TweakToggle label="Inky dark final CTA" value={tweaks.darkHero} onChange={v => setTweak("darkHero", v)}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
