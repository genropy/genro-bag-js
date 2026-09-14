import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Bag} from '../src/index.js';

for (const trigger of [true, false, null, {source: 'widget'}]) {
    for (const value of [1, 2]) {
        test(`value hook preserves arguments and precedes events (${JSON.stringify(trigger)}, ${value})`, () => {
            const bag = new Bag({item: 1}); bag.setBackref();
            const node = bag.getNode('item');
            const order = [];
            node._onChangedValue = function(n, next, previous, cause) {
                assert.equal(this, node);
                assert.equal(n, node);
                assert.equal(next, value);
                assert.equal(previous, 1);
                assert.equal(cause, trigger ?? true);
                assert.equal(n.staticValue, value);
                assert.equal(n.attr.caption, 'ready');
                order.push('hook');
            };
            bag.subscribe('watch', {update: () => order.push('event')});
            node.setValue(value, trigger, {caption: 'ready'});
            assert.deepEqual(order, trigger === false ? ['hook'] : ['hook', 'event']);
        });
    }
}
test('unchanged value invokes hook even when change events are suppressed', () => {
    const bag = new Bag({item: 1}); bag.setBackref();
    const node = bag.getNode('item');
    const order = [];
    node._onChangedValue = () => order.push('hook');
    bag.subscribe('watch', {update: () => order.push('event')});
    node.setValue(1);
    assert.deepEqual(order, ['hook']);
});
