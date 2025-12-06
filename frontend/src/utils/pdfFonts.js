
import NotoSansWoff from 'noto-sans-devanagari/files/noto-sans-devanagari-v2-latin-regular.woff';

export const addNotoSansFont = (doc) => {
  const font = NotoSansWoff;
  doc.addFileToVFS('NotoSans.ttf', font);
  doc.addFont('NotoSans.ttf', 'NotoSans', 'normal');
  doc.addFont('NotoSans.ttf', 'NotoSans', 'bold');
};