/* eslint-env jasmine */

import _ from 'lodash';
import * as mixinUtils from './mixins';

describe('mixin utils', () => {
    it('mixes in', () => {
        class Disposable {
            public isDisposed: boolean = false;
            dispose() {
                this.isDisposed = true;
            }
        }

        class Activatable {
            public isActive: boolean = false;
            activate() {
                this.isActive = true;
            }
        }

        class MyObject {
            isMine: boolean = true;
        }

        interface MyObject extends Disposable, Activatable {}
        mixinUtils.applyMixins(MyObject, [Disposable, Activatable]);

        let myObject = new MyObject();
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
