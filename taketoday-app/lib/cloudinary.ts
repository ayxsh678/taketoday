import { v2 as cloudinary } from "cloudinary";

let configured = false;

function configure() {
  if (configured) return;
  const url = process.env.CLOUDINARY_URL;
  if (!url) throw new Error("CLOUDINARY_URL not configured");
  cloudinary.config({ cloudinary_url: url });
  configured = true;
}

export type CloudinaryResult = {
  public_id: string;
  secure_url: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
};

export async function uploadBuffer(
  buffer: Buffer,
  options: { folder?: string; public_id?: string } = {},
): Promise<CloudinaryResult> {
  configure();
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: options.folder ?? "taketoday", ...options, resource_type: "auto" },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error("Upload failed"));
          resolve(result as CloudinaryResult);
        },
      )
      .end(buffer);
  });
}
