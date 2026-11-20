import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

export function Toast() {
  const { toast } = useMarketplace();
  if (!toast) return null;

  const Icon =
    toast.tone === 'success'
      ? CheckCircle2
      : toast.tone === 'warning'
        ? AlertTriangle
        : Info;

  const borderAccent =
    toast.tone === 'success'
      ? 'border-l-4 border-l-[#0475EE]'
      : toast.tone === 'warning'
        ? 'border-l-4 border-l-[#F5A623]'
        : 'border-l-4 border-l-[#18A3DE]';

  const iconClass =
    toast.tone === 'success'
      ? 'text-[#0475EE]'
      : toast.tone === 'warning'
        ? 'text-[#F5A623]'
        : 'text-[#18A3DE]';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-[172px] right-5 z-50 max-w-md bg-white text-[#333333] border border-[#E0E0E0] ${borderAccent} shadow-lg rounded-[4px] px-4 py-3 flex items-center gap-3 transition-all`}
    >
      <Icon className={`w-5 h-5 shrink-0 ${iconClass}`} />
      <p className="text-[13px] font-medium leading-snug">{toast.message}</p>
    </div>
  );
}
