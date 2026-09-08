# Copyright 2026 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0
"""Cross-language contracts for mixed Bag types and inert resolver transport."""
import base64
import json
import subprocess
from pathlib import Path

import pytest
from genro_bag import Bag
from genro_bag.resolver import BagSyncResolver
from genro_tytx import register_class

@register_class
class SourceBag(Bag):
    __tytx_suffix__ = 'AUDITSOURCE'

class FixedResolver(BagSyncResolver):
    class_kwargs = {'number': 0, 'cache_time': 0, 'read_only': False, 'as_bag': False}
    def load(self):
        return self.kw['number']

BRIDGE = Path(__file__).with_name('alignment_roundtrip.mjs')

def roundtrip(bag, format, scenario, compact=False, signed=False):
    options = {'sign_key': 'audit-secret'} if signed else {}
    if format == 'xml':
        wire = f'<GenRoBag>{bag.to_xml(**options)}</GenRoBag>'
    elif format == 'json':
        wire = bag.to_json(**options)
    else:
        wire = bag.to_tytx('msgpack' if format == 'msgpack' else 'json', compact=compact, **options)
    data = base64.b64encode(wire).decode() if isinstance(wire, bytes) else wire
    result = subprocess.run(['node', str(BRIDGE)], input=json.dumps({
        'data': data, 'format': format, 'scenario': scenario, 'compact': compact, 'signed': signed,
    }), text=True, capture_output=True, check=True)
    data = json.loads(result.stdout)['data']
    if format == 'msgpack':
        return type(bag).from_tytx(base64.b64decode(data), 'msgpack', **options)
    if format == 'xml':
        return Bag.from_xml(data, **options)
    if format == 'json':
        return Bag.from_json(data, **options)
    return type(bag).from_tytx(data, **options)

@pytest.mark.parametrize('format', ['tytx', 'msgpack'])
@pytest.mark.parametrize('compact', [False, True])
def test_mixed_tree(format, compact):
    b = SourceBag()
    b.set_item('source', SourceBag(), node_tag='div')
    b['source.data'] = Bag({'value': 42})
    b['source.empty'] = SourceBag()
    result = roundtrip(b, format, 'tree', compact)
    assert type(result) is SourceBag
    assert type(result['source']) is SourceBag
    assert type(result['source.data']) is Bag
    assert type(result['source.empty']) is SourceBag
    assert result['source.data.value'] == 42
    assert result.get_node('source').node_tag == 'div'

@pytest.mark.parametrize('format', ['tytx', 'msgpack', 'json', 'xml'])
@pytest.mark.parametrize('signed', [False, True])
def test_resolvers(format, signed):
    b = Bag()
    b.set_item('n', FixedResolver(number=42), _attributes={'other': FixedResolver(number=7)})
    result = roundtrip(b, format, 'resolvers', signed=signed)
    assert isinstance(result.get_node('n').resolver, FixedResolver)
    assert isinstance(result.get_node('n').attr['other'], FixedResolver)
    assert result['n'] == 42
    assert result['n?other'] == 7

@pytest.mark.parametrize('format', ['tytx', 'msgpack'])
def test_bag_in_plain_value(format):
    b = Bag()
    b.set_item('event', {'value': SourceBag({'x': 42})})
    result = roundtrip(b, format, 'envelope')
    assert type(result['event']['value']) is SourceBag
    assert result['event']['value']['x'] == 42
