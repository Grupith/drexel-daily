"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChallengePreview() {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button
        className="play-button cursor-pointer"
        onClick={() => dialog.current?.showModal()}
      >
        Play
      </Button>
      <dialog
        ref={dialog}
        className="challenge-dialog"
        aria-labelledby="preview-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="dialog-heading">
          <h2 id="preview-title">Day 1 Challenge</h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </Button>
        </div>
        <p>The game is coming soon.</p>
      </dialog>
    </>
  );
}
