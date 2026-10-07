import Link from "next/link";

export function ChallengePreview() {
  return (
    <Link href="/play" className="play-button inline-flex items-center justify-center">
      Play
    </Link>
  );
}
