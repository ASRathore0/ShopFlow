import { removeBackground } from '@imgly/background-removal';
import api from './api';

/**
 * AI Background Removal Service (Client-Side WASM, 100% Free)
 * Automatically isolates foreground products and removes backgrounds cleanly.
 *
 * @param {Blob|File|string} imageSource - Image blob, file, data URL or remote URL
 * @param {Object} options - Optional configuration (e.g. onProgress, fileName)
 * @returns {Promise<{ success: boolean, blob?: Blob, url?: string, file?: File, error?: string }>}
 */
export async function removeImageBackground(imageSource, options = {}) {
  try {
    let sourceToUse = imageSource;

    // If source is a remote URL string, fetch safe blob (via proxy if needed) to avoid CORS issues
    if (typeof imageSource === 'string' && (imageSource.startsWith('http://') || imageSource.startsWith('https://'))) {
      try {
        const resp = await fetch(imageSource, { mode: 'cors' });
        if (resp.ok) {
          sourceToUse = await resp.blob();
        } else {
          throw new Error('Direct fetch failed');
        }
      } catch (corsErr) {
        try {
          const proxyResp = await api.get('/media-proxy', {
            params: { url: imageSource },
            responseType: 'blob',
          });
          sourceToUse = proxyResp.data;
        } catch (proxyErr) {
          console.warn('Proxy fetch failed, attempting direct URL in imgly:', proxyErr);
          sourceToUse = imageSource;
        }
      }
    }

    const config = {
      output: {
        format: 'image/png',
        quality: 0.95,
      },
    };

    if (options.onProgress) {
      config.progress = (key, current, total) => {
        if (total > 0) {
          options.onProgress(Math.round((current / total) * 100), key);
        }
      };
    }

    const resultBlob = await removeBackground(sourceToUse, config);
    const resultUrl = URL.createObjectURL(resultBlob);
    const fileName = options.fileName || `bg_removed_${Date.now()}.png`;
    const resultFile = new File([resultBlob], fileName, {
      type: 'image/png',
    });

    return {
      success: true,
      blob: resultBlob,
      url: resultUrl,
      file: resultFile,
    };
  } catch (error) {
    console.error('Auto background removal failed:', error);
    return {
      success: false,
      error: error.message || 'Background removal failed',
    };
  }
}

