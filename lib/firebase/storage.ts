import { storage } from './config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export async function uploadPinImage(
  tenantId: string,
  pinId: string,
  file: File
): Promise<{ url: string; thumbnailUrl?: string }> {
  // Create a unique filename
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const filename = `${timestamp}-${randomId}-${file.name}`;

  // Upload to Firebase Storage
  const storagePath = `tenants/${tenantId}/pins/${pinId}/images/${filename}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return {
    url: downloadURL,
    thumbnailUrl: downloadURL, // Could optimize with thumbnail generation later
  };
}

export async function deletePinImage(imageUrl: string): Promise<void> {
  try {
    // Extract storage path from download URL
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (err) {
    console.error('Failed to delete image:', err);
  }
}
