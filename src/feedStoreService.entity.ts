import {Feed} from "./feed.entity";

export interface FeedForLinks {
  [url: string]: Feed;
}
