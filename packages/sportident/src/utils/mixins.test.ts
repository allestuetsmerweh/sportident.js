import {describe, expect, test} from '@jest/globals';
import * as mixinUtils from './mixins';

describe('mixin utils', () => {
    test('mixes in', () => {
        class Disposable {
            public isDisposed = false;

            dispose() {
                this.isDisposed = true;
            }
        }

        class Activatable {
            public isActive = false;

            activate() {
                this.isActive = true;
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
        class MyObject {
            isMine = true;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
        interface MyObject extends Disposable, Activatable {}
        mixinUtils.applyMixins(MyObject, [Disposable, Activatable]);

        const myObject = new MyObject();
        expect(myObject.isMine).toBe(true);
        expect(myObject.isDisposed).toBe(undefined);
        expect(myObject.isActive).toBe(undefined);
        expect(() => myObject.activate()).not.toThrow();
        expect(myObject.isDisposed).toBe(undefined);
        expect(myObject.isActive).toBe(true);
        expect(() => myObject.dispose()).not.toThrow();
        expect(myObject.isDisposed).toBe(true);
        expect(myObject.isActive).toBe(true);
    });
});
