export interface SongInfoInterface {
    artistName: string;
    songName: string;
    songPreview: string;
    covers: never[] | {img:any};
    lyrics: string;
    mainImage: string;
}