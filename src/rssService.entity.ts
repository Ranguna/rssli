import Parser from "rss-parser";

export interface RSSFeedForLinks {
  [url: string]: Parser.Output<{}>;
}
