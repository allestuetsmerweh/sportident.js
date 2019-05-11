import si from '../../src/index';
import {SiSimulator} from '../SiSimulator';
import {SiMainStationSimulator} from '../SiMainStationSimulator';
import {SiCard5Simulator} from '../SiCard5Simulator';
import {SiCard6Simulator} from '../SiCard6Simulator';
import {SiCard8Simulator} from '../SiCard8Simulator';
import {SiCard9Simulator} from '../SiCard9Simulator';
import {SiCard10Simulator} from '../SiCard10Simulator';

export const simulateCommand = ({userLine, logLine, userInput}) => {
    const res = /simulate ([^\s]+) ([^\s]+)/.exec(userLine);
    if (res === null) {
        logLine('Usage: simulate [what] [URL]');
        logLine('       e.g. simulate BSM8 unix:///tmp/vwin_com1');
        return Promise.resolve();
    }
    const what = res[1];
    const mainStationStorages = {
        'BSM8': si.utils.unPrettyHex(
            '00 02 C1 A1 F7 36 35 36 0E 06 0B 91 98 80 20 C0' +
            '4B 08 4E FA 28 0E 06 0B 00 36 EE 80 00 00 18 04' +
            'FF 09 00 00 00 00 00 00 00 00 00 00 4D 70 FF FF' +
            'FF 00 87 C1 00 00 00 2D 00 00 00 00 FF 00 FB E5' +
            '00 24 FC 18 FF FF 19 99 0A 3D 7F F8 85 0C 05 01' +
            '00 00 6F F0 FF FF FF FF 00 00 00 4B FF FF FF FF' +
            '30 30 30 35 7D 20 38 00 00 00 00 00 FF FF FF FF' +
            '28 05 0A 31 05 13 01 02 01 87 EE 00 0E 12 00 3C',
        ),
    };
    const cardSimulators = {
        'SI5': new SiCard5Simulator(si.utils.unPrettyHex(
            'aa 29 00 01 19 02 04 00 00 00 00 00 00 00 00 00' +
            '65 19 02 1d db 1e 2f 03 56 ee ee 28 04 1f 00 07' +
            '00 1f 1e 02 20 1e 13 00 ee ee 00 ee ee 00 ee ee' +
            '00 00 ee ee 00 ee ee 00 ee ee 00 ee ee 00 ee ee' +
            '00 00 ee ee 00 ee ee 00 ee ee 00 ee ee 00 ee ee' +
            '00 00 ee ee 00 ee ee 00 ee ee 00 ee ee 00 ee ee' +
            '00 00 ee ee 00 ee ee 00 ee ee 00 ee ee 00 ee ee' +
            '00 00 ee ee 00 ee ee 00 ee ee 00 ee ee 00 ee ee',
        )),
        'SI6': new SiCard6Simulator([
            si.utils.unPrettyHex(
                '01 01 01 01 ed ed ed ed 55 aa 00 07 a1 3d 6e 8b' +
                '00 5b 40 41 00 0a 28 0a 03 0a 95 99 03 0a 95 8b' +
                '03 0a 95 76 ff ff ff ff 00 00 00 01 20 20 20 20' +
                '5a 69 6d 6d 65 72 62 65 72 67 20 20 20 20 20 20' +
                '20 20 20 20 4f 4c 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '00 00 00 00 00 01 00 01 00 02 00 02 20 03 00 03' +
                '00 04 20 20 00 05 20 20 00 06 00 20 20 07 20 07' +
                '00 08 20 20 00 09 20 20 00 0a 00 20 20 0b 20 0b' +
                '00 0c 20 20 00 0d 20 20 00 0e 00 20 20 0f 20 0f' +
                '00 10 20 20 00 11 20 20 00 12 00 20 20 13 20 13' +
                '00 14 20 20 00 15 20 20 00 16 00 20 20 17 20 17' +
                '00 18 20 20 00 19 20 20 00 1a 00 20 20 1b 20 1b' +
                '00 1c 20 20 00 1d 20 20 00 1e 00 20 20 1f 20 1f',
            ),
            si.utils.unPrettyHex(
                '00 20 20 20 00 20 20 20 00 20 20 20 00 20 20 20' +
                '00 20 20 20 00 20 20 20 00 20 20 20 00 20 20 20' +
                '00 20 20 20 00 20 20 20 00 20 20 20 00 20 20 20' +
                '00 20 20 20 00 20 20 20 00 20 20 20 00 20 20 20' +
                '00 20 20 20 00 20 20 20 00 20 20 20 00 20 20 20' +
                '00 20 20 20 00 20 20 20 00 20 20 20 00 20 20 20' +
                '00 20 20 20 00 20 20 20 00 20 20 20 00 20 20 20' +
                '00 20 20 20 ff ff 20 20 c0 ff 00 00 00 00 ee ee',
            ),
        ]),
        'SI8': new SiCard8Simulator([
            si.utils.unPrettyHex(
                '77 2a 42 99 ea ea ea ea 37 02 22 1f 07 03 22 11' +
                'ee ee ee ee 0f 7f 10 09 0f 23 ca ce 06 0f 61 53' +
                '53 69 6d 6f 6e 3b 48 61 74 74 3b 6d 3b 31 39 39' +
                '32 3b 4f 4c 20 5a 69 6d 6d 65 72 62 65 72 67 3b' +
                '3b 3b 5a 81 72 69 63 68 3b 3b 3b 53 55 49 3b 00' +
                'ee ee ee ee ee ee ee ee ee ee ee ee ee ee ee ee' +
                'ee ee ee ee ee ee ee ee ee ee ee ee ee ee ee ee' +
                'ee ee ee ee ee ee ee ee ee ee ee ee ee ee ee ee',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
        ]),
        'SI9': new SiCard9Simulator([
            si.utils.unPrettyHex(
                '77 2a 42 99 ea ea ea ea 37 02 22 1f 07 03 22 11' +
                'ee ee ee ee 0f 7f 10 09 0f 12 d6 87 06 0f 61 53' +
                '53 69 6d 6f 6e 3b 48 61 74 74 3b 6d 3b 31 39 39' +
                '32 3b 4f 4c 20 5a 69 6d 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 ee ee ee ee',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
        ]),
        'SI10': new SiCard10Simulator([
            si.utils.unPrettyHex(
                '77 2a 42 99 ea ea ea ea 37 02 22 1f 07 03 22 11' +
                'ee ee ee ee 0f 7f 10 09 0f 6b 96 8c 06 0f 61 53' +
                '53 69 6d 6f 6e 3b 48 61 74 74 3b 6d 3b 31 39 39' +
                '32 3b 4f 4c 20 5a 69 6d 6d 65 72 62 65 72 67 3b' +
                '3b 3b 5a 81 72 69 63 68 3b 3b 3b 53 55 49 3b 00' +
                'ee ee ee ee ee ee ee ee ee ee ee ee ee ee ee ee' +
                'ee ee ee ee ee ee ee ee ee ee ee ee ee ee ee ee' +
                'ee ee ee ee ee ee ee ee ee ee ee ee ee ee ee ee',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            si.utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
        ]),
    };
    const mainStationStorage = mainStationStorages[what];
    if (!mainStationStorage) {
        const availableDataIdentifiers = Object.keys(mainStationStorages).join(', ');
        logLine(`No such SiMainStation data: ${what}`);
        logLine(`Available data: ${availableDataIdentifiers}`);
        return Promise.resolve();
    }

    const url = res[2];
    return new Promise((resolve, _reject) => {
        const siSimulator = new SiSimulator(url);
        const siMainStationSimulator = new SiMainStationSimulator(mainStationStorage);
        siSimulator.onMessage = (message) => {
            console.log('SiSimulator:', message);
            siMainStationSimulator.sendMessage(message);
        };
        siMainStationSimulator.onMessage = (message) => {
            console.log('SiMainStationSimulator:', message);
            siSimulator.sendMessage(message);
        };

        const onCtrlC = () => {
            siSimulator.close();
            resolve('Simulation finished.');
        };

        const onSubCommand = (e) => {
            const userSubLine = userInput.text();
            logLine(`> ${userSubLine}`);
            userInput.html('');
            e.preventDefault();
            const subResIn = /in ([^\s]+)/.exec(userSubLine);
            const subResOut = /out/.exec(userSubLine);
            if (subResIn) {
                const simulatorName = subResIn[1];
                if (!(simulatorName in cardSimulators)) {
                    return;
                }
                const simulator = cardSimulators[simulatorName];
                logLine('Insert Card');
                siMainStationSimulator.insertCard(simulator);
            }
            if (subResOut) {
                logLine(`out ${subResOut}`);
            }
        };

        userInput.keyup((e) => {
            if (e.keyCode === 67 && e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
                onCtrlC();
            } else if (e.keyCode === 13) {
                onSubCommand(e);
            }
        });
    });
};
