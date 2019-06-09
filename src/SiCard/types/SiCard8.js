import {proto} from '../../constants';
import * as utils from '../../utils';
import {BaseSiCard} from '../BaseSiCard';

export class SiCard8 extends BaseSiCard {
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
                    console.warn('SICard8 Error: SI Card Number inconsistency');
                }

                this.startTime = utils.arr2time(page0.slice(14, 16));
                this.finishTime = utils.arr2time(page0.slice(18, 20));
                this.checkTime = utils.arr2time(page0.slice(10, 12));
                len = Math.min(Math.max(page0[22], 0), 128);
                this.punches = new Array(len);

                return this.mainStation.sendMessage({
                    command: proto.cmd.GET_SI8,
                    parameters: [0x01],
                }, 1);
            })
            .then((data1) => {
                console.assert(data1[0][2] === 1, 'Inconsistent');
                const page1 = data1[0].slice(3);
                for (let i = 0; i < 30; i++) {
                    if (i >= len) {
                        break;
                    }
                    const time = utils.arr2time(page1.slice(i * 4 + 10, i * 4 + 12));
                    if (0 <= time) {
                        this.punches[i] = {
                            code: page1[i * 4 + 9],
                            time: time,
                        };
                    } else {
                        console.warn('SICard8 Error: Undefined Time in punched range');
                    }
                }
            });
    }
}
BaseSiCard.registerNumberRange(2000000, 2003000, SiCard8);
BaseSiCard.registerNumberRange(2004000, 3000000, SiCard8);
