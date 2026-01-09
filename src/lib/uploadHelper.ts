import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebaseClient";

/**
 * Upload file su Firebase Storage
 * @param file File da caricare
 * @param folder Cartella dove salvarlo ("posts", "shorts", "avatars", "covers")
 * @param userId ID dell’utente
 * @returns URL pubblico del file
 */
export const uploadFile = async (file: File, folder: string, userId: string) => {
  try {
    const timestamp = Date.now();
    // For avatars and covers, we might want a consistent file name to overwrite, but a unique one is safer to avoid caching issues.
    const fileName = `${userId}_${timestamp}_${file.name}`;
      
    const storageRef = ref(storage, `${folder}/${userId}/${fileName}`);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    console.log("File uploaded to:", url);
    return url;

  } catch (error) {
    console.error("Errore upload:", error);
    throw error;
  }
};

/**
 * Deletes a file from Firebase Storage.
 * @param fileUrl The full URL of the file to delete.
 */
export const deleteFile = async (fileUrl: string) => {
  if (!fileUrl) return;
  try {
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
    console.log("File deleted from:", fileUrl);
  } catch (error: any) {
    // It's okay if the file doesn't exist.
    if (error.code === 'storage/object-not-found') {
        console.warn("File to delete not found, skipping:", fileUrl);
        return;
    }
    console.error("Error deleting file:", error);
    throw error;
  }
}

    