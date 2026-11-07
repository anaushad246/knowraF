/**
 * Converts verbose citation references ([Page #1, Chunk #2], [Page #1], [Source 1], [1])
 * into unified markdown links [1](citation:1) for inline rendering.
 *
 * @param {string} text - Raw message content from AI
 * @param {Array<Object>} sources - Array of source chunks returned by backend
 * @returns {string} - Transformed markdown with compact citation links
 */
export function parseInlineCitations(text, sources = []) {
  if (!text || typeof text !== "string") return "";

  // 1. Replace [Page #X, Chunk #Y] or [Page #X]
  let result = text.replace(
    /\[Page\s*#?(\d+)(?:,\s*Chunk\s*#?(\d+))?\]/gi,
    (match, pageStr, chunkStr) => {
      const page = parseInt(pageStr, 10);
      const chunk = chunkStr ? parseInt(chunkStr, 10) : null;

      let matchIdx = sources.findIndex((s) => {
        if (chunk !== null) {
          return s.pageNumber === page && s.chunkIndex === chunk;
        }
        return s.pageNumber === page;
      });

      const num = matchIdx !== -1 ? matchIdx + 1 : 1;
      return `[${num}](citation:${num})`;
    }
  );

  // 2. Replace [Source X] or [Source #X]
  result = result.replace(/\[Source\s*#?(\d+)\]/gi, (match, numStr) => {
    const num = parseInt(numStr, 10);
    return `[${num}](citation:${num})`;
  });

  // 3. Replace standalone [1], [2] when within sources length
  result = result.replace(/(?<=[^\(]|^)\[(\d+)\](?!\()/g, (match, numStr) => {
    const num = parseInt(numStr, 10);
    if (num >= 1 && num <= sources.length) {
      return `[${num}](citation:${num})`;
    }
    return match;
  });

  return result;
}

