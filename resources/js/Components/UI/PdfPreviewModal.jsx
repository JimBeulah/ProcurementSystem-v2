import React from 'react';
import Modal from './Modal';
import { X, Download, Printer as PrinterIcon } from 'lucide-react';

export default function PdfPreviewModal({ isOpen, onClose, url, title }) {
    if (!url) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title || 'PDF Preview'}
            maxWidth="max-w-6xl"
        >
            <div className="flex flex-col h-[80vh]">
                <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                    <iframe
                        src={`${url}#toolbar=1`}
                        className="w-full h-full border-none"
                        title={title}
                    >
                        <p className="p-10 text-center text-slate-500">
                            Your browser does not support PDFs.
                            <a href={url} className="text-blue-500 underline ml-1">Download the PDF</a> instead.
                        </p>
                    </iframe>
                </div>

                <div className="mt-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors uppercase"
                    >
                        Close
                    </button>
                    <a
                        href={url.replace('/print', '/print?download=1')} // Optional: if we want to force download via a query param in future
                        download
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <Download size={18} /> Download PDF
                    </a>
                </div>
            </div>
        </Modal>
    );
}
