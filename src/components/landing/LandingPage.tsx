"use client";

import { LandingNavbar as Navbar } from "./components/LandingNavbar";
import { Hero as HeroLive } from "./hero";
import { DemoCtaProvider } from "./lib/DemoCta";
import { SmoothScroll } from "./lib/SmoothScroll";
import { Footer } from "./sections/Footer";
import { Faq, FinalCta, HowItWorks, Problem } from "./sections/Funnel";
import { KPIBand } from "./sections/KPIBand";
import { LiveDashboardDraw } from "./sections/LiveDemo";
import { MicroDemo } from "./sections/MicroDemo";
import { PlatformTabs } from "./sections/PlatformTabs";
import { MassiveStats, MultiTenantBento } from "./sections/PowerShowcase";
import { Pricing } from "./sections/Pricing";
import { ROISimulator } from "./sections/ROISimulator";

/* ==========================================================================
   Taysir Landing Page — Implementation based on Taysir Design System
   ========================================================================== */

// --- Sub-components ---

const Hero = ({ locale: _locale }: { locale: string }) => {
	return <HeroLive />;
};

// --- Main Page ---

export default function LandingPage({ locale }: { locale: string }) {
	return (
		<DemoCtaProvider>
			<SmoothScroll />
			{/* overflow-x: clip kills any mobile horizontal bleed without creating a
			    scroll container (unlike `hidden`), keeping window-based Lenis intact */}
			<div className="min-h-screen bg-white" style={{ overflowX: "clip" }}>
				<Navbar locale={locale} />
				<Hero locale={locale} />
				<KPIBand />
				<Problem />
				<HowItWorks />
				<MassiveStats />
				<MultiTenantBento />
				<LiveDashboardDraw />
				<PlatformTabs />
				<MicroDemo />
				<ROISimulator />
				<Pricing locale={locale} />
				<Faq />
				<FinalCta />
				<Footer />
			</div>
		</DemoCtaProvider>
	);
}
