import { Injectable } from '@angular/core';
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFEmbeddedPage } from 'pdf-lib';
import { pdfMake } from '../pdfmake-wrapper';

@Injectable({ providedIn: 'root' })
export class PdfMergeService {
  async fillAndInsertTable(
    templatePath: string,
    name: string,
    date: string,
    tableDocDef: any,
    outputName: string
  ): Promise<void> {
    const templateBytes = await fetch(templatePath).then(r => r.arrayBuffer());
    const pdfDoc = await PDFDocument.load(templateBytes);

    const page0 = pdfDoc.getPage(0);
    const { width: pgW, height: pgH } = page0.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fldW     = 355.3043;
    const fldH     = 38.0002;
    const baseX    = 366.7712;
    const nameY_ai = 623.3476;
    const dateY_ai = 689.0911;
    const xOffset  = -150;
    const yOffset  = 35;
    const nameX    = baseX + xOffset;
    const dateX    = baseX + xOffset;
    const nameY    = pgH - nameY_ai - fldH + yOffset;
    const dateY    = pgH - dateY_ai - fldH + yOffset;

    page0.drawText(name, { x: nameX, y: nameY, size: 16, font, color: rgb(0,0,0), maxWidth: fldW });
    page0.drawText(date, { x: dateX, y: dateY, size: 16, font, color: rgb(0,0,0), maxWidth: fldW });

    const tableBuffer: ArrayBuffer = await new Promise(res =>
      pdfMake.createPdf(tableDocDef).getBuffer((u8: Uint8Array) => res(u8.buffer))
    );
    const tableDoc = await PDFDocument.load(tableBuffer);
    const [copiedPage]: PDFPage[] = await pdfDoc.copyPages(tableDoc, [0]);
    const embeddedPage: PDFEmbeddedPage = await pdfDoc.embedPage(copiedPage);

    const page1 = pdfDoc.getPage(1);
    const halfHeight = pgH / 2;

    const targetWidth  = pgW * 0.8;
    const aspectRatio  = embeddedPage.height / embeddedPage.width;
    const targetHeight = targetWidth * aspectRatio;
    const xPos = (pgW - targetWidth) / 2;
    const yCenter = (halfHeight - targetHeight) / 2;
    const yOffsetTable = -150; 

    page1.drawPage(embeddedPage, {
      x: xPos,
      y: yCenter + yOffsetTable,
      width: targetWidth,
      height: targetHeight
    });

    const mergedBytes = await pdfDoc.save();
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = outputName;
    link.click();
  }
}
