import { CuteButton } from './CuteButton';
import { PastelCard } from './PastelCard';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Keep Playing',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#4A355A]/40 p-4 backdrop-blur-xs"
    >
      <PastelCard className="w-full max-w-sm space-y-4">
        <h2 id="confirm-dialog-title" className="font-display text-xl font-bold text-[#4A355A]">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-[#6D5880]">{message}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <CuteButton variant="cream" size="sm" onClick={onCancel}>
            {cancelLabel}
          </CuteButton>
          <CuteButton variant="pink" size="sm" onClick={onConfirm}>
            {confirmLabel}
          </CuteButton>
        </div>
      </PastelCard>
    </div>
  );
}
