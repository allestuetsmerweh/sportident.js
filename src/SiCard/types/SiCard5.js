import {proto} from '../../constants';
import * as utils from '../../utils';
import {BaseSiCard} from '../BaseSiCard';

export class SiCard5 extends BaseSiCard {
    typeSpecificRead() {
        return this.mainStation.sendMessage({
            command: proto.cmd.GET_SI5,
            parameters: [],
        }, 1)
            .then((d) => {
                const data = d[0];
                data.splice(0, 2);
                const lowerCardNumber = utils.arr2big([data[4], data[5]]);
                const cardNumber = data[6] < 2 ? lowerCardNumber : data[6] * 100000 + lowerCardNumber;
                if (cardNumber > 499999) {
                    console.warn(`SICard5 Error: SI Card Number inconsistency: SI5 detected, but number is ${cardNumber} (not in 0 - 500'000)`);
                }

                if (this.cardNumber !== cardNumber) {
                    console.warn('SICard5 Error: SI Card Number inconsistency');
                }

                this.startTime = utils.arr2time(data.slice(19, 21));
                this.finishTime = utils.arr2time(data.slice(21, 23));
                this.checkTime = utils.arr2time(data.slice(25, 27));
                // TODO: also read the 6(?) additional punch codes without times
                const len = Math.min(Math.max(data[23] - 1, 0), 30);
                this.punches = new Array(len);
                let ind = 32;
                for (let i = 0; i < len; i++) {
                    if ((ind % 16) === 0) {
                        ind++;
                    }
                    const time = utils.arr2time(data.slice(ind + 1, ind + 3));
                    if (0 <= time) {
                        this.punches[i] = {code: data[ind + 0], time: time};
                    } else {
                        console.warn('SICard5 Error: Undefined Time in punched range');
                    }
                    ind += 3;
                }
            });
    }
}
BaseSiCard.registerNumberRange(1000, 500000, SiCard5);
