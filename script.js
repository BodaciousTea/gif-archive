const SEARCH_API = "https://sopranos-gif-search.tebodacious.workers.dev/";

const savedGifs = [
  "20_Years.GIF", "Always with the scenarios.GIF", "anton no country for old men look star.GIF",
  "apples and bowling balls frank vincent.GIF", "Breaking_Balls.GIF", "chrissty sad.GIF",
  "chrissy pondering christopher moltisanti.GIF", "christopher moltisanti chrissy.GIF",
  "cmon huh frank vincent.GIF", "dead to me tony.GIF", "dont ask me about my.GIF",
  "Don't get nervous frank vincent.GIF", "dont talk crazy.GIF", "end of subject.GIF",
  "facepalm.GIF", "frank vincent aura casino.GIF", "frank vincent how bout this humidity.GIF",
  "frank vincent slime hit casino.GIF", "get the fuck outta here paulie walnuts.GIF",
  "get the fuck outta here paulie.GIF", "go home and get your shinebox frank vincent.GIF",
  "good night.GIF", "got any blow tony soprano.GIF", "Guys_A_Cop.GIF",
  "hot and sticky like my balls frank vincent.GIF",
  "i dont write nothing down so ill keep this short and sweet.GIF",
  "I feel liked ive been stabbed in the heart.GIF", "i got nothing to say tony soprano.GIF",
  "I gotta agree with phil tony frank vincent.GIF", "I show you my hand and you slap it away.GIF",
  "I told you you dont listen you nut.GIF", "is there something you wanna say to me tony soprano.GIF",
  "it just got worse tony soprano beating.GIF", "it was an accident chrissy christopher moltisanti.GIF",
  "its an honor to be joined by men.GIF", "its okay hes an idiot.GIF",
  "ive i've warned you before.GIF", "ive said my peice chrissy I've said my peice.GIF",
  "just when i thought I was out they pull me back in pacino.GIF",
  "just when i thought I was out they pull me back in.GIF", "lets be frank here.GIF",
  "look at this guy.GIF", "mikey palmice yeah right.GIF", "next time therell be no next time.GIF",
  "next time you see my face show some respect chrissy christopher moltisanti.GIF",
  "no more of this frank vincent.GIF", "nobody cares.GIF", "nobodys talking to you.GIF",
  "now i gotta turn my back on you.GIF", "paulie laughing.GIF", "paulie look.GIF",
  "paulie looking up suprise huh.GIF", "penguin.GIF", "rubenesque.GIF",
  "shes dead to me tony janice.GIF", "shes dead to me.GIF", "smarten up frank vincent.GIF",
  "sure we break some balls here tonight frank vincent.GIF",
  "theres no scraps in my scrapbook frank vincent.GIF", "this guy is more creative than spielberg.GIF",
  "this is not good paulie.GIF", "this mf dont miss.GIF", "to me shes bueatiful .GIF",
  "tongue.GIF", "tony furio aura.GIF", "tony shooting mad.GIF",
  "we gotta talka bout your problem.GIF", "were we're done here.GIF",
  "what are you gonna do argue with me now tony.GIF", "what are you gonna do tony soprano.GIF",
  "what are you gonna do you know tony soprano.GIF", "what did you say tony soprano.GIF",
  "women frank vincent.GIF", "Women.GIF",
  "you look like a puerto rican whore makes me sick frank vincent.GIF",
  "you see where im going frank vincent.GIF", "you talkin to me.GIF", "you write.GIF",
  "you're not seeing the bigger picture.GIF", "you're week youre weak paulie.GIF",
];

const gallery = document.getElementById("gif-gallery");
const searchInput = document.getElementById("search-input");
const resultsCount = document.getElementById("results-count");
const searchMessage = document.getElementById("search-message");
const frankButton = document.getElementById("frank-button");

let searchTimer;
let currentRequest;

function labelFromFilename(filename) {
  return filename.replace(/\.gif$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalize(value) {
  return value.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function setMessage(message = "") {
  searchMessage.textContent = message;
  searchMessage.classList.toggle("visible", Boolean(message));
}

function createCard({ quote, gif, yarnPage, filename, source }) {
  const card = document.createElement("article");
  card.className = "gif-card";

  const image = document.createElement("img");
  image.className = "gif-image";
  image.src = gif;
  image.alt = quote;
  image.loading = "lazy";
  image.decoding = "async";

  const caption = document.createElement("p");
  caption.className = "gif-caption";
  caption.textContent = quote;

  const sourceLabel = document.createElement("span");
  sourceLabel.className = "gif-source";
  sourceLabel.textContent = source;
  caption.appendChild(sourceLabel);

  const actions = document.createElement("div");
  actions.className = "gif-actions";

  const open = document.createElement("a");
  open.className = "gif-action";
  open.href = yarnPage || gif;
  open.target = "_blank";
  open.rel = "noopener noreferrer";
  open.textContent = yarnPage ? "OPEN YARN" : "OPEN GIF";

  const download = document.createElement("a");
  download.className = "gif-action";
  download.href = gif;
  download.download = filename || `${quote}.gif`;
  download.textContent = "DOWNLOAD";

  actions.append(open, download);
  card.append(image, caption, actions);
  return card;
}

function showSavedGifs(filter = "") {
  const words = normalize(filter).split(" ").filter(Boolean);
  const matches = savedGifs.filter((filename) => {
    const text = normalize(filename);
    return words.every((word) => text.includes(word));
  });

  gallery.replaceChildren();
  const fragment = document.createDocumentFragment();
  matches.forEach((filename) => {
    fragment.appendChild(createCard({
      quote: labelFromFilename(filename),
      gif: `public/${encodeURIComponent(filename)}`,
      filename,
      source: "Saved copy",
    }));
  });
  gallery.appendChild(fragment);
  resultsCount.textContent = `Showing ${matches.length} saved GIF${matches.length === 1 ? "" : "s"}`;
  return matches.length;
}

async function searchYarn(query) {
  currentRequest?.abort();
  currentRequest = new AbortController();

  setMessage();
  gallery.replaceChildren();
  resultsCount.textContent = "Searching Yarn...";

  try {
    const url = new URL(SEARCH_API);
    url.searchParams.set("q", query);
    const response = await fetch(url, { signal: currentRequest.signal });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "The search service is unavailable.");

    const results = Array.isArray(data.results) ? data.results : [];
    if (!results.length) {
      const savedCount = showSavedGifs(query);
      setMessage(savedCount
        ? "No live Yarn results. Showing matching saved GIFs instead."
        : "No Sopranos GIFs found for that quote.");
      return;
    }

    const fragment = document.createDocumentFragment();
    results.forEach((result) => fragment.appendChild(createCard({
      quote: result.quote || query,
      gif: result.gif,
      yarnPage: result.yarnPage,
      filename: `${result.id}.gif`,
      source: "Live from Yarn",
    })));
    gallery.replaceChildren(fragment);
    resultsCount.textContent = `Found ${results.length} Sopranos GIF${results.length === 1 ? "" : "s"}`;
  } catch (error) {
    if (error.name === "AbortError") return;
    const savedCount = showSavedGifs(query);
    setMessage(`${error.message} ${savedCount ? "Showing matching saved GIFs instead." : ""}`.trim());
  }
}

function handleSearch(value) {
  window.clearTimeout(searchTimer);
  const query = value.trim();

  if (!query) {
    currentRequest?.abort();
    setMessage();
    showSavedGifs();
    return;
  }

  resultsCount.textContent = "Type to search...";
  searchTimer = window.setTimeout(() => searchYarn(query), 450);
}

searchInput.addEventListener("input", (event) => handleSearch(event.target.value));
frankButton.addEventListener("click", () => {
  searchInput.value = "frank";
  handleSearch("frank");
  searchInput.focus();
});

showSavedGifs();
