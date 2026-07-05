export type TagId = string;

export type TagColor = "cyan" | "emerald" | "violet" | "amber" | "rose" | "slate";

export type Tag = {
  id: TagId;
  name: string;
  color: TagColor;
};
