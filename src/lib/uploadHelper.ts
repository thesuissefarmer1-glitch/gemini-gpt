import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebaseClient";

/**
 * Upload file su Firebase Storage
 * @param file File da caricare
 * @param folder Cartella dove salvarlo ("posts" o "shorts")
 * @param userId ID dell’utente
 * @returns URL pubblico del file
 */
export const uploadFile = async (file: File, folder: string, userId: string) => {
  try {
    const timestamp = Date.now();
    const storageRef = ref(storage, `${folder}/${userId}/${timestamp}_${file.name}`);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    console.log("File uploaded to:", url);
    return url;

  } catch (error) {
    console.error("Errore upload:", error);
    throw error;
  }
};
