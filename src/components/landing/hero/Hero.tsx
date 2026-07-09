"use client";

import { HeroCopy } from "./HeroCopy";
import { HeroLiveDemo } from "./HeroLiveDemo";

/* ==========================================================================
   Hero — orchestrator. Two columns: editorial promise (left) + a live test
   of the real Taysir workflow (right). All the moving parts live in their own
   modules (demo-data · useHeroDemo · demo-parts · HeroLiveDemo · HeroCopy) so
   the landing page stays a clean composition.
   ========================================================================== */

export const Hero = () => (
	<section className="hero-section">
		<div className="hero-grid">
			<HeroCopy />
			<div className="hero-media">
				<div className="hero-media-inner">
					<HeroLiveDemo />
				</div>
			</div>
		</div>
	</section>
);
