import { v2 as cloudinary } from 'cloudinary';

/**
 * Envoi d'images vers Cloudinary.
 *
 * La validation du contenu (type, taille, refus des URLs distantes) a lieu
 * en amont dans `lib/upload-validation.ts` : `cloudinary.uploader.upload()`
 * accepte aussi bien une data URI qu'une URL qu'il ira chercher lui-même, ce
 * qui en fait un vecteur de SSRF si on lui transmet une entrée utilisateur
 * telle quelle. Ne jamais appeler ces fonctions sans avoir validé avant.
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = Boolean(CLOUD_NAME && API_KEY && API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
  });
}

/**
 * Sans configuration, l'appel échouait avec une erreur interne de Cloudinary
 * incompréhensible pour l'utilisateur. On préfère un message qui dit quoi faire.
 */
function assertConfigured(): void {
  if (!isCloudinaryConfigured) {
    throw new Error(
      "L'envoi d'images n'est pas configuré sur ce serveur " +
        '(CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET manquantes)',
    );
  }
}

export async function uploadImage(
  base64Image: string,
  folder: string = 'taskflow',
): Promise<{ url: string; publicId: string }> {
  assertConfigured();

  const result = await cloudinary.uploader.upload(base64Image, {
    folder,
    // Interdit explicitement à Cloudinary de suivre une URL, seconde barrière
    // après la validation en amont.
    resource_type: 'image',
    transformation: [{ width: 1200, crop: 'limit' }, { quality: 'auto' }, { fetch_format: 'auto' }],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

export async function deleteImage(publicId: string): Promise<void> {
  assertConfigured();
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
