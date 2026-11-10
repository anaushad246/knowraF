/**
 * Detects whether a string is primarily Right-to-Left (Urdu, Arabic, Persian, Hebrew)
 * @param {string} text
 * @returns {boolean}
 */
export const isRTLText = (text = "") => {
  if (!text || typeof text !== "string") return false;

  // Unicode ranges for Arabic, Urdu, Persian:
  // \u0600-\u06FF (Arabic), \u0750-\u077F (Arabic Supp), \u08A0-\u08FF (Arabic Ext-A),
  // \uFB50-\uFDFF (Presentation Forms-A), \uFE70-\uFEFF (Presentation Forms-B)
  const rtlChars = text.match(
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g
  );
  if (!rtlChars) return false;

  const totalLetters = text.replace(/[\s\d\p{P}]/gu, "").length;
  if (totalLetters === 0) return rtlChars.length > 0;

  return (rtlChars.length / totalLetters) > 0.15 || rtlChars.length >= 6;
};

export default { isRTLText };
