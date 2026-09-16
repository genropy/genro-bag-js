import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Bag} from '../src/index.js';
test('empty path updates first level, replaces subtree and copies attributes', () => {
    const bag = new Bag(); bag.setItem('a', 1); bag.setItem('child.old', 10);
    const incoming = new Bag(); incoming.setItem('child.new', 20);
    incoming.setItem('b', 3, {caption: 'B'});
    assert.equal(bag.setItem('', incoming), bag);
    assert.deepEqual(bag.keys(), ['a', 'child', 'b']);
    assert.equal(bag.getItem('a'), 1);
    assert.deepEqual(bag.getItem('child').keys(), ['new']);
    assert.deepEqual(bag.getNode('b').attr, {caption: 'B'});
    assert.notEqual(bag.getNode('b'), incoming.getNode('b'));
});
test('object input, empty input and self assignment', () => {
    const bag = new Bag({a: 1});
    bag.setItem('', {a: 2, b: null});
    bag.setItem('', new Bag()); bag.setItem('', {}); bag.setItem('', bag);
    assert.deepEqual(bag.asDict(), {a: 2, b: null});
    assert.equal(bag.getNode(''), null);
});
