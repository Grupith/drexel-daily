import type { Metadata } from "next";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "About | Drexel Daily",
};

export default function AboutPage() {
  return (
    <div className="min-h-svh flex flex-col text-drexel-ink font-drexel bg-drexel-canvas">
      <main className="flex-1 grid justify-items-center content-start pt-16 px-5 pb-10 [@media(max-width:600px)]:pt-9">
        <div className="w-full max-w-150">
          <section
            className="
              p-9 rounded-[20px] [@media(max-width:600px)]:px-5 [@media(max-width:600px)]:py-6 border-0
              bg-transparent shadow-none
            "
            aria-labelledby="about-title"
          >
            <p className="mb-3 text-drexel-link text-xs font-bold tracking-[1px] uppercase leading-normal">A little sharper, every day</p>
            <h1 id="about-title" className="text-[clamp(24px,4vw,30px)] font-bold leading-[1.3] tracking-[-0.7px] focus:outline-none">About Drexel Daily</h1>
            <Separator className="my-6 bg-drexel-divider" />
            <p className="mt-3 mb-6 text-drexel-subtle text-sm leading-normal">
              Think you know Drexel? Put your knowledge to the test!
            </p>

            <p className="mt-3 mb-6 text-drexel-subtle text-sm leading-normal">
              Drexel Daily was built for our team to have a little fun, learn
              something new, and maybe even spark some friendly competition. It
              focuses on one of our 11 core values:
              <strong> Have fun.</strong>
            </p>

            <p className="mt-3 mb-6 text-drexel-subtle text-sm leading-normal">
              Every weekday brings three new questions about our products,
              vendors, safety, history, and everything that makes Drexel,
              Drexel.
            </p>
            <Separator className="my-6 bg-drexel-divider" />
            <footer className="flex items-center gap-3.5">
              <span className="
                grid place-items-center shrink-0 size-11 rounded-xl bg-drexel-avatar text-drexel-avatar-ink
                text-sm font-bold leading-normal
              " aria-hidden="true">
                DK
              </span>
              <div className="min-w-0">
                <p className="text-drexel-subtle text-[11px] font-semibold tracking-[1px] uppercase leading-normal">Built by</p>
                <p className="mt-0.75 text-sm font-semibold leading-normal">Dylan Koss</p>
                <p className="mt-0.5 text-drexel-subtle text-xs leading-normal">Kewaskum Fulfillment</p>
                <a
                  className="
                    inline-block mt-1.5 text-drexel-link text-xs wrap-anywhere underline-offset-3 hover:underline
                    leading-normal
                  "
                  href="mailto:dylan.koss@drexelteam.com"
                >
                  dylan.koss@drexelteam.com
                </a>
              </div>
            </footer>
          </section>
          <div className="text-center">
            <Link href="/" className="
              w-45 max-w-full h-12.5 rounded-full bg-drexel-action text-white text-base font-semibold
              hover:bg-drexel-action-hover focus-visible:outline-2 focus-visible:outline-solid
              focus-visible:outline-drexel-focus focus-visible:outline-offset-3 inline-flex items-center
              justify-center leading-normal
            ">
              Click to play now!
            </Link>
          </div>
          <div className="text-center">
            <Link href="/" className="
              inline-flex items-center gap-2 mt-6 text-sm text-drexel-subtle whitespace-nowrap
              hover:text-drexel-brand dark:hover:text-drexel-subtle [@media(max-width:600px)]:mt-5 leading-normal
            ">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
