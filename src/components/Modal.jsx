import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import PropTypes from 'prop-types';

const EASE = [0.22, 1, 0.36, 1];
const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };
const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
const MOBILE_QUERY = '(max-width: 639px)';

/** En móvil el modal es una hoja inferior que se puede arrastrar hacia abajo para cerrar. */
const useIsMobile = () => {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
};

export const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  footer,
  size = 'md',
  hideClose = false,
  closeOnOverlay = true,
}) => {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const dragControls = useDragControls();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descId = useId();

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

  const hidden = isMobile ? { opacity: 1, y: '100%' } : { opacity: 0, y: 24, scale: 0.97 };
  const shown = { opacity: 1, y: 0, scale: 1 };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => closeOnOverlay && onCloseRef.current()}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            aria-label={title ? undefined : 'Ventana de diálogo'}
            tabIndex={-1}
            initial={reduce ? false : hidden}
            animate={shown}
            exit={reduce ? { opacity: 0 } : hidden}
            transition={{ duration: 0.32, ease: EASE }}
            drag={isMobile && !reduce ? 'y' : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onCloseRef.current();
            }}
            className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-white shadow-2xl outline-none sm:max-h-[90vh] sm:rounded-2xl ${SIZES[size] || SIZES.md}`}
          >
            <div
              className="flex-none border-b border-border bg-white"
              onPointerDown={(e) => isMobile && dragControls.start(e)}
              style={{ touchAction: isMobile ? 'none' : undefined }}
            >
              <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />
              <div className="flex items-start justify-between gap-4 px-5 py-3.5 sm:px-6 sm:py-4">
                <div className="min-w-0">
                  {title && (
                    <h2 id={titleId} className="text-lg font-semibold tracking-tight text-neutral-900">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descId} className="mt-0.5 text-sm leading-relaxed text-text-secondary">
                      {description}
                    </p>
                  )}
                </div>
                {!hideClose && (
                  <button
                    type="button"
                    onClick={() => onCloseRef.current()}
                    className="-mr-1.5 ml-auto flex h-9 w-9 flex-none items-center justify-center rounded-lg text-text-secondary transition-all hover:rotate-90 hover:bg-brand-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 motion-reduce:hover:rotate-0"
                    aria-label="Cerrar"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">{children}</div>
            {footer && (
              <div className="flex flex-none flex-col-reverse gap-2 border-t border-border bg-brand-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  hideClose: PropTypes.bool,
  closeOnOverlay: PropTypes.bool,
};

export default Modal;