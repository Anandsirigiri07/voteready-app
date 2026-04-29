async function testNews() {
    try {
        const rssUrl = "https://timesofindia.indiatimes.com/rssfeedstopstories.cms";
        const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        const res = await fetch(url);
        const data = await res.json();
        console.log(data.items.slice(0, 4).map(item => item.title));
    } catch(e) {
        console.error(e);
    }
}
testNews();
