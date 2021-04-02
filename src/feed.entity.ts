import {Item} from "rss-parser";

export interface FeedItem extends Item {
  dateEpoch: number
};

export interface Feed {
  categories: string[];
  title: string;
  history: FeedItem[];
}

export type FeedCollection = {
  [url: string]: Feed;
};

export interface Store {
  deleteItemAfterDays?: number;
  feedCollection: FeedCollection;
}
