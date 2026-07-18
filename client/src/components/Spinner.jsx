export default function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-[3px] border-[#c2d5f7]" />
        <div className="absolute inset-0 w-10 h-10 rounded-full border-[3px] border-transparent border-t-[#004aad] animate-spin" />
      </div>
    </div>
  );
}
