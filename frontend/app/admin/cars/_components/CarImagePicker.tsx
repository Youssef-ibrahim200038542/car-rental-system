"use client";

import { useEffect, useMemo, useRef } from "react";
import type { ChangeEvent } from "react";
import { Icon } from "../../_components/icons";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Pick one JPG/PNG/WebP (≤ 5 MB) and preview it before upload. */
export function CarImagePicker({
  file,
  onChange,
  onError,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const reject = (event: ChangeEvent<HTMLInputElement>, message: string) => {
    onError(message);
    event.target.value = "";
    onChange(null);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (!picked) return;

    if (!ALLOWED_TYPES.includes(picked.type)) {
      reject(event, "Please select a JPG, PNG, or WebP image.");
      return;
    }
    if (picked.size > MAX_IMAGE_SIZE) {
      reject(event, "Image size must not exceed 5 MB.");
      return;
    }

    onError("");
    onChange(picked);
  };

  const clear = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <section className="border-b border-[#eeece5] py-7 sm:py-8">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#0a1411]">Vehicle Image</h2>
        <p className="mt-1 text-sm text-[#68736c]">
          Upload a vehicle photo. JPG, PNG, or WebP, up to 5 MB.
        </p>
      </div>

      <input
        ref={inputRef}
        id="image"
        name="image"
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex min-h-48 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#d9d8ce] bg-[#fcfcfa] p-5 text-center transition hover:border-[#c6a15b] hover:bg-[#f8f8f5]"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob: preview of the picked file; next/image cannot optimize object URLs
          <img
            src={preview}
            alt="Selected vehicle preview"
            className="max-h-72 w-full rounded-xl object-contain"
          />
        ) : (
          <>
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8eee7] text-[#17251e]">
              <Icon name="upload" />
            </span>
            <span className="text-sm font-bold text-[#17251e]">Choose Vehicle Image</span>
            <span className="mt-1 text-xs text-[#68736c]">Click here to browse your files</span>
          </>
        )}
      </button>

      {file && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="break-all text-sm text-[#526057]">{file.name}</p>
          <button
            type="button"
            onClick={clear}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            Remove Image
          </button>
        </div>
      )}
    </section>
  );
}
