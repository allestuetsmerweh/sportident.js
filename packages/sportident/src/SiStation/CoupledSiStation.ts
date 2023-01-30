import {ISiDevice, ISiDeviceDriverData} from '../SiDevice/ISiDevice';
import {ISiStation} from './ISiStation';
import {ISiTargetMultiplexer, SiTargetMultiplexerTarget} from './ISiTargetMultiplexer';
import {BaseSiStation} from './BaseSiStation';
import {SiTargetMultiplexer} from './SiTargetMultiplexer';

export class CoupledSiStation
    extends BaseSiStation<SiTargetMultiplexerTarget.Remote>
    implements ISiStation<SiTargetMultiplexerTarget.Remote> {
    static fromSiDevice(siDevice: ISiDevice<ISiDeviceDriverData<unknown>>): CoupledSiStation {
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
