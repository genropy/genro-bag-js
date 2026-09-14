import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Bag, BagCbResolver} from '../src/index.js';

test('digest resolves value fields but not keys, attributes or static values', () => {
    let calls = 0;
    const bag = new Bag();
    bag.setItem('remote', new BagCbResolver({callback: () => {calls++; return new Bag({x: 42});}}));
    assert.deepEqual(bag.digest('#k'), ['remote']);
    assert.deepEqual(bag.digest('#a'), [{}]);
    assert.deepEqual(bag.digest('#__v'), [null]);
    assert.equal(calls, 0);
    assert.deepEqual(bag.digest('#v.x'), [42]);
    assert.equal(calls, 1);
});

test('digest excludes filtered-out resolvers before reading their values', () => {
    const bag = new Bag();
    bag.setItem('remote', new BagCbResolver({callback: () => {throw new Error('excluded');}}));
    assert.deepEqual(bag.digest('#v', () => false), []);
});
