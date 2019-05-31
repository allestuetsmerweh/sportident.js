import {arr2big, arr2time} from './utils';
import {proto} from './constants';

export class SiCard {
    constructor(mainStation, cardNumber) {
        this.mainStation = mainStation;
        this.cardNumber = cardNumber;
        this.clearTime = -1;
        this.checkTime = -1;
        this.startTime = -1;
        this.finishTime = -1;
        this.punches = [];
    }

    read() {
        const typeFromCN = SiCard.typeByCardNumber(this.cardNumber);
        return SiCard.Type[typeFromCN].read(this);
    }

    type() {
        return SiCard.typeByCardNumber(this.cardNumber);
    }

    toDict() {
        return {
            cardNumber: this.cardNumber,
            clearTime: this.clearTime,
            checkTime: this.checkTime,
            startTime: this.startTime,
            finishTime: this.finishTime,
            punches: this.punches,
        };
    }

    toString() {
        return `${this.type()} Number: ${this.cardNumber}
Clear: ${this.clearTime}
Check: ${this.checkTime}
Start: ${this.startTime}
Finish: ${this.finishTime}
${this.punches.map((punch) => `${punch.code}: ${punch.time}`).join('\n')}
`;
    }

    toHtml() {
        return this.toString().replace(/\n/g, '<br />');
    }
}
SiCard.Type = {
    SICard5: {
        vals: [1000, 500000],
        description: 'SI Card 5',
        read: (card) => card.mainStation._sendCommand(proto.cmd.GET_SI5, [], 1)
            .then((d) => {
                const data = d[0];
                data.splice(0, 2);
                let cn = arr2big([data[6], data[4], data[5]]);
                if (499999 < cn) { console.warn(`SICard5 Error: SI Card Number inconsistency: SI5 detected, but number is ${cn} (not in 0 - 500'000)`); }
                if (data[6] < 2) {
                    cn = arr2big([data[4], data[5]]);
                } else {
                    cn = data[6] * 100000 + arr2big([data[4], data[5]]);
                }
                if (card.cardNumber !== cn) { console.warn('SICard5 Error: SI Card Number inconsistency'); }

                card.startTime = arr2time(data.slice(19, 21));
                card.finishTime = arr2time(data.slice(21, 23));
                card.checkTime = arr2time(data.slice(25, 27));
                // TODO: also read the 6(?) additional punch codes without times
                const len = Math.min(Math.max(data[23] - 1, 0), 30);
                card.punches = new Array(len);
                let ind = 32;
                for (let i = 0; i < len; i++) {
                    if ((ind % 16) === 0) {
                        ind++;
                    }
                    const time = arr2time(data.slice(ind + 1, ind + 3));
                    if (0 <= time) {
                        card.punches[i] = {code: data[ind + 0], time: time};
                    } else {
                        console.warn('SICard5 Error: Undefined Time in punched range');
                    }
                    ind += 3;
                }
                card.mainStation._sendCommand(proto.ACK, [], 0);
                return card;
            }),
    },
    SICard6: {
        vals: [500000, 1000000, 2003000, 2004000],
        description: 'SI Card 6',
        read: (card) => card.mainStation._sendCommand(proto.cmd.GET_SI6, [0x08], 3)
            .then((data) => {
                if (data[0][2] !== 0) { console.warn(`SICard6 Error: First read block is ${data[0][2]} (expected 0)`); }
                if (data[1][2] !== 6) { console.warn(`SICard6 Error: Second read block is ${data[1][2]} (expected 6)`); }
                if (data[2][2] !== 7) { console.warn(`SICard6 Error: Third read block is ${data[2][2]} (expected 7)`); }
                data[0].splice(0, 3);
                data[1].splice(0, 3);
                data[2].splice(0, 3);
                const cn = arr2big([data[0][11], data[0][12], data[0][13]]);
                if (card.cardNumber !== cn) { console.warn('SICard6 Error: SI Card Number inconsistency'); }

                card.startTime = arr2time(data[0].slice(26, 28));
                card.finishTime = arr2time(data[0].slice(22, 24));
                card.checkTime = arr2time(data[0].slice(30, 32));
                card.clearTime = arr2time(data[0].slice(34, 36));
                const len = Math.min(Math.max(data[0][18] - 1, 0), 64);
                card.punches = new Array(len);
                let blk = 1;
                let ind = 0;
                for (let i = 0; i < len; i++) {
                    if (128 <= ind) {
                        blk++;
                        ind = 0;
                    }
                    const time = arr2time(data[blk].slice(ind + 2, ind + 4));
                    if (0 <= time) {
                        card.punches[i] = {code: data[blk][ind + 1], time: time};
                    } else {
                        console.warn('SICard6 Error: Undefined Time in punched range');
                    }
                    ind += 4;
                }
                card.mainStation._sendCommand(proto.ACK, [], 0);
                return card;
            }),
    },
    SICard8: {
        vals: [2000000, 2003000, 2004000, 3000000],
        description: 'SI Card 8',
        read: (card) => {
            let len = undefined;
            return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x00], 1)
                .then((data0) => {
                    console.assert(data0[0][2] === 0, 'Inconsistent');
                    const page0 = data0[0].slice(3);
                    const cn = arr2big([page0[25], page0[26], page0[27]]);
                    if (card.cardNumber !== cn) {
                        console.warn('SICard8 Error: SI Card Number inconsistency');
                    }

                    card.startTime = arr2time(page0.slice(14, 16));
                    card.finishTime = arr2time(page0.slice(18, 20));
                    card.checkTime = arr2time(page0.slice(10, 12));
                    len = Math.min(Math.max(page0[22], 0), 128);
                    card.punches = new Array(len);

                    return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x01], 1);
                })
                .then((data1) => {
                    console.assert(data1[0][2] === 1, 'Inconsistent');
                    const page1 = data1[0].slice(3);
                    for (let i = 0; i < 30; i++) {
                        if (i >= len) {
                            break;
                        }
                        const time = arr2time(page1.slice(i * 4 + 10, i * 4 + 12));
                        if (0 <= time) {
                            card.punches[i] = {
                                code: page1[i * 4 + 9],
                                time: time,
                            };
                        } else {
                            console.warn('SICard8 Error: Undefined Time in punched range');
                        }
                    }
                    return card.mainStation._sendCommand(proto.ACK, [], 0).then(() => card);
                });
        },
    },
    SICard9: {
        vals: [1000000, 2000000],
        description: 'SI Card 9',
        read: (card) => {
            let len = undefined;
            return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x00], 1)
                .then((data0) => {
                    console.assert(data0[0][2] === 0, 'Inconsistent');
                    const page0 = data0[0].slice(3);
                    const cn = arr2big([page0[25], page0[26], page0[27]]);
                    if (card.cardNumber !== cn) {
                        console.warn('SICard9 Error: SI Card Number inconsistency');
                    }

                    card.startTime = arr2time(page0.slice(14, 16));
                    card.finishTime = arr2time(page0.slice(18, 20));
                    card.checkTime = arr2time(page0.slice(10, 12));
                    len = Math.min(Math.max(page0[22], 0), 128);
                    card.punches = new Array(len);

                    let isLastBlock = false;
                    for (let i = 0; i < 18; i++) {
                        if (i >= len) {
                            isLastBlock = true;
                            break;
                        }
                        const time = arr2time(page0.slice(i * 4 + 58, i * 4 + 60));
                        if (0 <= time) {
                            card.punches[i] = {
                                code: page0[i * 4 + 57],
                                time: time,
                            };
                        } else {
                            console.warn('SICard9 Error: Undefined Time in punched range');
                        }
                    }
                    if (isLastBlock) {
                        return card.mainStation._sendCommand(proto.ACK, [], 0).then(() => card);
                    }

                    return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x01], 1).then((data1) => {
                        console.assert(data1[0][2] === 1, 'Inconsistent');
                        const page1 = data1[0].slice(3);
                        for (let i = 18; i < 50; i++) {
                            if (i >= len) {
                                break;
                            }
                            const time = arr2time(page1.slice(i * 4 - 70, i * 4 - 68));
                            if (0 <= time) {
                                card.punches[i] = {
                                    code: page1[i * 4 - 71],
                                    time: time,
                                };
                            } else {
                                console.warn('SICard9 Error: Undefined Time in punched range');
                            }
                        }
                        return card.mainStation._sendCommand(proto.ACK, [], 0).then(() => card);
                    });
                });
        },
    },
    SICard10: {
        vals: [7000000, 8000000],
        description: 'SI Card 10',
        read: (card) => {
            const readSiCard10TimeBlock = (blockData, punchData, blockIndex, punchCount) => {
                let isLastBlock = false;
                const punchesPerBlock = 32;
                for (let i = 0; i < punchesPerBlock; i++) {
                    if (blockIndex * punchesPerBlock + i >= punchCount) {
                        isLastBlock = true;
                        break;
                    }
                    const time = arr2time(blockData.slice(i * 4 + 2, i * 4 + 4));
                    if (0 <= time) {
                        punchData[blockIndex * punchesPerBlock + i] = {
                            code: blockData[i * 4 + 1],
                            time: time,
                        };
                    } else {
                        console.warn('SICard10 Error: Undefined Time in punched range');
                    }
                }
                return isLastBlock;
            };
            let len = undefined;
            return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x00], 1)
                .then((data0) => {
                    console.assert(data0[0][2] === 0, 'Inconsistent');
                    const page0 = data0[0].slice(3);
                    const cn = arr2big([page0[25], page0[26], page0[27]]);
                    if (card.cardNumber !== cn) {
                        console.warn('SICard10 Error: SI Card Number inconsistency');
                    }

                    card.startTime = arr2time(page0.slice(14, 16));
                    card.finishTime = arr2time(page0.slice(18, 20));
                    card.checkTime = arr2time(page0.slice(10, 12));
                    len = Math.min(Math.max(page0[22], 0), 128);
                    card.punches = new Array(len);

                    return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x04], 1);
                })
                .then((data4) => {
                    console.assert(data4[0][2] === 4, 'Inconsistent');
                    const page4 = data4[0].slice(3);
                    const is4LastBlock = readSiCard10TimeBlock(page4, card.punches, 0, len);
                    if (is4LastBlock) {
                        return card.mainStation._sendCommand(proto.ACK, [], 0).then(() => card);
                    }
                    return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x05], 1).then((data5) => {
                        console.assert(data5[0][2] === 5, 'Inconsistent');
                        const page5 = data5[0].slice(3);
                        const is5LastBlock = readSiCard10TimeBlock(page5, card.punches, 1, len);
                        if (is5LastBlock) {
                            return card.mainStation._sendCommand(proto.ACK, [], 0).then(() => card);
                        }
                        return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x06], 1).then((data6) => {
                            console.assert(data6[0][2] === 6, 'Inconsistent');
                            const page6 = data6[0].slice(3);
                            const is6LastBlock = readSiCard10TimeBlock(page6, card.punches, 2, len);
                            if (is6LastBlock) {
                                return card.mainStation._sendCommand(proto.ACK, [], 0).then(() => card);
                            }
                            return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x07], 1).then((data7) => {
                                console.assert(data7[0][2] === 7, 'Inconsistent');
                                const page7 = data7[0].slice(3);
                                readSiCard10TimeBlock(page7, card.punches, 3, len);
                                return card.mainStation._sendCommand(proto.ACK, [], 0).then(() => card);
                            });
                        });
                    });
                });
        },
    },
    SICard11: {
        vals: [9000000, 10000000],
        description: 'SI Card 11',
        read: (card) => {
            const readSiCard11TimeBlock = (blockData, punchData, blockIndex, punchCount) => {
                let isLastBlock = false;
                const punchesPerBlock = 32;
                for (let i = 0; i < punchesPerBlock; i++) {
                    if (blockIndex * punchesPerBlock + i >= punchCount) {
                        isLastBlock = true;
                        break;
                    }
                    const time = arr2time(blockData.slice(i * 4 + 2, i * 4 + 4));
                    if (0 <= time) {
                        punchData[blockIndex * punchesPerBlock + i] = {
                            code: blockData[i * 4 + 1],
                            time: time,
                        };
                    } else {
                        console.warn('SICard11 Error: Undefined Time in punched range');
                    }
                }
                return isLastBlock;
            };
            let len = undefined;
            return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x00], 1)
                .then((data0) => {
                    console.assert(data0[0][2] === 0, 'Inconsistent');
                    const page0 = data0[0].slice(3);
                    const cn = arr2big([page0[25], page0[26], page0[27]]);
                    if (card.cardNumber !== cn) {
                        console.warn('SICard11 Error: SI Card Number inconsistency');
                    }

                    card.startTime = arr2time(page0.slice(14, 16));
                    card.finishTime = arr2time(page0.slice(18, 20));
                    card.checkTime = arr2time(page0.slice(10, 12));
                    len = Math.min(Math.max(page0[22], 0), 128);
                    card.punches = new Array(len);

                    return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x04], 1);
                })
                .then((data4) => {
                    console.assert(data4[0][2] === 4, 'Inconsistent');
                    const page4 = data4[0].slice(3);
                    const is4LastBlock = readSiCard11TimeBlock(page4, card.punches, 0, len);
                    if (is4LastBlock) {
                        return card.mainStation._sendCommand(proto.ACK, [], 0).then(() => card);
                    }
                    return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x05], 1).then((data5) => {
                        console.assert(data5[0][2] === 5, 'Inconsistent');
                        const page5 = data5[0].slice(3);
                        const is5LastBlock = readSiCard11TimeBlock(page5, card.punches, 1, len);
                        if (is5LastBlock) {
                            return card.mainStation._sendCommand(proto.ACK, [], 0).then(() => card);
                        }
                        return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x06], 1).then((data6) => {
                            console.assert(data6[0][2] === 6, 'Inconsistent');
                            const page6 = data6[0].slice(3);
                            const is6LastBlock = readSiCard11TimeBlock(page6, card.punches, 2, len);
                            if (is6LastBlock) {
                                return card.mainStation._sendCommand(proto.ACK, [], 0).then(() => card);
                            }
                            return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x07], 1).then((data7) => {
                                console.assert(data7[0][2] === 7, 'Inconsistent');
                                const page7 = data7[0].slice(3);
                                readSiCard11TimeBlock(page7, card.punches, 3, len);
                                return card.mainStation._sendCommand(proto.ACK, [], 0).then(() => card);
                            });
                        });
                    });
                });
        },
    },
    SIAC: {
        vals: [8000000, 9000000],
        description: 'SIAC',
        read: (card) => {
            const readSIACTimeBlock = (blockData, punchData, blockIndex, punchCount) => {
                let isLastBlock = false;
                const punchesPerBlock = 32;
                for (let i = 0; i < punchesPerBlock; i++) {
                    if (blockIndex * punchesPerBlock + i >= punchCount) {
                        isLastBlock = true;
                        break;
                    }
                    const time = arr2time(blockData.slice(i * 4 + 2, i * 4 + 4));
                    if (0 <= time) {
                        punchData[blockIndex * punchesPerBlock + i] = {
                            code: blockData[i * 4 + 1],
                            time: time,
                        };
                    } else {
                        console.warn('SIAC Error: Undefined Time in punched range');
                    }
                }
                return isLastBlock;
            };
            let len = undefined;
            return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x00], 1)
                .then((data0) => {
                    console.assert(data0[0][2] === 0, 'Inconsistent');
                    const page0 = data0[0].slice(3);
                    const cn = arr2big([page0[25], page0[26], page0[27]]);
                    if (card.cardNumber !== cn) {
                        console.warn('SIAC Error: SI Card Number inconsistency');
                    }

                    card.startTime = arr2time(page0.slice(14, 16));
                    card.finishTime = arr2time(page0.slice(18, 20));
                    card.checkTime = arr2time(page0.slice(10, 12));
                    len = Math.min(Math.max(page0[22], 0), 128);
                    card.punches = new Array(len);

                    return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x04], 1);
                })
                .then((data4) => {
                    console.assert(data4[0][2] === 4, 'Inconsistent');
                    const page4 = data4[0].slice(3);
                    const is4LastBlock = readSIACTimeBlock(page4, card.punches, 0, len);
                    if (is4LastBlock) {
                        return card.mainStation._sendCommand(proto.ACK, [], 0).then(() => card);
                    }
                    return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x05], 1).then((data5) => {
                        console.assert(data5[0][2] === 5, 'Inconsistent');
                        const page5 = data5[0].slice(3);
                        const is5LastBlock = readSIACTimeBlock(page5, card.punches, 1, len);
                        if (is5LastBlock) {
                            return card.mainStation._sendCommand(proto.ACK, [], 0).then(() => card);
                        }
                        return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x06], 1).then((data6) => {
                            console.assert(data6[0][2] === 6, 'Inconsistent');
                            const page6 = data6[0].slice(3);
                            const is6LastBlock = readSIACTimeBlock(page6, card.punches, 2, len);
                            if (is6LastBlock) {
                                return card.mainStation._sendCommand(proto.ACK, [], 0).then(() => card);
                            }
                            return card.mainStation._sendCommand(proto.cmd.GET_SI8, [0x07], 1).then((data7) => {
                                console.assert(data7[0][2] === 7, 'Inconsistent');
                                const page7 = data7[0].slice(3);
                                readSIACTimeBlock(page7, card.punches, 3, len);
                                return card.mainStation._sendCommand(proto.ACK, [], 0).then(() => card);
                            });
                        });
                    });
                });
        },
    },
    PCard: {vals: [4000000, 5000000], description: 'pCard', read: (_card) => undefined},
    TCard: {vals: [6000000, 7000000], description: 'tCard', read: (_card) => undefined},
    FCard: {vals: [14000000, 15000000], description: 'fCard', read: (_card) => undefined},
};

SiCard.typeByCardNumber = (cn) => {
    if (!SiCard._typeLookup) {
        SiCard._typeLookup = {borderList: [], borderLookup: {}};
        Object.keys(SiCard.Type).map((k) => {
            const vals = SiCard.Type[k].vals;
            if ((vals.length % 2) !== 0) {
                throw new Error(`SiCard.Type.${k}: vals length is ${vals.length}?!? (must be even)`);
            }
            let lastEvenVal = 0;
            for (let i = 0; i < vals.length; i++) {
                const borderList = SiCard._typeLookup.borderList;
                let j;
                for (j = 0; j < borderList.length && borderList[j] < vals[i]; j++) {
                    // TODO: binary search here
                }
                const borderExisted = (SiCard._typeLookup.borderList[j] === vals[i]);
                if (!borderExisted) { SiCard._typeLookup.borderList.splice(j, 0, vals[i]); }
                if ((i % 2) === 0) {
                    let collidingRange;
                    if (borderExisted) {
                        collidingRange = SiCard._typeLookup.borderLookup[vals[i]];
                        if (collidingRange) {
                            throw new Error(`SiCard.Type.${k}: ${vals[i]} would collide with ${collidingRange}`);
                        }
                    }
                    if (!borderExisted && 0 < j) {
                        collidingRange = SiCard._typeLookup.borderLookup[SiCard._typeLookup.borderList[j - 1]];
                        if (collidingRange) {
                            throw new Error(`SiCard.Type.${k}: ${vals[i]} would collide with ${collidingRange}`);
                        }
                    }
                    SiCard._typeLookup.borderLookup[vals[i]] = k;
                    lastEvenVal = vals[i];
                } else {
                    if (lastEvenVal !== SiCard._typeLookup.borderList[j - 1]) {
                        throw new Error(`SiCard.Type.${k}: ${vals[i]} is not an immediate follow-up of ${lastEvenVal}`);
                    }
                    if (!SiCard._typeLookup.borderLookup[vals[i]]) { SiCard._typeLookup.borderLookup[vals[i]] = false; }
                }
            }
        });
    }
    let j;
    for (j = 0; j < SiCard._typeLookup.borderList.length && SiCard._typeLookup.borderList[j] <= cn; j++) {
        // TODO: binary search here
    }
    if (j === 0) { return false; }
    return SiCard._typeLookup.borderLookup[SiCard._typeLookup.borderList[j - 1]];
};
