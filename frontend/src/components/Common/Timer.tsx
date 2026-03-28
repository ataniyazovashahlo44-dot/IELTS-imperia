import { useTimer } from '../../hooks/useTimer';

interface TimerProps {
  deadline: string;
  onExpire: () => void;
  label?: string;
}

export default function Timer({ deadline, onExpire, label = 'Time Remaining' }: TimerProps) {
  const { display, isWarning, isCritical } = useTimer(deadline, onExpire);

  return (
    <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
      <div className={`w-2.5 h-2.5 rounded-full ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-red-500'}`} />
      <span className="text-lg tabular-nums tracking-tight">{display}</span>
    </div>
  );
}
