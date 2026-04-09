import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  Letter: [612.00, 792.00],
  Legal: [612.00, 1008.00],
  A3: [841.89, 1190.55],
  A5: [419.53, 595.28],
  Tabloid: [792.00, 1224.00],
};

export type PageSize = keyof typeof PAGE_SIZES;
export type Orientation = 'portrait' | 'landscape';

export async function resizePdf(
  file: File,
  sizeKey: PageSize,
  orientation: Orientation,
  compress: boolean = false,
  quality: number = 0.7
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  
  let [width, height] = PAGE_SIZES[sizeKey];
  if (orientation === 'landscape') {
    [width, height] = [height, width];
  }

  if (compress) {
    // Rasterize the PDF using pdfjs-dist to compress it
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const newPdfDoc = await PDFDocument.create();

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      
      // Use a scale of 1.5 for a balance between quality and file size
      // Higher quality settings might benefit from a slightly higher scale
      const scale = quality > 0.8 ? 2.0 : 1.5;
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not create canvas context');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }).promise;

      // Convert canvas to JPEG (quality parameter controls compression)
      const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
      const jpegImage = await newPdfDoc.embedJpg(jpegDataUrl);

      const newPage = newPdfDoc.addPage([width, height]);
      
      // Calculate scale to fit the page while maintaining aspect ratio
      const imgScale = Math.min(width / jpegImage.width, height / jpegImage.height);

      // Center the image on the new page
      newPage.drawImage(jpegImage, {
        x: (width - jpegImage.width * imgScale) / 2,
        y: (height - jpegImage.height * imgScale) / 2,
        width: jpegImage.width * imgScale,
        height: jpegImage.height * imgScale,
      });
    }

    const pdfBytes = await newPdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } else {
    // Vector resizing (in-place)
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const { width: origWidth, height: origHeight } = page.getSize();
      const scale = Math.min(width / origWidth, height / origHeight);

      page.scaleContent(scale, scale);

      const tx = (width - origWidth * scale) / 2;
      const ty = (height - origHeight * scale) / 2;
      
      page.translateContent(tx, ty);
      page.setSize(width, height);
    });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }
}
