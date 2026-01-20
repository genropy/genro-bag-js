// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

/**
 * BagNode - individual node in a Bag hierarchy.
 *
 * A BagNode gathers within itself three main things:
 * - label: can be only a string
 * - value: can be anything, even a Bag for hierarchical structure
 * - attr: dictionary that contains node's metadata
 */
export class BagNode {
    /**
     * Create a new BagNode.
     *
     * @param {Object} parentBag - The parent Bag containing this node.
     * @param {string} label - The node's key/name within the parent Bag.
     * @param {*} [value=null] - The node's value (can be scalar or Bag).
     * @param {Object} [attr=null] - Dict of attributes to set.
     */
    constructor(parentBag, label, value = null, attr = null) {
        this.label = label;
        this._value = null;
        this._attr = {};
        this._parentBag = null;

        // Set parent
        this.parentBag = parentBag;

        // Process attributes
        if (attr) {
            this.setAttr(attr);
        }

        // Process value
        if (value !== null) {
            this.setValue(value);
        }
    }

    // -------------------------------------------------------------------------
    // Parent Bag Property
    // -------------------------------------------------------------------------

    get parentBag() {
        return this._parentBag;
    }

    set parentBag(parentBag) {
        this._parentBag = parentBag;
    }

    // -------------------------------------------------------------------------
    // Value Property and Methods
    // -------------------------------------------------------------------------

    get value() {
        return this.getValue();
    }

    set value(value) {
        this.setValue(value);
    }

    /**
     * Get the node's value.
     *
     * @param {boolean} [isStatic=false] - If true, return cached value without triggering resolver.
     * @param {string} [queryString=null] - Query string from path suffix (after '?').
     *   - null: return node value
     *   - 'attr': return single attribute value
     *   - 'attr1&attr2': return array of attribute values
     * @returns {*} The node's value or attribute(s).
     */
    getValue(isStatic = false, queryString = null) {
        if (queryString !== null) {
            const attrs = queryString.split('&');
            if (attrs.length === 1) {
                return this._attr[attrs[0]];
            }
            return attrs.map(a => this._attr[a]);
        }
        // TODO: resolver support
        return this._value;
    }

    /**
     * Set the node's value.
     *
     * @param {*} value - The value to set.
     * @param {boolean} [trigger=true] - If true, notify subscribers of the change.
     * @param {Object} [attributes=null] - Optional attributes to set along with value.
     * @param {boolean} [updattr=true] - If false, clear existing attributes first.
     * @param {boolean} [removeNullAttributes=true] - If true, remove null values from attributes.
     * @param {string} [reason=null] - Optional reason string for the trigger.
     */
    setValue(value, trigger = true, attributes = null, updattr = true, removeNullAttributes = true, reason = null) {
        const oldvalue = this._value;
        this._value = value;

        // Handle attributes if provided
        if (attributes !== null) {
            this.setAttr(attributes, false, updattr, removeNullAttributes);
        }

        // TODO: trigger events when backref support is added
        // if (trigger && this._parentBag && this._parentBag.backref) {
        //     this._parentBag._onNodeChanged(this, [this.label], oldvalue, 'upd_value', reason);
        // }
    }

    /**
     * Get node's raw _value (bypassing resolver).
     */
    get staticValue() {
        return this._value;
    }

    set staticValue(value) {
        this._value = value;
    }

    // -------------------------------------------------------------------------
    // Attribute Methods
    // -------------------------------------------------------------------------

    get attr() {
        return this._attr;
    }

    /**
     * Get attribute value or all attributes.
     *
     * @param {string} [label=null] - The attribute's label. If null, returns all attributes.
     * @param {*} [defaultValue=null] - Default value if attribute not found.
     * @returns {*} Attribute value, default, or dict of all attributes.
     */
    getAttr(label = null, defaultValue = null) {
        if (!label) {
            return this._attr;
        }
        return label in this._attr ? this._attr[label] : defaultValue;
    }

    /**
     * Set attributes on the node.
     *
     * @param {Object} [attr=null] - Dictionary of attributes to set.
     * @param {boolean} [trigger=true] - If true, notify subscribers of the change.
     * @param {boolean} [updattr=true] - If false, clear existing attributes first.
     * @param {boolean} [removeNullAttributes=true] - If true, remove null values from attributes.
     */
    setAttr(attr = null, trigger = true, updattr = true, removeNullAttributes = true) {
        if (!updattr) {
            this._attr = {};
        }
        if (attr) {
            Object.assign(this._attr, attr);
        }
        if (removeNullAttributes) {
            for (const key of Object.keys(this._attr)) {
                if (this._attr[key] === null) {
                    delete this._attr[key];
                }
            }
        }
        // TODO: trigger events when backref support is added
    }

    /**
     * Delete attributes from the node.
     *
     * @param {...string} attrsToDelete - Attribute labels to remove.
     *   Each can be a single label or a comma-separated string.
     */
    delAttr(...attrsToDelete) {
        for (const attr of attrsToDelete) {
            if (typeof attr === 'string' && attr.includes(',')) {
                for (const a of attr.split(',')) {
                    delete this._attr[a.trim()];
                }
            } else {
                delete this._attr[attr];
            }
        }
    }

    /**
     * Check if a node has the given attribute.
     *
     * @param {string} label - Attribute label to check.
     * @param {*} [value=null] - If provided, also check if attribute has this value.
     * @returns {boolean} True if attribute exists (and matches value if provided).
     */
    hasAttr(label, value = null) {
        if (!(label in this._attr)) {
            return false;
        }
        if (value !== null) {
            return this._attr[label] === value;
        }
        return true;
    }

    /**
     * Get attributes inherited from ancestors.
     *
     * @returns {Object} Dict with all inherited attributes merged with this node's attributes.
     */
    getInheritedAttributes() {
        let inherited = {};
        if (this._parentBag && this._parentBag.parentNode) {
            inherited = this._parentBag.parentNode.getInheritedAttributes();
        }
        return { ...inherited, ...this._attr };
    }

    // -------------------------------------------------------------------------
    // Comparison
    // -------------------------------------------------------------------------

    /**
     * Check equality with another BagNode.
     *
     * @param {BagNode} other - Node to compare with.
     * @returns {boolean} True if label, attr and value match.
     */
    isEqual(other) {
        if (!(other instanceof BagNode)) {
            return false;
        }
        if (this.label !== other.label) {
            return false;
        }
        // Compare attributes
        const thisKeys = Object.keys(this._attr);
        const otherKeys = Object.keys(other._attr);
        if (thisKeys.length !== otherKeys.length) {
            return false;
        }
        for (const key of thisKeys) {
            if (this._attr[key] !== other._attr[key]) {
                return false;
            }
        }
        // Compare values
        if (this._value && typeof this._value.isEqual === 'function') {
            return this._value.isEqual(other._value);
        }
        return this._value === other._value;
    }

    // -------------------------------------------------------------------------
    // String representation
    // -------------------------------------------------------------------------

    toString() {
        return `BagNode : ${this.label}`;
    }
}
