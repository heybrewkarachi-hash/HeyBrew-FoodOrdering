import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border border-espresso/10 bg-cream-soft/80 shadow-soft", className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-espresso/8 px-5 py-4">
      <div>
        <h2 className="font-display text-lg text-espresso">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-espresso/60">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-espresso/10 bg-gradient-to-br from-cream-soft to-cream-deep/60 p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wide text-espresso/55">{label}</p>
      <p className="mt-2 font-display text-2xl text-espresso">{value}</p>
      {hint ? <p className="mt-1 text-xs text-espresso/50">{hint}</p> : null}
    </div>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        className ?? "bg-cream-deep text-espresso"
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-espresso/15 bg-cream/50 px-6 py-12 text-center">
      <p className="font-display text-lg text-espresso">{title}</p>
      {description ? <p className="mt-1 text-sm text-espresso/55">{description}</p> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl tracking-tight text-espresso">{title}</h1>
        {description ? <p className="mt-1 text-sm text-espresso/60">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SeedBadge() {
  return <Badge className="bg-amber-100 text-amber-900">DEVELOPMENT SEED</Badge>;
}
