import {proto} from '../../constants';
import * as utils from '../../utils';
import {BaseSiCard} from '../BaseSiCard';

export class SiCard11 extends BaseSiCard {
    getTypeSpecificDetectionMessage() {
        const cardNumberArr = utils.cardNumber2arr(this.cardNumber);
        cardNumberArr.reverse();
        return {
            command: proto.cmd.SI8_DET,
            parameters: [...cardNumberArr],
        };
    }

    typeSpecificRead() {
        const readSiCard11TimeBlock = (blockData, punchData, blockIndex, punchCount) => {
            let isLastBlock = false;
            const punchesPerBlock = 32;
            for (let i = 0; i < punchesPerBlock; i++) {
                if (blockIndex * punchesPerBlock + i >= punchCount) {
                    isLastBlock = true;
                    break;
                }
                const time = utils.arr2time(blockData.slice(i * 4 + 2, i * 4 + 4));
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
        return this.mainStation.sendMessage({
            command: proto.cmd.GET_SI8,
            parameters: [0x00],
        }, 1)
            .then((data0) => {
                console.assert(data0[0][2] === 0, 'Inconsistent');
                const page0 = data0[0].slice(3);
                const cn = utils.arr2big([page0[25], page0[26], page0[27]]);
                if (this.cardNumber !== cn) {
                    console.warn('SICard11 Error: SI Card Number inconsistency');
                }

                this.startTime = utils.arr2time(page0.slice(14, 16));
                this.finishTime = utils.arr2time(page0.slice(18, 20));
                this.checkTime = utils.arr2time(page0.slice(10, 12));
                len = Math.min(Math.max(page0[22], 0), 128);
                this.punches = new Array(len);

                return this.mainStation.sendMessage({
                    command: proto.cmd.GET_SI8,
                    parameters: [0x04],
                }, 1);
            })
            .then((data4) => {
                console.assert(data4[0][2] === 4, 'Inconsistent');
                const page4 = data4[0].slice(3);
                const is4LastBlock = readSiCard11TimeBlock(page4, this.punches, 0, len);
                if (is4LastBlock) {
                    return this;
                }
                return this.mainStation.sendMessage({
                    command: proto.cmd.GET_SI8,
                    parameters: [0x05],
                }, 1).then((data5) => {
                    console.assert(data5[0][2] === 5, 'Inconsistent');
                    const page5 = data5[0].slice(3);
                    const is5LastBlock = readSiCard11TimeBlock(page5, this.punches, 1, len);
                    if (is5LastBlock) {
                        return this;
                    }
                    return this.mainStation.sendMessage({
                        command: proto.cmd.GET_SI8,
                        parameters: [0x06],
                    }, 1).then((data6) => {
                        console.assert(data6[0][2] === 6, 'Inconsistent');
                        const page6 = data6[0].slice(3);
                        const is6LastBlock = readSiCard11TimeBlock(page6, this.punches, 2, len);
                        if (is6LastBlock) {
                            return this;
                        }
                        return this.mainStation.sendMessage({
                            command: proto.cmd.GET_SI8,
                            parameters: [0x07],
                        }, 1).then((data7) => {
                            console.assert(data7[0][2] === 7, 'Inconsistent');
                            const page7 = data7[0].slice(3);
                            readSiCard11TimeBlock(page7, this.punches, 3, len);
                            return this;
                        });
                    });
                });
            });
    }
}
BaseSiCard.registerNumberRange(9000000, 10000000, SiCard11);
