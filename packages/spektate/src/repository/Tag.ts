export interface ITag {
  commit: string;
  date: Date;
  tagger?: string;
  message?: string;
  name: string;
}
