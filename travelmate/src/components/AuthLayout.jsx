export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-[55%_45%] bg-gray-50 dark:bg-gray-950">
      {/* Left: animated mesh brand panel */}
      <div
        className="hidden lg:flex relative flex-col justify-between p-14 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0369A1 0%, #0EA5E9 55%, #10B981 100%)" }}
      >
        <div className="absolute inset-0 opacity-60">
          <div
            className="absolute -top-32 -left-20 w-[32rem] h-[32rem] rounded-full blur-3xl animate-mesh"
            style={{ background: "radial-gradient(circle, #0EA5E9 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full blur-3xl animate-mesh-slow"
            style={{ background: "radial-gradient(circle, #10B981 0%, transparent 70%)" }}
          />
          <div
            className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full blur-3xl animate-mesh"
            style={{ background: "radial-gradient(circle, #F97316 0%, transparent 70%)", animationDelay: "2s" }}
          />
        </div>

        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10">
          <span className="text-2xl font-extrabold text-white tracking-tight">TravelMate AI</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <h2 className="text-5xl font-extrabold leading-[1.1] text-white tracking-tight">
            Plan trips that<br />feel effortless.
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            AI-crafted itineraries, real budget breakdowns, and destination data that actually helps you decide.
          </p>
          <div className="flex gap-8 pt-6">
            <div>
              <p className="text-3xl font-extrabold text-white">20+</p>
              <p className="text-xs text-white/70 mt-1">Curated destinations</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-3xl font-extrabold text-white">AI</p>
              <p className="text-xs text-white/70 mt-1">Powered planning</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-3xl font-extrabold text-white">Free</p>
              <p className="text-xs text-white/70 mt-1">To get started</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/50">
          © 2026 TravelMate AI
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 animate-stagger" style={{ animationDelay: "0ms" }}>
            <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}