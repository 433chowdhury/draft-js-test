export function getSelectionRange() {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return null;
  return selection.getRangeAt(0);
}

export function getCaretCoordinates() {
  const range = getSelectionRange();
  if (range) {
    const { left, top } = range.getBoundingClientRect();
    return { left, top };
  }
  return undefined;
}

export function getTriggerRange(term) {
  const range = getSelectionRange();
  const text = range?.startContainer.textContent.substring(
    0,
    range.startOffset
  );

  if (!text || /\s+$/.test(text)) return null;

  const start = text.lastIndexOf(term);
  if (start === -1) return null;

  const end = range.startOffset;
  // console.log({ start, end, text });
  return {
    end,
    start,
    text: text.substring(start),
    position: getCaretCoordinates(),
  };
}
