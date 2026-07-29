import { ValidationError } from '@/lib/validation';

/**
 * Validation des images envoyées par les utilisateurs.
 *
 * Deux risques couverts :
 *
 * 1. SSRF — `cloudinary.uploader.upload()` accepte une URL distante et va la
 *    chercher depuis le serveur. Une entrée utilisateur transmise telle quelle
 *    permettait donc de faire émettre des requêtes arbitraires au serveur,
 *    y compris vers les métadonnées d'instance cloud (169.254.169.254) ou vers
 *    des services internes. On n'accepte donc que des data URI.
 *
 * 2. Volume et type — aucune limite de taille ni de format n'était appliquée.
 *    Le SVG est explicitement exclu : c'est du XML qui peut porter du script,
 *    servi ensuite depuis un domaine de confiance.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 Mo

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);

/** `data:<mime>;base64,<charge utile>` */
const DATA_URI_PATTERN = /^data:([a-z0-9.+/-]+);base64,([A-Za-z0-9+/]+={0,2})$/i;

/**
 * Vérifie qu'une entrée est bien une image encodée en base64, d'un type et
 * d'un poids acceptables. Lève une ValidationError sinon.
 */
export function assertValidImageUpload(input: string): void {
  const value = input.trim();

  if (value.length === 0) {
    throw new ValidationError('Aucune image fournie');
  }

  if (!value.startsWith('data:')) {
    throw new ValidationError(
      "L'image doit être envoyée encodée en base64, pas sous forme d'URL ou de chemin",
    );
  }

  const match = DATA_URI_PATTERN.exec(value);
  if (!match) {
    throw new ValidationError("Format d'image invalide");
  }

  const mime = match[1]!.toLowerCase();
  const payload = match[2]!;

  if (!ALLOWED_MIME.has(mime)) {
    throw new ValidationError(
      `Format non pris en charge. Formats acceptés : PNG, JPEG, WebP, GIF`,
    );
  }

  if (payload.length === 0) {
    throw new ValidationError("L'image est vide");
  }

  // Taille réelle après décodage, sans allouer le tampon.
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
  const bytes = Math.floor((payload.length * 3) / 4) - padding;

  if (bytes <= 0) {
    throw new ValidationError("L'image est vide");
  }

  if (bytes > MAX_IMAGE_BYTES) {
    const mb = (MAX_IMAGE_BYTES / (1024 * 1024)).toFixed(0);
    throw new ValidationError(`L'image dépasse la taille maximale de ${mb} Mo`);
  }
}
