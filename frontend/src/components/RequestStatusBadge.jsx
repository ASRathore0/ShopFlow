import React from 'react';
import { Clock, UserCheck, Search, CheckCircle, Navigation, CheckCircle2, XCircle } from 'lucide-react';

export default function RequestStatusBadge({ status, size = "md" }) {
  const configs = {
    waiting: {
      label: 'Waiting for Staff',
      bg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
      icon: Clock,
      dot: 'bg-amber-500 dark:bg-amber-400',
    },
    assigned: {
      label: 'Staff Assigned',
      bg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
      icon: UserCheck,
      dot: 'bg-blue-600 dark:bg-blue-400',
    },
    in_progress: {
      label: 'Navigating to Shelf',
      bg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
      icon: Search,
      dot: 'bg-indigo-600 dark:bg-indigo-400',
    },
    product_found: {
      label: 'Product Found',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      icon: CheckCircle,
      dot: 'bg-emerald-600 dark:bg-emerald-400',
    },
    coming_to_you: {
      label: 'Coming to You',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      icon: Navigation,
      dot: 'bg-emerald-600 dark:bg-emerald-400 animate-pulse',
    },
    completed: {
      label: 'Completed',
      bg: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700',
      icon: CheckCircle2,
      dot: 'bg-slate-500 dark:bg-zinc-400',
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
      icon: XCircle,
      dot: 'bg-red-600 dark:bg-red-400',
    },
  };

  const config = configs[status] || configs.waiting;
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`font-semibold rounded-full border inline-flex items-center gap-1.5 ${config.bg} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

