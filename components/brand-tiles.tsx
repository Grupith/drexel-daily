export function BrandTiles() {
  return (
    <div className="flex justify-center gap-1.75 mb-7" aria-hidden="true">
      <span className="grid place-items-center size-11.5 rounded-[5px] bg-drexel-action text-white text-2xl font-bold leading-normal">
        D
      </span>
      <span
        className="
        grid place-items-center size-11.5 rounded-[5px] bg-drexel-tile-middle text-white text-2xl font-bold
        leading-normal
      "
      >
        B
      </span>
      <span
        className="
        grid place-items-center size-11.5 rounded-[5px] bg-drexel-tile-last text-drexel-tile-last-ink
        text-2xl font-bold leading-normal
      "
      >
        S
      </span>
    </div>
  );
}
