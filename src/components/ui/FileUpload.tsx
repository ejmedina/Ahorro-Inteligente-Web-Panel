"use client";

import React, { useCallback, useState } from "react";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    onFileSelect: (file: File | null) => void;
    accept?: string;
    error?: string;
}

export function FileUpload({ onFileSelect, accept = "application/pdf,image/*", error }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFile = (file: File) => {
        setSelectedFile(file);
        onFileSelect(file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        onFileSelect(null);
    };

    return (
        <div className="w-full">
            {!selectedFile ? (
                <label
                    className={cn(
                        "relative flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed transition-colors cursor-pointer",
                        dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100",
                        error && "border-red-500 bg-red-50"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                        <UploadCloud className="w-10 h-10 mb-3 text-blue-500" />
                        <p className="mb-1 text-sm font-semibold">Hacé clic o arrastrá tu factura</p>
                        <p className="text-xs">PDF, PNG o JPG (Max 10MB)</p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        accept={accept}
                        onChange={handleChange}
                    />
                </label>
            ) : (
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <FileIcon className="w-6 h-6" />
                        </div>
                        <div className="truncate">
                            <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={removeFile}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}
            {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        </div>
    );
}
