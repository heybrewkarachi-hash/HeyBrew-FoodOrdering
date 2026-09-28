"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { signUpload, uploadToCloudinary } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/field";

type BannerImageFieldProps = {
  label: string;
  sizeHint: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  previewAspectClass: string;
};

export function BannerImageField({
  label,
  sizeHint,
  value,
  onChange,
  previewAspectClass,
}: BannerImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const sign = await signUpload({ folder: "heybrew/banners" });
      const uploaded = await uploadToCloudinary(file, sign);
      onChange(uploaded.url);
      toast.success(`${label} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <Label>{label}</Label>
        <p className="mt-0.5 text-xs text-espresso/55">{sizeHint}</p>
      </div>

      <div
        className={`relative overflow-hidden rounded-lg border border-dashed border-espresso/20 bg-cream-deep/40 ${previewAspectClass}`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-3 text-center text-espresso/40">
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">No image selected</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => void onPick(e.target.files?.[0])}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
              Select image
            </>
          )}
        </Button>
        {value ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={uploading}
            onClick={() => onChange(null)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}
