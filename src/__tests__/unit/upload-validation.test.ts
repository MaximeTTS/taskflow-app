import { assertValidImageUpload, MAX_IMAGE_BYTES } from '@/lib/upload-validation';
import { ValidationError } from '@/lib/validation';

/** Construit une data URI valide dont le contenu decode pese `bytes` octets. */
function dataUri(mime: string, bytes: number): string {
  const payload = Buffer.alloc(bytes, 0x41).toString('base64');
  return `data:${mime};base64,${payload}`;
}

describe('assertValidImageUpload — formats acceptes', () => {
  it.each(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])('accepte %s', (mime) => {
    expect(() => assertValidImageUpload(dataUri(mime, 1024))).not.toThrow();
  });
});

describe('assertValidImageUpload — protection contre le SSRF', () => {
  it.each([
    'https://example.com/image.png',
    'http://169.254.169.254/latest/meta-data/',
    'http://localhost:3000/api/graphql',
    'ftp://interne/fichier.png',
    '//example.com/image.png',
    's3://bucket/cle',
  ])('rejette l\'URL distante %p', (url) => {
    expect(() => assertValidImageUpload(url)).toThrow(ValidationError);
  });

  it('rejette un chemin de fichier local', () => {
    expect(() => assertValidImageUpload('/etc/passwd')).toThrow(ValidationError);
    expect(() => assertValidImageUpload('C:\\Windows\\win.ini')).toThrow(ValidationError);
  });
});

describe('assertValidImageUpload — types refuses', () => {
  it.each([
    'data:text/html;base64,PGgxPnRlc3Q8L2gxPg==',
    'data:application/pdf;base64,JVBERi0=',
    'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    'data:application/javascript;base64,YWxlcnQoMSk=',
  ])('rejette %p', (uri) => {
    expect(() => assertValidImageUpload(uri)).toThrow(ValidationError);
  });

  it('rejette le SVG meme deguise, car il peut porter du script', () => {
    expect(() => assertValidImageUpload(dataUri('image/svg+xml', 512))).toThrow(ValidationError);
  });
});

describe('assertValidImageUpload — taille', () => {
  it('accepte une image juste sous la limite', () => {
    expect(() => assertValidImageUpload(dataUri('image/png', MAX_IMAGE_BYTES - 10))).not.toThrow();
  });

  it('rejette une image au-dela de la limite', () => {
    expect(() => assertValidImageUpload(dataUri('image/png', MAX_IMAGE_BYTES + 1024))).toThrow(
      ValidationError,
    );
  });

  it('rejette une data URI vide', () => {
    expect(() => assertValidImageUpload('data:image/png;base64,')).toThrow(ValidationError);
  });
});

describe('assertValidImageUpload — entrees malformees', () => {
  it.each(['', '   ', 'data:', 'data:image/png', 'data:image/png;base64', 'nimportequoi'])(
    'rejette %p',
    (bad) => {
      expect(() => assertValidImageUpload(bad)).toThrow(ValidationError);
    },
  );

  it('rejette un base64 invalide', () => {
    expect(() => assertValidImageUpload('data:image/png;base64,!!!not-base64!!!')).toThrow(
      ValidationError,
    );
  });
});
