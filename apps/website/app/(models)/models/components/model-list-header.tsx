"use client";

export function ModelListHeaders() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <h1 className="font-semibold text-2xl tracking-tight">Models</h1>
          <p className="text-muted-foreground text-sm">
            {"from "}
            <a
              className="hover:underline"
              href="https://vercel.com/docs/ai-gateway"
              rel="noopener noreferrer"
              target="_blank"
            >
              Vercel AI Gateway
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
