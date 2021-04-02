import inquirer from "inquirer";
import {FeedCollection} from "./feed.entity";
import {getFeedStore, getAllCategoryNames, getAllRSSLinkForCategory, watchStore, setIntervalForStoreUpdate, getAllTitlesFromLinks} from "./feedStoreService";

watchStore();
setIntervalForStoreUpdate(1000*10);

const displayCategoryMenu = (feedItemCollection: FeedCollection) => {
  const categories = getAllCategoryNames(feedItemCollection);
  if(categories.length === 0) {
    console.log("No categories found.");
    console.log("Add more with [not implemented].");
    return;
  }

  return inquirer.prompt([{
    type: "list",
    name: "category",
    message: "Which category do you want to read about ?",
    choices: categories
  }]).then(ans => 
     inquirer.prompt([{
       type: "list",
       name: "article",
       message: "Which article do you want to read ?",
       pageSize: 100,
       choices:
         getAllTitlesFromLinks(
          getAllRSSLinkForCategory(ans.category, feedItemCollection)
         )
     }])
  );
}

displayCategoryMenu(getFeedStore().feedCollection);

