import { useState } from 'react';
import axios from 'axios';

export const useBlobUpload = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const uploadFile = async (file) => {
        setIsUploading(true);
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(route('storage.upload'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });

            return response.data.url;
        } catch (error) {
            console.error('Blob upload failed:', error.response?.data || error.message);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    return { uploadFile, isUploading, progress };
};
