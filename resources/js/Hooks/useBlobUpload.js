import { useState } from 'react';
import { upload } from '@vercel/blob/client';

export const useBlobUpload = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const uploadFile = async (file, options = {}) => {
        setIsUploading(true);
        setProgress(0);

        try {
            const blob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: route('storage.upload'),
                ...options,
                onUploadProgress: (p) => {
                    setProgress(p.percentage);
                }
            });

            return blob.url;
        } catch (error) {
            console.error('Blob upload failed:', error);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    return { uploadFile, isUploading, progress };
};
