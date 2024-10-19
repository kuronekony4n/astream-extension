// Declare global variables
let supportedSite;
let animeSite_ID;
let url_animeTitle;
let title_animeTitle;
let siteName;
let siteURL;
let browseURL;

async function checkForUpdates() {
    try {
        const response = await fetch('https://astream-ext.pages.dev/data/update-check.json');
        const data = await response.json();
        const currentVersion = "1.0.0"; 

        if (data.new_version !== currentVersion) {
            const updateMessage = document.createElement('div');
            updateMessage.className = "updateMessage";
            updateMessage.id = "updateMessage";
            updateMessage.innerHTML = `
                <p>Update Available: ${data.message}</p>
            `;
            document.body.insertBefore(updateMessage, document.body.firstChild);

            document.getElementById('updateMessage').addEventListener('click', function () {
                window.open(data.update_url, '_blank');
            });
        } else {
            console.log('No updates available.');
        }
    } catch (error) {
        console.error('Error checking for updates:', error);
    }
}

checkForUpdates();

// Function to get the current URL and check if it's supported
function getCurrentURL(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let currentUrl = tabs[0].url;
        callback(currentUrl);
    });
}

// Function to remove text within parentheses from a string
function removeTextInParentheses(str) {
    return str.replace(/\s*\(.*?\)\s*/g, '').trim();
}

// Event listener for when the popup loads
document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.local.get([
        'animeQuery', 'watchAnimeQuery', 'characterQuery', 'mangaQuery',
        'findTrailerQuery', 'findSynopsisQuery', 'findOPsEDsQuery', 'findStudiosQuery', 'openedByContextMenu'
    ], function (result) {
        if (result.openedByContextMenu) {
            handleContextMenuQueries(result);
        } else {
            getCurrentURL(isSupportedSite);
        }

        // Clear the flag and stored queries after use
        chrome.storage.local.remove([
            'animeQuery', 'watchAnimeQuery', 'characterQuery', 'mangaQuery',
            'findTrailerQuery', 'findSynopsisQuery', 'findOPsEDsQuery', 'findStudiosQuery', 'openedByContextMenu'
        ]);
    });

    setupRecentButton();
    setupOptionSaving();
});

// Function to handle queries from the context menu
function handleContextMenuQueries(result) {
    const queryTypes = [
        { key: 'animeQuery', type: 'anime', contextMenu: true },
        { key: 'watchAnimeQuery', type: 'anime', contextMenu: false },
        { key: 'characterQuery', type: 'character', contextMenu: true },
        { key: 'mangaQuery', type: 'manga', contextMenu: true },
        { key: 'findTrailerQuery', type: 'trailer', contextMenu: true },
        { key: 'findSynopsisQuery', type: 'synopsis', contextMenu: true },
        { key: 'findOPsEDsQuery', type: 'opseds', contextMenu: true },
        { key: 'findStudiosQuery', type: 'studios', contextMenu: true }
    ];

    for (const { key, type, contextMenu } of queryTypes) {
        if (result[key]) {
            showLoading(`Searching for: ${result[key]}`);
            searchJikanAPI(result[key], type, contextMenu);
            break;
        }
    }
}

// Function to set up the recent button
function setupRecentButton() {
    const recentButton = document.getElementById('recentBtn');
    recentButton.addEventListener('click', fetchRecentEpisodes);
}

// Function to set up option saving logic
function setupOptionSaving() {
    const endpointSelect = document.getElementById('endpointSelect');
    endpointSelect.value = localStorage.getItem('endpoint') || 'https://no-drab.vercel.app';

    endpointSelect.addEventListener('change', function () {
        localStorage.setItem('endpoint', endpointSelect.value);
    });
}

// Function to update the HTML content directly
function updatePopup(supportedSite, animeSite_ID, url_animeTitle, title_animeTitle, siteName, siteURL, browseURL) {
    console.log("supportedSite: " + supportedSite);
    console.log("animeSite_ID: " + animeSite_ID);
    console.log("url_animeTitle: " + url_animeTitle);
    console.log("title_animeTitle: " + title_animeTitle);
    console.log("siteName: " + siteName);
    console.log("siteURL: " + siteURL);
    console.log("browseURL: " + browseURL);

    // Ensure title_animeTitle is a valid string before processing
    title_animeTitle = title_animeTitle ? removeTextInParentheses(title_animeTitle) : '';

    if (supportedSite) {
        searchAnimeVariations(title_animeTitle);
    } else {
        showUnsupportedSiteMessage();
    }
}

// Function to search for anime using title variations
function searchAnimeVariations(title_animeTitle) {
    const endpoint = document.getElementById('endpointSelect').value;
    const variations = [
        title_animeTitle,
        title_animeTitle.replace(/_/g, ' '),
        title_animeTitle.split(' ').slice(0, 3).join(' '),
        title_animeTitle.split(' ').slice(0, 2).join(' '),
        title_animeTitle.split(' ').slice(0, 1).join(' ')
    ];

    let foundResults = false;

    const tryFetch = (variationIndex = 0) => {
        if (variationIndex >= variations.length) {
            console.log("No results found after trying all variations.");
            hideLoading();
            showError("No results found for any title variation.");
            return;
        }

        const currentTitle = variations[variationIndex];
        showLoading(`Searching for: ${currentTitle}...`);
        fetch(`${endpoint}/anime/gogoanime/${currentTitle}`)
            .then(response => response.json())
            .then(data => {
                hideLoading();
                if (data.results && data.results.length > 0) {
                    displayResults(data.results);
                    foundResults = true;
                } else {
                    console.log(`No results found for variation: ${currentTitle}`);
                    tryFetch(variationIndex + 1);
                }
            })
            .catch(error => {
                hideLoading();
                console.error('Error fetching anime data:', error);
                showError('Error fetching anime data. Please try again.');
                tryFetch(variationIndex + 1);
            });
    };

    tryFetch();
}

// Function to show a message for unsupported sites
function showUnsupportedSiteMessage() {
    showText("This page does not contain an anime that Astream can detect. Astream only supports anime detail pages from the following sites.");
    fetch('/data/supportedsites.json')
        .then(response => response.json())
        .then(supportedSites => {
            const content = document.getElementById('content');

            let selectElement = document.createElement('select');
            selectElement.id = "unsupportedSitesSelect";

            supportedSites.forEach(site => {
                let option = document.createElement('option');
                option.value = site.browseURL;
                option.textContent = site.siteURL;
                selectElement.appendChild(option);
            });

            content.appendChild(selectElement);

            let browseButton = document.createElement('button');
            browseButton.textContent = "Browse";
            content.appendChild(browseButton);

            let randomButton = document.createElement('button');
            randomButton.textContent = "Random Anime";
            content.appendChild(randomButton);

            browseButton.addEventListener('click', function () {
                const selectedBrowseURL = selectElement.value;
                window.open(selectedBrowseURL, '_blank');
            });

            randomButton.addEventListener('click', function () {
                const endpoint = document.getElementById('endpointSelect').value;
                showLoading('Searching for a random anime...');
                fetch(`https://api.jikan.moe/v4/random/anime`)
                    .then(response => response.json())
                    .then(data => {
                        hideLoading();
                        const animeUrl = data.data.url;
                        if (animeUrl) {
                            window.open(animeUrl, '_blank');
                        } else {
                            showError('No URL found for the random anime.');
                        }
                    })
                    .catch(error => {
                        hideLoading();
                        console.error('Error fetching random anime:', error);
                        showError('Error fetching random anime. Please try again.');
                    });
            });
        })
        .catch(error => {
            console.error('Error loading supported sites:', error);
            showError('Error loading supported sites. Please try again.');
        });
}

// Function to check if the current page is a supported site and extract details
function isSupportedSite(currentUrl) {
    fetch('./data/supportedsites.json')
        .then(response => response.json())
        .then(supportedSites => {
            let siteMatched = false;

            for (let site of supportedSites) {
                if (currentUrl.startsWith(site.startURL)) {
                    siteMatched = true;
                    siteName = site.siteName;
                    siteURL = site.siteURL;
                    browseURL = site.browseURL;

                    extractSiteDetails(site, currentUrl);

                    // Fetch the page title
                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        let pageTitle = tabs[0].title;

                        // Clean the title based on titleDeletePart
                        if (site.titleDeletePart) {
                            if (site.titleDeletePart.front && pageTitle.startsWith(site.titleDeletePart.front)) {
                                pageTitle = pageTitle.replace(site.titleDeletePart.front, '');
                            }
                            if (site.titleDeletePart.back && pageTitle.endsWith(site.titleDeletePart.back)) {
                                pageTitle = pageTitle.replace(site.titleDeletePart.back, '');
                            }
                        }

                        // Trim the cleaned title
                        title_animeTitle = pageTitle.trim();

                        // Update the popup with the extracted data
                        updatePopup(siteMatched, animeSite_ID, url_animeTitle, title_animeTitle, siteName, siteURL, browseURL);
                    });

                    return; // Stop the loop once a match is found
                }
            }

            // If no match is found, update the popup with unsupported status
            if (!siteMatched) {
                updatePopup(false, null, null, null, null, null, null);
            }
        })
        .catch(error => console.error('Error loading supported sites:', error));
}

// Function to extract site-specific details from the URL
function extractSiteDetails(site, currentUrl) {
    let parts = currentUrl.replace(site.startURL, '').split('/');
    switch (site.siteName) {
        case "myanimelist":
        case "anilist":
        case "crunchyroll":
        case "retrocrush":
            animeSite_ID = parts[0];
            url_animeTitle = parts[1];
            break;
        case "thetvdb":
        case "anime-planet":
        case "hulu":
        case "animeschedule":
            url_animeTitle = parts[0];
            break;
        case "anidb":
        case "amazon":
        case "imdb":
            animeSite_ID = parts[0];
            break;
        case "kitsu":
            url_animeTitle = parts[0];
            break;
        case "shikimori":
            parts = currentUrl.replace(site.startURL, '').split('-');
            animeSite_ID = parts[0];
            url_animeTitle = parts.slice(1).join('-').replace(',', '-');
            break;
        case "netflix":
            animeSite_ID = parts.pop();
            break;
        case "anibrain":
            animeSite_ID = parts[0].replace("#recs", "");
            break;
    }
}

// Function to display the search results
function displayResults(results) {
    const content = document.getElementById('content');
    content.innerHTML = ''; // Clear existing content

    let selectElement = document.createElement('select');
    selectElement.id = "searchResultsSelect";

    results.forEach(result => {
        let option = document.createElement('option');
        option.value = result.id;
        option.textContent = result.subOrDub === "sub" ? `${result.title} (SUB)` : `${result.title.replace("Dub", "DUB")}`;
        selectElement.appendChild(option);
    });

    content.appendChild(selectElement);

    let searchAnimeButton = document.createElement('button');
    searchAnimeButton.textContent = "Select Anime";
    content.appendChild(searchAnimeButton);

    searchAnimeButton.addEventListener('click', function () {
        const selectedAnimeId = selectElement.value;
        const selectedAnimeTitle = selectElement.options[selectElement.selectedIndex].textContent;
        const endpoint = document.getElementById('endpointSelect').value;
        showLoading('Fetching episodes...');
        fetch(`${endpoint}/anime/gogoanime/info/${selectedAnimeId}`)
            .then(response => response.json())
            .then(data => {
                hideLoading();
                if (data.episodes && data.episodes.length > 0) {
                    displayEpisodes(data.episodes, selectedAnimeTitle, data.image);
                } else {
                    showError('No episodes found.');
                }
            })
            .catch(error => {
                hideLoading();
                console.error('Error fetching episodes:', error);
                showError('Error fetching episodes. Please try again.');
            });
    });

    let wrongButton = document.createElement('button');
    wrongButton.textContent = "Can't find it?";
    content.appendChild(wrongButton);

    wrongButton.addEventListener('click', function () {
        showLoading('Searching for alternatives...');
        searchJikanAPI(title_animeTitle, "anime", false);
    });
}

// Function to search the Jikan API for anime, manga, or characters
function searchJikanAPI(query, type, contextMenu) {
    const endpoints = {
        "character": `https://api.jikan.moe/v4/characters?q=${query}&limit=10`,
        "manga": `https://api.jikan.moe/v4/manga?q=${query}&limit=10`,
        "trailer": `https://api.jikan.moe/v4/anime?q=${query}&limit=10`,
        "synopsis": `https://api.jikan.moe/v4/anime?q=${query}&limit=10`,
        "opseds": `https://api.jikan.moe/v4/anime?q=${query}&limit=10`,
        "studios": `https://api.jikan.moe/v4/anime?q=${query}&limit=10`,
        "anime": `https://api.jikan.moe/v4/anime?q=${query}&limit=10`
    };

    const endpoint = endpoints[type] || endpoints["anime"];

    fetch(endpoint)
        .then(response => response.json())
        .then(data => {
            hideLoading();
            const content = document.getElementById('content');
            content.innerHTML = ''; // Clear existing content

            if (data.data.length === 0) {
                showError('No results found. Please try a different search term.');
                return;
            }

            createSlider(data.data, type, contextMenu);
        })
        .catch(error => {
            hideLoading();
            console.error('Error fetching alternative anime:', error);
            showError('Error fetching alternative anime. Please try again.');
        });
}

// Function to create a slider for displaying search results
function createSlider(data, type, contextMenu) {
    const content = document.getElementById('content');
    let sliderDiv = document.createElement('div');
    sliderDiv.className = 'slider';
    sliderDiv.id = 'slider';

    data.forEach(item => {
        let slideDiv = document.createElement('div');
        slideDiv.className = 'slide';

        let imgElement = document.createElement('img');
        imgElement.src = item.images.jpg.image_url;
        imgElement.alt = type === "anime" ? item.title : type === "character" ? item.name : item.title;
        imgElement.style.cursor = 'pointer';

        let titleElement = document.createElement('p');
        titleElement.textContent = type === "anime" ? item.title : type === "character" ? item.name : item.title;

        slideDiv.appendChild(imgElement);
        slideDiv.appendChild(titleElement);
        sliderDiv.appendChild(slideDiv);

        slideDiv.addEventListener('click', function () {
            handleSlideClick(item, type, contextMenu);
        });
    });

    content.appendChild(sliderDiv);
    setupSliderNavigation();
}

// Function to handle click events on slider items
function handleSlideClick(item, type, contextMenu) {
    const titlesToTry = type === "anime"
        ? [item.title_japanese, item.title, item.title_english].filter(title => title)
        : type === "character"
            ? [item.name]
            : [item.title];

    let currentTitleIndex = 0;

    function tryFetchTitle() {
        const endpoint = document.getElementById('endpointSelect').value;

        if (currentTitleIndex >= titlesToTry.length) {
            showError('No results found for any title variation.');
            return;
        }

        const currentTitle = titlesToTry[currentTitleIndex];
        showLoading(`Searching for: ${currentTitle}...`);

        fetch(`${endpoint}/anime/gogoanime/${currentTitle}`)
            .then(response => response.json())
            .then(data => {
                hideLoading();
                if (data.results && data.results.length > 0) {
                    displayResults(data.results);
                } else {
                    console.log(`No results found for variation: ${currentTitle}`);
                    currentTitleIndex++;
                    tryFetchTitle();
                }
            })
            .catch(error => {
                hideLoading();
                console.error('Error fetching anime data:', error);
                showError('Error fetching anime data. Please try again.');
                currentTitleIndex++;
                tryFetchTitle();
            });
    }

    if (contextMenu) {
        openContextMenuLinks(item, type);
    } else {
        tryFetchTitle();
    }
}

// Function to open links from the context menu
function openContextMenuLinks(item, type) {
    const links = {
        "anime": `https://myanimelist.net/anime/${item.mal_id}`,
        "character": `https://myanimelist.net/character/${item.mal_id}`,
        "manga": `https://myanimelist.net/manga/${item.mal_id}`
    };

    if (type in links) {
        window.open(links[type], '_blank');
    } else if (type === "trailer") {
        fetchTrailer(item.mal_id);
    } else if (type === "synopsis") {
        fetchSynopsis(item.mal_id);
    } else if (type === "opseds") {
        fetchOpsEds(item.mal_id);
    } else if (type === "studios") {
        fetchStudios(item.mal_id);
    }
}

// Function to fetch and display trailer
function fetchTrailer(mal_id) {
    showLoading("Loading trailer..");
    fetch(`https://api.jikan.moe/v4/anime/${mal_id}/full`)
        .then(response => response.json())
        .then(fullData => {
            const trailerUrl = fullData.data.trailer.url;
            if (trailerUrl) {
                window.open(trailerUrl, '_blank');
            } else {
                hideLoading();
                showError('Trailer not available.');
            }
        });
}

// Function to fetch and display synopsis
function fetchSynopsis(mal_id) {
    showLoading("Loading synopsis..");
    fetch(`https://api.jikan.moe/v4/anime/${mal_id}/full`)
        .then(response => response.json())
        .then(fullData => {
            const synopsis = "<h3>" + fullData.data.title + "</h3>" + fullData.data.synopsis + "<br><br>" + fullData.data.background;
            if (synopsis) {
                hideLoading();
                showSynopsis(synopsis);
            } else {
                hideLoading();
                showError('No synopsis found.');
            }
        });
}

// Function to fetch and display OPs/EDs
function fetchOpsEds(mal_id) {
    showLoading("Loading OPs/EDs..");
    fetch(`https://api.jikan.moe/v4/anime/${mal_id}/full`)
        .then(response => response.json())
        .then(fullData => {
            const theme = fullData.data.theme;
            const openings = theme.openings;
            const endings = theme.endings;

            if ((openings && openings.length > 0) || (endings && endings.length > 0)) {
                hideLoading();
                displayOpsEds(openings, endings);
            } else {
                hideLoading();
                showError('No OPs/EDs found.');
            }
        });
}

// Function to display OPs/EDs and provide search options
function displayOpsEds(openings, endings) {
    const content = document.getElementById('content');
    const selectElement = document.createElement('select');
    selectElement.id = "themeSelect";

    openings.forEach((opening, index) => {
        const option = document.createElement('option');
        option.value = removeTextInParentheses(opening).replace(/^\d+:\s*/, '');
        option.textContent = `Opening ${opening}`;
        selectElement.appendChild(option);
    });

    endings.forEach((ending, index) => {
        const option = document.createElement('option');
        option.value = removeTextInParentheses(ending).replace(/^\d+:\s*/, '');
        option.textContent = `Ending ${ending}`;
        selectElement.appendChild(option);
    });

    content.appendChild(selectElement);

    const searchYoutubeButton = document.createElement('button');
    searchYoutubeButton.textContent = "Search on YouTube";
    content.appendChild(searchYoutubeButton);

    const searchSpotifyButton = document.createElement('button');
    searchSpotifyButton.textContent = "Search on Spotify";
    content.appendChild(searchSpotifyButton);

    searchYoutubeButton.addEventListener('click', function () {
        const selectedValue = selectElement.value;
        const query = encodeURIComponent(selectedValue);
        window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
    });

    searchSpotifyButton.addEventListener('click', function () {
        const selectedValue = selectElement.value;
        const query = encodeURIComponent(selectedValue);
        window.open(`https://open.spotify.com/search/${query}`, '_blank');
    });
}

// Function to fetch and display studios
function fetchStudios(mal_id) {
    showLoading("Loading studios..");
    fetch(`https://api.jikan.moe/v4/anime/${mal_id}/full`)
        .then(response => response.json())
        .then(fullData => {
            const studios = fullData.data.studios;
            if (studios && studios.length > 0) {
                hideLoading();
                studios.forEach(studio => {
                    window.open(studio.url, '_blank');
                });
            } else {
                hideLoading();
                showError('No studios found.');
            }
        });
}

// Function to set up slider navigation buttons
function setupSliderNavigation() {
    const content = document.getElementById('content');
    let prevButton = document.createElement('button');
    prevButton.className = 'slider-btn slider-btn-left';
    prevButton.id = 'prevBtn';
    prevButton.innerHTML = '&#10094;';
    content.appendChild(prevButton);

    let nextButton = document.createElement('button');
    nextButton.className = 'slider-btn slider-btn-right';
    nextButton.id = 'nextBtn';
    nextButton.innerHTML = '&#10095;';
    content.appendChild(nextButton);

    const slider = document.getElementById('slider');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    let currentIndex = 0;
    const totalSlides = slider.children.length;

    function updateSlider() {
        slider.style.transform = `translateX(-${currentIndex * 200}px)`;
        updateButtonVisibility();
    }

    function updateButtonVisibility() {
        prevBtn.style.display = currentIndex === 0 ? 'none' : 'flex';
        nextBtn.style.display = currentIndex === totalSlides - 1 ? 'none' : 'flex';
    }

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateSlider();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentIndex < totalSlides - 1) {
            currentIndex++;
            updateSlider();
        }
    });

    updateButtonVisibility();
}

// Function to display the episodes
function displayEpisodes(episodes, selectedAnimeTitle, episodePoster) {
    const content = document.getElementById('content');
    content.innerHTML = ''; // Clear existing content

    showText(selectedAnimeTitle, false);

    let selectElement = document.createElement('select');
    selectElement.id = "episodeSelect";

    episodes.forEach(episode => {
        let option = document.createElement('option');
        option.value = episode.id;
        option.textContent = `Episode ${episode.number}`;
        selectElement.appendChild(option);
    });

    content.appendChild(selectElement);

    let watchButton = document.createElement('button');
    watchButton.textContent = "Watch";
    watchButton.className = "animated-gradient-button";
    content.appendChild(watchButton);

    let downloadButton = document.createElement('button');
    downloadButton.textContent = "Download";
    content.appendChild(downloadButton);

    watchButton.addEventListener('click', function () {
        const selectedEpisode = `${selectedAnimeTitle} ${selectElement.options[selectElement.selectedIndex].textContent}`;
        showLoading('Fetching stream URL...', false);
        fetchEpisodeStream(selectElement.value, selectedEpisode, episodePoster);
    });

    downloadButton.addEventListener('click', function () {
        fetchDownloadUrl(selectElement.value);
    });
}

// Function to fetch and display the stream URL for an episode
function fetchEpisodeStream(selectedEpisodeId, selectedAnimeTitle, episodePoster, fromRecentEpisodes) {
    const endpoint = document.getElementById('endpointSelect').value;

    const selectedEpisode = `${selectedAnimeTitle}`;
    fetch(`${endpoint}/anime/gogoanime/watch/${selectedEpisodeId}`)
        .then(response => response.json())
        .then(data => {
            hideLoading();
            const streamUrl = data.sources.find(source => source.quality === 'default').url;
            const playerUrl = `https://astream-ext.pages.dev/oplayer/?src=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(selectedEpisode)}&poster=${encodeURIComponent(episodePoster)}`;
            if (fromRecentEpisodes) {
                fetchRecentEpisodes();
            }
            window.open(playerUrl, 'popUpWindow', 'height=480,width=854');
        })
        .catch(error => {
            hideLoading();
            console.error('Error fetching stream URL:', error);
            showError('Error fetching stream URL. The video could be unavailable for now. Please try again later.');
        });
}

// Function to fetch and display the download URL for an episode
function fetchDownloadUrl(selectedEpisodeId) {
    const endpoint = document.getElementById('endpointSelect').value;
    showLoading('Fetching download URL...');
    fetch(`${endpoint}/anime/gogoanime/watch/${selectedEpisodeId}`)
        .then(response => response.json())
        .then(data => {
            hideLoading();
            const downloadUrl = data.download;
            window.open(downloadUrl, '_blank');
        })
        .catch(error => {
            hideLoading();
            console.error('Error fetching download URL:', error);
            showError('Error fetching download URL. Please try again.');
        });
}

// Function to fetch recent episodes
function fetchRecentEpisodes() {
    const extractContent = document.getElementById('extractContent');
    extractContent.style.padding = '20px';

    const endpoint = document.getElementById('endpointSelect').value;
    showLoading('Fetching recent episodes...');

    fetch(`${endpoint}/anime/gogoanime/recent-episodes`)
        .then(response => response.json())
        .then(data => {
            hideLoading();
            const content = document.getElementById('content');
            content.innerHTML = ''; // Clear existing content

            const recentContainer = document.createElement('div');
            recentContainer.className = 'recent-container';

            data.results.forEach(anime => {
                const animeItem = document.createElement('div');
                animeItem.className = 'anime-item';
                animeItem.style.backgroundImage = `url('${anime.image}')`;

                const animeInfo = document.createElement('div');
                animeInfo.className = 'anime-info';

                const titleElement = document.createElement('span');
                titleElement.textContent = `${anime.title} Episode ${anime.episodeNumber}`;

                animeInfo.appendChild(titleElement);
                animeItem.appendChild(animeInfo);
                recentContainer.appendChild(animeItem);

                animeItem.addEventListener('click', function () {
                    const extractContent = document.getElementById('extractContent');
                    extractContent.style.padding = '20px';
                    showLoading('Fetching stream URL...');
                    const animeTitle = `${anime.title} Episode ${anime.episodeNumber}`;
                    fetchEpisodeStream(anime.episodeId, animeTitle, anime.image, true);
                });
            });

            const extractContent = document.getElementById('extractContent');
            extractContent.style.padding = '0px';
            content.appendChild(recentContainer);
        })
        .catch(error => {
            hideLoading();
            console.error('Error fetching recent episodes:', error);
            showError('Error fetching recent episodes. Please try again.');
        });
}

// Function to show a loading message
function showLoading(customMessage = 'Loading...', clearContent = true) {
    const content = document.getElementById('content');
    if (clearContent) {
        content.innerHTML = `<p class="loadingText">${customMessage}</p>`;
    } else {
        let loadingMessage = document.createElement('p');
        loadingMessage.className = "loadingText";
        loadingMessage.textContent = customMessage;
        content.appendChild(loadingMessage);
    }
}

// Function to show a text message
function showText(customMessage = 'Loading...', clearContent = true) {
    const content = document.getElementById('content');
    if (clearContent) {
        content.innerHTML = `<p class="showText">${customMessage}</p>`;
    } else {
        let textMessage = document.createElement('p');
        textMessage.className = "showText";
        textMessage.textContent = customMessage;
        content.appendChild(textMessage);
    }
}

// Function to show a synopsis
function showSynopsis(customMessage = 'Synopsis of...') {
    const content = document.getElementById('content');
    content.innerHTML = `<div class="showSynopsis">${customMessage}</div>`;
}

// Function to hide loading messages
function hideLoading() {
    const content = document.getElementById('content');
    const loadingMessages = content.querySelectorAll('p.loadingText');
    loadingMessages.forEach(msg => msg.remove());
}

// Function to show an error message
function showError(message) {
    const content = document.getElementById('content');
    let errorMessage = document.createElement('p');
    errorMessage.style.color = 'red';
    errorMessage.textContent = message;
    content.appendChild(errorMessage);
}

// Event listener for opening the library
document.getElementById('openLibraryBtn').addEventListener('click', function () {
    window.open('/library/index.html', '_blank');
});
