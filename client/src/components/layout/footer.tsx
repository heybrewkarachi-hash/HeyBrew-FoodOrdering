import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-espresso/10 bg-surface/60 safe-pb md:mt-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row md:items-start md:justify-between md:px-6 md:py-10">
        <div className="space-y-3">
          <div className="flex items-center gap-0.5">
            <Image
              src="/brand/heybrew-logo-mark.png"
              alt="HeyBrew"
              width={56}
              height={56}
              className="h-11 w-11 object-contain md:h-14 md:w-14"
            />
            <span className="relative top-0.5 font-display text-lg font-extrabold tracking-tight text-black md:top-1 md:text-xl">
              HeyBrew<span className="text-black">.</span>
            </span>
          </div>
          <p className="max-w-sm text-sm text-muted">
            Karachi coffee, ordered your way. Contact details and hours are
            managed in admin — placeholders only until configured.
          </p>
          <p className="text-xs text-muted">
            Hours: Configure in admin · Phone: Configure in admin
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="space-y-2">
            <p className="font-display font-bold text-espresso">Explore</p>
            <Link href="/#menu" className="block text-muted hover:text-espresso">
              Menu
            </Link>
            <Link
              href="/about-us"
              className="block text-muted hover:text-espresso"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="block text-muted hover:text-espresso"
            >
              Contact
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-display font-bold text-espresso">Policies</p>
            <Link
              href="/policies/privacy"
              className="block text-muted hover:text-espresso"
            >
              Privacy
            </Link>
            <Link
              href="/policies/terms"
              className="block text-muted hover:text-espresso"
            >
              Terms
            </Link>
            <Link
              href="/policies/refund"
              className="block text-muted hover:text-espresso"
            >
              Refunds
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-espresso/5 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} HeyBrew. All rights reserved.
      </div>
    </footer>
  );
}
