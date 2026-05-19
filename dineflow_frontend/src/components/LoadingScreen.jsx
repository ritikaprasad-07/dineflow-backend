export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center paper-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-sand" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-saffron animate-spin" />
        </div>
        <p className="font-display text-xl text-umber tracking-tightish">
          Setting the table…
        </p>
      </div>
    </div>
  )
}
