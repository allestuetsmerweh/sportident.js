import {proto} from '../../constants';
import * as utils from '../../utils';
import {BaseSiCard} from '../BaseSiCard';

export class SiCard6 extends BaseSiCard {
    typeSpecificRead() {
        return this.mainStation.sendMessage({
            command: proto.cmd.GET_SI6,
            parameters: [0x08],
        }, 3)
            .then((data) => {
                if (data[0][2] !== 0) {
                    console.warn(`SICard6 Error: First read block is ${data[0][2]} (expected 0)`);
                }
                if (data[1][2] !== 6) {
                    console.warn(`SICard6 Error: Second read block is ${data[1][2]} (expected 6)`);
                }
                if (data[2][2] !== 7) {
                    console.warn(`SICard6 Error: Third read block is ${data[2][2]} (expected 7)`);
                }
                data[0].splice(0, 3);
                data[1].splice(0, 3);
                data[2].splice(0, 3);
                const cn = utils.arr2big([data[0][11], data[0][12], data[0][13]]);
                if (this.cardNumber !== cn) {
                    console.warn('SICard6 Error: SI Card Number inconsistency');
                }

                this.startTime = utils.arr2time(data[0].slice(26, 28));
                this.finishTime = utils.arr2time(data[0].slice(22, 24));
                this.checkTime = utils.arr2time(data[0].slice(30, 32));
                this.clearTime = utils.arr2time(data[0].slice(34, 36));
                const len = Math.min(Math.max(data[0][18] - 1, 0), 64);
                this.punches = new Array(len);
                let blk = 1;
                let ind = 0;
                for (let i = 0; i < len; i++) {
                    if (128 <= ind) {
                        blk++;
                        ind = 0;
                    }
                    const time = utils.arr2time(data[blk].slice(ind + 2, ind + 4));
                    if (0 <= time) {
                        this.punches[i] = {code: data[blk][ind + 1], time: time};
                    } else {
                        console.warn('SICard6 Error: Undefined Time in punched range');
                    }
                    ind += 4;
                }
            });
    }
}
BaseSiCard.registerNumberRange(500000, 1000000, SiCard6);
BaseSiCard.registerNumberRange(2003000, 2004000, SiCard6);
