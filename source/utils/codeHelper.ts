import axios from "axios";
import PageCodes from "../constants/PageCodes";
import Urls from "../constants/Urls";

export function getSongPreview(track: any): string {
    return track["hub"]["actions"].filter((x: { uri: string }) => x.uri)[0];
}

export async function getLyrics(key: string) {
    let url = getPageUrl(key, PageCodes.shazamLyrics)

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

export function getPageUrl(query: string, page: string): string {
    switch (page) {
        case PageCodes.google:
            return Urls.googleUrl + "/search?q=" + query + " portada" + "&tbm=isch&ved=2ahUKEwjUuqW9-fv5AhX7tJUCHcZ3A9oQ2-cCegQIABAA&oq=" + query + "&gs_lcp=CgNpbWcQAzoECCMQJzoFCAAQgAQ6CAgAEIAEELEDOggIABCxAxCDAToECAAQQzoKCAAQsQMQgwEQQzoHCAAQsQMQQzoGCAAQChAYOgQIABAYUMcMWPEgYIQiaAFwAHgAgAGMAYgBwAqSAQQxMC40mAEAoAEBqgELZ3dzLXdpei1pbWfAAQE&sclient=img&ei=1wYVY5TzLPvp1sQPxu-N0A0&bih=754&biw=1536"
        case PageCodes.shazam:
            return Urls.shazamUrl + "/services/search/v4/es/AR/web/search?term=" + query + "&numResults=3&offset=0&types=artists,songs&limit=3"
        case PageCodes.shazamLyrics:
            return Urls.shazamUrl + "/discovery/v5/es/AR/web/-/track/" + query
        default:
            return "";
    }
}