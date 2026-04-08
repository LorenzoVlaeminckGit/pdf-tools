import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUp, FileText, Settings2, Download, Loader2, RefreshCw, AlertCircle, X, CheckCircle } from 'lucide-react';
import { resizePdf, PAGE_SIZES, PageSize, Orientation } from './lib/pdf';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ProcessedFile {
  originalName: string;
  url: string;
  size: number;
}

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [targetSize, setTargetSize] = useState<PageSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles(prev => [...prev, ...acceptedFiles]);
      setProcessedFiles([]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
  } as any);

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  const handleResize = async () => {
    if (files.length === 0) return;

    try {
      setIsProcessing(true);
      setError(null);
      
      const results: ProcessedFile[] = [];
      for (const file of files) {
        const resizedBlob = await resizePdf(file, targetSize, orientation);
        results.push({
          originalName: file.name,
          url: URL.createObjectURL(resizedBlob),
          size: resizedBlob.size
        });
      }
      
      setProcessedFiles(results);
    } catch (err) {
      console.error(err);
      setError('Failed to process one or more PDFs. Please check your files and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setProcessedFiles([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-24">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-600 rounded-2xl mb-6">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            PDF Resizer Pro
          </h1>
          <p className="text-lg text-zinc-500 max-w-xl mx-auto">
            Resize your PDF documents to standard formats instantly. 
            Vector scaling ensures you never lose quality.
          </p>
        </header>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden">
          <AnimatePresence mode="wait">
            {files.length === 0 ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 md:p-12"
              >
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors duration-200 ease-in-out",
                    isDragActive 
                      ? "border-indigo-500 bg-indigo-50" 
                      : "border-zinc-200 hover:border-indigo-300 hover:bg-zinc-50"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="mx-auto w-16 h-16 mb-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <FileUp className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {isDragActive ? "Drop your PDFs here" : "Click or drag to upload PDFs"}
                  </h3>
                  <p className="text-zinc-500 text-sm">
                    You can select multiple PDF files at once.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 md:p-10"
              >
                {/* Selected Files List */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Selected Files ({files.length})</h3>
                    <button
                      onClick={reset}
                      className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors flex items-center"
                    >
                      <RefreshCw className="w-4 h-4 mr-1.5" />
                      Start Over
                    </button>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {files.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="truncate">
                            <p className="font-medium text-sm text-zinc-900 truncate">{file.name}</p>
                            <p className="text-xs text-zinc-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        {!processedFiles.length && !isProcessing && (
                          <button
                            onClick={() => removeFile(idx)}
                            className="p-2 text-zinc-400 hover:text-red-500 transition-colors shrink-0"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Add more files dropzone */}
                  {!processedFiles.length && !isProcessing && (
                    <div
                      {...getRootProps()}
                      className="mt-3 border-2 border-dashed border-zinc-200 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-300 hover:bg-zinc-50 transition-colors"
                    >
                      <input {...getInputProps()} />
                      <p className="text-sm text-zinc-500 font-medium">+ Add more files</p>
                    </div>
                  )}
                </div>

                {/* Settings Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-3">
                    <label className="flex items-center text-sm font-medium text-zinc-700">
                      <Settings2 className="w-4 h-4 mr-2 text-zinc-400" />
                      Target Size
                    </label>
                    <select
                      value={targetSize}
                      onChange={(e) => setTargetSize(e.target.value as PageSize)}
                      disabled={isProcessing || processedFiles.length > 0}
                      className="w-full bg-white border border-zinc-200 text-zinc-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-none transition-shadow disabled:opacity-50"
                    >
                      {Object.keys(PAGE_SIZES).map((size) => (
                        <option key={size} value={size}>
                          {size} ({PAGE_SIZES[size as PageSize][0]} x {PAGE_SIZES[size as PageSize][1]} pt)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center text-sm font-medium text-zinc-700">
                      <Settings2 className="w-4 h-4 mr-2 text-zinc-400" />
                      Orientation
                    </label>
                    <div className="flex rounded-xl border border-zinc-200 overflow-hidden p-1 bg-zinc-50">
                      <button
                        onClick={() => setOrientation('portrait')}
                        disabled={isProcessing || processedFiles.length > 0}
                        className={cn(
                          "flex-1 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50",
                          orientation === 'portrait'
                            ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50"
                            : "text-zinc-500 hover:text-zinc-700"
                        )}
                      >
                        Portrait
                      </button>
                      <button
                        onClick={() => setOrientation('landscape')}
                        disabled={isProcessing || processedFiles.length > 0}
                        className={cn(
                          "flex-1 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50",
                          orientation === 'landscape'
                            ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50"
                            : "text-zinc-500 hover:text-zinc-700"
                        )}
                      >
                        Landscape
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-zinc-100">
                  {processedFiles.length === 0 ? (
                    <button
                      onClick={handleResize}
                      disabled={isProcessing || files.length === 0}
                      className="w-full flex items-center justify-center py-4 px-6 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing {files.length} {files.length === 1 ? 'file' : 'files'}...
                        </>
                      ) : (
                        `Resize ${files.length} ${files.length === 1 ? 'PDF' : 'PDFs'}`
                      )}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-100 text-green-800 rounded-xl flex items-center justify-center text-sm font-medium">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                        Successfully resized {processedFiles.length} {processedFiles.length === 1 ? 'file' : 'files'}!
                      </div>
                      
                      <div className="space-y-3">
                        {processedFiles.map((pf, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                            <div className="truncate pr-4">
                              <p className="font-medium text-sm text-zinc-900 truncate">resized-{pf.originalName}</p>
                              <p className="text-xs text-zinc-500">
                                {(pf.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <a
                              href={pf.url}
                              download={`resized-${targetSize.toLowerCase()}-${pf.originalName}`}
                              className="flex items-center justify-center py-2 px-4 rounded-lg text-sm text-white bg-zinc-900 hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-200 font-medium transition-all shrink-0"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <footer className="mt-12 text-center text-sm text-zinc-400">
          <p>Processing happens entirely in your browser. Your files are never uploaded to any server.</p>
        </footer>
      </main>
    </div>
  );
}
