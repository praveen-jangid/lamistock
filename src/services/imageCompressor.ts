/**
 * Client-side image compressor for mobile and desktop camera captures.
 */
export async function compressImage(
  fileOrBlob: File | Blob,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Natural Mango Wood textured SVG data URL default fallback
 */
export function getMangoWoodTexture(shade: 'natural' | 'dark' | 'back' = 'natural'): string {
  let c1 = '#8c5932';
  let c2 = '#5c3516';

  if (shade === 'dark') {
    c1 = '#6d4223';
    c2 = '#44230d';
  } else if (shade === 'back') {
    c1 = '#9d683e';
    c2 = '#6a3f1d';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="350">
    <defs>
      <linearGradient id="mangoWoodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="50%" stop-color="${c2}" />
        <stop offset="100%" stop-color="${c1}" />
      </linearGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.03 0.8" numOctaves="4" result="noise" />
        <feColorMatrix type="matrix" values="0.3 0 0 0 0  0 0.3 0 0 0  0 0 0.3 0 0  0 0 0 0.28 0" />
        <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
      </filter>
    </defs>
    <rect width="500" height="350" fill="url(#mangoWoodGrad)" filter="url(#grain)" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_MANGO_FRONT_IMAGE = getMangoWoodTexture('natural');
export const DEFAULT_MANGO_BACK_IMAGE = getMangoWoodTexture('back');
