import { useState } from 'react';
import { upload } from '@vercel/blob';

export const useBlobUpload = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const uploadFile = async (file, options = {}) => {
        setIsUploading(true);
        setProgress(0);

        try {
            // Get the token from our Laravel backend
            const response = await fetch(route('storage.token'));
            const { token } = await response.json();

            if (!token) {
                throw new Error('Vercel Blob token not found. Please check your environment variables.');
            }

            const blob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: null, // We are using the token directly for simplicity
                token: token,
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
