import {FeedCollection, Feed, Store, FeedItem} from "./feed.entity";
import store from "./store.json";
import fs, {promises as fsp} from "fs";
import path from "path";
import {getRSSFeedFromLinks, getTitlesFromRssItems, mergeRSSFeedItems, sortRssItemsByDate} from "./rssService";
import {Item} from "rss-parser";
import {FeedForLinks} from "./feedStoreService.entity";

let internalFeedStore: Store = store;
let storeUpdateChain = Promise.resolve(internalFeedStore);

export const getFeedStore = () => internalFeedStore;

const storePath = path.join(__dirname, "./store.json");
const storeLockPath = path.join(__dirname, "./store.json.lock");

const addToUpdateChain = (event: (lastUpdate: typeof internalFeedStore) => typeof internalFeedStore | typeof storeUpdateChain) => (
	storeUpdateChain = storeUpdateChain.then(event).then(newStore => (internalFeedStore = newStore))
)

const mapRssItemsToFeedItem = (items: Item[]): FeedItem[] =>
	items.map(item => ({
		...item,
		dateEpoch: item.isoDate ? new Date(item.isoDate).getTime() : Date.now()
	}))

export const updateStore = () =>
	fsp.mkdir(storeLockPath)
		.then(() => (
			addToUpdateChain(() =>
				getRSSFeedFromLinks(Object.keys(internalFeedStore.feedCollection))
					.then(updatedFeeds => ({
						...internalFeedStore,
						feedCollection: Object.keys(updatedFeeds).reduce(
							(newFeedCollection, link) => ({
								...newFeedCollection,
								[link]: {
									...newFeedCollection[link],
									history: mapRssItemsToFeedItem(mergeRSSFeedItems(newFeedCollection[link].history, updatedFeeds[link].items))
								}
							}),
							internalFeedStore.feedCollection
						)
					}))
					.then(updatedStore =>
						fsp.writeFile(storePath, JSON.stringify(updatedStore, null, 2)).then(() => updatedStore)
					)
			)
		))
		.then(() => fsp.rmdir(storeLockPath))
		.catch(err => {
			if (err.code !== "EEXIST")
				throw err;
		});

export const watchStore = () =>
  fs.watchFile(
    storePath,
    () => 
			addToUpdateChain(
				() => fsp.readFile(storePath).then(contentBuffer => JSON.parse(contentBuffer.toString()) as any)
			)
	);

export const setIntervalForStoreUpdate = (interval = 1000*60*10) => updateStore().then(() => setInterval(updateStore, interval));

export const getAllCategoryNames = (feedItemCollection: FeedCollection) =>
  Array.from(new Set(
    Object.values(feedItemCollection).flatMap((item: Feed) => [
      ...item.categories
    ])
  ));

export const getAllRSSLinkForCategory = (category: string, feedItemCollection: FeedCollection) =>
  Object.entries(feedItemCollection).filter(([_, feedItem]: [string, Feed]) =>
    feedItem.categories.includes(category)
  ).map(([rssLink]) => rssLink);

const getFeedForLinks = (links: string[]) => links.reduce<FeedForLinks>((feeds, link) => ({
	...feeds,
	[link]: internalFeedStore.feedCollection[link]
}), {})

export const getAllTitlesFromLinks = (links: string[], sort = 1) =>
  getTitlesFromRssItems(
		sortRssItemsByDate(
			Object.values(getFeedForLinks(links)).flatMap(res => res.history),
			sort
		)
	);