import {getLookup} from './utils';

export const proto = {
    // Protocol characters
    STX: 0x02,
    ETX: 0x03,
    ACK: 0x06, // when sent to BSx3..6, causes beep until SI-card taken out
    NAK: 0x15,
    DLE: 0x10,
    WAKEUP: 0xFF,

    // Basic protocol commands, currently unused
    basicCmd: {
        SET_CARDNO: 0x30,
        GET_SI5: 0x31, // read out SI-card 5 data
        SI5_WRITE: 0x43, // 02 43 (block: 0x30 to 0x37) (16 bytes) 03
        SI5_DET: 0x46, // SI-card 5 inserted (46 49) or removed (46 4F)
        TRANS_REC: 0x53, // autosend timestamp (online control)
        TRANS_TIME: 0x54, // autosend timestamp (lightbeam trigger)
        GET_SI6: 0x61, // read out SI-card 6 data
        SI6_DET: 0x66, // SI-card 6 inserted
        SET_MS: 0x70, // \x4D="M"aster, \x53="S"lave
        GET_MS: 0x71,
        SET_SYS_VAL: 0x72,
        GET_SYS_VAL: 0x73,
        GET_BDATA: 0x74, // Note: response carries '\xC4'!
        ERASE_BDATA: 0x75,
        SET_TIME: 0x76,
        GET_TIME: 0x77,
        OFF: 0x78,
        GET_BDATA2: 0x7A, // Note: response carries '\xCA'!
        SET_BAUD: 0x7E, // 0=4800 baud, 1=38400 baud
    },
    get basicCmdLookup() {
        return getLookup(proto.basicCmd);
    },

    // Extended protocol commands
    cmd: {
        GET_BACKUP: 0x81,
        SET_SYS_VAL: 0x82,
        GET_SYS_VAL: 0x83,
        SRR_WRITE: 0xA2, // ShortRangeRadio - SysData write
        SRR_READ: 0xA3, // ShortRangeRadio - SysData read
        SRR_QUERY: 0xA6, // ShortRangeRadio - network device query
        SRR_PING: 0xA7, // ShortRangeRadio - heartbeat from linked devices, every 50 seconds
        SRR_ADHOC: 0xA8, // ShortRangeRadio - ad-hoc message, f.ex. from SI-ActiveCard
        GET_SI5: 0xB1, // read out SI-card 5 data
        TRANS_REC: 0xD3, // autosend timestamp (online control)
        CLEAR_CARD: 0xE0, // found on SI-dev-forum: 02 E0 00 E0 00 03 (http://www.sportident.com/en/forum/8/56#59)
        GET_SI6: 0xE1, // read out SI-card 6 data block
        SET_SI6: 0xE2, // write SI-card 6 line (16 bytes)
        SET_SI6_SPECIAL: 0xE4, // write SI-card 6 special fields (e.g. start number)
        SI5_DET: 0xE5, // SI-card 5 inserted
        SI6_DET: 0xE6, // SI-card 6 inserted
        SI_REM: 0xE7, // SI-card removed
        SI8_DET: 0xE8, // SI-card 8/9/10/11/p/t inserted
        SET_SI8: 0xEA, // write SI-card 8/9/10/11/p/t data word
        GET_SI8: 0xEF, // read out SI-card 8/9/10/11/p/t data block
        SET_MS: 0xF0, // \x4D="M"aster, \x53="S"lave
        GET_MS: 0xF1,
        ERASE_BDATA: 0xF5,
        SET_TIME: 0xF6,
        GET_TIME: 0xF7,
        OFF: 0xF8,
        SIGNAL: 0xF9, // 02 F9 (number of signals) (CRC16) 03
        SET_BAUD: 0xFE, // \x00=4800 baud, \x01=38400 baud
    },
    get cmdLookup() {
        return getLookup(proto.cmd);
    },

    // Protocol Parameters
    P_MS_DIRECT: 0x4D, // "M"aster
    P_MS_INDIRECT: 0x53, // "S"lave
    P_SI6_CB: 0x08,

    // offsets in system data
    // currently only O_MODE, O_STATION_CODE and O_PROTO are used
    sysDataOffset: {
        OLD_SERIAL: 0x00, // 2 bytes - only up to BSx6, numbers < 65.536
        OLD_CPU_ID: 0x02, // 2 bytes - only up to BSx6, numbers < 65.536
        SERIAL_NO: 0x00, // 4 bytes - only after BSx7, numbers > 70.000 (if byte 0x00 > 0, better use OLD offsets)
        FIRMWARE: 0x05, // 3 bytes
        BUILD_DATE: 0x08, // 3 bytes - YYMMDD
        MODEL_ID: 0x0B, // 2 bytes:
        //   8003: BSF3 (serial numbers > 1.000)
        //   8004: BSF4 (serial numbers > 10.000)
        //   8084: BSM4-RS232
        //   8086: BSM6-RS232 / BSM6-USB
        //   8146: BSF6 (serial numbers > 30.000)
        //   8115: BSF5 (serial numbers > 50.000)
        //   8117 / 8118: BSF7 / BSF8 (serial no. 70.000...70.521, 72.002...72.009)
        //   8187 / 8188: BS7-SI-Master / BS8-SI-Master
        //   8197: BSF7 (serial numbers > 71.000, apart from 72.002...72.009)
        //   8198: BSF8 (serial numbers > 80.000)
        //   9197 / 9198: BSM7-RS232, BSM7-USB / BSM8-USB, BSM8-SRR
        //   9199: unknown
        //   9597: BS7-S
        //   B197 / B198: BS7-P / BS8-P
        //   B897: BS7-GSM
        MEM_SIZE: 0x0D, // 1 byte - in KB
        REFRESH_RATE: 0x10, // 1 byte - in 3/sec
        POWER_MODE: 0x11, // 1 byte - 06 low power, 08 standard/sprint

        BAT_DATE: 0x15, // 3 bytes - YYMMDD
        BAT_CAP: 0x19, // 2 bytes - battery capacity in mAh (as multiples of 14.0625?!)
        BACKUP_PTR: 0x1C, // 4 bytes - at positions 1C,1D,21,22
        SI6_CB: 0x33, // 1 byte - bitfield defining which SI Card 6 blocks to read: \x00=\xC1=read block0,6,7; \x08=\xFF=read all 8 blocks
        BAT_STATE: 0x34, // 4 bytes - for battery state: 2000mAh: 000000=0%, 6E0000=100%, 1000mAh:000000=0%, 370000=100%
        MEM_OVERFLOW: 0x3D, // 1 byte - memory overflow if != 0x00

        INTERVAL: 0x48, // 2 bytes - in 32*ms
        WTF: 0x4A, // 2 bytes - in 32*ms

        PROGRAM: 0x70, // 1 byte - station program: xx0xxxxxb competition, xx1xxxxxb training
        MODE: 0x71, // 1 byte - see SI station modes below
        STATION_CODE: 0x72, // 1 byte
        PROTO: 0x74, // 1 byte - protocol configuration, bit mask value:
        //   xxxxxxx1b extended protocol
        //   xxxxxx1xb auto send out
        //   xxxxx1xxb handshake (only valid for card readout)
        //   xxxx1xxxb sprint 4ms (only for Start&Finish modes)
        //   xxx1xxxxb access with password only
        //   xx1xxxxxb stop, if backup is full (only for Readout mode)
        //   1xxxxxxxb read out SI-card after punch (only for punch modes;
        //             depends on bit 2: auto send out or handshake)
        LAST_WRITE_DATE: 0x75, // 3 bytes - YYMMDD
        LAST_WRITE_TIME: 0x78, // 3 bytes - 1 byte day (see below), 2 bytes seconds after midnight/midday
        SLEEP_TIME: 0x7B, // 3 bytes - 1 byte day (see below), 2 bytes seconds after midnight/midday
        //   xxxxxxx0b - seconds relative to midnight/midday: 0 = am, 1 = pm
        //   xxxx000xb - day of week: 000 = Sunday, 110 = Saturday
        //   xx00xxxxb - week counter 0..3, relative to programming date
        WORKING_TIME: 0x7E, // 2 bytes - big endian number = minutes
    },

    // SI station modes
    M_CONTROL: 0x02,
    M_START: 0x03,
    M_FINISH: 0x04,
    M_READ_SICARDS: 0x05,
    M_CLEAR: 0x07,
    M_CHECK: 0x0A,
    M_PRINTOUT: 0x0B,

    // Weekday encoding (only for reference, currently unused)
    D_SUNDAY: 0b000,
    D_MONDAY: 0b001,
    D_TUESDAY: 0b010,
    D_WEDNESDAY: 0b011,
    D_THURSDAY: 0b100,
    D_FRIDAY: 0b101,
    D_SATURDAY: 0b110,

    // Backup memory record length
    REC_LEN: 8, // Only in extended protocol, otherwise 6!

    // punch trigger in control mode data structure
    T_OFFSET: 8,
    T_CN: 0,
    T_TIME: 5,

    // backup memory in control mode
    BC_CN: 3,
    BC_TIME: 8,
};
