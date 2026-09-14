import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Bag, BagCbResolver} from '../src/index.js';

for (const existing of [false, true]) {
    test(`static update preserves resolver without executing it (${existing ? 'existing' : 'new'})`, () => {
        let calls = 0;
        const resolver = new BagCbResolver({callback: () => ++calls});
        const source = new Bag(); source.setItem('remote', resolver);
        const target = new Bag(existing ? {remote: 9} : null);
        target.update(source, 'static');
        assert.equal(calls, 0);
        assert.equal(target.getNode('remote').resolver, resolver);
        assert.equal(target.getItem('remote'), 1);
    });
    test(`default update copies resolved result (${existing ? 'existing' : 'new'})`, () => {
        let calls = 0;
        const source = new Bag();source.setItem('remote', new BagCbResolver({callback: () => ++calls}));
        const target = new Bag(existing ? {remote: 9} : null);
        target.update(source);
        assert.equal(calls, 1);
        assert.equal(target.getItem('remote'), 1);
        assert.equal(target.getNode('remote').resolver, null);
    });
}
test('static mode copies null and nested merges preserve attributes', () => {
    const source = new Bag(), target = new Bag();
    source.setItem('branch',new Bag({a:null,c:3}));
    source.getNode('branch').setAttr({caption:null},false,true,false);
    target.setItem('branch',new Bag({a:1,b:2}),{kept:true,caption:'old'});
    target.update(source,'static');
    assert.deepEqual(target.getItem('branch').items(),[{key:'a',value:null},{key:'b',value:2},{key:'c',value:3}]);
    assert.deepEqual(target.getNode('branch').attr,{kept:true,caption:null});
});
test('replace marker replaces a branch and update reason reaches events', () => {
    const source = new Bag(), target = new Bag();target.setBackref();
    source.setItem('branch',new Bag({fresh:1}),{__replace:true});
    target.setItem('branch',new Bag({stale:1}));
    const reasons=[];target.subscribe('audit',{any:event=>reasons.push(event.reason)});
    target.update(source,null,'remote-update');
    assert.deepEqual(target.getItem('branch').keys(),['fresh']);
    assert.equal('__replace' in source.getNode('branch').attr,false);
    assert.ok(reasons.includes('remote-update'));
});

test('resolved update replaces an existing destination resolver with the result', () => {
    const source = new Bag(), target = new Bag();
    source.setItem('remote',new BagCbResolver({callback: () => 'new'}));
    target.setItem('remote',new BagCbResolver({callback: () => 'old'}));
    target.update(source);
    assert.equal(target.getNode('remote').resolver,null);
    assert.equal(target.getItem('remote'),'new');
});
