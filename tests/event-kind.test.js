import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Bag} from '../src/index.js';
for (const [name, value, attrs, merge, expected] of [
    ['value only', 2, {a: 1}, true, 'upd_value'],
    ['both', 2, {a: 2}, true, 'upd_value_attr'],
    ['attributes only', 1, {a: 2}, true, 'upd_attrs'],
    ['unchanged', 1, {a: 1}, true, null],
    ['attribute removal', 1, {}, false, 'upd_attrs'],
    ['no effective null addition', 1, {missing: null}, true, null],
]) {
    test(`event describes actual changes: ${name}`, () => {
        const bag = new Bag(); bag.setItem('item', 1, {a: 1}); bag.setBackref();
        const node = bag.getNode('item');
        const local = [], parent = [];
        node.subscribe('watch', e => local.push(e));
        bag.subscribe('watch', {update: e => parent.push(e)});
        node.setValue(value, true, attrs, merge);
        assert.deepEqual(local.map(e => e.evt), expected ? [expected] : []);
        assert.deepEqual(parent.map(e => e.evt), expected ? [expected] : []);
        if (expected === 'upd_value') assert.equal(parent[0].attrs_diff, null);
    });
}
