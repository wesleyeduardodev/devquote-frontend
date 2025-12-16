import api from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8085/api';

export interface InlineImageResponse {
    url: string;
    fileName: string;
    contentType: string;
    fileSize: number;
}

export const inlineImageService = {
    uploadImage: async (file: File, context: string = 'general'): Promise<InlineImageResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('context', context);

        const response = await api.post('/inline-images/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 30000,
        });

        const data = response.data as InlineImageResponse;

        if (data.url && data.url.startsWith('/api/')) {
            const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
            data.url = baseUrl + data.url;
        }

        return data;
    },

    compressImage: (file: File, maxWidth: number = 1200, quality: number = 0.85): Promise<File> => {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                resolve(file);
                return;
            }

            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                let { width, height } = img;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const compressedFile = new File([blob], file.name, {
                                    type: file.type,
                                    lastModified: Date.now(),
                                });
                                resolve(compressedFile);
                            } else {
                                resolve(file);
                            }
                        },
                        file.type,
                        quality
                    );
                } else {
                    resolve(file);
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    },

    isValidImageType: (file: File): boolean => {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        return validTypes.includes(file.type);
    },

    getMaxFileSize: (): number => {
        return 5 * 1024 * 1024;
    },
};
