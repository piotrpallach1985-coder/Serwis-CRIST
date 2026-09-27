import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FALLBACK_LOGO_BASE64 } from './logoBase64';

export const getBrandingLogoBase64 = async () => {
  try {
    const d = await getDoc(doc(db, "settings", "branding"));
    if (d.exists()) {
      const data = d.data();
      // Jeśli w bazie mamy zapisaną miniaturę Base64, zwracamy ją natychmiast bez żadnych zapytań sieciowych (0ms, 0 błędów CORS).
      if (data.companyLogoBase64 && data.companyLogoBase64.length > 100) {
        return data.companyLogoBase64;
      }
    }
  } catch (e) {
     console.error('Błąd pobierania ustawień brandingu', e);
  }
  // Zwracamy logo wbudowane w kod (z awaryjnego pliku)
  return FALLBACK_LOGO_BASE64;
};

export const getImageDimensions = (base64) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 1, height: 1 });
    img.src = base64;
  });
};
