import React, { useState, useRef } from 'react';
import { optimizeImage, shouldOptimizeImage, formatFileSize, type ImageOptimizationOptions } from '@/utils/image-optimizer';

interface OptimizedFileUploadProps {
  /** Accepted file types */
  accept?: string;
  /** Allow multiple files */
  multiple?: boolean;
  /** Maximum file size in MB (before optimization) */
  maxSizeMB?: number;
  /** Optimization preset */
  preset?: 'photo' | 'logo' | 'document';
  /** Custom optimization options */
  optimizationOptions?: ImageOptimizationOptions;
  /** Callback when files are ready for upload */
  onFilesReady: (files: { file: File | Blob; name: string; optimized: boolean }[]) => void;
  /** Label for the input */
  label?: string;
  /** Help text */
  helpText?: string;
  /** Required field */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function OptimizedFileUpload({
  accept = 'image/*',
  multiple = false,
  maxSizeMB = 10,
  preset = 'photo',
  optimizationOptions,
  onFilesReady,
  label,
  helpText,
  required = false,
  error,
  disabled = false,
}: OptimizedFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [progress, setProgress] = useState<{current: number; total: number} | null>(null);
  const [optimizationResults, setOptimizationResults] = useState<{name: string; saved: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file sizes
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSizeBytes) {
        console.error(`${file.name} exceeds ${maxSizeMB}MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setSelectedFiles(validFiles);
    setOptimizing(true);
    setProgress({ current: 0, total: validFiles.length });

    const processedFiles: { file: File | Blob; name: string; optimized: boolean }[] = [];
    const results: {name: string; saved: string}[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      
      try {
        // Check if image should be optimized
        if (shouldOptimizeImage(file)) {
          const result = await optimizeImage(file, optimizationOptions);
          
          processedFiles.push({
            file: result.blob,
            name: file.name,
            optimized: true
          });

          results.push({
            name: file.name,
            saved: `${result.reductionPercent.toFixed(1)}% (${formatFileSize(result.originalSize - result.optimizedSize)})`
          });
        } else {
          // File too small or not an image - use as-is
          processedFiles.push({
            file: file,
            name: file.name,
            optimized: false
          });
        }
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        // Still include the original file
        processedFiles.push({
          file: file,
          name: file.name,
          optimized: false
        });
      }

      setProgress({ current: i + 1, total: validFiles.length });
    }

    setOptimizationResults(results);
    setOptimizing(false);
    setProgress(null);
    
    // Pass processed files to parent
    onFilesReady(processedFiles);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setOptimizationResults(prev => prev.filter((_, i) => i !== index));
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    setOptimizationResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFilesReady([]);
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      {/* File Input */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled || optimizing}
          className="hidden"
          id="optimized-file-upload"
        />
        
        <label
          htmlFor="optimized-file-upload"
          className={`
            block w-full px-4 py-3 border-2 border-dashed rounded-xl text-center cursor-pointer
            transition-all
            ${disabled || optimizing
              ? 'opacity-50 cursor-not-allowed bg-neutral-50 dark:bg-neutral-800'
              : 'hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10'
            }
            ${error
              ? 'border-danger-300 bg-danger-50/50 dark:border-danger-600 dark:bg-danger-900/10'
              : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900'
            }
          `}
        >
          {optimizing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                Optimizing {progress?.current} of {progress?.total}...
              </span>
            </div>
          ) : (
            <>
              <svg className="w-10 h-10 mx-auto mb-2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Click to select {multiple ? 'files' : 'file'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {accept === 'image/*' ? 'Images' : accept} • Max {maxSizeMB}MB
                {accept === 'image/*' && ' • Auto-optimized'}
              </p>
            </>
          )}
        </label>
      </div>

      {/* Help Text */}
      {helpText && !error && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {helpText}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-danger-600 dark:text-danger-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </p>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-danger-600 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2">
            {selectedFiles.map((file, index) => {
              const result = optimizationResults[index];
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>{formatFileSize(file.size)}</span>
                        {result && (
                          <>
                            <span>→</span>
                            <span className="text-success-600 dark:text-success-400 font-medium">
                              Saved {result.saved}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
                    aria-label={`Remove ${file.name}`}
                  >
                    <svg className="w-4 h-4 text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
