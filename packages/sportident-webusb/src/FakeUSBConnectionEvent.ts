export class FakeUSBConnectionEvent
        extends Event
        implements USBConnectionEvent {
    readonly device: USBDevice;

    constructor(
        type: string,
        eventInitDict: USBConnectionEventInit,
    ) {
        super(type);
        this.device = eventInitDict.device;
    }
}
