"use client";

export default function PageTopbar({
  eyebrow = "Halaman",
  title = "Judul Halaman",
  subtitle = "",
  rightSlot = null,
  leftSlot = null,
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          {leftSlot && <div className="shrink-0">{leftSlot}</div>}

          <div>
            <p className="text-sm font-medium text-blue-300">{eyebrow}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
            ) : null}
          </div>
        </div>

        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>
    </section>
  );
}