import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message,
    type = 'confirm', // 'confirm', 'alert', 'prompt', 'danger'
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    defaultValue = '',
    inputPlaceholder = 'Enter reason...',
    required = false,
    minLength = 1,
}) {
    const [inputValue, setInputValue] = useState(defaultValue);

    useEffect(() => {
        if (isOpen) {
            setInputValue(defaultValue);
        }
    }, [isOpen, defaultValue]);

    const isInvalid = type === 'prompt' && required && inputValue.trim().length < minLength;

    const handleConfirm = () => {
        if (isInvalid) return;
        if (type === 'prompt') {
            onConfirm(inputValue);
        } else {
            onConfirm();
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                {message && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {message} {required && <span className="text-rose-500 font-bold">*</span>}
                    </p>
                )}

                {type === 'prompt' && (
                    <div className="mt-4">
                        <TextInput
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="mt-1 block w-full"
                            placeholder={inputPlaceholder}
                            isFocused={isOpen}
                        />
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    {type !== 'alert' && (
                        <SecondaryButton onClick={onClose}>
                            {cancelText}
                        </SecondaryButton>
                    )}
                    
                    {type === 'danger' ? (
                        <DangerButton onClick={handleConfirm} disabled={isInvalid}>
                            {confirmText}
                        </DangerButton>
                    ) : (
                        <PrimaryButton onClick={handleConfirm} disabled={isInvalid}>
                            {confirmText}
                        </PrimaryButton>
                    )}
                </div>
            </div>
        </Modal>
    );
}
