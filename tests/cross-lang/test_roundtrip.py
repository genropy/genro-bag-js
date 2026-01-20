# Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0
"""
Cross-language round-trip test: Python → JS → Python

This test verifies that a Bag can be serialized to TyTx in Python,
deserialized in JavaScript, re-serialized, and the result matches
the original when deserialized back in Python.

Run with: pytest tests/cross-lang/test_roundtrip.py -v
"""

import subprocess
from datetime import date, datetime, time
from decimal import Decimal
from pathlib import Path

import pytest

from genro_bag import Bag
from genro_tytx.utils import tytx_equivalent

# Path to the JS script that does the JS part of the round-trip
JS_SCRIPT = Path(__file__).parent / "js_roundtrip.mjs"


def bags_equal(bag_a: Bag, bag_b: Bag) -> bool:
    """Compare two Bags for equality (structure, values, attributes).

    Uses tytx_equivalent for value comparison to handle TYTX roundtrip
    semantics (e.g., naive datetime becomes aware UTC).
    """
    if bag_a.keys() != bag_b.keys():
        return False

    for key in bag_a.keys():
        node_a = bag_a.get_node(key)
        node_b = bag_b.get_node(key)

        if node_a is None or node_b is None:
            return False

        # Compare attributes using tytx_equivalent
        if not tytx_equivalent(dict(node_a.attr), dict(node_b.attr)):
            return False

        val_a = node_a.value
        val_b = node_b.value

        # Recursive comparison for nested Bags
        if isinstance(val_a, Bag) and isinstance(val_b, Bag):
            if not bags_equal(val_a, val_b):
                return False
        elif isinstance(val_a, Bag) or isinstance(val_b, Bag):
            return False
        else:
            # Compare values using tytx_equivalent (handles datetime naive vs aware)
            if not tytx_equivalent(val_a, val_b):
                return False

    return True


def run_js_roundtrip(tytx_data: str) -> str:
    """Send TyTx JSON to JS and get back the re-serialized version."""
    result = subprocess.run(
        ["node", str(JS_SCRIPT)],
        input=tytx_data,
        capture_output=True,
        text=True,
        cwd=JS_SCRIPT.parent.parent.parent,  # genro-bag-js root
    )

    if result.returncode != 0:
        raise RuntimeError(f"JS script failed: {result.stderr}")

    return result.stdout.strip()


class TestRoundTrip:
    """Round-trip tests: Python Bag A → TyTx → JS → TyTx → Python Bag B, verify A == B."""

    def test_simple_values(self):
        """Test round-trip with simple scalar values."""
        bag_a = Bag()
        bag_a["name"] = "test"
        bag_a["count"] = 42
        bag_a["active"] = True
        bag_a["empty"] = None

        tytx_out = bag_a.to_tytx(transport="json")
        tytx_back = run_js_roundtrip(tytx_out)
        bag_b = Bag.from_tytx(tytx_back, transport="json")

        assert bags_equal(bag_a, bag_b), f"Bags differ:\nA: {bag_a}\nB: {bag_b}"

    def test_nested_structure(self):
        """Test round-trip with nested Bag structure."""
        bag_a = Bag()
        bag_a["config.host"] = "localhost"
        bag_a["config.port"] = 5432
        bag_a["config.ssl"] = True
        bag_a["users.admin.name"] = "Admin"
        bag_a["users.admin.email"] = "admin@example.com"

        tytx_out = bag_a.to_tytx(transport="json")
        tytx_back = run_js_roundtrip(tytx_out)
        bag_b = Bag.from_tytx(tytx_back, transport="json")

        assert bags_equal(bag_a, bag_b)

    def test_typed_values(self):
        """Test round-trip with typed values (Decimal, Date, DateTime, Time)."""
        bag_a = Bag()
        bag_a["decimal_val"] = Decimal("123.456")
        bag_a["date_val"] = date(2025, 6, 15)
        bag_a["datetime_val"] = datetime(2025, 6, 15, 14, 30, 45)
        bag_a["time_val"] = time(10, 30, 0)
        bag_a["integer"] = 999
        bag_a["float_val"] = 3.14159

        tytx_out = bag_a.to_tytx(transport="json")
        tytx_back = run_js_roundtrip(tytx_out)
        bag_b = Bag.from_tytx(tytx_back, transport="json")

        assert bags_equal(bag_a, bag_b)

    def test_with_attributes(self):
        """Test round-trip with node attributes."""
        bag_a = Bag()
        bag_a.set_item("item1", "value1", _attributes={"color": "red", "size": 10})
        bag_a.set_item("item2", Decimal("50.00"), _attributes={"currency": "EUR"})
        bag_a.set_item("nested.child", "deep", _attributes={"level": 2})

        tytx_out = bag_a.to_tytx(transport="json")
        tytx_back = run_js_roundtrip(tytx_out)
        bag_b = Bag.from_tytx(tytx_back, transport="json")

        assert bags_equal(bag_a, bag_b)

    def test_complex_structure(self):
        """Test round-trip with complex mixed content."""
        bag_a = Bag()
        bag_a["version"] = "1.0.0"
        bag_a["created"] = datetime(2025, 1, 15, 10, 30, 0)
        bag_a["config.database.host"] = "db.example.com"
        bag_a["config.database.port"] = 5432
        bag_a.set_item("products.item1", Decimal("29.99"), _attributes={"sku": "PRD001"})
        bag_a["users.user1.name"] = "Alice"
        bag_a["users.user1.joined"] = date(2024, 3, 15)

        tytx_out = bag_a.to_tytx(transport="json")
        tytx_back = run_js_roundtrip(tytx_out)
        bag_b = Bag.from_tytx(tytx_back, transport="json")

        assert bags_equal(bag_a, bag_b)

    def test_compact_mode(self):
        """Test round-trip with compact TyTx format."""
        bag_a = Bag()
        bag_a["a.b.c"] = "deep"
        bag_a["a.b.d"] = 123
        bag_a["a.e"] = "shallow"

        tytx_out = bag_a.to_tytx(transport="json", compact=True)
        tytx_back = run_js_roundtrip(tytx_out)
        bag_b = Bag.from_tytx(tytx_back, transport="json")

        assert bags_equal(bag_a, bag_b)
