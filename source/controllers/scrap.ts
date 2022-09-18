import axios from 'axios';
import { Request, Response } from 'express';
// import puppeteer from "puppeteer"
import PageCodes from '../constants/PageCodes';
import { SongInfoInterface } from '../models/SongInfoInterface';
import { getLyrics, getPageUrl, getSongPreview } from '../utils/codeHelper';
import chromium from 'chrome-aws-lambda';

async function getBrowser() {
    console.info("Starting browser...")
    return await chromium.puppeteer.launch({
        args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: true,
        ignoreHTTPSErrors: true,
      })
}

const scrapGoogleImages = async (query: string) => {
    let url = getPageUrl(query, PageCodes.google);
    let browser;

    try {
        browser = await getBrowser();
    } catch (error) {
        return [];
    }

    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForSelector("a.wXeWr.islib.nfEiy");

    await page.exposeFunction('puppeteerWaitForSelector', async (text: string) => {
        await page.waitForSelector(text, { timeout: 3000 });
    });

    var result = await page.evaluate(async () => {
        var variants = [...document.querySelectorAll("a.wXeWr.islib.nfEiy")].slice(0, 6)
        var images: any = [];

        for (let index = 0; index < variants.length; index++) {
            let imgElement = variants[index] as HTMLElement;
            imgElement.click();

            try {
                /*@ts-ignore*/
                await window.puppeteerWaitForSelector("img.n3VNCb.KAlRDb");

                images.push({
                    url: document.querySelector("img.n3VNCb.KAlRDb")?.getAttribute("src")
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

    await page.setRequestInterception(true)

    page.on('request', async interceptedRequest => {
        interceptedRequest.continue();
    });

    await page.close().then(() => console.info("Page closed successfully"));
    await browser.close().then(() => console.info("Browser closed successfully"));

    return result;
};

const getSongInfo = async (req: Request, res: Response) => {
    let query = req.params.searchQuery;

    console.info(`Searching for ${query}...`);

    let url = getPageUrl(query, PageCodes.shazam)
    let json = await axios.get(url).then(async (res: any) => {
        console.info(`Request start...`);
        try {
            let track;
            if (res
                && res.data
                && res.data["tracks"]
                && res.data["tracks"]["hits"]
                && res.data["tracks"]["hits"][0]
                && res.data["tracks"]["hits"][0]["track"]) {
                track = res.data["tracks"]["hits"][0]["track"];
            }
            else {
                console.info("Nothing found")
                return [];
            }
            const result: SongInfoInterface = {
                artistName: track["subtitle"],
                songName: track["title"],
                songPreview: getSongPreview(track),
                covers: await scrapGoogleImages(query),
                lyrics: await getLyrics(track["key"]),
                mainImage: track["images"]["background"],
            }
            return result;
        } catch (error) {
            console.error("\x1b[31m", `Something went wrong...`);
            console.error("\x1b[31m", error);
            return [];
        }

    });
    console.info("Request end...")
    return res.send(json);
}

function homeResponse(req: Request, res: Response) {
    return res.send({ response: "Hi!" })
}

export default { getSongInfo, homeResponse };