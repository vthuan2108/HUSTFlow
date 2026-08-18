/**
 * StudocuDecoderService.ts
 * High-performance Studocu Document Decoder Service for HUSTFlow Tàng Kinh Các
 * Direct reference from studocu-web-downloader & studocu-downloader original codebase
 */

export interface DecodedDocumentResult {
  success: boolean;
  title: string;
  pageCount: number;
  pageImages: string[];
  objectKey?: string;
  pngParams?: string;
  error?: string;
  isCloudflareBlocked?: boolean;
}

/**
 * Parses a page range string like "1-5, 8, 11-15" into a 0-indexed page indices array.
 * Exact implementation from studocu-web-downloader/src/utils/studocuDecoder.ts
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || rangeStr.trim().toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const indices = new Set<number>();
  const parts = rangeStr.split(',').map(s => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = Math.max(1, parseInt(startStr, 10));
      const end = Math.min(totalPages, parseInt(endStr, 10));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        indices.add(pageNum - 1);
      }
    }
  }

  const result = Array.from(indices).sort((a, b) => a - b);
  return result.length > 0 ? result : Array.from({ length: totalPages }, (_, i) => i);
}

/**
 * Recursive JSON search for documentAccess and document fields matching Next.js structure
 */
function findNextDataFields(obj: any): { objectKey?: string; signedPng?: string; pageCount?: number; title?: string } | null {
  if (!obj || typeof obj !== 'object') return null;

  // Direct match check
  if (obj.objectKey && obj.signedQueryParams && obj.signedQueryParams.png) {
    return {
      objectKey: obj.objectKey,
      signedPng: obj.signedQueryParams.png,
      pageCount: obj.pageCount || 0,
      title: obj.name || obj.title
    };
  }

  // Recursive search over keys
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value && typeof value === 'object') {
      const res = findNextDataFields(value);
      if (res) {
        if (!res.pageCount && obj.pageCount) res.pageCount = obj.pageCount;
        if (!res.title && (obj.name || obj.title)) res.title = obj.name || obj.title;
        return res;
      }
    }
  }
  return null;
}

/**
 * Parse raw HTML or __NEXT_DATA__ JSON string directly
 */
export function parseStudocuHtmlContent(rawInput: string): DecodedDocumentResult {
  try {
    let jsonData: any = null;

    // Try parsing direct JSON
    try {
      jsonData = JSON.parse(rawInput);
    } catch (e) {
      // If not direct JSON, search for <script id="__NEXT_DATA__">
      const match = rawInput.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      if (match && match[1]) {
        try {
          jsonData = JSON.parse(match[1]);
        } catch (err) {
          return {
            success: false,
            title: '',
            pageCount: 0,
            pageImages: [],
            error: 'Dữ liệu JSON trong thẻ __NEXT_DATA__ bị lỗi định dạng.'
          };
        }
      } else {
        const genericMatch = rawInput.match(/__NEXT_DATA__\s*=\s*({[\s\S]*?});/);
        if (genericMatch && genericMatch[1]) {
          jsonData = JSON.parse(genericMatch[1]);
        } else {
          return {
            success: false,
            title: '',
            pageCount: 0,
            pageImages: [],
            error: 'Không tìm thấy thẻ __NEXT_DATA__ trong mã nguồn HTML. Hãy đảm bảo bạn đã Ctrl+U và copy đúng trang Studocu.'
          };
        }
      }
    }

    const da = jsonData.props?.pageProps?.documentAccess || findNextDataFields(jsonData);
    const doc = jsonData.props?.pageProps?.document;

    const objectKey = da?.objectKey;
    const pngParams = da?.signedQueryParams?.png || da?.signedPng;

    if (!objectKey || !pngParams) {
      return {
        success: false,
        title: '',
        pageCount: 0,
        pageImages: [],
        error: 'Tài liệu này không chứa chữ ký ảnh CDN (signedQueryParams.png) hoặc bị khóa.'
      };
    }

    const pageCount = doc?.pageCount || da?.pageCount || 10;
    const title = doc?.name || doc?.title || da?.title || 'Tài Liệu Studocu (Đã Giải Mã)';

    // Build all Hex-numbered image URLs matching doc-assets.studocu.com
    const pageImages: string[] = [];
    for (let i = 1; i <= pageCount; i++) {
      const hex = i.toString(16);
      pageImages.push(`https://doc-assets.studocu.com/${objectKey}/html/bg${hex}.png${pngParams}`);
    }

    return {
      success: true,
      title,
      pageCount,
      pageImages,
      objectKey,
      pngParams
    };
  } catch (err: any) {
    return {
      success: false,
      title: '',
      pageCount: 0,
      pageImages: [],
      error: `Lỗi đọc dữ liệu: ${err.message}`
    };
  }
}

/**
 * Decode Studocu Document via Parallel Proxy Racing
 */
export async function decodeStudocuDocument(
  url: string,
  rawSourceText?: string
): Promise<DecodedDocumentResult> {
  if (rawSourceText && rawSourceText.trim()) {
    return parseStudocuHtmlContent(rawSourceText);
  }

  if (!url || !url.trim()) {
    return {
      success: false,
      title: '',
      pageCount: 0,
      pageImages: [],
      error: 'Vui lòng nhập đường link Studocu hợp lệ.'
    };
  }

  const cleanUrl = url.trim().split('?')[0];

  // Parallel Proxy Racing across 4 CORS proxies
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`,
    `https://thingproxy.freeboard.io/fetch/${cleanUrl}`,
    `https://cors-anywhere.herokuapp.com/${cleanUrl}`
  ];

  try {
    const fetchPromises = proxies.map(async (proxyUrl) => {
      const res = await fetch(proxyUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text.includes('Just a moment') || text.includes('cf-chl-widget')) {
        throw new Error('Cloudflare CAPTCHA Challenge');
      }
      const parsed = parseStudocuHtmlContent(text);
      if (!parsed.success) throw new Error(parsed.error || 'Parsing failed');
      return parsed;
    });

    const result = await Promise.any(fetchPromises);
    return result;
  } catch (err: any) {
    return {
      success: false,
      title: '',
      pageCount: 0,
      pageImages: [],
      isCloudflareBlocked: true,
      error: 'Cloudflare hoặc Studocu đã chặn kết nối máy chủ tự động. Đạo hữu hãy dùng nút Bookmarklet 1-Click hoặc tab Dán Mã Nguồn HTML để giải mã 100%!'
    };
  }
}

/**
 * Generate Bookmarklet JavaScript code
 */
export function getBookmarkletCode(): string {
  const currentOrigin = window.location.origin;
  return `javascript:(function(){try{var el=document.querySelector('#__NEXT_DATA__');if(!el){alert('Không tìm thấy thẻ __NEXT_DATA__! Hãy F5 lại trang.');return;}var json=JSON.parse(el.textContent);var da=json.props?.pageProps?.documentAccess;var doc=json.props?.pageProps?.document;if(!da?.objectKey||!da?.signedQueryParams?.png){alert('Tài liệu này chưa có chữ ký CDN!');return;}var payload={title:doc?.name||doc?.title||document.title,pageCount:doc?.pageCount||document.querySelectorAll('.pf').length||0,objectKey:da.objectKey,pngParams:da.signedQueryParams.png};window.location.href='${currentOrigin}/?doc='+encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));}catch(e){alert('Lỗi Bookmarklet: '+e.message);}})();`;
}

/**
 * Native in-page print helper
 */
export function printDocumentAsPdf(title: string, pageImages: string[]) {
  window.print();
}
