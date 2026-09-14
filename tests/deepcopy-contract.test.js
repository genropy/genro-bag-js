import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Bag, BagNode, BagCbResolver} from '../src/index.js';

test('deepcopy preserves duplicate labels, nullable attributes and specialized classes', () => {
    class Node extends BagNode {}
    class SpecializedBag extends Bag { get nodeClass() { return Node; } }
    const bag = new SpecializedBag();
    const first = bag.setItem('same', new Bag({x: 1}));
    first.setAttr({nullable: null}, false, true, false);
    bag._nodes.splice(1, 0, new Node(bag, 'same', 2));
    const copy = bag.deepcopy();
    assert.ok(copy instanceof SpecializedBag);
    assert.ok(copy.getNode('#0') instanceof Node);
    assert.deepEqual(copy.keys(), ['same', 'same']);
    assert.equal(copy.getItem('#1'), 2);
    assert.deepEqual(copy.getNode('#0').attr, {nullable: null});
    copy.getItem('#0').setItem('x', 3);
    assert.equal(bag.getItem('#0').getItem('x'), 1);
});

test('deepcopy resolves only when requested', () => {
    let calls = 0;
    const bag = new Bag();
    bag.setItem('remote', new BagCbResolver({callback: () => ++calls}));
    assert.equal(bag.deepcopy().getItem('remote'), null);
    assert.equal(calls, 0);
    assert.equal(bag.deepcopy(true).getItem('remote'), 1);
    assert.equal(calls, 1);
});
