const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export async function uploadImageToCloudinary(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary yapılandırılmamış. NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ve NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET .env.local dosyasında tanımlı olmalı."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Fotoğraf yüklenemedi: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.secure_url as string;
}
