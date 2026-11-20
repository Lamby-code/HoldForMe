import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface LevelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const LevelSelectorModal: React.FC<LevelSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusFirst = () => {
      const container = dialogRef.current;
      if (!container) return;
      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        container.focus();
      }
    };

    const frameId = requestAnimationFrame(focusFirst);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;
      const container = dialogRef.current;
      if (!container) return;
      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', handleKeyDown, true);
      if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
      style={{ backgroundColor: 'var(--color-scrim)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] p-4 sm:p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-[var(--color-border-subtle)] shrink-0">
          <div>
            <h2 id="modal-title" className="type-title text-xl font-bold text-[var(--color-text)]">
              Controles
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="btn-secondary p-0 w-9 h-9"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)]">
              <div className="type-numeric text-[var(--color-text)] font-semibold">WASD / Flechas</div>
              <div className="text-[var(--color-text-muted)] mt-0.5">Mover al jugador</div>
            </div>
            <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)]">
              <div className="type-numeric text-[var(--color-text)] font-semibold">Espacio</div>
              <div className="text-[var(--color-text-muted)] mt-0.5">Terminar vuelta actual</div>
            </div>
            <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)]">
              <div className="type-numeric text-[var(--color-text)] font-semibold">Enter / Intro</div>
              <div className="text-[var(--color-text-muted)] mt-0.5">Pausar / Reanudar</div>
            </div>
            <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)]">
              <div className="type-numeric text-[var(--color-text)] font-semibold">Mantener R</div>
              <div className="text-[var(--color-text-muted)] mt-0.5">Rebobinar continuo</div>
            </div>
            <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)]">
              <div className="type-numeric text-[var(--color-text)] font-semibold">Supr</div>
              <div className="text-[var(--color-text-muted)] mt-0.5">Reiniciar</div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3.5 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className="btn-primary text-sm">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
