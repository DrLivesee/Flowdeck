import type { Tag } from "./types";

export function selectTags(tagsById: Record<string, Tag>) {
  return Object.values(tagsById);
}
