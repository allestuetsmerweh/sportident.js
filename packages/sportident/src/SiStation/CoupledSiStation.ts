import {SiTargetMultiplexerTarget} from './ISiTargetMultiplexer';
import {BaseSiStation} from './BaseSiStation';

export class CoupledSiStation extends BaseSiStation {
    static multiplexerTarget = SiTargetMultiplexerTarget.Remote;
}
