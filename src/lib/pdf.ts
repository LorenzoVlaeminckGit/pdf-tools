import { PDFDocument } from 'pdf-lib';

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
  orientation: Orientation
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the original PDF
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  // Create a new PDF document
  const newPdfDoc = await PDFDocument.create();

  // Get all pages from the original document
  const pages = pdfDoc.getPages();
  
  // Embed the pages into the new document
  const embeddedPages = await newPdfDoc.embedPages(pages);

  // Determine target dimensions
  let [width, height] = PAGE_SIZES[sizeKey];
  if (orientation === 'landscape') {
    [width, height] = [height, width];
  }

  // Draw each embedded page onto a new page of the target size
  embeddedPages.forEach((embeddedPage) => {
    const newPage = newPdfDoc.addPage([width, height]);
    const embWidth = embeddedPage.width;
    const embHeight = embeddedPage.height;

    // Calculate scale to fit the page while maintaining aspect ratio
    const scale = Math.min(width / embWidth, height / embHeight);

    // Center the scaled page on the new page
    newPage.drawPage(embeddedPage, {
      x: (width - embWidth * scale) / 2,
      y: (height - embHeight * scale) / 2,
      width: embWidth * scale,
      height: embHeight * scale,
    });
  });

  // Save the new PDF
  const pdfBytes = await newPdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
