import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
    // For avatars and covers, we might want a consistent file name to overwrite
    const fileName = folder === 'avatars' || folder === 'covers' 
      ? `${userId}_${file.name}`
      : `${timestamp}_${file.name}`;
      
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
