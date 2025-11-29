'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { uploadDisputeEvidence } from '@/server/actions/disputes';
import { toast } from 'sonner';

interface FileUploadProps {
    onUploadComplete: (urls: string[]) => void;
    maxFiles?: number;
}

export function FileUpload({ onUploadComplete, maxFiles = 3 }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<{ url: string; name: string; type: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await processFiles(Array.from(e.target.files));
        }
    };

    const processFiles = async (files: File[]) => {
        if (uploadedFiles.length + files.length > maxFiles) {
            toast.error(`You can only upload a maximum of ${maxFiles} files.`);
            return;
        }

        setIsUploading(true);
        const newUploadedFiles = [...uploadedFiles];

        for (const file of files) {
            // Validate type
            if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
                toast.error(`${file.name} is not a supported file type.`);
                continue;
            }

            // Validate size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} exceeds the 5MB size limit.`);
                continue;
            }

            const formData = new FormData();
            formData.append('file', file);

            try {
                const result = await uploadDisputeEvidence(formData);
                if (result.success && result.url) {
                    newUploadedFiles.push({
                        url: result.url,
                        name: file.name,
                        type: file.type
                    });
                } else {
                    toast.error(`Failed to upload ${file.name}: ${result.error}`);
                }
            } catch (error) {
                toast.error(`Error uploading ${file.name}`);
            }
        }

        setUploadedFiles(newUploadedFiles);
        onUploadComplete(newUploadedFiles.map(f => f.url));
        setIsUploading(false);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        const newFiles = [...uploadedFiles];
        newFiles.splice(index, 1);
        setUploadedFiles(newFiles);
        onUploadComplete(newFiles.map(f => f.url));
    };

    return (
        <div className="space-y-4">
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileSelect}
                />

                <div className="flex flex-col items-center justify-center space-y-2 cursor-pointer">
                    <div className="p-3 bg-gray-100 rounded-full">
                        <Upload className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                        Click to upload or drag and drop
                    </div>
                    <div className="text-xs text-gray-500">
                        JPG, PNG or PDF (max 5MB)
                    </div>
                </div>
            </div>

            {isUploading && (
                <div className="text-sm text-center text-gray-500 animate-pulse">
                    Uploading files...
                </div>
            )}

            {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-3 truncate">
                                {file.type.includes('pdf') ? (
                                    <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                                ) : (
                                    <ImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                )}
                                <span className="text-sm font-medium text-gray-700 truncate" title={file.name}>
                                    {file.name}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
