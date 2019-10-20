import {SiTargetMultiplexer} from './SiTargetMultiplexer';
import {BaseSiStation} from './BaseSiStation';

export class CoupledSiStation extends BaseSiStation {
    static get multiplexerTarget() {
        return SiTargetMultiplexer.Target.Remote;
    }
}
