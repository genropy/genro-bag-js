import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Bag} from '../src/index.js';
for (const operation of ['replace', 'null', 'pop', 'clear']) {
    test(`removed subtree becomes independent: ${operation}`, () => {
        const root = new Bag(); root.setBackref();
        const child = new Bag(); child.setItem('nested', new Bag({x: 1}));
        root.setItem('child', child);
        const node = root.getNode('child');
        const events = []; root.subscribe('test', {any: e => events.push(e)});
        if (operation === 'replace') root.setItem('child', new Bag({y: 2}));
        if (operation === 'null') node.setValue(null, false);
        if (operation === 'pop') root.popNode('child');
        if (operation === 'clear') root.clear();
        assert.equal(child.parent, null);
        assert.equal(child.parentNode, null);
        assert.equal(child.getItem('nested').parent, child);
        if (['pop', 'clear'].includes(operation)) assert.equal(node.parentBag, null);
        events.length = 0;
        child.setItem('nested.x', 2);
        assert.equal(events.length, 0);
        root.setItem('reattached', child);
        events.length = 0;
        child.setItem('nested.x', 3);
        assert.equal(events.length, 1);
    });
}
test('delete subscribers see popped nodes still attached; detachment follows', () => {
    const root = new Bag(); root.setBackref();
    root.setItem('outer.child', new Bag({x: 1}));
    const inner = root.getItem('outer');
    const node = inner.getNode('child');
    const seen = [];
    root.subscribe('test', {delete: e => seen.push([e.node.parentBag, e.node.parentNode?.label])});
    root.popNode('outer.child');
    assert.deepEqual(seen, [[inner, 'outer']]);
    assert.equal(node.parentBag, null);
    assert.equal(node.parentNode, null);
});
test('delete subscribers see cleared nodes still attached; detachment follows', () => {
    const root = new Bag(); root.setBackref();
    root.setItem('a', 1); root.setItem('b', 2);
    const nodes = root.getNodes().slice();
    const seen = [];
    root.subscribe('test', {delete: e => seen.push(e.node.map(n => n.parentBag))});
    root.clear();
    assert.deepEqual(seen, [[root, root]]);
    assert.deepEqual(nodes.map(n => n.parentBag), [null, null]);
});
test('assigning identical child preserves its parent', () => {
    const root = new Bag(); root.setBackref();
    const child = new Bag(); root.setItem('child', child);
    root.setItem('child', child);
    assert.equal(child.parent, root);
});
test('replacement callbacks observe an already detached old subtree', () => {
    const root = new Bag(); root.setBackref();
    const child = new Bag({x: 1}); root.setItem('child', child);
    let calls = 0;
    root.subscribe('watch', {update: e => {
        calls++;
        assert.equal(e.oldvalue, child);
        assert.equal(child.parentNode, null);
    }});
    root.setItem('child', 1);
    assert.equal(calls, 1);
});
test('explicit parent removal clears both upward links', () => {
    const root = new Bag(); root.setBackref();
    const child = new Bag(); root.setItem('child', child);
    child.delParentRef();
    assert.equal(child.parent, null);
    assert.equal(child.parentNode, null);
});
