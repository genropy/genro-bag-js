# Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0
"""
Generate TyTx fixture files from Python Bag for cross-language testing.

Run this script to regenerate fixtures:
    python tests/cross-lang/generate_fixtures.py

Fixtures are saved in tests/cross-lang/fixtures/
"""

from datetime import date, datetime, time
from decimal import Decimal
from pathlib import Path

from genro_bag import Bag

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def create_simple_bag():
    """Create a simple flat Bag with various types."""
    bag = Bag()
    bag["name"] = "test"
    bag["count"] = 42
    bag["price"] = Decimal("99.99")
    bag["active"] = True
    bag["empty"] = None
    return bag


def create_nested_bag():
    """Create a nested Bag structure."""
    bag = Bag()
    bag["config.host"] = "localhost"
    bag["config.port"] = 5432
    bag["config.enabled"] = True
    bag["users.admin.name"] = "Admin"
    bag["users.admin.email"] = "admin@example.com"
    bag["users.guest.name"] = "Guest"
    return bag


def create_typed_bag():
    """Create a Bag with typed values (Decimal, Date, DateTime, Time)."""
    bag = Bag()
    bag["decimal_value"] = Decimal("123.456")
    bag["date_value"] = date(2025, 6, 15)
    bag["datetime_value"] = datetime(2025, 6, 15, 14, 30, 45)
    bag["time_value"] = time(10, 30, 0)
    bag["integer"] = 999
    bag["float_val"] = 3.14159
    bag["boolean"] = False
    bag["null_val"] = None
    bag["string"] = "Hello, World!"
    return bag


def create_bag_with_attrs():
    """Create a Bag with nodes that have attributes."""
    bag = Bag()
    bag.set_item("item1", "value1", _attributes={"color": "red", "size": 10})
    bag.set_item("item2", Decimal("50.00"), _attributes={"currency": "EUR"})
    bag.set_item("nested.child", "deep", _attributes={"level": 2})
    return bag


def create_complex_bag():
    """Create a complex Bag with mixed content."""
    bag = Bag()
    # Root level values
    bag["version"] = "1.0.0"
    bag["created"] = datetime(2025, 1, 15, 10, 30, 0)

    # Nested config
    bag["config.database.host"] = "db.example.com"
    bag["config.database.port"] = 5432
    bag["config.database.ssl"] = True

    # Products with attributes
    bag.set_item("products.item1", Decimal("29.99"), _attributes={"sku": "PRD001", "stock": 100})
    bag.set_item("products.item2", Decimal("49.99"), _attributes={"sku": "PRD002", "stock": 50})

    # Users
    bag["users.user1.name"] = "Alice"
    bag["users.user1.joined"] = date(2024, 3, 15)
    bag["users.user2.name"] = "Bob"
    bag["users.user2.joined"] = date(2024, 6, 20)

    return bag


# Registry of all fixtures
FIXTURES = {
    "simple": create_simple_bag,
    "nested": create_nested_bag,
    "typed": create_typed_bag,
    "attrs": create_bag_with_attrs,
    "complex": create_complex_bag,
}


def generate_fixtures():
    """Generate all fixture files."""
    FIXTURES_DIR.mkdir(parents=True, exist_ok=True)

    for name, factory in FIXTURES.items():
        bag = factory()

        # Save as JSON transport
        json_path = FIXTURES_DIR / f"{name}.bag.json"
        json_data = bag.to_tytx(transport="json")
        # Remove ::JS suffix for file (extension identifies format)
        if json_data.endswith("::JS"):
            json_data = json_data[:-4]
        json_path.write_text(json_data)
        print(f"Generated: {json_path}")

        # Save as MessagePack transport
        mp_path = FIXTURES_DIR / f"{name}.bag.mp"
        mp_data = bag.to_tytx(transport="msgpack")
        mp_path.write_bytes(mp_data)
        print(f"Generated: {mp_path}")

        # Also save compact versions
        json_compact_path = FIXTURES_DIR / f"{name}_compact.bag.json"
        json_compact_data = bag.to_tytx(transport="json", compact=True)
        if json_compact_data.endswith("::JS"):
            json_compact_data = json_compact_data[:-4]
        json_compact_path.write_text(json_compact_data)
        print(f"Generated: {json_compact_path}")

        mp_compact_path = FIXTURES_DIR / f"{name}_compact.bag.mp"
        mp_compact_data = bag.to_tytx(transport="msgpack", compact=True)
        mp_compact_path.write_bytes(mp_compact_data)
        print(f"Generated: {mp_compact_path}")

    print(f"\nAll fixtures generated in {FIXTURES_DIR}")


if __name__ == "__main__":
    generate_fixtures()
