import type { Metadata } from "next";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "About | Drexel Daily",
};

export default function AboutPage() {
  return (
    <div className="daily-page landing-page">
      <main className="daily-main">
        <div className="play-layout">
          <section
            className="play-card about-content"
            aria-labelledby="about-title"
          >
            <p className="play-eyebrow">A little sharper, every day</p>
            <h1 id="about-title">About Drexel Daily</h1>
            <Separator className="about-divider" />
            <p className="play-instruction">
              Think you know Drexel? Put your knowledge to the test!
            </p>

            <p className="play-instruction">
              Drexel Daily was built for our team to have a little fun, learn
              something new, and maybe even spark some friendly competition. It
              focuses on one of our 11 core values:
              <strong> Have fun.</strong>
            </p>

            <p className="play-instruction">
              Every weekday brings three new questions about our products,
              vendors, safety, history, and everything that makes Drexel,
              Drexel.
            </p>
            <Separator className="about-divider" />
            <footer className="about-credit">
              <span className="about-credit-avatar" aria-hidden="true">
                DK
              </span>
              <div>
                <p className="about-credit-label">Built by</p>
                <p className="about-credit-name">Dylan Koss</p>
                <p className="about-credit-team">Kewaskum Fulfillment</p>
                <a
                  className="about-credit-email"
                  href="mailto:dylan.koss@drexelteam.com"
                >
                  dylan.koss@drexelteam.com
                </a>
              </div>
            </footer>
          </section>
          <div className="about-actions">
            <Link href="/" className="play-button about-play-button">
              Click to play now!
            </Link>
          </div>
          <div className="about-home">
            <Link href="/" className="play-home">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
