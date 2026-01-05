import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UseImageUploadOptions {
  bucket: string;
  maxFiles?: number;
  maxSizeMB?: number;
  compressionQuality?: number;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

// Compress image before upload
const compressImage = (file: File, quality: number = 0.7, maxWidth: number = 1200): Promise<File> => {
  return new Promise((resolve) => {
    // If not an image that can be compressed, return original
    if (!file.type.startsWith("image/") || file.type === "image/gif") {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Scale down if too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              // Only use compressed if smaller
              resolve(compressedFile.size < file.size ? compressedFile : file);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useImageUpload = ({ 
  bucket, 
  maxFiles = 10, 
  maxSizeMB = 5,
  compressionQuality = 0.7
}: UseImageUploadOptions) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const processingRef = useRef(false);

  const addImages = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || processingRef.current) return;

    processingRef.current = true;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const newImages: UploadedImage[] = [];

    try {
      for (const file of Array.from(files)) {
        // Check if it's an image
        if (!file.type.startsWith("image/")) {
          toast({ 
            title: "Invalid file type", 
            description: `${file.name} is not an image`,
            variant: "destructive" 
          });
          continue;
        }

        // Check file size before compression
        if (file.size > maxSizeBytes * 2) {
          toast({ 
            title: "File too large", 
            description: `${file.name} is too large to process`,
            variant: "destructive" 
          });
          continue;
        }

        // Compress the image
        const compressedFile = await compressImage(file, compressionQuality);
        
        // Check compressed size
        if (compressedFile.size > maxSizeBytes) {
          toast({ 
            title: "File still too large", 
            description: `${file.name} exceeds ${maxSizeMB}MB after compression`,
            variant: "destructive" 
          });
          continue;
        }

        // Create preview URL
        const preview = URL.createObjectURL(compressedFile);
        const id = generateId();
        
        newImages.push({ id, file: compressedFile, preview });
      }

      if (newImages.length > 0) {
        setImages((prev) => {
          const combined = [...prev, ...newImages];
          if (combined.length > maxFiles) {
            // Revoke excess previews
            combined.slice(maxFiles).forEach(img => URL.revokeObjectURL(img.preview));
            toast({ 
              title: "Too many images", 
              description: `Maximum ${maxFiles} images allowed`
            });
            return combined.slice(0, maxFiles);
          }
          return combined;
        });
        toast({ title: `${newImages.length} image(s) added and compressed` });
      }
    } finally {
      processingRef.current = false;
    }
  }, [maxFiles, maxSizeMB, compressionQuality]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const newImages = [...prev];
      // Revoke object URL to free memory
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  }, []);

  const clearImages = useCallback(() => {
    setImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.preview));
      return [];
    });
  }, []);

  const uploadImages = useCallback(async (userId: string): Promise<string[]> => {
    if (images.length === 0) return [];

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const { file } of images) {
        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${userId}/${timestamp}-${randomStr}.${ext}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast({ 
            title: "Upload failed", 
            description: `Failed to upload: ${uploadError.message}`,
            variant: "destructive" 
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        toast({ title: `${uploadedUrls.length} image(s) uploaded successfully` });
      }

      return uploadedUrls;
    } catch (error) {
      console.error("Upload error:", error);
      toast({ 
        title: "Upload error", 
        description: "An unexpected error occurred",
        variant: "destructive" 
      });
      return uploadedUrls;
    } finally {
      setIsUploading(false);
    }
  }, [bucket, images]);

  return {
    images,
    isUploading,
    addImages,
    removeImage,
    clearImages,
    uploadImages,
    hasImages: images.length > 0
  };
};
