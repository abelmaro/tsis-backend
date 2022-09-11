import axios from 'axios';
import { Request, Response } from 'express';
import puppeteer from "puppeteer"

const Config = {
    baseUrl: "https://www.shazam.com"
}

const scrapGoogleImages = async (query: string) => {

    query = query + " portada";

    let url = "https://www.google.com/search?q=" + query + "&tbm=isch&ved=2ahUKEwjUuqW9-fv5AhX7tJUCHcZ3A9oQ2-cCegQIABAA&oq=" + query + "&gs_lcp=CgNpbWcQAzoECCMQJzoFCAAQgAQ6CAgAEIAEELEDOggIABCxAxCDAToECAAQQzoKCAAQsQMQgwEQQzoHCAAQsQMQQzoGCAAQChAYOgQIABAYUMcMWPEgYIQiaAFwAHgAgAGMAYgBwAqSAQQxMC40mAEAoAEBqgELZ3dzLXdpei1pbWfAAQE&sclient=img&ei=1wYVY5TzLPvp1sQPxu-N0A0&bih=754&biw=1536"
    let browser;
    try {
        console.info("Starting browser...")
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            'ignoreHTTPSErrors': true
        });
        console.info("Browser opened successfully...")
    } catch (error) {
        return [];
    }

    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForSelector("a.wXeWr.islib.nfEiy");

    await page.exposeFunction('puppeteerWaitForSelector', async (text: string) => {
        await page.waitForSelector(text, { timeout: 3000 });
    });

    /*@ts-ignore*/
    var result = await page.evaluate(async () => {
        var variants = [...document.querySelectorAll("a.wXeWr.islib.nfEiy")].slice(0, 6)
        var images: any = [];

        for (let index = 0; index < variants.length; index++) {
            /*@ts-ignore*/
            variants[index].click()
            try {
                /*@ts-ignore*/
                await window.puppeteerWaitForSelector("img.n3VNCb.KAlRDb");

                images.push({
                    /*@ts-ignore*/
                    url: document.querySelector("img.n3VNCb.KAlRDb").getAttribute("src")
                })
            } catch (error) {
                console.info("Image scrapping time out")
            }

        }
        images = images.filter((x: string) => x != "")
        return Promise.all(images).then(img => {
            return {
                img
            };
        });
    });
    /*@ts-ignore*/
    await page.setRequestInterception(true)

    /*@ts-ignore*/
    page.on('request', async interceptedRequest => {
        interceptedRequest.continue();
    });
    await page.close().then(() => console.info("Page closed successfully"));
    await browser.close().then(() => console.info("Browser closed successfully"));

    return result;
};

const getLyrics = (key: string) => {
    let url = Config.baseUrl + "/discovery/v5/es/AR/web/-/track/" + key

    console.info("Trying to get lyrics")

    let lyrics = axios.get(url).then((res: any) => {
        let lyricsArr = res.data["sections"].filter((x: any) => x["type"] == "LYRICS")[0]["text"];
        return lyricsArr;
    }).catch((error: any) => {
        console.warn("\x1b[33m", "Error trying to get lyrics")
        console.error("\x1b[31m", error);
        return "";
    });

    return lyrics;
}

const getSongInfo = async (req: Request, res: Response) => {
    let query = req.params.searchQuery;
    console.info(`Searching for ${query}...`);
    let url = Config.baseUrl + "/services/search/v4/es/AR/web/search?term=" + query + "&numResults=3&offset=0&types=artists,songs&limit=3"
    let json = await axios.get(url).then(async (res: any) => {
        console.info(`Request start...`);
        try {
            let track;
            if (res 
                && res.data
                && res.data["tracks"]
                && res.data["tracks"]["hits"] 
                && res.data["tracks"]["hits"][0]
                && res.data["tracks"]["hits"][0]["track"] ) {
                    track = res.data["tracks"]["hits"][0]["track"];
            }
            else {
                console.info("Nothing found")
                return [];
            }

            return {
                "artistName": track["subtitle"],
                "songName": track["title"],
                "songPreview": track["hub"]["actions"].filter((x: { uri: string }) => x.uri)[0],
                "covers": await scrapGoogleImages(query),
                "lyrics": await getLyrics(track["key"]),
                "mainImage": track["images"]["background"],
            }
        } catch (error) {
            console.error("\x1b[31m", `Something went wrong...`);
            console.error("\x1b[31m", error);
            return [];
        }

    });
    console.info("Request end...")
    return res.send(json);
}

export default { getSongInfo };