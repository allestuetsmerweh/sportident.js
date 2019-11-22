/* eslint-env jasmine */

import * as mixinUtils from './mixins';

describe('mixin utils', () => {
    it('mixes in', () => {
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

        class MyObject {
            isMine = true;
        }

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
