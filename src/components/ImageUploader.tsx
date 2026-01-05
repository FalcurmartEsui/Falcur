import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onAddImages: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
  maxFiles?: number;
  disabled?: boolean;
}

const ImageUploader = ({
  images,
  onAddImages,
  onRemoveImage,
  maxFiles = 10,
  disabled = false
}: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = () => {
    if (disabled || isProcessing) return;
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || isProcessing || !e.target.files?.length) return;
    
    setIsProcessing(true);
    try {
      await onAddImages(e.target.files);
    } finally {
      setIsProcessing(false);
      // Reset input so same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onAddImages(e.dataTransfer.files);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const isDisabled = disabled || isProcessing;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold">
          Product Images ({images.length}/{maxFiles})
        </label>
        {images.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Hover to remove
          </span>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
        disabled={isDisabled}
      />

      {/* Upload area */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          border-2 border-dashed border-border rounded-lg p-6
          flex flex-col items-center justify-center gap-2
          transition-colors
          ${isDisabled 
            ? "opacity-50 cursor-not-allowed" 
            : "cursor-pointer hover:border-primary hover:bg-muted/50"
          }
        `}
      >
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          {isProcessing ? (
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <p className="text-sm font-medium">
          {isProcessing ? "Processing images..." : "Click or drag images here"}
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Gallery, Camera, or Files • Max {maxFiles} images • Auto-compressed
        </p>
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((img, idx) => (
            <div 
              key={img.id} 
              className="relative group aspect-square"
            >
              <img
                src={img.preview}
                alt={`Preview ${idx + 1}`}
                className="w-full h-full object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage(idx);
                }}
                disabled={isDisabled}
                className="
                  absolute -top-2 -right-2 
                  bg-destructive text-destructive-foreground 
                  rounded-full w-6 h-6 
                  flex items-center justify-center 
                  shadow-md
                  opacity-0 group-hover:opacity-100 
                  transition-opacity
                  disabled:cursor-not-allowed
                "
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-1 left-1 bg-background/80 text-xs px-1.5 py-0.5 rounded">
                {idx + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !isProcessing && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <ImageIcon className="h-4 w-4" />
          <span>No images selected yet</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
