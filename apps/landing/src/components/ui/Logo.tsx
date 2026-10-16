/** The CH mark (the app icon) and the wordmark. */
export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-[10px] border border-hairline bg-ink text-[13px] font-semibold tracking-[0.02em] text-cream">
        CH
      </span>
      <span className="text-xl font-bold tracking-[-0.02em]">ClothHub</span>
    </span>
  );
}
