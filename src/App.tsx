import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUp, FileText, Settings2, Download, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { resizePdf, PAGE_SIZES, PageSize, Orientation } from './lib/pdf';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [targetSize, setTargetSize] = useState<PageSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setProcessedUrl(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  } as any);

  const handleResize = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      const resizedBlob = await resizePdf(file, targetSize, orientation);
      const url = URL.createObjectURL(resizedBlob);
      setProcessedUrl(url);
    } catch (err) {
      console.error(err);
      setError('Failed to process the PDF. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setProcessedUrl(null);
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
            {!file ? (
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
                    {isDragActive ? "Drop your PDF here" : "Click or drag to upload"}
                  </h3>
                  <p className="text-zinc-500 text-sm">
                    Only PDF files are supported. Maximum size depends on your browser.
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
                {/* Selected File Info */}
                <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100 mb-8">
                  <div className="flex items-center space-x-4 overflow-hidden">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-zinc-900 truncate">{file.name}</p>
                      <p className="text-sm text-zinc-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={reset}
                    className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    title="Choose another file"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
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
                      disabled={isProcessing || !!processedUrl}
                      className="w-full bg-white border border-zinc-200 text-zinc-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-none transition-shadow"
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
                        disabled={isProcessing || !!processedUrl}
                        className={cn(
                          "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                          orientation === 'portrait'
                            ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50"
                            : "text-zinc-500 hover:text-zinc-700"
                        )}
                      >
                        Portrait
                      </button>
                      <button
                        onClick={() => setOrientation('landscape')}
                        disabled={isProcessing || !!processedUrl}
                        className={cn(
                          "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
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
                  {!processedUrl ? (
                    <button
                      onClick={handleResize}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center py-4 px-6 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing PDF...
                        </>
                      ) : (
                        'Resize PDF'
                      )}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-100 text-green-800 rounded-xl text-center text-sm font-medium">
                        Success! Your PDF has been resized.
                      </div>
                      <a
                        href={processedUrl}
                        download={`resized-${targetSize.toLowerCase()}-${file.name}`}
                        className="w-full flex items-center justify-center py-4 px-6 rounded-xl text-white bg-zinc-900 hover:bg-zinc-800 focus:ring-4 focus:ring-zinc-100 font-medium transition-all"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download Resized PDF
                      </a>
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
