export function needsMarqueeLoop(
  contentWidth: number,
  containerWidth: number,
  reduceMotion = false
): boolean {
  if (reduceMotion || containerWidth <= 0 || contentWidth <= 0) {
    return false;
  }

  return contentWidth > containerWidth;
}
