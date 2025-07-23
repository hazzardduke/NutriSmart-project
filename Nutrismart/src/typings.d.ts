
declare module 'pdfmake/build/pdfmake' {
  const pdfMake: any;
  export default pdfMake;
}
declare module 'pdfmake/build/vfs_fonts' {
  const pdfFonts: any;
  export default pdfFonts;
}

declare module 'file-saver' {
  export function saveAs(blob: Blob, filename: string): void;
}

declare module 'html2pdf.js' {
  const html2pdf: any;
  export default html2pdf;
}
