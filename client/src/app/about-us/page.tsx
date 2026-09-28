import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "HeyBrew — Karachi coffee, ordered your way. Learn about us and find our location.",
};

/** Official HeyBrew pin: https://maps.app.goo.gl/LDpG2NsUrFidGUAe8 */
const MAPS_LAT = 24.8852117;
const MAPS_LNG = 67.0697833;
const MAPS_OPEN_URL = "https://maps.app.goo.gl/LDpG2NsUrFidGUAe8";
const MAPS_EMBED_SRC = `https://www.google.com/maps?q=${MAPS_LAT},${MAPS_LNG}&z=17&output=embed`;

export default function AboutUsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <section>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-espresso md:text-4xl">
          About Us
        </h1>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-muted md:text-[1.05rem]">
          <p>
            HeyBrew is your everyday coffee stop in Karachi — built for people
            who want a good brew without the wait. From hot classics to cold
            cups, frappes, matcha, shakes, and more, we keep the menu focused on
            drinks you actually want to order again.
          </p>
          <p>
            Order for pickup or delivery right from this site, customize your
            cup the way you like it, and track your order as it comes together.
            Whether it is your morning latte or a late afternoon frappe, HeyBrew
            is here to make the ritual simple.
          </p>
          <p>
            We are based in Karachi and growing with the city — one carefully
            made drink at a time. Come visit us, or order ahead and we will have
            your brew ready.
          </p>
        </div>
        <Link
          href="/#menu"
          className="mt-8 inline-flex font-display text-base font-bold text-espresso underline decoration-espresso/30 underline-offset-4 transition hover:decoration-espresso"
        >
          Browse the menu
        </Link>
      </section>

      <section className="mt-14 md:mt-16">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-espresso">
          Find us
        </h2>
        <p className="mt-2 text-sm text-muted md:text-base">
          Visit HeyBrew in Karachi — get directions on Google Maps.
        </p>
        <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-espresso/10 bg-surface shadow-soft">
          <iframe
            title="HeyBrew location on Google Maps"
            src={MAPS_EMBED_SRC}
            className="aspect-[4/3] w-full border-0 md:aspect-[16/9]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        <a
          href={MAPS_OPEN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex font-display text-sm font-bold text-espresso underline decoration-espresso/30 underline-offset-4 transition hover:decoration-espresso"
        >
          Open in Google Maps
        </a>
      </section>
    </div>
  );
}
