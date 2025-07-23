// src/app/pdfmake-wrapper.ts
import pdfMakeOrig from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// Inyecta el VFS directamente (pdfFonts exporta { vfs })
;(pdfMakeOrig as any).vfs = (pdfFonts as any).vfs;

export const pdfMake = pdfMakeOrig;
