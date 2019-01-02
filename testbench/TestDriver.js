import {BaseDriver} from './BaseDriver';

export class TestDriver extends BaseDriver {
    get name() {
        return 'TestDriver';
    }

    new(MainStation) {
        const serialNumber = Math.rand();
        new MainStation({
            ident: `TEST-${serialNumber}`,
            name: 'Test Si Main Station',
            driver: this,
            _device: {
                serialNumber: serialNumber,
            },
        });
    }

    detect(MainStation) {
        if (!('TEST-0' in MainStation.allByDevice)) {
            new MainStation({
                ident: 'TEST-0',
                name: 'Test Si Main Station',
                driver: this,
                _device: {
                    serialNumber: 0,
                },
            });
        }
    }

    open(mainStation) {
        console.debug(`Opening ${mainStation}`);
        return Promise.resolve();
    }

    close(mainStation) {
        console.debug(`Closing ${mainStation}`);
        return Promise.resolve();
    }

    send(mainStation, buffer) {
        console.debug(`Sending ${mainStation}, ${buffer}`);
    }


    // Test-specific methods

    bootstrap() {

    }
}

export default TestDriver;
