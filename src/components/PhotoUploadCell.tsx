"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { useState } from "react";

interface PhotoUploadCellProps {
  photoUrl?: string;
  onUploadSuccess: (url: string) => void;
}

export default function PhotoUploadCell({ photoUrl, onUploadSuccess }: PhotoUploadCellProps) {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="flex items-center justify-center">
      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "school_id_photos"}
        onSuccess={(result) => {
          setIsUploading(false);
          if (result.info && typeof result.info === "object" && "secure_url" in result.info) {
            onUploadSuccess(result.info.secure_url as string);
          }
        }}
        onUploadAdded={() => setIsUploading(true)}
        onError={() => setIsUploading(false)}
        options={{
          maxFiles: 1,
          clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
          maxFileSize: 5000000, // 5MB
          sources: ["local", "camera", "url"],
          cropping: true,
          croppingAspectRatio: 0.8, // standard passport photo ratio (e.g. 4x5)
        }}
      >
        {({ open }) => {
          return (
            <button
              onClick={() => open?.()}
              disabled={isUploading}
              className={`
                relative w-10 h-10 rounded-lg border-2 border-dashed flex items-center justify-center
                transition-colors overflow-hidden group
                ${
                  photoUrl
                    ? "border-transparent bg-muted"
                    : "border-border hover:border-primary hover:bg-primary/5 bg-surface text-muted-fg"
                }
              `}
              title={photoUrl ? "Change Photo" : "Upload Photo"}
            >
              {isUploading ? (
                <Loader2 size={16} className="animate-spin text-primary" />
              ) : photoUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt="Student" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera size={16} className="text-white" />
                  </div>
                </>
              ) : (
                <ImageIcon size={18} className="group-hover:text-primary transition-colors" />
              )}
            </button>
          );
        }}
      </CldUploadWidget>
    </div>
  );
}