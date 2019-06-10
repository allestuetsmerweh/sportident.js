import {proto} from '../../constants';
import * as utils from '../../utils';
import {BaseSiCard} from '../BaseSiCard';

export class SiCard9 extends BaseSiCard {
    getTypeSpecificDetectionMessage() {
        const cardNumberArr = utils.cardNumber2arr(this.cardNumber);
        cardNumberArr.reverse();
        return {
            command: proto.cmd.SI8_DET,
            parameters: [...cardNumberArr],
        };
    }

    typeSpecificRead() {
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
                    console.warn('SICard9 Error: SI Card Number inconsistency');
                }

                this.startTime = utils.arr2time(page0.slice(14, 16));
                this.finishTime = utils.arr2time(page0.slice(18, 20));
                this.checkTime = utils.arr2time(page0.slice(10, 12));
                len = Math.min(Math.max(page0[22], 0), 128);
                this.punches = new Array(len);

                let isLastBlock = false;
                for (let i = 0; i < 18; i++) {
                    if (i >= len) {
                        isLastBlock = true;
                        break;
                    }
                    const time = utils.arr2time(page0.slice(i * 4 + 58, i * 4 + 60));
                    if (0 <= time) {
                        this.punches[i] = {
                            code: page0[i * 4 + 57],
                            time: time,
                        };
                    } else {
                        console.warn('SICard9 Error: Undefined Time in punched range');
                    }
                }
                if (isLastBlock) {
                    return this;
                }

                return this.mainStation.sendMessage({
                    command: proto.cmd.GET_SI8,
                    parameters: [0x01],
                }, 1).then((data1) => {
                    console.assert(data1[0][2] === 1, 'Inconsistent');
                    const page1 = data1[0].slice(3);
                    for (let i = 18; i < 50; i++) {
                        if (i >= len) {
                            break;
                        }
                        const time = utils.arr2time(page1.slice(i * 4 - 70, i * 4 - 68));
                        if (0 <= time) {
                            this.punches[i] = {
                                code: page1[i * 4 - 71],
                                time: time,
                            };
                        } else {
                            console.warn('SICard9 Error: Undefined Time in punched range');
                        }
                    }
                });
            });
    }
}
BaseSiCard.registerNumberRange(1000000, 2000000, SiCard9);
