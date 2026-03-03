"use client";

import { useState, useRef } from "react";

interface ReceiptUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptParsed: (data: any) => void;
}

export default function ReceiptUpload({
  isOpen,
  onClose,
  onReceiptParsed,
}: ReceiptUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB");
      return;
    }

    setError("");

    // Convert to base64 for preview and upload
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setError("");

    try {
      // Extract base64 data without the data URL prefix
      const base64Data = selectedImage.split(",")[1];

      const response = await fetch("/api/parse-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Data,
          mimeType: selectedImage.split(";")[0].split(":")[1],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onReceiptParsed({
          ...result.data,
          imageUrl: selectedImage, // Store base64 image
        });
        handleClose();
      } else {
        const error = await response.json();
        setError(error.error || "Failed to parse receipt");
      }
    } catch (error) {
      console.error("Error uploading receipt:", error);
      setError("Failed to process receipt. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setError("");
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="modal-panel bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-apple-gray-900">
            Upload Receipt
          </h2>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="premium-button text-apple-gray-400 hover:text-apple-gray-600 disabled:opacity-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Upload Area */}
        {!selectedImage ? (
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="receipt-upload"
            />
            <label
              htmlFor="receipt-upload"
              className="premium-card flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-apple-gray-300 rounded-2xl cursor-pointer hover:border-apple-gray-500 bg-apple-gray-50"
            >
              <svg
                className="w-16 h-16 text-apple-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-lg font-medium text-apple-gray-700 mb-1">
                Choose receipt image
              </p>
              <p className="text-sm text-apple-gray-500">
                PNG, JPG, or WebP (max 10MB)
              </p>
            </label>
          </div>
        ) : (
          <div className="mb-6">
            {/* Image Preview */}
            <div className="relative rounded-2xl overflow-hidden bg-apple-gray-100 mb-4">
              <img
                src={selectedImage}
                alt="Receipt preview"
                className="w-full h-auto max-h-96 object-contain"
              />
              <button
                onClick={handleRemoveImage}
                disabled={isProcessing}
                className="premium-button absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 disabled:opacity-50 shadow-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Process Button */}
            <button
              onClick={handleUpload}
              disabled={isProcessing}
              className="premium-button w-full py-3 bg-gradient-to-r from-apple-gray-800 to-apple-gray-900 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Process Receipt
                </>
              )}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-apple-gray-50 rounded-xl p-4 mb-4">
          <p className="text-xs text-apple-gray-600 mb-2 font-medium">
            Tips for best results:
          </p>
          <ul className="text-xs text-apple-gray-500 space-y-1">
            <li>• Ensure receipt is clearly visible</li>
            <li>• Good lighting and focus</li>
            <li>• Include total amount and date</li>
            <li>• Avoid shadows and reflections</li>
          </ul>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
