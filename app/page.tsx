import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-serif font-semibold text-[#1A2B4A]">
            Muscle-Meta Matrix™
          </h1>
          <p className="text-xl font-sans font-light text-[#009090] tracking-wide">
            Small Steps. Exponential Gains.
          </p>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed">
          Discover the hidden connections between your gut, muscle, metabolism,
          bone, and brain — and get a personalized plan to stop catabolic decline.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/assessment"
            className="px-8 py-4 bg-[#009090] text-white font-sans font-semibold rounded-lg hover:bg-[#007070] transition-colors text-lg">
            Take the GMMBB Assessment →
          </Link>
          <Link href="/sign-in"
            className="px-8 py-4 border-2 border-[#1A2B4A] text-[#1A2B4A] font-sans font-semibold rounded-lg hover:bg-gray-50 transition-colors text-lg">
            Sign In
          </Link>
        </div>
        <p className="text-sm text-gray-400 font-sans">
          8 minutes · Evidence-based · Built by a 35-year PT veteran
        </p>
      </div>
    </main>
  );
}
