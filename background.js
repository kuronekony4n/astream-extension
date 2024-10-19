chrome.runtime.onInstalled.addListener(() => {

    chrome.contextMenus.create({
        id: "watchAnime",
        title: "Watch Anime: %s",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "separator1",
        type: "separator",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "animeSearch",
        title: "Search Anime: %s",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "mangaSearch",
        title: "Search Manga: %s",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "characterSearch",
        title: "Search Character: %s",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "separator-sds",
        type: "separator",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "findTrailer",
        title: "Watch Trailer: %s",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "findSynopsis",
        title: "Read Synopsis: %s",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "findOPsEDs",
        title: "Find OPs/EDs: %s",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "findStudios",
        title: "Find Studios: %s",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "separator2",
        type: "separator",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "youtubeSearch",
        title: "Search on Youtube: %s",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "mangaplusSearch",
        title: "Search on Mangaplus: %s",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "mangadexSearch",
        title: "Search on Mangadex: %s",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "animethemesSearch",
        title: "Search on AnimeThemes: %s",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "searchGoogleLens",
        title: "Search image on Google Lens",
        contexts: ["image"]
    });

    chrome.contextMenus.create({
        id: "searchYandexImages",
        title: "Search image on Yandex Images",
        contexts: ["image"]
    });

    chrome.contextMenus.create({
        id: "searchBingImages",
        title: "Search image on Bing Visual Search",
        contexts: ["image"]
    });

    chrome.contextMenus.create({
        id: "separator3",
        type: "separator",
        contexts: ["image"],
    });

    chrome.contextMenus.create({
        id: "searchSauceNAO",
        title: "Search image on SauceNAO",
        contexts: ["image"],
    });

    chrome.contextMenus.create({
        id: "searchIQDB",
        title: "Search image on IQDB",
        contexts: ["image"]
    });

    chrome.contextMenus.create({
        id: "searchTineye",
        title: "Search image on Tineye",
        contexts: ["image"]
    });

    chrome.contextMenus.create({
        id: "searchTraceMoe",
        title: "Search image on Trace (Find Episode/Anime)",
        contexts: ["image"]
    });

    chrome.contextMenus.create({
        id: "searchASCII2D",
        title: "Search image on ASCII2D",
        contexts: ["image"]
    });

});

chrome.contextMenus.onClicked.addListener((info, tab) => {

    switch (info.menuItemId) {
        case "watchThisAnime":
            chrome.action.openPopup();
            break;

        case "animeSearch":
            const animeSelectedText = info.selectionText.trim();
            chrome.storage.local.set({ animeQuery: animeSelectedText, openedByContextMenu: true }, function () {
                chrome.action.openPopup();
            });
            break;

        case "characterSearch":
            const characterSelectedText = info.selectionText.trim();
            chrome.storage.local.set({ characterQuery: characterSelectedText, openedByContextMenu: true }, function () {
                chrome.action.openPopup();
            });
            break;

        case "mangaSearch":
            const mangaSelectedText = info.selectionText.trim();
            chrome.storage.local.set({ mangaQuery: mangaSelectedText, openedByContextMenu: true }, function () {
                chrome.action.openPopup();
            });
            break;

        case "mangaplusSearch":
            const mangaplusSelectedText = info.selectionText.trim();
            const mangaplusUrl = `https://mangaplus.shueisha.co.jp/search_result?keyword=${encodeURIComponent(mangaplusSelectedText)}`;
            chrome.tabs.create({ url: mangaplusUrl });
            break;

        case "mangadexSearch":
            const mangadexSelectedText = info.selectionText.trim();
            const mangadexUrl = `https://mangadex.org/search?q=${encodeURIComponent(mangadexSelectedText)}`;
            chrome.tabs.create({ url: mangadexUrl });
            break;

        case "youtubeSearch":
            const youtubeSelectedText = info.selectionText.trim();
            const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeSelectedText)}`;
            chrome.tabs.create({ url: youtubeUrl });
            break;

        case "animethemesSearch":
            const animethemesSelectedText = info.selectionText.trim();
            const animethemesUrl = `https://animethemes.moe/search/anime?q=${encodeURIComponent(animethemesSelectedText)}`;
            chrome.tabs.create({ url: animethemesUrl });
            break;

        case "watchAnime":
            const watchAnimeSelectedText = info.selectionText.trim();
            chrome.storage.local.set({ watchAnimeQuery: watchAnimeSelectedText, openedByContextMenu: true }, function () {
                chrome.action.openPopup();
            });
            break;

        case "findTrailer":
            const findTrailerSelectedText = info.selectionText.trim();
            chrome.storage.local.set({ findTrailerQuery: findTrailerSelectedText, openedByContextMenu: true }, function () {
                chrome.action.openPopup();
            });
            break;

        case "findSynopsis":
            const findSynopsisSelectedText = info.selectionText.trim();
            chrome.storage.local.set({ findSynopsisQuery: findSynopsisSelectedText, openedByContextMenu: true }, function () {
                chrome.action.openPopup();
            });
            break;

        case "findOPsEDs":
            const findOPsEDsSelectedText = info.selectionText.trim();
            chrome.storage.local.set({ findOPsEDsQuery: findOPsEDsSelectedText, openedByContextMenu: true }, function () {
                chrome.action.openPopup();
            });
            break;

        case "findStudios":
            const findStudiosSelectedText = info.selectionText.trim();
            chrome.storage.local.set({ findStudiosQuery: findStudiosSelectedText, openedByContextMenu: true }, function () {
                chrome.action.openPopup();
            });
            break;
    }

    const imgURL = info.srcUrl;
    if (imgURL) {
        let searchUrl = '';

        switch (info.menuItemId) {
            case "searchSauceNAO":
                searchUrl = `https://saucenao.com/search.php?db=999&url=${encodeURIComponent(imgURL)}`;
                break;
            case "searchBingImages":
                searchUrl = `https://www.bing.com/images/search?view=detailv2&form=PRMSID&iss=sbi&q=imgurl:${encodeURIComponent(imgURL)}`;
                break;
            case "searchGoogleLens":
                searchUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imgURL)}`;
                break;
            case "searchYandexImages":
                searchUrl = `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(imgURL)}`;
                break;
            case "searchIQDB":
                searchUrl = `https://iqdb.org/?url=${encodeURIComponent(imgURL)}`;
                break;
            case "searchTineye":
                searchUrl = `https://www.tineye.com/search/?url=${encodeURIComponent(imgURL)}`;
                break;
            case "searchTraceMoe":
                searchUrl = `https://trace.moe/?auto&url=${encodeURIComponent(imgURL)}`;
                break;
            case "searchASCII2D":
                searchUrl = `https://ascii2d.net/search/url/${encodeURIComponent(imgURL)}`;
                break;
            default:
                console.error('Unknown menu item clicked.');
                return;
        }

        chrome.tabs.create({ url: searchUrl });
    }
});

// ======================================================================================================================
// Function to load supported sites from a local JSON file
function loadSupportedSites(callback) {
    fetch(chrome.runtime.getURL('data/supportedsites.json'))
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => console.error("Failed to load supported sites:", error));
}

// Function to check if the current URL matches any supported site's startURL
function checkSupportedWebsite(tabId, tabURL, supportedSites) {
    // Loop through each supported site and check if the URL starts with the startURL
    const isSupported = supportedSites.some((site) => tabURL.startsWith(site.startURL));

    if (isSupported) {
        chrome.action.setIcon({ path: "/media/icon16-active.png", tabId: tabId });
    } else {
        chrome.action.setIcon({ path: "/media/icon16.png", tabId: tabId });
    }
}

// Event listener for when a tab is updated (like navigating to a new URL)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Load the supported sites and check the current tab's URL
        loadSupportedSites((supportedSites) => {
            checkSupportedWebsite(tabId, tab.url, supportedSites);
            updateWatchThisAnimeMenu(tabId, tab.url, supportedSites);
        });
    }
});

// Event listener for when a tab is activated (switching between tabs)
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        if (tab.url) {
            // Load the supported sites and check the current tab's URL
            loadSupportedSites((supportedSites) => {
                checkSupportedWebsite(activeInfo.tabId, tab.url, supportedSites);
                updateWatchThisAnimeMenu(activeInfo.tabId, tab.url, supportedSites);
            });
        }
    });
});


// Function to update the "Watch this anime" context menu based on the current tab's URL
function updateWatchThisAnimeMenu(tabId, tabURL, supportedSites) {
    const isSupported = supportedSites.some((site) => tabURL.startsWith(site.startURL));

    if (isSupported) {
        chrome.contextMenus.create({
            id: "watchThisAnime",
            title: "Watch this Anime",
            contexts: ["page"],
        });
    } else {
        chrome.contextMenus.remove("watchThisAnime", () => {
            if (chrome.runtime.lastError) {
                console.log("No 'watchThisAnime' menu to remove.");
            }
        });
    }
}
