export function SelectArrow() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#8888aa]">
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}
