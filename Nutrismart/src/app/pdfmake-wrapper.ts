
import pdfMakeOrig from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';


;(pdfMakeOrig as any).vfs = (pdfFonts as any).vfs;

export const pdfMake = pdfMakeOrig;
