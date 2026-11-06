export default function LoadingScreen() {
  return (
    <div
      role="status"
      className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#134E4A] via-[#0F766E] to-[#134E4A]"
    >
      <img src="/images/DentASSISTlogo.png" alt="DentAssist" className="h-10 object-contain" />
      <div className="flex items-center gap-2" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="loader-dot" style={{ animationDelay: `-${i * 0.15}s` }} />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
