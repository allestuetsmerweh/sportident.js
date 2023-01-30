export interface SiCardSample {
    cardData: {[attr: string]: unknown}&{cardNumber: number};
    storageData: (number|undefined)[];
}
