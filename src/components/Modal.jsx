import { useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import PropTypes from 'prop-types';

const EASE = [0.22, 1, 0.36, 1];
const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-2xl' };
const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export const Modal = ({ isOpen, onClose, children, title, size = 'md' }) => {
  const reduce = useReducedMotion();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Escape, bloqueo de scroll, trampa de foco y restauración del foco.
  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      dialogRef.current ? Array.from(dialogRef.current.querySelectorAll(FOCUSABLE)) : [];

    const focusTimer = setTimeout(() => dialogRef.current?.focus(), 0);

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const els = focusables();
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onCloseRef.current()}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : 'Ventana de diálogo'}
            tabIndex={-1}
            initial={reduce ? false : { opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ duration: 0.28, ease: EASE }}
            className={`relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-white shadow-2xl outline-none sm:rounded-2xl ${SIZES[size] || SIZES.md}`}
          >
            <div className="sticky top-0 z-10 border-b border-border bg-white/95 backdrop-blur">
              <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />
              <div className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6 sm:py-4">
                {title && (
                  <h2 id={titleId} className="text-lg font-semibold text-neutral-900">
                    {title}
                  </h2>
                )}
                <button
                  type="button"
                  onClick={() => onCloseRef.current()}
                  className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-brand-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  aria-label="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export default Modal;

