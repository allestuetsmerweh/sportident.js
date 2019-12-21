// eslint-disable-next-line no-unused-vars
import {ISiDevice} from '../SiDevice/ISiDevice';
// eslint-disable-next-line no-unused-vars
import {ISiStation} from './ISiStation';
// eslint-disable-next-line no-unused-vars
import {ISiTargetMultiplexer, SiTargetMultiplexerTarget} from './ISiTargetMultiplexer';
import {BaseSiStation} from './BaseSiStation';
import {SiTargetMultiplexer} from './SiTargetMultiplexer';

export class CoupledSiStation
        extends BaseSiStation<SiTargetMultiplexerTarget.Remote>
        implements ISiStation<SiTargetMultiplexerTarget.Remote> {
    static fromSiDevice(siDevice: ISiDevice<any>): CoupledSiStation {
        const multiplexer = SiTargetMultiplexer.fromSiDevice(siDevice);
        return this.fromSiTargetMultiplexer(multiplexer);
    }

    static fromSiTargetMultiplexer(
        multiplexer: ISiTargetMultiplexer,
    ): CoupledSiStation {
        return this.fromSiTargetMultiplexerWithGivenTarget(
            multiplexer,
            SiTargetMultiplexerTarget.Remote,
            () => new this(multiplexer, SiTargetMultiplexerTarget.Remote),
        ) as CoupledSiStation;
    }
}
