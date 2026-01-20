// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

import { fromTytx } from 'genro-tytx';

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
        this._resolver = null;
        this._nodeSubscribers = {};

        // Set parent
        this.parentBag = parentBag;

        // Process attributes - trigger=false during construction
        if (attr) {
            this.setAttr(attr, false);
        }

        // Process value - trigger=false during construction
        if (value !== null) {
            this.setValue(value, false);
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
     *   - 'attr1&attr2': return tuple of attribute values
     *   - 'key=val::T&key2=val2::T': kwargs for resolver (parsed via tytx ::QS)
     * @param {Object} [kwargs={}] - Additional kwargs passed to resolver.
     * @returns {*} The node's value or attribute(s).
     */
    getValue(isStatic = false, queryString = null, kwargs = {}) {
        if (queryString !== null) {
            // Use tytx ::QS to parse queryString (like Python)
            const parsedQs = fromTytx(`${queryString}::QS`);

            if (Array.isArray(parsedQs)) {
                // Attributes: ?color or ?color&size
                const attrs = parsedQs.map(k => this._attr[k]);
                return attrs.length === 1 ? attrs[0] : attrs;
            } else {
                // Dict → kwargs for resolver: ?x=1&y=2 → {x: 1, y: 2}
                if (!this._resolver) {
                    throw new Error('Cannot use kwargs syntax without resolver');
                }
                kwargs = { ...kwargs, ...parsedQs };
            }
        }

        // Resolver support
        if (this._resolver !== null) {
            return this._resolver.resolve({ static: isStatic, ...kwargs });
        }
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
        // TODO: Handle BagResolver passed as value
        // TODO: Handle BagNode passed as value - extract its value and attrs

        const oldvalue = this._value;
        this._value = value;

        // Check if actually changed
        let changed = oldvalue !== this._value;
        if (!changed && attributes) {
            for (const [attrK, attrV] of Object.entries(attributes)) {
                if (this._attr[attrK] !== attrV) {
                    changed = true;
                    break;
                }
            }
        }

        trigger = trigger && changed;

        // Event type: 'upd_value' for value-only, 'upd_value_attr' for combined
        // Note: evt is used ONLY for parent notification, not for node subscribers
        let evt = 'upd_value';

        if (attributes !== null) {
            evt = 'upd_value_attr';
            // Call setAttr with trigger=false: node subscribers receive only
            // 'upd_value' from here, not a separate 'upd_attrs' event
            this.setAttr(attributes, false, updattr, removeNullAttributes);
        }

        // Node subscribers always receive 'upd_value' (not 'upd_value_attr')
        // They don't need to know if attributes also changed
        if (trigger) {
            for (const subscriber of Object.values(this._nodeSubscribers)) {
                subscriber({ node: this, info: oldvalue, evt: 'upd_value' });
            }
        }

        if (this._parentBag !== null && this._parentBag.backref) {
            // If value is a Bag, set up backref
            if (value && typeof value._htraverse === 'function') {
                value.setBackref(this, this._parentBag);
            }
            if (trigger) {
                this._parentBag._onNodeChanged(
                    this, [this.label], evt, oldvalue, reason
                );
            }
        }
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

    /**
     * Get the resolver attached to this node.
     *
     * @returns {BagResolver|null} The resolver or null.
     */
    get resolver() {
        return this._resolver;
    }

    /**
     * Set the resolver for this node.
     *
     * @param {BagResolver|null} resolver - The resolver to attach.
     */
    set resolver(resolver) {
        this._resolver = resolver;
        if (resolver && resolver.setNode) {
            resolver.setNode(this);
        }
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
        const newAttr = attr || {};

        // Save old state BEFORE any modification (only if needed for subscribers)
        const hasNodeSubscribers = Object.keys(this._nodeSubscribers).length > 0;
        const oldattr = (trigger && hasNodeSubscribers) ? { ...this._attr } : null;

        if (updattr) {
            Object.assign(this._attr, newAttr);
        } else {
            this._attr = { ...newAttr };
        }

        if (removeNullAttributes) {
            for (const key of Object.keys(this._attr)) {
                if (this._attr[key] === null) {
                    delete this._attr[key];
                }
            }
        }

        if (trigger) {
            if (oldattr !== null) {
                // Find which attributes changed
                const updAttrs = [];
                for (const [k, v] of Object.entries(this._attr)) {
                    if (oldattr[k] !== v) {
                        updAttrs.push(k);
                    }
                }
                for (const subscriber of Object.values(this._nodeSubscribers)) {
                    subscriber({ node: this, info: updAttrs, evt: 'upd_attrs' });
                }
            }

            if (this._parentBag !== null && this._parentBag.backref) {
                const reason = trigger === true ? 'true' : String(trigger);
                this._parentBag._onNodeChanged(
                    this, [this.label], 'upd_attrs', null, reason
                );
            }
        }
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
    // Subscription Methods
    // -------------------------------------------------------------------------

    /**
     * Subscribe to changes on this specific node.
     *
     * @param {string} subscriberId - Unique identifier for this subscription.
     * @param {Function} callback - Function to call on changes.
     *
     * Callback signature: callback({ node, info, evt })
     * - node: This BagNode
     * - info: oldvalue (for 'upd_value') or list of changed attrs (for 'upd_attrs')
     * - evt: Event type ('upd_value' or 'upd_attrs')
     */
    subscribe(subscriberId, callback) {
        this._nodeSubscribers[subscriberId] = callback;
    }

    /**
     * Unsubscribe from changes on this node.
     *
     * @param {string} subscriberId - The subscription identifier to remove.
     */
    unsubscribe(subscriberId) {
        delete this._nodeSubscribers[subscriberId];
    }

    // -------------------------------------------------------------------------
    // Navigation Properties
    // -------------------------------------------------------------------------

    /**
     * Get this node's index position within parent Bag.
     *
     * @returns {number|null} The 0-based index of this node in the parent's node list,
     *   or null if this node has no parent.
     */
    get position() {
        if (this._parentBag === null) {
            return null;
        }
        return this._parentBag._nodes.index(this.label);
    }

    /**
     * Get dot-separated path from root to this node.
     *
     * @returns {string|null} Full path or null if no parent.
     */
    get fullpath() {
        if (this._parentBag !== null) {
            const parentFullpath = this._parentBag.fullpath;
            if (parentFullpath !== null) {
                return `${parentFullpath}.${this.label}`;
            }
        }
        return null;
    }

    /**
     * Get the node that contains this node's parent Bag.
     *
     * In the hierarchy: grandparent_bag contains parent_node, whose value
     * is parent_bag, which contains this node.
     *
     * @returns {BagNode|null} The parent node or null.
     */
    get parentNode() {
        if (this._parentBag) {
            return this._parentBag.parentNode;
        }
        return null;
    }

    /**
     * Find the ancestor node that owns a given attribute.
     *
     * @param {string} attrname - Attribute name to search for.
     * @param {*} [attrvalue=null] - If provided, also match this value.
     * @returns {BagNode|null} The node that owns the attribute, or null.
     */
    attributeOwnerNode(attrname, attrvalue = null) {
        let curr = this;
        if (attrvalue === null) {
            while (curr && !(attrname in curr._attr)) {
                curr = curr.parentNode;
            }
        } else {
            while (curr && curr._attr[attrname] !== attrvalue) {
                curr = curr.parentNode;
            }
        }
        return curr;
    }

    /**
     * Return node data as a tuple (array).
     *
     * @returns {Array} Array of [label, value, attr, resolver].
     */
    asTuple() {
        return [this.label, this._value, this._attr, this._resolver || null];
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
