import React from 'react';
import { Check, Clock, UserCheck, PackageCheck, Truck, CheckCircle2 } from 'lucide-react';

export default function RequestTimeline({ status, employeeName }) {
  const steps = [
    {
      id: 'waiting',
      title: 'Request Sent',
      desc: 'Dispatched to showroom floor queue',
      icon: Clock,
    },
    {
      id: 'assigned',
      title: 'Associate Assigned',
      desc: employeeName ? `${employeeName} is on the floor` : 'Floor associate dispatched',
      icon: UserCheck,
    },
    {
      id: 'in_progress',
      title: 'Finding Product',
      desc: 'Navigating to physical rack/shelf coordinate',
      icon: PackageCheck,
    },
    {
      id: 'product_found',
      title: 'Product In Hand',
      desc: 'Item retrieved from storage position, walking to you',
      icon: Truck,
    },
    {
      id: 'completed',
      title: 'Assistance Complete',
      desc: 'Customer physically served',
      icon: CheckCircle2,
    },
  ];

  const getStepIndex = (s) => {
    switch (s) {
      case 'waiting': return 0;
      case 'assigned': return 1;
      case 'in_progress': return 2;
      case 'product_found':
      case 'coming_to_you': return 3;
      case 'completed': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="space-y-4">
      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800">
        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative group">
              {/* Dot */}
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                  isDone
                    ? 'bg-blue-600 text-white ring-4 ring-white dark:ring-[#18181B]'
                    : isCurrent
                    ? 'bg-blue-500 text-white ring-4 ring-blue-500/20 animate-pulse shadow-md shadow-blue-500/30'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 ring-4 ring-white dark:ring-[#18181B]'
                }`}
              >
                {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : <span className="w-1.5 h-1.5 rounded-full bg-current"></span>}
              </div>

              <div className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-xs font-bold leading-tight ${
                      isCurrent ? 'text-blue-600 dark:text-blue-400' : isDone ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-500'
                    }`}
                  >
                    {step.title}
                  </h4>
                  {isCurrent && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 animate-pulse">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

