export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#ECEBE8] border-b border-[#111111] font-mono text-xs">
      <div className="flex items-stretch justify-between h-11 sm:h-12 w-full">
        {/* Left: Logo cell */}
        <div className="flex items-center border-r border-[#111111] px-5 shrink-0">
          <span className="font-mono text-xs tracking-tight text-[#111111] font-bold lowercase">
            loop
          </span>
        </div>

        {/* Center: Navigation & Counter */}
        <div className="flex-1 flex items-center justify-end px-4 gap-6 text-[#111111] font-mono text-[11px] max-md:hidden">
          <span className="text-[#777777]">00 / 04</span>
          <a
            href="#simulator"
            className="hover:underline cursor-pointer"
          >
            [ simulator ]
          </a>
          <a
            href="#problem"
            className="hover:underline cursor-pointer"
          >
            [ the problem ]
          </a>
          <a
            href="#solution"
            className="hover:underline cursor-pointer"
          >
            [ the engine ]
          </a>
          <a
            href="https://huggingface.co/datasets"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline cursor-pointer"
          >
            [ hugging face ]
          </a>
        </div>

        {/* Right: Actions */}
        <div className="flex items-stretch shrink-0">
          <button
            onClick={() => {
              const el = document.getElementById("simulator");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-4 sm:px-6 border-l border-[#111111] bg-transparent hover:bg-black/5 text-[#111111] text-[11px] font-mono tracking-tight cursor-pointer transition-colors whitespace-nowrap flex items-center"
          >
            request access
          </button>

          <button
            onClick={() => {
              const el = document.getElementById("simulator");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-4 sm:px-6 bg-[#111111] text-white hover:bg-[#282828] text-[11px] font-mono tracking-tight cursor-pointer transition-colors whitespace-nowrap flex items-center"
          >
            run stress test ↗
          </button>
        </div>
      </div>
    </header>
  );
}
