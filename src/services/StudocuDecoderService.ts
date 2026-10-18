/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Studocu Document Decoder & PDF Helper
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

  if (obj.objectKey && obj.signedQueryParams && obj.signedQueryParams.png) {
    return {
      objectKey: obj.objectKey,
      signedPng: obj.signedQueryParams.png,
      pageCount: obj.pageCount || 0,
      title: obj.name || obj.title
    };
  }

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

    try {
      jsonData = JSON.parse(rawInput);
    } catch (e) {
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
            error: 'Không tìm thấy dữ liệu tài liệu trong mã nguồn. Hãy kiểm tra lại link Studocu.'
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
        error: 'Tài liệu này không chứa chữ ký CDN hoặc là tài liệu hạn chế quyền truy cập.'
      };
    }

    const pageCount = doc?.pageCount || da?.pageCount || 10;
    const title = doc?.name || doc?.title || da?.title || 'Tài liệu Studocu';

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
 * Decode Studocu Document via Extension Bridge or Proxies
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

  // Try decoding via Extension Bridge if available
  const hasExtension = 
    (typeof window !== 'undefined' && (window as any).HUSTFLOW_STUDOCU_EXTENSION_INSTALLED) ||
    document.documentElement.dataset.tlkExtensionInstalled === 'true' ||
    document.documentElement.getAttribute('data-hustflow-extension') === 'installed';

  if (hasExtension) {
    try {
      const extResult = await new Promise<DecodedDocumentResult>((resolve, reject) => {
        const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        const timeout = setTimeout(() => {
          window.removeEventListener('message', listener);
          reject(new Error('Extension response timed out'));
        }, 15000);

        function listener(event: MessageEvent) {
          if (event.source !== window || !event.data) return;
          if (event.data.type === 'HUSTFLOW_STUDOCU_DECODE_RESPONSE' && event.data.requestId === requestId) {
            clearTimeout(timeout);
            window.removeEventListener('message', listener);
            if (event.data.success && event.data.htmlText) {
              resolve(parseStudocuHtmlContent(event.data.htmlText));
            } else {
              reject(new Error(event.data.error || 'Extension decoding failed'));
            }
          }
        }

        window.addEventListener('message', listener);
        window.postMessage({
          type: 'HUSTFLOW_STUDOCU_DECODE_REQUEST',
          requestId,
          url: cleanUrl
        }, '*');
      });

      if (extResult && extResult.success) {
        return extResult;
      }
    } catch (e) {
      console.warn('Extension bridge fetch failed, falling back to proxies:', e);
    }
  }

  // Fallback: Parallel proxy racing
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`,
    `https://thingproxy.freeboard.io/fetch/${cleanUrl}`
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
        throw new Error('Cloudflare Challenge');
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
      error: 'Không thể giải mã tự động qua mạng ngoài. Hãy cài đặt Extension hoặc dán mã nguồn HTML để giải mã 100%!'
    };
  }
}

/**
 * Open print view for the decoded images
 */
export function printImagesAsDocument(title: string, imageUrls: string[]) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Trình duyệt đã chặn cửa sổ pop-up. Vui lòng cho phép pop-up để in / tải file PDF!');
    return;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title || 'Studocu Document'}</title>
  <style>
    @page {
      margin: 0;
      size: auto;
    }
    body {
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .page-container {
      page-break-after: always;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }
    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      display: block;
    }
    @media screen {
      body {
        background: #f1f5f9;
        padding: 20px 0;
      }
      .page-container {
        margin: 0 auto 20px auto;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        background: #fff;
        height: auto;
      }
      .print-bar {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2E6930;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-family: sans-serif;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(46,105,48,0.3);
      }
    }
  </style>
</head>
<body>
  ${imageUrls.map((img, i) => `
    <div class="page-container">
      <img src="${img}" alt="Trang ${i + 1}" loading="eager" />
    </div>
  `).join('')}
  <div class="print-bar" onclick="window.print()">🖨️ In / Lưu PDF</div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 800);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
