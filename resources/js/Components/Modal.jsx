import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = false,
    onClose = () => { },
}) {
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape' && show && closeable) {
                onClose();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [show, closeable, onClose]);

    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
        '3xl': 'sm:max-w-3xl',
        '4xl': 'sm:max-w-4xl',
        '5xl': 'sm:max-w-5xl',
        '6xl': 'sm:max-w-6xl',
        '7xl': 'sm:max-w-7xl',
    }[maxWidth] || 'sm:max-w-2xl';

    const modalContent = (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[110] overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={close}
                            className="fixed inset-0 bg-gray-500/75 transition-opacity"
                        />

                        {/* Modal Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                            className={`relative mb-6 transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:mx-auto sm:w-full ${maxWidthClass}`}
                        >
                            {children}
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );

    return typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null;
}
