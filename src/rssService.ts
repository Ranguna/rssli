import Parser, {Item} from "rss-parser";
import {RSSFeedForLinks} from "./rssService.entity";
import {FeedItem} from "./feed.entity";
export const parser = new Parser();

export const getTitlesFromRssItems = (rssItems: any[]) => rssItems.map((item: any) => item.title);

export const sortRssItemsByDate = (rssItems: Item[], direction = 1): FeedItem[] =>
  rssItems.map(item => ({
  ...item,
  dateEpoch: item.isoDate ? new Date(item.isoDate).getTime() : Date.now()
})).sort(
  (itemA, itemB) => -1 * direction * itemA.dateEpoch + direction * itemB.dateEpoch
);

export const getRSSFeedFromLinks = (links: string[]) =>
  Promise.all(
    links.map(link => parser.parseURL(link))
  ).then(rssFeeds =>
      links.reduce<RSSFeedForLinks>((itemsForLink, link, index) => ({
        ...itemsForLink,
        [link]: rssFeeds[index]
      }), {})
  );

export const mergeRSSFeedItems = (itemsA: Item[], itemsB: Item[]) => 
  Object.values(
    [...itemsA, ...itemsB].reduce((mergedItems, item) => ({
      ...mergedItems,
      [(item as any).id ?? item.guid]: item
    }), {})
  );
