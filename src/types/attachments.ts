export interface TaskAttachment {
    id: number;
    taskId: number;
    fileName: string;
    originalFileName: string;
    contentType: string;
    fileSize: number;
    filePath: string;
    fileUrl?: string;
    excluded: boolean;
    createdAt: string;
    updatedAt: string;
}