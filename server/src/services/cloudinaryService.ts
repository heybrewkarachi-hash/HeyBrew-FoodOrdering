import { env } from "../config/env";
import { signCloudinaryParams } from "../utils/crypto";
import { badRequest } from "../utils/errors";

/**
 * Returns signed upload params for Cloudinary unsigned-style signed uploads.
 * Does NOT claim Cloudinary is connected — requires CLOUDINARY_* env vars.
 */
export function createSignedUpload(params?: {
  folder?: string;
  publicId?: string;
}) {
  if (!env.cloudinaryEnabled) {
    throw badRequest(
      "CLOUDINARY_NOT_CONFIGURED",
      "Cloudinary env vars are not set (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)"
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = params?.folder ?? env.CLOUDINARY_FOLDER;
  const toSign: Record<string, string | number> = {
    timestamp,
    folder,
  };
  if (params?.publicId) {
    toSign.public_id = params.publicId;
  }

  const signature = signCloudinaryParams(toSign, env.CLOUDINARY_API_SECRET!);

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    signature,
    ...(params?.publicId ? { publicId: params.publicId } : {}),
  };
}
