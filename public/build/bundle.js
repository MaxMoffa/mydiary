
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const debounce = (fn, ms = 0) => {
      let timeoutId;
      return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), ms);
      };
    };

    function getTranslate(str) {
      str = str.slice(10, -3);

      var getIndex = str.indexOf("px, ");

      var x = +str.slice(0, getIndex);

      var y = +str.slice(getIndex + 4);
      return { x, y };
    }

    function getCordinates(event) {
      const pageX = event.changedTouches ? event.changedTouches[0].pageX : event.pageX;
      const pageY = event.changedTouches ? event.changedTouches[0].pageY : event.pageY;
      return { pageX, pageY };
    }

    function getRowsCount(items) {
      return Math.max(...items.map(val => val.y + val.h), 1);
    }

    const getColumnFromBreakpoints = (breakpoints, windowWidth, cols, initCols) => {
      var found = false,
        tempCols = cols;
      if (breakpoints) {
        for (var i = breakpoints.length - 1; i >= 0; i--) {
          const [resolution, cols] = breakpoints[i];

          if (windowWidth <= resolution) {
            found = true;
            tempCols = cols;
            break;
          }
        }
      }

      if (!found) {
        tempCols = initCols;
      }

      return tempCols;
    };

    const makeMatrix = (rows, cols) => Array.from(Array(rows), () => new Array(cols)); // make 2d array

    function findCloseBlocks(items, matrix, curObject) {
      const {
        w,
        h,
        x,
        y,
        responsive: { valueW },
      } = curObject;
      const tempR = matrix.slice(y, y + h);
      let result = []; // new Set()
      for (var i = 0; i < tempR.length; i++) {
        let tempA = tempR[i].slice(x, x + (w - valueW));
        result = [...result, ...tempA.map(val => val && val.id).filter(val => val)];
      }
      return [...result.filter((item, pos) => result.indexOf(item) == pos)];
      // return [...new Set(result)];
    }

    function makeMatrixFromItemsIgnore(
      items,
      ignoreList,
      _row, //= getRowsCount(items)
      _col,
    ) {
      let matrix = makeMatrix(_row, _col);
      for (var i = 0; i < items.length; i++) {
        const value = items[i];
        const {
          x,
          y,
          w,
          h,
          id,
          responsive: { valueW },
        } = value;

        if (ignoreList.indexOf(id) === -1) {
          for (var j = y; j < y + h; j++) {
            const row = matrix[j];
            if (row) {
              for (var k = x; k < x + (w - valueW); k++) {
                row[k] = value;
              }
            }
          }
        }
      }
      return matrix;
    }

    function findItemsById(closeBlocks, items) {
      return items.filter(value => closeBlocks.indexOf(value.id) !== -1);
    }

    function adjustItem(matrix, item, items = [], cols) {
      const { w: width } = item;

      let valueW = item.responsive.valueW;
      for (var i = 0; i < matrix.length; i++) {
        const row = matrix[i];
        for (var j = 0; j < row.length; j++) {
          const empty = row.findIndex(val => val === undefined); // super dirty to check (empty for undefined)
          if (empty !== -1) {
            var z = row.slice(empty);
            var n = z.length;
            for (var x = 0; x < z.length; x++) {
              if (z[x] !== undefined) {
                n = x;
                break;
              }
            } // super dirty to check (empty for undefined)

            valueW = Math.max(width - n, 0);

            return {
              y: i,
              x: empty,
              responsive: { valueW },
            };
          }
        }
      }

      valueW = Math.max(width - cols, 0);
      return {
        y: getRowsCount(items),
        x: 0,
        responsive: { valueW },
      };
    }

    function resizeItems(items, col, rows = getRowsCount(items)) {
      let matrix = makeMatrix(rows, col);
      items.forEach((item, index) => {
        let ignore = items.slice(index + 1).map(val => val.id);
        let position = adjustItem(matrix, item, items, col);

        items = items.map(value => (value.id === item.id ? { ...item, ...position } : value));

        matrix = makeMatrixFromItemsIgnore(items, ignore, getRowsCount(items), col);
      });

      return items;
    }

    function getItemById(id, items) {
      const index = items.findIndex(value => value.id === id);

      return {
        index,
        item: items[index],
      };
    }

    function findFreeSpaceForItem(matrix, item, items = []) {
      const cols = matrix[0].length;
      let xNtime = cols - (item.w - item.responsive.valueW);

      for (var i = 0; i < matrix.length; i++) {
        const row = matrix[i];
        for (var j = 0; j < xNtime + 1; j++) {
          const sliceA = row.slice(j, j + (item.w - item.responsive.valueW));
          const empty = sliceA.every(val => val === undefined);
          if (empty) {
            const isEmpty = matrix.slice(i, i + item.h).every(a => a.slice(j, j + (item.w - item.responsive.valueW)).every(n => n === undefined));

            if (isEmpty) {
              return { y: i, x: j };
            }
          }
        }
      }

      return {
        y: getRowsCount(items),
        x: 0,
      };
    }

    function assignPosition(item, position, value) {
      return value.id === item.id ? { ...item, ...position } : value;
    }

    const replaceItem = (item, cachedItem, value) => (value.id === item.id ? cachedItem : value);

    function moveItem($item, items, cols, originalItem) {
      let matrix = makeMatrixFromItemsIgnore(items, [$item.id], getRowsCount(items), cols);

      const closeBlocks = findCloseBlocks(items, matrix, $item);
      let closeObj = findItemsById(closeBlocks, items);

      const statics = closeObj.find(value => value.static);

      if (statics) {
        if (originalItem) {
          return items.map(replaceItem.bind(null, $item, originalItem));
        }
      }

      matrix = makeMatrixFromItemsIgnore(items, closeBlocks, getRowsCount(items), cols);

      let tempItems = items;

      let tempCloseBlocks = closeBlocks;

      let exclude = [];

      closeObj.forEach(item => {
        let position = findFreeSpaceForItem(matrix, item, tempItems);

        exclude.push(item.id);

        if (position) {
          tempItems = tempItems.map(assignPosition.bind(null, item, position));
          let getIgnoreItems = tempCloseBlocks.filter(value => exclude.indexOf(value) === -1);

          matrix = makeMatrixFromItemsIgnore(tempItems, getIgnoreItems, getRowsCount(items), cols);
        }
      });

      return tempItems;
    }

    function getContainerHeight(items, yPerPx) {
      return Math.max(getRowsCount(items), 2) * yPerPx;
    }

    /* node_modules\svelte-grid\src\index.svelte generated by Svelte v3.19.2 */

    const { console: console_1, window: window_1 } = globals;
    const file = "node_modules\\svelte-grid\\src\\index.svelte";

    const get_default_slot_changes = dirty => ({
    	item: dirty[0] & /*items*/ 1,
    	index: dirty[0] & /*items*/ 1
    });

    const get_default_slot_context = ctx => ({
    	item: /*item*/ ctx[41],
    	index: /*i*/ ctx[43]
    });

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[41] = list[i];
    	child_ctx[43] = i;
    	return child_ctx;
    }

    // (58:10) {#if item.resizable}
    function create_if_block_1(ctx) {
    	let div;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svlt-grid-resizer svelte-14tbpr7");
    			add_location(div, file, 58, 12, 1827);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			dispose = [
    				listen_dev(
    					div,
    					"touchstart",
    					function () {
    						if (is_function(/*resizeOnMouseDown*/ ctx[10].bind(this, /*item*/ ctx[41].id))) /*resizeOnMouseDown*/ ctx[10].bind(this, /*item*/ ctx[41].id).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				),
    				listen_dev(
    					div,
    					"mousedown",
    					function () {
    						if (is_function(/*resizeOnMouseDown*/ ctx[10].bind(this, /*item*/ ctx[41].id))) /*resizeOnMouseDown*/ ctx[10].bind(this, /*item*/ ctx[41].id).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(58:10) {#if item.resizable}",
    		ctx
    	});

    	return block;
    }

    // (45:2) {#each items as item, i (item.id)}
    function create_each_block(key_1, ctx) {
    	let div;
    	let t;
    	let div_style_value;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[39].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[38], get_default_slot_context);
    	let if_block = /*item*/ ctx[41].resizable && create_if_block_1(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "svlt-grid-item svelte-14tbpr7");

    			attr_dev(div, "style", div_style_value = "" + ((/*useTransform*/ ctx[1]
    			? `transform: translate(${/*item*/ ctx[41].drag.dragging
				? /*item*/ ctx[41].drag.left
				: /*item*/ ctx[41].x * /*xPerPx*/ ctx[5] + /*gap*/ ctx[2]}px, ${/*item*/ ctx[41].drag.dragging
				? /*item*/ ctx[41].drag.top
				: /*item*/ ctx[41].y * /*yPerPx*/ ctx[8] + /*gap*/ ctx[2]}px);`
    			: "") + ";\n        " + (!/*useTransform*/ ctx[1]
    			? `top: ${/*item*/ ctx[41].drag.dragging
				? /*item*/ ctx[41].drag.top
				: /*item*/ ctx[41].y * /*yPerPx*/ ctx[8] + /*gap*/ ctx[2]}px`
    			: "") + ";\n        " + (!/*useTransform*/ ctx[1]
    			? `left: ${/*item*/ ctx[41].drag.dragging
				? /*item*/ ctx[41].drag.left
				: /*item*/ ctx[41].x * /*xPerPx*/ ctx[5] + /*gap*/ ctx[2]}px`
    			: "") + ";\n        width: " + (/*item*/ ctx[41].resize.resizing
    			? /*item*/ ctx[41].resize.width
    			: /*item*/ ctx[41].w * /*xPerPx*/ ctx[5] - /*gap*/ ctx[2] * 2 - /*item*/ ctx[41].responsive.valueW * /*xPerPx*/ ctx[5]) + "px;\n        height: " + (/*item*/ ctx[41].resize.resizing
    			? /*item*/ ctx[41].resize.height
    			: /*item*/ ctx[41].h * /*yPerPx*/ ctx[8] - /*gap*/ ctx[2] * 2) + "px;\n        z-index: " + (/*item*/ ctx[41].drag.dragging || /*item*/ ctx[41].resize.resizing
    			? 3
    			: 1) + ";\n        opacity: " + (/*item*/ ctx[41].resize.resizing ? 0.5 : 1)));

    			add_location(div, file, 46, 4, 805);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			dispose = [
    				listen_dev(
    					div,
    					"mousedown",
    					function () {
    						if (is_function(/*item*/ ctx[41].draggable
    						? /*dragOnMouseDown*/ ctx[11].bind(this, /*item*/ ctx[41].id)
    						: null)) (/*item*/ ctx[41].draggable
    						? /*dragOnMouseDown*/ ctx[11].bind(this, /*item*/ ctx[41].id)
    						: null).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				),
    				listen_dev(
    					div,
    					"touchstart",
    					function () {
    						if (is_function(/*item*/ ctx[41].draggable
    						? /*dragOnMouseDown*/ ctx[11].bind(this, /*item*/ ctx[41].id)
    						: null)) (/*item*/ ctx[41].draggable
    						? /*dragOnMouseDown*/ ctx[11].bind(this, /*item*/ ctx[41].id)
    						: null).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (default_slot && default_slot.p && dirty[0] & /*items*/ 1 | dirty[1] & /*$$scope*/ 128) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[38], get_default_slot_context), get_slot_changes(default_slot_template, /*$$scope*/ ctx[38], dirty, get_default_slot_changes));
    			}

    			if (/*item*/ ctx[41].resizable) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty[0] & /*useTransform, items, xPerPx, gap*/ 39 && div_style_value !== (div_style_value = "" + ((/*useTransform*/ ctx[1]
    			? `transform: translate(${/*item*/ ctx[41].drag.dragging
				? /*item*/ ctx[41].drag.left
				: /*item*/ ctx[41].x * /*xPerPx*/ ctx[5] + /*gap*/ ctx[2]}px, ${/*item*/ ctx[41].drag.dragging
				? /*item*/ ctx[41].drag.top
				: /*item*/ ctx[41].y * /*yPerPx*/ ctx[8] + /*gap*/ ctx[2]}px);`
    			: "") + ";\n        " + (!/*useTransform*/ ctx[1]
    			? `top: ${/*item*/ ctx[41].drag.dragging
				? /*item*/ ctx[41].drag.top
				: /*item*/ ctx[41].y * /*yPerPx*/ ctx[8] + /*gap*/ ctx[2]}px`
    			: "") + ";\n        " + (!/*useTransform*/ ctx[1]
    			? `left: ${/*item*/ ctx[41].drag.dragging
				? /*item*/ ctx[41].drag.left
				: /*item*/ ctx[41].x * /*xPerPx*/ ctx[5] + /*gap*/ ctx[2]}px`
    			: "") + ";\n        width: " + (/*item*/ ctx[41].resize.resizing
    			? /*item*/ ctx[41].resize.width
    			: /*item*/ ctx[41].w * /*xPerPx*/ ctx[5] - /*gap*/ ctx[2] * 2 - /*item*/ ctx[41].responsive.valueW * /*xPerPx*/ ctx[5]) + "px;\n        height: " + (/*item*/ ctx[41].resize.resizing
    			? /*item*/ ctx[41].resize.height
    			: /*item*/ ctx[41].h * /*yPerPx*/ ctx[8] - /*gap*/ ctx[2] * 2) + "px;\n        z-index: " + (/*item*/ ctx[41].drag.dragging || /*item*/ ctx[41].resize.resizing
    			? 3
    			: 1) + ";\n        opacity: " + (/*item*/ ctx[41].resize.resizing ? 0.5 : 1)))) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(45:2) {#each items as item, i (item.id)}",
    		ctx
    	});

    	return block;
    }

    // (69:2) {#if shadow.active}
    function create_if_block(ctx) {
    	let div;
    	let div_style_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svlt-grid-shadow svelte-14tbpr7");

    			attr_dev(div, "style", div_style_value = "" + ((/*useTransform*/ ctx[1]
    			? `transform: translate(${/*shadow*/ ctx[6].drag.dragging
				? /*shadow*/ ctx[6].drag.left
				: /*shadow*/ ctx[6].x * /*xPerPx*/ ctx[5] + /*gap*/ ctx[2]}px, ${/*shadow*/ ctx[6].drag.dragging
				? /*shadow*/ ctx[6].drag.top
				: /*shadow*/ ctx[6].y * /*yPerPx*/ ctx[8] + /*gap*/ ctx[2]}px);`
    			: "") + ";\n        " + (!/*useTransform*/ ctx[1]
    			? `top: ${/*shadow*/ ctx[6].drag.dragging
				? /*shadow*/ ctx[6].drag.top
				: /*shadow*/ ctx[6].y * /*yPerPx*/ ctx[8] + /*gap*/ ctx[2]}px`
    			: "") + ";\n        " + (!/*useTransform*/ ctx[1]
    			? `left: ${/*shadow*/ ctx[6].drag.dragging
				? /*shadow*/ ctx[6].drag.left
				: /*shadow*/ ctx[6].x * /*xPerPx*/ ctx[5] + /*gap*/ ctx[2]}px`
    			: "") + ";\n    width:" + (/*shadow*/ ctx[6].w * /*xPerPx*/ ctx[5] - /*gap*/ ctx[2] * 2 - /*shadow*/ ctx[6].responsive.valueW * /*xPerPx*/ ctx[5]) + "px;\n    height:" + (/*shadow*/ ctx[6].h * /*yPerPx*/ ctx[8] - /*gap*/ ctx[2] * 2) + "px;"));

    			add_location(div, file, 69, 4, 2071);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*useTransform, shadow, xPerPx, gap*/ 102 && div_style_value !== (div_style_value = "" + ((/*useTransform*/ ctx[1]
    			? `transform: translate(${/*shadow*/ ctx[6].drag.dragging
				? /*shadow*/ ctx[6].drag.left
				: /*shadow*/ ctx[6].x * /*xPerPx*/ ctx[5] + /*gap*/ ctx[2]}px, ${/*shadow*/ ctx[6].drag.dragging
				? /*shadow*/ ctx[6].drag.top
				: /*shadow*/ ctx[6].y * /*yPerPx*/ ctx[8] + /*gap*/ ctx[2]}px);`
    			: "") + ";\n        " + (!/*useTransform*/ ctx[1]
    			? `top: ${/*shadow*/ ctx[6].drag.dragging
				? /*shadow*/ ctx[6].drag.top
				: /*shadow*/ ctx[6].y * /*yPerPx*/ ctx[8] + /*gap*/ ctx[2]}px`
    			: "") + ";\n        " + (!/*useTransform*/ ctx[1]
    			? `left: ${/*shadow*/ ctx[6].drag.dragging
				? /*shadow*/ ctx[6].drag.left
				: /*shadow*/ ctx[6].x * /*xPerPx*/ ctx[5] + /*gap*/ ctx[2]}px`
    			: "") + ";\n    width:" + (/*shadow*/ ctx[6].w * /*xPerPx*/ ctx[5] - /*gap*/ ctx[2] * 2 - /*shadow*/ ctx[6].responsive.valueW * /*xPerPx*/ ctx[5]) + "px;\n    height:" + (/*shadow*/ ctx[6].h * /*yPerPx*/ ctx[8] - /*gap*/ ctx[2] * 2) + "px;"))) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(69:2) {#if shadow.active}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let current;
    	let dispose;
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*item*/ ctx[41].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	let if_block = /*shadow*/ ctx[6].active && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "svlt-grid-container svelte-14tbpr7");
    			set_style(div, "height", /*ch*/ ctx[7] + "px");
    			toggle_class(div, "svlt-grid-transition", !/*focuesdItem*/ ctx[4]);
    			add_location(div, file, 43, 0, 644);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    			/*div_binding*/ ctx[40](div);
    			current = true;
    			dispose = listen_dev(window_1, "resize", debounce(/*onResize*/ ctx[9], 300), false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*useTransform, items, xPerPx, gap, yPerPx, dragOnMouseDown, resizeOnMouseDown*/ 3367 | dirty[1] & /*$$scope*/ 128) {
    				const each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block, t, get_each_context);
    				check_outros();
    			}

    			if (/*shadow*/ ctx[6].active) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty[0] & /*ch*/ 128) {
    				set_style(div, "height", /*ch*/ ctx[7] + "px");
    			}

    			if (dirty[0] & /*focuesdItem*/ 16) {
    				toggle_class(div, "svlt-grid-transition", !/*focuesdItem*/ ctx[4]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (if_block) if_block.d();
    			/*div_binding*/ ctx[40](null);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { useTransform = false } = $$props;
    	let { items = [] } = $$props;
    	let { cols = 0 } = $$props;
    	let { dragDebounceMs = 350 } = $$props;
    	let { gap = 0 } = $$props;
    	let { rowHeight = 150 } = $$props;
    	let { breakpoints } = $$props;
    	let { fillEmpty = true } = $$props;

    	let container,
    		focuesdItem,
    		bound,
    		xPerPx,
    		currentItemIndex,
    		getComputedCols,
    		documentWidth,
    		resizeNoDynamicCalc,
    		yPerPx = rowHeight,
    		initCols = cols,
    		shadow = {
    			w: 0,
    			h: 0,
    			x: 0,
    			y: 0,
    			active: false,
    			id: null,
    			responsive: { valueW: 0 },
    			min: {},
    			max: {}
    		},
    		ch = getContainerHeight(items, yPerPx);

    	const dispatch = createEventDispatcher();
    	const getDocWidth = () => document.documentElement.clientWidth;

    	function onResize() {
    		let w = document.documentElement.clientWidth;

    		if (w !== documentWidth) {
    			documentWidth = w;
    			bound = container.getBoundingClientRect();
    			let getCols = getColumnFromBreakpoints(breakpoints, w, cols, initCols);
    			getComputedCols = getCols;
    			$$invalidate(5, xPerPx = bound.width / getCols);

    			dispatch("resize", {
    				cols: getCols,
    				xPerPx,
    				yPerPx, // same as rowHeight
    				
    			});

    			if (breakpoints) {
    				$$invalidate(0, items = resizeItems(items, getCols));
    			}
    		}
    	}

    	onMount(() => {
    		bound = container.getBoundingClientRect();
    		let getCols = getColumnFromBreakpoints(breakpoints, getDocWidth(), cols, initCols);
    		getComputedCols = getCols;
    		documentWidth = document.documentElement.clientWidth;

    		if (breakpoints) {
    			$$invalidate(0, items = resizeItems(items, getCols));
    		}

    		$$invalidate(5, xPerPx = bound.width / getCols);

    		dispatch("mount", {
    			cols: getCols,
    			xPerPx,
    			yPerPx, // same as rowHeight
    			
    		});
    	});

    	// resize
    	let resizeStartX, resizeStartY, resizeStartWidth, resizeStartHeight;

    	function resizeOnMouseDown(id, e) {
    		e.stopPropagation();
    		let { pageX, pageY } = getCordinates(e);
    		const { item, index } = getItemById(id, items);
    		currentItemIndex = index;
    		$$invalidate(4, focuesdItem = item);
    		cacheItem = { ...item };
    		resizeNoDynamicCalc = item.h + item.y === getRowsCount(items);

    		$$invalidate(6, shadow = {
    			...shadow,
    			...focuesdItem,
    			...{ active: true }
    		});

    		resizeStartX = pageX - bound.x;
    		resizeStartY = pageY - bound.y;
    		resizeStartWidth = item.w * xPerPx - gap * 2 - focuesdItem.responsive.valueW * xPerPx;
    		resizeStartHeight = item.h * yPerPx - gap * 2;
    		getComputedCols = getColumnFromBreakpoints(breakpoints, getDocWidth(), cols, initCols);
    		window.addEventListener("mousemove", resizeOnMouseMove, false);
    		window.addEventListener("touchmove", resizeOnMouseMove, false);
    		window.addEventListener("mouseup", resizeOnMouseUp, false);
    		window.addEventListener("touchend", resizeOnMouseUp, false);
    	}

    	function resizeOnMouseMove(e) {
    		let { pageX, pageY } = getCordinates(e);
    		pageX = pageX - bound.x;
    		pageY = pageY - bound.y;
    		const height = resizeStartHeight + pageY - resizeStartY;
    		const width = resizeStartWidth + (pageX - resizeStartX);
    		const { responsive: { valueW } } = focuesdItem;
    		let wRes = Math.round(width / xPerPx) + valueW;
    		const { h: minHeight = 1, w: minWidth = 1 } = focuesdItem.min;
    		const { h: maxHeight, w: maxWidth = getComputedCols - focuesdItem.x + valueW } = focuesdItem.max;
    		wRes = Math.min(Math.max(wRes, minWidth), maxWidth); /* min max*/
    		let hRes = Math.round(height / yPerPx);

    		if (maxHeight) {
    			hRes = Math.min(hRes, maxHeight);
    		}

    		hRes = Math.max(hRes, minHeight);
    		$$invalidate(6, shadow = { ...shadow, ...{ w: wRes, h: hRes } });
    		let assignItem = items[currentItemIndex];

    		$$invalidate(
    			0,
    			items[currentItemIndex] = {
    				...assignItem,
    				resize: { resizing: true, width, height },
    				w: wRes,
    				h: hRes
    			},
    			items
    		);

    		if (!resizeNoDynamicCalc) {
    			debounceRecalculateGridPosition();
    		}
    	}

    	function resizeOnMouseUp(e) {
    		e.stopPropagation();
    		let assignItem = items[currentItemIndex];

    		$$invalidate(
    			0,
    			items[currentItemIndex] = {
    				...assignItem,
    				resize: { resizing: false, width: 0, height: 0 }
    			},
    			items
    		);

    		window.removeEventListener("mousemove", resizeOnMouseMove, false);
    		window.removeEventListener("touchmove", resizeOnMouseMove, false);
    		window.removeEventListener("mouseup", resizeOnMouseUp, false);
    		window.removeEventListener("touchend", resizeOnMouseUp, false);

    		$$invalidate(6, shadow = {
    			...shadow,
    			...{
    				w: 0,
    				h: 0,
    				x: 0,
    				y: 0,
    				active: false,
    				id: null,
    				responsive: { valueW: 0 }
    			},
    			min: {},
    			max: {}
    		});

    		recalculateGridPosition();
    		$$invalidate(4, focuesdItem = undefined);
    		resizeNoDynamicCalc = false;
    	}

    	// drag
    	let dragX = 0, dragY = 0;

    	const debounceRecalculateGridPosition = debounce(recalculateGridPosition, dragDebounceMs);
    	let cacheItem = {};

    	function dragOnMouseDown(id, e) {
    		e.stopPropagation();
    		let { pageX, pageY } = getCordinates(e);
    		const { item, index } = getItemById(id, items);
    		currentItemIndex = index;
    		$$invalidate(4, focuesdItem = item);
    		cacheItem = { ...item };
    		$$invalidate(6, shadow = { ...shadow, ...item, active: true });
    		let { currentTarget } = e;
    		let offsetLeft, offsetTop;

    		if (useTransform) {
    			const { x, y } = getTranslate(currentTarget.style.transform);
    			offsetLeft = x;
    			offsetTop = y;
    		} else {
    			offsetLeft = currentTarget.offsetLeft;
    			offsetTop = currentTarget.offsetTop;
    		}

    		pageX = pageX - bound.x;
    		pageY = pageY - bound.y;
    		dragX = pageX - offsetLeft;
    		dragY = pageY - offsetTop;
    		getComputedCols = getColumnFromBreakpoints(breakpoints, getDocWidth(), cols, initCols);

    		if (item) {
    			window.addEventListener("mousemove", dragOnMove, false);
    			window.addEventListener("touchmove", dragOnMove, false);
    			window.addEventListener("mouseup", dragOnMouseUp, false);
    			window.addEventListener("touchend", dragOnMouseUp, false);
    		} else {
    			console.warn("Can not get item");
    		}
    	}

    	function dragOnMove(e) {
    		e.stopPropagation();
    		let { pageX, pageY } = getCordinates(e);
    		const y = pageY - bound.y;
    		const x = pageX - bound.x;
    		let xRes = Math.round((x - dragX) / xPerPx);
    		let yRes = Math.round((y - dragY) / yPerPx);
    		xRes = Math.max(Math.min(xRes, getComputedCols - (focuesdItem.w - focuesdItem.responsive.valueW)), 0);
    		yRes = Math.max(yRes, 0);
    		let assignItem = items[currentItemIndex];

    		$$invalidate(
    			0,
    			items[currentItemIndex] = {
    				...assignItem,
    				drag: {
    					dragging: true,
    					top: y - dragY,
    					left: x - dragX
    				},
    				x: xRes,
    				y: yRes
    			},
    			items
    		);

    		$$invalidate(6, shadow = { ...shadow, ...{ x: xRes, y: yRes } });
    		debounceRecalculateGridPosition();
    	}

    	function dragOnMouseUp(e) {
    		window.removeEventListener("mousemove", dragOnMove, false);
    		window.removeEventListener("touchmove", dragOnMove, false);
    		window.removeEventListener("mouseup", dragOnMouseUp, false);
    		window.removeEventListener("touchend", dragOnMouseUp, false);
    		let assignItem = items[currentItemIndex];

    		$$invalidate(
    			0,
    			items[currentItemIndex] = {
    				...assignItem,
    				drag: { dragging: false, top: 0, left: 0 }
    			},
    			items
    		);

    		dragX = 0;
    		dragY = 0;

    		$$invalidate(6, shadow = {
    			...shadow,
    			...{
    				w: 0,
    				h: 0,
    				x: 0,
    				y: 0,
    				active: false,
    				id: null
    			}
    		});

    		recalculateGridPosition();
    		$$invalidate(4, focuesdItem = undefined);
    	}

    	// Will work on this, need to make code cleaner
    	function recalculateGridPosition(action) {
    		const dragItem = items[currentItemIndex];
    		let getCols = getColumnFromBreakpoints(breakpoints, getDocWidth(), cols, initCols);
    		let result = moveItem(dragItem, items, getCols, cacheItem);

    		if (fillEmpty) {
    			result.forEach(value => {
    				if (value.id !== dragItem.id) {
    					result = result.map($val => $val.id === value.id
    					? {
    							...$val,
    							...findFreeSpaceForItem(makeMatrixFromItemsIgnore(result, [value.id], getRowsCount(result), getCols), value, result)
    						}
    					: $val);
    				}
    			});
    		}

    		$$invalidate(0, items = result);
    		dispatch("adjust", { focuesdItem: dragItem });
    	}

    	beforeUpdate(() => {
    		if (!focuesdItem) {
    			$$invalidate(7, ch = getContainerHeight(items, yPerPx));

    			if (cols !== initCols) {
    				if (bound) {
    					$$invalidate(5, xPerPx = bound.width / cols);
    					initCols = cols;
    				}
    			}
    		}
    	});

    	const writable_props = [
    		"useTransform",
    		"items",
    		"cols",
    		"dragDebounceMs",
    		"gap",
    		"rowHeight",
    		"breakpoints",
    		"fillEmpty"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Src> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Src", $$slots, ['default']);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, container = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("useTransform" in $$props) $$invalidate(1, useTransform = $$props.useTransform);
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("cols" in $$props) $$invalidate(12, cols = $$props.cols);
    		if ("dragDebounceMs" in $$props) $$invalidate(13, dragDebounceMs = $$props.dragDebounceMs);
    		if ("gap" in $$props) $$invalidate(2, gap = $$props.gap);
    		if ("rowHeight" in $$props) $$invalidate(14, rowHeight = $$props.rowHeight);
    		if ("breakpoints" in $$props) $$invalidate(15, breakpoints = $$props.breakpoints);
    		if ("fillEmpty" in $$props) $$invalidate(16, fillEmpty = $$props.fillEmpty);
    		if ("$$scope" in $$props) $$invalidate(38, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		beforeUpdate,
    		createEventDispatcher,
    		resizeItems,
    		getItemById,
    		moveItem,
    		findFreeSpaceForItem,
    		getContainerHeight,
    		debounce,
    		getRowsCount,
    		getColumnFromBreakpoints,
    		getCordinates,
    		getTranslate,
    		makeMatrixFromItemsIgnore,
    		useTransform,
    		items,
    		cols,
    		dragDebounceMs,
    		gap,
    		rowHeight,
    		breakpoints,
    		fillEmpty,
    		container,
    		focuesdItem,
    		bound,
    		xPerPx,
    		currentItemIndex,
    		getComputedCols,
    		documentWidth,
    		resizeNoDynamicCalc,
    		yPerPx,
    		initCols,
    		shadow,
    		ch,
    		dispatch,
    		getDocWidth,
    		onResize,
    		resizeStartX,
    		resizeStartY,
    		resizeStartWidth,
    		resizeStartHeight,
    		resizeOnMouseDown,
    		resizeOnMouseMove,
    		resizeOnMouseUp,
    		dragX,
    		dragY,
    		debounceRecalculateGridPosition,
    		cacheItem,
    		dragOnMouseDown,
    		dragOnMove,
    		dragOnMouseUp,
    		recalculateGridPosition
    	});

    	$$self.$inject_state = $$props => {
    		if ("useTransform" in $$props) $$invalidate(1, useTransform = $$props.useTransform);
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("cols" in $$props) $$invalidate(12, cols = $$props.cols);
    		if ("dragDebounceMs" in $$props) $$invalidate(13, dragDebounceMs = $$props.dragDebounceMs);
    		if ("gap" in $$props) $$invalidate(2, gap = $$props.gap);
    		if ("rowHeight" in $$props) $$invalidate(14, rowHeight = $$props.rowHeight);
    		if ("breakpoints" in $$props) $$invalidate(15, breakpoints = $$props.breakpoints);
    		if ("fillEmpty" in $$props) $$invalidate(16, fillEmpty = $$props.fillEmpty);
    		if ("container" in $$props) $$invalidate(3, container = $$props.container);
    		if ("focuesdItem" in $$props) $$invalidate(4, focuesdItem = $$props.focuesdItem);
    		if ("bound" in $$props) bound = $$props.bound;
    		if ("xPerPx" in $$props) $$invalidate(5, xPerPx = $$props.xPerPx);
    		if ("currentItemIndex" in $$props) currentItemIndex = $$props.currentItemIndex;
    		if ("getComputedCols" in $$props) getComputedCols = $$props.getComputedCols;
    		if ("documentWidth" in $$props) documentWidth = $$props.documentWidth;
    		if ("resizeNoDynamicCalc" in $$props) resizeNoDynamicCalc = $$props.resizeNoDynamicCalc;
    		if ("yPerPx" in $$props) $$invalidate(8, yPerPx = $$props.yPerPx);
    		if ("initCols" in $$props) initCols = $$props.initCols;
    		if ("shadow" in $$props) $$invalidate(6, shadow = $$props.shadow);
    		if ("ch" in $$props) $$invalidate(7, ch = $$props.ch);
    		if ("resizeStartX" in $$props) resizeStartX = $$props.resizeStartX;
    		if ("resizeStartY" in $$props) resizeStartY = $$props.resizeStartY;
    		if ("resizeStartWidth" in $$props) resizeStartWidth = $$props.resizeStartWidth;
    		if ("resizeStartHeight" in $$props) resizeStartHeight = $$props.resizeStartHeight;
    		if ("dragX" in $$props) dragX = $$props.dragX;
    		if ("dragY" in $$props) dragY = $$props.dragY;
    		if ("cacheItem" in $$props) cacheItem = $$props.cacheItem;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		items,
    		useTransform,
    		gap,
    		container,
    		focuesdItem,
    		xPerPx,
    		shadow,
    		ch,
    		yPerPx,
    		onResize,
    		resizeOnMouseDown,
    		dragOnMouseDown,
    		cols,
    		dragDebounceMs,
    		rowHeight,
    		breakpoints,
    		fillEmpty,
    		bound,
    		currentItemIndex,
    		getComputedCols,
    		documentWidth,
    		resizeNoDynamicCalc,
    		initCols,
    		resizeStartX,
    		resizeStartY,
    		resizeStartWidth,
    		resizeStartHeight,
    		dragX,
    		dragY,
    		cacheItem,
    		dispatch,
    		getDocWidth,
    		resizeOnMouseMove,
    		resizeOnMouseUp,
    		debounceRecalculateGridPosition,
    		dragOnMove,
    		dragOnMouseUp,
    		recalculateGridPosition,
    		$$scope,
    		$$slots,
    		div_binding
    	];
    }

    class Src extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance,
    			create_fragment,
    			safe_not_equal,
    			{
    				useTransform: 1,
    				items: 0,
    				cols: 12,
    				dragDebounceMs: 13,
    				gap: 2,
    				rowHeight: 14,
    				breakpoints: 15,
    				fillEmpty: 16
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Src",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*breakpoints*/ ctx[15] === undefined && !("breakpoints" in props)) {
    			console_1.warn("<Src> was created without expected prop 'breakpoints'");
    		}
    	}

    	get useTransform() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set useTransform(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get items() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cols() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cols(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dragDebounceMs() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dragDebounceMs(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gap() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gap(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rowHeight() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rowHeight(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get breakpoints() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set breakpoints(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fillEmpty() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fillEmpty(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function getRowsCount$1(items) {
      return Math.max(...items.map(val => val.y + val.h), 1);
    }

    const makeMatrix$1 = (rows, cols) => Array.from(Array(rows), () => new Array(cols)); // make 2d array

    function makeMatrixFromItems(items, _row = getRowsCount$1(items), _col) {
      let matrix = makeMatrix$1(_row, _col);
      for (var i = 0; i < items.length; i++) {
        const value = items[i];
        const {
          x,
          y,
          w,
          h,
          responsive: { valueW },
        } = value;

        for (var j = y; j < y + h; j++) {
          const row = matrix[j];
          for (var k = x; k < x + (w - valueW); k++) {
            row[k] = value;
          }
        }
      }
      return matrix;
    }

    function findCloseBlocks$1(items, matrix, curObject) {
      const {
        w,
        h,
        x,
        y,
        responsive: { valueW },
      } = curObject;
      const tempR = matrix.slice(y, y + h);
      let result = []; // new Set()
      for (var i = 0; i < tempR.length; i++) {
        let tempA = tempR[i].slice(x, x + (w - valueW));
        result = [...result, ...tempA.map(val => val && val.id).filter(val => val)];
      }
      return [...result.filter((item, pos) => result.indexOf(item) == pos)];
      // return [...new Set(result)];
    }

    function makeMatrixFromItemsIgnore$1(
      items,
      ignoreList,
      _row, //= getRowsCount(items)
      _col,
    ) {
      let matrix = makeMatrix$1(_row, _col);
      for (var i = 0; i < items.length; i++) {
        const value = items[i];
        const {
          x,
          y,
          w,
          h,
          id,
          responsive: { valueW },
        } = value;

        if (ignoreList.indexOf(id) === -1) {
          for (var j = y; j < y + h; j++) {
            const row = matrix[j];
            if (row) {
              for (var k = x; k < x + (w - valueW); k++) {
                row[k] = value;
              }
            }
          }
        }
      }
      return matrix;
    }

    function findItemsById$1(closeBlocks, items) {
      return items.filter(value => closeBlocks.indexOf(value.id) !== -1);
    }

    function adjustItem$1(matrix, item, items = [], cols) {
      const { w: width } = item;

      let valueW = item.responsive.valueW;
      for (var i = 0; i < matrix.length; i++) {
        const row = matrix[i];
        for (var j = 0; j < row.length; j++) {
          const empty = row.findIndex(val => val === undefined); // super dirty to check (empty for undefined)
          if (empty !== -1) {
            var z = row.slice(empty);
            var n = z.length;
            for (var x = 0; x < z.length; x++) {
              if (z[x] !== undefined) {
                n = x;
                break;
              }
            } // super dirty to check (empty for undefined)

            valueW = Math.max(width - n, 0);

            return {
              y: i,
              x: empty,
              responsive: { valueW },
            };
          }
        }
      }

      valueW = Math.max(width - cols, 0);
      return {
        y: getRowsCount$1(items),
        x: 0,
        responsive: { valueW },
      };
    }

    function resizeItems$1(items, col, rows = getRowsCount$1(items)) {
      let matrix = makeMatrix$1(rows, col);
      items.forEach((item, index) => {
        let ignore = items.slice(index + 1).map(val => val.id);
        let position = adjustItem$1(matrix, item, items, col);

        items = items.map(value => (value.id === item.id ? { ...item, ...position } : value));

        matrix = makeMatrixFromItemsIgnore$1(items, ignore, getRowsCount$1(items), col);
      });

      return items;
    }

    function findFreeSpaceForItem$1(matrix, item, items = []) {
      const cols = matrix[0].length;
      let xNtime = cols - (item.w - item.responsive.valueW);

      for (var i = 0; i < matrix.length; i++) {
        const row = matrix[i];
        for (var j = 0; j < xNtime + 1; j++) {
          const sliceA = row.slice(j, j + (item.w - item.responsive.valueW));
          const empty = sliceA.every(val => val === undefined);
          if (empty) {
            const isEmpty = matrix.slice(i, i + item.h).every(a => a.slice(j, j + (item.w - item.responsive.valueW)).every(n => n === undefined));

            if (isEmpty) {
              return { y: i, x: j };
            }
          }
        }
      }

      return {
        y: getRowsCount$1(items),
        x: 0,
      };
    }

    function assignPosition$1(item, position, value) {
      return value.id === item.id ? { ...item, ...position } : value;
    }

    const replaceItem$1 = (item, cachedItem, value) => (value.id === item.id ? cachedItem : value);

    function moveItem$1($item, items, cols, originalItem) {
      let matrix = makeMatrixFromItemsIgnore$1(items, [$item.id], getRowsCount$1(items), cols);

      const closeBlocks = findCloseBlocks$1(items, matrix, $item);
      let closeObj = findItemsById$1(closeBlocks, items);

      const statics = closeObj.find(value => value.static);

      if (statics) {
        if (originalItem) {
          return items.map(replaceItem$1.bind(null, $item, originalItem));
        }
      }

      matrix = makeMatrixFromItemsIgnore$1(items, closeBlocks, getRowsCount$1(items), cols);

      let tempItems = items;

      let tempCloseBlocks = closeBlocks;

      let exclude = [];

      closeObj.forEach(item => {
        let position = findFreeSpaceForItem$1(matrix, item, tempItems);

        exclude.push(item.id);

        if (position) {
          tempItems = tempItems.map(assignPosition$1.bind(null, item, position));
          let getIgnoreItems = tempCloseBlocks.filter(value => exclude.indexOf(value) === -1);

          matrix = makeMatrixFromItemsIgnore$1(tempItems, getIgnoreItems, getRowsCount$1(items), cols);
        }
      });

      return tempItems;
    }

    function makeItem(item) {
      return {
        drag: {
          top: null,
          left: null,
          dragging: false,
        },
        resize: {
          width: null,
          height: null,
          resizing: false,
        },
        responsive: {
          valueW: 0,
        },
        static: false,
        resizable: !item.static,
        draggable: !item.static,
        min: { ...item.min },
        max: { ...item.max },
        ...item,
      };
    }

    const gridHelp = {
      findSpaceForItem(item, items, cols) {
        let matrix = makeMatrixFromItems(items, getRowsCount$1(items), cols);

        let position = findFreeSpaceForItem$1(matrix, item, items);
        return position;
      },

      appendItem(item, items, cols) {
        return moveItem$1(item, [...items, ...[item]], cols);
      },

      resizeItems(items, col, rows) {
        return resizeItems$1(items, col, rows);
      },

      item(obj) {
        return makeItem(obj);
      },
    };

    /* src\Components\Header.svelte generated by Svelte v3.19.2 */

    const file$1 = "src\\Components\\Header.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let div;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			div.textContent = "My diary";
    			attr_dev(div, "class", "title svelte-lw5yxh");
    			add_location(div, file$1, 1, 2, 10);
    			attr_dev(main, "class", "svelte-lw5yxh");
    			add_location(main, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Header", $$slots, []);
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\Components\Card.svelte generated by Svelte v3.19.2 */
    const file$2 = "src\\Components\\Card.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let t2;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(/*date*/ ctx[1]);
    			attr_dev(div0, "class", "title svelte-1bfcnag");
    			add_location(div0, file$2, 63, 4, 1566);
    			attr_dev(div1, "class", "date svelte-1bfcnag");
    			add_location(div1, file$2, 64, 4, 1604);
    			attr_dev(div2, "class", "svelte-1bfcnag");
    			add_location(div2, file$2, 62, 2, 1555);
    			set_style(main, "background-color", /*background*/ ctx[2]);
    			set_style(main, "background-image", "url('" + /*texture*/ ctx[4] + "')");
    			set_style(main, "color", /*color*/ ctx[3]);
    			set_style(main, "opacity", /*opacity*/ ctx[5]);
    			attr_dev(main, "class", "svelte-1bfcnag");
    			add_location(main, file$2, 61, 0, 1322);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);

    			dispose = [
    				listen_dev(main, "touchend", /*stopClicking*/ ctx[7], false, false, false),
    				listen_dev(main, "touchstart", /*startClicking*/ ctx[6], false, false, false),
    				listen_dev(main, "mouseup", /*stopClicking*/ ctx[7], false, false, false),
    				listen_dev(main, "mousedown", /*startClicking*/ ctx[6], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
    			if (dirty & /*date*/ 2) set_data_dev(t2, /*date*/ ctx[1]);

    			if (dirty & /*background*/ 4) {
    				set_style(main, "background-color", /*background*/ ctx[2]);
    			}

    			if (dirty & /*texture*/ 16) {
    				set_style(main, "background-image", "url('" + /*texture*/ ctx[4] + "')");
    			}

    			if (dirty & /*color*/ 8) {
    				set_style(main, "color", /*color*/ ctx[3]);
    			}

    			if (dirty & /*opacity*/ 32) {
    				set_style(main, "opacity", /*opacity*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function isRightClick(e) {
    	e = e || window.event;
    	if ("which" in e) return e.which == 3; else if ("button" in e) return e.button == 2;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { title = "Hello world!" } = $$props;
    	let { date = new Date().toLocaleDateString() } = $$props;
    	let { id = -1 } = $$props;
    	let { background = "#0097a7" } = $$props;
    	let { color = "#fff" } = $$props;
    	let { texture = "" } = $$props;
    	let opacity = 1;
    	let interval;
    	let isClick = true;

    	window.oncontextmenu = function () {
    		return false;
    	};

    	function click() {
    		dispatch("click", { id });
    	}

    	function startClicking(event) {
    		//event.preventDefault();
    		$$invalidate(5, opacity = 0.6);

    		interval = setTimeout(
    			function () {
    				isClick = false;
    				$$invalidate(5, opacity = 1);

    				setTimeout(
    					() => {
    						isClick = true;
    					},
    					1000
    				);

    				dispatch("longpress", { id, title });
    			},
    			500
    		);
    	}

    	function stopClicking(event) {
    		//event.preventDefault();
    		$$invalidate(5, opacity = 1);

    		clearTimeout(interval);

    		if (isClick) {
    			if (isRightClick(event)) dispatch("contextmenu", { id, title }); else click();
    		}

    		isClick = true;
    	}

    	const writable_props = ["title", "date", "id", "background", "color", "texture"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Card", $$slots, []);

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("date" in $$props) $$invalidate(1, date = $$props.date);
    		if ("id" in $$props) $$invalidate(8, id = $$props.id);
    		if ("background" in $$props) $$invalidate(2, background = $$props.background);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("texture" in $$props) $$invalidate(4, texture = $$props.texture);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		title,
    		date,
    		id,
    		background,
    		color,
    		texture,
    		opacity,
    		interval,
    		isClick,
    		click,
    		startClicking,
    		stopClicking,
    		isRightClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("date" in $$props) $$invalidate(1, date = $$props.date);
    		if ("id" in $$props) $$invalidate(8, id = $$props.id);
    		if ("background" in $$props) $$invalidate(2, background = $$props.background);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("texture" in $$props) $$invalidate(4, texture = $$props.texture);
    		if ("opacity" in $$props) $$invalidate(5, opacity = $$props.opacity);
    		if ("interval" in $$props) interval = $$props.interval;
    		if ("isClick" in $$props) isClick = $$props.isClick;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		title,
    		date,
    		background,
    		color,
    		texture,
    		opacity,
    		startClicking,
    		stopClicking,
    		id
    	];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			title: 0,
    			date: 1,
    			id: 8,
    			background: 2,
    			color: 3,
    			texture: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get title() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get date() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get background() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set background(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get texture() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set texture(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\ImageElement.svelte generated by Svelte v3.19.2 */

    const file$3 = "src\\Components\\ImageElement.svelte";

    // (8:0) {#if src !== ""}
    function create_if_block$1(ctx) {
    	let main;
    	let img;
    	let img_src_value;
    	let t;
    	let if_block = /*text*/ ctx[2] !== "" && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			img = element("img");
    			t = space();
    			if (if_block) if_block.c();
    			if (img.src !== (img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*alt*/ ctx[1]);
    			set_style(img, "width", /*width*/ ctx[3]);
    			attr_dev(img, "class", "svelte-bamkjn");
    			add_location(img, file$3, 9, 4, 159);
    			attr_dev(main, "class", "svelte-bamkjn");
    			add_location(main, file$3, 8, 2, 147);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, img);
    			append_dev(main, t);
    			if (if_block) if_block.m(main, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*src*/ 1 && img.src !== (img_src_value = /*src*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*alt*/ 2) {
    				attr_dev(img, "alt", /*alt*/ ctx[1]);
    			}

    			if (dirty & /*width*/ 8) {
    				set_style(img, "width", /*width*/ ctx[3]);
    			}

    			if (/*text*/ ctx[2] !== "") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(8:0) {#if src !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (11:4) {#if text !== ""}
    function create_if_block_1$1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*text*/ ctx[2]);
    			attr_dev(div, "class", "svelte-bamkjn");
    			add_location(div, file$3, 11, 6, 238);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*text*/ 4) set_data_dev(t, /*text*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(11:4) {#if text !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let if_block = /*src*/ ctx[0] !== "" && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*src*/ ctx[0] !== "") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { src = "" } = $$props;
    	let { alt = "" } = $$props;
    	let { text = "" } = $$props;
    	let { width = "128px" } = $$props;
    	const writable_props = ["src", "alt", "text", "width"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageElement> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ImageElement", $$slots, []);

    	$$self.$set = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("alt" in $$props) $$invalidate(1, alt = $$props.alt);
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    	};

    	$$self.$capture_state = () => ({ src, alt, text, width });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("alt" in $$props) $$invalidate(1, alt = $$props.alt);
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src, alt, text, width];
    }

    class ImageElement extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { src: 0, alt: 1, text: 2, width: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageElement",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get src() {
    		throw new Error("<ImageElement>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<ImageElement>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get alt() {
    		throw new Error("<ImageElement>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set alt(value) {
    		throw new Error("<ImageElement>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<ImageElement>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<ImageElement>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<ImageElement>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<ImageElement>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Fab.svelte generated by Svelte v3.19.2 */
    const file$4 = "src\\Components\\Fab.svelte";

    function create_fragment$4(ctx) {
    	let link;
    	let t0;
    	let main;
    	let i;
    	let t1;
    	let dispose;

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			main = element("main");
    			i = element("i");
    			t1 = text(/*icon*/ ctx[0]);
    			attr_dev(link, "href", "https://fonts.googleapis.com/icon?family=Material+Icons");
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "class", "svelte-1p7y3z0");
    			add_location(link, file$4, 1, 2, 17);
    			set_style(i, "color", /*color*/ ctx[3]);
    			set_style(i, "font-size", /*fontSize*/ ctx[4]);
    			attr_dev(i, "class", "material-icons svelte-1p7y3z0");
    			add_location(i, file$4, 50, 2, 1242);
    			set_style(main, "position", /*positionType*/ ctx[5], 1);
    			set_style(main, "background-color", /*background*/ ctx[1]);
    			set_style(main, "box-shadow", "0 3px 6px " + /*shadow*/ ctx[2]);
    			set_style(main, "top", /*top*/ ctx[6]);
    			set_style(main, "bottom", /*bottom*/ ctx[9]);
    			set_style(main, "left", /*left*/ ctx[7]);
    			set_style(main, "right", /*right*/ ctx[8]);
    			attr_dev(main, "class", "svelte-1p7y3z0");
    			add_location(main, file$4, 49, 0, 1050);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, i);
    			append_dev(i, t1);
    			dispose = listen_dev(main, "click", /*click*/ ctx[10], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*icon*/ 1) set_data_dev(t1, /*icon*/ ctx[0]);

    			if (dirty & /*color*/ 8) {
    				set_style(i, "color", /*color*/ ctx[3]);
    			}

    			if (dirty & /*fontSize*/ 16) {
    				set_style(i, "font-size", /*fontSize*/ ctx[4]);
    			}

    			if (dirty & /*positionType*/ 32) {
    				set_style(main, "position", /*positionType*/ ctx[5], 1);
    			}

    			if (dirty & /*background*/ 2) {
    				set_style(main, "background-color", /*background*/ ctx[1]);
    			}

    			if (dirty & /*shadow*/ 4) {
    				set_style(main, "box-shadow", "0 3px 6px " + /*shadow*/ ctx[2]);
    			}

    			if (dirty & /*top*/ 64) {
    				set_style(main, "top", /*top*/ ctx[6]);
    			}

    			if (dirty & /*bottom*/ 512) {
    				set_style(main, "bottom", /*bottom*/ ctx[9]);
    			}

    			if (dirty & /*left*/ 128) {
    				set_style(main, "left", /*left*/ ctx[7]);
    			}

    			if (dirty & /*right*/ 256) {
    				set_style(main, "right", /*right*/ ctx[8]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { icon = "face" } = $$props;
    	let { background = "#000" } = $$props;
    	let { shadow = "#bdbdbd" } = $$props;
    	let { color = "#fff" } = $$props;
    	let { margin = "32px" } = $$props;
    	let { fontSize = "24px" } = $$props;
    	let { positionType = "absolute" } = $$props;
    	let { position = "bottom-right" } = $$props;
    	let top = "auto";
    	let left = "auto";
    	let right = "auto";
    	let bottom = "auto";

    	switch (position) {
    		case "top-left":
    			{
    				top = margin;
    				left = margin;
    				break;
    			}
    		case "bottom-left":
    			{
    				bottom = margin;
    				left = margin;
    				break;
    			}
    		case "top-right":
    			{
    				top = margin;
    				right = margin;
    				break;
    			}
    		default:
    			{
    				bottom = margin;
    				right = margin;
    				break;
    			}
    	}

    	function click() {
    		dispatch("click", {});
    	}

    	const writable_props = [
    		"icon",
    		"background",
    		"shadow",
    		"color",
    		"margin",
    		"fontSize",
    		"positionType",
    		"position"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Fab> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Fab", $$slots, []);

    	$$self.$set = $$props => {
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("background" in $$props) $$invalidate(1, background = $$props.background);
    		if ("shadow" in $$props) $$invalidate(2, shadow = $$props.shadow);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("margin" in $$props) $$invalidate(11, margin = $$props.margin);
    		if ("fontSize" in $$props) $$invalidate(4, fontSize = $$props.fontSize);
    		if ("positionType" in $$props) $$invalidate(5, positionType = $$props.positionType);
    		if ("position" in $$props) $$invalidate(12, position = $$props.position);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		icon,
    		background,
    		shadow,
    		color,
    		margin,
    		fontSize,
    		positionType,
    		position,
    		top,
    		left,
    		right,
    		bottom,
    		click
    	});

    	$$self.$inject_state = $$props => {
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("background" in $$props) $$invalidate(1, background = $$props.background);
    		if ("shadow" in $$props) $$invalidate(2, shadow = $$props.shadow);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("margin" in $$props) $$invalidate(11, margin = $$props.margin);
    		if ("fontSize" in $$props) $$invalidate(4, fontSize = $$props.fontSize);
    		if ("positionType" in $$props) $$invalidate(5, positionType = $$props.positionType);
    		if ("position" in $$props) $$invalidate(12, position = $$props.position);
    		if ("top" in $$props) $$invalidate(6, top = $$props.top);
    		if ("left" in $$props) $$invalidate(7, left = $$props.left);
    		if ("right" in $$props) $$invalidate(8, right = $$props.right);
    		if ("bottom" in $$props) $$invalidate(9, bottom = $$props.bottom);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		icon,
    		background,
    		shadow,
    		color,
    		fontSize,
    		positionType,
    		top,
    		left,
    		right,
    		bottom,
    		click,
    		margin,
    		position
    	];
    }

    class Fab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			icon: 0,
    			background: 1,
    			shadow: 2,
    			color: 3,
    			margin: 11,
    			fontSize: 4,
    			positionType: 5,
    			position: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fab",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get icon() {
    		throw new Error("<Fab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Fab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get background() {
    		throw new Error("<Fab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set background(value) {
    		throw new Error("<Fab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shadow() {
    		throw new Error("<Fab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shadow(value) {
    		throw new Error("<Fab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Fab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Fab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get margin() {
    		throw new Error("<Fab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set margin(value) {
    		throw new Error("<Fab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fontSize() {
    		throw new Error("<Fab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fontSize(value) {
    		throw new Error("<Fab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get positionType() {
    		throw new Error("<Fab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set positionType(value) {
    		throw new Error("<Fab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<Fab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<Fab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\ContextualMenu.svelte generated by Svelte v3.19.2 */
    const file$5 = "src\\Components\\ContextualMenu.svelte";

    function create_fragment$5(ctx) {
    	let main;
    	let div5;
    	let div0;
    	let t0;
    	let t1;
    	let div4;
    	let div1;
    	let span0;
    	let t3;
    	let div2;
    	let span1;
    	let t5;
    	let div3;
    	let span2;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div5 = element("div");
    			div0 = element("div");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			div4 = element("div");
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "Read this page";
    			t3 = space();
    			div2 = element("div");
    			span1 = element("span");
    			span1.textContent = "Change something";
    			t5 = space();
    			div3 = element("div");
    			span2 = element("span");
    			span2.textContent = "Destroy this page";
    			attr_dev(div0, "class", "title svelte-1fc26uh");
    			add_location(div0, file$5, 56, 4, 1145);
    			attr_dev(span0, "class", "svelte-1fc26uh");
    			add_location(span0, file$5, 59, 8, 1242);
    			attr_dev(div1, "class", "svelte-1fc26uh");
    			add_location(div1, file$5, 58, 6, 1211);
    			attr_dev(span1, "class", "svelte-1fc26uh");
    			add_location(span1, file$5, 62, 8, 1324);
    			attr_dev(div2, "class", "svelte-1fc26uh");
    			add_location(div2, file$5, 61, 6, 1291);
    			attr_dev(span2, "class", "svelte-1fc26uh");
    			add_location(span2, file$5, 65, 8, 1409);
    			attr_dev(div3, "class", "svelte-1fc26uh");
    			add_location(div3, file$5, 64, 6, 1375);
    			attr_dev(div4, "class", "option svelte-1fc26uh");
    			add_location(div4, file$5, 57, 4, 1183);
    			attr_dev(div5, "class", "dialog svelte-1fc26uh");
    			add_location(div5, file$5, 55, 2, 1119);
    			attr_dev(main, "class", "svelte-1fc26uh");
    			add_location(main, file$5, 54, 0, 1039);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div5);
    			append_dev(div5, div0);
    			append_dev(div0, t0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, span0);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div2, span1);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, span2);

    			dispose = [
    				listen_dev(div1, "click", /*open*/ ctx[2], false, false, false),
    				listen_dev(div2, "click", /*modify*/ ctx[3], false, false, false),
    				listen_dev(div3, "click", /*destroy*/ ctx[4], false, false, false),
    				listen_dev(main, "touchend", /*stopClicking*/ ctx[5], { passive: true }, false, false),
    				listen_dev(main, "mouseup", /*stopClicking*/ ctx[5], false, false, false),
    				listen_dev(main, "click", /*close*/ ctx[1], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function isMain(e) {
    	return e.target.localName === "main";
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { id = null } = $$props;
    	let { context = null } = $$props;
    	let { title = "What's next?" } = $$props;
    	let isRealClick = false;

    	function close(event) {
    		if (context && isMain(event) && isRealClick) context.$destroy();
    		isRealClick = true;
    	}

    	function open() {
    		if (isRealClick) {
    			dispatch("open", { id });
    			if (context) context.$destroy();
    		}

    		isRealClick = true;
    	}

    	function modify() {
    		if (isRealClick) {
    			dispatch("modify", { id });
    			if (context) context.$destroy();
    		}

    		isRealClick = true;
    	}

    	function destroy() {
    		if (isRealClick) {
    			dispatch("destroy", { id });
    			if (context) context.$destroy();
    		}

    		isRealClick = true;
    	}

    	function stopClicking() {
    		isRealClick = true;
    	}

    	const writable_props = ["id", "context", "title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ContextualMenu> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ContextualMenu", $$slots, []);

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(6, id = $$props.id);
    		if ("context" in $$props) $$invalidate(7, context = $$props.context);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		id,
    		context,
    		title,
    		isRealClick,
    		close,
    		open,
    		modify,
    		destroy,
    		isMain,
    		stopClicking
    	});

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(6, id = $$props.id);
    		if ("context" in $$props) $$invalidate(7, context = $$props.context);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("isRealClick" in $$props) isRealClick = $$props.isRealClick;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, close, open, modify, destroy, stopClicking, id, context];
    }

    class ContextualMenu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { id: 6, context: 7, title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ContextualMenu",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get id() {
    		throw new Error("<ContextualMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<ContextualMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get context() {
    		throw new Error("<ContextualMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set context(value) {
    		throw new Error("<ContextualMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<ContextualMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ContextualMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var quill = createCommonjsModule(function (module, exports) {
    /*!
     * Quill Editor v1.3.7
     * https://quilljs.com/
     * Copyright (c) 2014, Jason Chen
     * Copyright (c) 2013, salesforce.com
     */
    (function webpackUniversalModuleDefinition(root, factory) {
    	module.exports = factory();
    })(typeof self !== 'undefined' ? self : commonjsGlobal, function() {
    return /******/ (function(modules) { // webpackBootstrap
    /******/ 	// The module cache
    /******/ 	var installedModules = {};
    /******/
    /******/ 	// The require function
    /******/ 	function __webpack_require__(moduleId) {
    /******/
    /******/ 		// Check if module is in cache
    /******/ 		if(installedModules[moduleId]) {
    /******/ 			return installedModules[moduleId].exports;
    /******/ 		}
    /******/ 		// Create a new module (and put it into the cache)
    /******/ 		var module = installedModules[moduleId] = {
    /******/ 			i: moduleId,
    /******/ 			l: false,
    /******/ 			exports: {}
    /******/ 		};
    /******/
    /******/ 		// Execute the module function
    /******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    /******/
    /******/ 		// Flag the module as loaded
    /******/ 		module.l = true;
    /******/
    /******/ 		// Return the exports of the module
    /******/ 		return module.exports;
    /******/ 	}
    /******/
    /******/
    /******/ 	// expose the modules object (__webpack_modules__)
    /******/ 	__webpack_require__.m = modules;
    /******/
    /******/ 	// expose the module cache
    /******/ 	__webpack_require__.c = installedModules;
    /******/
    /******/ 	// define getter function for harmony exports
    /******/ 	__webpack_require__.d = function(exports, name, getter) {
    /******/ 		if(!__webpack_require__.o(exports, name)) {
    /******/ 			Object.defineProperty(exports, name, {
    /******/ 				configurable: false,
    /******/ 				enumerable: true,
    /******/ 				get: getter
    /******/ 			});
    /******/ 		}
    /******/ 	};
    /******/
    /******/ 	// getDefaultExport function for compatibility with non-harmony modules
    /******/ 	__webpack_require__.n = function(module) {
    /******/ 		var getter = module && module.__esModule ?
    /******/ 			function getDefault() { return module['default']; } :
    /******/ 			function getModuleExports() { return module; };
    /******/ 		__webpack_require__.d(getter, 'a', getter);
    /******/ 		return getter;
    /******/ 	};
    /******/
    /******/ 	// Object.prototype.hasOwnProperty.call
    /******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
    /******/
    /******/ 	// __webpack_public_path__
    /******/ 	__webpack_require__.p = "";
    /******/
    /******/ 	// Load entry module and return exports
    /******/ 	return __webpack_require__(__webpack_require__.s = 109);
    /******/ })
    /************************************************************************/
    /******/ ([
    /* 0 */
    /***/ (function(module, exports, __webpack_require__) {

    Object.defineProperty(exports, "__esModule", { value: true });
    var container_1 = __webpack_require__(17);
    var format_1 = __webpack_require__(18);
    var leaf_1 = __webpack_require__(19);
    var scroll_1 = __webpack_require__(45);
    var inline_1 = __webpack_require__(46);
    var block_1 = __webpack_require__(47);
    var embed_1 = __webpack_require__(48);
    var text_1 = __webpack_require__(49);
    var attributor_1 = __webpack_require__(12);
    var class_1 = __webpack_require__(32);
    var style_1 = __webpack_require__(33);
    var store_1 = __webpack_require__(31);
    var Registry = __webpack_require__(1);
    var Parchment = {
        Scope: Registry.Scope,
        create: Registry.create,
        find: Registry.find,
        query: Registry.query,
        register: Registry.register,
        Container: container_1.default,
        Format: format_1.default,
        Leaf: leaf_1.default,
        Embed: embed_1.default,
        Scroll: scroll_1.default,
        Block: block_1.default,
        Inline: inline_1.default,
        Text: text_1.default,
        Attributor: {
            Attribute: attributor_1.default,
            Class: class_1.default,
            Style: style_1.default,
            Store: store_1.default,
        },
    };
    exports.default = Parchment;


    /***/ }),
    /* 1 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var ParchmentError = /** @class */ (function (_super) {
        __extends(ParchmentError, _super);
        function ParchmentError(message) {
            var _this = this;
            message = '[Parchment] ' + message;
            _this = _super.call(this, message) || this;
            _this.message = message;
            _this.name = _this.constructor.name;
            return _this;
        }
        return ParchmentError;
    }(Error));
    exports.ParchmentError = ParchmentError;
    var attributes = {};
    var classes = {};
    var tags = {};
    var types = {};
    exports.DATA_KEY = '__blot';
    var Scope;
    (function (Scope) {
        Scope[Scope["TYPE"] = 3] = "TYPE";
        Scope[Scope["LEVEL"] = 12] = "LEVEL";
        Scope[Scope["ATTRIBUTE"] = 13] = "ATTRIBUTE";
        Scope[Scope["BLOT"] = 14] = "BLOT";
        Scope[Scope["INLINE"] = 7] = "INLINE";
        Scope[Scope["BLOCK"] = 11] = "BLOCK";
        Scope[Scope["BLOCK_BLOT"] = 10] = "BLOCK_BLOT";
        Scope[Scope["INLINE_BLOT"] = 6] = "INLINE_BLOT";
        Scope[Scope["BLOCK_ATTRIBUTE"] = 9] = "BLOCK_ATTRIBUTE";
        Scope[Scope["INLINE_ATTRIBUTE"] = 5] = "INLINE_ATTRIBUTE";
        Scope[Scope["ANY"] = 15] = "ANY";
    })(Scope = exports.Scope || (exports.Scope = {}));
    function create(input, value) {
        var match = query(input);
        if (match == null) {
            throw new ParchmentError("Unable to create " + input + " blot");
        }
        var BlotClass = match;
        var node = 
        // @ts-ignore
        input instanceof Node || input['nodeType'] === Node.TEXT_NODE ? input : BlotClass.create(value);
        return new BlotClass(node, value);
    }
    exports.create = create;
    function find(node, bubble) {
        if (bubble === void 0) { bubble = false; }
        if (node == null)
            return null;
        // @ts-ignore
        if (node[exports.DATA_KEY] != null)
            return node[exports.DATA_KEY].blot;
        if (bubble)
            return find(node.parentNode, bubble);
        return null;
    }
    exports.find = find;
    function query(query, scope) {
        if (scope === void 0) { scope = Scope.ANY; }
        var match;
        if (typeof query === 'string') {
            match = types[query] || attributes[query];
            // @ts-ignore
        }
        else if (query instanceof Text || query['nodeType'] === Node.TEXT_NODE) {
            match = types['text'];
        }
        else if (typeof query === 'number') {
            if (query & Scope.LEVEL & Scope.BLOCK) {
                match = types['block'];
            }
            else if (query & Scope.LEVEL & Scope.INLINE) {
                match = types['inline'];
            }
        }
        else if (query instanceof HTMLElement) {
            var names = (query.getAttribute('class') || '').split(/\s+/);
            for (var i in names) {
                match = classes[names[i]];
                if (match)
                    break;
            }
            match = match || tags[query.tagName];
        }
        if (match == null)
            return null;
        // @ts-ignore
        if (scope & Scope.LEVEL & match.scope && scope & Scope.TYPE & match.scope)
            return match;
        return null;
    }
    exports.query = query;
    function register() {
        var Definitions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            Definitions[_i] = arguments[_i];
        }
        if (Definitions.length > 1) {
            return Definitions.map(function (d) {
                return register(d);
            });
        }
        var Definition = Definitions[0];
        if (typeof Definition.blotName !== 'string' && typeof Definition.attrName !== 'string') {
            throw new ParchmentError('Invalid definition');
        }
        else if (Definition.blotName === 'abstract') {
            throw new ParchmentError('Cannot register abstract class');
        }
        types[Definition.blotName || Definition.attrName] = Definition;
        if (typeof Definition.keyName === 'string') {
            attributes[Definition.keyName] = Definition;
        }
        else {
            if (Definition.className != null) {
                classes[Definition.className] = Definition;
            }
            if (Definition.tagName != null) {
                if (Array.isArray(Definition.tagName)) {
                    Definition.tagName = Definition.tagName.map(function (tagName) {
                        return tagName.toUpperCase();
                    });
                }
                else {
                    Definition.tagName = Definition.tagName.toUpperCase();
                }
                var tagNames = Array.isArray(Definition.tagName) ? Definition.tagName : [Definition.tagName];
                tagNames.forEach(function (tag) {
                    if (tags[tag] == null || Definition.className == null) {
                        tags[tag] = Definition;
                    }
                });
            }
        }
        return Definition;
    }
    exports.register = register;


    /***/ }),
    /* 2 */
    /***/ (function(module, exports, __webpack_require__) {

    var diff = __webpack_require__(51);
    var equal = __webpack_require__(11);
    var extend = __webpack_require__(3);
    var op = __webpack_require__(20);


    var NULL_CHARACTER = String.fromCharCode(0);  // Placeholder char for embed in diff()


    var Delta = function (ops) {
      // Assume we are given a well formed ops
      if (Array.isArray(ops)) {
        this.ops = ops;
      } else if (ops != null && Array.isArray(ops.ops)) {
        this.ops = ops.ops;
      } else {
        this.ops = [];
      }
    };


    Delta.prototype.insert = function (text, attributes) {
      var newOp = {};
      if (text.length === 0) return this;
      newOp.insert = text;
      if (attributes != null && typeof attributes === 'object' && Object.keys(attributes).length > 0) {
        newOp.attributes = attributes;
      }
      return this.push(newOp);
    };

    Delta.prototype['delete'] = function (length) {
      if (length <= 0) return this;
      return this.push({ 'delete': length });
    };

    Delta.prototype.retain = function (length, attributes) {
      if (length <= 0) return this;
      var newOp = { retain: length };
      if (attributes != null && typeof attributes === 'object' && Object.keys(attributes).length > 0) {
        newOp.attributes = attributes;
      }
      return this.push(newOp);
    };

    Delta.prototype.push = function (newOp) {
      var index = this.ops.length;
      var lastOp = this.ops[index - 1];
      newOp = extend(true, {}, newOp);
      if (typeof lastOp === 'object') {
        if (typeof newOp['delete'] === 'number' && typeof lastOp['delete'] === 'number') {
          this.ops[index - 1] = { 'delete': lastOp['delete'] + newOp['delete'] };
          return this;
        }
        // Since it does not matter if we insert before or after deleting at the same index,
        // always prefer to insert first
        if (typeof lastOp['delete'] === 'number' && newOp.insert != null) {
          index -= 1;
          lastOp = this.ops[index - 1];
          if (typeof lastOp !== 'object') {
            this.ops.unshift(newOp);
            return this;
          }
        }
        if (equal(newOp.attributes, lastOp.attributes)) {
          if (typeof newOp.insert === 'string' && typeof lastOp.insert === 'string') {
            this.ops[index - 1] = { insert: lastOp.insert + newOp.insert };
            if (typeof newOp.attributes === 'object') this.ops[index - 1].attributes = newOp.attributes;
            return this;
          } else if (typeof newOp.retain === 'number' && typeof lastOp.retain === 'number') {
            this.ops[index - 1] = { retain: lastOp.retain + newOp.retain };
            if (typeof newOp.attributes === 'object') this.ops[index - 1].attributes = newOp.attributes;
            return this;
          }
        }
      }
      if (index === this.ops.length) {
        this.ops.push(newOp);
      } else {
        this.ops.splice(index, 0, newOp);
      }
      return this;
    };

    Delta.prototype.chop = function () {
      var lastOp = this.ops[this.ops.length - 1];
      if (lastOp && lastOp.retain && !lastOp.attributes) {
        this.ops.pop();
      }
      return this;
    };

    Delta.prototype.filter = function (predicate) {
      return this.ops.filter(predicate);
    };

    Delta.prototype.forEach = function (predicate) {
      this.ops.forEach(predicate);
    };

    Delta.prototype.map = function (predicate) {
      return this.ops.map(predicate);
    };

    Delta.prototype.partition = function (predicate) {
      var passed = [], failed = [];
      this.forEach(function(op) {
        var target = predicate(op) ? passed : failed;
        target.push(op);
      });
      return [passed, failed];
    };

    Delta.prototype.reduce = function (predicate, initial) {
      return this.ops.reduce(predicate, initial);
    };

    Delta.prototype.changeLength = function () {
      return this.reduce(function (length, elem) {
        if (elem.insert) {
          return length + op.length(elem);
        } else if (elem.delete) {
          return length - elem.delete;
        }
        return length;
      }, 0);
    };

    Delta.prototype.length = function () {
      return this.reduce(function (length, elem) {
        return length + op.length(elem);
      }, 0);
    };

    Delta.prototype.slice = function (start, end) {
      start = start || 0;
      if (typeof end !== 'number') end = Infinity;
      var ops = [];
      var iter = op.iterator(this.ops);
      var index = 0;
      while (index < end && iter.hasNext()) {
        var nextOp;
        if (index < start) {
          nextOp = iter.next(start - index);
        } else {
          nextOp = iter.next(end - index);
          ops.push(nextOp);
        }
        index += op.length(nextOp);
      }
      return new Delta(ops);
    };


    Delta.prototype.compose = function (other) {
      var thisIter = op.iterator(this.ops);
      var otherIter = op.iterator(other.ops);
      var ops = [];
      var firstOther = otherIter.peek();
      if (firstOther != null && typeof firstOther.retain === 'number' && firstOther.attributes == null) {
        var firstLeft = firstOther.retain;
        while (thisIter.peekType() === 'insert' && thisIter.peekLength() <= firstLeft) {
          firstLeft -= thisIter.peekLength();
          ops.push(thisIter.next());
        }
        if (firstOther.retain - firstLeft > 0) {
          otherIter.next(firstOther.retain - firstLeft);
        }
      }
      var delta = new Delta(ops);
      while (thisIter.hasNext() || otherIter.hasNext()) {
        if (otherIter.peekType() === 'insert') {
          delta.push(otherIter.next());
        } else if (thisIter.peekType() === 'delete') {
          delta.push(thisIter.next());
        } else {
          var length = Math.min(thisIter.peekLength(), otherIter.peekLength());
          var thisOp = thisIter.next(length);
          var otherOp = otherIter.next(length);
          if (typeof otherOp.retain === 'number') {
            var newOp = {};
            if (typeof thisOp.retain === 'number') {
              newOp.retain = length;
            } else {
              newOp.insert = thisOp.insert;
            }
            // Preserve null when composing with a retain, otherwise remove it for inserts
            var attributes = op.attributes.compose(thisOp.attributes, otherOp.attributes, typeof thisOp.retain === 'number');
            if (attributes) newOp.attributes = attributes;
            delta.push(newOp);

            // Optimization if rest of other is just retain
            if (!otherIter.hasNext() && equal(delta.ops[delta.ops.length - 1], newOp)) {
              var rest = new Delta(thisIter.rest());
              return delta.concat(rest).chop();
            }

          // Other op should be delete, we could be an insert or retain
          // Insert + delete cancels out
          } else if (typeof otherOp['delete'] === 'number' && typeof thisOp.retain === 'number') {
            delta.push(otherOp);
          }
        }
      }
      return delta.chop();
    };

    Delta.prototype.concat = function (other) {
      var delta = new Delta(this.ops.slice());
      if (other.ops.length > 0) {
        delta.push(other.ops[0]);
        delta.ops = delta.ops.concat(other.ops.slice(1));
      }
      return delta;
    };

    Delta.prototype.diff = function (other, index) {
      if (this.ops === other.ops) {
        return new Delta();
      }
      var strings = [this, other].map(function (delta) {
        return delta.map(function (op) {
          if (op.insert != null) {
            return typeof op.insert === 'string' ? op.insert : NULL_CHARACTER;
          }
          var prep = (delta === other) ? 'on' : 'with';
          throw new Error('diff() called ' + prep + ' non-document');
        }).join('');
      });
      var delta = new Delta();
      var diffResult = diff(strings[0], strings[1], index);
      var thisIter = op.iterator(this.ops);
      var otherIter = op.iterator(other.ops);
      diffResult.forEach(function (component) {
        var length = component[1].length;
        while (length > 0) {
          var opLength = 0;
          switch (component[0]) {
            case diff.INSERT:
              opLength = Math.min(otherIter.peekLength(), length);
              delta.push(otherIter.next(opLength));
              break;
            case diff.DELETE:
              opLength = Math.min(length, thisIter.peekLength());
              thisIter.next(opLength);
              delta['delete'](opLength);
              break;
            case diff.EQUAL:
              opLength = Math.min(thisIter.peekLength(), otherIter.peekLength(), length);
              var thisOp = thisIter.next(opLength);
              var otherOp = otherIter.next(opLength);
              if (equal(thisOp.insert, otherOp.insert)) {
                delta.retain(opLength, op.attributes.diff(thisOp.attributes, otherOp.attributes));
              } else {
                delta.push(otherOp)['delete'](opLength);
              }
              break;
          }
          length -= opLength;
        }
      });
      return delta.chop();
    };

    Delta.prototype.eachLine = function (predicate, newline) {
      newline = newline || '\n';
      var iter = op.iterator(this.ops);
      var line = new Delta();
      var i = 0;
      while (iter.hasNext()) {
        if (iter.peekType() !== 'insert') return;
        var thisOp = iter.peek();
        var start = op.length(thisOp) - iter.peekLength();
        var index = typeof thisOp.insert === 'string' ?
          thisOp.insert.indexOf(newline, start) - start : -1;
        if (index < 0) {
          line.push(iter.next());
        } else if (index > 0) {
          line.push(iter.next(index));
        } else {
          if (predicate(line, iter.next(1).attributes || {}, i) === false) {
            return;
          }
          i += 1;
          line = new Delta();
        }
      }
      if (line.length() > 0) {
        predicate(line, {}, i);
      }
    };

    Delta.prototype.transform = function (other, priority) {
      priority = !!priority;
      if (typeof other === 'number') {
        return this.transformPosition(other, priority);
      }
      var thisIter = op.iterator(this.ops);
      var otherIter = op.iterator(other.ops);
      var delta = new Delta();
      while (thisIter.hasNext() || otherIter.hasNext()) {
        if (thisIter.peekType() === 'insert' && (priority || otherIter.peekType() !== 'insert')) {
          delta.retain(op.length(thisIter.next()));
        } else if (otherIter.peekType() === 'insert') {
          delta.push(otherIter.next());
        } else {
          var length = Math.min(thisIter.peekLength(), otherIter.peekLength());
          var thisOp = thisIter.next(length);
          var otherOp = otherIter.next(length);
          if (thisOp['delete']) {
            // Our delete either makes their delete redundant or removes their retain
            continue;
          } else if (otherOp['delete']) {
            delta.push(otherOp);
          } else {
            // We retain either their retain or insert
            delta.retain(length, op.attributes.transform(thisOp.attributes, otherOp.attributes, priority));
          }
        }
      }
      return delta.chop();
    };

    Delta.prototype.transformPosition = function (index, priority) {
      priority = !!priority;
      var thisIter = op.iterator(this.ops);
      var offset = 0;
      while (thisIter.hasNext() && offset <= index) {
        var length = thisIter.peekLength();
        var nextType = thisIter.peekType();
        thisIter.next();
        if (nextType === 'delete') {
          index -= Math.min(length, index - offset);
          continue;
        } else if (nextType === 'insert' && (offset < index || !priority)) {
          index += length;
        }
        offset += length;
      }
      return index;
    };


    module.exports = Delta;


    /***/ }),
    /* 3 */
    /***/ (function(module, exports) {

    var hasOwn = Object.prototype.hasOwnProperty;
    var toStr = Object.prototype.toString;
    var defineProperty = Object.defineProperty;
    var gOPD = Object.getOwnPropertyDescriptor;

    var isArray = function isArray(arr) {
    	if (typeof Array.isArray === 'function') {
    		return Array.isArray(arr);
    	}

    	return toStr.call(arr) === '[object Array]';
    };

    var isPlainObject = function isPlainObject(obj) {
    	if (!obj || toStr.call(obj) !== '[object Object]') {
    		return false;
    	}

    	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
    	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
    	// Not own constructor property must be Object
    	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
    		return false;
    	}

    	// Own properties are enumerated firstly, so to speed up,
    	// if last one is own, then all properties are own.
    	var key;
    	for (key in obj) { /**/ }

    	return typeof key === 'undefined' || hasOwn.call(obj, key);
    };

    // If name is '__proto__', and Object.defineProperty is available, define __proto__ as an own property on target
    var setProperty = function setProperty(target, options) {
    	if (defineProperty && options.name === '__proto__') {
    		defineProperty(target, options.name, {
    			enumerable: true,
    			configurable: true,
    			value: options.newValue,
    			writable: true
    		});
    	} else {
    		target[options.name] = options.newValue;
    	}
    };

    // Return undefined instead of __proto__ if '__proto__' is not an own property
    var getProperty = function getProperty(obj, name) {
    	if (name === '__proto__') {
    		if (!hasOwn.call(obj, name)) {
    			return void 0;
    		} else if (gOPD) {
    			// In early versions of node, obj['__proto__'] is buggy when obj has
    			// __proto__ as an own property. Object.getOwnPropertyDescriptor() works.
    			return gOPD(obj, name).value;
    		}
    	}

    	return obj[name];
    };

    module.exports = function extend() {
    	var options, name, src, copy, copyIsArray, clone;
    	var target = arguments[0];
    	var i = 1;
    	var length = arguments.length;
    	var deep = false;

    	// Handle a deep copy situation
    	if (typeof target === 'boolean') {
    		deep = target;
    		target = arguments[1] || {};
    		// skip the boolean and the target
    		i = 2;
    	}
    	if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
    		target = {};
    	}

    	for (; i < length; ++i) {
    		options = arguments[i];
    		// Only deal with non-null/undefined values
    		if (options != null) {
    			// Extend the base object
    			for (name in options) {
    				src = getProperty(target, name);
    				copy = getProperty(options, name);

    				// Prevent never-ending loop
    				if (target !== copy) {
    					// Recurse if we're merging plain objects or arrays
    					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
    						if (copyIsArray) {
    							copyIsArray = false;
    							clone = src && isArray(src) ? src : [];
    						} else {
    							clone = src && isPlainObject(src) ? src : {};
    						}

    						// Never move original objects, clone them
    						setProperty(target, { name: name, newValue: extend(deep, clone, copy) });

    					// Don't bring in undefined values
    					} else if (typeof copy !== 'undefined') {
    						setProperty(target, { name: name, newValue: copy });
    					}
    				}
    			}
    		}
    	}

    	// Return the modified object
    	return target;
    };


    /***/ }),
    /* 4 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.BlockEmbed = exports.bubbleFormats = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _extend = __webpack_require__(3);

    var _extend2 = _interopRequireDefault(_extend);

    var _quillDelta = __webpack_require__(2);

    var _quillDelta2 = _interopRequireDefault(_quillDelta);

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _break = __webpack_require__(16);

    var _break2 = _interopRequireDefault(_break);

    var _inline = __webpack_require__(6);

    var _inline2 = _interopRequireDefault(_inline);

    var _text = __webpack_require__(7);

    var _text2 = _interopRequireDefault(_text);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var NEWLINE_LENGTH = 1;

    var BlockEmbed = function (_Parchment$Embed) {
      _inherits(BlockEmbed, _Parchment$Embed);

      function BlockEmbed() {
        _classCallCheck(this, BlockEmbed);

        return _possibleConstructorReturn(this, (BlockEmbed.__proto__ || Object.getPrototypeOf(BlockEmbed)).apply(this, arguments));
      }

      _createClass(BlockEmbed, [{
        key: 'attach',
        value: function attach() {
          _get(BlockEmbed.prototype.__proto__ || Object.getPrototypeOf(BlockEmbed.prototype), 'attach', this).call(this);
          this.attributes = new _parchment2.default.Attributor.Store(this.domNode);
        }
      }, {
        key: 'delta',
        value: function delta() {
          return new _quillDelta2.default().insert(this.value(), (0, _extend2.default)(this.formats(), this.attributes.values()));
        }
      }, {
        key: 'format',
        value: function format(name, value) {
          var attribute = _parchment2.default.query(name, _parchment2.default.Scope.BLOCK_ATTRIBUTE);
          if (attribute != null) {
            this.attributes.attribute(attribute, value);
          }
        }
      }, {
        key: 'formatAt',
        value: function formatAt(index, length, name, value) {
          this.format(name, value);
        }
      }, {
        key: 'insertAt',
        value: function insertAt(index, value, def) {
          if (typeof value === 'string' && value.endsWith('\n')) {
            var block = _parchment2.default.create(Block.blotName);
            this.parent.insertBefore(block, index === 0 ? this : this.next);
            block.insertAt(0, value.slice(0, -1));
          } else {
            _get(BlockEmbed.prototype.__proto__ || Object.getPrototypeOf(BlockEmbed.prototype), 'insertAt', this).call(this, index, value, def);
          }
        }
      }]);

      return BlockEmbed;
    }(_parchment2.default.Embed);

    BlockEmbed.scope = _parchment2.default.Scope.BLOCK_BLOT;
    // It is important for cursor behavior BlockEmbeds use tags that are block level elements


    var Block = function (_Parchment$Block) {
      _inherits(Block, _Parchment$Block);

      function Block(domNode) {
        _classCallCheck(this, Block);

        var _this2 = _possibleConstructorReturn(this, (Block.__proto__ || Object.getPrototypeOf(Block)).call(this, domNode));

        _this2.cache = {};
        return _this2;
      }

      _createClass(Block, [{
        key: 'delta',
        value: function delta() {
          if (this.cache.delta == null) {
            this.cache.delta = this.descendants(_parchment2.default.Leaf).reduce(function (delta, leaf) {
              if (leaf.length() === 0) {
                return delta;
              } else {
                return delta.insert(leaf.value(), bubbleFormats(leaf));
              }
            }, new _quillDelta2.default()).insert('\n', bubbleFormats(this));
          }
          return this.cache.delta;
        }
      }, {
        key: 'deleteAt',
        value: function deleteAt(index, length) {
          _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'deleteAt', this).call(this, index, length);
          this.cache = {};
        }
      }, {
        key: 'formatAt',
        value: function formatAt(index, length, name, value) {
          if (length <= 0) return;
          if (_parchment2.default.query(name, _parchment2.default.Scope.BLOCK)) {
            if (index + length === this.length()) {
              this.format(name, value);
            }
          } else {
            _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'formatAt', this).call(this, index, Math.min(length, this.length() - index - 1), name, value);
          }
          this.cache = {};
        }
      }, {
        key: 'insertAt',
        value: function insertAt(index, value, def) {
          if (def != null) return _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'insertAt', this).call(this, index, value, def);
          if (value.length === 0) return;
          var lines = value.split('\n');
          var text = lines.shift();
          if (text.length > 0) {
            if (index < this.length() - 1 || this.children.tail == null) {
              _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'insertAt', this).call(this, Math.min(index, this.length() - 1), text);
            } else {
              this.children.tail.insertAt(this.children.tail.length(), text);
            }
            this.cache = {};
          }
          var block = this;
          lines.reduce(function (index, line) {
            block = block.split(index, true);
            block.insertAt(0, line);
            return line.length;
          }, index + text.length);
        }
      }, {
        key: 'insertBefore',
        value: function insertBefore(blot, ref) {
          var head = this.children.head;
          _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'insertBefore', this).call(this, blot, ref);
          if (head instanceof _break2.default) {
            head.remove();
          }
          this.cache = {};
        }
      }, {
        key: 'length',
        value: function length() {
          if (this.cache.length == null) {
            this.cache.length = _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'length', this).call(this) + NEWLINE_LENGTH;
          }
          return this.cache.length;
        }
      }, {
        key: 'moveChildren',
        value: function moveChildren(target, ref) {
          _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'moveChildren', this).call(this, target, ref);
          this.cache = {};
        }
      }, {
        key: 'optimize',
        value: function optimize(context) {
          _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'optimize', this).call(this, context);
          this.cache = {};
        }
      }, {
        key: 'path',
        value: function path(index) {
          return _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'path', this).call(this, index, true);
        }
      }, {
        key: 'removeChild',
        value: function removeChild(child) {
          _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'removeChild', this).call(this, child);
          this.cache = {};
        }
      }, {
        key: 'split',
        value: function split(index) {
          var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

          if (force && (index === 0 || index >= this.length() - NEWLINE_LENGTH)) {
            var clone = this.clone();
            if (index === 0) {
              this.parent.insertBefore(clone, this);
              return this;
            } else {
              this.parent.insertBefore(clone, this.next);
              return clone;
            }
          } else {
            var next = _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'split', this).call(this, index, force);
            this.cache = {};
            return next;
          }
        }
      }]);

      return Block;
    }(_parchment2.default.Block);

    Block.blotName = 'block';
    Block.tagName = 'P';
    Block.defaultChild = 'break';
    Block.allowedChildren = [_inline2.default, _parchment2.default.Embed, _text2.default];

    function bubbleFormats(blot) {
      var formats = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (blot == null) return formats;
      if (typeof blot.formats === 'function') {
        formats = (0, _extend2.default)(formats, blot.formats());
      }
      if (blot.parent == null || blot.parent.blotName == 'scroll' || blot.parent.statics.scope !== blot.statics.scope) {
        return formats;
      }
      return bubbleFormats(blot.parent, formats);
    }

    exports.bubbleFormats = bubbleFormats;
    exports.BlockEmbed = BlockEmbed;
    exports.default = Block;

    /***/ }),
    /* 5 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.overload = exports.expandConfig = undefined;

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    __webpack_require__(50);

    var _quillDelta = __webpack_require__(2);

    var _quillDelta2 = _interopRequireDefault(_quillDelta);

    var _editor = __webpack_require__(14);

    var _editor2 = _interopRequireDefault(_editor);

    var _emitter3 = __webpack_require__(8);

    var _emitter4 = _interopRequireDefault(_emitter3);

    var _module = __webpack_require__(9);

    var _module2 = _interopRequireDefault(_module);

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _selection = __webpack_require__(15);

    var _selection2 = _interopRequireDefault(_selection);

    var _extend = __webpack_require__(3);

    var _extend2 = _interopRequireDefault(_extend);

    var _logger = __webpack_require__(10);

    var _logger2 = _interopRequireDefault(_logger);

    var _theme = __webpack_require__(34);

    var _theme2 = _interopRequireDefault(_theme);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var debug = (0, _logger2.default)('quill');

    var Quill = function () {
      _createClass(Quill, null, [{
        key: 'debug',
        value: function debug(limit) {
          if (limit === true) {
            limit = 'log';
          }
          _logger2.default.level(limit);
        }
      }, {
        key: 'find',
        value: function find(node) {
          return node.__quill || _parchment2.default.find(node);
        }
      }, {
        key: 'import',
        value: function _import(name) {
          if (this.imports[name] == null) {
            debug.error('Cannot import ' + name + '. Are you sure it was registered?');
          }
          return this.imports[name];
        }
      }, {
        key: 'register',
        value: function register(path, target) {
          var _this = this;

          var overwrite = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

          if (typeof path !== 'string') {
            var name = path.attrName || path.blotName;
            if (typeof name === 'string') {
              // register(Blot | Attributor, overwrite)
              this.register('formats/' + name, path, target);
            } else {
              Object.keys(path).forEach(function (key) {
                _this.register(key, path[key], target);
              });
            }
          } else {
            if (this.imports[path] != null && !overwrite) {
              debug.warn('Overwriting ' + path + ' with', target);
            }
            this.imports[path] = target;
            if ((path.startsWith('blots/') || path.startsWith('formats/')) && target.blotName !== 'abstract') {
              _parchment2.default.register(target);
            } else if (path.startsWith('modules') && typeof target.register === 'function') {
              target.register();
            }
          }
        }
      }]);

      function Quill(container) {
        var _this2 = this;

        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, Quill);

        this.options = expandConfig(container, options);
        this.container = this.options.container;
        if (this.container == null) {
          return debug.error('Invalid Quill container', container);
        }
        if (this.options.debug) {
          Quill.debug(this.options.debug);
        }
        var html = this.container.innerHTML.trim();
        this.container.classList.add('ql-container');
        this.container.innerHTML = '';
        this.container.__quill = this;
        this.root = this.addContainer('ql-editor');
        this.root.classList.add('ql-blank');
        this.root.setAttribute('data-gramm', false);
        this.scrollingContainer = this.options.scrollingContainer || this.root;
        this.emitter = new _emitter4.default();
        this.scroll = _parchment2.default.create(this.root, {
          emitter: this.emitter,
          whitelist: this.options.formats
        });
        this.editor = new _editor2.default(this.scroll);
        this.selection = new _selection2.default(this.scroll, this.emitter);
        this.theme = new this.options.theme(this, this.options);
        this.keyboard = this.theme.addModule('keyboard');
        this.clipboard = this.theme.addModule('clipboard');
        this.history = this.theme.addModule('history');
        this.theme.init();
        this.emitter.on(_emitter4.default.events.EDITOR_CHANGE, function (type) {
          if (type === _emitter4.default.events.TEXT_CHANGE) {
            _this2.root.classList.toggle('ql-blank', _this2.editor.isBlank());
          }
        });
        this.emitter.on(_emitter4.default.events.SCROLL_UPDATE, function (source, mutations) {
          var range = _this2.selection.lastRange;
          var index = range && range.length === 0 ? range.index : undefined;
          modify.call(_this2, function () {
            return _this2.editor.update(null, mutations, index);
          }, source);
        });
        var contents = this.clipboard.convert('<div class=\'ql-editor\' style="white-space: normal;">' + html + '<p><br></p></div>');
        this.setContents(contents);
        this.history.clear();
        if (this.options.placeholder) {
          this.root.setAttribute('data-placeholder', this.options.placeholder);
        }
        if (this.options.readOnly) {
          this.disable();
        }
      }

      _createClass(Quill, [{
        key: 'addContainer',
        value: function addContainer(container) {
          var refNode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

          if (typeof container === 'string') {
            var className = container;
            container = document.createElement('div');
            container.classList.add(className);
          }
          this.container.insertBefore(container, refNode);
          return container;
        }
      }, {
        key: 'blur',
        value: function blur() {
          this.selection.setRange(null);
        }
      }, {
        key: 'deleteText',
        value: function deleteText(index, length, source) {
          var _this3 = this;

          var _overload = overload(index, length, source);

          var _overload2 = _slicedToArray(_overload, 4);

          index = _overload2[0];
          length = _overload2[1];
          source = _overload2[3];

          return modify.call(this, function () {
            return _this3.editor.deleteText(index, length);
          }, source, index, -1 * length);
        }
      }, {
        key: 'disable',
        value: function disable() {
          this.enable(false);
        }
      }, {
        key: 'enable',
        value: function enable() {
          var enabled = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

          this.scroll.enable(enabled);
          this.container.classList.toggle('ql-disabled', !enabled);
        }
      }, {
        key: 'focus',
        value: function focus() {
          var scrollTop = this.scrollingContainer.scrollTop;
          this.selection.focus();
          this.scrollingContainer.scrollTop = scrollTop;
          this.scrollIntoView();
        }
      }, {
        key: 'format',
        value: function format(name, value) {
          var _this4 = this;

          var source = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _emitter4.default.sources.API;

          return modify.call(this, function () {
            var range = _this4.getSelection(true);
            var change = new _quillDelta2.default();
            if (range == null) {
              return change;
            } else if (_parchment2.default.query(name, _parchment2.default.Scope.BLOCK)) {
              change = _this4.editor.formatLine(range.index, range.length, _defineProperty({}, name, value));
            } else if (range.length === 0) {
              _this4.selection.format(name, value);
              return change;
            } else {
              change = _this4.editor.formatText(range.index, range.length, _defineProperty({}, name, value));
            }
            _this4.setSelection(range, _emitter4.default.sources.SILENT);
            return change;
          }, source);
        }
      }, {
        key: 'formatLine',
        value: function formatLine(index, length, name, value, source) {
          var _this5 = this;

          var formats = void 0;

          var _overload3 = overload(index, length, name, value, source);

          var _overload4 = _slicedToArray(_overload3, 4);

          index = _overload4[0];
          length = _overload4[1];
          formats = _overload4[2];
          source = _overload4[3];

          return modify.call(this, function () {
            return _this5.editor.formatLine(index, length, formats);
          }, source, index, 0);
        }
      }, {
        key: 'formatText',
        value: function formatText(index, length, name, value, source) {
          var _this6 = this;

          var formats = void 0;

          var _overload5 = overload(index, length, name, value, source);

          var _overload6 = _slicedToArray(_overload5, 4);

          index = _overload6[0];
          length = _overload6[1];
          formats = _overload6[2];
          source = _overload6[3];

          return modify.call(this, function () {
            return _this6.editor.formatText(index, length, formats);
          }, source, index, 0);
        }
      }, {
        key: 'getBounds',
        value: function getBounds(index) {
          var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

          var bounds = void 0;
          if (typeof index === 'number') {
            bounds = this.selection.getBounds(index, length);
          } else {
            bounds = this.selection.getBounds(index.index, index.length);
          }
          var containerBounds = this.container.getBoundingClientRect();
          return {
            bottom: bounds.bottom - containerBounds.top,
            height: bounds.height,
            left: bounds.left - containerBounds.left,
            right: bounds.right - containerBounds.left,
            top: bounds.top - containerBounds.top,
            width: bounds.width
          };
        }
      }, {
        key: 'getContents',
        value: function getContents() {
          var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.getLength() - index;

          var _overload7 = overload(index, length);

          var _overload8 = _slicedToArray(_overload7, 2);

          index = _overload8[0];
          length = _overload8[1];

          return this.editor.getContents(index, length);
        }
      }, {
        key: 'getFormat',
        value: function getFormat() {
          var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.getSelection(true);
          var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

          if (typeof index === 'number') {
            return this.editor.getFormat(index, length);
          } else {
            return this.editor.getFormat(index.index, index.length);
          }
        }
      }, {
        key: 'getIndex',
        value: function getIndex(blot) {
          return blot.offset(this.scroll);
        }
      }, {
        key: 'getLength',
        value: function getLength() {
          return this.scroll.length();
        }
      }, {
        key: 'getLeaf',
        value: function getLeaf(index) {
          return this.scroll.leaf(index);
        }
      }, {
        key: 'getLine',
        value: function getLine(index) {
          return this.scroll.line(index);
        }
      }, {
        key: 'getLines',
        value: function getLines() {
          var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Number.MAX_VALUE;

          if (typeof index !== 'number') {
            return this.scroll.lines(index.index, index.length);
          } else {
            return this.scroll.lines(index, length);
          }
        }
      }, {
        key: 'getModule',
        value: function getModule(name) {
          return this.theme.modules[name];
        }
      }, {
        key: 'getSelection',
        value: function getSelection() {
          var focus = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

          if (focus) this.focus();
          this.update(); // Make sure we access getRange with editor in consistent state
          return this.selection.getRange()[0];
        }
      }, {
        key: 'getText',
        value: function getText() {
          var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.getLength() - index;

          var _overload9 = overload(index, length);

          var _overload10 = _slicedToArray(_overload9, 2);

          index = _overload10[0];
          length = _overload10[1];

          return this.editor.getText(index, length);
        }
      }, {
        key: 'hasFocus',
        value: function hasFocus() {
          return this.selection.hasFocus();
        }
      }, {
        key: 'insertEmbed',
        value: function insertEmbed(index, embed, value) {
          var _this7 = this;

          var source = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : Quill.sources.API;

          return modify.call(this, function () {
            return _this7.editor.insertEmbed(index, embed, value);
          }, source, index);
        }
      }, {
        key: 'insertText',
        value: function insertText(index, text, name, value, source) {
          var _this8 = this;

          var formats = void 0;

          var _overload11 = overload(index, 0, name, value, source);

          var _overload12 = _slicedToArray(_overload11, 4);

          index = _overload12[0];
          formats = _overload12[2];
          source = _overload12[3];

          return modify.call(this, function () {
            return _this8.editor.insertText(index, text, formats);
          }, source, index, text.length);
        }
      }, {
        key: 'isEnabled',
        value: function isEnabled() {
          return !this.container.classList.contains('ql-disabled');
        }
      }, {
        key: 'off',
        value: function off() {
          return this.emitter.off.apply(this.emitter, arguments);
        }
      }, {
        key: 'on',
        value: function on() {
          return this.emitter.on.apply(this.emitter, arguments);
        }
      }, {
        key: 'once',
        value: function once() {
          return this.emitter.once.apply(this.emitter, arguments);
        }
      }, {
        key: 'pasteHTML',
        value: function pasteHTML(index, html, source) {
          this.clipboard.dangerouslyPasteHTML(index, html, source);
        }
      }, {
        key: 'removeFormat',
        value: function removeFormat(index, length, source) {
          var _this9 = this;

          var _overload13 = overload(index, length, source);

          var _overload14 = _slicedToArray(_overload13, 4);

          index = _overload14[0];
          length = _overload14[1];
          source = _overload14[3];

          return modify.call(this, function () {
            return _this9.editor.removeFormat(index, length);
          }, source, index);
        }
      }, {
        key: 'scrollIntoView',
        value: function scrollIntoView() {
          this.selection.scrollIntoView(this.scrollingContainer);
        }
      }, {
        key: 'setContents',
        value: function setContents(delta) {
          var _this10 = this;

          var source = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _emitter4.default.sources.API;

          return modify.call(this, function () {
            delta = new _quillDelta2.default(delta);
            var length = _this10.getLength();
            var deleted = _this10.editor.deleteText(0, length);
            var applied = _this10.editor.applyDelta(delta);
            var lastOp = applied.ops[applied.ops.length - 1];
            if (lastOp != null && typeof lastOp.insert === 'string' && lastOp.insert[lastOp.insert.length - 1] === '\n') {
              _this10.editor.deleteText(_this10.getLength() - 1, 1);
              applied.delete(1);
            }
            var ret = deleted.compose(applied);
            return ret;
          }, source);
        }
      }, {
        key: 'setSelection',
        value: function setSelection(index, length, source) {
          if (index == null) {
            this.selection.setRange(null, length || Quill.sources.API);
          } else {
            var _overload15 = overload(index, length, source);

            var _overload16 = _slicedToArray(_overload15, 4);

            index = _overload16[0];
            length = _overload16[1];
            source = _overload16[3];

            this.selection.setRange(new _selection.Range(index, length), source);
            if (source !== _emitter4.default.sources.SILENT) {
              this.selection.scrollIntoView(this.scrollingContainer);
            }
          }
        }
      }, {
        key: 'setText',
        value: function setText(text) {
          var source = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _emitter4.default.sources.API;

          var delta = new _quillDelta2.default().insert(text);
          return this.setContents(delta, source);
        }
      }, {
        key: 'update',
        value: function update() {
          var source = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _emitter4.default.sources.USER;

          var change = this.scroll.update(source); // Will update selection before selection.update() does if text changes
          this.selection.update(source);
          return change;
        }
      }, {
        key: 'updateContents',
        value: function updateContents(delta) {
          var _this11 = this;

          var source = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _emitter4.default.sources.API;

          return modify.call(this, function () {
            delta = new _quillDelta2.default(delta);
            return _this11.editor.applyDelta(delta, source);
          }, source, true);
        }
      }]);

      return Quill;
    }();

    Quill.DEFAULTS = {
      bounds: null,
      formats: null,
      modules: {},
      placeholder: '',
      readOnly: false,
      scrollingContainer: null,
      strict: true,
      theme: 'default'
    };
    Quill.events = _emitter4.default.events;
    Quill.sources = _emitter4.default.sources;
    // eslint-disable-next-line no-undef
    Quill.version =   "1.3.7";

    Quill.imports = {
      'delta': _quillDelta2.default,
      'parchment': _parchment2.default,
      'core/module': _module2.default,
      'core/theme': _theme2.default
    };

    function expandConfig(container, userConfig) {
      userConfig = (0, _extend2.default)(true, {
        container: container,
        modules: {
          clipboard: true,
          keyboard: true,
          history: true
        }
      }, userConfig);
      if (!userConfig.theme || userConfig.theme === Quill.DEFAULTS.theme) {
        userConfig.theme = _theme2.default;
      } else {
        userConfig.theme = Quill.import('themes/' + userConfig.theme);
        if (userConfig.theme == null) {
          throw new Error('Invalid theme ' + userConfig.theme + '. Did you register it?');
        }
      }
      var themeConfig = (0, _extend2.default)(true, {}, userConfig.theme.DEFAULTS);
      [themeConfig, userConfig].forEach(function (config) {
        config.modules = config.modules || {};
        Object.keys(config.modules).forEach(function (module) {
          if (config.modules[module] === true) {
            config.modules[module] = {};
          }
        });
      });
      var moduleNames = Object.keys(themeConfig.modules).concat(Object.keys(userConfig.modules));
      var moduleConfig = moduleNames.reduce(function (config, name) {
        var moduleClass = Quill.import('modules/' + name);
        if (moduleClass == null) {
          debug.error('Cannot load ' + name + ' module. Are you sure you registered it?');
        } else {
          config[name] = moduleClass.DEFAULTS || {};
        }
        return config;
      }, {});
      // Special case toolbar shorthand
      if (userConfig.modules != null && userConfig.modules.toolbar && userConfig.modules.toolbar.constructor !== Object) {
        userConfig.modules.toolbar = {
          container: userConfig.modules.toolbar
        };
      }
      userConfig = (0, _extend2.default)(true, {}, Quill.DEFAULTS, { modules: moduleConfig }, themeConfig, userConfig);
      ['bounds', 'container', 'scrollingContainer'].forEach(function (key) {
        if (typeof userConfig[key] === 'string') {
          userConfig[key] = document.querySelector(userConfig[key]);
        }
      });
      userConfig.modules = Object.keys(userConfig.modules).reduce(function (config, name) {
        if (userConfig.modules[name]) {
          config[name] = userConfig.modules[name];
        }
        return config;
      }, {});
      return userConfig;
    }

    // Handle selection preservation and TEXT_CHANGE emission
    // common to modification APIs
    function modify(modifier, source, index, shift) {
      if (this.options.strict && !this.isEnabled() && source === _emitter4.default.sources.USER) {
        return new _quillDelta2.default();
      }
      var range = index == null ? null : this.getSelection();
      var oldDelta = this.editor.delta;
      var change = modifier();
      if (range != null) {
        if (index === true) index = range.index;
        if (shift == null) {
          range = shiftRange(range, change, source);
        } else if (shift !== 0) {
          range = shiftRange(range, index, shift, source);
        }
        this.setSelection(range, _emitter4.default.sources.SILENT);
      }
      if (change.length() > 0) {
        var _emitter;

        var args = [_emitter4.default.events.TEXT_CHANGE, change, oldDelta, source];
        (_emitter = this.emitter).emit.apply(_emitter, [_emitter4.default.events.EDITOR_CHANGE].concat(args));
        if (source !== _emitter4.default.sources.SILENT) {
          var _emitter2;

          (_emitter2 = this.emitter).emit.apply(_emitter2, args);
        }
      }
      return change;
    }

    function overload(index, length, name, value, source) {
      var formats = {};
      if (typeof index.index === 'number' && typeof index.length === 'number') {
        // Allow for throwaway end (used by insertText/insertEmbed)
        if (typeof length !== 'number') {
          source = value, value = name, name = length, length = index.length, index = index.index;
        } else {
          length = index.length, index = index.index;
        }
      } else if (typeof length !== 'number') {
        source = value, value = name, name = length, length = 0;
      }
      // Handle format being object, two format name/value strings or excluded
      if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
        formats = name;
        source = value;
      } else if (typeof name === 'string') {
        if (value != null) {
          formats[name] = value;
        } else {
          source = name;
        }
      }
      // Handle optional source
      source = source || _emitter4.default.sources.API;
      return [index, length, formats, source];
    }

    function shiftRange(range, index, length, source) {
      if (range == null) return null;
      var start = void 0,
          end = void 0;
      if (index instanceof _quillDelta2.default) {
        var _map = [range.index, range.index + range.length].map(function (pos) {
          return index.transformPosition(pos, source !== _emitter4.default.sources.USER);
        });

        var _map2 = _slicedToArray(_map, 2);

        start = _map2[0];
        end = _map2[1];
      } else {
        var _map3 = [range.index, range.index + range.length].map(function (pos) {
          if (pos < index || pos === index && source === _emitter4.default.sources.USER) return pos;
          if (length >= 0) {
            return pos + length;
          } else {
            return Math.max(index, pos + length);
          }
        });

        var _map4 = _slicedToArray(_map3, 2);

        start = _map4[0];
        end = _map4[1];
      }
      return new _selection.Range(start, end - start);
    }

    exports.expandConfig = expandConfig;
    exports.overload = overload;
    exports.default = Quill;

    /***/ }),
    /* 6 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _text = __webpack_require__(7);

    var _text2 = _interopRequireDefault(_text);

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Inline = function (_Parchment$Inline) {
      _inherits(Inline, _Parchment$Inline);

      function Inline() {
        _classCallCheck(this, Inline);

        return _possibleConstructorReturn(this, (Inline.__proto__ || Object.getPrototypeOf(Inline)).apply(this, arguments));
      }

      _createClass(Inline, [{
        key: 'formatAt',
        value: function formatAt(index, length, name, value) {
          if (Inline.compare(this.statics.blotName, name) < 0 && _parchment2.default.query(name, _parchment2.default.Scope.BLOT)) {
            var blot = this.isolate(index, length);
            if (value) {
              blot.wrap(name, value);
            }
          } else {
            _get(Inline.prototype.__proto__ || Object.getPrototypeOf(Inline.prototype), 'formatAt', this).call(this, index, length, name, value);
          }
        }
      }, {
        key: 'optimize',
        value: function optimize(context) {
          _get(Inline.prototype.__proto__ || Object.getPrototypeOf(Inline.prototype), 'optimize', this).call(this, context);
          if (this.parent instanceof Inline && Inline.compare(this.statics.blotName, this.parent.statics.blotName) > 0) {
            var parent = this.parent.isolate(this.offset(), this.length());
            this.moveChildren(parent);
            parent.wrap(this);
          }
        }
      }], [{
        key: 'compare',
        value: function compare(self, other) {
          var selfIndex = Inline.order.indexOf(self);
          var otherIndex = Inline.order.indexOf(other);
          if (selfIndex >= 0 || otherIndex >= 0) {
            return selfIndex - otherIndex;
          } else if (self === other) {
            return 0;
          } else if (self < other) {
            return -1;
          } else {
            return 1;
          }
        }
      }]);

      return Inline;
    }(_parchment2.default.Inline);

    Inline.allowedChildren = [Inline, _parchment2.default.Embed, _text2.default];
    // Lower index means deeper in the DOM tree, since not found (-1) is for embeds
    Inline.order = ['cursor', 'inline', // Must be lower
    'underline', 'strike', 'italic', 'bold', 'script', 'link', 'code' // Must be higher
    ];

    exports.default = Inline;

    /***/ }),
    /* 7 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var TextBlot = function (_Parchment$Text) {
      _inherits(TextBlot, _Parchment$Text);

      function TextBlot() {
        _classCallCheck(this, TextBlot);

        return _possibleConstructorReturn(this, (TextBlot.__proto__ || Object.getPrototypeOf(TextBlot)).apply(this, arguments));
      }

      return TextBlot;
    }(_parchment2.default.Text);

    exports.default = TextBlot;

    /***/ }),
    /* 8 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _eventemitter = __webpack_require__(54);

    var _eventemitter2 = _interopRequireDefault(_eventemitter);

    var _logger = __webpack_require__(10);

    var _logger2 = _interopRequireDefault(_logger);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var debug = (0, _logger2.default)('quill:events');

    var EVENTS = ['selectionchange', 'mousedown', 'mouseup', 'click'];

    EVENTS.forEach(function (eventName) {
      document.addEventListener(eventName, function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        [].slice.call(document.querySelectorAll('.ql-container')).forEach(function (node) {
          // TODO use WeakMap
          if (node.__quill && node.__quill.emitter) {
            var _node$__quill$emitter;

            (_node$__quill$emitter = node.__quill.emitter).handleDOM.apply(_node$__quill$emitter, args);
          }
        });
      });
    });

    var Emitter = function (_EventEmitter) {
      _inherits(Emitter, _EventEmitter);

      function Emitter() {
        _classCallCheck(this, Emitter);

        var _this = _possibleConstructorReturn(this, (Emitter.__proto__ || Object.getPrototypeOf(Emitter)).call(this));

        _this.listeners = {};
        _this.on('error', debug.error);
        return _this;
      }

      _createClass(Emitter, [{
        key: 'emit',
        value: function emit() {
          debug.log.apply(debug, arguments);
          _get(Emitter.prototype.__proto__ || Object.getPrototypeOf(Emitter.prototype), 'emit', this).apply(this, arguments);
        }
      }, {
        key: 'handleDOM',
        value: function handleDOM(event) {
          for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
          }

          (this.listeners[event.type] || []).forEach(function (_ref) {
            var node = _ref.node,
                handler = _ref.handler;

            if (event.target === node || node.contains(event.target)) {
              handler.apply(undefined, [event].concat(args));
            }
          });
        }
      }, {
        key: 'listenDOM',
        value: function listenDOM(eventName, node, handler) {
          if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
          }
          this.listeners[eventName].push({ node: node, handler: handler });
        }
      }]);

      return Emitter;
    }(_eventemitter2.default);

    Emitter.events = {
      EDITOR_CHANGE: 'editor-change',
      SCROLL_BEFORE_UPDATE: 'scroll-before-update',
      SCROLL_OPTIMIZE: 'scroll-optimize',
      SCROLL_UPDATE: 'scroll-update',
      SELECTION_CHANGE: 'selection-change',
      TEXT_CHANGE: 'text-change'
    };
    Emitter.sources = {
      API: 'api',
      SILENT: 'silent',
      USER: 'user'
    };

    exports.default = Emitter;

    /***/ }),
    /* 9 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var Module = function Module(quill) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, Module);

      this.quill = quill;
      this.options = options;
    };

    Module.DEFAULTS = {};

    exports.default = Module;

    /***/ }),
    /* 10 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var levels = ['error', 'warn', 'log', 'info'];
    var level = 'warn';

    function debug(method) {
      if (levels.indexOf(method) <= levels.indexOf(level)) {
        var _console;

        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        (_console = console)[method].apply(_console, args); // eslint-disable-line no-console
      }
    }

    function namespace(ns) {
      return levels.reduce(function (logger, method) {
        logger[method] = debug.bind(console, method, ns);
        return logger;
      }, {});
    }

    debug.level = namespace.level = function (newLevel) {
      level = newLevel;
    };

    exports.default = namespace;

    /***/ }),
    /* 11 */
    /***/ (function(module, exports, __webpack_require__) {

    var pSlice = Array.prototype.slice;
    var objectKeys = __webpack_require__(52);
    var isArguments = __webpack_require__(53);

    var deepEqual = module.exports = function (actual, expected, opts) {
      if (!opts) opts = {};
      // 7.1. All identical values are equivalent, as determined by ===.
      if (actual === expected) {
        return true;

      } else if (actual instanceof Date && expected instanceof Date) {
        return actual.getTime() === expected.getTime();

      // 7.3. Other pairs that do not both pass typeof value == 'object',
      // equivalence is determined by ==.
      } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
        return opts.strict ? actual === expected : actual == expected;

      // 7.4. For all other Object pairs, including Array objects, equivalence is
      // determined by having the same number of owned properties (as verified
      // with Object.prototype.hasOwnProperty.call), the same set of keys
      // (although not necessarily the same order), equivalent values for every
      // corresponding key, and an identical 'prototype' property. Note: this
      // accounts for both named and indexed properties on Arrays.
      } else {
        return objEquiv(actual, expected, opts);
      }
    };

    function isUndefinedOrNull(value) {
      return value === null || value === undefined;
    }

    function isBuffer (x) {
      if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
      if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
        return false;
      }
      if (x.length > 0 && typeof x[0] !== 'number') return false;
      return true;
    }

    function objEquiv(a, b, opts) {
      var i, key;
      if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
        return false;
      // an identical 'prototype' property.
      if (a.prototype !== b.prototype) return false;
      //~~~I've managed to break Object.keys through screwy arguments passing.
      //   Converting to array solves the problem.
      if (isArguments(a)) {
        if (!isArguments(b)) {
          return false;
        }
        a = pSlice.call(a);
        b = pSlice.call(b);
        return deepEqual(a, b, opts);
      }
      if (isBuffer(a)) {
        if (!isBuffer(b)) {
          return false;
        }
        if (a.length !== b.length) return false;
        for (i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) return false;
        }
        return true;
      }
      try {
        var ka = objectKeys(a),
            kb = objectKeys(b);
      } catch (e) {//happens when one is a string literal and the other isn't
        return false;
      }
      // having the same number of owned properties (keys incorporates
      // hasOwnProperty)
      if (ka.length != kb.length)
        return false;
      //the same set of keys (although not necessarily the same order),
      ka.sort();
      kb.sort();
      //~~~cheap key test
      for (i = ka.length - 1; i >= 0; i--) {
        if (ka[i] != kb[i])
          return false;
      }
      //equivalent values for every corresponding key, and
      //~~~possibly expensive deep test
      for (i = ka.length - 1; i >= 0; i--) {
        key = ka[i];
        if (!deepEqual(a[key], b[key], opts)) return false;
      }
      return typeof a === typeof b;
    }


    /***/ }),
    /* 12 */
    /***/ (function(module, exports, __webpack_require__) {

    Object.defineProperty(exports, "__esModule", { value: true });
    var Registry = __webpack_require__(1);
    var Attributor = /** @class */ (function () {
        function Attributor(attrName, keyName, options) {
            if (options === void 0) { options = {}; }
            this.attrName = attrName;
            this.keyName = keyName;
            var attributeBit = Registry.Scope.TYPE & Registry.Scope.ATTRIBUTE;
            if (options.scope != null) {
                // Ignore type bits, force attribute bit
                this.scope = (options.scope & Registry.Scope.LEVEL) | attributeBit;
            }
            else {
                this.scope = Registry.Scope.ATTRIBUTE;
            }
            if (options.whitelist != null)
                this.whitelist = options.whitelist;
        }
        Attributor.keys = function (node) {
            return [].map.call(node.attributes, function (item) {
                return item.name;
            });
        };
        Attributor.prototype.add = function (node, value) {
            if (!this.canAdd(node, value))
                return false;
            node.setAttribute(this.keyName, value);
            return true;
        };
        Attributor.prototype.canAdd = function (node, value) {
            var match = Registry.query(node, Registry.Scope.BLOT & (this.scope | Registry.Scope.TYPE));
            if (match == null)
                return false;
            if (this.whitelist == null)
                return true;
            if (typeof value === 'string') {
                return this.whitelist.indexOf(value.replace(/["']/g, '')) > -1;
            }
            else {
                return this.whitelist.indexOf(value) > -1;
            }
        };
        Attributor.prototype.remove = function (node) {
            node.removeAttribute(this.keyName);
        };
        Attributor.prototype.value = function (node) {
            var value = node.getAttribute(this.keyName);
            if (this.canAdd(node, value) && value) {
                return value;
            }
            return '';
        };
        return Attributor;
    }());
    exports.default = Attributor;


    /***/ }),
    /* 13 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.Code = undefined;

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _quillDelta = __webpack_require__(2);

    var _quillDelta2 = _interopRequireDefault(_quillDelta);

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _block = __webpack_require__(4);

    var _block2 = _interopRequireDefault(_block);

    var _inline = __webpack_require__(6);

    var _inline2 = _interopRequireDefault(_inline);

    var _text = __webpack_require__(7);

    var _text2 = _interopRequireDefault(_text);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Code = function (_Inline) {
      _inherits(Code, _Inline);

      function Code() {
        _classCallCheck(this, Code);

        return _possibleConstructorReturn(this, (Code.__proto__ || Object.getPrototypeOf(Code)).apply(this, arguments));
      }

      return Code;
    }(_inline2.default);

    Code.blotName = 'code';
    Code.tagName = 'CODE';

    var CodeBlock = function (_Block) {
      _inherits(CodeBlock, _Block);

      function CodeBlock() {
        _classCallCheck(this, CodeBlock);

        return _possibleConstructorReturn(this, (CodeBlock.__proto__ || Object.getPrototypeOf(CodeBlock)).apply(this, arguments));
      }

      _createClass(CodeBlock, [{
        key: 'delta',
        value: function delta() {
          var _this3 = this;

          var text = this.domNode.textContent;
          if (text.endsWith('\n')) {
            // Should always be true
            text = text.slice(0, -1);
          }
          return text.split('\n').reduce(function (delta, frag) {
            return delta.insert(frag).insert('\n', _this3.formats());
          }, new _quillDelta2.default());
        }
      }, {
        key: 'format',
        value: function format(name, value) {
          if (name === this.statics.blotName && value) return;

          var _descendant = this.descendant(_text2.default, this.length() - 1),
              _descendant2 = _slicedToArray(_descendant, 1),
              text = _descendant2[0];

          if (text != null) {
            text.deleteAt(text.length() - 1, 1);
          }
          _get(CodeBlock.prototype.__proto__ || Object.getPrototypeOf(CodeBlock.prototype), 'format', this).call(this, name, value);
        }
      }, {
        key: 'formatAt',
        value: function formatAt(index, length, name, value) {
          if (length === 0) return;
          if (_parchment2.default.query(name, _parchment2.default.Scope.BLOCK) == null || name === this.statics.blotName && value === this.statics.formats(this.domNode)) {
            return;
          }
          var nextNewline = this.newlineIndex(index);
          if (nextNewline < 0 || nextNewline >= index + length) return;
          var prevNewline = this.newlineIndex(index, true) + 1;
          var isolateLength = nextNewline - prevNewline + 1;
          var blot = this.isolate(prevNewline, isolateLength);
          var next = blot.next;
          blot.format(name, value);
          if (next instanceof CodeBlock) {
            next.formatAt(0, index - prevNewline + length - isolateLength, name, value);
          }
        }
      }, {
        key: 'insertAt',
        value: function insertAt(index, value, def) {
          if (def != null) return;

          var _descendant3 = this.descendant(_text2.default, index),
              _descendant4 = _slicedToArray(_descendant3, 2),
              text = _descendant4[0],
              offset = _descendant4[1];

          text.insertAt(offset, value);
        }
      }, {
        key: 'length',
        value: function length() {
          var length = this.domNode.textContent.length;
          if (!this.domNode.textContent.endsWith('\n')) {
            return length + 1;
          }
          return length;
        }
      }, {
        key: 'newlineIndex',
        value: function newlineIndex(searchIndex) {
          var reverse = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

          if (!reverse) {
            var offset = this.domNode.textContent.slice(searchIndex).indexOf('\n');
            return offset > -1 ? searchIndex + offset : -1;
          } else {
            return this.domNode.textContent.slice(0, searchIndex).lastIndexOf('\n');
          }
        }
      }, {
        key: 'optimize',
        value: function optimize(context) {
          if (!this.domNode.textContent.endsWith('\n')) {
            this.appendChild(_parchment2.default.create('text', '\n'));
          }
          _get(CodeBlock.prototype.__proto__ || Object.getPrototypeOf(CodeBlock.prototype), 'optimize', this).call(this, context);
          var next = this.next;
          if (next != null && next.prev === this && next.statics.blotName === this.statics.blotName && this.statics.formats(this.domNode) === next.statics.formats(next.domNode)) {
            next.optimize(context);
            next.moveChildren(this);
            next.remove();
          }
        }
      }, {
        key: 'replace',
        value: function replace(target) {
          _get(CodeBlock.prototype.__proto__ || Object.getPrototypeOf(CodeBlock.prototype), 'replace', this).call(this, target);
          [].slice.call(this.domNode.querySelectorAll('*')).forEach(function (node) {
            var blot = _parchment2.default.find(node);
            if (blot == null) {
              node.parentNode.removeChild(node);
            } else if (blot instanceof _parchment2.default.Embed) {
              blot.remove();
            } else {
              blot.unwrap();
            }
          });
        }
      }], [{
        key: 'create',
        value: function create(value) {
          var domNode = _get(CodeBlock.__proto__ || Object.getPrototypeOf(CodeBlock), 'create', this).call(this, value);
          domNode.setAttribute('spellcheck', false);
          return domNode;
        }
      }, {
        key: 'formats',
        value: function formats() {
          return true;
        }
      }]);

      return CodeBlock;
    }(_block2.default);

    CodeBlock.blotName = 'code-block';
    CodeBlock.tagName = 'PRE';
    CodeBlock.TAB = '  ';

    exports.Code = Code;
    exports.default = CodeBlock;

    /***/ }),
    /* 14 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _quillDelta = __webpack_require__(2);

    var _quillDelta2 = _interopRequireDefault(_quillDelta);

    var _op = __webpack_require__(20);

    var _op2 = _interopRequireDefault(_op);

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _code = __webpack_require__(13);

    var _code2 = _interopRequireDefault(_code);

    var _cursor = __webpack_require__(24);

    var _cursor2 = _interopRequireDefault(_cursor);

    var _block = __webpack_require__(4);

    var _block2 = _interopRequireDefault(_block);

    var _break = __webpack_require__(16);

    var _break2 = _interopRequireDefault(_break);

    var _clone = __webpack_require__(21);

    var _clone2 = _interopRequireDefault(_clone);

    var _deepEqual = __webpack_require__(11);

    var _deepEqual2 = _interopRequireDefault(_deepEqual);

    var _extend = __webpack_require__(3);

    var _extend2 = _interopRequireDefault(_extend);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var ASCII = /^[ -~]*$/;

    var Editor = function () {
      function Editor(scroll) {
        _classCallCheck(this, Editor);

        this.scroll = scroll;
        this.delta = this.getDelta();
      }

      _createClass(Editor, [{
        key: 'applyDelta',
        value: function applyDelta(delta) {
          var _this = this;

          var consumeNextNewline = false;
          this.scroll.update();
          var scrollLength = this.scroll.length();
          this.scroll.batchStart();
          delta = normalizeDelta(delta);
          delta.reduce(function (index, op) {
            var length = op.retain || op.delete || op.insert.length || 1;
            var attributes = op.attributes || {};
            if (op.insert != null) {
              if (typeof op.insert === 'string') {
                var text = op.insert;
                if (text.endsWith('\n') && consumeNextNewline) {
                  consumeNextNewline = false;
                  text = text.slice(0, -1);
                }
                if (index >= scrollLength && !text.endsWith('\n')) {
                  consumeNextNewline = true;
                }
                _this.scroll.insertAt(index, text);

                var _scroll$line = _this.scroll.line(index),
                    _scroll$line2 = _slicedToArray(_scroll$line, 2),
                    line = _scroll$line2[0],
                    offset = _scroll$line2[1];

                var formats = (0, _extend2.default)({}, (0, _block.bubbleFormats)(line));
                if (line instanceof _block2.default) {
                  var _line$descendant = line.descendant(_parchment2.default.Leaf, offset),
                      _line$descendant2 = _slicedToArray(_line$descendant, 1),
                      leaf = _line$descendant2[0];

                  formats = (0, _extend2.default)(formats, (0, _block.bubbleFormats)(leaf));
                }
                attributes = _op2.default.attributes.diff(formats, attributes) || {};
              } else if (_typeof(op.insert) === 'object') {
                var key = Object.keys(op.insert)[0]; // There should only be one key
                if (key == null) return index;
                _this.scroll.insertAt(index, key, op.insert[key]);
              }
              scrollLength += length;
            }
            Object.keys(attributes).forEach(function (name) {
              _this.scroll.formatAt(index, length, name, attributes[name]);
            });
            return index + length;
          }, 0);
          delta.reduce(function (index, op) {
            if (typeof op.delete === 'number') {
              _this.scroll.deleteAt(index, op.delete);
              return index;
            }
            return index + (op.retain || op.insert.length || 1);
          }, 0);
          this.scroll.batchEnd();
          return this.update(delta);
        }
      }, {
        key: 'deleteText',
        value: function deleteText(index, length) {
          this.scroll.deleteAt(index, length);
          return this.update(new _quillDelta2.default().retain(index).delete(length));
        }
      }, {
        key: 'formatLine',
        value: function formatLine(index, length) {
          var _this2 = this;

          var formats = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

          this.scroll.update();
          Object.keys(formats).forEach(function (format) {
            if (_this2.scroll.whitelist != null && !_this2.scroll.whitelist[format]) return;
            var lines = _this2.scroll.lines(index, Math.max(length, 1));
            var lengthRemaining = length;
            lines.forEach(function (line) {
              var lineLength = line.length();
              if (!(line instanceof _code2.default)) {
                line.format(format, formats[format]);
              } else {
                var codeIndex = index - line.offset(_this2.scroll);
                var codeLength = line.newlineIndex(codeIndex + lengthRemaining) - codeIndex + 1;
                line.formatAt(codeIndex, codeLength, format, formats[format]);
              }
              lengthRemaining -= lineLength;
            });
          });
          this.scroll.optimize();
          return this.update(new _quillDelta2.default().retain(index).retain(length, (0, _clone2.default)(formats)));
        }
      }, {
        key: 'formatText',
        value: function formatText(index, length) {
          var _this3 = this;

          var formats = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

          Object.keys(formats).forEach(function (format) {
            _this3.scroll.formatAt(index, length, format, formats[format]);
          });
          return this.update(new _quillDelta2.default().retain(index).retain(length, (0, _clone2.default)(formats)));
        }
      }, {
        key: 'getContents',
        value: function getContents(index, length) {
          return this.delta.slice(index, index + length);
        }
      }, {
        key: 'getDelta',
        value: function getDelta() {
          return this.scroll.lines().reduce(function (delta, line) {
            return delta.concat(line.delta());
          }, new _quillDelta2.default());
        }
      }, {
        key: 'getFormat',
        value: function getFormat(index) {
          var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

          var lines = [],
              leaves = [];
          if (length === 0) {
            this.scroll.path(index).forEach(function (path) {
              var _path = _slicedToArray(path, 1),
                  blot = _path[0];

              if (blot instanceof _block2.default) {
                lines.push(blot);
              } else if (blot instanceof _parchment2.default.Leaf) {
                leaves.push(blot);
              }
            });
          } else {
            lines = this.scroll.lines(index, length);
            leaves = this.scroll.descendants(_parchment2.default.Leaf, index, length);
          }
          var formatsArr = [lines, leaves].map(function (blots) {
            if (blots.length === 0) return {};
            var formats = (0, _block.bubbleFormats)(blots.shift());
            while (Object.keys(formats).length > 0) {
              var blot = blots.shift();
              if (blot == null) return formats;
              formats = combineFormats((0, _block.bubbleFormats)(blot), formats);
            }
            return formats;
          });
          return _extend2.default.apply(_extend2.default, formatsArr);
        }
      }, {
        key: 'getText',
        value: function getText(index, length) {
          return this.getContents(index, length).filter(function (op) {
            return typeof op.insert === 'string';
          }).map(function (op) {
            return op.insert;
          }).join('');
        }
      }, {
        key: 'insertEmbed',
        value: function insertEmbed(index, embed, value) {
          this.scroll.insertAt(index, embed, value);
          return this.update(new _quillDelta2.default().retain(index).insert(_defineProperty({}, embed, value)));
        }
      }, {
        key: 'insertText',
        value: function insertText(index, text) {
          var _this4 = this;

          var formats = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

          text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          this.scroll.insertAt(index, text);
          Object.keys(formats).forEach(function (format) {
            _this4.scroll.formatAt(index, text.length, format, formats[format]);
          });
          return this.update(new _quillDelta2.default().retain(index).insert(text, (0, _clone2.default)(formats)));
        }
      }, {
        key: 'isBlank',
        value: function isBlank() {
          if (this.scroll.children.length == 0) return true;
          if (this.scroll.children.length > 1) return false;
          var block = this.scroll.children.head;
          if (block.statics.blotName !== _block2.default.blotName) return false;
          if (block.children.length > 1) return false;
          return block.children.head instanceof _break2.default;
        }
      }, {
        key: 'removeFormat',
        value: function removeFormat(index, length) {
          var text = this.getText(index, length);

          var _scroll$line3 = this.scroll.line(index + length),
              _scroll$line4 = _slicedToArray(_scroll$line3, 2),
              line = _scroll$line4[0],
              offset = _scroll$line4[1];

          var suffixLength = 0,
              suffix = new _quillDelta2.default();
          if (line != null) {
            if (!(line instanceof _code2.default)) {
              suffixLength = line.length() - offset;
            } else {
              suffixLength = line.newlineIndex(offset) - offset + 1;
            }
            suffix = line.delta().slice(offset, offset + suffixLength - 1).insert('\n');
          }
          var contents = this.getContents(index, length + suffixLength);
          var diff = contents.diff(new _quillDelta2.default().insert(text).concat(suffix));
          var delta = new _quillDelta2.default().retain(index).concat(diff);
          return this.applyDelta(delta);
        }
      }, {
        key: 'update',
        value: function update(change) {
          var mutations = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
          var cursorIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

          var oldDelta = this.delta;
          if (mutations.length === 1 && mutations[0].type === 'characterData' && mutations[0].target.data.match(ASCII) && _parchment2.default.find(mutations[0].target)) {
            // Optimization for character changes
            var textBlot = _parchment2.default.find(mutations[0].target);
            var formats = (0, _block.bubbleFormats)(textBlot);
            var index = textBlot.offset(this.scroll);
            var oldValue = mutations[0].oldValue.replace(_cursor2.default.CONTENTS, '');
            var oldText = new _quillDelta2.default().insert(oldValue);
            var newText = new _quillDelta2.default().insert(textBlot.value());
            var diffDelta = new _quillDelta2.default().retain(index).concat(oldText.diff(newText, cursorIndex));
            change = diffDelta.reduce(function (delta, op) {
              if (op.insert) {
                return delta.insert(op.insert, formats);
              } else {
                return delta.push(op);
              }
            }, new _quillDelta2.default());
            this.delta = oldDelta.compose(change);
          } else {
            this.delta = this.getDelta();
            if (!change || !(0, _deepEqual2.default)(oldDelta.compose(change), this.delta)) {
              change = oldDelta.diff(this.delta, cursorIndex);
            }
          }
          return change;
        }
      }]);

      return Editor;
    }();

    function combineFormats(formats, combined) {
      return Object.keys(combined).reduce(function (merged, name) {
        if (formats[name] == null) return merged;
        if (combined[name] === formats[name]) {
          merged[name] = combined[name];
        } else if (Array.isArray(combined[name])) {
          if (combined[name].indexOf(formats[name]) < 0) {
            merged[name] = combined[name].concat([formats[name]]);
          }
        } else {
          merged[name] = [combined[name], formats[name]];
        }
        return merged;
      }, {});
    }

    function normalizeDelta(delta) {
      return delta.reduce(function (delta, op) {
        if (op.insert === 1) {
          var attributes = (0, _clone2.default)(op.attributes);
          delete attributes['image'];
          return delta.insert({ image: op.attributes.image }, attributes);
        }
        if (op.attributes != null && (op.attributes.list === true || op.attributes.bullet === true)) {
          op = (0, _clone2.default)(op);
          if (op.attributes.list) {
            op.attributes.list = 'ordered';
          } else {
            op.attributes.list = 'bullet';
            delete op.attributes.bullet;
          }
        }
        if (typeof op.insert === 'string') {
          var text = op.insert.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          return delta.insert(text, op.attributes);
        }
        return delta.push(op);
      }, new _quillDelta2.default());
    }

    exports.default = Editor;

    /***/ }),
    /* 15 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.Range = undefined;

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _clone = __webpack_require__(21);

    var _clone2 = _interopRequireDefault(_clone);

    var _deepEqual = __webpack_require__(11);

    var _deepEqual2 = _interopRequireDefault(_deepEqual);

    var _emitter3 = __webpack_require__(8);

    var _emitter4 = _interopRequireDefault(_emitter3);

    var _logger = __webpack_require__(10);

    var _logger2 = _interopRequireDefault(_logger);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var debug = (0, _logger2.default)('quill:selection');

    var Range = function Range(index) {
      var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      _classCallCheck(this, Range);

      this.index = index;
      this.length = length;
    };

    var Selection = function () {
      function Selection(scroll, emitter) {
        var _this = this;

        _classCallCheck(this, Selection);

        this.emitter = emitter;
        this.scroll = scroll;
        this.composing = false;
        this.mouseDown = false;
        this.root = this.scroll.domNode;
        this.cursor = _parchment2.default.create('cursor', this);
        // savedRange is last non-null range
        this.lastRange = this.savedRange = new Range(0, 0);
        this.handleComposition();
        this.handleDragging();
        this.emitter.listenDOM('selectionchange', document, function () {
          if (!_this.mouseDown) {
            setTimeout(_this.update.bind(_this, _emitter4.default.sources.USER), 1);
          }
        });
        this.emitter.on(_emitter4.default.events.EDITOR_CHANGE, function (type, delta) {
          if (type === _emitter4.default.events.TEXT_CHANGE && delta.length() > 0) {
            _this.update(_emitter4.default.sources.SILENT);
          }
        });
        this.emitter.on(_emitter4.default.events.SCROLL_BEFORE_UPDATE, function () {
          if (!_this.hasFocus()) return;
          var native = _this.getNativeRange();
          if (native == null) return;
          if (native.start.node === _this.cursor.textNode) return; // cursor.restore() will handle
          // TODO unclear if this has negative side effects
          _this.emitter.once(_emitter4.default.events.SCROLL_UPDATE, function () {
            try {
              _this.setNativeRange(native.start.node, native.start.offset, native.end.node, native.end.offset);
            } catch (ignored) {}
          });
        });
        this.emitter.on(_emitter4.default.events.SCROLL_OPTIMIZE, function (mutations, context) {
          if (context.range) {
            var _context$range = context.range,
                startNode = _context$range.startNode,
                startOffset = _context$range.startOffset,
                endNode = _context$range.endNode,
                endOffset = _context$range.endOffset;

            _this.setNativeRange(startNode, startOffset, endNode, endOffset);
          }
        });
        this.update(_emitter4.default.sources.SILENT);
      }

      _createClass(Selection, [{
        key: 'handleComposition',
        value: function handleComposition() {
          var _this2 = this;

          this.root.addEventListener('compositionstart', function () {
            _this2.composing = true;
          });
          this.root.addEventListener('compositionend', function () {
            _this2.composing = false;
            if (_this2.cursor.parent) {
              var range = _this2.cursor.restore();
              if (!range) return;
              setTimeout(function () {
                _this2.setNativeRange(range.startNode, range.startOffset, range.endNode, range.endOffset);
              }, 1);
            }
          });
        }
      }, {
        key: 'handleDragging',
        value: function handleDragging() {
          var _this3 = this;

          this.emitter.listenDOM('mousedown', document.body, function () {
            _this3.mouseDown = true;
          });
          this.emitter.listenDOM('mouseup', document.body, function () {
            _this3.mouseDown = false;
            _this3.update(_emitter4.default.sources.USER);
          });
        }
      }, {
        key: 'focus',
        value: function focus() {
          if (this.hasFocus()) return;
          this.root.focus();
          this.setRange(this.savedRange);
        }
      }, {
        key: 'format',
        value: function format(_format, value) {
          if (this.scroll.whitelist != null && !this.scroll.whitelist[_format]) return;
          this.scroll.update();
          var nativeRange = this.getNativeRange();
          if (nativeRange == null || !nativeRange.native.collapsed || _parchment2.default.query(_format, _parchment2.default.Scope.BLOCK)) return;
          if (nativeRange.start.node !== this.cursor.textNode) {
            var blot = _parchment2.default.find(nativeRange.start.node, false);
            if (blot == null) return;
            // TODO Give blot ability to not split
            if (blot instanceof _parchment2.default.Leaf) {
              var after = blot.split(nativeRange.start.offset);
              blot.parent.insertBefore(this.cursor, after);
            } else {
              blot.insertBefore(this.cursor, nativeRange.start.node); // Should never happen
            }
            this.cursor.attach();
          }
          this.cursor.format(_format, value);
          this.scroll.optimize();
          this.setNativeRange(this.cursor.textNode, this.cursor.textNode.data.length);
          this.update();
        }
      }, {
        key: 'getBounds',
        value: function getBounds(index) {
          var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

          var scrollLength = this.scroll.length();
          index = Math.min(index, scrollLength - 1);
          length = Math.min(index + length, scrollLength - 1) - index;
          var node = void 0,
              _scroll$leaf = this.scroll.leaf(index),
              _scroll$leaf2 = _slicedToArray(_scroll$leaf, 2),
              leaf = _scroll$leaf2[0],
              offset = _scroll$leaf2[1];
          if (leaf == null) return null;

          var _leaf$position = leaf.position(offset, true);

          var _leaf$position2 = _slicedToArray(_leaf$position, 2);

          node = _leaf$position2[0];
          offset = _leaf$position2[1];

          var range = document.createRange();
          if (length > 0) {
            range.setStart(node, offset);

            var _scroll$leaf3 = this.scroll.leaf(index + length);

            var _scroll$leaf4 = _slicedToArray(_scroll$leaf3, 2);

            leaf = _scroll$leaf4[0];
            offset = _scroll$leaf4[1];

            if (leaf == null) return null;

            var _leaf$position3 = leaf.position(offset, true);

            var _leaf$position4 = _slicedToArray(_leaf$position3, 2);

            node = _leaf$position4[0];
            offset = _leaf$position4[1];

            range.setEnd(node, offset);
            return range.getBoundingClientRect();
          } else {
            var side = 'left';
            var rect = void 0;
            if (node instanceof Text) {
              if (offset < node.data.length) {
                range.setStart(node, offset);
                range.setEnd(node, offset + 1);
              } else {
                range.setStart(node, offset - 1);
                range.setEnd(node, offset);
                side = 'right';
              }
              rect = range.getBoundingClientRect();
            } else {
              rect = leaf.domNode.getBoundingClientRect();
              if (offset > 0) side = 'right';
            }
            return {
              bottom: rect.top + rect.height,
              height: rect.height,
              left: rect[side],
              right: rect[side],
              top: rect.top,
              width: 0
            };
          }
        }
      }, {
        key: 'getNativeRange',
        value: function getNativeRange() {
          var selection = document.getSelection();
          if (selection == null || selection.rangeCount <= 0) return null;
          var nativeRange = selection.getRangeAt(0);
          if (nativeRange == null) return null;
          var range = this.normalizeNative(nativeRange);
          debug.info('getNativeRange', range);
          return range;
        }
      }, {
        key: 'getRange',
        value: function getRange() {
          var normalized = this.getNativeRange();
          if (normalized == null) return [null, null];
          var range = this.normalizedToRange(normalized);
          return [range, normalized];
        }
      }, {
        key: 'hasFocus',
        value: function hasFocus() {
          return document.activeElement === this.root;
        }
      }, {
        key: 'normalizedToRange',
        value: function normalizedToRange(range) {
          var _this4 = this;

          var positions = [[range.start.node, range.start.offset]];
          if (!range.native.collapsed) {
            positions.push([range.end.node, range.end.offset]);
          }
          var indexes = positions.map(function (position) {
            var _position = _slicedToArray(position, 2),
                node = _position[0],
                offset = _position[1];

            var blot = _parchment2.default.find(node, true);
            var index = blot.offset(_this4.scroll);
            if (offset === 0) {
              return index;
            } else if (blot instanceof _parchment2.default.Container) {
              return index + blot.length();
            } else {
              return index + blot.index(node, offset);
            }
          });
          var end = Math.min(Math.max.apply(Math, _toConsumableArray(indexes)), this.scroll.length() - 1);
          var start = Math.min.apply(Math, [end].concat(_toConsumableArray(indexes)));
          return new Range(start, end - start);
        }
      }, {
        key: 'normalizeNative',
        value: function normalizeNative(nativeRange) {
          if (!contains(this.root, nativeRange.startContainer) || !nativeRange.collapsed && !contains(this.root, nativeRange.endContainer)) {
            return null;
          }
          var range = {
            start: { node: nativeRange.startContainer, offset: nativeRange.startOffset },
            end: { node: nativeRange.endContainer, offset: nativeRange.endOffset },
            native: nativeRange
          };
          [range.start, range.end].forEach(function (position) {
            var node = position.node,
                offset = position.offset;
            while (!(node instanceof Text) && node.childNodes.length > 0) {
              if (node.childNodes.length > offset) {
                node = node.childNodes[offset];
                offset = 0;
              } else if (node.childNodes.length === offset) {
                node = node.lastChild;
                offset = node instanceof Text ? node.data.length : node.childNodes.length + 1;
              } else {
                break;
              }
            }
            position.node = node, position.offset = offset;
          });
          return range;
        }
      }, {
        key: 'rangeToNative',
        value: function rangeToNative(range) {
          var _this5 = this;

          var indexes = range.collapsed ? [range.index] : [range.index, range.index + range.length];
          var args = [];
          var scrollLength = this.scroll.length();
          indexes.forEach(function (index, i) {
            index = Math.min(scrollLength - 1, index);
            var node = void 0,
                _scroll$leaf5 = _this5.scroll.leaf(index),
                _scroll$leaf6 = _slicedToArray(_scroll$leaf5, 2),
                leaf = _scroll$leaf6[0],
                offset = _scroll$leaf6[1];
            var _leaf$position5 = leaf.position(offset, i !== 0);

            var _leaf$position6 = _slicedToArray(_leaf$position5, 2);

            node = _leaf$position6[0];
            offset = _leaf$position6[1];

            args.push(node, offset);
          });
          if (args.length < 2) {
            args = args.concat(args);
          }
          return args;
        }
      }, {
        key: 'scrollIntoView',
        value: function scrollIntoView(scrollingContainer) {
          var range = this.lastRange;
          if (range == null) return;
          var bounds = this.getBounds(range.index, range.length);
          if (bounds == null) return;
          var limit = this.scroll.length() - 1;

          var _scroll$line = this.scroll.line(Math.min(range.index, limit)),
              _scroll$line2 = _slicedToArray(_scroll$line, 1),
              first = _scroll$line2[0];

          var last = first;
          if (range.length > 0) {
            var _scroll$line3 = this.scroll.line(Math.min(range.index + range.length, limit));

            var _scroll$line4 = _slicedToArray(_scroll$line3, 1);

            last = _scroll$line4[0];
          }
          if (first == null || last == null) return;
          var scrollBounds = scrollingContainer.getBoundingClientRect();
          if (bounds.top < scrollBounds.top) {
            scrollingContainer.scrollTop -= scrollBounds.top - bounds.top;
          } else if (bounds.bottom > scrollBounds.bottom) {
            scrollingContainer.scrollTop += bounds.bottom - scrollBounds.bottom;
          }
        }
      }, {
        key: 'setNativeRange',
        value: function setNativeRange(startNode, startOffset) {
          var endNode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : startNode;
          var endOffset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : startOffset;
          var force = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

          debug.info('setNativeRange', startNode, startOffset, endNode, endOffset);
          if (startNode != null && (this.root.parentNode == null || startNode.parentNode == null || endNode.parentNode == null)) {
            return;
          }
          var selection = document.getSelection();
          if (selection == null) return;
          if (startNode != null) {
            if (!this.hasFocus()) this.root.focus();
            var native = (this.getNativeRange() || {}).native;
            if (native == null || force || startNode !== native.startContainer || startOffset !== native.startOffset || endNode !== native.endContainer || endOffset !== native.endOffset) {

              if (startNode.tagName == "BR") {
                startOffset = [].indexOf.call(startNode.parentNode.childNodes, startNode);
                startNode = startNode.parentNode;
              }
              if (endNode.tagName == "BR") {
                endOffset = [].indexOf.call(endNode.parentNode.childNodes, endNode);
                endNode = endNode.parentNode;
              }
              var range = document.createRange();
              range.setStart(startNode, startOffset);
              range.setEnd(endNode, endOffset);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          } else {
            selection.removeAllRanges();
            this.root.blur();
            document.body.focus(); // root.blur() not enough on IE11+Travis+SauceLabs (but not local VMs)
          }
        }
      }, {
        key: 'setRange',
        value: function setRange(range) {
          var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
          var source = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _emitter4.default.sources.API;

          if (typeof force === 'string') {
            source = force;
            force = false;
          }
          debug.info('setRange', range);
          if (range != null) {
            var args = this.rangeToNative(range);
            this.setNativeRange.apply(this, _toConsumableArray(args).concat([force]));
          } else {
            this.setNativeRange(null);
          }
          this.update(source);
        }
      }, {
        key: 'update',
        value: function update() {
          var source = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _emitter4.default.sources.USER;

          var oldRange = this.lastRange;

          var _getRange = this.getRange(),
              _getRange2 = _slicedToArray(_getRange, 2),
              lastRange = _getRange2[0],
              nativeRange = _getRange2[1];

          this.lastRange = lastRange;
          if (this.lastRange != null) {
            this.savedRange = this.lastRange;
          }
          if (!(0, _deepEqual2.default)(oldRange, this.lastRange)) {
            var _emitter;

            if (!this.composing && nativeRange != null && nativeRange.native.collapsed && nativeRange.start.node !== this.cursor.textNode) {
              this.cursor.restore();
            }
            var args = [_emitter4.default.events.SELECTION_CHANGE, (0, _clone2.default)(this.lastRange), (0, _clone2.default)(oldRange), source];
            (_emitter = this.emitter).emit.apply(_emitter, [_emitter4.default.events.EDITOR_CHANGE].concat(args));
            if (source !== _emitter4.default.sources.SILENT) {
              var _emitter2;

              (_emitter2 = this.emitter).emit.apply(_emitter2, args);
            }
          }
        }
      }]);

      return Selection;
    }();

    function contains(parent, descendant) {
      try {
        // Firefox inserts inaccessible nodes around video elements
        descendant.parentNode;
      } catch (e) {
        return false;
      }
      // IE11 has bug with Text nodes
      // https://connect.microsoft.com/IE/feedback/details/780874/node-contains-is-incorrect
      if (descendant instanceof Text) {
        descendant = descendant.parentNode;
      }
      return parent.contains(descendant);
    }

    exports.Range = Range;
    exports.default = Selection;

    /***/ }),
    /* 16 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Break = function (_Parchment$Embed) {
      _inherits(Break, _Parchment$Embed);

      function Break() {
        _classCallCheck(this, Break);

        return _possibleConstructorReturn(this, (Break.__proto__ || Object.getPrototypeOf(Break)).apply(this, arguments));
      }

      _createClass(Break, [{
        key: 'insertInto',
        value: function insertInto(parent, ref) {
          if (parent.children.length === 0) {
            _get(Break.prototype.__proto__ || Object.getPrototypeOf(Break.prototype), 'insertInto', this).call(this, parent, ref);
          } else {
            this.remove();
          }
        }
      }, {
        key: 'length',
        value: function length() {
          return 0;
        }
      }, {
        key: 'value',
        value: function value() {
          return '';
        }
      }], [{
        key: 'value',
        value: function value() {
          return undefined;
        }
      }]);

      return Break;
    }(_parchment2.default.Embed);

    Break.blotName = 'break';
    Break.tagName = 'BR';

    exports.default = Break;

    /***/ }),
    /* 17 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var linked_list_1 = __webpack_require__(44);
    var shadow_1 = __webpack_require__(30);
    var Registry = __webpack_require__(1);
    var ContainerBlot = /** @class */ (function (_super) {
        __extends(ContainerBlot, _super);
        function ContainerBlot(domNode) {
            var _this = _super.call(this, domNode) || this;
            _this.build();
            return _this;
        }
        ContainerBlot.prototype.appendChild = function (other) {
            this.insertBefore(other);
        };
        ContainerBlot.prototype.attach = function () {
            _super.prototype.attach.call(this);
            this.children.forEach(function (child) {
                child.attach();
            });
        };
        ContainerBlot.prototype.build = function () {
            var _this = this;
            this.children = new linked_list_1.default();
            // Need to be reversed for if DOM nodes already in order
            [].slice
                .call(this.domNode.childNodes)
                .reverse()
                .forEach(function (node) {
                try {
                    var child = makeBlot(node);
                    _this.insertBefore(child, _this.children.head || undefined);
                }
                catch (err) {
                    if (err instanceof Registry.ParchmentError)
                        return;
                    else
                        throw err;
                }
            });
        };
        ContainerBlot.prototype.deleteAt = function (index, length) {
            if (index === 0 && length === this.length()) {
                return this.remove();
            }
            this.children.forEachAt(index, length, function (child, offset, length) {
                child.deleteAt(offset, length);
            });
        };
        ContainerBlot.prototype.descendant = function (criteria, index) {
            var _a = this.children.find(index), child = _a[0], offset = _a[1];
            if ((criteria.blotName == null && criteria(child)) ||
                (criteria.blotName != null && child instanceof criteria)) {
                return [child, offset];
            }
            else if (child instanceof ContainerBlot) {
                return child.descendant(criteria, offset);
            }
            else {
                return [null, -1];
            }
        };
        ContainerBlot.prototype.descendants = function (criteria, index, length) {
            if (index === void 0) { index = 0; }
            if (length === void 0) { length = Number.MAX_VALUE; }
            var descendants = [];
            var lengthLeft = length;
            this.children.forEachAt(index, length, function (child, index, length) {
                if ((criteria.blotName == null && criteria(child)) ||
                    (criteria.blotName != null && child instanceof criteria)) {
                    descendants.push(child);
                }
                if (child instanceof ContainerBlot) {
                    descendants = descendants.concat(child.descendants(criteria, index, lengthLeft));
                }
                lengthLeft -= length;
            });
            return descendants;
        };
        ContainerBlot.prototype.detach = function () {
            this.children.forEach(function (child) {
                child.detach();
            });
            _super.prototype.detach.call(this);
        };
        ContainerBlot.prototype.formatAt = function (index, length, name, value) {
            this.children.forEachAt(index, length, function (child, offset, length) {
                child.formatAt(offset, length, name, value);
            });
        };
        ContainerBlot.prototype.insertAt = function (index, value, def) {
            var _a = this.children.find(index), child = _a[0], offset = _a[1];
            if (child) {
                child.insertAt(offset, value, def);
            }
            else {
                var blot = def == null ? Registry.create('text', value) : Registry.create(value, def);
                this.appendChild(blot);
            }
        };
        ContainerBlot.prototype.insertBefore = function (childBlot, refBlot) {
            if (this.statics.allowedChildren != null &&
                !this.statics.allowedChildren.some(function (child) {
                    return childBlot instanceof child;
                })) {
                throw new Registry.ParchmentError("Cannot insert " + childBlot.statics.blotName + " into " + this.statics.blotName);
            }
            childBlot.insertInto(this, refBlot);
        };
        ContainerBlot.prototype.length = function () {
            return this.children.reduce(function (memo, child) {
                return memo + child.length();
            }, 0);
        };
        ContainerBlot.prototype.moveChildren = function (targetParent, refNode) {
            this.children.forEach(function (child) {
                targetParent.insertBefore(child, refNode);
            });
        };
        ContainerBlot.prototype.optimize = function (context) {
            _super.prototype.optimize.call(this, context);
            if (this.children.length === 0) {
                if (this.statics.defaultChild != null) {
                    var child = Registry.create(this.statics.defaultChild);
                    this.appendChild(child);
                    child.optimize(context);
                }
                else {
                    this.remove();
                }
            }
        };
        ContainerBlot.prototype.path = function (index, inclusive) {
            if (inclusive === void 0) { inclusive = false; }
            var _a = this.children.find(index, inclusive), child = _a[0], offset = _a[1];
            var position = [[this, index]];
            if (child instanceof ContainerBlot) {
                return position.concat(child.path(offset, inclusive));
            }
            else if (child != null) {
                position.push([child, offset]);
            }
            return position;
        };
        ContainerBlot.prototype.removeChild = function (child) {
            this.children.remove(child);
        };
        ContainerBlot.prototype.replace = function (target) {
            if (target instanceof ContainerBlot) {
                target.moveChildren(this);
            }
            _super.prototype.replace.call(this, target);
        };
        ContainerBlot.prototype.split = function (index, force) {
            if (force === void 0) { force = false; }
            if (!force) {
                if (index === 0)
                    return this;
                if (index === this.length())
                    return this.next;
            }
            var after = this.clone();
            this.parent.insertBefore(after, this.next);
            this.children.forEachAt(index, this.length(), function (child, offset, length) {
                child = child.split(offset, force);
                after.appendChild(child);
            });
            return after;
        };
        ContainerBlot.prototype.unwrap = function () {
            this.moveChildren(this.parent, this.next);
            this.remove();
        };
        ContainerBlot.prototype.update = function (mutations, context) {
            var _this = this;
            var addedNodes = [];
            var removedNodes = [];
            mutations.forEach(function (mutation) {
                if (mutation.target === _this.domNode && mutation.type === 'childList') {
                    addedNodes.push.apply(addedNodes, mutation.addedNodes);
                    removedNodes.push.apply(removedNodes, mutation.removedNodes);
                }
            });
            removedNodes.forEach(function (node) {
                // Check node has actually been removed
                // One exception is Chrome does not immediately remove IFRAMEs
                // from DOM but MutationRecord is correct in its reported removal
                if (node.parentNode != null &&
                    // @ts-ignore
                    node.tagName !== 'IFRAME' &&
                    document.body.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY) {
                    return;
                }
                var blot = Registry.find(node);
                if (blot == null)
                    return;
                if (blot.domNode.parentNode == null || blot.domNode.parentNode === _this.domNode) {
                    blot.detach();
                }
            });
            addedNodes
                .filter(function (node) {
                return node.parentNode == _this.domNode;
            })
                .sort(function (a, b) {
                if (a === b)
                    return 0;
                if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) {
                    return 1;
                }
                return -1;
            })
                .forEach(function (node) {
                var refBlot = null;
                if (node.nextSibling != null) {
                    refBlot = Registry.find(node.nextSibling);
                }
                var blot = makeBlot(node);
                if (blot.next != refBlot || blot.next == null) {
                    if (blot.parent != null) {
                        blot.parent.removeChild(_this);
                    }
                    _this.insertBefore(blot, refBlot || undefined);
                }
            });
        };
        return ContainerBlot;
    }(shadow_1.default));
    function makeBlot(node) {
        var blot = Registry.find(node);
        if (blot == null) {
            try {
                blot = Registry.create(node);
            }
            catch (e) {
                blot = Registry.create(Registry.Scope.INLINE);
                [].slice.call(node.childNodes).forEach(function (child) {
                    // @ts-ignore
                    blot.domNode.appendChild(child);
                });
                if (node.parentNode) {
                    node.parentNode.replaceChild(blot.domNode, node);
                }
                blot.attach();
            }
        }
        return blot;
    }
    exports.default = ContainerBlot;


    /***/ }),
    /* 18 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var attributor_1 = __webpack_require__(12);
    var store_1 = __webpack_require__(31);
    var container_1 = __webpack_require__(17);
    var Registry = __webpack_require__(1);
    var FormatBlot = /** @class */ (function (_super) {
        __extends(FormatBlot, _super);
        function FormatBlot(domNode) {
            var _this = _super.call(this, domNode) || this;
            _this.attributes = new store_1.default(_this.domNode);
            return _this;
        }
        FormatBlot.formats = function (domNode) {
            if (typeof this.tagName === 'string') {
                return true;
            }
            else if (Array.isArray(this.tagName)) {
                return domNode.tagName.toLowerCase();
            }
            return undefined;
        };
        FormatBlot.prototype.format = function (name, value) {
            var format = Registry.query(name);
            if (format instanceof attributor_1.default) {
                this.attributes.attribute(format, value);
            }
            else if (value) {
                if (format != null && (name !== this.statics.blotName || this.formats()[name] !== value)) {
                    this.replaceWith(name, value);
                }
            }
        };
        FormatBlot.prototype.formats = function () {
            var formats = this.attributes.values();
            var format = this.statics.formats(this.domNode);
            if (format != null) {
                formats[this.statics.blotName] = format;
            }
            return formats;
        };
        FormatBlot.prototype.replaceWith = function (name, value) {
            var replacement = _super.prototype.replaceWith.call(this, name, value);
            this.attributes.copy(replacement);
            return replacement;
        };
        FormatBlot.prototype.update = function (mutations, context) {
            var _this = this;
            _super.prototype.update.call(this, mutations, context);
            if (mutations.some(function (mutation) {
                return mutation.target === _this.domNode && mutation.type === 'attributes';
            })) {
                this.attributes.build();
            }
        };
        FormatBlot.prototype.wrap = function (name, value) {
            var wrapper = _super.prototype.wrap.call(this, name, value);
            if (wrapper instanceof FormatBlot && wrapper.statics.scope === this.statics.scope) {
                this.attributes.move(wrapper);
            }
            return wrapper;
        };
        return FormatBlot;
    }(container_1.default));
    exports.default = FormatBlot;


    /***/ }),
    /* 19 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var shadow_1 = __webpack_require__(30);
    var Registry = __webpack_require__(1);
    var LeafBlot = /** @class */ (function (_super) {
        __extends(LeafBlot, _super);
        function LeafBlot() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        LeafBlot.value = function (domNode) {
            return true;
        };
        LeafBlot.prototype.index = function (node, offset) {
            if (this.domNode === node ||
                this.domNode.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY) {
                return Math.min(offset, 1);
            }
            return -1;
        };
        LeafBlot.prototype.position = function (index, inclusive) {
            var offset = [].indexOf.call(this.parent.domNode.childNodes, this.domNode);
            if (index > 0)
                offset += 1;
            return [this.parent.domNode, offset];
        };
        LeafBlot.prototype.value = function () {
            var _a;
            return _a = {}, _a[this.statics.blotName] = this.statics.value(this.domNode) || true, _a;
        };
        LeafBlot.scope = Registry.Scope.INLINE_BLOT;
        return LeafBlot;
    }(shadow_1.default));
    exports.default = LeafBlot;


    /***/ }),
    /* 20 */
    /***/ (function(module, exports, __webpack_require__) {

    var equal = __webpack_require__(11);
    var extend = __webpack_require__(3);


    var lib = {
      attributes: {
        compose: function (a, b, keepNull) {
          if (typeof a !== 'object') a = {};
          if (typeof b !== 'object') b = {};
          var attributes = extend(true, {}, b);
          if (!keepNull) {
            attributes = Object.keys(attributes).reduce(function (copy, key) {
              if (attributes[key] != null) {
                copy[key] = attributes[key];
              }
              return copy;
            }, {});
          }
          for (var key in a) {
            if (a[key] !== undefined && b[key] === undefined) {
              attributes[key] = a[key];
            }
          }
          return Object.keys(attributes).length > 0 ? attributes : undefined;
        },

        diff: function(a, b) {
          if (typeof a !== 'object') a = {};
          if (typeof b !== 'object') b = {};
          var attributes = Object.keys(a).concat(Object.keys(b)).reduce(function (attributes, key) {
            if (!equal(a[key], b[key])) {
              attributes[key] = b[key] === undefined ? null : b[key];
            }
            return attributes;
          }, {});
          return Object.keys(attributes).length > 0 ? attributes : undefined;
        },

        transform: function (a, b, priority) {
          if (typeof a !== 'object') return b;
          if (typeof b !== 'object') return undefined;
          if (!priority) return b;  // b simply overwrites us without priority
          var attributes = Object.keys(b).reduce(function (attributes, key) {
            if (a[key] === undefined) attributes[key] = b[key];  // null is a valid value
            return attributes;
          }, {});
          return Object.keys(attributes).length > 0 ? attributes : undefined;
        }
      },

      iterator: function (ops) {
        return new Iterator(ops);
      },

      length: function (op) {
        if (typeof op['delete'] === 'number') {
          return op['delete'];
        } else if (typeof op.retain === 'number') {
          return op.retain;
        } else {
          return typeof op.insert === 'string' ? op.insert.length : 1;
        }
      }
    };


    function Iterator(ops) {
      this.ops = ops;
      this.index = 0;
      this.offset = 0;
    }
    Iterator.prototype.hasNext = function () {
      return this.peekLength() < Infinity;
    };

    Iterator.prototype.next = function (length) {
      if (!length) length = Infinity;
      var nextOp = this.ops[this.index];
      if (nextOp) {
        var offset = this.offset;
        var opLength = lib.length(nextOp);
        if (length >= opLength - offset) {
          length = opLength - offset;
          this.index += 1;
          this.offset = 0;
        } else {
          this.offset += length;
        }
        if (typeof nextOp['delete'] === 'number') {
          return { 'delete': length };
        } else {
          var retOp = {};
          if (nextOp.attributes) {
            retOp.attributes = nextOp.attributes;
          }
          if (typeof nextOp.retain === 'number') {
            retOp.retain = length;
          } else if (typeof nextOp.insert === 'string') {
            retOp.insert = nextOp.insert.substr(offset, length);
          } else {
            // offset should === 0, length should === 1
            retOp.insert = nextOp.insert;
          }
          return retOp;
        }
      } else {
        return { retain: Infinity };
      }
    };

    Iterator.prototype.peek = function () {
      return this.ops[this.index];
    };

    Iterator.prototype.peekLength = function () {
      if (this.ops[this.index]) {
        // Should never return 0 if our index is being managed correctly
        return lib.length(this.ops[this.index]) - this.offset;
      } else {
        return Infinity;
      }
    };

    Iterator.prototype.peekType = function () {
      if (this.ops[this.index]) {
        if (typeof this.ops[this.index]['delete'] === 'number') {
          return 'delete';
        } else if (typeof this.ops[this.index].retain === 'number') {
          return 'retain';
        } else {
          return 'insert';
        }
      }
      return 'retain';
    };

    Iterator.prototype.rest = function () {
      if (!this.hasNext()) {
        return [];
      } else if (this.offset === 0) {
        return this.ops.slice(this.index);
      } else {
        var offset = this.offset;
        var index = this.index;
        var next = this.next();
        var rest = this.ops.slice(this.index);
        this.offset = offset;
        this.index = index;
        return [next].concat(rest);
      }
    };


    module.exports = lib;


    /***/ }),
    /* 21 */
    /***/ (function(module, exports) {

    var clone = (function() {

    function _instanceof(obj, type) {
      return type != null && obj instanceof type;
    }

    var nativeMap;
    try {
      nativeMap = Map;
    } catch(_) {
      // maybe a reference error because no `Map`. Give it a dummy value that no
      // value will ever be an instanceof.
      nativeMap = function() {};
    }

    var nativeSet;
    try {
      nativeSet = Set;
    } catch(_) {
      nativeSet = function() {};
    }

    var nativePromise;
    try {
      nativePromise = Promise;
    } catch(_) {
      nativePromise = function() {};
    }

    /**
     * Clones (copies) an Object using deep copying.
     *
     * This function supports circular references by default, but if you are certain
     * there are no circular references in your object, you can save some CPU time
     * by calling clone(obj, false).
     *
     * Caution: if `circular` is false and `parent` contains circular references,
     * your program may enter an infinite loop and crash.
     *
     * @param `parent` - the object to be cloned
     * @param `circular` - set to true if the object to be cloned may contain
     *    circular references. (optional - true by default)
     * @param `depth` - set to a number if the object is only to be cloned to
     *    a particular depth. (optional - defaults to Infinity)
     * @param `prototype` - sets the prototype to be used when cloning an object.
     *    (optional - defaults to parent prototype).
     * @param `includeNonEnumerable` - set to true if the non-enumerable properties
     *    should be cloned as well. Non-enumerable properties on the prototype
     *    chain will be ignored. (optional - false by default)
    */
    function clone(parent, circular, depth, prototype, includeNonEnumerable) {
      if (typeof circular === 'object') {
        depth = circular.depth;
        prototype = circular.prototype;
        includeNonEnumerable = circular.includeNonEnumerable;
        circular = circular.circular;
      }
      // maintain two arrays for circular references, where corresponding parents
      // and children have the same index
      var allParents = [];
      var allChildren = [];

      var useBuffer = typeof Buffer != 'undefined';

      if (typeof circular == 'undefined')
        circular = true;

      if (typeof depth == 'undefined')
        depth = Infinity;

      // recurse this function so we don't reset allParents and allChildren
      function _clone(parent, depth) {
        // cloning null always returns null
        if (parent === null)
          return null;

        if (depth === 0)
          return parent;

        var child;
        var proto;
        if (typeof parent != 'object') {
          return parent;
        }

        if (_instanceof(parent, nativeMap)) {
          child = new nativeMap();
        } else if (_instanceof(parent, nativeSet)) {
          child = new nativeSet();
        } else if (_instanceof(parent, nativePromise)) {
          child = new nativePromise(function (resolve, reject) {
            parent.then(function(value) {
              resolve(_clone(value, depth - 1));
            }, function(err) {
              reject(_clone(err, depth - 1));
            });
          });
        } else if (clone.__isArray(parent)) {
          child = [];
        } else if (clone.__isRegExp(parent)) {
          child = new RegExp(parent.source, __getRegExpFlags(parent));
          if (parent.lastIndex) child.lastIndex = parent.lastIndex;
        } else if (clone.__isDate(parent)) {
          child = new Date(parent.getTime());
        } else if (useBuffer && Buffer.isBuffer(parent)) {
          if (Buffer.allocUnsafe) {
            // Node.js >= 4.5.0
            child = Buffer.allocUnsafe(parent.length);
          } else {
            // Older Node.js versions
            child = new Buffer(parent.length);
          }
          parent.copy(child);
          return child;
        } else if (_instanceof(parent, Error)) {
          child = Object.create(parent);
        } else {
          if (typeof prototype == 'undefined') {
            proto = Object.getPrototypeOf(parent);
            child = Object.create(proto);
          }
          else {
            child = Object.create(prototype);
            proto = prototype;
          }
        }

        if (circular) {
          var index = allParents.indexOf(parent);

          if (index != -1) {
            return allChildren[index];
          }
          allParents.push(parent);
          allChildren.push(child);
        }

        if (_instanceof(parent, nativeMap)) {
          parent.forEach(function(value, key) {
            var keyChild = _clone(key, depth - 1);
            var valueChild = _clone(value, depth - 1);
            child.set(keyChild, valueChild);
          });
        }
        if (_instanceof(parent, nativeSet)) {
          parent.forEach(function(value) {
            var entryChild = _clone(value, depth - 1);
            child.add(entryChild);
          });
        }

        for (var i in parent) {
          var attrs;
          if (proto) {
            attrs = Object.getOwnPropertyDescriptor(proto, i);
          }

          if (attrs && attrs.set == null) {
            continue;
          }
          child[i] = _clone(parent[i], depth - 1);
        }

        if (Object.getOwnPropertySymbols) {
          var symbols = Object.getOwnPropertySymbols(parent);
          for (var i = 0; i < symbols.length; i++) {
            // Don't need to worry about cloning a symbol because it is a primitive,
            // like a number or string.
            var symbol = symbols[i];
            var descriptor = Object.getOwnPropertyDescriptor(parent, symbol);
            if (descriptor && !descriptor.enumerable && !includeNonEnumerable) {
              continue;
            }
            child[symbol] = _clone(parent[symbol], depth - 1);
            if (!descriptor.enumerable) {
              Object.defineProperty(child, symbol, {
                enumerable: false
              });
            }
          }
        }

        if (includeNonEnumerable) {
          var allPropertyNames = Object.getOwnPropertyNames(parent);
          for (var i = 0; i < allPropertyNames.length; i++) {
            var propertyName = allPropertyNames[i];
            var descriptor = Object.getOwnPropertyDescriptor(parent, propertyName);
            if (descriptor && descriptor.enumerable) {
              continue;
            }
            child[propertyName] = _clone(parent[propertyName], depth - 1);
            Object.defineProperty(child, propertyName, {
              enumerable: false
            });
          }
        }

        return child;
      }

      return _clone(parent, depth);
    }

    /**
     * Simple flat clone using prototype, accepts only objects, usefull for property
     * override on FLAT configuration object (no nested props).
     *
     * USE WITH CAUTION! This may not behave as you wish if you do not know how this
     * works.
     */
    clone.clonePrototype = function clonePrototype(parent) {
      if (parent === null)
        return null;

      var c = function () {};
      c.prototype = parent;
      return new c();
    };

    // private utility functions

    function __objToStr(o) {
      return Object.prototype.toString.call(o);
    }
    clone.__objToStr = __objToStr;

    function __isDate(o) {
      return typeof o === 'object' && __objToStr(o) === '[object Date]';
    }
    clone.__isDate = __isDate;

    function __isArray(o) {
      return typeof o === 'object' && __objToStr(o) === '[object Array]';
    }
    clone.__isArray = __isArray;

    function __isRegExp(o) {
      return typeof o === 'object' && __objToStr(o) === '[object RegExp]';
    }
    clone.__isRegExp = __isRegExp;

    function __getRegExpFlags(re) {
      var flags = '';
      if (re.global) flags += 'g';
      if (re.ignoreCase) flags += 'i';
      if (re.multiline) flags += 'm';
      return flags;
    }
    clone.__getRegExpFlags = __getRegExpFlags;

    return clone;
    })();

    if (typeof module === 'object' && module.exports) {
      module.exports = clone;
    }


    /***/ }),
    /* 22 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _emitter = __webpack_require__(8);

    var _emitter2 = _interopRequireDefault(_emitter);

    var _block = __webpack_require__(4);

    var _block2 = _interopRequireDefault(_block);

    var _break = __webpack_require__(16);

    var _break2 = _interopRequireDefault(_break);

    var _code = __webpack_require__(13);

    var _code2 = _interopRequireDefault(_code);

    var _container = __webpack_require__(25);

    var _container2 = _interopRequireDefault(_container);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    function isLine(blot) {
      return blot instanceof _block2.default || blot instanceof _block.BlockEmbed;
    }

    var Scroll = function (_Parchment$Scroll) {
      _inherits(Scroll, _Parchment$Scroll);

      function Scroll(domNode, config) {
        _classCallCheck(this, Scroll);

        var _this = _possibleConstructorReturn(this, (Scroll.__proto__ || Object.getPrototypeOf(Scroll)).call(this, domNode));

        _this.emitter = config.emitter;
        if (Array.isArray(config.whitelist)) {
          _this.whitelist = config.whitelist.reduce(function (whitelist, format) {
            whitelist[format] = true;
            return whitelist;
          }, {});
        }
        // Some reason fixes composition issues with character languages in Windows/Chrome, Safari
        _this.domNode.addEventListener('DOMNodeInserted', function () {});
        _this.optimize();
        _this.enable();
        return _this;
      }

      _createClass(Scroll, [{
        key: 'batchStart',
        value: function batchStart() {
          this.batch = true;
        }
      }, {
        key: 'batchEnd',
        value: function batchEnd() {
          this.batch = false;
          this.optimize();
        }
      }, {
        key: 'deleteAt',
        value: function deleteAt(index, length) {
          var _line = this.line(index),
              _line2 = _slicedToArray(_line, 2),
              first = _line2[0],
              offset = _line2[1];

          var _line3 = this.line(index + length),
              _line4 = _slicedToArray(_line3, 1),
              last = _line4[0];

          _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'deleteAt', this).call(this, index, length);
          if (last != null && first !== last && offset > 0) {
            if (first instanceof _block.BlockEmbed || last instanceof _block.BlockEmbed) {
              this.optimize();
              return;
            }
            if (first instanceof _code2.default) {
              var newlineIndex = first.newlineIndex(first.length(), true);
              if (newlineIndex > -1) {
                first = first.split(newlineIndex + 1);
                if (first === last) {
                  this.optimize();
                  return;
                }
              }
            } else if (last instanceof _code2.default) {
              var _newlineIndex = last.newlineIndex(0);
              if (_newlineIndex > -1) {
                last.split(_newlineIndex + 1);
              }
            }
            var ref = last.children.head instanceof _break2.default ? null : last.children.head;
            first.moveChildren(last, ref);
            first.remove();
          }
          this.optimize();
        }
      }, {
        key: 'enable',
        value: function enable() {
          var enabled = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

          this.domNode.setAttribute('contenteditable', enabled);
        }
      }, {
        key: 'formatAt',
        value: function formatAt(index, length, format, value) {
          if (this.whitelist != null && !this.whitelist[format]) return;
          _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'formatAt', this).call(this, index, length, format, value);
          this.optimize();
        }
      }, {
        key: 'insertAt',
        value: function insertAt(index, value, def) {
          if (def != null && this.whitelist != null && !this.whitelist[value]) return;
          if (index >= this.length()) {
            if (def == null || _parchment2.default.query(value, _parchment2.default.Scope.BLOCK) == null) {
              var blot = _parchment2.default.create(this.statics.defaultChild);
              this.appendChild(blot);
              if (def == null && value.endsWith('\n')) {
                value = value.slice(0, -1);
              }
              blot.insertAt(0, value, def);
            } else {
              var embed = _parchment2.default.create(value, def);
              this.appendChild(embed);
            }
          } else {
            _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'insertAt', this).call(this, index, value, def);
          }
          this.optimize();
        }
      }, {
        key: 'insertBefore',
        value: function insertBefore(blot, ref) {
          if (blot.statics.scope === _parchment2.default.Scope.INLINE_BLOT) {
            var wrapper = _parchment2.default.create(this.statics.defaultChild);
            wrapper.appendChild(blot);
            blot = wrapper;
          }
          _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'insertBefore', this).call(this, blot, ref);
        }
      }, {
        key: 'leaf',
        value: function leaf(index) {
          return this.path(index).pop() || [null, -1];
        }
      }, {
        key: 'line',
        value: function line(index) {
          if (index === this.length()) {
            return this.line(index - 1);
          }
          return this.descendant(isLine, index);
        }
      }, {
        key: 'lines',
        value: function lines() {
          var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Number.MAX_VALUE;

          var getLines = function getLines(blot, index, length) {
            var lines = [],
                lengthLeft = length;
            blot.children.forEachAt(index, length, function (child, index, length) {
              if (isLine(child)) {
                lines.push(child);
              } else if (child instanceof _parchment2.default.Container) {
                lines = lines.concat(getLines(child, index, lengthLeft));
              }
              lengthLeft -= length;
            });
            return lines;
          };
          return getLines(this, index, length);
        }
      }, {
        key: 'optimize',
        value: function optimize() {
          var mutations = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
          var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

          if (this.batch === true) return;
          _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'optimize', this).call(this, mutations, context);
          if (mutations.length > 0) {
            this.emitter.emit(_emitter2.default.events.SCROLL_OPTIMIZE, mutations, context);
          }
        }
      }, {
        key: 'path',
        value: function path(index) {
          return _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'path', this).call(this, index).slice(1); // Exclude self
        }
      }, {
        key: 'update',
        value: function update(mutations) {
          if (this.batch === true) return;
          var source = _emitter2.default.sources.USER;
          if (typeof mutations === 'string') {
            source = mutations;
          }
          if (!Array.isArray(mutations)) {
            mutations = this.observer.takeRecords();
          }
          if (mutations.length > 0) {
            this.emitter.emit(_emitter2.default.events.SCROLL_BEFORE_UPDATE, source, mutations);
          }
          _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'update', this).call(this, mutations.concat([])); // pass copy
          if (mutations.length > 0) {
            this.emitter.emit(_emitter2.default.events.SCROLL_UPDATE, source, mutations);
          }
        }
      }]);

      return Scroll;
    }(_parchment2.default.Scroll);

    Scroll.blotName = 'scroll';
    Scroll.className = 'ql-editor';
    Scroll.tagName = 'DIV';
    Scroll.defaultChild = 'block';
    Scroll.allowedChildren = [_block2.default, _block.BlockEmbed, _container2.default];

    exports.default = Scroll;

    /***/ }),
    /* 23 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.SHORTKEY = exports.default = undefined;

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _clone = __webpack_require__(21);

    var _clone2 = _interopRequireDefault(_clone);

    var _deepEqual = __webpack_require__(11);

    var _deepEqual2 = _interopRequireDefault(_deepEqual);

    var _extend = __webpack_require__(3);

    var _extend2 = _interopRequireDefault(_extend);

    var _quillDelta = __webpack_require__(2);

    var _quillDelta2 = _interopRequireDefault(_quillDelta);

    var _op = __webpack_require__(20);

    var _op2 = _interopRequireDefault(_op);

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _quill = __webpack_require__(5);

    var _quill2 = _interopRequireDefault(_quill);

    var _logger = __webpack_require__(10);

    var _logger2 = _interopRequireDefault(_logger);

    var _module = __webpack_require__(9);

    var _module2 = _interopRequireDefault(_module);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var debug = (0, _logger2.default)('quill:keyboard');

    var SHORTKEY = /Mac/i.test(navigator.platform) ? 'metaKey' : 'ctrlKey';

    var Keyboard = function (_Module) {
      _inherits(Keyboard, _Module);

      _createClass(Keyboard, null, [{
        key: 'match',
        value: function match(evt, binding) {
          binding = normalize(binding);
          if (['altKey', 'ctrlKey', 'metaKey', 'shiftKey'].some(function (key) {
            return !!binding[key] !== evt[key] && binding[key] !== null;
          })) {
            return false;
          }
          return binding.key === (evt.which || evt.keyCode);
        }
      }]);

      function Keyboard(quill, options) {
        _classCallCheck(this, Keyboard);

        var _this = _possibleConstructorReturn(this, (Keyboard.__proto__ || Object.getPrototypeOf(Keyboard)).call(this, quill, options));

        _this.bindings = {};
        Object.keys(_this.options.bindings).forEach(function (name) {
          if (name === 'list autofill' && quill.scroll.whitelist != null && !quill.scroll.whitelist['list']) {
            return;
          }
          if (_this.options.bindings[name]) {
            _this.addBinding(_this.options.bindings[name]);
          }
        });
        _this.addBinding({ key: Keyboard.keys.ENTER, shiftKey: null }, handleEnter);
        _this.addBinding({ key: Keyboard.keys.ENTER, metaKey: null, ctrlKey: null, altKey: null }, function () {});
        if (/Firefox/i.test(navigator.userAgent)) {
          // Need to handle delete and backspace for Firefox in the general case #1171
          _this.addBinding({ key: Keyboard.keys.BACKSPACE }, { collapsed: true }, handleBackspace);
          _this.addBinding({ key: Keyboard.keys.DELETE }, { collapsed: true }, handleDelete);
        } else {
          _this.addBinding({ key: Keyboard.keys.BACKSPACE }, { collapsed: true, prefix: /^.?$/ }, handleBackspace);
          _this.addBinding({ key: Keyboard.keys.DELETE }, { collapsed: true, suffix: /^.?$/ }, handleDelete);
        }
        _this.addBinding({ key: Keyboard.keys.BACKSPACE }, { collapsed: false }, handleDeleteRange);
        _this.addBinding({ key: Keyboard.keys.DELETE }, { collapsed: false }, handleDeleteRange);
        _this.addBinding({ key: Keyboard.keys.BACKSPACE, altKey: null, ctrlKey: null, metaKey: null, shiftKey: null }, { collapsed: true, offset: 0 }, handleBackspace);
        _this.listen();
        return _this;
      }

      _createClass(Keyboard, [{
        key: 'addBinding',
        value: function addBinding(key) {
          var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
          var handler = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

          var binding = normalize(key);
          if (binding == null || binding.key == null) {
            return debug.warn('Attempted to add invalid keyboard binding', binding);
          }
          if (typeof context === 'function') {
            context = { handler: context };
          }
          if (typeof handler === 'function') {
            handler = { handler: handler };
          }
          binding = (0, _extend2.default)(binding, context, handler);
          this.bindings[binding.key] = this.bindings[binding.key] || [];
          this.bindings[binding.key].push(binding);
        }
      }, {
        key: 'listen',
        value: function listen() {
          var _this2 = this;

          this.quill.root.addEventListener('keydown', function (evt) {
            if (evt.defaultPrevented) return;
            var which = evt.which || evt.keyCode;
            var bindings = (_this2.bindings[which] || []).filter(function (binding) {
              return Keyboard.match(evt, binding);
            });
            if (bindings.length === 0) return;
            var range = _this2.quill.getSelection();
            if (range == null || !_this2.quill.hasFocus()) return;

            var _quill$getLine = _this2.quill.getLine(range.index),
                _quill$getLine2 = _slicedToArray(_quill$getLine, 2),
                line = _quill$getLine2[0],
                offset = _quill$getLine2[1];

            var _quill$getLeaf = _this2.quill.getLeaf(range.index),
                _quill$getLeaf2 = _slicedToArray(_quill$getLeaf, 2),
                leafStart = _quill$getLeaf2[0],
                offsetStart = _quill$getLeaf2[1];

            var _ref = range.length === 0 ? [leafStart, offsetStart] : _this2.quill.getLeaf(range.index + range.length),
                _ref2 = _slicedToArray(_ref, 2),
                leafEnd = _ref2[0],
                offsetEnd = _ref2[1];

            var prefixText = leafStart instanceof _parchment2.default.Text ? leafStart.value().slice(0, offsetStart) : '';
            var suffixText = leafEnd instanceof _parchment2.default.Text ? leafEnd.value().slice(offsetEnd) : '';
            var curContext = {
              collapsed: range.length === 0,
              empty: range.length === 0 && line.length() <= 1,
              format: _this2.quill.getFormat(range),
              offset: offset,
              prefix: prefixText,
              suffix: suffixText
            };
            var prevented = bindings.some(function (binding) {
              if (binding.collapsed != null && binding.collapsed !== curContext.collapsed) return false;
              if (binding.empty != null && binding.empty !== curContext.empty) return false;
              if (binding.offset != null && binding.offset !== curContext.offset) return false;
              if (Array.isArray(binding.format)) {
                // any format is present
                if (binding.format.every(function (name) {
                  return curContext.format[name] == null;
                })) {
                  return false;
                }
              } else if (_typeof(binding.format) === 'object') {
                // all formats must match
                if (!Object.keys(binding.format).every(function (name) {
                  if (binding.format[name] === true) return curContext.format[name] != null;
                  if (binding.format[name] === false) return curContext.format[name] == null;
                  return (0, _deepEqual2.default)(binding.format[name], curContext.format[name]);
                })) {
                  return false;
                }
              }
              if (binding.prefix != null && !binding.prefix.test(curContext.prefix)) return false;
              if (binding.suffix != null && !binding.suffix.test(curContext.suffix)) return false;
              return binding.handler.call(_this2, range, curContext) !== true;
            });
            if (prevented) {
              evt.preventDefault();
            }
          });
        }
      }]);

      return Keyboard;
    }(_module2.default);

    Keyboard.keys = {
      BACKSPACE: 8,
      TAB: 9,
      ENTER: 13,
      ESCAPE: 27,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      DELETE: 46
    };

    Keyboard.DEFAULTS = {
      bindings: {
        'bold': makeFormatHandler('bold'),
        'italic': makeFormatHandler('italic'),
        'underline': makeFormatHandler('underline'),
        'indent': {
          // highlight tab or tab at beginning of list, indent or blockquote
          key: Keyboard.keys.TAB,
          format: ['blockquote', 'indent', 'list'],
          handler: function handler(range, context) {
            if (context.collapsed && context.offset !== 0) return true;
            this.quill.format('indent', '+1', _quill2.default.sources.USER);
          }
        },
        'outdent': {
          key: Keyboard.keys.TAB,
          shiftKey: true,
          format: ['blockquote', 'indent', 'list'],
          // highlight tab or tab at beginning of list, indent or blockquote
          handler: function handler(range, context) {
            if (context.collapsed && context.offset !== 0) return true;
            this.quill.format('indent', '-1', _quill2.default.sources.USER);
          }
        },
        'outdent backspace': {
          key: Keyboard.keys.BACKSPACE,
          collapsed: true,
          shiftKey: null,
          metaKey: null,
          ctrlKey: null,
          altKey: null,
          format: ['indent', 'list'],
          offset: 0,
          handler: function handler(range, context) {
            if (context.format.indent != null) {
              this.quill.format('indent', '-1', _quill2.default.sources.USER);
            } else if (context.format.list != null) {
              this.quill.format('list', false, _quill2.default.sources.USER);
            }
          }
        },
        'indent code-block': makeCodeBlockHandler(true),
        'outdent code-block': makeCodeBlockHandler(false),
        'remove tab': {
          key: Keyboard.keys.TAB,
          shiftKey: true,
          collapsed: true,
          prefix: /\t$/,
          handler: function handler(range) {
            this.quill.deleteText(range.index - 1, 1, _quill2.default.sources.USER);
          }
        },
        'tab': {
          key: Keyboard.keys.TAB,
          handler: function handler(range) {
            this.quill.history.cutoff();
            var delta = new _quillDelta2.default().retain(range.index).delete(range.length).insert('\t');
            this.quill.updateContents(delta, _quill2.default.sources.USER);
            this.quill.history.cutoff();
            this.quill.setSelection(range.index + 1, _quill2.default.sources.SILENT);
          }
        },
        'list empty enter': {
          key: Keyboard.keys.ENTER,
          collapsed: true,
          format: ['list'],
          empty: true,
          handler: function handler(range, context) {
            this.quill.format('list', false, _quill2.default.sources.USER);
            if (context.format.indent) {
              this.quill.format('indent', false, _quill2.default.sources.USER);
            }
          }
        },
        'checklist enter': {
          key: Keyboard.keys.ENTER,
          collapsed: true,
          format: { list: 'checked' },
          handler: function handler(range) {
            var _quill$getLine3 = this.quill.getLine(range.index),
                _quill$getLine4 = _slicedToArray(_quill$getLine3, 2),
                line = _quill$getLine4[0],
                offset = _quill$getLine4[1];

            var formats = (0, _extend2.default)({}, line.formats(), { list: 'checked' });
            var delta = new _quillDelta2.default().retain(range.index).insert('\n', formats).retain(line.length() - offset - 1).retain(1, { list: 'unchecked' });
            this.quill.updateContents(delta, _quill2.default.sources.USER);
            this.quill.setSelection(range.index + 1, _quill2.default.sources.SILENT);
            this.quill.scrollIntoView();
          }
        },
        'header enter': {
          key: Keyboard.keys.ENTER,
          collapsed: true,
          format: ['header'],
          suffix: /^$/,
          handler: function handler(range, context) {
            var _quill$getLine5 = this.quill.getLine(range.index),
                _quill$getLine6 = _slicedToArray(_quill$getLine5, 2),
                line = _quill$getLine6[0],
                offset = _quill$getLine6[1];

            var delta = new _quillDelta2.default().retain(range.index).insert('\n', context.format).retain(line.length() - offset - 1).retain(1, { header: null });
            this.quill.updateContents(delta, _quill2.default.sources.USER);
            this.quill.setSelection(range.index + 1, _quill2.default.sources.SILENT);
            this.quill.scrollIntoView();
          }
        },
        'list autofill': {
          key: ' ',
          collapsed: true,
          format: { list: false },
          prefix: /^\s*?(\d+\.|-|\*|\[ ?\]|\[x\])$/,
          handler: function handler(range, context) {
            var length = context.prefix.length;

            var _quill$getLine7 = this.quill.getLine(range.index),
                _quill$getLine8 = _slicedToArray(_quill$getLine7, 2),
                line = _quill$getLine8[0],
                offset = _quill$getLine8[1];

            if (offset > length) return true;
            var value = void 0;
            switch (context.prefix.trim()) {
              case '[]':case '[ ]':
                value = 'unchecked';
                break;
              case '[x]':
                value = 'checked';
                break;
              case '-':case '*':
                value = 'bullet';
                break;
              default:
                value = 'ordered';
            }
            this.quill.insertText(range.index, ' ', _quill2.default.sources.USER);
            this.quill.history.cutoff();
            var delta = new _quillDelta2.default().retain(range.index - offset).delete(length + 1).retain(line.length() - 2 - offset).retain(1, { list: value });
            this.quill.updateContents(delta, _quill2.default.sources.USER);
            this.quill.history.cutoff();
            this.quill.setSelection(range.index - length, _quill2.default.sources.SILENT);
          }
        },
        'code exit': {
          key: Keyboard.keys.ENTER,
          collapsed: true,
          format: ['code-block'],
          prefix: /\n\n$/,
          suffix: /^\s+$/,
          handler: function handler(range) {
            var _quill$getLine9 = this.quill.getLine(range.index),
                _quill$getLine10 = _slicedToArray(_quill$getLine9, 2),
                line = _quill$getLine10[0],
                offset = _quill$getLine10[1];

            var delta = new _quillDelta2.default().retain(range.index + line.length() - offset - 2).retain(1, { 'code-block': null }).delete(1);
            this.quill.updateContents(delta, _quill2.default.sources.USER);
          }
        },
        'embed left': makeEmbedArrowHandler(Keyboard.keys.LEFT, false),
        'embed left shift': makeEmbedArrowHandler(Keyboard.keys.LEFT, true),
        'embed right': makeEmbedArrowHandler(Keyboard.keys.RIGHT, false),
        'embed right shift': makeEmbedArrowHandler(Keyboard.keys.RIGHT, true)
      }
    };

    function makeEmbedArrowHandler(key, shiftKey) {
      var _ref3;

      var where = key === Keyboard.keys.LEFT ? 'prefix' : 'suffix';
      return _ref3 = {
        key: key,
        shiftKey: shiftKey,
        altKey: null
      }, _defineProperty(_ref3, where, /^$/), _defineProperty(_ref3, 'handler', function handler(range) {
        var index = range.index;
        if (key === Keyboard.keys.RIGHT) {
          index += range.length + 1;
        }

        var _quill$getLeaf3 = this.quill.getLeaf(index),
            _quill$getLeaf4 = _slicedToArray(_quill$getLeaf3, 1),
            leaf = _quill$getLeaf4[0];

        if (!(leaf instanceof _parchment2.default.Embed)) return true;
        if (key === Keyboard.keys.LEFT) {
          if (shiftKey) {
            this.quill.setSelection(range.index - 1, range.length + 1, _quill2.default.sources.USER);
          } else {
            this.quill.setSelection(range.index - 1, _quill2.default.sources.USER);
          }
        } else {
          if (shiftKey) {
            this.quill.setSelection(range.index, range.length + 1, _quill2.default.sources.USER);
          } else {
            this.quill.setSelection(range.index + range.length + 1, _quill2.default.sources.USER);
          }
        }
        return false;
      }), _ref3;
    }

    function handleBackspace(range, context) {
      if (range.index === 0 || this.quill.getLength() <= 1) return;

      var _quill$getLine11 = this.quill.getLine(range.index),
          _quill$getLine12 = _slicedToArray(_quill$getLine11, 1),
          line = _quill$getLine12[0];

      var formats = {};
      if (context.offset === 0) {
        var _quill$getLine13 = this.quill.getLine(range.index - 1),
            _quill$getLine14 = _slicedToArray(_quill$getLine13, 1),
            prev = _quill$getLine14[0];

        if (prev != null && prev.length() > 1) {
          var curFormats = line.formats();
          var prevFormats = this.quill.getFormat(range.index - 1, 1);
          formats = _op2.default.attributes.diff(curFormats, prevFormats) || {};
        }
      }
      // Check for astral symbols
      var length = /[\uD800-\uDBFF][\uDC00-\uDFFF]$/.test(context.prefix) ? 2 : 1;
      this.quill.deleteText(range.index - length, length, _quill2.default.sources.USER);
      if (Object.keys(formats).length > 0) {
        this.quill.formatLine(range.index - length, length, formats, _quill2.default.sources.USER);
      }
      this.quill.focus();
    }

    function handleDelete(range, context) {
      // Check for astral symbols
      var length = /^[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(context.suffix) ? 2 : 1;
      if (range.index >= this.quill.getLength() - length) return;
      var formats = {},
          nextLength = 0;

      var _quill$getLine15 = this.quill.getLine(range.index),
          _quill$getLine16 = _slicedToArray(_quill$getLine15, 1),
          line = _quill$getLine16[0];

      if (context.offset >= line.length() - 1) {
        var _quill$getLine17 = this.quill.getLine(range.index + 1),
            _quill$getLine18 = _slicedToArray(_quill$getLine17, 1),
            next = _quill$getLine18[0];

        if (next) {
          var curFormats = line.formats();
          var nextFormats = this.quill.getFormat(range.index, 1);
          formats = _op2.default.attributes.diff(curFormats, nextFormats) || {};
          nextLength = next.length();
        }
      }
      this.quill.deleteText(range.index, length, _quill2.default.sources.USER);
      if (Object.keys(formats).length > 0) {
        this.quill.formatLine(range.index + nextLength - 1, length, formats, _quill2.default.sources.USER);
      }
    }

    function handleDeleteRange(range) {
      var lines = this.quill.getLines(range);
      var formats = {};
      if (lines.length > 1) {
        var firstFormats = lines[0].formats();
        var lastFormats = lines[lines.length - 1].formats();
        formats = _op2.default.attributes.diff(lastFormats, firstFormats) || {};
      }
      this.quill.deleteText(range, _quill2.default.sources.USER);
      if (Object.keys(formats).length > 0) {
        this.quill.formatLine(range.index, 1, formats, _quill2.default.sources.USER);
      }
      this.quill.setSelection(range.index, _quill2.default.sources.SILENT);
      this.quill.focus();
    }

    function handleEnter(range, context) {
      var _this3 = this;

      if (range.length > 0) {
        this.quill.scroll.deleteAt(range.index, range.length); // So we do not trigger text-change
      }
      var lineFormats = Object.keys(context.format).reduce(function (lineFormats, format) {
        if (_parchment2.default.query(format, _parchment2.default.Scope.BLOCK) && !Array.isArray(context.format[format])) {
          lineFormats[format] = context.format[format];
        }
        return lineFormats;
      }, {});
      this.quill.insertText(range.index, '\n', lineFormats, _quill2.default.sources.USER);
      // Earlier scroll.deleteAt might have messed up our selection,
      // so insertText's built in selection preservation is not reliable
      this.quill.setSelection(range.index + 1, _quill2.default.sources.SILENT);
      this.quill.focus();
      Object.keys(context.format).forEach(function (name) {
        if (lineFormats[name] != null) return;
        if (Array.isArray(context.format[name])) return;
        if (name === 'link') return;
        _this3.quill.format(name, context.format[name], _quill2.default.sources.USER);
      });
    }

    function makeCodeBlockHandler(indent) {
      return {
        key: Keyboard.keys.TAB,
        shiftKey: !indent,
        format: { 'code-block': true },
        handler: function handler(range) {
          var CodeBlock = _parchment2.default.query('code-block');
          var index = range.index,
              length = range.length;

          var _quill$scroll$descend = this.quill.scroll.descendant(CodeBlock, index),
              _quill$scroll$descend2 = _slicedToArray(_quill$scroll$descend, 2),
              block = _quill$scroll$descend2[0],
              offset = _quill$scroll$descend2[1];

          if (block == null) return;
          var scrollIndex = this.quill.getIndex(block);
          var start = block.newlineIndex(offset, true) + 1;
          var end = block.newlineIndex(scrollIndex + offset + length);
          var lines = block.domNode.textContent.slice(start, end).split('\n');
          offset = 0;
          lines.forEach(function (line, i) {
            if (indent) {
              block.insertAt(start + offset, CodeBlock.TAB);
              offset += CodeBlock.TAB.length;
              if (i === 0) {
                index += CodeBlock.TAB.length;
              } else {
                length += CodeBlock.TAB.length;
              }
            } else if (line.startsWith(CodeBlock.TAB)) {
              block.deleteAt(start + offset, CodeBlock.TAB.length);
              offset -= CodeBlock.TAB.length;
              if (i === 0) {
                index -= CodeBlock.TAB.length;
              } else {
                length -= CodeBlock.TAB.length;
              }
            }
            offset += line.length + 1;
          });
          this.quill.update(_quill2.default.sources.USER);
          this.quill.setSelection(index, length, _quill2.default.sources.SILENT);
        }
      };
    }

    function makeFormatHandler(format) {
      return {
        key: format[0].toUpperCase(),
        shortKey: true,
        handler: function handler(range, context) {
          this.quill.format(format, !context.format[format], _quill2.default.sources.USER);
        }
      };
    }

    function normalize(binding) {
      if (typeof binding === 'string' || typeof binding === 'number') {
        return normalize({ key: binding });
      }
      if ((typeof binding === 'undefined' ? 'undefined' : _typeof(binding)) === 'object') {
        binding = (0, _clone2.default)(binding, false);
      }
      if (typeof binding.key === 'string') {
        if (Keyboard.keys[binding.key.toUpperCase()] != null) {
          binding.key = Keyboard.keys[binding.key.toUpperCase()];
        } else if (binding.key.length === 1) {
          binding.key = binding.key.toUpperCase().charCodeAt(0);
        } else {
          return null;
        }
      }
      if (binding.shortKey) {
        binding[SHORTKEY] = binding.shortKey;
        delete binding.shortKey;
      }
      return binding;
    }

    exports.default = Keyboard;
    exports.SHORTKEY = SHORTKEY;

    /***/ }),
    /* 24 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _text = __webpack_require__(7);

    var _text2 = _interopRequireDefault(_text);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Cursor = function (_Parchment$Embed) {
      _inherits(Cursor, _Parchment$Embed);

      _createClass(Cursor, null, [{
        key: 'value',
        value: function value() {
          return undefined;
        }
      }]);

      function Cursor(domNode, selection) {
        _classCallCheck(this, Cursor);

        var _this = _possibleConstructorReturn(this, (Cursor.__proto__ || Object.getPrototypeOf(Cursor)).call(this, domNode));

        _this.selection = selection;
        _this.textNode = document.createTextNode(Cursor.CONTENTS);
        _this.domNode.appendChild(_this.textNode);
        _this._length = 0;
        return _this;
      }

      _createClass(Cursor, [{
        key: 'detach',
        value: function detach() {
          // super.detach() will also clear domNode.__blot
          if (this.parent != null) this.parent.removeChild(this);
        }
      }, {
        key: 'format',
        value: function format(name, value) {
          if (this._length !== 0) {
            return _get(Cursor.prototype.__proto__ || Object.getPrototypeOf(Cursor.prototype), 'format', this).call(this, name, value);
          }
          var target = this,
              index = 0;
          while (target != null && target.statics.scope !== _parchment2.default.Scope.BLOCK_BLOT) {
            index += target.offset(target.parent);
            target = target.parent;
          }
          if (target != null) {
            this._length = Cursor.CONTENTS.length;
            target.optimize();
            target.formatAt(index, Cursor.CONTENTS.length, name, value);
            this._length = 0;
          }
        }
      }, {
        key: 'index',
        value: function index(node, offset) {
          if (node === this.textNode) return 0;
          return _get(Cursor.prototype.__proto__ || Object.getPrototypeOf(Cursor.prototype), 'index', this).call(this, node, offset);
        }
      }, {
        key: 'length',
        value: function length() {
          return this._length;
        }
      }, {
        key: 'position',
        value: function position() {
          return [this.textNode, this.textNode.data.length];
        }
      }, {
        key: 'remove',
        value: function remove() {
          _get(Cursor.prototype.__proto__ || Object.getPrototypeOf(Cursor.prototype), 'remove', this).call(this);
          this.parent = null;
        }
      }, {
        key: 'restore',
        value: function restore() {
          if (this.selection.composing || this.parent == null) return;
          var textNode = this.textNode;
          var range = this.selection.getNativeRange();
          var restoreText = void 0,
              start = void 0,
              end = void 0;
          if (range != null && range.start.node === textNode && range.end.node === textNode) {
            var _ref = [textNode, range.start.offset, range.end.offset];
            restoreText = _ref[0];
            start = _ref[1];
            end = _ref[2];
          }
          // Link format will insert text outside of anchor tag
          while (this.domNode.lastChild != null && this.domNode.lastChild !== this.textNode) {
            this.domNode.parentNode.insertBefore(this.domNode.lastChild, this.domNode);
          }
          if (this.textNode.data !== Cursor.CONTENTS) {
            var text = this.textNode.data.split(Cursor.CONTENTS).join('');
            if (this.next instanceof _text2.default) {
              restoreText = this.next.domNode;
              this.next.insertAt(0, text);
              this.textNode.data = Cursor.CONTENTS;
            } else {
              this.textNode.data = text;
              this.parent.insertBefore(_parchment2.default.create(this.textNode), this);
              this.textNode = document.createTextNode(Cursor.CONTENTS);
              this.domNode.appendChild(this.textNode);
            }
          }
          this.remove();
          if (start != null) {
            var _map = [start, end].map(function (offset) {
              return Math.max(0, Math.min(restoreText.data.length, offset - 1));
            });

            var _map2 = _slicedToArray(_map, 2);

            start = _map2[0];
            end = _map2[1];

            return {
              startNode: restoreText,
              startOffset: start,
              endNode: restoreText,
              endOffset: end
            };
          }
        }
      }, {
        key: 'update',
        value: function update(mutations, context) {
          var _this2 = this;

          if (mutations.some(function (mutation) {
            return mutation.type === 'characterData' && mutation.target === _this2.textNode;
          })) {
            var range = this.restore();
            if (range) context.range = range;
          }
        }
      }, {
        key: 'value',
        value: function value() {
          return '';
        }
      }]);

      return Cursor;
    }(_parchment2.default.Embed);

    Cursor.blotName = 'cursor';
    Cursor.className = 'ql-cursor';
    Cursor.tagName = 'span';
    Cursor.CONTENTS = '\uFEFF'; // Zero width no break space


    exports.default = Cursor;

    /***/ }),
    /* 25 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _block = __webpack_require__(4);

    var _block2 = _interopRequireDefault(_block);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Container = function (_Parchment$Container) {
      _inherits(Container, _Parchment$Container);

      function Container() {
        _classCallCheck(this, Container);

        return _possibleConstructorReturn(this, (Container.__proto__ || Object.getPrototypeOf(Container)).apply(this, arguments));
      }

      return Container;
    }(_parchment2.default.Container);

    Container.allowedChildren = [_block2.default, _block.BlockEmbed, Container];

    exports.default = Container;

    /***/ }),
    /* 26 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ColorStyle = exports.ColorClass = exports.ColorAttributor = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var ColorAttributor = function (_Parchment$Attributor) {
      _inherits(ColorAttributor, _Parchment$Attributor);

      function ColorAttributor() {
        _classCallCheck(this, ColorAttributor);

        return _possibleConstructorReturn(this, (ColorAttributor.__proto__ || Object.getPrototypeOf(ColorAttributor)).apply(this, arguments));
      }

      _createClass(ColorAttributor, [{
        key: 'value',
        value: function value(domNode) {
          var value = _get(ColorAttributor.prototype.__proto__ || Object.getPrototypeOf(ColorAttributor.prototype), 'value', this).call(this, domNode);
          if (!value.startsWith('rgb(')) return value;
          value = value.replace(/^[^\d]+/, '').replace(/[^\d]+$/, '');
          return '#' + value.split(',').map(function (component) {
            return ('00' + parseInt(component).toString(16)).slice(-2);
          }).join('');
        }
      }]);

      return ColorAttributor;
    }(_parchment2.default.Attributor.Style);

    var ColorClass = new _parchment2.default.Attributor.Class('color', 'ql-color', {
      scope: _parchment2.default.Scope.INLINE
    });
    var ColorStyle = new ColorAttributor('color', 'color', {
      scope: _parchment2.default.Scope.INLINE
    });

    exports.ColorAttributor = ColorAttributor;
    exports.ColorClass = ColorClass;
    exports.ColorStyle = ColorStyle;

    /***/ }),
    /* 27 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.sanitize = exports.default = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _inline = __webpack_require__(6);

    var _inline2 = _interopRequireDefault(_inline);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Link = function (_Inline) {
      _inherits(Link, _Inline);

      function Link() {
        _classCallCheck(this, Link);

        return _possibleConstructorReturn(this, (Link.__proto__ || Object.getPrototypeOf(Link)).apply(this, arguments));
      }

      _createClass(Link, [{
        key: 'format',
        value: function format(name, value) {
          if (name !== this.statics.blotName || !value) return _get(Link.prototype.__proto__ || Object.getPrototypeOf(Link.prototype), 'format', this).call(this, name, value);
          value = this.constructor.sanitize(value);
          this.domNode.setAttribute('href', value);
        }
      }], [{
        key: 'create',
        value: function create(value) {
          var node = _get(Link.__proto__ || Object.getPrototypeOf(Link), 'create', this).call(this, value);
          value = this.sanitize(value);
          node.setAttribute('href', value);
          node.setAttribute('rel', 'noopener noreferrer');
          node.setAttribute('target', '_blank');
          return node;
        }
      }, {
        key: 'formats',
        value: function formats(domNode) {
          return domNode.getAttribute('href');
        }
      }, {
        key: 'sanitize',
        value: function sanitize(url) {
          return _sanitize(url, this.PROTOCOL_WHITELIST) ? url : this.SANITIZED_URL;
        }
      }]);

      return Link;
    }(_inline2.default);

    Link.blotName = 'link';
    Link.tagName = 'A';
    Link.SANITIZED_URL = 'about:blank';
    Link.PROTOCOL_WHITELIST = ['http', 'https', 'mailto', 'tel'];

    function _sanitize(url, protocols) {
      var anchor = document.createElement('a');
      anchor.href = url;
      var protocol = anchor.href.slice(0, anchor.href.indexOf(':'));
      return protocols.indexOf(protocol) > -1;
    }

    exports.default = Link;
    exports.sanitize = _sanitize;

    /***/ }),
    /* 28 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _keyboard = __webpack_require__(23);

    var _keyboard2 = _interopRequireDefault(_keyboard);

    var _dropdown = __webpack_require__(107);

    var _dropdown2 = _interopRequireDefault(_dropdown);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var optionsCounter = 0;

    function toggleAriaAttribute(element, attribute) {
      element.setAttribute(attribute, !(element.getAttribute(attribute) === 'true'));
    }

    var Picker = function () {
      function Picker(select) {
        var _this = this;

        _classCallCheck(this, Picker);

        this.select = select;
        this.container = document.createElement('span');
        this.buildPicker();
        this.select.style.display = 'none';
        this.select.parentNode.insertBefore(this.container, this.select);

        this.label.addEventListener('mousedown', function () {
          _this.togglePicker();
        });
        this.label.addEventListener('keydown', function (event) {
          switch (event.keyCode) {
            // Allows the "Enter" key to open the picker
            case _keyboard2.default.keys.ENTER:
              _this.togglePicker();
              break;

            // Allows the "Escape" key to close the picker
            case _keyboard2.default.keys.ESCAPE:
              _this.escape();
              event.preventDefault();
              break;
          }
        });
        this.select.addEventListener('change', this.update.bind(this));
      }

      _createClass(Picker, [{
        key: 'togglePicker',
        value: function togglePicker() {
          this.container.classList.toggle('ql-expanded');
          // Toggle aria-expanded and aria-hidden to make the picker accessible
          toggleAriaAttribute(this.label, 'aria-expanded');
          toggleAriaAttribute(this.options, 'aria-hidden');
        }
      }, {
        key: 'buildItem',
        value: function buildItem(option) {
          var _this2 = this;

          var item = document.createElement('span');
          item.tabIndex = '0';
          item.setAttribute('role', 'button');

          item.classList.add('ql-picker-item');
          if (option.hasAttribute('value')) {
            item.setAttribute('data-value', option.getAttribute('value'));
          }
          if (option.textContent) {
            item.setAttribute('data-label', option.textContent);
          }
          item.addEventListener('click', function () {
            _this2.selectItem(item, true);
          });
          item.addEventListener('keydown', function (event) {
            switch (event.keyCode) {
              // Allows the "Enter" key to select an item
              case _keyboard2.default.keys.ENTER:
                _this2.selectItem(item, true);
                event.preventDefault();
                break;

              // Allows the "Escape" key to close the picker
              case _keyboard2.default.keys.ESCAPE:
                _this2.escape();
                event.preventDefault();
                break;
            }
          });

          return item;
        }
      }, {
        key: 'buildLabel',
        value: function buildLabel() {
          var label = document.createElement('span');
          label.classList.add('ql-picker-label');
          label.innerHTML = _dropdown2.default;
          label.tabIndex = '0';
          label.setAttribute('role', 'button');
          label.setAttribute('aria-expanded', 'false');
          this.container.appendChild(label);
          return label;
        }
      }, {
        key: 'buildOptions',
        value: function buildOptions() {
          var _this3 = this;

          var options = document.createElement('span');
          options.classList.add('ql-picker-options');

          // Don't want screen readers to read this until options are visible
          options.setAttribute('aria-hidden', 'true');
          options.tabIndex = '-1';

          // Need a unique id for aria-controls
          options.id = 'ql-picker-options-' + optionsCounter;
          optionsCounter += 1;
          this.label.setAttribute('aria-controls', options.id);

          this.options = options;

          [].slice.call(this.select.options).forEach(function (option) {
            var item = _this3.buildItem(option);
            options.appendChild(item);
            if (option.selected === true) {
              _this3.selectItem(item);
            }
          });
          this.container.appendChild(options);
        }
      }, {
        key: 'buildPicker',
        value: function buildPicker() {
          var _this4 = this;

          [].slice.call(this.select.attributes).forEach(function (item) {
            _this4.container.setAttribute(item.name, item.value);
          });
          this.container.classList.add('ql-picker');
          this.label = this.buildLabel();
          this.buildOptions();
        }
      }, {
        key: 'escape',
        value: function escape() {
          var _this5 = this;

          // Close menu and return focus to trigger label
          this.close();
          // Need setTimeout for accessibility to ensure that the browser executes
          // focus on the next process thread and after any DOM content changes
          setTimeout(function () {
            return _this5.label.focus();
          }, 1);
        }
      }, {
        key: 'close',
        value: function close() {
          this.container.classList.remove('ql-expanded');
          this.label.setAttribute('aria-expanded', 'false');
          this.options.setAttribute('aria-hidden', 'true');
        }
      }, {
        key: 'selectItem',
        value: function selectItem(item) {
          var trigger = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

          var selected = this.container.querySelector('.ql-selected');
          if (item === selected) return;
          if (selected != null) {
            selected.classList.remove('ql-selected');
          }
          if (item == null) return;
          item.classList.add('ql-selected');
          this.select.selectedIndex = [].indexOf.call(item.parentNode.children, item);
          if (item.hasAttribute('data-value')) {
            this.label.setAttribute('data-value', item.getAttribute('data-value'));
          } else {
            this.label.removeAttribute('data-value');
          }
          if (item.hasAttribute('data-label')) {
            this.label.setAttribute('data-label', item.getAttribute('data-label'));
          } else {
            this.label.removeAttribute('data-label');
          }
          if (trigger) {
            if (typeof Event === 'function') {
              this.select.dispatchEvent(new Event('change'));
            } else if ((typeof Event === 'undefined' ? 'undefined' : _typeof(Event)) === 'object') {
              // IE11
              var event = document.createEvent('Event');
              event.initEvent('change', true, true);
              this.select.dispatchEvent(event);
            }
            this.close();
          }
        }
      }, {
        key: 'update',
        value: function update() {
          var option = void 0;
          if (this.select.selectedIndex > -1) {
            var item = this.container.querySelector('.ql-picker-options').children[this.select.selectedIndex];
            option = this.select.options[this.select.selectedIndex];
            this.selectItem(item);
          } else {
            this.selectItem(null);
          }
          var isActive = option != null && option !== this.select.querySelector('option[selected]');
          this.label.classList.toggle('ql-active', isActive);
        }
      }]);

      return Picker;
    }();

    exports.default = Picker;

    /***/ }),
    /* 29 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _quill = __webpack_require__(5);

    var _quill2 = _interopRequireDefault(_quill);

    var _block = __webpack_require__(4);

    var _block2 = _interopRequireDefault(_block);

    var _break = __webpack_require__(16);

    var _break2 = _interopRequireDefault(_break);

    var _container = __webpack_require__(25);

    var _container2 = _interopRequireDefault(_container);

    var _cursor = __webpack_require__(24);

    var _cursor2 = _interopRequireDefault(_cursor);

    var _embed = __webpack_require__(35);

    var _embed2 = _interopRequireDefault(_embed);

    var _inline = __webpack_require__(6);

    var _inline2 = _interopRequireDefault(_inline);

    var _scroll = __webpack_require__(22);

    var _scroll2 = _interopRequireDefault(_scroll);

    var _text = __webpack_require__(7);

    var _text2 = _interopRequireDefault(_text);

    var _clipboard = __webpack_require__(55);

    var _clipboard2 = _interopRequireDefault(_clipboard);

    var _history = __webpack_require__(42);

    var _history2 = _interopRequireDefault(_history);

    var _keyboard = __webpack_require__(23);

    var _keyboard2 = _interopRequireDefault(_keyboard);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    _quill2.default.register({
      'blots/block': _block2.default,
      'blots/block/embed': _block.BlockEmbed,
      'blots/break': _break2.default,
      'blots/container': _container2.default,
      'blots/cursor': _cursor2.default,
      'blots/embed': _embed2.default,
      'blots/inline': _inline2.default,
      'blots/scroll': _scroll2.default,
      'blots/text': _text2.default,

      'modules/clipboard': _clipboard2.default,
      'modules/history': _history2.default,
      'modules/keyboard': _keyboard2.default
    });

    _parchment2.default.register(_block2.default, _break2.default, _cursor2.default, _inline2.default, _scroll2.default, _text2.default);

    exports.default = _quill2.default;

    /***/ }),
    /* 30 */
    /***/ (function(module, exports, __webpack_require__) {

    Object.defineProperty(exports, "__esModule", { value: true });
    var Registry = __webpack_require__(1);
    var ShadowBlot = /** @class */ (function () {
        function ShadowBlot(domNode) {
            this.domNode = domNode;
            // @ts-ignore
            this.domNode[Registry.DATA_KEY] = { blot: this };
        }
        Object.defineProperty(ShadowBlot.prototype, "statics", {
            // Hack for accessing inherited static methods
            get: function () {
                return this.constructor;
            },
            enumerable: true,
            configurable: true
        });
        ShadowBlot.create = function (value) {
            if (this.tagName == null) {
                throw new Registry.ParchmentError('Blot definition missing tagName');
            }
            var node;
            if (Array.isArray(this.tagName)) {
                if (typeof value === 'string') {
                    value = value.toUpperCase();
                    if (parseInt(value).toString() === value) {
                        value = parseInt(value);
                    }
                }
                if (typeof value === 'number') {
                    node = document.createElement(this.tagName[value - 1]);
                }
                else if (this.tagName.indexOf(value) > -1) {
                    node = document.createElement(value);
                }
                else {
                    node = document.createElement(this.tagName[0]);
                }
            }
            else {
                node = document.createElement(this.tagName);
            }
            if (this.className) {
                node.classList.add(this.className);
            }
            return node;
        };
        ShadowBlot.prototype.attach = function () {
            if (this.parent != null) {
                this.scroll = this.parent.scroll;
            }
        };
        ShadowBlot.prototype.clone = function () {
            var domNode = this.domNode.cloneNode(false);
            return Registry.create(domNode);
        };
        ShadowBlot.prototype.detach = function () {
            if (this.parent != null)
                this.parent.removeChild(this);
            // @ts-ignore
            delete this.domNode[Registry.DATA_KEY];
        };
        ShadowBlot.prototype.deleteAt = function (index, length) {
            var blot = this.isolate(index, length);
            blot.remove();
        };
        ShadowBlot.prototype.formatAt = function (index, length, name, value) {
            var blot = this.isolate(index, length);
            if (Registry.query(name, Registry.Scope.BLOT) != null && value) {
                blot.wrap(name, value);
            }
            else if (Registry.query(name, Registry.Scope.ATTRIBUTE) != null) {
                var parent = Registry.create(this.statics.scope);
                blot.wrap(parent);
                parent.format(name, value);
            }
        };
        ShadowBlot.prototype.insertAt = function (index, value, def) {
            var blot = def == null ? Registry.create('text', value) : Registry.create(value, def);
            var ref = this.split(index);
            this.parent.insertBefore(blot, ref);
        };
        ShadowBlot.prototype.insertInto = function (parentBlot, refBlot) {
            if (refBlot === void 0) { refBlot = null; }
            if (this.parent != null) {
                this.parent.children.remove(this);
            }
            var refDomNode = null;
            parentBlot.children.insertBefore(this, refBlot);
            if (refBlot != null) {
                refDomNode = refBlot.domNode;
            }
            if (this.domNode.parentNode != parentBlot.domNode ||
                this.domNode.nextSibling != refDomNode) {
                parentBlot.domNode.insertBefore(this.domNode, refDomNode);
            }
            this.parent = parentBlot;
            this.attach();
        };
        ShadowBlot.prototype.isolate = function (index, length) {
            var target = this.split(index);
            target.split(length);
            return target;
        };
        ShadowBlot.prototype.length = function () {
            return 1;
        };
        ShadowBlot.prototype.offset = function (root) {
            if (root === void 0) { root = this.parent; }
            if (this.parent == null || this == root)
                return 0;
            return this.parent.children.offset(this) + this.parent.offset(root);
        };
        ShadowBlot.prototype.optimize = function (context) {
            // TODO clean up once we use WeakMap
            // @ts-ignore
            if (this.domNode[Registry.DATA_KEY] != null) {
                // @ts-ignore
                delete this.domNode[Registry.DATA_KEY].mutations;
            }
        };
        ShadowBlot.prototype.remove = function () {
            if (this.domNode.parentNode != null) {
                this.domNode.parentNode.removeChild(this.domNode);
            }
            this.detach();
        };
        ShadowBlot.prototype.replace = function (target) {
            if (target.parent == null)
                return;
            target.parent.insertBefore(this, target.next);
            target.remove();
        };
        ShadowBlot.prototype.replaceWith = function (name, value) {
            var replacement = typeof name === 'string' ? Registry.create(name, value) : name;
            replacement.replace(this);
            return replacement;
        };
        ShadowBlot.prototype.split = function (index, force) {
            return index === 0 ? this : this.next;
        };
        ShadowBlot.prototype.update = function (mutations, context) {
            // Nothing to do by default
        };
        ShadowBlot.prototype.wrap = function (name, value) {
            var wrapper = typeof name === 'string' ? Registry.create(name, value) : name;
            if (this.parent != null) {
                this.parent.insertBefore(wrapper, this.next);
            }
            wrapper.appendChild(this);
            return wrapper;
        };
        ShadowBlot.blotName = 'abstract';
        return ShadowBlot;
    }());
    exports.default = ShadowBlot;


    /***/ }),
    /* 31 */
    /***/ (function(module, exports, __webpack_require__) {

    Object.defineProperty(exports, "__esModule", { value: true });
    var attributor_1 = __webpack_require__(12);
    var class_1 = __webpack_require__(32);
    var style_1 = __webpack_require__(33);
    var Registry = __webpack_require__(1);
    var AttributorStore = /** @class */ (function () {
        function AttributorStore(domNode) {
            this.attributes = {};
            this.domNode = domNode;
            this.build();
        }
        AttributorStore.prototype.attribute = function (attribute, value) {
            // verb
            if (value) {
                if (attribute.add(this.domNode, value)) {
                    if (attribute.value(this.domNode) != null) {
                        this.attributes[attribute.attrName] = attribute;
                    }
                    else {
                        delete this.attributes[attribute.attrName];
                    }
                }
            }
            else {
                attribute.remove(this.domNode);
                delete this.attributes[attribute.attrName];
            }
        };
        AttributorStore.prototype.build = function () {
            var _this = this;
            this.attributes = {};
            var attributes = attributor_1.default.keys(this.domNode);
            var classes = class_1.default.keys(this.domNode);
            var styles = style_1.default.keys(this.domNode);
            attributes
                .concat(classes)
                .concat(styles)
                .forEach(function (name) {
                var attr = Registry.query(name, Registry.Scope.ATTRIBUTE);
                if (attr instanceof attributor_1.default) {
                    _this.attributes[attr.attrName] = attr;
                }
            });
        };
        AttributorStore.prototype.copy = function (target) {
            var _this = this;
            Object.keys(this.attributes).forEach(function (key) {
                var value = _this.attributes[key].value(_this.domNode);
                target.format(key, value);
            });
        };
        AttributorStore.prototype.move = function (target) {
            var _this = this;
            this.copy(target);
            Object.keys(this.attributes).forEach(function (key) {
                _this.attributes[key].remove(_this.domNode);
            });
            this.attributes = {};
        };
        AttributorStore.prototype.values = function () {
            var _this = this;
            return Object.keys(this.attributes).reduce(function (attributes, name) {
                attributes[name] = _this.attributes[name].value(_this.domNode);
                return attributes;
            }, {});
        };
        return AttributorStore;
    }());
    exports.default = AttributorStore;


    /***/ }),
    /* 32 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var attributor_1 = __webpack_require__(12);
    function match(node, prefix) {
        var className = node.getAttribute('class') || '';
        return className.split(/\s+/).filter(function (name) {
            return name.indexOf(prefix + "-") === 0;
        });
    }
    var ClassAttributor = /** @class */ (function (_super) {
        __extends(ClassAttributor, _super);
        function ClassAttributor() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ClassAttributor.keys = function (node) {
            return (node.getAttribute('class') || '').split(/\s+/).map(function (name) {
                return name
                    .split('-')
                    .slice(0, -1)
                    .join('-');
            });
        };
        ClassAttributor.prototype.add = function (node, value) {
            if (!this.canAdd(node, value))
                return false;
            this.remove(node);
            node.classList.add(this.keyName + "-" + value);
            return true;
        };
        ClassAttributor.prototype.remove = function (node) {
            var matches = match(node, this.keyName);
            matches.forEach(function (name) {
                node.classList.remove(name);
            });
            if (node.classList.length === 0) {
                node.removeAttribute('class');
            }
        };
        ClassAttributor.prototype.value = function (node) {
            var result = match(node, this.keyName)[0] || '';
            var value = result.slice(this.keyName.length + 1); // +1 for hyphen
            return this.canAdd(node, value) ? value : '';
        };
        return ClassAttributor;
    }(attributor_1.default));
    exports.default = ClassAttributor;


    /***/ }),
    /* 33 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var attributor_1 = __webpack_require__(12);
    function camelize(name) {
        var parts = name.split('-');
        var rest = parts
            .slice(1)
            .map(function (part) {
            return part[0].toUpperCase() + part.slice(1);
        })
            .join('');
        return parts[0] + rest;
    }
    var StyleAttributor = /** @class */ (function (_super) {
        __extends(StyleAttributor, _super);
        function StyleAttributor() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        StyleAttributor.keys = function (node) {
            return (node.getAttribute('style') || '').split(';').map(function (value) {
                var arr = value.split(':');
                return arr[0].trim();
            });
        };
        StyleAttributor.prototype.add = function (node, value) {
            if (!this.canAdd(node, value))
                return false;
            // @ts-ignore
            node.style[camelize(this.keyName)] = value;
            return true;
        };
        StyleAttributor.prototype.remove = function (node) {
            // @ts-ignore
            node.style[camelize(this.keyName)] = '';
            if (!node.getAttribute('style')) {
                node.removeAttribute('style');
            }
        };
        StyleAttributor.prototype.value = function (node) {
            // @ts-ignore
            var value = node.style[camelize(this.keyName)];
            return this.canAdd(node, value) ? value : '';
        };
        return StyleAttributor;
    }(attributor_1.default));
    exports.default = StyleAttributor;


    /***/ }),
    /* 34 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var Theme = function () {
      function Theme(quill, options) {
        _classCallCheck(this, Theme);

        this.quill = quill;
        this.options = options;
        this.modules = {};
      }

      _createClass(Theme, [{
        key: 'init',
        value: function init() {
          var _this = this;

          Object.keys(this.options.modules).forEach(function (name) {
            if (_this.modules[name] == null) {
              _this.addModule(name);
            }
          });
        }
      }, {
        key: 'addModule',
        value: function addModule(name) {
          var moduleClass = this.quill.constructor.import('modules/' + name);
          this.modules[name] = new moduleClass(this.quill, this.options.modules[name] || {});
          return this.modules[name];
        }
      }]);

      return Theme;
    }();

    Theme.DEFAULTS = {
      modules: {}
    };
    Theme.themes = {
      'default': Theme
    };

    exports.default = Theme;

    /***/ }),
    /* 35 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _text = __webpack_require__(7);

    var _text2 = _interopRequireDefault(_text);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var GUARD_TEXT = '\uFEFF';

    var Embed = function (_Parchment$Embed) {
      _inherits(Embed, _Parchment$Embed);

      function Embed(node) {
        _classCallCheck(this, Embed);

        var _this = _possibleConstructorReturn(this, (Embed.__proto__ || Object.getPrototypeOf(Embed)).call(this, node));

        _this.contentNode = document.createElement('span');
        _this.contentNode.setAttribute('contenteditable', false);
        [].slice.call(_this.domNode.childNodes).forEach(function (childNode) {
          _this.contentNode.appendChild(childNode);
        });
        _this.leftGuard = document.createTextNode(GUARD_TEXT);
        _this.rightGuard = document.createTextNode(GUARD_TEXT);
        _this.domNode.appendChild(_this.leftGuard);
        _this.domNode.appendChild(_this.contentNode);
        _this.domNode.appendChild(_this.rightGuard);
        return _this;
      }

      _createClass(Embed, [{
        key: 'index',
        value: function index(node, offset) {
          if (node === this.leftGuard) return 0;
          if (node === this.rightGuard) return 1;
          return _get(Embed.prototype.__proto__ || Object.getPrototypeOf(Embed.prototype), 'index', this).call(this, node, offset);
        }
      }, {
        key: 'restore',
        value: function restore(node) {
          var range = void 0,
              textNode = void 0;
          var text = node.data.split(GUARD_TEXT).join('');
          if (node === this.leftGuard) {
            if (this.prev instanceof _text2.default) {
              var prevLength = this.prev.length();
              this.prev.insertAt(prevLength, text);
              range = {
                startNode: this.prev.domNode,
                startOffset: prevLength + text.length
              };
            } else {
              textNode = document.createTextNode(text);
              this.parent.insertBefore(_parchment2.default.create(textNode), this);
              range = {
                startNode: textNode,
                startOffset: text.length
              };
            }
          } else if (node === this.rightGuard) {
            if (this.next instanceof _text2.default) {
              this.next.insertAt(0, text);
              range = {
                startNode: this.next.domNode,
                startOffset: text.length
              };
            } else {
              textNode = document.createTextNode(text);
              this.parent.insertBefore(_parchment2.default.create(textNode), this.next);
              range = {
                startNode: textNode,
                startOffset: text.length
              };
            }
          }
          node.data = GUARD_TEXT;
          return range;
        }
      }, {
        key: 'update',
        value: function update(mutations, context) {
          var _this2 = this;

          mutations.forEach(function (mutation) {
            if (mutation.type === 'characterData' && (mutation.target === _this2.leftGuard || mutation.target === _this2.rightGuard)) {
              var range = _this2.restore(mutation.target);
              if (range) context.range = range;
            }
          });
        }
      }]);

      return Embed;
    }(_parchment2.default.Embed);

    exports.default = Embed;

    /***/ }),
    /* 36 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.AlignStyle = exports.AlignClass = exports.AlignAttribute = undefined;

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var config = {
      scope: _parchment2.default.Scope.BLOCK,
      whitelist: ['right', 'center', 'justify']
    };

    var AlignAttribute = new _parchment2.default.Attributor.Attribute('align', 'align', config);
    var AlignClass = new _parchment2.default.Attributor.Class('align', 'ql-align', config);
    var AlignStyle = new _parchment2.default.Attributor.Style('align', 'text-align', config);

    exports.AlignAttribute = AlignAttribute;
    exports.AlignClass = AlignClass;
    exports.AlignStyle = AlignStyle;

    /***/ }),
    /* 37 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.BackgroundStyle = exports.BackgroundClass = undefined;

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _color = __webpack_require__(26);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var BackgroundClass = new _parchment2.default.Attributor.Class('background', 'ql-bg', {
      scope: _parchment2.default.Scope.INLINE
    });
    var BackgroundStyle = new _color.ColorAttributor('background', 'background-color', {
      scope: _parchment2.default.Scope.INLINE
    });

    exports.BackgroundClass = BackgroundClass;
    exports.BackgroundStyle = BackgroundStyle;

    /***/ }),
    /* 38 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.DirectionStyle = exports.DirectionClass = exports.DirectionAttribute = undefined;

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var config = {
      scope: _parchment2.default.Scope.BLOCK,
      whitelist: ['rtl']
    };

    var DirectionAttribute = new _parchment2.default.Attributor.Attribute('direction', 'dir', config);
    var DirectionClass = new _parchment2.default.Attributor.Class('direction', 'ql-direction', config);
    var DirectionStyle = new _parchment2.default.Attributor.Style('direction', 'direction', config);

    exports.DirectionAttribute = DirectionAttribute;
    exports.DirectionClass = DirectionClass;
    exports.DirectionStyle = DirectionStyle;

    /***/ }),
    /* 39 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.FontClass = exports.FontStyle = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var config = {
      scope: _parchment2.default.Scope.INLINE,
      whitelist: ['serif', 'monospace']
    };

    var FontClass = new _parchment2.default.Attributor.Class('font', 'ql-font', config);

    var FontStyleAttributor = function (_Parchment$Attributor) {
      _inherits(FontStyleAttributor, _Parchment$Attributor);

      function FontStyleAttributor() {
        _classCallCheck(this, FontStyleAttributor);

        return _possibleConstructorReturn(this, (FontStyleAttributor.__proto__ || Object.getPrototypeOf(FontStyleAttributor)).apply(this, arguments));
      }

      _createClass(FontStyleAttributor, [{
        key: 'value',
        value: function value(node) {
          return _get(FontStyleAttributor.prototype.__proto__ || Object.getPrototypeOf(FontStyleAttributor.prototype), 'value', this).call(this, node).replace(/["']/g, '');
        }
      }]);

      return FontStyleAttributor;
    }(_parchment2.default.Attributor.Style);

    var FontStyle = new FontStyleAttributor('font', 'font-family', config);

    exports.FontStyle = FontStyle;
    exports.FontClass = FontClass;

    /***/ }),
    /* 40 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.SizeStyle = exports.SizeClass = undefined;

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var SizeClass = new _parchment2.default.Attributor.Class('size', 'ql-size', {
      scope: _parchment2.default.Scope.INLINE,
      whitelist: ['small', 'large', 'huge']
    });
    var SizeStyle = new _parchment2.default.Attributor.Style('size', 'font-size', {
      scope: _parchment2.default.Scope.INLINE,
      whitelist: ['10px', '18px', '32px']
    });

    exports.SizeClass = SizeClass;
    exports.SizeStyle = SizeStyle;

    /***/ }),
    /* 41 */
    /***/ (function(module, exports, __webpack_require__) {


    module.exports = {
      'align': {
        '': __webpack_require__(76),
        'center': __webpack_require__(77),
        'right': __webpack_require__(78),
        'justify': __webpack_require__(79)
      },
      'background': __webpack_require__(80),
      'blockquote': __webpack_require__(81),
      'bold': __webpack_require__(82),
      'clean': __webpack_require__(83),
      'code': __webpack_require__(58),
      'code-block': __webpack_require__(58),
      'color': __webpack_require__(84),
      'direction': {
        '': __webpack_require__(85),
        'rtl': __webpack_require__(86)
      },
      'float': {
        'center': __webpack_require__(87),
        'full': __webpack_require__(88),
        'left': __webpack_require__(89),
        'right': __webpack_require__(90)
      },
      'formula': __webpack_require__(91),
      'header': {
        '1': __webpack_require__(92),
        '2': __webpack_require__(93)
      },
      'italic': __webpack_require__(94),
      'image': __webpack_require__(95),
      'indent': {
        '+1': __webpack_require__(96),
        '-1': __webpack_require__(97)
      },
      'link': __webpack_require__(98),
      'list': {
        'ordered': __webpack_require__(99),
        'bullet': __webpack_require__(100),
        'check': __webpack_require__(101)
      },
      'script': {
        'sub': __webpack_require__(102),
        'super': __webpack_require__(103)
      },
      'strike': __webpack_require__(104),
      'underline': __webpack_require__(105),
      'video': __webpack_require__(106)
    };

    /***/ }),
    /* 42 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.getLastChangeIndex = exports.default = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _quill = __webpack_require__(5);

    var _quill2 = _interopRequireDefault(_quill);

    var _module = __webpack_require__(9);

    var _module2 = _interopRequireDefault(_module);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var History = function (_Module) {
      _inherits(History, _Module);

      function History(quill, options) {
        _classCallCheck(this, History);

        var _this = _possibleConstructorReturn(this, (History.__proto__ || Object.getPrototypeOf(History)).call(this, quill, options));

        _this.lastRecorded = 0;
        _this.ignoreChange = false;
        _this.clear();
        _this.quill.on(_quill2.default.events.EDITOR_CHANGE, function (eventName, delta, oldDelta, source) {
          if (eventName !== _quill2.default.events.TEXT_CHANGE || _this.ignoreChange) return;
          if (!_this.options.userOnly || source === _quill2.default.sources.USER) {
            _this.record(delta, oldDelta);
          } else {
            _this.transform(delta);
          }
        });
        _this.quill.keyboard.addBinding({ key: 'Z', shortKey: true }, _this.undo.bind(_this));
        _this.quill.keyboard.addBinding({ key: 'Z', shortKey: true, shiftKey: true }, _this.redo.bind(_this));
        if (/Win/i.test(navigator.platform)) {
          _this.quill.keyboard.addBinding({ key: 'Y', shortKey: true }, _this.redo.bind(_this));
        }
        return _this;
      }

      _createClass(History, [{
        key: 'change',
        value: function change(source, dest) {
          if (this.stack[source].length === 0) return;
          var delta = this.stack[source].pop();
          this.stack[dest].push(delta);
          this.lastRecorded = 0;
          this.ignoreChange = true;
          this.quill.updateContents(delta[source], _quill2.default.sources.USER);
          this.ignoreChange = false;
          var index = getLastChangeIndex(delta[source]);
          this.quill.setSelection(index);
        }
      }, {
        key: 'clear',
        value: function clear() {
          this.stack = { undo: [], redo: [] };
        }
      }, {
        key: 'cutoff',
        value: function cutoff() {
          this.lastRecorded = 0;
        }
      }, {
        key: 'record',
        value: function record(changeDelta, oldDelta) {
          if (changeDelta.ops.length === 0) return;
          this.stack.redo = [];
          var undoDelta = this.quill.getContents().diff(oldDelta);
          var timestamp = Date.now();
          if (this.lastRecorded + this.options.delay > timestamp && this.stack.undo.length > 0) {
            var delta = this.stack.undo.pop();
            undoDelta = undoDelta.compose(delta.undo);
            changeDelta = delta.redo.compose(changeDelta);
          } else {
            this.lastRecorded = timestamp;
          }
          this.stack.undo.push({
            redo: changeDelta,
            undo: undoDelta
          });
          if (this.stack.undo.length > this.options.maxStack) {
            this.stack.undo.shift();
          }
        }
      }, {
        key: 'redo',
        value: function redo() {
          this.change('redo', 'undo');
        }
      }, {
        key: 'transform',
        value: function transform(delta) {
          this.stack.undo.forEach(function (change) {
            change.undo = delta.transform(change.undo, true);
            change.redo = delta.transform(change.redo, true);
          });
          this.stack.redo.forEach(function (change) {
            change.undo = delta.transform(change.undo, true);
            change.redo = delta.transform(change.redo, true);
          });
        }
      }, {
        key: 'undo',
        value: function undo() {
          this.change('undo', 'redo');
        }
      }]);

      return History;
    }(_module2.default);

    History.DEFAULTS = {
      delay: 1000,
      maxStack: 100,
      userOnly: false
    };

    function endsWithNewlineChange(delta) {
      var lastOp = delta.ops[delta.ops.length - 1];
      if (lastOp == null) return false;
      if (lastOp.insert != null) {
        return typeof lastOp.insert === 'string' && lastOp.insert.endsWith('\n');
      }
      if (lastOp.attributes != null) {
        return Object.keys(lastOp.attributes).some(function (attr) {
          return _parchment2.default.query(attr, _parchment2.default.Scope.BLOCK) != null;
        });
      }
      return false;
    }

    function getLastChangeIndex(delta) {
      var deleteLength = delta.reduce(function (length, op) {
        length += op.delete || 0;
        return length;
      }, 0);
      var changeIndex = delta.length() - deleteLength;
      if (endsWithNewlineChange(delta)) {
        changeIndex -= 1;
      }
      return changeIndex;
    }

    exports.default = History;
    exports.getLastChangeIndex = getLastChangeIndex;

    /***/ }),
    /* 43 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.BaseTooltip = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _extend = __webpack_require__(3);

    var _extend2 = _interopRequireDefault(_extend);

    var _quillDelta = __webpack_require__(2);

    var _quillDelta2 = _interopRequireDefault(_quillDelta);

    var _emitter = __webpack_require__(8);

    var _emitter2 = _interopRequireDefault(_emitter);

    var _keyboard = __webpack_require__(23);

    var _keyboard2 = _interopRequireDefault(_keyboard);

    var _theme = __webpack_require__(34);

    var _theme2 = _interopRequireDefault(_theme);

    var _colorPicker = __webpack_require__(59);

    var _colorPicker2 = _interopRequireDefault(_colorPicker);

    var _iconPicker = __webpack_require__(60);

    var _iconPicker2 = _interopRequireDefault(_iconPicker);

    var _picker = __webpack_require__(28);

    var _picker2 = _interopRequireDefault(_picker);

    var _tooltip = __webpack_require__(61);

    var _tooltip2 = _interopRequireDefault(_tooltip);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var ALIGNS = [false, 'center', 'right', 'justify'];

    var COLORS = ["#000000", "#e60000", "#ff9900", "#ffff00", "#008a00", "#0066cc", "#9933ff", "#ffffff", "#facccc", "#ffebcc", "#ffffcc", "#cce8cc", "#cce0f5", "#ebd6ff", "#bbbbbb", "#f06666", "#ffc266", "#ffff66", "#66b966", "#66a3e0", "#c285ff", "#888888", "#a10000", "#b26b00", "#b2b200", "#006100", "#0047b2", "#6b24b2", "#444444", "#5c0000", "#663d00", "#666600", "#003700", "#002966", "#3d1466"];

    var FONTS = [false, 'serif', 'monospace'];

    var HEADERS = ['1', '2', '3', false];

    var SIZES = ['small', false, 'large', 'huge'];

    var BaseTheme = function (_Theme) {
      _inherits(BaseTheme, _Theme);

      function BaseTheme(quill, options) {
        _classCallCheck(this, BaseTheme);

        var _this = _possibleConstructorReturn(this, (BaseTheme.__proto__ || Object.getPrototypeOf(BaseTheme)).call(this, quill, options));

        var listener = function listener(e) {
          if (!document.body.contains(quill.root)) {
            return document.body.removeEventListener('click', listener);
          }
          if (_this.tooltip != null && !_this.tooltip.root.contains(e.target) && document.activeElement !== _this.tooltip.textbox && !_this.quill.hasFocus()) {
            _this.tooltip.hide();
          }
          if (_this.pickers != null) {
            _this.pickers.forEach(function (picker) {
              if (!picker.container.contains(e.target)) {
                picker.close();
              }
            });
          }
        };
        quill.emitter.listenDOM('click', document.body, listener);
        return _this;
      }

      _createClass(BaseTheme, [{
        key: 'addModule',
        value: function addModule(name) {
          var module = _get(BaseTheme.prototype.__proto__ || Object.getPrototypeOf(BaseTheme.prototype), 'addModule', this).call(this, name);
          if (name === 'toolbar') {
            this.extendToolbar(module);
          }
          return module;
        }
      }, {
        key: 'buildButtons',
        value: function buildButtons(buttons, icons) {
          buttons.forEach(function (button) {
            var className = button.getAttribute('class') || '';
            className.split(/\s+/).forEach(function (name) {
              if (!name.startsWith('ql-')) return;
              name = name.slice('ql-'.length);
              if (icons[name] == null) return;
              if (name === 'direction') {
                button.innerHTML = icons[name][''] + icons[name]['rtl'];
              } else if (typeof icons[name] === 'string') {
                button.innerHTML = icons[name];
              } else {
                var value = button.value || '';
                if (value != null && icons[name][value]) {
                  button.innerHTML = icons[name][value];
                }
              }
            });
          });
        }
      }, {
        key: 'buildPickers',
        value: function buildPickers(selects, icons) {
          var _this2 = this;

          this.pickers = selects.map(function (select) {
            if (select.classList.contains('ql-align')) {
              if (select.querySelector('option') == null) {
                fillSelect(select, ALIGNS);
              }
              return new _iconPicker2.default(select, icons.align);
            } else if (select.classList.contains('ql-background') || select.classList.contains('ql-color')) {
              var format = select.classList.contains('ql-background') ? 'background' : 'color';
              if (select.querySelector('option') == null) {
                fillSelect(select, COLORS, format === 'background' ? '#ffffff' : '#000000');
              }
              return new _colorPicker2.default(select, icons[format]);
            } else {
              if (select.querySelector('option') == null) {
                if (select.classList.contains('ql-font')) {
                  fillSelect(select, FONTS);
                } else if (select.classList.contains('ql-header')) {
                  fillSelect(select, HEADERS);
                } else if (select.classList.contains('ql-size')) {
                  fillSelect(select, SIZES);
                }
              }
              return new _picker2.default(select);
            }
          });
          var update = function update() {
            _this2.pickers.forEach(function (picker) {
              picker.update();
            });
          };
          this.quill.on(_emitter2.default.events.EDITOR_CHANGE, update);
        }
      }]);

      return BaseTheme;
    }(_theme2.default);

    BaseTheme.DEFAULTS = (0, _extend2.default)(true, {}, _theme2.default.DEFAULTS, {
      modules: {
        toolbar: {
          handlers: {
            formula: function formula() {
              this.quill.theme.tooltip.edit('formula');
            },
            image: function image() {
              var _this3 = this;

              var fileInput = this.container.querySelector('input.ql-image[type=file]');
              if (fileInput == null) {
                fileInput = document.createElement('input');
                fileInput.setAttribute('type', 'file');
                fileInput.setAttribute('accept', 'image/png, image/gif, image/jpeg, image/bmp, image/x-icon');
                fileInput.classList.add('ql-image');
                fileInput.addEventListener('change', function () {
                  if (fileInput.files != null && fileInput.files[0] != null) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                      var range = _this3.quill.getSelection(true);
                      _this3.quill.updateContents(new _quillDelta2.default().retain(range.index).delete(range.length).insert({ image: e.target.result }), _emitter2.default.sources.USER);
                      _this3.quill.setSelection(range.index + 1, _emitter2.default.sources.SILENT);
                      fileInput.value = "";
                    };
                    reader.readAsDataURL(fileInput.files[0]);
                  }
                });
                this.container.appendChild(fileInput);
              }
              fileInput.click();
            },
            video: function video() {
              this.quill.theme.tooltip.edit('video');
            }
          }
        }
      }
    });

    var BaseTooltip = function (_Tooltip) {
      _inherits(BaseTooltip, _Tooltip);

      function BaseTooltip(quill, boundsContainer) {
        _classCallCheck(this, BaseTooltip);

        var _this4 = _possibleConstructorReturn(this, (BaseTooltip.__proto__ || Object.getPrototypeOf(BaseTooltip)).call(this, quill, boundsContainer));

        _this4.textbox = _this4.root.querySelector('input[type="text"]');
        _this4.listen();
        return _this4;
      }

      _createClass(BaseTooltip, [{
        key: 'listen',
        value: function listen() {
          var _this5 = this;

          this.textbox.addEventListener('keydown', function (event) {
            if (_keyboard2.default.match(event, 'enter')) {
              _this5.save();
              event.preventDefault();
            } else if (_keyboard2.default.match(event, 'escape')) {
              _this5.cancel();
              event.preventDefault();
            }
          });
        }
      }, {
        key: 'cancel',
        value: function cancel() {
          this.hide();
        }
      }, {
        key: 'edit',
        value: function edit() {
          var mode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'link';
          var preview = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

          this.root.classList.remove('ql-hidden');
          this.root.classList.add('ql-editing');
          if (preview != null) {
            this.textbox.value = preview;
          } else if (mode !== this.root.getAttribute('data-mode')) {
            this.textbox.value = '';
          }
          this.position(this.quill.getBounds(this.quill.selection.savedRange));
          this.textbox.select();
          this.textbox.setAttribute('placeholder', this.textbox.getAttribute('data-' + mode) || '');
          this.root.setAttribute('data-mode', mode);
        }
      }, {
        key: 'restoreFocus',
        value: function restoreFocus() {
          var scrollTop = this.quill.scrollingContainer.scrollTop;
          this.quill.focus();
          this.quill.scrollingContainer.scrollTop = scrollTop;
        }
      }, {
        key: 'save',
        value: function save() {
          var value = this.textbox.value;
          switch (this.root.getAttribute('data-mode')) {
            case 'link':
              {
                var scrollTop = this.quill.root.scrollTop;
                if (this.linkRange) {
                  this.quill.formatText(this.linkRange, 'link', value, _emitter2.default.sources.USER);
                  delete this.linkRange;
                } else {
                  this.restoreFocus();
                  this.quill.format('link', value, _emitter2.default.sources.USER);
                }
                this.quill.root.scrollTop = scrollTop;
                break;
              }
            case 'video':
              {
                value = extractVideoUrl(value);
              } // eslint-disable-next-line no-fallthrough
            case 'formula':
              {
                if (!value) break;
                var range = this.quill.getSelection(true);
                if (range != null) {
                  var index = range.index + range.length;
                  this.quill.insertEmbed(index, this.root.getAttribute('data-mode'), value, _emitter2.default.sources.USER);
                  if (this.root.getAttribute('data-mode') === 'formula') {
                    this.quill.insertText(index + 1, ' ', _emitter2.default.sources.USER);
                  }
                  this.quill.setSelection(index + 2, _emitter2.default.sources.USER);
                }
                break;
              }
          }
          this.textbox.value = '';
          this.hide();
        }
      }]);

      return BaseTooltip;
    }(_tooltip2.default);

    function extractVideoUrl(url) {
      var match = url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/) || url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (match) {
        return (match[1] || 'https') + '://www.youtube.com/embed/' + match[2] + '?showinfo=0';
      }
      if (match = url.match(/^(?:(https?):\/\/)?(?:www\.)?vimeo\.com\/(\d+)/)) {
        // eslint-disable-line no-cond-assign
        return (match[1] || 'https') + '://player.vimeo.com/video/' + match[2] + '/';
      }
      return url;
    }

    function fillSelect(select, values) {
      var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      values.forEach(function (value) {
        var option = document.createElement('option');
        if (value === defaultValue) {
          option.setAttribute('selected', 'selected');
        } else {
          option.setAttribute('value', value);
        }
        select.appendChild(option);
      });
    }

    exports.BaseTooltip = BaseTooltip;
    exports.default = BaseTheme;

    /***/ }),
    /* 44 */
    /***/ (function(module, exports, __webpack_require__) {

    Object.defineProperty(exports, "__esModule", { value: true });
    var LinkedList = /** @class */ (function () {
        function LinkedList() {
            this.head = this.tail = null;
            this.length = 0;
        }
        LinkedList.prototype.append = function () {
            var nodes = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                nodes[_i] = arguments[_i];
            }
            this.insertBefore(nodes[0], null);
            if (nodes.length > 1) {
                this.append.apply(this, nodes.slice(1));
            }
        };
        LinkedList.prototype.contains = function (node) {
            var cur, next = this.iterator();
            while ((cur = next())) {
                if (cur === node)
                    return true;
            }
            return false;
        };
        LinkedList.prototype.insertBefore = function (node, refNode) {
            if (!node)
                return;
            node.next = refNode;
            if (refNode != null) {
                node.prev = refNode.prev;
                if (refNode.prev != null) {
                    refNode.prev.next = node;
                }
                refNode.prev = node;
                if (refNode === this.head) {
                    this.head = node;
                }
            }
            else if (this.tail != null) {
                this.tail.next = node;
                node.prev = this.tail;
                this.tail = node;
            }
            else {
                node.prev = null;
                this.head = this.tail = node;
            }
            this.length += 1;
        };
        LinkedList.prototype.offset = function (target) {
            var index = 0, cur = this.head;
            while (cur != null) {
                if (cur === target)
                    return index;
                index += cur.length();
                cur = cur.next;
            }
            return -1;
        };
        LinkedList.prototype.remove = function (node) {
            if (!this.contains(node))
                return;
            if (node.prev != null)
                node.prev.next = node.next;
            if (node.next != null)
                node.next.prev = node.prev;
            if (node === this.head)
                this.head = node.next;
            if (node === this.tail)
                this.tail = node.prev;
            this.length -= 1;
        };
        LinkedList.prototype.iterator = function (curNode) {
            if (curNode === void 0) { curNode = this.head; }
            // TODO use yield when we can
            return function () {
                var ret = curNode;
                if (curNode != null)
                    curNode = curNode.next;
                return ret;
            };
        };
        LinkedList.prototype.find = function (index, inclusive) {
            if (inclusive === void 0) { inclusive = false; }
            var cur, next = this.iterator();
            while ((cur = next())) {
                var length = cur.length();
                if (index < length ||
                    (inclusive && index === length && (cur.next == null || cur.next.length() !== 0))) {
                    return [cur, index];
                }
                index -= length;
            }
            return [null, 0];
        };
        LinkedList.prototype.forEach = function (callback) {
            var cur, next = this.iterator();
            while ((cur = next())) {
                callback(cur);
            }
        };
        LinkedList.prototype.forEachAt = function (index, length, callback) {
            if (length <= 0)
                return;
            var _a = this.find(index), startNode = _a[0], offset = _a[1];
            var cur, curIndex = index - offset, next = this.iterator(startNode);
            while ((cur = next()) && curIndex < index + length) {
                var curLength = cur.length();
                if (index > curIndex) {
                    callback(cur, index - curIndex, Math.min(length, curIndex + curLength - index));
                }
                else {
                    callback(cur, 0, Math.min(curLength, index + length - curIndex));
                }
                curIndex += curLength;
            }
        };
        LinkedList.prototype.map = function (callback) {
            return this.reduce(function (memo, cur) {
                memo.push(callback(cur));
                return memo;
            }, []);
        };
        LinkedList.prototype.reduce = function (callback, memo) {
            var cur, next = this.iterator();
            while ((cur = next())) {
                memo = callback(memo, cur);
            }
            return memo;
        };
        return LinkedList;
    }());
    exports.default = LinkedList;


    /***/ }),
    /* 45 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var container_1 = __webpack_require__(17);
    var Registry = __webpack_require__(1);
    var OBSERVER_CONFIG = {
        attributes: true,
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true,
    };
    var MAX_OPTIMIZE_ITERATIONS = 100;
    var ScrollBlot = /** @class */ (function (_super) {
        __extends(ScrollBlot, _super);
        function ScrollBlot(node) {
            var _this = _super.call(this, node) || this;
            _this.scroll = _this;
            _this.observer = new MutationObserver(function (mutations) {
                _this.update(mutations);
            });
            _this.observer.observe(_this.domNode, OBSERVER_CONFIG);
            _this.attach();
            return _this;
        }
        ScrollBlot.prototype.detach = function () {
            _super.prototype.detach.call(this);
            this.observer.disconnect();
        };
        ScrollBlot.prototype.deleteAt = function (index, length) {
            this.update();
            if (index === 0 && length === this.length()) {
                this.children.forEach(function (child) {
                    child.remove();
                });
            }
            else {
                _super.prototype.deleteAt.call(this, index, length);
            }
        };
        ScrollBlot.prototype.formatAt = function (index, length, name, value) {
            this.update();
            _super.prototype.formatAt.call(this, index, length, name, value);
        };
        ScrollBlot.prototype.insertAt = function (index, value, def) {
            this.update();
            _super.prototype.insertAt.call(this, index, value, def);
        };
        ScrollBlot.prototype.optimize = function (mutations, context) {
            var _this = this;
            if (mutations === void 0) { mutations = []; }
            if (context === void 0) { context = {}; }
            _super.prototype.optimize.call(this, context);
            // We must modify mutations directly, cannot make copy and then modify
            var records = [].slice.call(this.observer.takeRecords());
            // Array.push currently seems to be implemented by a non-tail recursive function
            // so we cannot just mutations.push.apply(mutations, this.observer.takeRecords());
            while (records.length > 0)
                mutations.push(records.pop());
            // TODO use WeakMap
            var mark = function (blot, markParent) {
                if (markParent === void 0) { markParent = true; }
                if (blot == null || blot === _this)
                    return;
                if (blot.domNode.parentNode == null)
                    return;
                // @ts-ignore
                if (blot.domNode[Registry.DATA_KEY].mutations == null) {
                    // @ts-ignore
                    blot.domNode[Registry.DATA_KEY].mutations = [];
                }
                if (markParent)
                    mark(blot.parent);
            };
            var optimize = function (blot) {
                // Post-order traversal
                if (
                // @ts-ignore
                blot.domNode[Registry.DATA_KEY] == null ||
                    // @ts-ignore
                    blot.domNode[Registry.DATA_KEY].mutations == null) {
                    return;
                }
                if (blot instanceof container_1.default) {
                    blot.children.forEach(optimize);
                }
                blot.optimize(context);
            };
            var remaining = mutations;
            for (var i = 0; remaining.length > 0; i += 1) {
                if (i >= MAX_OPTIMIZE_ITERATIONS) {
                    throw new Error('[Parchment] Maximum optimize iterations reached');
                }
                remaining.forEach(function (mutation) {
                    var blot = Registry.find(mutation.target, true);
                    if (blot == null)
                        return;
                    if (blot.domNode === mutation.target) {
                        if (mutation.type === 'childList') {
                            mark(Registry.find(mutation.previousSibling, false));
                            [].forEach.call(mutation.addedNodes, function (node) {
                                var child = Registry.find(node, false);
                                mark(child, false);
                                if (child instanceof container_1.default) {
                                    child.children.forEach(function (grandChild) {
                                        mark(grandChild, false);
                                    });
                                }
                            });
                        }
                        else if (mutation.type === 'attributes') {
                            mark(blot.prev);
                        }
                    }
                    mark(blot);
                });
                this.children.forEach(optimize);
                remaining = [].slice.call(this.observer.takeRecords());
                records = remaining.slice();
                while (records.length > 0)
                    mutations.push(records.pop());
            }
        };
        ScrollBlot.prototype.update = function (mutations, context) {
            var _this = this;
            if (context === void 0) { context = {}; }
            mutations = mutations || this.observer.takeRecords();
            // TODO use WeakMap
            mutations
                .map(function (mutation) {
                var blot = Registry.find(mutation.target, true);
                if (blot == null)
                    return null;
                // @ts-ignore
                if (blot.domNode[Registry.DATA_KEY].mutations == null) {
                    // @ts-ignore
                    blot.domNode[Registry.DATA_KEY].mutations = [mutation];
                    return blot;
                }
                else {
                    // @ts-ignore
                    blot.domNode[Registry.DATA_KEY].mutations.push(mutation);
                    return null;
                }
            })
                .forEach(function (blot) {
                if (blot == null ||
                    blot === _this ||
                    //@ts-ignore
                    blot.domNode[Registry.DATA_KEY] == null)
                    return;
                // @ts-ignore
                blot.update(blot.domNode[Registry.DATA_KEY].mutations || [], context);
            });
            // @ts-ignore
            if (this.domNode[Registry.DATA_KEY].mutations != null) {
                // @ts-ignore
                _super.prototype.update.call(this, this.domNode[Registry.DATA_KEY].mutations, context);
            }
            this.optimize(mutations, context);
        };
        ScrollBlot.blotName = 'scroll';
        ScrollBlot.defaultChild = 'block';
        ScrollBlot.scope = Registry.Scope.BLOCK_BLOT;
        ScrollBlot.tagName = 'DIV';
        return ScrollBlot;
    }(container_1.default));
    exports.default = ScrollBlot;


    /***/ }),
    /* 46 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var format_1 = __webpack_require__(18);
    var Registry = __webpack_require__(1);
    // Shallow object comparison
    function isEqual(obj1, obj2) {
        if (Object.keys(obj1).length !== Object.keys(obj2).length)
            return false;
        // @ts-ignore
        for (var prop in obj1) {
            // @ts-ignore
            if (obj1[prop] !== obj2[prop])
                return false;
        }
        return true;
    }
    var InlineBlot = /** @class */ (function (_super) {
        __extends(InlineBlot, _super);
        function InlineBlot() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        InlineBlot.formats = function (domNode) {
            if (domNode.tagName === InlineBlot.tagName)
                return undefined;
            return _super.formats.call(this, domNode);
        };
        InlineBlot.prototype.format = function (name, value) {
            var _this = this;
            if (name === this.statics.blotName && !value) {
                this.children.forEach(function (child) {
                    if (!(child instanceof format_1.default)) {
                        child = child.wrap(InlineBlot.blotName, true);
                    }
                    _this.attributes.copy(child);
                });
                this.unwrap();
            }
            else {
                _super.prototype.format.call(this, name, value);
            }
        };
        InlineBlot.prototype.formatAt = function (index, length, name, value) {
            if (this.formats()[name] != null || Registry.query(name, Registry.Scope.ATTRIBUTE)) {
                var blot = this.isolate(index, length);
                blot.format(name, value);
            }
            else {
                _super.prototype.formatAt.call(this, index, length, name, value);
            }
        };
        InlineBlot.prototype.optimize = function (context) {
            _super.prototype.optimize.call(this, context);
            var formats = this.formats();
            if (Object.keys(formats).length === 0) {
                return this.unwrap(); // unformatted span
            }
            var next = this.next;
            if (next instanceof InlineBlot && next.prev === this && isEqual(formats, next.formats())) {
                next.moveChildren(this);
                next.remove();
            }
        };
        InlineBlot.blotName = 'inline';
        InlineBlot.scope = Registry.Scope.INLINE_BLOT;
        InlineBlot.tagName = 'SPAN';
        return InlineBlot;
    }(format_1.default));
    exports.default = InlineBlot;


    /***/ }),
    /* 47 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var format_1 = __webpack_require__(18);
    var Registry = __webpack_require__(1);
    var BlockBlot = /** @class */ (function (_super) {
        __extends(BlockBlot, _super);
        function BlockBlot() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        BlockBlot.formats = function (domNode) {
            var tagName = Registry.query(BlockBlot.blotName).tagName;
            if (domNode.tagName === tagName)
                return undefined;
            return _super.formats.call(this, domNode);
        };
        BlockBlot.prototype.format = function (name, value) {
            if (Registry.query(name, Registry.Scope.BLOCK) == null) {
                return;
            }
            else if (name === this.statics.blotName && !value) {
                this.replaceWith(BlockBlot.blotName);
            }
            else {
                _super.prototype.format.call(this, name, value);
            }
        };
        BlockBlot.prototype.formatAt = function (index, length, name, value) {
            if (Registry.query(name, Registry.Scope.BLOCK) != null) {
                this.format(name, value);
            }
            else {
                _super.prototype.formatAt.call(this, index, length, name, value);
            }
        };
        BlockBlot.prototype.insertAt = function (index, value, def) {
            if (def == null || Registry.query(value, Registry.Scope.INLINE) != null) {
                // Insert text or inline
                _super.prototype.insertAt.call(this, index, value, def);
            }
            else {
                var after = this.split(index);
                var blot = Registry.create(value, def);
                after.parent.insertBefore(blot, after);
            }
        };
        BlockBlot.prototype.update = function (mutations, context) {
            if (navigator.userAgent.match(/Trident/)) {
                this.build();
            }
            else {
                _super.prototype.update.call(this, mutations, context);
            }
        };
        BlockBlot.blotName = 'block';
        BlockBlot.scope = Registry.Scope.BLOCK_BLOT;
        BlockBlot.tagName = 'P';
        return BlockBlot;
    }(format_1.default));
    exports.default = BlockBlot;


    /***/ }),
    /* 48 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var leaf_1 = __webpack_require__(19);
    var EmbedBlot = /** @class */ (function (_super) {
        __extends(EmbedBlot, _super);
        function EmbedBlot() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        EmbedBlot.formats = function (domNode) {
            return undefined;
        };
        EmbedBlot.prototype.format = function (name, value) {
            // super.formatAt wraps, which is what we want in general,
            // but this allows subclasses to overwrite for formats
            // that just apply to particular embeds
            _super.prototype.formatAt.call(this, 0, this.length(), name, value);
        };
        EmbedBlot.prototype.formatAt = function (index, length, name, value) {
            if (index === 0 && length === this.length()) {
                this.format(name, value);
            }
            else {
                _super.prototype.formatAt.call(this, index, length, name, value);
            }
        };
        EmbedBlot.prototype.formats = function () {
            return this.statics.formats(this.domNode);
        };
        return EmbedBlot;
    }(leaf_1.default));
    exports.default = EmbedBlot;


    /***/ }),
    /* 49 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var leaf_1 = __webpack_require__(19);
    var Registry = __webpack_require__(1);
    var TextBlot = /** @class */ (function (_super) {
        __extends(TextBlot, _super);
        function TextBlot(node) {
            var _this = _super.call(this, node) || this;
            _this.text = _this.statics.value(_this.domNode);
            return _this;
        }
        TextBlot.create = function (value) {
            return document.createTextNode(value);
        };
        TextBlot.value = function (domNode) {
            var text = domNode.data;
            // @ts-ignore
            if (text['normalize'])
                text = text['normalize']();
            return text;
        };
        TextBlot.prototype.deleteAt = function (index, length) {
            this.domNode.data = this.text = this.text.slice(0, index) + this.text.slice(index + length);
        };
        TextBlot.prototype.index = function (node, offset) {
            if (this.domNode === node) {
                return offset;
            }
            return -1;
        };
        TextBlot.prototype.insertAt = function (index, value, def) {
            if (def == null) {
                this.text = this.text.slice(0, index) + value + this.text.slice(index);
                this.domNode.data = this.text;
            }
            else {
                _super.prototype.insertAt.call(this, index, value, def);
            }
        };
        TextBlot.prototype.length = function () {
            return this.text.length;
        };
        TextBlot.prototype.optimize = function (context) {
            _super.prototype.optimize.call(this, context);
            this.text = this.statics.value(this.domNode);
            if (this.text.length === 0) {
                this.remove();
            }
            else if (this.next instanceof TextBlot && this.next.prev === this) {
                this.insertAt(this.length(), this.next.value());
                this.next.remove();
            }
        };
        TextBlot.prototype.position = function (index, inclusive) {
            return [this.domNode, index];
        };
        TextBlot.prototype.split = function (index, force) {
            if (force === void 0) { force = false; }
            if (!force) {
                if (index === 0)
                    return this;
                if (index === this.length())
                    return this.next;
            }
            var after = Registry.create(this.domNode.splitText(index));
            this.parent.insertBefore(after, this.next);
            this.text = this.statics.value(this.domNode);
            return after;
        };
        TextBlot.prototype.update = function (mutations, context) {
            var _this = this;
            if (mutations.some(function (mutation) {
                return mutation.type === 'characterData' && mutation.target === _this.domNode;
            })) {
                this.text = this.statics.value(this.domNode);
            }
        };
        TextBlot.prototype.value = function () {
            return this.text;
        };
        TextBlot.blotName = 'text';
        TextBlot.scope = Registry.Scope.INLINE_BLOT;
        return TextBlot;
    }(leaf_1.default));
    exports.default = TextBlot;


    /***/ }),
    /* 50 */
    /***/ (function(module, exports, __webpack_require__) {


    var elem = document.createElement('div');
    elem.classList.toggle('test-class', false);
    if (elem.classList.contains('test-class')) {
      var _toggle = DOMTokenList.prototype.toggle;
      DOMTokenList.prototype.toggle = function (token, force) {
        if (arguments.length > 1 && !this.contains(token) === !force) {
          return force;
        } else {
          return _toggle.call(this, token);
        }
      };
    }

    if (!String.prototype.startsWith) {
      String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
      };
    }

    if (!String.prototype.endsWith) {
      String.prototype.endsWith = function (searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
          position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
      };
    }

    if (!Array.prototype.find) {
      Object.defineProperty(Array.prototype, "find", {
        value: function value(predicate) {
          if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
          }
          if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
          }
          var list = Object(this);
          var length = list.length >>> 0;
          var thisArg = arguments[1];
          var value;

          for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
              return value;
            }
          }
          return undefined;
        }
      });
    }

    document.addEventListener("DOMContentLoaded", function () {
      // Disable resizing in Firefox
      document.execCommand("enableObjectResizing", false, false);
      // Disable automatic linkifying in IE11
      document.execCommand("autoUrlDetect", false, false);
    });

    /***/ }),
    /* 51 */
    /***/ (function(module, exports) {

    /**
     * This library modifies the diff-patch-match library by Neil Fraser
     * by removing the patch and match functionality and certain advanced
     * options in the diff function. The original license is as follows:
     *
     * ===
     *
     * Diff Match and Patch
     *
     * Copyright 2006 Google Inc.
     * http://code.google.com/p/google-diff-match-patch/
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */


    /**
     * The data structure representing a diff is an array of tuples:
     * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
     * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
     */
    var DIFF_DELETE = -1;
    var DIFF_INSERT = 1;
    var DIFF_EQUAL = 0;


    /**
     * Find the differences between two texts.  Simplifies the problem by stripping
     * any common prefix or suffix off the texts before diffing.
     * @param {string} text1 Old string to be diffed.
     * @param {string} text2 New string to be diffed.
     * @param {Int} cursor_pos Expected edit position in text1 (optional)
     * @return {Array} Array of diff tuples.
     */
    function diff_main(text1, text2, cursor_pos) {
      // Check for equality (speedup).
      if (text1 == text2) {
        if (text1) {
          return [[DIFF_EQUAL, text1]];
        }
        return [];
      }

      // Check cursor_pos within bounds
      if (cursor_pos < 0 || text1.length < cursor_pos) {
        cursor_pos = null;
      }

      // Trim off common prefix (speedup).
      var commonlength = diff_commonPrefix(text1, text2);
      var commonprefix = text1.substring(0, commonlength);
      text1 = text1.substring(commonlength);
      text2 = text2.substring(commonlength);

      // Trim off common suffix (speedup).
      commonlength = diff_commonSuffix(text1, text2);
      var commonsuffix = text1.substring(text1.length - commonlength);
      text1 = text1.substring(0, text1.length - commonlength);
      text2 = text2.substring(0, text2.length - commonlength);

      // Compute the diff on the middle block.
      var diffs = diff_compute_(text1, text2);

      // Restore the prefix and suffix.
      if (commonprefix) {
        diffs.unshift([DIFF_EQUAL, commonprefix]);
      }
      if (commonsuffix) {
        diffs.push([DIFF_EQUAL, commonsuffix]);
      }
      diff_cleanupMerge(diffs);
      if (cursor_pos != null) {
        diffs = fix_cursor(diffs, cursor_pos);
      }
      diffs = fix_emoji(diffs);
      return diffs;
    }

    /**
     * Find the differences between two texts.  Assumes that the texts do not
     * have any common prefix or suffix.
     * @param {string} text1 Old string to be diffed.
     * @param {string} text2 New string to be diffed.
     * @return {Array} Array of diff tuples.
     */
    function diff_compute_(text1, text2) {
      var diffs;

      if (!text1) {
        // Just add some text (speedup).
        return [[DIFF_INSERT, text2]];
      }

      if (!text2) {
        // Just delete some text (speedup).
        return [[DIFF_DELETE, text1]];
      }

      var longtext = text1.length > text2.length ? text1 : text2;
      var shorttext = text1.length > text2.length ? text2 : text1;
      var i = longtext.indexOf(shorttext);
      if (i != -1) {
        // Shorter text is inside the longer text (speedup).
        diffs = [[DIFF_INSERT, longtext.substring(0, i)],
                 [DIFF_EQUAL, shorttext],
                 [DIFF_INSERT, longtext.substring(i + shorttext.length)]];
        // Swap insertions for deletions if diff is reversed.
        if (text1.length > text2.length) {
          diffs[0][0] = diffs[2][0] = DIFF_DELETE;
        }
        return diffs;
      }

      if (shorttext.length == 1) {
        // Single character string.
        // After the previous speedup, the character can't be an equality.
        return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
      }

      // Check to see if the problem can be split in two.
      var hm = diff_halfMatch_(text1, text2);
      if (hm) {
        // A half-match was found, sort out the return data.
        var text1_a = hm[0];
        var text1_b = hm[1];
        var text2_a = hm[2];
        var text2_b = hm[3];
        var mid_common = hm[4];
        // Send both pairs off for separate processing.
        var diffs_a = diff_main(text1_a, text2_a);
        var diffs_b = diff_main(text1_b, text2_b);
        // Merge the results.
        return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
      }

      return diff_bisect_(text1, text2);
    }

    /**
     * Find the 'middle snake' of a diff, split the problem in two
     * and return the recursively constructed diff.
     * See Myers 1986 paper: An O(ND) Difference Algorithm and Its Variations.
     * @param {string} text1 Old string to be diffed.
     * @param {string} text2 New string to be diffed.
     * @return {Array} Array of diff tuples.
     * @private
     */
    function diff_bisect_(text1, text2) {
      // Cache the text lengths to prevent multiple calls.
      var text1_length = text1.length;
      var text2_length = text2.length;
      var max_d = Math.ceil((text1_length + text2_length) / 2);
      var v_offset = max_d;
      var v_length = 2 * max_d;
      var v1 = new Array(v_length);
      var v2 = new Array(v_length);
      // Setting all elements to -1 is faster in Chrome & Firefox than mixing
      // integers and undefined.
      for (var x = 0; x < v_length; x++) {
        v1[x] = -1;
        v2[x] = -1;
      }
      v1[v_offset + 1] = 0;
      v2[v_offset + 1] = 0;
      var delta = text1_length - text2_length;
      // If the total number of characters is odd, then the front path will collide
      // with the reverse path.
      var front = (delta % 2 != 0);
      // Offsets for start and end of k loop.
      // Prevents mapping of space beyond the grid.
      var k1start = 0;
      var k1end = 0;
      var k2start = 0;
      var k2end = 0;
      for (var d = 0; d < max_d; d++) {
        // Walk the front path one step.
        for (var k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
          var k1_offset = v_offset + k1;
          var x1;
          if (k1 == -d || (k1 != d && v1[k1_offset - 1] < v1[k1_offset + 1])) {
            x1 = v1[k1_offset + 1];
          } else {
            x1 = v1[k1_offset - 1] + 1;
          }
          var y1 = x1 - k1;
          while (x1 < text1_length && y1 < text2_length &&
                 text1.charAt(x1) == text2.charAt(y1)) {
            x1++;
            y1++;
          }
          v1[k1_offset] = x1;
          if (x1 > text1_length) {
            // Ran off the right of the graph.
            k1end += 2;
          } else if (y1 > text2_length) {
            // Ran off the bottom of the graph.
            k1start += 2;
          } else if (front) {
            var k2_offset = v_offset + delta - k1;
            if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] != -1) {
              // Mirror x2 onto top-left coordinate system.
              var x2 = text1_length - v2[k2_offset];
              if (x1 >= x2) {
                // Overlap detected.
                return diff_bisectSplit_(text1, text2, x1, y1);
              }
            }
          }
        }

        // Walk the reverse path one step.
        for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
          var k2_offset = v_offset + k2;
          var x2;
          if (k2 == -d || (k2 != d && v2[k2_offset - 1] < v2[k2_offset + 1])) {
            x2 = v2[k2_offset + 1];
          } else {
            x2 = v2[k2_offset - 1] + 1;
          }
          var y2 = x2 - k2;
          while (x2 < text1_length && y2 < text2_length &&
                 text1.charAt(text1_length - x2 - 1) ==
                 text2.charAt(text2_length - y2 - 1)) {
            x2++;
            y2++;
          }
          v2[k2_offset] = x2;
          if (x2 > text1_length) {
            // Ran off the left of the graph.
            k2end += 2;
          } else if (y2 > text2_length) {
            // Ran off the top of the graph.
            k2start += 2;
          } else if (!front) {
            var k1_offset = v_offset + delta - k2;
            if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] != -1) {
              var x1 = v1[k1_offset];
              var y1 = v_offset + x1 - k1_offset;
              // Mirror x2 onto top-left coordinate system.
              x2 = text1_length - x2;
              if (x1 >= x2) {
                // Overlap detected.
                return diff_bisectSplit_(text1, text2, x1, y1);
              }
            }
          }
        }
      }
      // Diff took too long and hit the deadline or
      // number of diffs equals number of characters, no commonality at all.
      return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
    }

    /**
     * Given the location of the 'middle snake', split the diff in two parts
     * and recurse.
     * @param {string} text1 Old string to be diffed.
     * @param {string} text2 New string to be diffed.
     * @param {number} x Index of split point in text1.
     * @param {number} y Index of split point in text2.
     * @return {Array} Array of diff tuples.
     */
    function diff_bisectSplit_(text1, text2, x, y) {
      var text1a = text1.substring(0, x);
      var text2a = text2.substring(0, y);
      var text1b = text1.substring(x);
      var text2b = text2.substring(y);

      // Compute both diffs serially.
      var diffs = diff_main(text1a, text2a);
      var diffsb = diff_main(text1b, text2b);

      return diffs.concat(diffsb);
    }

    /**
     * Determine the common prefix of two strings.
     * @param {string} text1 First string.
     * @param {string} text2 Second string.
     * @return {number} The number of characters common to the start of each
     *     string.
     */
    function diff_commonPrefix(text1, text2) {
      // Quick check for common null cases.
      if (!text1 || !text2 || text1.charAt(0) != text2.charAt(0)) {
        return 0;
      }
      // Binary search.
      // Performance analysis: http://neil.fraser.name/news/2007/10/09/
      var pointermin = 0;
      var pointermax = Math.min(text1.length, text2.length);
      var pointermid = pointermax;
      var pointerstart = 0;
      while (pointermin < pointermid) {
        if (text1.substring(pointerstart, pointermid) ==
            text2.substring(pointerstart, pointermid)) {
          pointermin = pointermid;
          pointerstart = pointermin;
        } else {
          pointermax = pointermid;
        }
        pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
      }
      return pointermid;
    }

    /**
     * Determine the common suffix of two strings.
     * @param {string} text1 First string.
     * @param {string} text2 Second string.
     * @return {number} The number of characters common to the end of each string.
     */
    function diff_commonSuffix(text1, text2) {
      // Quick check for common null cases.
      if (!text1 || !text2 ||
          text1.charAt(text1.length - 1) != text2.charAt(text2.length - 1)) {
        return 0;
      }
      // Binary search.
      // Performance analysis: http://neil.fraser.name/news/2007/10/09/
      var pointermin = 0;
      var pointermax = Math.min(text1.length, text2.length);
      var pointermid = pointermax;
      var pointerend = 0;
      while (pointermin < pointermid) {
        if (text1.substring(text1.length - pointermid, text1.length - pointerend) ==
            text2.substring(text2.length - pointermid, text2.length - pointerend)) {
          pointermin = pointermid;
          pointerend = pointermin;
        } else {
          pointermax = pointermid;
        }
        pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
      }
      return pointermid;
    }

    /**
     * Do the two texts share a substring which is at least half the length of the
     * longer text?
     * This speedup can produce non-minimal diffs.
     * @param {string} text1 First string.
     * @param {string} text2 Second string.
     * @return {Array.<string>} Five element Array, containing the prefix of
     *     text1, the suffix of text1, the prefix of text2, the suffix of
     *     text2 and the common middle.  Or null if there was no match.
     */
    function diff_halfMatch_(text1, text2) {
      var longtext = text1.length > text2.length ? text1 : text2;
      var shorttext = text1.length > text2.length ? text2 : text1;
      if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
        return null;  // Pointless.
      }

      /**
       * Does a substring of shorttext exist within longtext such that the substring
       * is at least half the length of longtext?
       * Closure, but does not reference any external variables.
       * @param {string} longtext Longer string.
       * @param {string} shorttext Shorter string.
       * @param {number} i Start index of quarter length substring within longtext.
       * @return {Array.<string>} Five element Array, containing the prefix of
       *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
       *     of shorttext and the common middle.  Or null if there was no match.
       * @private
       */
      function diff_halfMatchI_(longtext, shorttext, i) {
        // Start with a 1/4 length substring at position i as a seed.
        var seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
        var j = -1;
        var best_common = '';
        var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
        while ((j = shorttext.indexOf(seed, j + 1)) != -1) {
          var prefixLength = diff_commonPrefix(longtext.substring(i),
                                               shorttext.substring(j));
          var suffixLength = diff_commonSuffix(longtext.substring(0, i),
                                               shorttext.substring(0, j));
          if (best_common.length < suffixLength + prefixLength) {
            best_common = shorttext.substring(j - suffixLength, j) +
                shorttext.substring(j, j + prefixLength);
            best_longtext_a = longtext.substring(0, i - suffixLength);
            best_longtext_b = longtext.substring(i + prefixLength);
            best_shorttext_a = shorttext.substring(0, j - suffixLength);
            best_shorttext_b = shorttext.substring(j + prefixLength);
          }
        }
        if (best_common.length * 2 >= longtext.length) {
          return [best_longtext_a, best_longtext_b,
                  best_shorttext_a, best_shorttext_b, best_common];
        } else {
          return null;
        }
      }

      // First check if the second quarter is the seed for a half-match.
      var hm1 = diff_halfMatchI_(longtext, shorttext,
                                 Math.ceil(longtext.length / 4));
      // Check again based on the third quarter.
      var hm2 = diff_halfMatchI_(longtext, shorttext,
                                 Math.ceil(longtext.length / 2));
      var hm;
      if (!hm1 && !hm2) {
        return null;
      } else if (!hm2) {
        hm = hm1;
      } else if (!hm1) {
        hm = hm2;
      } else {
        // Both matched.  Select the longest.
        hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
      }

      // A half-match was found, sort out the return data.
      var text1_a, text1_b, text2_a, text2_b;
      if (text1.length > text2.length) {
        text1_a = hm[0];
        text1_b = hm[1];
        text2_a = hm[2];
        text2_b = hm[3];
      } else {
        text2_a = hm[0];
        text2_b = hm[1];
        text1_a = hm[2];
        text1_b = hm[3];
      }
      var mid_common = hm[4];
      return [text1_a, text1_b, text2_a, text2_b, mid_common];
    }

    /**
     * Reorder and merge like edit sections.  Merge equalities.
     * Any edit section can move as long as it doesn't cross an equality.
     * @param {Array} diffs Array of diff tuples.
     */
    function diff_cleanupMerge(diffs) {
      diffs.push([DIFF_EQUAL, '']);  // Add a dummy entry at the end.
      var pointer = 0;
      var count_delete = 0;
      var count_insert = 0;
      var text_delete = '';
      var text_insert = '';
      var commonlength;
      while (pointer < diffs.length) {
        switch (diffs[pointer][0]) {
          case DIFF_INSERT:
            count_insert++;
            text_insert += diffs[pointer][1];
            pointer++;
            break;
          case DIFF_DELETE:
            count_delete++;
            text_delete += diffs[pointer][1];
            pointer++;
            break;
          case DIFF_EQUAL:
            // Upon reaching an equality, check for prior redundancies.
            if (count_delete + count_insert > 1) {
              if (count_delete !== 0 && count_insert !== 0) {
                // Factor out any common prefixies.
                commonlength = diff_commonPrefix(text_insert, text_delete);
                if (commonlength !== 0) {
                  if ((pointer - count_delete - count_insert) > 0 &&
                      diffs[pointer - count_delete - count_insert - 1][0] ==
                      DIFF_EQUAL) {
                    diffs[pointer - count_delete - count_insert - 1][1] +=
                        text_insert.substring(0, commonlength);
                  } else {
                    diffs.splice(0, 0, [DIFF_EQUAL,
                                        text_insert.substring(0, commonlength)]);
                    pointer++;
                  }
                  text_insert = text_insert.substring(commonlength);
                  text_delete = text_delete.substring(commonlength);
                }
                // Factor out any common suffixies.
                commonlength = diff_commonSuffix(text_insert, text_delete);
                if (commonlength !== 0) {
                  diffs[pointer][1] = text_insert.substring(text_insert.length -
                      commonlength) + diffs[pointer][1];
                  text_insert = text_insert.substring(0, text_insert.length -
                      commonlength);
                  text_delete = text_delete.substring(0, text_delete.length -
                      commonlength);
                }
              }
              // Delete the offending records and add the merged ones.
              if (count_delete === 0) {
                diffs.splice(pointer - count_insert,
                    count_delete + count_insert, [DIFF_INSERT, text_insert]);
              } else if (count_insert === 0) {
                diffs.splice(pointer - count_delete,
                    count_delete + count_insert, [DIFF_DELETE, text_delete]);
              } else {
                diffs.splice(pointer - count_delete - count_insert,
                    count_delete + count_insert, [DIFF_DELETE, text_delete],
                    [DIFF_INSERT, text_insert]);
              }
              pointer = pointer - count_delete - count_insert +
                        (count_delete ? 1 : 0) + (count_insert ? 1 : 0) + 1;
            } else if (pointer !== 0 && diffs[pointer - 1][0] == DIFF_EQUAL) {
              // Merge this equality with the previous one.
              diffs[pointer - 1][1] += diffs[pointer][1];
              diffs.splice(pointer, 1);
            } else {
              pointer++;
            }
            count_insert = 0;
            count_delete = 0;
            text_delete = '';
            text_insert = '';
            break;
        }
      }
      if (diffs[diffs.length - 1][1] === '') {
        diffs.pop();  // Remove the dummy entry at the end.
      }

      // Second pass: look for single edits surrounded on both sides by equalities
      // which can be shifted sideways to eliminate an equality.
      // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
      var changes = false;
      pointer = 1;
      // Intentionally ignore the first and last element (don't need checking).
      while (pointer < diffs.length - 1) {
        if (diffs[pointer - 1][0] == DIFF_EQUAL &&
            diffs[pointer + 1][0] == DIFF_EQUAL) {
          // This is a single edit surrounded by equalities.
          if (diffs[pointer][1].substring(diffs[pointer][1].length -
              diffs[pointer - 1][1].length) == diffs[pointer - 1][1]) {
            // Shift the edit over the previous equality.
            diffs[pointer][1] = diffs[pointer - 1][1] +
                diffs[pointer][1].substring(0, diffs[pointer][1].length -
                                            diffs[pointer - 1][1].length);
            diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
            diffs.splice(pointer - 1, 1);
            changes = true;
          } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ==
              diffs[pointer + 1][1]) {
            // Shift the edit over the next equality.
            diffs[pointer - 1][1] += diffs[pointer + 1][1];
            diffs[pointer][1] =
                diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
                diffs[pointer + 1][1];
            diffs.splice(pointer + 1, 1);
            changes = true;
          }
        }
        pointer++;
      }
      // If shifts were made, the diff needs reordering and another shift sweep.
      if (changes) {
        diff_cleanupMerge(diffs);
      }
    }

    var diff = diff_main;
    diff.INSERT = DIFF_INSERT;
    diff.DELETE = DIFF_DELETE;
    diff.EQUAL = DIFF_EQUAL;

    module.exports = diff;

    /*
     * Modify a diff such that the cursor position points to the start of a change:
     * E.g.
     *   cursor_normalize_diff([[DIFF_EQUAL, 'abc']], 1)
     *     => [1, [[DIFF_EQUAL, 'a'], [DIFF_EQUAL, 'bc']]]
     *   cursor_normalize_diff([[DIFF_INSERT, 'new'], [DIFF_DELETE, 'xyz']], 2)
     *     => [2, [[DIFF_INSERT, 'new'], [DIFF_DELETE, 'xy'], [DIFF_DELETE, 'z']]]
     *
     * @param {Array} diffs Array of diff tuples
     * @param {Int} cursor_pos Suggested edit position. Must not be out of bounds!
     * @return {Array} A tuple [cursor location in the modified diff, modified diff]
     */
    function cursor_normalize_diff (diffs, cursor_pos) {
      if (cursor_pos === 0) {
        return [DIFF_EQUAL, diffs];
      }
      for (var current_pos = 0, i = 0; i < diffs.length; i++) {
        var d = diffs[i];
        if (d[0] === DIFF_DELETE || d[0] === DIFF_EQUAL) {
          var next_pos = current_pos + d[1].length;
          if (cursor_pos === next_pos) {
            return [i + 1, diffs];
          } else if (cursor_pos < next_pos) {
            // copy to prevent side effects
            diffs = diffs.slice();
            // split d into two diff changes
            var split_pos = cursor_pos - current_pos;
            var d_left = [d[0], d[1].slice(0, split_pos)];
            var d_right = [d[0], d[1].slice(split_pos)];
            diffs.splice(i, 1, d_left, d_right);
            return [i + 1, diffs];
          } else {
            current_pos = next_pos;
          }
        }
      }
      throw new Error('cursor_pos is out of bounds!')
    }

    /*
     * Modify a diff such that the edit position is "shifted" to the proposed edit location (cursor_position).
     *
     * Case 1)
     *   Check if a naive shift is possible:
     *     [0, X], [ 1, Y] -> [ 1, Y], [0, X]    (if X + Y === Y + X)
     *     [0, X], [-1, Y] -> [-1, Y], [0, X]    (if X + Y === Y + X) - holds same result
     * Case 2)
     *   Check if the following shifts are possible:
     *     [0, 'pre'], [ 1, 'prefix'] -> [ 1, 'pre'], [0, 'pre'], [ 1, 'fix']
     *     [0, 'pre'], [-1, 'prefix'] -> [-1, 'pre'], [0, 'pre'], [-1, 'fix']
     *         ^            ^
     *         d          d_next
     *
     * @param {Array} diffs Array of diff tuples
     * @param {Int} cursor_pos Suggested edit position. Must not be out of bounds!
     * @return {Array} Array of diff tuples
     */
    function fix_cursor (diffs, cursor_pos) {
      var norm = cursor_normalize_diff(diffs, cursor_pos);
      var ndiffs = norm[1];
      var cursor_pointer = norm[0];
      var d = ndiffs[cursor_pointer];
      var d_next = ndiffs[cursor_pointer + 1];

      if (d == null) {
        // Text was deleted from end of original string,
        // cursor is now out of bounds in new string
        return diffs;
      } else if (d[0] !== DIFF_EQUAL) {
        // A modification happened at the cursor location.
        // This is the expected outcome, so we can return the original diff.
        return diffs;
      } else {
        if (d_next != null && d[1] + d_next[1] === d_next[1] + d[1]) {
          // Case 1)
          // It is possible to perform a naive shift
          ndiffs.splice(cursor_pointer, 2, d_next, d);
          return merge_tuples(ndiffs, cursor_pointer, 2)
        } else if (d_next != null && d_next[1].indexOf(d[1]) === 0) {
          // Case 2)
          // d[1] is a prefix of d_next[1]
          // We can assume that d_next[0] !== 0, since d[0] === 0
          // Shift edit locations..
          ndiffs.splice(cursor_pointer, 2, [d_next[0], d[1]], [0, d[1]]);
          var suffix = d_next[1].slice(d[1].length);
          if (suffix.length > 0) {
            ndiffs.splice(cursor_pointer + 2, 0, [d_next[0], suffix]);
          }
          return merge_tuples(ndiffs, cursor_pointer, 3)
        } else {
          // Not possible to perform any modification
          return diffs;
        }
      }
    }

    /*
     * Check diff did not split surrogate pairs.
     * Ex. [0, '\uD83D'], [-1, '\uDC36'], [1, '\uDC2F'] -> [-1, '\uD83D\uDC36'], [1, '\uD83D\uDC2F']
     *     '\uD83D\uDC36' === '🐶', '\uD83D\uDC2F' === '🐯'
     *
     * @param {Array} diffs Array of diff tuples
     * @return {Array} Array of diff tuples
     */
    function fix_emoji (diffs) {
      var compact = false;
      var starts_with_pair_end = function(str) {
        return str.charCodeAt(0) >= 0xDC00 && str.charCodeAt(0) <= 0xDFFF;
      };
      var ends_with_pair_start = function(str) {
        return str.charCodeAt(str.length-1) >= 0xD800 && str.charCodeAt(str.length-1) <= 0xDBFF;
      };
      for (var i = 2; i < diffs.length; i += 1) {
        if (diffs[i-2][0] === DIFF_EQUAL && ends_with_pair_start(diffs[i-2][1]) &&
            diffs[i-1][0] === DIFF_DELETE && starts_with_pair_end(diffs[i-1][1]) &&
            diffs[i][0] === DIFF_INSERT && starts_with_pair_end(diffs[i][1])) {
          compact = true;

          diffs[i-1][1] = diffs[i-2][1].slice(-1) + diffs[i-1][1];
          diffs[i][1] = diffs[i-2][1].slice(-1) + diffs[i][1];

          diffs[i-2][1] = diffs[i-2][1].slice(0, -1);
        }
      }
      if (!compact) {
        return diffs;
      }
      var fixed_diffs = [];
      for (var i = 0; i < diffs.length; i += 1) {
        if (diffs[i][1].length > 0) {
          fixed_diffs.push(diffs[i]);
        }
      }
      return fixed_diffs;
    }

    /*
     * Try to merge tuples with their neigbors in a given range.
     * E.g. [0, 'a'], [0, 'b'] -> [0, 'ab']
     *
     * @param {Array} diffs Array of diff tuples.
     * @param {Int} start Position of the first element to merge (diffs[start] is also merged with diffs[start - 1]).
     * @param {Int} length Number of consecutive elements to check.
     * @return {Array} Array of merged diff tuples.
     */
    function merge_tuples (diffs, start, length) {
      // Check from (start-1) to (start+length).
      for (var i = start + length - 1; i >= 0 && i >= start - 1; i--) {
        if (i + 1 < diffs.length) {
          var left_d = diffs[i];
          var right_d = diffs[i+1];
          if (left_d[0] === right_d[1]) {
            diffs.splice(i, 2, [left_d[0], left_d[1] + right_d[1]]);
          }
        }
      }
      return diffs;
    }


    /***/ }),
    /* 52 */
    /***/ (function(module, exports) {

    exports = module.exports = typeof Object.keys === 'function'
      ? Object.keys : shim;

    exports.shim = shim;
    function shim (obj) {
      var keys = [];
      for (var key in obj) keys.push(key);
      return keys;
    }


    /***/ }),
    /* 53 */
    /***/ (function(module, exports) {

    var supportsArgumentsClass = (function(){
      return Object.prototype.toString.call(arguments)
    })() == '[object Arguments]';

    exports = module.exports = supportsArgumentsClass ? supported : unsupported;

    exports.supported = supported;
    function supported(object) {
      return Object.prototype.toString.call(object) == '[object Arguments]';
    }
    exports.unsupported = unsupported;
    function unsupported(object){
      return object &&
        typeof object == 'object' &&
        typeof object.length == 'number' &&
        Object.prototype.hasOwnProperty.call(object, 'callee') &&
        !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
        false;
    }

    /***/ }),
    /* 54 */
    /***/ (function(module, exports) {

    var has = Object.prototype.hasOwnProperty
      , prefix = '~';

    /**
     * Constructor to create a storage for our `EE` objects.
     * An `Events` instance is a plain object whose properties are event names.
     *
     * @constructor
     * @api private
     */
    function Events() {}

    //
    // We try to not inherit from `Object.prototype`. In some engines creating an
    // instance in this way is faster than calling `Object.create(null)` directly.
    // If `Object.create(null)` is not supported we prefix the event names with a
    // character to make sure that the built-in object properties are not
    // overridden or used as an attack vector.
    //
    if (Object.create) {
      Events.prototype = Object.create(null);

      //
      // This hack is needed because the `__proto__` property is still inherited in
      // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
      //
      if (!new Events().__proto__) prefix = false;
    }

    /**
     * Representation of a single event listener.
     *
     * @param {Function} fn The listener function.
     * @param {Mixed} context The context to invoke the listener with.
     * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
     * @constructor
     * @api private
     */
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }

    /**
     * Minimal `EventEmitter` interface that is molded against the Node.js
     * `EventEmitter` interface.
     *
     * @constructor
     * @api public
     */
    function EventEmitter() {
      this._events = new Events();
      this._eventsCount = 0;
    }

    /**
     * Return an array listing the events for which the emitter has registered
     * listeners.
     *
     * @returns {Array}
     * @api public
     */
    EventEmitter.prototype.eventNames = function eventNames() {
      var names = []
        , events
        , name;

      if (this._eventsCount === 0) return names;

      for (name in (events = this._events)) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }

      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }

      return names;
    };

    /**
     * Return the listeners registered for a given event.
     *
     * @param {String|Symbol} event The event name.
     * @param {Boolean} exists Only check if there are listeners.
     * @returns {Array|Boolean}
     * @api public
     */
    EventEmitter.prototype.listeners = function listeners(event, exists) {
      var evt = prefix ? prefix + event : event
        , available = this._events[evt];

      if (exists) return !!available;
      if (!available) return [];
      if (available.fn) return [available.fn];

      for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
        ee[i] = available[i].fn;
      }

      return ee;
    };

    /**
     * Calls each of the listeners registered for a given event.
     *
     * @param {String|Symbol} event The event name.
     * @returns {Boolean} `true` if the event had listeners, else `false`.
     * @api public
     */
    EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;

      if (!this._events[evt]) return false;

      var listeners = this._events[evt]
        , len = arguments.length
        , args
        , i;

      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

        switch (len) {
          case 1: return listeners.fn.call(listeners.context), true;
          case 2: return listeners.fn.call(listeners.context, a1), true;
          case 3: return listeners.fn.call(listeners.context, a1, a2), true;
          case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }

        for (i = 1, args = new Array(len -1); i < len; i++) {
          args[i - 1] = arguments[i];
        }

        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length
          , j;

        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

          switch (len) {
            case 1: listeners[i].fn.call(listeners[i].context); break;
            case 2: listeners[i].fn.call(listeners[i].context, a1); break;
            case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
            case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
            default:
              if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
                args[j - 1] = arguments[j];
              }

              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }

      return true;
    };

    /**
     * Add a listener for a given event.
     *
     * @param {String|Symbol} event The event name.
     * @param {Function} fn The listener function.
     * @param {Mixed} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @api public
     */
    EventEmitter.prototype.on = function on(event, fn, context) {
      var listener = new EE(fn, context || this)
        , evt = prefix ? prefix + event : event;

      if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
      else if (!this._events[evt].fn) this._events[evt].push(listener);
      else this._events[evt] = [this._events[evt], listener];

      return this;
    };

    /**
     * Add a one-time listener for a given event.
     *
     * @param {String|Symbol} event The event name.
     * @param {Function} fn The listener function.
     * @param {Mixed} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @api public
     */
    EventEmitter.prototype.once = function once(event, fn, context) {
      var listener = new EE(fn, context || this, true)
        , evt = prefix ? prefix + event : event;

      if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
      else if (!this._events[evt].fn) this._events[evt].push(listener);
      else this._events[evt] = [this._events[evt], listener];

      return this;
    };

    /**
     * Remove the listeners of a given event.
     *
     * @param {String|Symbol} event The event name.
     * @param {Function} fn Only remove the listeners that match this function.
     * @param {Mixed} context Only remove the listeners that have this context.
     * @param {Boolean} once Only remove one-time listeners.
     * @returns {EventEmitter} `this`.
     * @api public
     */
    EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;

      if (!this._events[evt]) return this;
      if (!fn) {
        if (--this._eventsCount === 0) this._events = new Events();
        else delete this._events[evt];
        return this;
      }

      var listeners = this._events[evt];

      if (listeners.fn) {
        if (
             listeners.fn === fn
          && (!once || listeners.once)
          && (!context || listeners.context === context)
        ) {
          if (--this._eventsCount === 0) this._events = new Events();
          else delete this._events[evt];
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (
               listeners[i].fn !== fn
            || (once && !listeners[i].once)
            || (context && listeners[i].context !== context)
          ) {
            events.push(listeners[i]);
          }
        }

        //
        // Reset the array, or remove it completely if we have no more listeners.
        //
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else if (--this._eventsCount === 0) this._events = new Events();
        else delete this._events[evt];
      }

      return this;
    };

    /**
     * Remove all listeners, or those of the specified event.
     *
     * @param {String|Symbol} [event] The event name.
     * @returns {EventEmitter} `this`.
     * @api public
     */
    EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;

      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) {
          if (--this._eventsCount === 0) this._events = new Events();
          else delete this._events[evt];
        }
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }

      return this;
    };

    //
    // Alias methods names because people roll like that.
    //
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;

    //
    // This function doesn't apply anymore.
    //
    EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
      return this;
    };

    //
    // Expose the prefix.
    //
    EventEmitter.prefixed = prefix;

    //
    // Allow `EventEmitter` to be imported as module namespace.
    //
    EventEmitter.EventEmitter = EventEmitter;

    //
    // Expose the module.
    //
    if ('undefined' !== typeof module) {
      module.exports = EventEmitter;
    }


    /***/ }),
    /* 55 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.matchText = exports.matchSpacing = exports.matchNewline = exports.matchBlot = exports.matchAttributor = exports.default = undefined;

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _extend2 = __webpack_require__(3);

    var _extend3 = _interopRequireDefault(_extend2);

    var _quillDelta = __webpack_require__(2);

    var _quillDelta2 = _interopRequireDefault(_quillDelta);

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _quill = __webpack_require__(5);

    var _quill2 = _interopRequireDefault(_quill);

    var _logger = __webpack_require__(10);

    var _logger2 = _interopRequireDefault(_logger);

    var _module = __webpack_require__(9);

    var _module2 = _interopRequireDefault(_module);

    var _align = __webpack_require__(36);

    var _background = __webpack_require__(37);

    var _code = __webpack_require__(13);

    var _code2 = _interopRequireDefault(_code);

    var _color = __webpack_require__(26);

    var _direction = __webpack_require__(38);

    var _font = __webpack_require__(39);

    var _size = __webpack_require__(40);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var debug = (0, _logger2.default)('quill:clipboard');

    var DOM_KEY = '__ql-matcher';

    var CLIPBOARD_CONFIG = [[Node.TEXT_NODE, matchText], [Node.TEXT_NODE, matchNewline], ['br', matchBreak], [Node.ELEMENT_NODE, matchNewline], [Node.ELEMENT_NODE, matchBlot], [Node.ELEMENT_NODE, matchSpacing], [Node.ELEMENT_NODE, matchAttributor], [Node.ELEMENT_NODE, matchStyles], ['li', matchIndent], ['b', matchAlias.bind(matchAlias, 'bold')], ['i', matchAlias.bind(matchAlias, 'italic')], ['style', matchIgnore]];

    var ATTRIBUTE_ATTRIBUTORS = [_align.AlignAttribute, _direction.DirectionAttribute].reduce(function (memo, attr) {
      memo[attr.keyName] = attr;
      return memo;
    }, {});

    var STYLE_ATTRIBUTORS = [_align.AlignStyle, _background.BackgroundStyle, _color.ColorStyle, _direction.DirectionStyle, _font.FontStyle, _size.SizeStyle].reduce(function (memo, attr) {
      memo[attr.keyName] = attr;
      return memo;
    }, {});

    var Clipboard = function (_Module) {
      _inherits(Clipboard, _Module);

      function Clipboard(quill, options) {
        _classCallCheck(this, Clipboard);

        var _this = _possibleConstructorReturn(this, (Clipboard.__proto__ || Object.getPrototypeOf(Clipboard)).call(this, quill, options));

        _this.quill.root.addEventListener('paste', _this.onPaste.bind(_this));
        _this.container = _this.quill.addContainer('ql-clipboard');
        _this.container.setAttribute('contenteditable', true);
        _this.container.setAttribute('tabindex', -1);
        _this.matchers = [];
        CLIPBOARD_CONFIG.concat(_this.options.matchers).forEach(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
              selector = _ref2[0],
              matcher = _ref2[1];

          if (!options.matchVisual && matcher === matchSpacing) return;
          _this.addMatcher(selector, matcher);
        });
        return _this;
      }

      _createClass(Clipboard, [{
        key: 'addMatcher',
        value: function addMatcher(selector, matcher) {
          this.matchers.push([selector, matcher]);
        }
      }, {
        key: 'convert',
        value: function convert(html) {
          if (typeof html === 'string') {
            this.container.innerHTML = html.replace(/\>\r?\n +\</g, '><'); // Remove spaces between tags
            return this.convert();
          }
          var formats = this.quill.getFormat(this.quill.selection.savedRange.index);
          if (formats[_code2.default.blotName]) {
            var text = this.container.innerText;
            this.container.innerHTML = '';
            return new _quillDelta2.default().insert(text, _defineProperty({}, _code2.default.blotName, formats[_code2.default.blotName]));
          }

          var _prepareMatching = this.prepareMatching(),
              _prepareMatching2 = _slicedToArray(_prepareMatching, 2),
              elementMatchers = _prepareMatching2[0],
              textMatchers = _prepareMatching2[1];

          var delta = traverse(this.container, elementMatchers, textMatchers);
          // Remove trailing newline
          if (deltaEndsWith(delta, '\n') && delta.ops[delta.ops.length - 1].attributes == null) {
            delta = delta.compose(new _quillDelta2.default().retain(delta.length() - 1).delete(1));
          }
          debug.log('convert', this.container.innerHTML, delta);
          this.container.innerHTML = '';
          return delta;
        }
      }, {
        key: 'dangerouslyPasteHTML',
        value: function dangerouslyPasteHTML(index, html) {
          var source = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _quill2.default.sources.API;

          if (typeof index === 'string') {
            this.quill.setContents(this.convert(index), html);
            this.quill.setSelection(0, _quill2.default.sources.SILENT);
          } else {
            var paste = this.convert(html);
            this.quill.updateContents(new _quillDelta2.default().retain(index).concat(paste), source);
            this.quill.setSelection(index + paste.length(), _quill2.default.sources.SILENT);
          }
        }
      }, {
        key: 'onPaste',
        value: function onPaste(e) {
          var _this2 = this;

          if (e.defaultPrevented || !this.quill.isEnabled()) return;
          var range = this.quill.getSelection();
          var delta = new _quillDelta2.default().retain(range.index);
          var scrollTop = this.quill.scrollingContainer.scrollTop;
          this.container.focus();
          this.quill.selection.update(_quill2.default.sources.SILENT);
          setTimeout(function () {
            delta = delta.concat(_this2.convert()).delete(range.length);
            _this2.quill.updateContents(delta, _quill2.default.sources.USER);
            // range.length contributes to delta.length()
            _this2.quill.setSelection(delta.length() - range.length, _quill2.default.sources.SILENT);
            _this2.quill.scrollingContainer.scrollTop = scrollTop;
            _this2.quill.focus();
          }, 1);
        }
      }, {
        key: 'prepareMatching',
        value: function prepareMatching() {
          var _this3 = this;

          var elementMatchers = [],
              textMatchers = [];
          this.matchers.forEach(function (pair) {
            var _pair = _slicedToArray(pair, 2),
                selector = _pair[0],
                matcher = _pair[1];

            switch (selector) {
              case Node.TEXT_NODE:
                textMatchers.push(matcher);
                break;
              case Node.ELEMENT_NODE:
                elementMatchers.push(matcher);
                break;
              default:
                [].forEach.call(_this3.container.querySelectorAll(selector), function (node) {
                  // TODO use weakmap
                  node[DOM_KEY] = node[DOM_KEY] || [];
                  node[DOM_KEY].push(matcher);
                });
                break;
            }
          });
          return [elementMatchers, textMatchers];
        }
      }]);

      return Clipboard;
    }(_module2.default);

    Clipboard.DEFAULTS = {
      matchers: [],
      matchVisual: true
    };

    function applyFormat(delta, format, value) {
      if ((typeof format === 'undefined' ? 'undefined' : _typeof(format)) === 'object') {
        return Object.keys(format).reduce(function (delta, key) {
          return applyFormat(delta, key, format[key]);
        }, delta);
      } else {
        return delta.reduce(function (delta, op) {
          if (op.attributes && op.attributes[format]) {
            return delta.push(op);
          } else {
            return delta.insert(op.insert, (0, _extend3.default)({}, _defineProperty({}, format, value), op.attributes));
          }
        }, new _quillDelta2.default());
      }
    }

    function computeStyle(node) {
      if (node.nodeType !== Node.ELEMENT_NODE) return {};
      var DOM_KEY = '__ql-computed-style';
      return node[DOM_KEY] || (node[DOM_KEY] = window.getComputedStyle(node));
    }

    function deltaEndsWith(delta, text) {
      var endText = "";
      for (var i = delta.ops.length - 1; i >= 0 && endText.length < text.length; --i) {
        var op = delta.ops[i];
        if (typeof op.insert !== 'string') break;
        endText = op.insert + endText;
      }
      return endText.slice(-1 * text.length) === text;
    }

    function isLine(node) {
      if (node.childNodes.length === 0) return false; // Exclude embed blocks
      var style = computeStyle(node);
      return ['block', 'list-item'].indexOf(style.display) > -1;
    }

    function traverse(node, elementMatchers, textMatchers) {
      // Post-order
      if (node.nodeType === node.TEXT_NODE) {
        return textMatchers.reduce(function (delta, matcher) {
          return matcher(node, delta);
        }, new _quillDelta2.default());
      } else if (node.nodeType === node.ELEMENT_NODE) {
        return [].reduce.call(node.childNodes || [], function (delta, childNode) {
          var childrenDelta = traverse(childNode, elementMatchers, textMatchers);
          if (childNode.nodeType === node.ELEMENT_NODE) {
            childrenDelta = elementMatchers.reduce(function (childrenDelta, matcher) {
              return matcher(childNode, childrenDelta);
            }, childrenDelta);
            childrenDelta = (childNode[DOM_KEY] || []).reduce(function (childrenDelta, matcher) {
              return matcher(childNode, childrenDelta);
            }, childrenDelta);
          }
          return delta.concat(childrenDelta);
        }, new _quillDelta2.default());
      } else {
        return new _quillDelta2.default();
      }
    }

    function matchAlias(format, node, delta) {
      return applyFormat(delta, format, true);
    }

    function matchAttributor(node, delta) {
      var attributes = _parchment2.default.Attributor.Attribute.keys(node);
      var classes = _parchment2.default.Attributor.Class.keys(node);
      var styles = _parchment2.default.Attributor.Style.keys(node);
      var formats = {};
      attributes.concat(classes).concat(styles).forEach(function (name) {
        var attr = _parchment2.default.query(name, _parchment2.default.Scope.ATTRIBUTE);
        if (attr != null) {
          formats[attr.attrName] = attr.value(node);
          if (formats[attr.attrName]) return;
        }
        attr = ATTRIBUTE_ATTRIBUTORS[name];
        if (attr != null && (attr.attrName === name || attr.keyName === name)) {
          formats[attr.attrName] = attr.value(node) || undefined;
        }
        attr = STYLE_ATTRIBUTORS[name];
        if (attr != null && (attr.attrName === name || attr.keyName === name)) {
          attr = STYLE_ATTRIBUTORS[name];
          formats[attr.attrName] = attr.value(node) || undefined;
        }
      });
      if (Object.keys(formats).length > 0) {
        delta = applyFormat(delta, formats);
      }
      return delta;
    }

    function matchBlot(node, delta) {
      var match = _parchment2.default.query(node);
      if (match == null) return delta;
      if (match.prototype instanceof _parchment2.default.Embed) {
        var embed = {};
        var value = match.value(node);
        if (value != null) {
          embed[match.blotName] = value;
          delta = new _quillDelta2.default().insert(embed, match.formats(node));
        }
      } else if (typeof match.formats === 'function') {
        delta = applyFormat(delta, match.blotName, match.formats(node));
      }
      return delta;
    }

    function matchBreak(node, delta) {
      if (!deltaEndsWith(delta, '\n')) {
        delta.insert('\n');
      }
      return delta;
    }

    function matchIgnore() {
      return new _quillDelta2.default();
    }

    function matchIndent(node, delta) {
      var match = _parchment2.default.query(node);
      if (match == null || match.blotName !== 'list-item' || !deltaEndsWith(delta, '\n')) {
        return delta;
      }
      var indent = -1,
          parent = node.parentNode;
      while (!parent.classList.contains('ql-clipboard')) {
        if ((_parchment2.default.query(parent) || {}).blotName === 'list') {
          indent += 1;
        }
        parent = parent.parentNode;
      }
      if (indent <= 0) return delta;
      return delta.compose(new _quillDelta2.default().retain(delta.length() - 1).retain(1, { indent: indent }));
    }

    function matchNewline(node, delta) {
      if (!deltaEndsWith(delta, '\n')) {
        if (isLine(node) || delta.length() > 0 && node.nextSibling && isLine(node.nextSibling)) {
          delta.insert('\n');
        }
      }
      return delta;
    }

    function matchSpacing(node, delta) {
      if (isLine(node) && node.nextElementSibling != null && !deltaEndsWith(delta, '\n\n')) {
        var nodeHeight = node.offsetHeight + parseFloat(computeStyle(node).marginTop) + parseFloat(computeStyle(node).marginBottom);
        if (node.nextElementSibling.offsetTop > node.offsetTop + nodeHeight * 1.5) {
          delta.insert('\n');
        }
      }
      return delta;
    }

    function matchStyles(node, delta) {
      var formats = {};
      var style = node.style || {};
      if (style.fontStyle && computeStyle(node).fontStyle === 'italic') {
        formats.italic = true;
      }
      if (style.fontWeight && (computeStyle(node).fontWeight.startsWith('bold') || parseInt(computeStyle(node).fontWeight) >= 700)) {
        formats.bold = true;
      }
      if (Object.keys(formats).length > 0) {
        delta = applyFormat(delta, formats);
      }
      if (parseFloat(style.textIndent || 0) > 0) {
        // Could be 0.5in
        delta = new _quillDelta2.default().insert('\t').concat(delta);
      }
      return delta;
    }

    function matchText(node, delta) {
      var text = node.data;
      // Word represents empty line with <o:p>&nbsp;</o:p>
      if (node.parentNode.tagName === 'O:P') {
        return delta.insert(text.trim());
      }
      if (text.trim().length === 0 && node.parentNode.classList.contains('ql-clipboard')) {
        return delta;
      }
      if (!computeStyle(node.parentNode).whiteSpace.startsWith('pre')) {
        // eslint-disable-next-line func-style
        var replacer = function replacer(collapse, match) {
          match = match.replace(/[^\u00a0]/g, ''); // \u00a0 is nbsp;
          return match.length < 1 && collapse ? ' ' : match;
        };
        text = text.replace(/\r\n/g, ' ').replace(/\n/g, ' ');
        text = text.replace(/\s\s+/g, replacer.bind(replacer, true)); // collapse whitespace
        if (node.previousSibling == null && isLine(node.parentNode) || node.previousSibling != null && isLine(node.previousSibling)) {
          text = text.replace(/^\s+/, replacer.bind(replacer, false));
        }
        if (node.nextSibling == null && isLine(node.parentNode) || node.nextSibling != null && isLine(node.nextSibling)) {
          text = text.replace(/\s+$/, replacer.bind(replacer, false));
        }
      }
      return delta.insert(text);
    }

    exports.default = Clipboard;
    exports.matchAttributor = matchAttributor;
    exports.matchBlot = matchBlot;
    exports.matchNewline = matchNewline;
    exports.matchSpacing = matchSpacing;
    exports.matchText = matchText;

    /***/ }),
    /* 56 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _inline = __webpack_require__(6);

    var _inline2 = _interopRequireDefault(_inline);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Bold = function (_Inline) {
      _inherits(Bold, _Inline);

      function Bold() {
        _classCallCheck(this, Bold);

        return _possibleConstructorReturn(this, (Bold.__proto__ || Object.getPrototypeOf(Bold)).apply(this, arguments));
      }

      _createClass(Bold, [{
        key: 'optimize',
        value: function optimize(context) {
          _get(Bold.prototype.__proto__ || Object.getPrototypeOf(Bold.prototype), 'optimize', this).call(this, context);
          if (this.domNode.tagName !== this.statics.tagName[0]) {
            this.replaceWith(this.statics.blotName);
          }
        }
      }], [{
        key: 'create',
        value: function create() {
          return _get(Bold.__proto__ || Object.getPrototypeOf(Bold), 'create', this).call(this);
        }
      }, {
        key: 'formats',
        value: function formats() {
          return true;
        }
      }]);

      return Bold;
    }(_inline2.default);

    Bold.blotName = 'bold';
    Bold.tagName = ['STRONG', 'B'];

    exports.default = Bold;

    /***/ }),
    /* 57 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.addControls = exports.default = undefined;

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _quillDelta = __webpack_require__(2);

    var _quillDelta2 = _interopRequireDefault(_quillDelta);

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _quill = __webpack_require__(5);

    var _quill2 = _interopRequireDefault(_quill);

    var _logger = __webpack_require__(10);

    var _logger2 = _interopRequireDefault(_logger);

    var _module = __webpack_require__(9);

    var _module2 = _interopRequireDefault(_module);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var debug = (0, _logger2.default)('quill:toolbar');

    var Toolbar = function (_Module) {
      _inherits(Toolbar, _Module);

      function Toolbar(quill, options) {
        _classCallCheck(this, Toolbar);

        var _this = _possibleConstructorReturn(this, (Toolbar.__proto__ || Object.getPrototypeOf(Toolbar)).call(this, quill, options));

        if (Array.isArray(_this.options.container)) {
          var container = document.createElement('div');
          addControls(container, _this.options.container);
          quill.container.parentNode.insertBefore(container, quill.container);
          _this.container = container;
        } else if (typeof _this.options.container === 'string') {
          _this.container = document.querySelector(_this.options.container);
        } else {
          _this.container = _this.options.container;
        }
        if (!(_this.container instanceof HTMLElement)) {
          var _ret;

          return _ret = debug.error('Container required for toolbar', _this.options), _possibleConstructorReturn(_this, _ret);
        }
        _this.container.classList.add('ql-toolbar');
        _this.controls = [];
        _this.handlers = {};
        Object.keys(_this.options.handlers).forEach(function (format) {
          _this.addHandler(format, _this.options.handlers[format]);
        });
        [].forEach.call(_this.container.querySelectorAll('button, select'), function (input) {
          _this.attach(input);
        });
        _this.quill.on(_quill2.default.events.EDITOR_CHANGE, function (type, range) {
          if (type === _quill2.default.events.SELECTION_CHANGE) {
            _this.update(range);
          }
        });
        _this.quill.on(_quill2.default.events.SCROLL_OPTIMIZE, function () {
          var _this$quill$selection = _this.quill.selection.getRange(),
              _this$quill$selection2 = _slicedToArray(_this$quill$selection, 1),
              range = _this$quill$selection2[0]; // quill.getSelection triggers update


          _this.update(range);
        });
        return _this;
      }

      _createClass(Toolbar, [{
        key: 'addHandler',
        value: function addHandler(format, handler) {
          this.handlers[format] = handler;
        }
      }, {
        key: 'attach',
        value: function attach(input) {
          var _this2 = this;

          var format = [].find.call(input.classList, function (className) {
            return className.indexOf('ql-') === 0;
          });
          if (!format) return;
          format = format.slice('ql-'.length);
          if (input.tagName === 'BUTTON') {
            input.setAttribute('type', 'button');
          }
          if (this.handlers[format] == null) {
            if (this.quill.scroll.whitelist != null && this.quill.scroll.whitelist[format] == null) {
              debug.warn('ignoring attaching to disabled format', format, input);
              return;
            }
            if (_parchment2.default.query(format) == null) {
              debug.warn('ignoring attaching to nonexistent format', format, input);
              return;
            }
          }
          var eventName = input.tagName === 'SELECT' ? 'change' : 'click';
          input.addEventListener(eventName, function (e) {
            var value = void 0;
            if (input.tagName === 'SELECT') {
              if (input.selectedIndex < 0) return;
              var selected = input.options[input.selectedIndex];
              if (selected.hasAttribute('selected')) {
                value = false;
              } else {
                value = selected.value || false;
              }
            } else {
              if (input.classList.contains('ql-active')) {
                value = false;
              } else {
                value = input.value || !input.hasAttribute('value');
              }
              e.preventDefault();
            }
            _this2.quill.focus();

            var _quill$selection$getR = _this2.quill.selection.getRange(),
                _quill$selection$getR2 = _slicedToArray(_quill$selection$getR, 1),
                range = _quill$selection$getR2[0];

            if (_this2.handlers[format] != null) {
              _this2.handlers[format].call(_this2, value);
            } else if (_parchment2.default.query(format).prototype instanceof _parchment2.default.Embed) {
              value = prompt('Enter ' + format);
              if (!value) return;
              _this2.quill.updateContents(new _quillDelta2.default().retain(range.index).delete(range.length).insert(_defineProperty({}, format, value)), _quill2.default.sources.USER);
            } else {
              _this2.quill.format(format, value, _quill2.default.sources.USER);
            }
            _this2.update(range);
          });
          // TODO use weakmap
          this.controls.push([format, input]);
        }
      }, {
        key: 'update',
        value: function update(range) {
          var formats = range == null ? {} : this.quill.getFormat(range);
          this.controls.forEach(function (pair) {
            var _pair = _slicedToArray(pair, 2),
                format = _pair[0],
                input = _pair[1];

            if (input.tagName === 'SELECT') {
              var option = void 0;
              if (range == null) {
                option = null;
              } else if (formats[format] == null) {
                option = input.querySelector('option[selected]');
              } else if (!Array.isArray(formats[format])) {
                var value = formats[format];
                if (typeof value === 'string') {
                  value = value.replace(/\"/g, '\\"');
                }
                option = input.querySelector('option[value="' + value + '"]');
              }
              if (option == null) {
                input.value = ''; // TODO make configurable?
                input.selectedIndex = -1;
              } else {
                option.selected = true;
              }
            } else {
              if (range == null) {
                input.classList.remove('ql-active');
              } else if (input.hasAttribute('value')) {
                // both being null should match (default values)
                // '1' should match with 1 (headers)
                var isActive = formats[format] === input.getAttribute('value') || formats[format] != null && formats[format].toString() === input.getAttribute('value') || formats[format] == null && !input.getAttribute('value');
                input.classList.toggle('ql-active', isActive);
              } else {
                input.classList.toggle('ql-active', formats[format] != null);
              }
            }
          });
        }
      }]);

      return Toolbar;
    }(_module2.default);

    Toolbar.DEFAULTS = {};

    function addButton(container, format, value) {
      var input = document.createElement('button');
      input.setAttribute('type', 'button');
      input.classList.add('ql-' + format);
      if (value != null) {
        input.value = value;
      }
      container.appendChild(input);
    }

    function addControls(container, groups) {
      if (!Array.isArray(groups[0])) {
        groups = [groups];
      }
      groups.forEach(function (controls) {
        var group = document.createElement('span');
        group.classList.add('ql-formats');
        controls.forEach(function (control) {
          if (typeof control === 'string') {
            addButton(group, control);
          } else {
            var format = Object.keys(control)[0];
            var value = control[format];
            if (Array.isArray(value)) {
              addSelect(group, format, value);
            } else {
              addButton(group, format, value);
            }
          }
        });
        container.appendChild(group);
      });
    }

    function addSelect(container, format, values) {
      var input = document.createElement('select');
      input.classList.add('ql-' + format);
      values.forEach(function (value) {
        var option = document.createElement('option');
        if (value !== false) {
          option.setAttribute('value', value);
        } else {
          option.setAttribute('selected', 'selected');
        }
        input.appendChild(option);
      });
      container.appendChild(input);
    }

    Toolbar.DEFAULTS = {
      container: null,
      handlers: {
        clean: function clean() {
          var _this3 = this;

          var range = this.quill.getSelection();
          if (range == null) return;
          if (range.length == 0) {
            var formats = this.quill.getFormat();
            Object.keys(formats).forEach(function (name) {
              // Clean functionality in existing apps only clean inline formats
              if (_parchment2.default.query(name, _parchment2.default.Scope.INLINE) != null) {
                _this3.quill.format(name, false);
              }
            });
          } else {
            this.quill.removeFormat(range, _quill2.default.sources.USER);
          }
        },
        direction: function direction(value) {
          var align = this.quill.getFormat()['align'];
          if (value === 'rtl' && align == null) {
            this.quill.format('align', 'right', _quill2.default.sources.USER);
          } else if (!value && align === 'right') {
            this.quill.format('align', false, _quill2.default.sources.USER);
          }
          this.quill.format('direction', value, _quill2.default.sources.USER);
        },
        indent: function indent(value) {
          var range = this.quill.getSelection();
          var formats = this.quill.getFormat(range);
          var indent = parseInt(formats.indent || 0);
          if (value === '+1' || value === '-1') {
            var modifier = value === '+1' ? 1 : -1;
            if (formats.direction === 'rtl') modifier *= -1;
            this.quill.format('indent', indent + modifier, _quill2.default.sources.USER);
          }
        },
        link: function link(value) {
          if (value === true) {
            value = prompt('Enter link URL:');
          }
          this.quill.format('link', value, _quill2.default.sources.USER);
        },
        list: function list(value) {
          var range = this.quill.getSelection();
          var formats = this.quill.getFormat(range);
          if (value === 'check') {
            if (formats['list'] === 'checked' || formats['list'] === 'unchecked') {
              this.quill.format('list', false, _quill2.default.sources.USER);
            } else {
              this.quill.format('list', 'unchecked', _quill2.default.sources.USER);
            }
          } else {
            this.quill.format('list', value, _quill2.default.sources.USER);
          }
        }
      }
    };

    exports.default = Toolbar;
    exports.addControls = addControls;

    /***/ }),
    /* 58 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <polyline class=\"ql-even ql-stroke\" points=\"5 7 3 9 5 11\"></polyline> <polyline class=\"ql-even ql-stroke\" points=\"13 7 15 9 13 11\"></polyline> <line class=ql-stroke x1=10 x2=8 y1=5 y2=13></line> </svg>";

    /***/ }),
    /* 59 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _picker = __webpack_require__(28);

    var _picker2 = _interopRequireDefault(_picker);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var ColorPicker = function (_Picker) {
      _inherits(ColorPicker, _Picker);

      function ColorPicker(select, label) {
        _classCallCheck(this, ColorPicker);

        var _this = _possibleConstructorReturn(this, (ColorPicker.__proto__ || Object.getPrototypeOf(ColorPicker)).call(this, select));

        _this.label.innerHTML = label;
        _this.container.classList.add('ql-color-picker');
        [].slice.call(_this.container.querySelectorAll('.ql-picker-item'), 0, 7).forEach(function (item) {
          item.classList.add('ql-primary');
        });
        return _this;
      }

      _createClass(ColorPicker, [{
        key: 'buildItem',
        value: function buildItem(option) {
          var item = _get(ColorPicker.prototype.__proto__ || Object.getPrototypeOf(ColorPicker.prototype), 'buildItem', this).call(this, option);
          item.style.backgroundColor = option.getAttribute('value') || '';
          return item;
        }
      }, {
        key: 'selectItem',
        value: function selectItem(item, trigger) {
          _get(ColorPicker.prototype.__proto__ || Object.getPrototypeOf(ColorPicker.prototype), 'selectItem', this).call(this, item, trigger);
          var colorLabel = this.label.querySelector('.ql-color-label');
          var value = item ? item.getAttribute('data-value') || '' : '';
          if (colorLabel) {
            if (colorLabel.tagName === 'line') {
              colorLabel.style.stroke = value;
            } else {
              colorLabel.style.fill = value;
            }
          }
        }
      }]);

      return ColorPicker;
    }(_picker2.default);

    exports.default = ColorPicker;

    /***/ }),
    /* 60 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _picker = __webpack_require__(28);

    var _picker2 = _interopRequireDefault(_picker);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var IconPicker = function (_Picker) {
      _inherits(IconPicker, _Picker);

      function IconPicker(select, icons) {
        _classCallCheck(this, IconPicker);

        var _this = _possibleConstructorReturn(this, (IconPicker.__proto__ || Object.getPrototypeOf(IconPicker)).call(this, select));

        _this.container.classList.add('ql-icon-picker');
        [].forEach.call(_this.container.querySelectorAll('.ql-picker-item'), function (item) {
          item.innerHTML = icons[item.getAttribute('data-value') || ''];
        });
        _this.defaultItem = _this.container.querySelector('.ql-selected');
        _this.selectItem(_this.defaultItem);
        return _this;
      }

      _createClass(IconPicker, [{
        key: 'selectItem',
        value: function selectItem(item, trigger) {
          _get(IconPicker.prototype.__proto__ || Object.getPrototypeOf(IconPicker.prototype), 'selectItem', this).call(this, item, trigger);
          item = item || this.defaultItem;
          this.label.innerHTML = item.innerHTML;
        }
      }]);

      return IconPicker;
    }(_picker2.default);

    exports.default = IconPicker;

    /***/ }),
    /* 61 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var Tooltip = function () {
      function Tooltip(quill, boundsContainer) {
        var _this = this;

        _classCallCheck(this, Tooltip);

        this.quill = quill;
        this.boundsContainer = boundsContainer || document.body;
        this.root = quill.addContainer('ql-tooltip');
        this.root.innerHTML = this.constructor.TEMPLATE;
        if (this.quill.root === this.quill.scrollingContainer) {
          this.quill.root.addEventListener('scroll', function () {
            _this.root.style.marginTop = -1 * _this.quill.root.scrollTop + 'px';
          });
        }
        this.hide();
      }

      _createClass(Tooltip, [{
        key: 'hide',
        value: function hide() {
          this.root.classList.add('ql-hidden');
        }
      }, {
        key: 'position',
        value: function position(reference) {
          var left = reference.left + reference.width / 2 - this.root.offsetWidth / 2;
          // root.scrollTop should be 0 if scrollContainer !== root
          var top = reference.bottom + this.quill.root.scrollTop;
          this.root.style.left = left + 'px';
          this.root.style.top = top + 'px';
          this.root.classList.remove('ql-flip');
          var containerBounds = this.boundsContainer.getBoundingClientRect();
          var rootBounds = this.root.getBoundingClientRect();
          var shift = 0;
          if (rootBounds.right > containerBounds.right) {
            shift = containerBounds.right - rootBounds.right;
            this.root.style.left = left + shift + 'px';
          }
          if (rootBounds.left < containerBounds.left) {
            shift = containerBounds.left - rootBounds.left;
            this.root.style.left = left + shift + 'px';
          }
          if (rootBounds.bottom > containerBounds.bottom) {
            var height = rootBounds.bottom - rootBounds.top;
            var verticalShift = reference.bottom - reference.top + height;
            this.root.style.top = top - verticalShift + 'px';
            this.root.classList.add('ql-flip');
          }
          return shift;
        }
      }, {
        key: 'show',
        value: function show() {
          this.root.classList.remove('ql-editing');
          this.root.classList.remove('ql-hidden');
        }
      }]);

      return Tooltip;
    }();

    exports.default = Tooltip;

    /***/ }),
    /* 62 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _extend = __webpack_require__(3);

    var _extend2 = _interopRequireDefault(_extend);

    var _emitter = __webpack_require__(8);

    var _emitter2 = _interopRequireDefault(_emitter);

    var _base = __webpack_require__(43);

    var _base2 = _interopRequireDefault(_base);

    var _link = __webpack_require__(27);

    var _link2 = _interopRequireDefault(_link);

    var _selection = __webpack_require__(15);

    var _icons = __webpack_require__(41);

    var _icons2 = _interopRequireDefault(_icons);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var TOOLBAR_CONFIG = [[{ header: ['1', '2', '3', false] }], ['bold', 'italic', 'underline', 'link'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']];

    var SnowTheme = function (_BaseTheme) {
      _inherits(SnowTheme, _BaseTheme);

      function SnowTheme(quill, options) {
        _classCallCheck(this, SnowTheme);

        if (options.modules.toolbar != null && options.modules.toolbar.container == null) {
          options.modules.toolbar.container = TOOLBAR_CONFIG;
        }

        var _this = _possibleConstructorReturn(this, (SnowTheme.__proto__ || Object.getPrototypeOf(SnowTheme)).call(this, quill, options));

        _this.quill.container.classList.add('ql-snow');
        return _this;
      }

      _createClass(SnowTheme, [{
        key: 'extendToolbar',
        value: function extendToolbar(toolbar) {
          toolbar.container.classList.add('ql-snow');
          this.buildButtons([].slice.call(toolbar.container.querySelectorAll('button')), _icons2.default);
          this.buildPickers([].slice.call(toolbar.container.querySelectorAll('select')), _icons2.default);
          this.tooltip = new SnowTooltip(this.quill, this.options.bounds);
          if (toolbar.container.querySelector('.ql-link')) {
            this.quill.keyboard.addBinding({ key: 'K', shortKey: true }, function (range, context) {
              toolbar.handlers['link'].call(toolbar, !context.format.link);
            });
          }
        }
      }]);

      return SnowTheme;
    }(_base2.default);

    SnowTheme.DEFAULTS = (0, _extend2.default)(true, {}, _base2.default.DEFAULTS, {
      modules: {
        toolbar: {
          handlers: {
            link: function link(value) {
              if (value) {
                var range = this.quill.getSelection();
                if (range == null || range.length == 0) return;
                var preview = this.quill.getText(range);
                if (/^\S+@\S+\.\S+$/.test(preview) && preview.indexOf('mailto:') !== 0) {
                  preview = 'mailto:' + preview;
                }
                var tooltip = this.quill.theme.tooltip;
                tooltip.edit('link', preview);
              } else {
                this.quill.format('link', false);
              }
            }
          }
        }
      }
    });

    var SnowTooltip = function (_BaseTooltip) {
      _inherits(SnowTooltip, _BaseTooltip);

      function SnowTooltip(quill, bounds) {
        _classCallCheck(this, SnowTooltip);

        var _this2 = _possibleConstructorReturn(this, (SnowTooltip.__proto__ || Object.getPrototypeOf(SnowTooltip)).call(this, quill, bounds));

        _this2.preview = _this2.root.querySelector('a.ql-preview');
        return _this2;
      }

      _createClass(SnowTooltip, [{
        key: 'listen',
        value: function listen() {
          var _this3 = this;

          _get(SnowTooltip.prototype.__proto__ || Object.getPrototypeOf(SnowTooltip.prototype), 'listen', this).call(this);
          this.root.querySelector('a.ql-action').addEventListener('click', function (event) {
            if (_this3.root.classList.contains('ql-editing')) {
              _this3.save();
            } else {
              _this3.edit('link', _this3.preview.textContent);
            }
            event.preventDefault();
          });
          this.root.querySelector('a.ql-remove').addEventListener('click', function (event) {
            if (_this3.linkRange != null) {
              var range = _this3.linkRange;
              _this3.restoreFocus();
              _this3.quill.formatText(range, 'link', false, _emitter2.default.sources.USER);
              delete _this3.linkRange;
            }
            event.preventDefault();
            _this3.hide();
          });
          this.quill.on(_emitter2.default.events.SELECTION_CHANGE, function (range, oldRange, source) {
            if (range == null) return;
            if (range.length === 0 && source === _emitter2.default.sources.USER) {
              var _quill$scroll$descend = _this3.quill.scroll.descendant(_link2.default, range.index),
                  _quill$scroll$descend2 = _slicedToArray(_quill$scroll$descend, 2),
                  link = _quill$scroll$descend2[0],
                  offset = _quill$scroll$descend2[1];

              if (link != null) {
                _this3.linkRange = new _selection.Range(range.index - offset, link.length());
                var preview = _link2.default.formats(link.domNode);
                _this3.preview.textContent = preview;
                _this3.preview.setAttribute('href', preview);
                _this3.show();
                _this3.position(_this3.quill.getBounds(_this3.linkRange));
                return;
              }
            } else {
              delete _this3.linkRange;
            }
            _this3.hide();
          });
        }
      }, {
        key: 'show',
        value: function show() {
          _get(SnowTooltip.prototype.__proto__ || Object.getPrototypeOf(SnowTooltip.prototype), 'show', this).call(this);
          this.root.removeAttribute('data-mode');
        }
      }]);

      return SnowTooltip;
    }(_base.BaseTooltip);

    SnowTooltip.TEMPLATE = ['<a class="ql-preview" rel="noopener noreferrer" target="_blank" href="about:blank"></a>', '<input type="text" data-formula="e=mc^2" data-link="https://quilljs.com" data-video="Embed URL">', '<a class="ql-action"></a>', '<a class="ql-remove"></a>'].join('');

    exports.default = SnowTheme;

    /***/ }),
    /* 63 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _core = __webpack_require__(29);

    var _core2 = _interopRequireDefault(_core);

    var _align = __webpack_require__(36);

    var _direction = __webpack_require__(38);

    var _indent = __webpack_require__(64);

    var _blockquote = __webpack_require__(65);

    var _blockquote2 = _interopRequireDefault(_blockquote);

    var _header = __webpack_require__(66);

    var _header2 = _interopRequireDefault(_header);

    var _list = __webpack_require__(67);

    var _list2 = _interopRequireDefault(_list);

    var _background = __webpack_require__(37);

    var _color = __webpack_require__(26);

    var _font = __webpack_require__(39);

    var _size = __webpack_require__(40);

    var _bold = __webpack_require__(56);

    var _bold2 = _interopRequireDefault(_bold);

    var _italic = __webpack_require__(68);

    var _italic2 = _interopRequireDefault(_italic);

    var _link = __webpack_require__(27);

    var _link2 = _interopRequireDefault(_link);

    var _script = __webpack_require__(69);

    var _script2 = _interopRequireDefault(_script);

    var _strike = __webpack_require__(70);

    var _strike2 = _interopRequireDefault(_strike);

    var _underline = __webpack_require__(71);

    var _underline2 = _interopRequireDefault(_underline);

    var _image = __webpack_require__(72);

    var _image2 = _interopRequireDefault(_image);

    var _video = __webpack_require__(73);

    var _video2 = _interopRequireDefault(_video);

    var _code = __webpack_require__(13);

    var _code2 = _interopRequireDefault(_code);

    var _formula = __webpack_require__(74);

    var _formula2 = _interopRequireDefault(_formula);

    var _syntax = __webpack_require__(75);

    var _syntax2 = _interopRequireDefault(_syntax);

    var _toolbar = __webpack_require__(57);

    var _toolbar2 = _interopRequireDefault(_toolbar);

    var _icons = __webpack_require__(41);

    var _icons2 = _interopRequireDefault(_icons);

    var _picker = __webpack_require__(28);

    var _picker2 = _interopRequireDefault(_picker);

    var _colorPicker = __webpack_require__(59);

    var _colorPicker2 = _interopRequireDefault(_colorPicker);

    var _iconPicker = __webpack_require__(60);

    var _iconPicker2 = _interopRequireDefault(_iconPicker);

    var _tooltip = __webpack_require__(61);

    var _tooltip2 = _interopRequireDefault(_tooltip);

    var _bubble = __webpack_require__(108);

    var _bubble2 = _interopRequireDefault(_bubble);

    var _snow = __webpack_require__(62);

    var _snow2 = _interopRequireDefault(_snow);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    _core2.default.register({
      'attributors/attribute/direction': _direction.DirectionAttribute,

      'attributors/class/align': _align.AlignClass,
      'attributors/class/background': _background.BackgroundClass,
      'attributors/class/color': _color.ColorClass,
      'attributors/class/direction': _direction.DirectionClass,
      'attributors/class/font': _font.FontClass,
      'attributors/class/size': _size.SizeClass,

      'attributors/style/align': _align.AlignStyle,
      'attributors/style/background': _background.BackgroundStyle,
      'attributors/style/color': _color.ColorStyle,
      'attributors/style/direction': _direction.DirectionStyle,
      'attributors/style/font': _font.FontStyle,
      'attributors/style/size': _size.SizeStyle
    }, true);

    _core2.default.register({
      'formats/align': _align.AlignClass,
      'formats/direction': _direction.DirectionClass,
      'formats/indent': _indent.IndentClass,

      'formats/background': _background.BackgroundStyle,
      'formats/color': _color.ColorStyle,
      'formats/font': _font.FontClass,
      'formats/size': _size.SizeClass,

      'formats/blockquote': _blockquote2.default,
      'formats/code-block': _code2.default,
      'formats/header': _header2.default,
      'formats/list': _list2.default,

      'formats/bold': _bold2.default,
      'formats/code': _code.Code,
      'formats/italic': _italic2.default,
      'formats/link': _link2.default,
      'formats/script': _script2.default,
      'formats/strike': _strike2.default,
      'formats/underline': _underline2.default,

      'formats/image': _image2.default,
      'formats/video': _video2.default,

      'formats/list/item': _list.ListItem,

      'modules/formula': _formula2.default,
      'modules/syntax': _syntax2.default,
      'modules/toolbar': _toolbar2.default,

      'themes/bubble': _bubble2.default,
      'themes/snow': _snow2.default,

      'ui/icons': _icons2.default,
      'ui/picker': _picker2.default,
      'ui/icon-picker': _iconPicker2.default,
      'ui/color-picker': _colorPicker2.default,
      'ui/tooltip': _tooltip2.default
    }, true);

    exports.default = _core2.default;

    /***/ }),
    /* 64 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.IndentClass = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var IdentAttributor = function (_Parchment$Attributor) {
      _inherits(IdentAttributor, _Parchment$Attributor);

      function IdentAttributor() {
        _classCallCheck(this, IdentAttributor);

        return _possibleConstructorReturn(this, (IdentAttributor.__proto__ || Object.getPrototypeOf(IdentAttributor)).apply(this, arguments));
      }

      _createClass(IdentAttributor, [{
        key: 'add',
        value: function add(node, value) {
          if (value === '+1' || value === '-1') {
            var indent = this.value(node) || 0;
            value = value === '+1' ? indent + 1 : indent - 1;
          }
          if (value === 0) {
            this.remove(node);
            return true;
          } else {
            return _get(IdentAttributor.prototype.__proto__ || Object.getPrototypeOf(IdentAttributor.prototype), 'add', this).call(this, node, value);
          }
        }
      }, {
        key: 'canAdd',
        value: function canAdd(node, value) {
          return _get(IdentAttributor.prototype.__proto__ || Object.getPrototypeOf(IdentAttributor.prototype), 'canAdd', this).call(this, node, value) || _get(IdentAttributor.prototype.__proto__ || Object.getPrototypeOf(IdentAttributor.prototype), 'canAdd', this).call(this, node, parseInt(value));
        }
      }, {
        key: 'value',
        value: function value(node) {
          return parseInt(_get(IdentAttributor.prototype.__proto__ || Object.getPrototypeOf(IdentAttributor.prototype), 'value', this).call(this, node)) || undefined; // Don't return NaN
        }
      }]);

      return IdentAttributor;
    }(_parchment2.default.Attributor.Class);

    var IndentClass = new IdentAttributor('indent', 'ql-indent', {
      scope: _parchment2.default.Scope.BLOCK,
      whitelist: [1, 2, 3, 4, 5, 6, 7, 8]
    });

    exports.IndentClass = IndentClass;

    /***/ }),
    /* 65 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _block = __webpack_require__(4);

    var _block2 = _interopRequireDefault(_block);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Blockquote = function (_Block) {
      _inherits(Blockquote, _Block);

      function Blockquote() {
        _classCallCheck(this, Blockquote);

        return _possibleConstructorReturn(this, (Blockquote.__proto__ || Object.getPrototypeOf(Blockquote)).apply(this, arguments));
      }

      return Blockquote;
    }(_block2.default);

    Blockquote.blotName = 'blockquote';
    Blockquote.tagName = 'blockquote';

    exports.default = Blockquote;

    /***/ }),
    /* 66 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _block = __webpack_require__(4);

    var _block2 = _interopRequireDefault(_block);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Header = function (_Block) {
      _inherits(Header, _Block);

      function Header() {
        _classCallCheck(this, Header);

        return _possibleConstructorReturn(this, (Header.__proto__ || Object.getPrototypeOf(Header)).apply(this, arguments));
      }

      _createClass(Header, null, [{
        key: 'formats',
        value: function formats(domNode) {
          return this.tagName.indexOf(domNode.tagName) + 1;
        }
      }]);

      return Header;
    }(_block2.default);

    Header.blotName = 'header';
    Header.tagName = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

    exports.default = Header;

    /***/ }),
    /* 67 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.ListItem = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _block = __webpack_require__(4);

    var _block2 = _interopRequireDefault(_block);

    var _container = __webpack_require__(25);

    var _container2 = _interopRequireDefault(_container);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var ListItem = function (_Block) {
      _inherits(ListItem, _Block);

      function ListItem() {
        _classCallCheck(this, ListItem);

        return _possibleConstructorReturn(this, (ListItem.__proto__ || Object.getPrototypeOf(ListItem)).apply(this, arguments));
      }

      _createClass(ListItem, [{
        key: 'format',
        value: function format(name, value) {
          if (name === List.blotName && !value) {
            this.replaceWith(_parchment2.default.create(this.statics.scope));
          } else {
            _get(ListItem.prototype.__proto__ || Object.getPrototypeOf(ListItem.prototype), 'format', this).call(this, name, value);
          }
        }
      }, {
        key: 'remove',
        value: function remove() {
          if (this.prev == null && this.next == null) {
            this.parent.remove();
          } else {
            _get(ListItem.prototype.__proto__ || Object.getPrototypeOf(ListItem.prototype), 'remove', this).call(this);
          }
        }
      }, {
        key: 'replaceWith',
        value: function replaceWith(name, value) {
          this.parent.isolate(this.offset(this.parent), this.length());
          if (name === this.parent.statics.blotName) {
            this.parent.replaceWith(name, value);
            return this;
          } else {
            this.parent.unwrap();
            return _get(ListItem.prototype.__proto__ || Object.getPrototypeOf(ListItem.prototype), 'replaceWith', this).call(this, name, value);
          }
        }
      }], [{
        key: 'formats',
        value: function formats(domNode) {
          return domNode.tagName === this.tagName ? undefined : _get(ListItem.__proto__ || Object.getPrototypeOf(ListItem), 'formats', this).call(this, domNode);
        }
      }]);

      return ListItem;
    }(_block2.default);

    ListItem.blotName = 'list-item';
    ListItem.tagName = 'LI';

    var List = function (_Container) {
      _inherits(List, _Container);

      _createClass(List, null, [{
        key: 'create',
        value: function create(value) {
          var tagName = value === 'ordered' ? 'OL' : 'UL';
          var node = _get(List.__proto__ || Object.getPrototypeOf(List), 'create', this).call(this, tagName);
          if (value === 'checked' || value === 'unchecked') {
            node.setAttribute('data-checked', value === 'checked');
          }
          return node;
        }
      }, {
        key: 'formats',
        value: function formats(domNode) {
          if (domNode.tagName === 'OL') return 'ordered';
          if (domNode.tagName === 'UL') {
            if (domNode.hasAttribute('data-checked')) {
              return domNode.getAttribute('data-checked') === 'true' ? 'checked' : 'unchecked';
            } else {
              return 'bullet';
            }
          }
          return undefined;
        }
      }]);

      function List(domNode) {
        _classCallCheck(this, List);

        var _this2 = _possibleConstructorReturn(this, (List.__proto__ || Object.getPrototypeOf(List)).call(this, domNode));

        var listEventHandler = function listEventHandler(e) {
          if (e.target.parentNode !== domNode) return;
          var format = _this2.statics.formats(domNode);
          var blot = _parchment2.default.find(e.target);
          if (format === 'checked') {
            blot.format('list', 'unchecked');
          } else if (format === 'unchecked') {
            blot.format('list', 'checked');
          }
        };

        domNode.addEventListener('touchstart', listEventHandler);
        domNode.addEventListener('mousedown', listEventHandler);
        return _this2;
      }

      _createClass(List, [{
        key: 'format',
        value: function format(name, value) {
          if (this.children.length > 0) {
            this.children.tail.format(name, value);
          }
        }
      }, {
        key: 'formats',
        value: function formats() {
          // We don't inherit from FormatBlot
          return _defineProperty({}, this.statics.blotName, this.statics.formats(this.domNode));
        }
      }, {
        key: 'insertBefore',
        value: function insertBefore(blot, ref) {
          if (blot instanceof ListItem) {
            _get(List.prototype.__proto__ || Object.getPrototypeOf(List.prototype), 'insertBefore', this).call(this, blot, ref);
          } else {
            var index = ref == null ? this.length() : ref.offset(this);
            var after = this.split(index);
            after.parent.insertBefore(blot, after);
          }
        }
      }, {
        key: 'optimize',
        value: function optimize(context) {
          _get(List.prototype.__proto__ || Object.getPrototypeOf(List.prototype), 'optimize', this).call(this, context);
          var next = this.next;
          if (next != null && next.prev === this && next.statics.blotName === this.statics.blotName && next.domNode.tagName === this.domNode.tagName && next.domNode.getAttribute('data-checked') === this.domNode.getAttribute('data-checked')) {
            next.moveChildren(this);
            next.remove();
          }
        }
      }, {
        key: 'replace',
        value: function replace(target) {
          if (target.statics.blotName !== this.statics.blotName) {
            var item = _parchment2.default.create(this.statics.defaultChild);
            target.moveChildren(item);
            this.appendChild(item);
          }
          _get(List.prototype.__proto__ || Object.getPrototypeOf(List.prototype), 'replace', this).call(this, target);
        }
      }]);

      return List;
    }(_container2.default);

    List.blotName = 'list';
    List.scope = _parchment2.default.Scope.BLOCK_BLOT;
    List.tagName = ['OL', 'UL'];
    List.defaultChild = 'list-item';
    List.allowedChildren = [ListItem];

    exports.ListItem = ListItem;
    exports.default = List;

    /***/ }),
    /* 68 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _bold = __webpack_require__(56);

    var _bold2 = _interopRequireDefault(_bold);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Italic = function (_Bold) {
      _inherits(Italic, _Bold);

      function Italic() {
        _classCallCheck(this, Italic);

        return _possibleConstructorReturn(this, (Italic.__proto__ || Object.getPrototypeOf(Italic)).apply(this, arguments));
      }

      return Italic;
    }(_bold2.default);

    Italic.blotName = 'italic';
    Italic.tagName = ['EM', 'I'];

    exports.default = Italic;

    /***/ }),
    /* 69 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _inline = __webpack_require__(6);

    var _inline2 = _interopRequireDefault(_inline);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Script = function (_Inline) {
      _inherits(Script, _Inline);

      function Script() {
        _classCallCheck(this, Script);

        return _possibleConstructorReturn(this, (Script.__proto__ || Object.getPrototypeOf(Script)).apply(this, arguments));
      }

      _createClass(Script, null, [{
        key: 'create',
        value: function create(value) {
          if (value === 'super') {
            return document.createElement('sup');
          } else if (value === 'sub') {
            return document.createElement('sub');
          } else {
            return _get(Script.__proto__ || Object.getPrototypeOf(Script), 'create', this).call(this, value);
          }
        }
      }, {
        key: 'formats',
        value: function formats(domNode) {
          if (domNode.tagName === 'SUB') return 'sub';
          if (domNode.tagName === 'SUP') return 'super';
          return undefined;
        }
      }]);

      return Script;
    }(_inline2.default);

    Script.blotName = 'script';
    Script.tagName = ['SUB', 'SUP'];

    exports.default = Script;

    /***/ }),
    /* 70 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _inline = __webpack_require__(6);

    var _inline2 = _interopRequireDefault(_inline);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Strike = function (_Inline) {
      _inherits(Strike, _Inline);

      function Strike() {
        _classCallCheck(this, Strike);

        return _possibleConstructorReturn(this, (Strike.__proto__ || Object.getPrototypeOf(Strike)).apply(this, arguments));
      }

      return Strike;
    }(_inline2.default);

    Strike.blotName = 'strike';
    Strike.tagName = 'S';

    exports.default = Strike;

    /***/ }),
    /* 71 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _inline = __webpack_require__(6);

    var _inline2 = _interopRequireDefault(_inline);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Underline = function (_Inline) {
      _inherits(Underline, _Inline);

      function Underline() {
        _classCallCheck(this, Underline);

        return _possibleConstructorReturn(this, (Underline.__proto__ || Object.getPrototypeOf(Underline)).apply(this, arguments));
      }

      return Underline;
    }(_inline2.default);

    Underline.blotName = 'underline';
    Underline.tagName = 'U';

    exports.default = Underline;

    /***/ }),
    /* 72 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _link = __webpack_require__(27);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var ATTRIBUTES = ['alt', 'height', 'width'];

    var Image = function (_Parchment$Embed) {
      _inherits(Image, _Parchment$Embed);

      function Image() {
        _classCallCheck(this, Image);

        return _possibleConstructorReturn(this, (Image.__proto__ || Object.getPrototypeOf(Image)).apply(this, arguments));
      }

      _createClass(Image, [{
        key: 'format',
        value: function format(name, value) {
          if (ATTRIBUTES.indexOf(name) > -1) {
            if (value) {
              this.domNode.setAttribute(name, value);
            } else {
              this.domNode.removeAttribute(name);
            }
          } else {
            _get(Image.prototype.__proto__ || Object.getPrototypeOf(Image.prototype), 'format', this).call(this, name, value);
          }
        }
      }], [{
        key: 'create',
        value: function create(value) {
          var node = _get(Image.__proto__ || Object.getPrototypeOf(Image), 'create', this).call(this, value);
          if (typeof value === 'string') {
            node.setAttribute('src', this.sanitize(value));
          }
          return node;
        }
      }, {
        key: 'formats',
        value: function formats(domNode) {
          return ATTRIBUTES.reduce(function (formats, attribute) {
            if (domNode.hasAttribute(attribute)) {
              formats[attribute] = domNode.getAttribute(attribute);
            }
            return formats;
          }, {});
        }
      }, {
        key: 'match',
        value: function match(url) {
          return (/\.(jpe?g|gif|png)$/.test(url) || /^data:image\/.+;base64/.test(url)
          );
        }
      }, {
        key: 'sanitize',
        value: function sanitize(url) {
          return (0, _link.sanitize)(url, ['http', 'https', 'data']) ? url : '//:0';
        }
      }, {
        key: 'value',
        value: function value(domNode) {
          return domNode.getAttribute('src');
        }
      }]);

      return Image;
    }(_parchment2.default.Embed);

    Image.blotName = 'image';
    Image.tagName = 'IMG';

    exports.default = Image;

    /***/ }),
    /* 73 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _block = __webpack_require__(4);

    var _link = __webpack_require__(27);

    var _link2 = _interopRequireDefault(_link);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var ATTRIBUTES = ['height', 'width'];

    var Video = function (_BlockEmbed) {
      _inherits(Video, _BlockEmbed);

      function Video() {
        _classCallCheck(this, Video);

        return _possibleConstructorReturn(this, (Video.__proto__ || Object.getPrototypeOf(Video)).apply(this, arguments));
      }

      _createClass(Video, [{
        key: 'format',
        value: function format(name, value) {
          if (ATTRIBUTES.indexOf(name) > -1) {
            if (value) {
              this.domNode.setAttribute(name, value);
            } else {
              this.domNode.removeAttribute(name);
            }
          } else {
            _get(Video.prototype.__proto__ || Object.getPrototypeOf(Video.prototype), 'format', this).call(this, name, value);
          }
        }
      }], [{
        key: 'create',
        value: function create(value) {
          var node = _get(Video.__proto__ || Object.getPrototypeOf(Video), 'create', this).call(this, value);
          node.setAttribute('frameborder', '0');
          node.setAttribute('allowfullscreen', true);
          node.setAttribute('src', this.sanitize(value));
          return node;
        }
      }, {
        key: 'formats',
        value: function formats(domNode) {
          return ATTRIBUTES.reduce(function (formats, attribute) {
            if (domNode.hasAttribute(attribute)) {
              formats[attribute] = domNode.getAttribute(attribute);
            }
            return formats;
          }, {});
        }
      }, {
        key: 'sanitize',
        value: function sanitize(url) {
          return _link2.default.sanitize(url);
        }
      }, {
        key: 'value',
        value: function value(domNode) {
          return domNode.getAttribute('src');
        }
      }]);

      return Video;
    }(_block.BlockEmbed);

    Video.blotName = 'video';
    Video.className = 'ql-video';
    Video.tagName = 'IFRAME';

    exports.default = Video;

    /***/ }),
    /* 74 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.FormulaBlot = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _embed = __webpack_require__(35);

    var _embed2 = _interopRequireDefault(_embed);

    var _quill = __webpack_require__(5);

    var _quill2 = _interopRequireDefault(_quill);

    var _module = __webpack_require__(9);

    var _module2 = _interopRequireDefault(_module);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var FormulaBlot = function (_Embed) {
      _inherits(FormulaBlot, _Embed);

      function FormulaBlot() {
        _classCallCheck(this, FormulaBlot);

        return _possibleConstructorReturn(this, (FormulaBlot.__proto__ || Object.getPrototypeOf(FormulaBlot)).apply(this, arguments));
      }

      _createClass(FormulaBlot, null, [{
        key: 'create',
        value: function create(value) {
          var node = _get(FormulaBlot.__proto__ || Object.getPrototypeOf(FormulaBlot), 'create', this).call(this, value);
          if (typeof value === 'string') {
            window.katex.render(value, node, {
              throwOnError: false,
              errorColor: '#f00'
            });
            node.setAttribute('data-value', value);
          }
          return node;
        }
      }, {
        key: 'value',
        value: function value(domNode) {
          return domNode.getAttribute('data-value');
        }
      }]);

      return FormulaBlot;
    }(_embed2.default);

    FormulaBlot.blotName = 'formula';
    FormulaBlot.className = 'ql-formula';
    FormulaBlot.tagName = 'SPAN';

    var Formula = function (_Module) {
      _inherits(Formula, _Module);

      _createClass(Formula, null, [{
        key: 'register',
        value: function register() {
          _quill2.default.register(FormulaBlot, true);
        }
      }]);

      function Formula() {
        _classCallCheck(this, Formula);

        var _this2 = _possibleConstructorReturn(this, (Formula.__proto__ || Object.getPrototypeOf(Formula)).call(this));

        if (window.katex == null) {
          throw new Error('Formula module requires KaTeX.');
        }
        return _this2;
      }

      return Formula;
    }(_module2.default);

    exports.FormulaBlot = FormulaBlot;
    exports.default = Formula;

    /***/ }),
    /* 75 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.CodeToken = exports.CodeBlock = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _quill = __webpack_require__(5);

    var _quill2 = _interopRequireDefault(_quill);

    var _module = __webpack_require__(9);

    var _module2 = _interopRequireDefault(_module);

    var _code = __webpack_require__(13);

    var _code2 = _interopRequireDefault(_code);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var SyntaxCodeBlock = function (_CodeBlock) {
      _inherits(SyntaxCodeBlock, _CodeBlock);

      function SyntaxCodeBlock() {
        _classCallCheck(this, SyntaxCodeBlock);

        return _possibleConstructorReturn(this, (SyntaxCodeBlock.__proto__ || Object.getPrototypeOf(SyntaxCodeBlock)).apply(this, arguments));
      }

      _createClass(SyntaxCodeBlock, [{
        key: 'replaceWith',
        value: function replaceWith(block) {
          this.domNode.textContent = this.domNode.textContent;
          this.attach();
          _get(SyntaxCodeBlock.prototype.__proto__ || Object.getPrototypeOf(SyntaxCodeBlock.prototype), 'replaceWith', this).call(this, block);
        }
      }, {
        key: 'highlight',
        value: function highlight(_highlight) {
          var text = this.domNode.textContent;
          if (this.cachedText !== text) {
            if (text.trim().length > 0 || this.cachedText == null) {
              this.domNode.innerHTML = _highlight(text);
              this.domNode.normalize();
              this.attach();
            }
            this.cachedText = text;
          }
        }
      }]);

      return SyntaxCodeBlock;
    }(_code2.default);

    SyntaxCodeBlock.className = 'ql-syntax';

    var CodeToken = new _parchment2.default.Attributor.Class('token', 'hljs', {
      scope: _parchment2.default.Scope.INLINE
    });

    var Syntax = function (_Module) {
      _inherits(Syntax, _Module);

      _createClass(Syntax, null, [{
        key: 'register',
        value: function register() {
          _quill2.default.register(CodeToken, true);
          _quill2.default.register(SyntaxCodeBlock, true);
        }
      }]);

      function Syntax(quill, options) {
        _classCallCheck(this, Syntax);

        var _this2 = _possibleConstructorReturn(this, (Syntax.__proto__ || Object.getPrototypeOf(Syntax)).call(this, quill, options));

        if (typeof _this2.options.highlight !== 'function') {
          throw new Error('Syntax module requires highlight.js. Please include the library on the page before Quill.');
        }
        var timer = null;
        _this2.quill.on(_quill2.default.events.SCROLL_OPTIMIZE, function () {
          clearTimeout(timer);
          timer = setTimeout(function () {
            _this2.highlight();
            timer = null;
          }, _this2.options.interval);
        });
        _this2.highlight();
        return _this2;
      }

      _createClass(Syntax, [{
        key: 'highlight',
        value: function highlight() {
          var _this3 = this;

          if (this.quill.selection.composing) return;
          this.quill.update(_quill2.default.sources.USER);
          var range = this.quill.getSelection();
          this.quill.scroll.descendants(SyntaxCodeBlock).forEach(function (code) {
            code.highlight(_this3.options.highlight);
          });
          this.quill.update(_quill2.default.sources.SILENT);
          if (range != null) {
            this.quill.setSelection(range, _quill2.default.sources.SILENT);
          }
        }
      }]);

      return Syntax;
    }(_module2.default);

    Syntax.DEFAULTS = {
      highlight: function () {
        if (window.hljs == null) return null;
        return function (text) {
          var result = window.hljs.highlightAuto(text);
          return result.value;
        };
      }(),
      interval: 1000
    };

    exports.CodeBlock = SyntaxCodeBlock;
    exports.CodeToken = CodeToken;
    exports.default = Syntax;

    /***/ }),
    /* 76 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=3 x2=15 y1=9 y2=9></line> <line class=ql-stroke x1=3 x2=13 y1=14 y2=14></line> <line class=ql-stroke x1=3 x2=9 y1=4 y2=4></line> </svg>";

    /***/ }),
    /* 77 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=15 x2=3 y1=9 y2=9></line> <line class=ql-stroke x1=14 x2=4 y1=14 y2=14></line> <line class=ql-stroke x1=12 x2=6 y1=4 y2=4></line> </svg>";

    /***/ }),
    /* 78 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=15 x2=3 y1=9 y2=9></line> <line class=ql-stroke x1=15 x2=5 y1=14 y2=14></line> <line class=ql-stroke x1=15 x2=9 y1=4 y2=4></line> </svg>";

    /***/ }),
    /* 79 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=15 x2=3 y1=9 y2=9></line> <line class=ql-stroke x1=15 x2=3 y1=14 y2=14></line> <line class=ql-stroke x1=15 x2=3 y1=4 y2=4></line> </svg>";

    /***/ }),
    /* 80 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <g class=\"ql-fill ql-color-label\"> <polygon points=\"6 6.868 6 6 5 6 5 7 5.942 7 6 6.868\"></polygon> <rect height=1 width=1 x=4 y=4></rect> <polygon points=\"6.817 5 6 5 6 6 6.38 6 6.817 5\"></polygon> <rect height=1 width=1 x=2 y=6></rect> <rect height=1 width=1 x=3 y=5></rect> <rect height=1 width=1 x=4 y=7></rect> <polygon points=\"4 11.439 4 11 3 11 3 12 3.755 12 4 11.439\"></polygon> <rect height=1 width=1 x=2 y=12></rect> <rect height=1 width=1 x=2 y=9></rect> <rect height=1 width=1 x=2 y=15></rect> <polygon points=\"4.63 10 4 10 4 11 4.192 11 4.63 10\"></polygon> <rect height=1 width=1 x=3 y=8></rect> <path d=M10.832,4.2L11,4.582V4H10.708A1.948,1.948,0,0,1,10.832,4.2Z></path> <path d=M7,4.582L7.168,4.2A1.929,1.929,0,0,1,7.292,4H7V4.582Z></path> <path d=M8,13H7.683l-0.351.8a1.933,1.933,0,0,1-.124.2H8V13Z></path> <rect height=1 width=1 x=12 y=2></rect> <rect height=1 width=1 x=11 y=3></rect> <path d=M9,3H8V3.282A1.985,1.985,0,0,1,9,3Z></path> <rect height=1 width=1 x=2 y=3></rect> <rect height=1 width=1 x=6 y=2></rect> <rect height=1 width=1 x=3 y=2></rect> <rect height=1 width=1 x=5 y=3></rect> <rect height=1 width=1 x=9 y=2></rect> <rect height=1 width=1 x=15 y=14></rect> <polygon points=\"13.447 10.174 13.469 10.225 13.472 10.232 13.808 11 14 11 14 10 13.37 10 13.447 10.174\"></polygon> <rect height=1 width=1 x=13 y=7></rect> <rect height=1 width=1 x=15 y=5></rect> <rect height=1 width=1 x=14 y=6></rect> <rect height=1 width=1 x=15 y=8></rect> <rect height=1 width=1 x=14 y=9></rect> <path d=M3.775,14H3v1H4V14.314A1.97,1.97,0,0,1,3.775,14Z></path> <rect height=1 width=1 x=14 y=3></rect> <polygon points=\"12 6.868 12 6 11.62 6 12 6.868\"></polygon> <rect height=1 width=1 x=15 y=2></rect> <rect height=1 width=1 x=12 y=5></rect> <rect height=1 width=1 x=13 y=4></rect> <polygon points=\"12.933 9 13 9 13 8 12.495 8 12.933 9\"></polygon> <rect height=1 width=1 x=9 y=14></rect> <rect height=1 width=1 x=8 y=15></rect> <path d=M6,14.926V15H7V14.316A1.993,1.993,0,0,1,6,14.926Z></path> <rect height=1 width=1 x=5 y=15></rect> <path d=M10.668,13.8L10.317,13H10v1h0.792A1.947,1.947,0,0,1,10.668,13.8Z></path> <rect height=1 width=1 x=11 y=15></rect> <path d=M14.332,12.2a1.99,1.99,0,0,1,.166.8H15V12H14.245Z></path> <rect height=1 width=1 x=14 y=15></rect> <rect height=1 width=1 x=15 y=11></rect> </g> <polyline class=ql-stroke points=\"5.5 13 9 5 12.5 13\"></polyline> <line class=ql-stroke x1=11.63 x2=6.38 y1=11 y2=11></line> </svg>";

    /***/ }),
    /* 81 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <rect class=\"ql-fill ql-stroke\" height=3 width=3 x=4 y=5></rect> <rect class=\"ql-fill ql-stroke\" height=3 width=3 x=11 y=5></rect> <path class=\"ql-even ql-fill ql-stroke\" d=M7,8c0,4.031-3,5-3,5></path> <path class=\"ql-even ql-fill ql-stroke\" d=M14,8c0,4.031-3,5-3,5></path> </svg>";

    /***/ }),
    /* 82 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-stroke d=M5,4H9.5A2.5,2.5,0,0,1,12,6.5v0A2.5,2.5,0,0,1,9.5,9H5A0,0,0,0,1,5,9V4A0,0,0,0,1,5,4Z></path> <path class=ql-stroke d=M5,9h5.5A2.5,2.5,0,0,1,13,11.5v0A2.5,2.5,0,0,1,10.5,14H5a0,0,0,0,1,0,0V9A0,0,0,0,1,5,9Z></path> </svg>";

    /***/ }),
    /* 83 */
    /***/ (function(module, exports) {

    module.exports = "<svg class=\"\" viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=5 x2=13 y1=3 y2=3></line> <line class=ql-stroke x1=6 x2=9.35 y1=12 y2=3></line> <line class=ql-stroke x1=11 x2=15 y1=11 y2=15></line> <line class=ql-stroke x1=15 x2=11 y1=11 y2=15></line> <rect class=ql-fill height=1 rx=0.5 ry=0.5 width=7 x=2 y=14></rect> </svg>";

    /***/ }),
    /* 84 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=\"ql-color-label ql-stroke ql-transparent\" x1=3 x2=15 y1=15 y2=15></line> <polyline class=ql-stroke points=\"5.5 11 9 3 12.5 11\"></polyline> <line class=ql-stroke x1=11.63 x2=6.38 y1=9 y2=9></line> </svg>";

    /***/ }),
    /* 85 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <polygon class=\"ql-stroke ql-fill\" points=\"3 11 5 9 3 7 3 11\"></polygon> <line class=\"ql-stroke ql-fill\" x1=15 x2=11 y1=4 y2=4></line> <path class=ql-fill d=M11,3a3,3,0,0,0,0,6h1V3H11Z></path> <rect class=ql-fill height=11 width=1 x=11 y=4></rect> <rect class=ql-fill height=11 width=1 x=13 y=4></rect> </svg>";

    /***/ }),
    /* 86 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <polygon class=\"ql-stroke ql-fill\" points=\"15 12 13 10 15 8 15 12\"></polygon> <line class=\"ql-stroke ql-fill\" x1=9 x2=5 y1=4 y2=4></line> <path class=ql-fill d=M5,3A3,3,0,0,0,5,9H6V3H5Z></path> <rect class=ql-fill height=11 width=1 x=5 y=4></rect> <rect class=ql-fill height=11 width=1 x=7 y=4></rect> </svg>";

    /***/ }),
    /* 87 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M14,16H4a1,1,0,0,1,0-2H14A1,1,0,0,1,14,16Z /> <path class=ql-fill d=M14,4H4A1,1,0,0,1,4,2H14A1,1,0,0,1,14,4Z /> <rect class=ql-fill x=3 y=6 width=12 height=6 rx=1 ry=1 /> </svg>";

    /***/ }),
    /* 88 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M13,16H5a1,1,0,0,1,0-2h8A1,1,0,0,1,13,16Z /> <path class=ql-fill d=M13,4H5A1,1,0,0,1,5,2h8A1,1,0,0,1,13,4Z /> <rect class=ql-fill x=2 y=6 width=14 height=6 rx=1 ry=1 /> </svg>";

    /***/ }),
    /* 89 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M15,8H13a1,1,0,0,1,0-2h2A1,1,0,0,1,15,8Z /> <path class=ql-fill d=M15,12H13a1,1,0,0,1,0-2h2A1,1,0,0,1,15,12Z /> <path class=ql-fill d=M15,16H5a1,1,0,0,1,0-2H15A1,1,0,0,1,15,16Z /> <path class=ql-fill d=M15,4H5A1,1,0,0,1,5,2H15A1,1,0,0,1,15,4Z /> <rect class=ql-fill x=2 y=6 width=8 height=6 rx=1 ry=1 /> </svg>";

    /***/ }),
    /* 90 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M5,8H3A1,1,0,0,1,3,6H5A1,1,0,0,1,5,8Z /> <path class=ql-fill d=M5,12H3a1,1,0,0,1,0-2H5A1,1,0,0,1,5,12Z /> <path class=ql-fill d=M13,16H3a1,1,0,0,1,0-2H13A1,1,0,0,1,13,16Z /> <path class=ql-fill d=M13,4H3A1,1,0,0,1,3,2H13A1,1,0,0,1,13,4Z /> <rect class=ql-fill x=8 y=6 width=8 height=6 rx=1 ry=1 transform=\"translate(24 18) rotate(-180)\"/> </svg>";

    /***/ }),
    /* 91 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M11.759,2.482a2.561,2.561,0,0,0-3.53.607A7.656,7.656,0,0,0,6.8,6.2C6.109,9.188,5.275,14.677,4.15,14.927a1.545,1.545,0,0,0-1.3-.933A0.922,0.922,0,0,0,2,15.036S1.954,16,4.119,16s3.091-2.691,3.7-5.553c0.177-.826.36-1.726,0.554-2.6L8.775,6.2c0.381-1.421.807-2.521,1.306-2.676a1.014,1.014,0,0,0,1.02.56A0.966,0.966,0,0,0,11.759,2.482Z></path> <rect class=ql-fill height=1.6 rx=0.8 ry=0.8 width=5 x=5.15 y=6.2></rect> <path class=ql-fill d=M13.663,12.027a1.662,1.662,0,0,1,.266-0.276q0.193,0.069.456,0.138a2.1,2.1,0,0,0,.535.069,1.075,1.075,0,0,0,.767-0.3,1.044,1.044,0,0,0,.314-0.8,0.84,0.84,0,0,0-.238-0.619,0.8,0.8,0,0,0-.594-0.239,1.154,1.154,0,0,0-.781.3,4.607,4.607,0,0,0-.781,1q-0.091.15-.218,0.346l-0.246.38c-0.068-.288-0.137-0.582-0.212-0.885-0.459-1.847-2.494-.984-2.941-0.8-0.482.2-.353,0.647-0.094,0.529a0.869,0.869,0,0,1,1.281.585c0.217,0.751.377,1.436,0.527,2.038a5.688,5.688,0,0,1-.362.467,2.69,2.69,0,0,1-.264.271q-0.221-.08-0.471-0.147a2.029,2.029,0,0,0-.522-0.066,1.079,1.079,0,0,0-.768.3A1.058,1.058,0,0,0,9,15.131a0.82,0.82,0,0,0,.832.852,1.134,1.134,0,0,0,.787-0.3,5.11,5.11,0,0,0,.776-0.993q0.141-.219.215-0.34c0.046-.076.122-0.194,0.223-0.346a2.786,2.786,0,0,0,.918,1.726,2.582,2.582,0,0,0,2.376-.185c0.317-.181.212-0.565,0-0.494A0.807,0.807,0,0,1,14.176,15a5.159,5.159,0,0,1-.913-2.446l0,0Q13.487,12.24,13.663,12.027Z></path> </svg>";

    /***/ }),
    /* 92 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewBox=\"0 0 18 18\"> <path class=ql-fill d=M10,4V14a1,1,0,0,1-2,0V10H3v4a1,1,0,0,1-2,0V4A1,1,0,0,1,3,4V8H8V4a1,1,0,0,1,2,0Zm6.06787,9.209H14.98975V7.59863a.54085.54085,0,0,0-.605-.60547h-.62744a1.01119,1.01119,0,0,0-.748.29688L11.645,8.56641a.5435.5435,0,0,0-.022.8584l.28613.30762a.53861.53861,0,0,0,.84717.0332l.09912-.08789a1.2137,1.2137,0,0,0,.2417-.35254h.02246s-.01123.30859-.01123.60547V13.209H12.041a.54085.54085,0,0,0-.605.60547v.43945a.54085.54085,0,0,0,.605.60547h4.02686a.54085.54085,0,0,0,.605-.60547v-.43945A.54085.54085,0,0,0,16.06787,13.209Z /> </svg>";

    /***/ }),
    /* 93 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewBox=\"0 0 18 18\"> <path class=ql-fill d=M16.73975,13.81445v.43945a.54085.54085,0,0,1-.605.60547H11.855a.58392.58392,0,0,1-.64893-.60547V14.0127c0-2.90527,3.39941-3.42187,3.39941-4.55469a.77675.77675,0,0,0-.84717-.78125,1.17684,1.17684,0,0,0-.83594.38477c-.2749.26367-.561.374-.85791.13184l-.4292-.34082c-.30811-.24219-.38525-.51758-.1543-.81445a2.97155,2.97155,0,0,1,2.45361-1.17676,2.45393,2.45393,0,0,1,2.68408,2.40918c0,2.45312-3.1792,2.92676-3.27832,3.93848h2.79443A.54085.54085,0,0,1,16.73975,13.81445ZM9,3A.99974.99974,0,0,0,8,4V8H3V4A1,1,0,0,0,1,4V14a1,1,0,0,0,2,0V10H8v4a1,1,0,0,0,2,0V4A.99974.99974,0,0,0,9,3Z /> </svg>";

    /***/ }),
    /* 94 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=7 x2=13 y1=4 y2=4></line> <line class=ql-stroke x1=5 x2=11 y1=14 y2=14></line> <line class=ql-stroke x1=8 x2=10 y1=14 y2=4></line> </svg>";

    /***/ }),
    /* 95 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <rect class=ql-stroke height=10 width=12 x=3 y=4></rect> <circle class=ql-fill cx=6 cy=7 r=1></circle> <polyline class=\"ql-even ql-fill\" points=\"5 12 5 11 7 9 8 10 11 7 13 9 13 12 5 12\"></polyline> </svg>";

    /***/ }),
    /* 96 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=3 x2=15 y1=14 y2=14></line> <line class=ql-stroke x1=3 x2=15 y1=4 y2=4></line> <line class=ql-stroke x1=9 x2=15 y1=9 y2=9></line> <polyline class=\"ql-fill ql-stroke\" points=\"3 7 3 11 5 9 3 7\"></polyline> </svg>";

    /***/ }),
    /* 97 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=3 x2=15 y1=14 y2=14></line> <line class=ql-stroke x1=3 x2=15 y1=4 y2=4></line> <line class=ql-stroke x1=9 x2=15 y1=9 y2=9></line> <polyline class=ql-stroke points=\"5 7 5 11 3 9 5 7\"></polyline> </svg>";

    /***/ }),
    /* 98 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=7 x2=11 y1=7 y2=11></line> <path class=\"ql-even ql-stroke\" d=M8.9,4.577a3.476,3.476,0,0,1,.36,4.679A3.476,3.476,0,0,1,4.577,8.9C3.185,7.5,2.035,6.4,4.217,4.217S7.5,3.185,8.9,4.577Z></path> <path class=\"ql-even ql-stroke\" d=M13.423,9.1a3.476,3.476,0,0,0-4.679-.36,3.476,3.476,0,0,0,.36,4.679c1.392,1.392,2.5,2.542,4.679.36S14.815,10.5,13.423,9.1Z></path> </svg>";

    /***/ }),
    /* 99 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=7 x2=15 y1=4 y2=4></line> <line class=ql-stroke x1=7 x2=15 y1=9 y2=9></line> <line class=ql-stroke x1=7 x2=15 y1=14 y2=14></line> <line class=\"ql-stroke ql-thin\" x1=2.5 x2=4.5 y1=5.5 y2=5.5></line> <path class=ql-fill d=M3.5,6A0.5,0.5,0,0,1,3,5.5V3.085l-0.276.138A0.5,0.5,0,0,1,2.053,3c-0.124-.247-0.023-0.324.224-0.447l1-.5A0.5,0.5,0,0,1,4,2.5v3A0.5,0.5,0,0,1,3.5,6Z></path> <path class=\"ql-stroke ql-thin\" d=M4.5,10.5h-2c0-.234,1.85-1.076,1.85-2.234A0.959,0.959,0,0,0,2.5,8.156></path> <path class=\"ql-stroke ql-thin\" d=M2.5,14.846a0.959,0.959,0,0,0,1.85-.109A0.7,0.7,0,0,0,3.75,14a0.688,0.688,0,0,0,.6-0.736,0.959,0.959,0,0,0-1.85-.109></path> </svg>";

    /***/ }),
    /* 100 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=6 x2=15 y1=4 y2=4></line> <line class=ql-stroke x1=6 x2=15 y1=9 y2=9></line> <line class=ql-stroke x1=6 x2=15 y1=14 y2=14></line> <line class=ql-stroke x1=3 x2=3 y1=4 y2=4></line> <line class=ql-stroke x1=3 x2=3 y1=9 y2=9></line> <line class=ql-stroke x1=3 x2=3 y1=14 y2=14></line> </svg>";

    /***/ }),
    /* 101 */
    /***/ (function(module, exports) {

    module.exports = "<svg class=\"\" viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=9 x2=15 y1=4 y2=4></line> <polyline class=ql-stroke points=\"3 4 4 5 6 3\"></polyline> <line class=ql-stroke x1=9 x2=15 y1=14 y2=14></line> <polyline class=ql-stroke points=\"3 14 4 15 6 13\"></polyline> <line class=ql-stroke x1=9 x2=15 y1=9 y2=9></line> <polyline class=ql-stroke points=\"3 9 4 10 6 8\"></polyline> </svg>";

    /***/ }),
    /* 102 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M15.5,15H13.861a3.858,3.858,0,0,0,1.914-2.975,1.8,1.8,0,0,0-1.6-1.751A1.921,1.921,0,0,0,12.021,11.7a0.50013,0.50013,0,1,0,.957.291h0a0.914,0.914,0,0,1,1.053-.725,0.81,0.81,0,0,1,.744.762c0,1.076-1.16971,1.86982-1.93971,2.43082A1.45639,1.45639,0,0,0,12,15.5a0.5,0.5,0,0,0,.5.5h3A0.5,0.5,0,0,0,15.5,15Z /> <path class=ql-fill d=M9.65,5.241a1,1,0,0,0-1.409.108L6,7.964,3.759,5.349A1,1,0,0,0,2.192,6.59178Q2.21541,6.6213,2.241,6.649L4.684,9.5,2.241,12.35A1,1,0,0,0,3.71,13.70722q0.02557-.02768.049-0.05722L6,11.036,8.241,13.65a1,1,0,1,0,1.567-1.24277Q9.78459,12.3777,9.759,12.35L7.316,9.5,9.759,6.651A1,1,0,0,0,9.65,5.241Z /> </svg>";

    /***/ }),
    /* 103 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M15.5,7H13.861a4.015,4.015,0,0,0,1.914-2.975,1.8,1.8,0,0,0-1.6-1.751A1.922,1.922,0,0,0,12.021,3.7a0.5,0.5,0,1,0,.957.291,0.917,0.917,0,0,1,1.053-.725,0.81,0.81,0,0,1,.744.762c0,1.077-1.164,1.925-1.934,2.486A1.423,1.423,0,0,0,12,7.5a0.5,0.5,0,0,0,.5.5h3A0.5,0.5,0,0,0,15.5,7Z /> <path class=ql-fill d=M9.651,5.241a1,1,0,0,0-1.41.108L6,7.964,3.759,5.349a1,1,0,1,0-1.519,1.3L4.683,9.5,2.241,12.35a1,1,0,1,0,1.519,1.3L6,11.036,8.241,13.65a1,1,0,0,0,1.519-1.3L7.317,9.5,9.759,6.651A1,1,0,0,0,9.651,5.241Z /> </svg>";

    /***/ }),
    /* 104 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=\"ql-stroke ql-thin\" x1=15.5 x2=2.5 y1=8.5 y2=9.5></line> <path class=ql-fill d=M9.007,8C6.542,7.791,6,7.519,6,6.5,6,5.792,7.283,5,9,5c1.571,0,2.765.679,2.969,1.309a1,1,0,0,0,1.9-.617C13.356,4.106,11.354,3,9,3,6.2,3,4,4.538,4,6.5a3.2,3.2,0,0,0,.5,1.843Z></path> <path class=ql-fill d=M8.984,10C11.457,10.208,12,10.479,12,11.5c0,0.708-1.283,1.5-3,1.5-1.571,0-2.765-.679-2.969-1.309a1,1,0,1,0-1.9.617C4.644,13.894,6.646,15,9,15c2.8,0,5-1.538,5-3.5a3.2,3.2,0,0,0-.5-1.843Z></path> </svg>";

    /***/ }),
    /* 105 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-stroke d=M5,3V9a4.012,4.012,0,0,0,4,4H9a4.012,4.012,0,0,0,4-4V3></path> <rect class=ql-fill height=1 rx=0.5 ry=0.5 width=12 x=3 y=15></rect> </svg>";

    /***/ }),
    /* 106 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <rect class=ql-stroke height=12 width=12 x=3 y=3></rect> <rect class=ql-fill height=12 width=1 x=5 y=3></rect> <rect class=ql-fill height=12 width=1 x=12 y=3></rect> <rect class=ql-fill height=2 width=8 x=5 y=8></rect> <rect class=ql-fill height=1 width=3 x=3 y=5></rect> <rect class=ql-fill height=1 width=3 x=3 y=7></rect> <rect class=ql-fill height=1 width=3 x=3 y=10></rect> <rect class=ql-fill height=1 width=3 x=3 y=12></rect> <rect class=ql-fill height=1 width=3 x=12 y=5></rect> <rect class=ql-fill height=1 width=3 x=12 y=7></rect> <rect class=ql-fill height=1 width=3 x=12 y=10></rect> <rect class=ql-fill height=1 width=3 x=12 y=12></rect> </svg>";

    /***/ }),
    /* 107 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <polygon class=ql-stroke points=\"7 11 9 13 11 11 7 11\"></polygon> <polygon class=ql-stroke points=\"7 7 9 5 11 7 7 7\"></polygon> </svg>";

    /***/ }),
    /* 108 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.BubbleTooltip = undefined;

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _extend = __webpack_require__(3);

    var _extend2 = _interopRequireDefault(_extend);

    var _emitter = __webpack_require__(8);

    var _emitter2 = _interopRequireDefault(_emitter);

    var _base = __webpack_require__(43);

    var _base2 = _interopRequireDefault(_base);

    var _selection = __webpack_require__(15);

    var _icons = __webpack_require__(41);

    var _icons2 = _interopRequireDefault(_icons);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var TOOLBAR_CONFIG = [['bold', 'italic', 'link'], [{ header: 1 }, { header: 2 }, 'blockquote']];

    var BubbleTheme = function (_BaseTheme) {
      _inherits(BubbleTheme, _BaseTheme);

      function BubbleTheme(quill, options) {
        _classCallCheck(this, BubbleTheme);

        if (options.modules.toolbar != null && options.modules.toolbar.container == null) {
          options.modules.toolbar.container = TOOLBAR_CONFIG;
        }

        var _this = _possibleConstructorReturn(this, (BubbleTheme.__proto__ || Object.getPrototypeOf(BubbleTheme)).call(this, quill, options));

        _this.quill.container.classList.add('ql-bubble');
        return _this;
      }

      _createClass(BubbleTheme, [{
        key: 'extendToolbar',
        value: function extendToolbar(toolbar) {
          this.tooltip = new BubbleTooltip(this.quill, this.options.bounds);
          this.tooltip.root.appendChild(toolbar.container);
          this.buildButtons([].slice.call(toolbar.container.querySelectorAll('button')), _icons2.default);
          this.buildPickers([].slice.call(toolbar.container.querySelectorAll('select')), _icons2.default);
        }
      }]);

      return BubbleTheme;
    }(_base2.default);

    BubbleTheme.DEFAULTS = (0, _extend2.default)(true, {}, _base2.default.DEFAULTS, {
      modules: {
        toolbar: {
          handlers: {
            link: function link(value) {
              if (!value) {
                this.quill.format('link', false);
              } else {
                this.quill.theme.tooltip.edit();
              }
            }
          }
        }
      }
    });

    var BubbleTooltip = function (_BaseTooltip) {
      _inherits(BubbleTooltip, _BaseTooltip);

      function BubbleTooltip(quill, bounds) {
        _classCallCheck(this, BubbleTooltip);

        var _this2 = _possibleConstructorReturn(this, (BubbleTooltip.__proto__ || Object.getPrototypeOf(BubbleTooltip)).call(this, quill, bounds));

        _this2.quill.on(_emitter2.default.events.EDITOR_CHANGE, function (type, range, oldRange, source) {
          if (type !== _emitter2.default.events.SELECTION_CHANGE) return;
          if (range != null && range.length > 0 && source === _emitter2.default.sources.USER) {
            _this2.show();
            // Lock our width so we will expand beyond our offsetParent boundaries
            _this2.root.style.left = '0px';
            _this2.root.style.width = '';
            _this2.root.style.width = _this2.root.offsetWidth + 'px';
            var lines = _this2.quill.getLines(range.index, range.length);
            if (lines.length === 1) {
              _this2.position(_this2.quill.getBounds(range));
            } else {
              var lastLine = lines[lines.length - 1];
              var index = _this2.quill.getIndex(lastLine);
              var length = Math.min(lastLine.length() - 1, range.index + range.length - index);
              var _bounds = _this2.quill.getBounds(new _selection.Range(index, length));
              _this2.position(_bounds);
            }
          } else if (document.activeElement !== _this2.textbox && _this2.quill.hasFocus()) {
            _this2.hide();
          }
        });
        return _this2;
      }

      _createClass(BubbleTooltip, [{
        key: 'listen',
        value: function listen() {
          var _this3 = this;

          _get(BubbleTooltip.prototype.__proto__ || Object.getPrototypeOf(BubbleTooltip.prototype), 'listen', this).call(this);
          this.root.querySelector('.ql-close').addEventListener('click', function () {
            _this3.root.classList.remove('ql-editing');
          });
          this.quill.on(_emitter2.default.events.SCROLL_OPTIMIZE, function () {
            // Let selection be restored by toolbar handlers before repositioning
            setTimeout(function () {
              if (_this3.root.classList.contains('ql-hidden')) return;
              var range = _this3.quill.getSelection();
              if (range != null) {
                _this3.position(_this3.quill.getBounds(range));
              }
            }, 1);
          });
        }
      }, {
        key: 'cancel',
        value: function cancel() {
          this.show();
        }
      }, {
        key: 'position',
        value: function position(reference) {
          var shift = _get(BubbleTooltip.prototype.__proto__ || Object.getPrototypeOf(BubbleTooltip.prototype), 'position', this).call(this, reference);
          var arrow = this.root.querySelector('.ql-tooltip-arrow');
          arrow.style.marginLeft = '';
          if (shift === 0) return shift;
          arrow.style.marginLeft = -1 * shift - arrow.offsetWidth / 2 + 'px';
        }
      }]);

      return BubbleTooltip;
    }(_base.BaseTooltip);

    BubbleTooltip.TEMPLATE = ['<span class="ql-tooltip-arrow"></span>', '<div class="ql-tooltip-editor">', '<input type="text" data-formula="e=mc^2" data-link="https://quilljs.com" data-video="Embed URL">', '<a class="ql-close"></a>', '</div>'].join('');

    exports.BubbleTooltip = BubbleTooltip;
    exports.default = BubbleTheme;

    /***/ }),
    /* 109 */
    /***/ (function(module, exports, __webpack_require__) {

    module.exports = __webpack_require__(63);


    /***/ })
    /******/ ])["default"];
    });
    });

    var Quill = unwrapExports(quill);

    /* src\Components\Snackbar.svelte generated by Svelte v3.19.2 */

    const file$6 = "src\\Components\\Snackbar.svelte";

    // (28:6) {#if click}
    function create_if_block$2(ctx) {
    	let span;
    	let t_value = /*actionText*/ ctx[1].toUpperCase() + "";
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "click svelte-1fqvrub");
    			add_location(span, file$6, 28, 8, 660);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    			dispose = listen_dev(span, "click", /*buttonClick*/ ctx[3], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*actionText*/ 2 && t_value !== (t_value = /*actionText*/ ctx[1].toUpperCase() + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(28:6) {#if click}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let main;
    	let div;
    	let span1;
    	let span0;
    	let t0;
    	let t1;
    	let if_block = /*click*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			span1 = element("span");
    			span0 = element("span");
    			t0 = text(/*text*/ ctx[0]);
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(span0, "class", "svelte-1fqvrub");
    			add_location(span0, file$6, 26, 6, 612);
    			attr_dev(span1, "class", "svelte-1fqvrub");
    			add_location(span1, file$6, 25, 4, 598);
    			attr_dev(div, "class", "svelte-1fqvrub");
    			add_location(div, file$6, 24, 2, 587);
    			attr_dev(main, "class", "snackbar-element svelte-1fqvrub");
    			add_location(main, file$6, 23, 0, 552);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, span1);
    			append_dev(span1, span0);
    			append_dev(span0, t0);
    			append_dev(span1, t1);
    			if (if_block) if_block.m(span1, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 1) set_data_dev(t0, /*text*/ ctx[0]);

    			if (/*click*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(span1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const element$1 = new Set();

    function instance$6($$self, $$props, $$invalidate) {
    	let { text = "Hello world!" } = $$props;
    	let { actionText = "Action" } = $$props;
    	let { duration = 2000 } = $$props;
    	let { click = null } = $$props;
    	let { context = null } = $$props;

    	function buttonClick() {
    		click();
    		document.querySelector(".snackbar-element").style.display = "none";
    		context.$destroy();
    	}

    	setTimeout(
    		() => {
    			document.querySelector(".snackbar-element").style.display = "none";
    			if (context) context.$destroy();
    		},
    		duration
    	);

    	const writable_props = ["text", "actionText", "duration", "click", "context"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Snackbar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Snackbar", $$slots, []);

    	$$self.$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("actionText" in $$props) $$invalidate(1, actionText = $$props.actionText);
    		if ("duration" in $$props) $$invalidate(4, duration = $$props.duration);
    		if ("click" in $$props) $$invalidate(2, click = $$props.click);
    		if ("context" in $$props) $$invalidate(5, context = $$props.context);
    	};

    	$$self.$capture_state = () => ({
    		element: element$1,
    		text,
    		actionText,
    		duration,
    		click,
    		context,
    		buttonClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("actionText" in $$props) $$invalidate(1, actionText = $$props.actionText);
    		if ("duration" in $$props) $$invalidate(4, duration = $$props.duration);
    		if ("click" in $$props) $$invalidate(2, click = $$props.click);
    		if ("context" in $$props) $$invalidate(5, context = $$props.context);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, actionText, click, buttonClick, duration, context];
    }

    class Snackbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			text: 0,
    			actionText: 1,
    			duration: 4,
    			click: 2,
    			context: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Snackbar",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get text() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get actionText() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set actionText(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get click() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set click(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get context() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set context(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\alertBox.svelte generated by Svelte v3.19.2 */
    const file$7 = "src\\Components\\alertBox.svelte";

    function create_fragment$7(ctx) {
    	let main;
    	let div4;
    	let div0;
    	let t0;
    	let t1;
    	let div3;
    	let div1;
    	let span0;
    	let t3;
    	let div2;
    	let span1;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div4 = element("div");
    			div0 = element("div");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			div3 = element("div");
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "Yes";
    			t3 = space();
    			div2 = element("div");
    			span1 = element("span");
    			span1.textContent = "Nope";
    			attr_dev(div0, "class", "title svelte-1i2lvop");
    			add_location(div0, file$7, 41, 4, 795);
    			attr_dev(span0, "class", "svelte-1i2lvop");
    			add_location(span0, file$7, 44, 8, 891);
    			attr_dev(div1, "class", "svelte-1i2lvop");
    			add_location(div1, file$7, 43, 6, 861);
    			attr_dev(span1, "class", "svelte-1i2lvop");
    			add_location(span1, file$7, 47, 8, 958);
    			attr_dev(div2, "class", "svelte-1i2lvop");
    			add_location(div2, file$7, 46, 6, 929);
    			attr_dev(div3, "class", "option svelte-1i2lvop");
    			add_location(div3, file$7, 42, 4, 833);
    			attr_dev(div4, "class", "dialog svelte-1i2lvop");
    			add_location(div4, file$7, 40, 2, 769);
    			attr_dev(main, "class", "svelte-1i2lvop");
    			add_location(main, file$7, 39, 0, 742);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div4);
    			append_dev(div4, div0);
    			append_dev(div0, t0);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, span0);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, span1);

    			dispose = [
    				listen_dev(div1, "click", /*yes*/ ctx[2], false, false, false),
    				listen_dev(div2, "click", /*no*/ ctx[3], false, false, false),
    				listen_dev(main, "click", /*close*/ ctx[1], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function isMain$1(e) {
    	return e.target.localName === "main";
    }

    function instance$7($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { context = null } = $$props;
    	let { title = "Are you sure?" } = $$props;

    	function close(event) {
    		if (context && isMain$1(event)) {
    			dispatch("answer", { response: false });
    			context.$destroy();
    		}
    	}

    	function yes() {
    		dispatch("answer", { response: true });
    		if (context) context.$destroy();
    	}

    	function no() {
    		dispatch("answer", { response: false });
    		if (context) context.$destroy();
    	}

    	function destroy() {
    		if (context) context.$destroy();
    	}

    	const writable_props = ["context", "title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AlertBox> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("AlertBox", $$slots, []);

    	$$self.$set = $$props => {
    		if ("context" in $$props) $$invalidate(4, context = $$props.context);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		context,
    		title,
    		close,
    		yes,
    		no,
    		destroy,
    		isMain: isMain$1
    	});

    	$$self.$inject_state = $$props => {
    		if ("context" in $$props) $$invalidate(4, context = $$props.context);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, close, yes, no, context];
    }

    class AlertBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { context: 4, title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AlertBox",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get context() {
    		throw new Error("<AlertBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set context(value) {
    		throw new Error("<AlertBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<AlertBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<AlertBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\Creator.svelte generated by Svelte v3.19.2 */

    const { console: console_1$1 } = globals;
    const file$8 = "src\\Pages\\Creator.svelte";

    // (183:2) {:else}
    function create_else_block(ctx) {
    	let t;
    	let current;

    	const fab0 = new Fab({
    			props: {
    				fontSize: "32px",
    				margin: "16px",
    				color: "#000",
    				background: "#fff8e1",
    				shadow: "#fff8e1",
    				icon: "arrow_back",
    				position: "top-left"
    			},
    			$$inline: true
    		});

    	fab0.$on("click", /*closePage*/ ctx[2]);

    	const fab1 = new Fab({
    			props: {
    				fontSize: "32px",
    				margin: "16px",
    				color: "#000",
    				background: "#fff8e1",
    				shadow: "#fff8e1",
    				icon: "save",
    				position: "top-right"
    			},
    			$$inline: true
    		});

    	fab1.$on("click", /*saveNote*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(fab0.$$.fragment);
    			t = space();
    			create_component(fab1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fab0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(fab1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fab0.$$.fragment, local);
    			transition_in(fab1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fab0.$$.fragment, local);
    			transition_out(fab1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fab0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(fab1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(183:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (180:2) {#if window.document.body.classList.contains('dark')}
    function create_if_block$3(ctx) {
    	let t;
    	let current;

    	const fab0 = new Fab({
    			props: {
    				fontSize: "32px",
    				margin: "16px",
    				color: "#fff",
    				background: "#212121",
    				shadow: "#212121",
    				icon: "arrow_back",
    				position: "top-left"
    			},
    			$$inline: true
    		});

    	fab0.$on("click", /*closePage*/ ctx[2]);

    	const fab1 = new Fab({
    			props: {
    				fontSize: "32px",
    				margin: "16px",
    				color: "#fff",
    				background: "#212121",
    				shadow: "#212121",
    				icon: "save",
    				position: "top-right"
    			},
    			$$inline: true
    		});

    	fab1.$on("click", /*saveNote*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(fab0.$$.fragment);
    			t = space();
    			create_component(fab1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fab0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(fab1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fab0.$$.fragment, local);
    			transition_in(fab1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fab0.$$.fragment, local);
    			transition_out(fab1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fab0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(fab1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(180:2) {#if window.document.body.classList.contains('dark')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let t0;
    	let div3;
    	let div2;
    	let input;
    	let t1;
    	let div0;
    	let label;
    	let t3;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let option5;
    	let option6;
    	let option7;
    	let option8;
    	let option9;
    	let option10;
    	let option11;
    	let option12;
    	let option13;
    	let option14;
    	let t4;
    	let div1;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block$3, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (window.document.body.classList.contains("dark")) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type();
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			t0 = space();
    			div3 = element("div");
    			div2 = element("div");
    			input = element("input");
    			t1 = space();
    			div0 = element("div");
    			label = element("label");
    			label.textContent = "Select a color";
    			t3 = space();
    			select = element("select");
    			option0 = element("option");
    			option1 = element("option");
    			option2 = element("option");
    			option3 = element("option");
    			option4 = element("option");
    			option5 = element("option");
    			option6 = element("option");
    			option7 = element("option");
    			option8 = element("option");
    			option9 = element("option");
    			option10 = element("option");
    			option11 = element("option");
    			option12 = element("option");
    			option13 = element("option");
    			option14 = element("option");
    			t4 = space();
    			div1 = element("div");
    			attr_dev(input, "class", "title svelte-14m5ln");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Title");
    			attr_dev(input, "maxlength", "60");
    			add_location(input, file$8, 188, 6, 6068);
    			attr_dev(label, "for", "color");
    			attr_dev(label, "class", "svelte-14m5ln");
    			add_location(label, file$8, 190, 8, 6201);
    			option0.__value = "#b71c1c";
    			option0.value = option0.__value;
    			set_style(option0, "background-color", "#b71c1c");
    			attr_dev(option0, "class", "svelte-14m5ln");
    			add_location(option0, file$8, 192, 10, 6327);
    			option1.__value = "#880e4f";
    			option1.value = option1.__value;
    			set_style(option1, "background-color", "#880e4f");
    			attr_dev(option1, "class", "svelte-14m5ln");
    			add_location(option1, file$8, 193, 10, 6406);
    			option2.__value = "#4a148c";
    			option2.value = option2.__value;
    			set_style(option2, "background-color", "#4a148c");
    			attr_dev(option2, "class", "svelte-14m5ln");
    			add_location(option2, file$8, 194, 10, 6485);
    			option3.__value = "#311b92";
    			option3.value = option3.__value;
    			set_style(option3, "background-color", "#311b92");
    			attr_dev(option3, "class", "svelte-14m5ln");
    			add_location(option3, file$8, 195, 10, 6564);
    			option4.__value = "#1a237e";
    			option4.value = option4.__value;
    			set_style(option4, "background-color", "#1a237e");
    			attr_dev(option4, "class", "svelte-14m5ln");
    			add_location(option4, file$8, 196, 10, 6643);
    			option5.__value = "#0d47a1";
    			option5.value = option5.__value;
    			set_style(option5, "background-color", "#0d47a1");
    			attr_dev(option5, "class", "svelte-14m5ln");
    			add_location(option5, file$8, 197, 10, 6722);
    			option6.__value = "#01579b";
    			option6.value = option6.__value;
    			set_style(option6, "background-color", "#01579b");
    			attr_dev(option6, "class", "svelte-14m5ln");
    			add_location(option6, file$8, 198, 10, 6801);
    			option7.__value = "#006064";
    			option7.value = option7.__value;
    			set_style(option7, "background-color", "#006064");
    			attr_dev(option7, "class", "svelte-14m5ln");
    			add_location(option7, file$8, 199, 10, 6880);
    			option8.__value = "#004d40";
    			option8.value = option8.__value;
    			set_style(option8, "background-color", "#004d40");
    			attr_dev(option8, "class", "svelte-14m5ln");
    			add_location(option8, file$8, 200, 10, 6959);
    			option9.__value = "#1b5e20";
    			option9.value = option9.__value;
    			set_style(option9, "background-color", "#1b5e20");
    			attr_dev(option9, "class", "svelte-14m5ln");
    			add_location(option9, file$8, 201, 10, 7038);
    			option10.__value = "#33691e";
    			option10.value = option10.__value;
    			set_style(option10, "background-color", "#33691e");
    			attr_dev(option10, "class", "svelte-14m5ln");
    			add_location(option10, file$8, 202, 10, 7117);
    			option11.__value = "#827717";
    			option11.value = option11.__value;
    			set_style(option11, "background-color", "#827717");
    			attr_dev(option11, "class", "svelte-14m5ln");
    			add_location(option11, file$8, 203, 10, 7196);
    			option12.__value = "#e65100";
    			option12.value = option12.__value;
    			set_style(option12, "background-color", "#e65100");
    			attr_dev(option12, "class", "svelte-14m5ln");
    			add_location(option12, file$8, 204, 10, 7275);
    			option13.__value = "#bf360c";
    			option13.value = option13.__value;
    			set_style(option13, "background-color", "#bf360c");
    			attr_dev(option13, "class", "svelte-14m5ln");
    			add_location(option13, file$8, 205, 10, 7354);
    			option14.__value = "#3e2723";
    			option14.value = option14.__value;
    			set_style(option14, "background-color", "#3e2723");
    			attr_dev(option14, "class", "svelte-14m5ln");
    			add_location(option14, file$8, 206, 10, 7433);
    			attr_dev(select, "id", "color");
    			attr_dev(select, "class", "svelte-14m5ln");
    			if (/*color*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[16].call(select));
    			add_location(select, file$8, 191, 8, 6252);
    			attr_dev(div0, "class", "color-selector svelte-14m5ln");
    			add_location(div0, file$8, 189, 6, 6163);
    			attr_dev(div1, "id", "editor-creator");
    			attr_dev(div1, "class", "text svelte-14m5ln");
    			add_location(div1, file$8, 209, 6, 7541);
    			attr_dev(div2, "class", "content svelte-14m5ln");
    			add_location(div2, file$8, 187, 4, 6039);
    			attr_dev(div3, "class", "body svelte-14m5ln");
    			add_location(div3, file$8, 186, 2, 6015);
    			attr_dev(main, "id", "creator-main");
    			attr_dev(main, "class", "svelte-14m5ln");
    			add_location(main, file$8, 178, 0, 5287);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			append_dev(main, t0);
    			append_dev(main, div3);
    			append_dev(div3, div2);
    			append_dev(div2, input);
    			set_input_value(input, /*title*/ ctx[0]);
    			append_dev(div2, t1);
    			append_dev(div2, div0);
    			append_dev(div0, label);
    			append_dev(div0, t3);
    			append_dev(div0, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(select, option4);
    			append_dev(select, option5);
    			append_dev(select, option6);
    			append_dev(select, option7);
    			append_dev(select, option8);
    			append_dev(select, option9);
    			append_dev(select, option10);
    			append_dev(select, option11);
    			append_dev(select, option12);
    			append_dev(select, option13);
    			append_dev(select, option14);
    			select_option(select, /*color*/ ctx[1]);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			current = true;

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[15]),
    				listen_dev(select, "change", /*select_change_handler*/ ctx[16]),
    				listen_dev(select, "change", /*changeSelect*/ ctx[5], false, false, false),
    				listen_dev(main, "scroll", /*scollEvent*/ ctx[4], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if_block.p(ctx, dirty);

    			if (dirty & /*title*/ 1 && input.value !== /*title*/ ctx[0]) {
    				set_input_value(input, /*title*/ ctx[0]);
    			}

    			if (dirty & /*color*/ 2) {
    				select_option(select, /*color*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function alertUser(text) {
    	let snackbar = new Snackbar({
    			target: document.body,
    			props: { duration: 2000, text }
    		});

    	snackbar.$set({ context: snackbar });
    }

    function instance$8($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	document.body.style.overflow = "hidden";

    	let toolbarOptions = [
    		["bold", "italic", "underline", "strike"],
    		["blockquote", "code-block"],
    		[{ "list": "ordered" }, { "list": "bullet" }],
    		[
    			{
    				"size": ["small", false, "large", "huge"]
    			}
    		],
    		[{ "background": [] }],
    		[{ "align": [] }],
    		["link", "image"],
    		["clean"]
    	];

    	let { db = null } = $$props;
    	let { context = null } = $$props;
    	let { id = null } = $$props;
    	let { date = new Date().toLocaleDateString() } = $$props;
    	let editor = null;
    	let title = "";
    	let color = "";
    	let changes = false;
    	let isToolbarFloating = false;

    	onMount(() => {
    		editor = new Quill("#editor-creator",
    		{
    				modules: { toolbar: toolbarOptions },
    				placeholder: "Note",
    				theme: "snow"
    			});

    		editor.on("text-change", function (delta, oldDelta, source) {
    			if (source === "user" && oldDelta.ops.length !== 1 && oldDelta.ops[0].insert !== "\n") {
    				changes = true;
    			}

    			if (editor.getLength() - 2 === delta.ops[0].retain) document.querySelector("#creator-main").scrollTo(0, document.querySelector("#creator-main").scrollHeight);
    		});

    		if (db !== null && id !== null) {
    			let objectStore = db.transaction(["pages"], "readwrite").objectStore("pages");
    			let request = objectStore.get(id);

    			request.onerror = function (event) {
    				console.log(event);
    				alertUser("Ops! There is a problem");
    			};

    			request.onsuccess = function (event) {
    				let data = event.target.result;

    				if (data !== undefined) {
    					$$invalidate(0, title = data.title);
    					$$invalidate(7, date = data.date);

    					if (data.color) {
    						$$invalidate(1, color = data.color);
    						document.querySelector(".color-selector select").style.background = color;
    					}

    					$$invalidate(6, id = data.id);
    					document.querySelector(".ql-editor").innerHTML = data.body;
    				}
    			};
    		}
    	});

    	onDestroy(() => {
    		document.body.style.overflow = "auto";

    		if (id) {
    			dispatch("destroy", { id });
    		}
    	});

    	function closePage() {
    		if (changes) {
    			let alert = new AlertBox({ target: document.body, props: {} });
    			alert.$set({ context: alert });

    			alert.$on("answer", event => {
    				if (event.detail.response) {
    					if (context) context.$destroy();
    				}
    			});
    		} else {
    			if (context) context.$destroy();
    		}
    	}

    	function saveNote() {
    		let text = document.querySelector(".ql-editor").innerHTML;

    		if (title === "") {
    			alertUser("Hey! You need a title...");
    			return;
    		}

    		if (text === "<p><br></p>") {
    			alertUser("Hey! You need a body...");
    			return;
    		}

    		if (db === null || editor === null) return;
    		let item = { title, body: text, date };
    		if (color) item.color = color;
    		if (id !== null) item.id = id;
    		let objectStore = db.transaction(["pages"], "readwrite").objectStore("pages");
    		let request = objectStore.put(item);

    		request.onsuccess = function (event) {
    			dispatch("creation", {});
    			if (context) context.$destroy();
    		};

    		request.onerror = function (event) {
    			console.log(event);
    			alertUser("Ops! There is a problem");
    		};
    	}

    	function scollEvent(event) {
    		let toolbar = document.querySelector(".ql-toolbar");
    		let height = toolbar.offsetHeight + 48;

    		if (event.target.scrollTop > 300) {
    			if (!isToolbarFloating) {
    				// let floatingToolbar = toolbar.cloneNode(true);
    				// let floatingToolbarButtons = floatingToolbar.querySelectorAll("button");
    				// let toolbarButtons = toolbar.querySelectorAll("button");
    				// floatingToolbarButtons.forEach((item, i) => {
    				//   item.onclick = function() {
    				//     toolbarButtons[i].click();
    				//     item.classList = toolbarButtons[i].classList;
    				//   }
    				// });
    				// floatingToolbar.classList.add("floatingToolbar");
    				// document.querySelector("#creator-main .content").append(floatingToolbar);
    				isToolbarFloating = true;

    				document.querySelector(".ql-editor").style.marginTop = height + "px";
    				toolbar.style.position = "fixed";
    			}
    		} else {
    			// document.querySelectorAll(".floatingToolbar").forEach((item, i) => {
    			//   item.parentNode.removeChild(item);
    			// });
    			document.querySelector(".ql-editor").style.marginTop = "32px";

    			toolbar.style.position = "static";
    			isToolbarFloating = false;
    		}
    	}

    	function changeSelect(e) {
    		e.target.style.background = e.target.value;
    		changes = true;
    	}

    	const writable_props = ["db", "context", "id", "date"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Creator> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Creator", $$slots, []);

    	function input_input_handler() {
    		title = this.value;
    		$$invalidate(0, title);
    	}

    	function select_change_handler() {
    		color = select_value(this);
    		$$invalidate(1, color);
    	}

    	$$self.$set = $$props => {
    		if ("db" in $$props) $$invalidate(8, db = $$props.db);
    		if ("context" in $$props) $$invalidate(9, context = $$props.context);
    		if ("id" in $$props) $$invalidate(6, id = $$props.id);
    		if ("date" in $$props) $$invalidate(7, date = $$props.date);
    	};

    	$$self.$capture_state = () => ({
    		Quill,
    		onMount,
    		onDestroy,
    		createEventDispatcher,
    		Fab,
    		Snackbar,
    		alertBox: AlertBox,
    		dispatch,
    		toolbarOptions,
    		db,
    		context,
    		id,
    		date,
    		editor,
    		title,
    		color,
    		changes,
    		isToolbarFloating,
    		closePage,
    		saveNote,
    		scollEvent,
    		alertUser,
    		changeSelect
    	});

    	$$self.$inject_state = $$props => {
    		if ("toolbarOptions" in $$props) toolbarOptions = $$props.toolbarOptions;
    		if ("db" in $$props) $$invalidate(8, db = $$props.db);
    		if ("context" in $$props) $$invalidate(9, context = $$props.context);
    		if ("id" in $$props) $$invalidate(6, id = $$props.id);
    		if ("date" in $$props) $$invalidate(7, date = $$props.date);
    		if ("editor" in $$props) editor = $$props.editor;
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("changes" in $$props) changes = $$props.changes;
    		if ("isToolbarFloating" in $$props) isToolbarFloating = $$props.isToolbarFloating;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		title,
    		color,
    		closePage,
    		saveNote,
    		scollEvent,
    		changeSelect,
    		id,
    		date,
    		db,
    		context,
    		editor,
    		changes,
    		isToolbarFloating,
    		dispatch,
    		toolbarOptions,
    		input_input_handler,
    		select_change_handler
    	];
    }

    class Creator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { db: 8, context: 9, id: 6, date: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Creator",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get db() {
    		throw new Error("<Creator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set db(value) {
    		throw new Error("<Creator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get context() {
    		throw new Error("<Creator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set context(value) {
    		throw new Error("<Creator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Creator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Creator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get date() {
    		throw new Error("<Creator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date(value) {
    		throw new Error("<Creator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\Viewer.svelte generated by Svelte v3.19.2 */

    const { console: console_1$2 } = globals;
    const file$9 = "src\\Pages\\Viewer.svelte";

    // (86:2) {:else}
    function create_else_block$1(ctx) {
    	let t0;
    	let t1;
    	let current;

    	const fab0 = new Fab({
    			props: {
    				fontSize: "32px",
    				margin: "16px",
    				color: "#000",
    				background: "#fff8e1",
    				shadow: "#fff8e1",
    				icon: "arrow_back",
    				position: "top-left"
    			},
    			$$inline: true
    		});

    	fab0.$on("click", /*closePage*/ ctx[4]);

    	const fab1 = new Fab({
    			props: {
    				fontSize: "32px",
    				margin: "16px",
    				color: "#000",
    				background: "#fff8e1",
    				shadow: "#fff8e1",
    				icon: "delete",
    				position: "top-right"
    			},
    			$$inline: true
    		});

    	fab1.$on("click", /*deleteThis*/ ctx[6]);

    	const fab2 = new Fab({
    			props: {
    				positionType: "fixed",
    				fontSize: "32px",
    				icon: "edit"
    			},
    			$$inline: true
    		});

    	fab2.$on("click", /*modify*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(fab0.$$.fragment);
    			t0 = space();
    			create_component(fab1.$$.fragment);
    			t1 = space();
    			create_component(fab2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fab0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(fab1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(fab2, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fab0.$$.fragment, local);
    			transition_in(fab1.$$.fragment, local);
    			transition_in(fab2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fab0.$$.fragment, local);
    			transition_out(fab1.$$.fragment, local);
    			transition_out(fab2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fab0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(fab1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(fab2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(86:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (82:2) {#if window.document.body.classList.contains('dark')}
    function create_if_block_4(ctx) {
    	let t0;
    	let t1;
    	let current;

    	const fab0 = new Fab({
    			props: {
    				fontSize: "32px",
    				margin: "16px",
    				color: "#fff",
    				background: "#212121",
    				shadow: "#212121",
    				icon: "arrow_back",
    				position: "top-left"
    			},
    			$$inline: true
    		});

    	fab0.$on("click", /*closePage*/ ctx[4]);

    	const fab1 = new Fab({
    			props: {
    				fontSize: "32px",
    				margin: "16px",
    				color: "#fff",
    				background: "#212121",
    				shadow: "#212121",
    				icon: "delete",
    				position: "top-right"
    			},
    			$$inline: true
    		});

    	fab1.$on("click", /*deleteThis*/ ctx[6]);

    	const fab2 = new Fab({
    			props: {
    				positionType: "fixed",
    				fontSize: "32px",
    				color: "#000",
    				background: "#fff8e1",
    				shadow: "#000",
    				icon: "edit"
    			},
    			$$inline: true
    		});

    	fab2.$on("click", /*modify*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(fab0.$$.fragment);
    			t0 = space();
    			create_component(fab1.$$.fragment);
    			t1 = space();
    			create_component(fab2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fab0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(fab1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(fab2, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fab0.$$.fragment, local);
    			transition_in(fab1.$$.fragment, local);
    			transition_in(fab2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fab0.$$.fragment, local);
    			transition_out(fab1.$$.fragment, local);
    			transition_out(fab2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fab0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(fab1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(fab2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(82:2) {#if window.document.body.classList.contains('dark')}",
    		ctx
    	});

    	return block;
    }

    // (101:29) 
    function create_if_block_3(ctx) {
    	let current;

    	const imageelement = new ImageElement({
    			props: {
    				class: "loading",
    				text: "Write down two lines",
    				src: "../media/image/empty.gif",
    				alt: "No data..."
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(imageelement.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(imageelement, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imageelement.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imageelement.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(imageelement, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(101:29) ",
    		ctx
    	});

    	return block;
    }

    // (99:29) 
    function create_if_block_2(ctx) {
    	let current;

    	const imageelement = new ImageElement({
    			props: {
    				text: "Ops! There is a problem",
    				width: "256px",
    				class: "loading",
    				src: "../media/image/error.gif",
    				alt: "Error..."
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(imageelement.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(imageelement, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imageelement.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imageelement.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(imageelement, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(99:29) ",
    		ctx
    	});

    	return block;
    }

    // (97:29) 
    function create_if_block_1$2(ctx) {
    	let current;

    	const imageelement = new ImageElement({
    			props: {
    				class: "loading",
    				src: "../media/image/loading.gif",
    				alt: "Loading..."
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(imageelement.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(imageelement, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imageelement.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imageelement.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(imageelement, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(97:29) ",
    		ctx
    	});

    	return block;
    }

    // (93:6) {#if status === 2}
    function create_if_block$4(ctx) {
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let t2;
    	let t3;
    	let div2;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(/*date*/ ctx[1]);
    			t3 = space();
    			div2 = element("div");
    			attr_dev(div0, "class", "title svelte-1y0fwbb");
    			add_location(div0, file$9, 93, 8, 2756);
    			attr_dev(div1, "class", "date svelte-1y0fwbb");
    			add_location(div1, file$9, 94, 8, 2798);
    			attr_dev(div2, "class", "text svelte-1y0fwbb");
    			add_location(div2, file$9, 95, 8, 2838);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div2, anchor);
    			div2.innerHTML = /*body*/ ctx[2];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
    			if (dirty & /*date*/ 2) set_data_dev(t2, /*date*/ ctx[1]);
    			if (dirty & /*body*/ 4) div2.innerHTML = /*body*/ ctx[2];		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(93:6) {#if status === 2}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block0;
    	let t;
    	let div1;
    	let div0;
    	let current_block_type_index_1;
    	let if_block1;
    	let current;
    	const if_block_creators = [create_if_block_4, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (window.document.body.classList.contains("dark")) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type();
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const if_block_creators_1 = [create_if_block$4, create_if_block_1$2, create_if_block_2, create_if_block_3];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*status*/ ctx[3] === 2) return 0;
    		if (/*status*/ ctx[3] === 0) return 1;
    		if (/*status*/ ctx[3] === 1) return 2;
    		if (/*status*/ ctx[3] === 3) return 3;
    		return -1;
    	}

    	if (~(current_block_type_index_1 = select_block_type_1(ctx))) {
    		if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block0.c();
    			t = space();
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "content svelte-1y0fwbb");
    			add_location(div0, file$9, 91, 4, 2699);
    			attr_dev(div1, "class", "body svelte-1y0fwbb");
    			add_location(div1, file$9, 90, 2, 2675);
    			attr_dev(main, "class", "svelte-1y0fwbb");
    			add_location(main, file$9, 80, 0, 1772);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			append_dev(main, t);
    			append_dev(main, div1);
    			append_dev(div1, div0);

    			if (~current_block_type_index_1) {
    				if_blocks_1[current_block_type_index_1].m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if_block0.p(ctx, dirty);
    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_1(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if (~current_block_type_index_1) {
    					if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    				}
    			} else {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    						if_blocks_1[previous_block_index_1] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index_1) {
    					if_block1 = if_blocks_1[current_block_type_index_1];

    					if (!if_block1) {
    						if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    						if_block1.c();
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(div0, null);
    				} else {
    					if_block1 = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();

    			if (~current_block_type_index_1) {
    				if_blocks_1[current_block_type_index_1].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function alertUser$1(text) {
    	let snackbar = new Snackbar({
    			target: document.body,
    			props: { duration: 2000, text }
    		});

    	snackbar.$set({ context: snackbar });
    }

    function instance$9($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	document.body.style.overflow = "hidden";
    	let { id = null } = $$props;
    	let { db = null } = $$props;
    	let { context = null } = $$props;
    	let title = "";
    	let date = "";
    	let body = "";
    	let status = 0;

    	onDestroy(() => {
    		document.body.style.overflow = "auto";
    	});

    	if (db !== null) {
    		let objectStore = db.transaction(["pages"], "readwrite").objectStore("pages");
    		let request = objectStore.get(id);

    		request.onerror = function (event) {
    			console.log(event);
    			alertUser$1("Ops! There is a problem");
    			$$invalidate(3, status = 1);
    		};

    		request.onsuccess = function (event) {
    			let data = event.target.result;

    			if (data !== undefined) {
    				$$invalidate(0, title = data.title);
    				$$invalidate(1, date = data.date);
    				$$invalidate(2, body = data.body);
    				$$invalidate(3, status = 2);
    			} else {
    				$$invalidate(3, status = 3);
    				alertUser$1("Ops! There is nothing about it");
    			}
    		};
    	} else {
    		status = 1;
    		alertUser$1("Ops! There is a problem");
    	}

    	function closePage() {
    		if (context) context.$destroy();
    	}

    	function modify() {
    		dispatch("modify", { id });
    		closePage();
    	}

    	function deleteThis() {
    		dispatch("delete", { id, context });
    	}

    	const writable_props = ["id", "db", "context"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Viewer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Viewer", $$slots, []);

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(7, id = $$props.id);
    		if ("db" in $$props) $$invalidate(8, db = $$props.db);
    		if ("context" in $$props) $$invalidate(9, context = $$props.context);
    	};

    	$$self.$capture_state = () => ({
    		ImageElement,
    		createEventDispatcher,
    		onDestroy,
    		Fab,
    		Snackbar,
    		dispatch,
    		id,
    		db,
    		context,
    		title,
    		date,
    		body,
    		status,
    		closePage,
    		modify,
    		deleteThis,
    		alertUser: alertUser$1
    	});

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(7, id = $$props.id);
    		if ("db" in $$props) $$invalidate(8, db = $$props.db);
    		if ("context" in $$props) $$invalidate(9, context = $$props.context);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("date" in $$props) $$invalidate(1, date = $$props.date);
    		if ("body" in $$props) $$invalidate(2, body = $$props.body);
    		if ("status" in $$props) $$invalidate(3, status = $$props.status);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, date, body, status, closePage, modify, deleteThis, id, db, context];
    }

    class Viewer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { id: 7, db: 8, context: 9 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Viewer",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get id() {
    		throw new Error("<Viewer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Viewer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get db() {
    		throw new Error("<Viewer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set db(value) {
    		throw new Error("<Viewer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get context() {
    		throw new Error("<Viewer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set context(value) {
    		throw new Error("<Viewer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Button.svelte generated by Svelte v3.19.2 */
    const file$a = "src\\Components\\Button.svelte";

    function create_fragment$a(ctx) {
    	let main;
    	let span;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			span = element("span");
    			t = text(/*title*/ ctx[0]);
    			attr_dev(span, "class", "svelte-65hlub");
    			add_location(span, file$a, 14, 2, 319);
    			set_style(main, "background-color", /*background*/ ctx[1]);
    			attr_dev(main, "class", "svelte-65hlub");
    			add_location(main, file$a, 13, 0, 253);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, span);
    			append_dev(span, t);
    			dispose = listen_dev(main, "click", /*click*/ ctx[2], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t, /*title*/ ctx[0]);

    			if (dirty & /*background*/ 2) {
    				set_style(main, "background-color", /*background*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { title = "Hello world" } = $$props;
    	let { background = "#4a148c" } = $$props;

    	function click() {
    		dispatch("click", {});
    	}

    	const writable_props = ["title", "background"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Button", $$slots, []);

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("background" in $$props) $$invalidate(1, background = $$props.background);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		title,
    		background,
    		click
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("background" in $$props) $$invalidate(1, background = $$props.background);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, background, click];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { title: 0, background: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get title() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get background() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set background(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\Option.svelte generated by Svelte v3.19.2 */
    const file$b = "src\\Pages\\Option.svelte";

    // (55:2) {:else}
    function create_else_block$2(ctx) {
    	let current;

    	const fab = new Fab({
    			props: {
    				fontSize: "32px",
    				margin: "16px",
    				color: "#000",
    				background: "#fff8e1",
    				shadow: "#fff8e1",
    				icon: "arrow_back",
    				position: "top-left"
    			},
    			$$inline: true
    		});

    	fab.$on("click", /*closePage*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(fab.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fab, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fab.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fab.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fab, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(55:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (53:2) {#if theme === "dark"}
    function create_if_block$5(ctx) {
    	let current;

    	const fab = new Fab({
    			props: {
    				fontSize: "32px",
    				margin: "16px",
    				color: "#fff",
    				background: "#212121",
    				shadow: "#212121",
    				icon: "arrow_back",
    				position: "top-left"
    			},
    			$$inline: true
    		});

    	fab.$on("click", /*closePage*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(fab.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fab, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fab.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fab.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fab, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(53:2) {#if theme === \\\"dark\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let t0;
    	let div11;
    	let div10;
    	let t1;
    	let div9;
    	let div0;
    	let label0;
    	let t3;
    	let select;
    	let option0;
    	let option1;
    	let t6;
    	let div2;
    	let label1;
    	let t8;
    	let div1;
    	let t9;
    	let t10;
    	let div4;
    	let label2;
    	let t12;
    	let div3;
    	let t13;
    	let div6;
    	let label3;
    	let t15;
    	let div5;
    	let t16;
    	let div8;
    	let label4;
    	let t18;
    	let div7;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block$5, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*theme*/ ctx[0] === "dark") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const imageelement = new ImageElement({
    			props: {
    				src: "./media/icons-web-app/ms-icon-310x310.png",
    				text: "Settings"
    			},
    			$$inline: true
    		});

    	const button0 = new Button({
    			props: {
    				title: "@maxmoffa",
    				background: "#4a148c"
    			},
    			$$inline: true
    		});

    	button0.$on("click", openAuthor);

    	const button1 = new Button({
    			props: {
    				title: "Open on Github",
    				background: "#1b5e20"
    			},
    			$$inline: true
    		});

    	button1.$on("click", openGithub);

    	const button2 = new Button({
    			props: {
    				title: "Buy me a coffee ☕",
    				background: "#ff813f"
    			},
    			$$inline: true
    		});

    	button2.$on("click", openDonation);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			t0 = space();
    			div11 = element("div");
    			div10 = element("div");
    			create_component(imageelement.$$.fragment);
    			t1 = space();
    			div9 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Theme";
    			t3 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Light";
    			option1 = element("option");
    			option1.textContent = "Dark";
    			t6 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Version";
    			t8 = space();
    			div1 = element("div");
    			t9 = text(/*version*/ ctx[1]);
    			t10 = space();
    			div4 = element("div");
    			label2 = element("label");
    			label2.textContent = "Author";
    			t12 = space();
    			div3 = element("div");
    			create_component(button0.$$.fragment);
    			t13 = space();
    			div6 = element("div");
    			label3 = element("label");
    			label3.textContent = "Github page";
    			t15 = space();
    			div5 = element("div");
    			create_component(button1.$$.fragment);
    			t16 = space();
    			div8 = element("div");
    			label4 = element("label");
    			label4.textContent = "Donations";
    			t18 = space();
    			div7 = element("div");
    			create_component(button2.$$.fragment);
    			attr_dev(label0, "for", "theme-selector");
    			attr_dev(label0, "class", "svelte-fliokg");
    			add_location(label0, file$b, 62, 10, 1928);
    			option0.__value = "light";
    			option0.value = option0.__value;
    			attr_dev(option0, "class", "svelte-fliokg");
    			add_location(option0, file$b, 64, 12, 2046);
    			option1.__value = "dark";
    			option1.value = option1.__value;
    			attr_dev(option1, "class", "svelte-fliokg");
    			add_location(option1, file$b, 65, 12, 2096);
    			attr_dev(select, "class", "svelte-fliokg");
    			if (/*theme*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[6].call(select));
    			add_location(select, file$b, 63, 10, 1981);
    			attr_dev(div0, "class", "option svelte-fliokg");
    			add_location(div0, file$b, 61, 8, 1896);
    			attr_dev(label1, "for", "theme-selector");
    			attr_dev(label1, "class", "svelte-fliokg");
    			add_location(label1, file$b, 69, 10, 2209);
    			attr_dev(div1, "class", "svelte-fliokg");
    			add_location(div1, file$b, 70, 10, 2264);
    			attr_dev(div2, "class", "option svelte-fliokg");
    			add_location(div2, file$b, 68, 8, 2177);
    			attr_dev(label2, "for", "theme-selector");
    			attr_dev(label2, "class", "svelte-fliokg");
    			add_location(label2, file$b, 73, 10, 2342);
    			attr_dev(div3, "class", "svelte-fliokg");
    			add_location(div3, file$b, 74, 10, 2396);
    			attr_dev(div4, "class", "option svelte-fliokg");
    			add_location(div4, file$b, 72, 8, 2310);
    			attr_dev(label3, "for", "theme-selector");
    			attr_dev(label3, "class", "svelte-fliokg");
    			add_location(label3, file$b, 79, 10, 2562);
    			attr_dev(div5, "class", "svelte-fliokg");
    			add_location(div5, file$b, 80, 10, 2621);
    			attr_dev(div6, "class", "option svelte-fliokg");
    			add_location(div6, file$b, 78, 8, 2530);
    			attr_dev(label4, "for", "theme-selector");
    			attr_dev(label4, "class", "svelte-fliokg");
    			add_location(label4, file$b, 85, 10, 2792);
    			attr_dev(div7, "class", "svelte-fliokg");
    			add_location(div7, file$b, 86, 10, 2849);
    			attr_dev(div8, "class", "option svelte-fliokg");
    			add_location(div8, file$b, 84, 8, 2760);
    			attr_dev(div9, "class", "options svelte-fliokg");
    			add_location(div9, file$b, 60, 6, 1865);
    			attr_dev(div10, "class", "content svelte-fliokg");
    			add_location(div10, file$b, 58, 4, 1748);
    			attr_dev(div11, "class", "body svelte-fliokg");
    			add_location(div11, file$b, 57, 2, 1724);
    			attr_dev(main, "class", "svelte-fliokg");
    			add_location(main, file$b, 51, 0, 1362);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			append_dev(main, t0);
    			append_dev(main, div11);
    			append_dev(div11, div10);
    			mount_component(imageelement, div10, null);
    			append_dev(div10, t1);
    			append_dev(div10, div9);
    			append_dev(div9, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			select_option(select, /*theme*/ ctx[0]);
    			append_dev(div9, t6);
    			append_dev(div9, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t8);
    			append_dev(div2, div1);
    			append_dev(div1, t9);
    			append_dev(div9, t10);
    			append_dev(div9, div4);
    			append_dev(div4, label2);
    			append_dev(div4, t12);
    			append_dev(div4, div3);
    			mount_component(button0, div3, null);
    			append_dev(div9, t13);
    			append_dev(div9, div6);
    			append_dev(div6, label3);
    			append_dev(div6, t15);
    			append_dev(div6, div5);
    			mount_component(button1, div5, null);
    			append_dev(div9, t16);
    			append_dev(div9, div8);
    			append_dev(div8, label4);
    			append_dev(div8, t18);
    			append_dev(div8, div7);
    			mount_component(button2, div7, null);
    			current = true;

    			dispose = [
    				listen_dev(select, "change", /*changeTheme*/ ctx[3], false, false, false),
    				listen_dev(select, "change", /*select_change_handler*/ ctx[6])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, t0);
    			}

    			if (dirty & /*theme*/ 1) {
    				select_option(select, /*theme*/ ctx[0]);
    			}

    			if (!current || dirty & /*version*/ 2) set_data_dev(t9, /*version*/ ctx[1]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(imageelement.$$.fragment, local);
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(imageelement.$$.fragment, local);
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    			destroy_component(imageelement);
    			destroy_component(button0);
    			destroy_component(button1);
    			destroy_component(button2);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function openGithub() {
    	window.open("https://github.com/MaxMoffa/MyDiary");
    }

    function openAuthor() {
    	window.open("https://dev.to/maxmoffa");
    }

    function openDonation() {
    	window.open("https://www.buymeacoffee.com/ABxD3lK");
    }

    function instance$b($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	document.body.style.overflow = "hidden";
    	let { context = null } = $$props;
    	let theme = localStorage.getItem("theme-mode-diary");
    	let version = "...";

    	if ("serviceWorker" in navigator) {
    		if (navigator.serviceWorker.controller) {
    			navigator.serviceWorker.addEventListener("message", event => {
    				$$invalidate(1, version = event.data.version);
    			});

    			navigator.serviceWorker.controller.postMessage({ action: "getVersion" });
    		}
    	}

    	function closePage() {
    		if (context) context.$destroy();
    		document.body.style.overflow = "auto";
    	}

    	function changeTheme(e) {
    		window.document.body.classList.toggle("dark");
    		$$invalidate(0, theme = e.target.value);
    		dispatch("changeTheme", { theme });
    		localStorage.setItem("theme-mode-diary", theme);
    	}

    	const writable_props = ["context"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Option> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Option", $$slots, []);

    	function select_change_handler() {
    		theme = select_value(this);
    		$$invalidate(0, theme);
    	}

    	$$self.$set = $$props => {
    		if ("context" in $$props) $$invalidate(4, context = $$props.context);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		ImageElement,
    		Fab,
    		Button,
    		dispatch,
    		context,
    		theme,
    		version,
    		closePage,
    		changeTheme,
    		openGithub,
    		openAuthor,
    		openDonation
    	});

    	$$self.$inject_state = $$props => {
    		if ("context" in $$props) $$invalidate(4, context = $$props.context);
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    		if ("version" in $$props) $$invalidate(1, version = $$props.version);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		theme,
    		version,
    		closePage,
    		changeTheme,
    		context,
    		dispatch,
    		select_change_handler
    	];
    }

    class Option extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { context: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Option",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get context() {
    		throw new Error("<Option>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set context(value) {
    		throw new Error("<Option>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Autocomplete.svelte generated by Svelte v3.19.2 */
    const file$c = "src\\Components\\Autocomplete.svelte";

    function create_fragment$c(ctx) {
    	let main;
    	let input;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			input = element("input");
    			attr_dev(input, "class", "search-bar svelte-rv2ljk");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[0]);
    			add_location(input, file$c, 15, 2, 290);
    			attr_dev(main, "class", "svelte-rv2ljk");
    			add_location(main, file$c, 14, 0, 280);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, input);
    			set_input_value(input, /*query*/ ctx[1]);

    			dispose = [
    				listen_dev(input, "input", /*search*/ ctx[2], false, false, false),
    				listen_dev(input, "input", /*input_input_handler*/ ctx[4])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*placeholder*/ 1) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[0]);
    			}

    			if (dirty & /*query*/ 2 && input.value !== /*query*/ ctx[1]) {
    				set_input_value(input, /*query*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { placeholder = "Search 🔎" } = $$props;
    	let query = "";

    	function search(text) {
    		dispatch("change", { query: text.target.value });
    	}

    	const writable_props = ["placeholder"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Autocomplete> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Autocomplete", $$slots, []);

    	function input_input_handler() {
    		query = this.value;
    		$$invalidate(1, query);
    	}

    	$$self.$set = $$props => {
    		if ("placeholder" in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		placeholder,
    		query,
    		search
    	});

    	$$self.$inject_state = $$props => {
    		if ("placeholder" in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    		if ("query" in $$props) $$invalidate(1, query = $$props.query);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [placeholder, query, search, dispatch, input_input_handler];
    }

    class Autocomplete extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { placeholder: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Autocomplete",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get placeholder() {
    		throw new Error("<Autocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Autocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.19.2 */

    const { console: console_1$3, document: document_1 } = globals;
    const file$d = "src\\App.svelte";

    // (362:24) 
    function create_if_block_6(ctx) {
    	let current;

    	const imageelement = new ImageElement({
    			props: {
    				class: "loading",
    				text: "Write down two lines",
    				src: "./media/image/empty.gif",
    				alt: "No data..."
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(imageelement.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(imageelement, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imageelement.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imageelement.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(imageelement, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(362:24) ",
    		ctx
    	});

    	return block;
    }

    // (360:24) 
    function create_if_block_5(ctx) {
    	let current;

    	const imageelement = new ImageElement({
    			props: {
    				text: "Ops! There is a problem",
    				width: "256px",
    				class: "loading",
    				src: "./media/image/error.gif",
    				alt: "Error..."
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(imageelement.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(imageelement, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imageelement.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imageelement.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(imageelement, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(360:24) ",
    		ctx
    	});

    	return block;
    }

    // (358:24) 
    function create_if_block_4$1(ctx) {
    	let current;

    	const imageelement = new ImageElement({
    			props: {
    				class: "loading",
    				src: "./media/image/loading.gif",
    				alt: "Loading..."
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(imageelement.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(imageelement, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imageelement.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imageelement.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(imageelement, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(358:24) ",
    		ctx
    	});

    	return block;
    }

    // (354:1) {#if status === 2}
    function create_if_block_3$1(ctx) {
    	let updating_items;
    	let current;

    	function grid_items_binding(value) {
    		/*grid_items_binding*/ ctx[24].call(null, value);
    	}

    	let grid_props = {
    		useTransform: true,
    		breakpoints: /*breakpoints*/ ctx[5],
    		items_arr: /*items_arr*/ ctx[2],
    		cols: 4,
    		rowHeight: 80,
    		gap: 5,
    		$$slots: {
    			default: [
    				create_default_slot,
    				({ item }) => ({ 25: item }),
    				({ item }) => item ? 33554432 : 0
    			]
    		},
    		$$scope: { ctx }
    	};

    	if (/*items_arr*/ ctx[2] !== void 0) {
    		grid_props.items = /*items_arr*/ ctx[2];
    	}

    	const grid = new Src({ props: grid_props, $$inline: true });
    	binding_callbacks.push(() => bind(grid, "items", grid_items_binding));

    	const block = {
    		c: function create() {
    			create_component(grid.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(grid, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const grid_changes = {};
    			if (dirty & /*items_arr*/ 4) grid_changes.items_arr = /*items_arr*/ ctx[2];

    			if (dirty & /*$$scope, item*/ 100663296) {
    				grid_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_items && dirty & /*items_arr*/ 4) {
    				updating_items = true;
    				grid_changes.items = /*items_arr*/ ctx[2];
    				add_flush_callback(() => updating_items = false);
    			}

    			grid.$set(grid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(grid, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(354:1) {#if status === 2}",
    		ctx
    	});

    	return block;
    }

    // (355:2) <Grid useTransform {breakpoints} {items_arr} bind:items={items_arr} cols={4} let:item rowHeight={80} gap={5}>
    function create_default_slot(ctx) {
    	let current;

    	const card = new Card({
    			props: {
    				title: /*item*/ ctx[25].name,
    				date: /*item*/ ctx[25].date,
    				id: /*item*/ ctx[25].id,
    				background: /*item*/ ctx[25].background,
    				texture: /*item*/ ctx[25].texture
    			},
    			$$inline: true
    		});

    	card.$on("click", /*viewPage*/ ctx[8]);
    	card.$on("longpress", /*contextualMenu*/ ctx[9]);
    	card.$on("contextmenu", /*contextualMenu*/ ctx[9]);

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const card_changes = {};
    			if (dirty & /*item*/ 33554432) card_changes.title = /*item*/ ctx[25].name;
    			if (dirty & /*item*/ 33554432) card_changes.date = /*item*/ ctx[25].date;
    			if (dirty & /*item*/ 33554432) card_changes.id = /*item*/ ctx[25].id;
    			if (dirty & /*item*/ 33554432) card_changes.background = /*item*/ ctx[25].background;
    			if (dirty & /*item*/ 33554432) card_changes.texture = /*item*/ ctx[25].texture;
    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(355:2) <Grid useTransform {breakpoints} {items_arr} bind:items={items_arr} cols={4} let:item rowHeight={80} gap={5}>",
    		ctx
    	});

    	return block;
    }

    // (371:2) {:else}
    function create_else_block$3(ctx) {
    	let t0;
    	let t1;
    	let current;
    	let if_block = /*deferredPrompt*/ ctx[0] !== null && create_if_block_2$1(ctx);

    	const fab0 = new Fab({
    			props: {
    				positionType: "fixed",
    				fontSize: "32px",
    				icon: "create"
    			},
    			$$inline: true
    		});

    	fab0.$on("click", /*createPage*/ ctx[7]);

    	const fab1 = new Fab({
    			props: {
    				fontSize: "32px",
    				margin: "6px",
    				color: "#000",
    				background: "#fff8e1",
    				shadow: "#fff8e1",
    				icon: "settings",
    				position: "top-right"
    			},
    			$$inline: true
    		});

    	fab1.$on("click", /*openOption*/ ctx[10]);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			create_component(fab0.$$.fragment);
    			t1 = space();
    			create_component(fab1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(fab0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(fab1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*deferredPrompt*/ ctx[0] !== null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(fab0.$$.fragment, local);
    			transition_in(fab1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(fab0.$$.fragment, local);
    			transition_out(fab1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(fab0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(fab1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(371:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (365:1) {#if theme === "dark"}
    function create_if_block$6(ctx) {
    	let t0;
    	let t1;
    	let current;
    	let if_block = /*deferredPrompt*/ ctx[0] !== null && create_if_block_1$3(ctx);

    	const fab0 = new Fab({
    			props: {
    				positionType: "fixed",
    				fontSize: "32px",
    				color: "#000",
    				background: "#fff8e1",
    				shadow: "#000",
    				icon: "create"
    			},
    			$$inline: true
    		});

    	fab0.$on("click", /*createPage*/ ctx[7]);

    	const fab1 = new Fab({
    			props: {
    				fontSize: "32px",
    				margin: "6px",
    				color: "#fff",
    				background: "#212121",
    				shadow: "#212121",
    				icon: "settings",
    				position: "top-right"
    			},
    			$$inline: true
    		});

    	fab1.$on("click", /*openOption*/ ctx[10]);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			create_component(fab0.$$.fragment);
    			t1 = space();
    			create_component(fab1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(fab0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(fab1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*deferredPrompt*/ ctx[0] !== null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(fab0.$$.fragment, local);
    			transition_in(fab1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(fab0.$$.fragment, local);
    			transition_out(fab1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(fab0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(fab1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(365:1) {#if theme === \\\"dark\\\"}",
    		ctx
    	});

    	return block;
    }

    // (372:2) {#if deferredPrompt !== null}
    function create_if_block_2$1(ctx) {
    	let current;

    	const fab = new Fab({
    			props: {
    				fontSize: "32px",
    				margin: "6px",
    				color: "#000",
    				background: "#fff8e1",
    				shadow: "#fff8e1",
    				icon: "get_app",
    				position: "top-left"
    			},
    			$$inline: true
    		});

    	fab.$on("click", /*installPwa*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(fab.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fab, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fab.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fab.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fab, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(372:2) {#if deferredPrompt !== null}",
    		ctx
    	});

    	return block;
    }

    // (366:2) {#if deferredPrompt !== null}
    function create_if_block_1$3(ctx) {
    	let current;

    	const fab = new Fab({
    			props: {
    				fontSize: "32px",
    				margin: "6px",
    				color: "#fff",
    				background: "#212121",
    				shadow: "#212121",
    				icon: "get_app",
    				position: "top-left"
    			},
    			$$inline: true
    		});

    	fab.$on("click", /*installPwa*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(fab.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fab, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fab.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fab.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fab, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(366:2) {#if deferredPrompt !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let link;
    	let t0;
    	let main;
    	let t1;
    	let t2;
    	let current_block_type_index;
    	let if_block0;
    	let t3;
    	let current_block_type_index_1;
    	let if_block1;
    	let current;
    	const header = new Header({ $$inline: true });
    	const autocomplete = new Autocomplete({ $$inline: true });
    	autocomplete.$on("change", /*refreshList*/ ctx[6]);
    	const if_block_creators = [create_if_block_3$1, create_if_block_4$1, create_if_block_5, create_if_block_6];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*status*/ ctx[3] === 2) return 0;
    		if (/*status*/ ctx[3] === 0) return 1;
    		if (/*status*/ ctx[3] === 1) return 2;
    		if (/*status*/ ctx[3] === 3) return 3;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const if_block_creators_1 = [create_if_block$6, create_else_block$3];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*theme*/ ctx[1] === "dark") return 0;
    		return 1;
    	}

    	current_block_type_index_1 = select_block_type_1(ctx);
    	if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			create_component(autocomplete.$$.fragment);
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if_block1.c();
    			attr_dev(link, "href", "https://fonts.googleapis.com/css2?family=Beth+Ellen&display=swap");
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "class", "svelte-1lx1y4o");
    			add_location(link, file$d, 1, 1, 15);
    			attr_dev(main, "class", "svelte-1lx1y4o");
    			add_location(main, file$d, 350, 0, 10241);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document_1.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t1);
    			mount_component(autocomplete, main, null);
    			append_dev(main, t2);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			append_dev(main, t3);
    			if_blocks_1[current_block_type_index_1].m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block0) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block0 = if_blocks[current_block_type_index];

    					if (!if_block0) {
    						if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block0.c();
    					}

    					transition_in(if_block0, 1);
    					if_block0.m(main, t3);
    				} else {
    					if_block0 = null;
    				}
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_1(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    					if_blocks_1[previous_block_index_1] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks_1[current_block_type_index_1];

    				if (!if_block1) {
    					if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    					if_block1.c();
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(autocomplete.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(autocomplete.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(autocomplete);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if_blocks_1[current_block_type_index_1].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function setTheme(color, changeTheme = true) {
    	if (changeTheme) window.document.body.classList.toggle("dark");
    	let theme = document.querySelector("meta[name=theme-color]");
    	let ms_theme = document.querySelector("meta[name=msapplication-TileColor]");
    	theme.setAttribute("content", color);
    	ms_theme.setAttribute("content", color);
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let refreshing;
    	let deferredPrompt = null;

    	window.addEventListener("beforeinstallprompt", e => {
    		e.preventDefault();
    		console.log(e);
    		$$invalidate(0, deferredPrompt = e);
    	});

    	if ("serviceWorker" in navigator) {
    		window.addEventListener("load", function () {
    			navigator.serviceWorker.register("./sw.js").then(
    				function (registration) {
    					console.log("ServiceWorker registration successful");

    					registration.addEventListener("updatefound", () => {
    						let update = registration.installing;

    						update.addEventListener("statechange", () => {
    							if (update.state === "installed") {
    								if (navigator.serviceWorker.controller) {
    									let snackbar = new Snackbar({
    											target: document.body,
    											props: {
    												duration: 10000,
    												text: "Nuova versione disponibile",
    												actionText: "Refresh",
    												click() {
    													update.postMessage({ action: "skipWaiting" });
    												}
    											}
    										});

    									snackbar.$set({ context: snackbar });
    								}
    							}
    						});
    					});
    				},
    				function (err) {
    					console.log("ServiceWorker registration failed: ", err);
    				}
    			);
    		});

    		navigator.serviceWorker.addEventListener("controllerchange", function () {
    			if (refreshing) return;
    			window.location.reload();
    			refreshing = true;
    		});
    	} else {
    		console.log("Ops! Il tuo browser sembra non essere compatibile con i service worker");
    	}

    	function installPwa() {
    		deferredPrompt.prompt();

    		deferredPrompt.userChoice.then(choiceResult => {
    			if (choiceResult.outcome === "accepted") {
    				console.log("PWA installata correttamente!");
    				window.location.reload();
    			} else {
    				console.log("Ops! PWA non installata...");
    			}

    			$$invalidate(0, deferredPrompt = null);
    		});
    	}

    	let theme = localStorage.getItem("theme-mode-diary");
    	let isFirstStart = false;

    	if (!theme) {
    		theme = "light";
    		localStorage.setItem("theme-mode-diary", "light");
    		isFirstStart = true;
    	}

    	if (theme === "dark") setTheme("#212121"); else setTheme("#fff8e1", false);
    	const request = window.indexedDB.open("diary", 1);
    	const breakpoints = [[1000, 2, 3]];

    	const texture = [
    		"./media/cover/inspiration-geometry.png",
    		"./media/cover/diagmonds.png",
    		"./media/cover/3px-tile.png",
    		"./media/cover/60-lines.png",
    		"./media/cover/axiom-pattern.png",
    		"./media/cover/basketball.png",
    		"./media/cover/cartographer.png",
    		"./media/cover/cubes.png"
    	];

    	const colors = [
    		"#b71c1c",
    		"#880e4f",
    		"#4a148c",
    		"#311b92",
    		"#1a237e",
    		"#0d47a1",
    		"#01579b",
    		"#006064",
    		"#004d40",
    		"#1b5e20",
    		"#33691e",
    		"#827717",
    		"#e65100",
    		"#bf360c",
    		"#3e2723"
    	];

    	let limit = 10;
    	let counter = 0;
    	let cursor = null;
    	let db = null;
    	let items_arr = [];
    	let status = 0;
    	let id = null;
    	let isScrolling = false;
    	let scrollTimer;

    	onMount(() => {
    		request.onsuccess = event => {
    			db = event.target.result;

    			if (isFirstStart) {
    				let store = db.transaction(["pages"], "readwrite").objectStore("pages");

    				let tutorial = store.put({
    					title: "Tutorial 🔥",
    					body: "<p>Welcome to <span class=\"ql-size-large\">My Diary! 🤩</span></p><p>Your first virtual diary, here are some <span style=\"background-color: rgb(102, 185, 102);\">tips and tricks</span> for you in order to better use this app:</p><ul><li><strong>Long press</strong> (or <strong>Right click</strong>) on a note will display a contextual menu (<strong>Attention!</strong> On IOS this feature doesn't work at the moment)</li><li><strong>Single click</strong> on a note will open it in reading mode</li><li>You can <strong>modify/delete</strong> a note both with the contextual menu or the options in the viewer mode</li><li>You can set a <strong>dark theme</strong> in the option menu</li><li>In order to <strong>create a note</strong> you have to access the Creator page by clicking on the button in the bottom</li><li>You can <strong>install this app</strong> by clicking on the button at the top right corner of the home (depends on the browser compatibility)</li></ul><p>For any info you can check my <a href=\"https://dev.to/maxmoffa\" target=\"_blank\" style=\"background-color: rgb(235, 214, 255);\">dev profile</a> or the page of the repository on <a href=\"https://github.com/MaxMoffa/MyDiary\" target=\"_blank\" style=\"background-color: rgb(255, 255, 204);\">Github</a></p><p>If you really like this project you can <a href=\"https://www.buymeacoffee.com/ABxD3lK\" target=\"_blank\" style=\"background-color: rgb(255, 235, 204);\">offer me a coffee</a>, every coffee will be used in order to work on projects like this one💪</p>",
    					date: new Date().toLocaleDateString()
    				});

    				tutorial.onsuccess = function (event) {
    					console.log("Tutorial generated");
    					refreshList();
    				};

    				tutorial.onerror = function (event) {
    					console.log(event);
    					console.log("Ops! There is a problem with the tutorial");
    					refreshList();
    				};
    			} else refreshList();
    		};

    		request.onerror = event => {
    			$$invalidate(3, status = 1);
    		};

    		request.onupgradeneeded = function (event) {
    			let db = event.target.result;

    			if (db.objectStoreNames.contains("pages")) {
    				db.deleteObjectStore("pages");
    			}

    			var store = db.createObjectStore("pages", { keyPath: "id", autoIncrement: true });
    			store.createIndex("title", "title", { unique: false });
    			store.createIndex("date", "date", { unique: false });
    		};
    	});

    	function refreshList(info) {
    		let query = false;

    		if (info) {
    			query = info.detail.query.toLowerCase();
    		}

    		$$invalidate(3, status = 0);
    		$$invalidate(2, items_arr = []);
    		let objectStore = db.transaction(["pages"]).objectStore("pages");

    		objectStore.openCursor().onsuccess = function (event) {
    			cursor = event.target.result;

    			if (cursor) {
    				if (!query || cursor.value.title.toLowerCase().includes(query)) {
    					let item = gridHelp.item({
    						w: 1,
    						h: 2,
    						x: 0,
    						y: 0,
    						id: cursor.key,
    						date: cursor.value.date,
    						name: cursor.value.title,
    						background: cursor.value.color
    						? cursor.value.color
    						: colors.val(counter),
    						texture: texture.val(counter),
    						static: true,
    						resizable: false
    					});

    					let findOutPosition = gridHelp.findSpaceForItem(item, items_arr, 2);
    					$$invalidate(2, items_arr = [...[{ ...item, ...findOutPosition }], ...items_arr]);
    					limit--;
    					counter++;
    				}

    				cursor.continue();
    			} else {
    				counter = 0; //if(limit > 0) cursor.continue();
    				if (limit === 10) $$invalidate(3, status = 3); else $$invalidate(3, status = 2);
    				limit = 10;
    			}
    		};
    	}

    	function createPage(event) {
    		if (event.detail.date === undefined) event.detail.date = new Date().toLocaleDateString();

    		let creator = new Creator({
    				target: document.body,
    				props: { db, id: event.detail.id }
    			});

    		creator.$set({ context: creator });

    		creator.$on("creation", () => {
    			refreshList();
    		});

    		creator.$on("destroy", event => {
    			viewPage(event);
    		});
    	}

    	function viewPage(event) {
    		if (!isScrolling) {
    			let viewer = new Viewer({
    					target: document.body,
    					props: { id: event.detail.id, db }
    				});

    			viewer.$set({ context: viewer });

    			viewer.$on("modify", event => {
    				createPage(event);
    			});

    			viewer.$on("delete", event => {
    				destroy(event.detail.id, event.detail.context);
    			});
    		}
    	}

    	function destroy(id, context) {
    		let alert = new AlertBox({ target: document.body, props: {} });
    		alert.$set({ context: alert });

    		alert.$on("answer", event => {
    			if (event.detail.response) {
    				let objectStore = db.transaction(["pages"], "readwrite").objectStore("pages");
    				let request = objectStore.delete(id);

    				request.onerror = function (event) {
    					console.log(event);
    				};

    				request.onsuccess = function (event) {
    					if (context) context.$destroy();
    					refreshList();
    				};
    			}
    		});
    	}

    	function contextualMenu(event) {
    		if (!isScrolling) {
    			event.preventDefault();
    			window.navigator.vibrate(100);

    			let menu = new ContextualMenu({
    					target: document.body,
    					props: {
    						id: event.detail.id,
    						title: event.detail.title
    					}
    				});

    			menu.$set({ context: menu });

    			menu.$on("open", event => {
    				viewPage(event);
    			});

    			menu.$on("modify", event => {
    				createPage(event);
    			});

    			menu.$on("destroy", event => {
    				destroy(event.detail.id);
    			});
    		}

    		return false;
    	}

    	function openOption() {
    		let option = new Option({ target: document.body, props: {} });
    		option.$set({ context: option });

    		option.$on("changeTheme", event => {
    			$$invalidate(1, theme = event.detail.theme);
    			if (theme === "dark") setTheme("#212121", false); else setTheme("rgb(255,248,225)", false);
    		});
    	}

    	document.body.addEventListener(
    		"scroll",
    		function (event) {
    			isScrolling = true;
    			console.log(isScrolling);
    			window.clearTimeout(scrollTimer);

    			scrollTimer = setTimeout(
    				function () {
    					isScrolling = false;
    					console.log(isScrolling);
    				},
    				500
    			);
    		},
    		false
    	);

    	Array.prototype.val = function (p) {
    		if (typeof p === "number") {
    			while (p >= this.length) p -= this.length;
    			return this[p];
    		}

    		return undefined;
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function grid_items_binding(value) {
    		items_arr = value;
    		$$invalidate(2, items_arr);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Grid: Src,
    		gridHelp,
    		Header,
    		Card,
    		ImageElement,
    		Fab,
    		ContextualMenu,
    		Creator,
    		Viewer,
    		Option,
    		Snackbar,
    		alertBox: AlertBox,
    		Autocomplete,
    		refreshing,
    		deferredPrompt,
    		installPwa,
    		theme,
    		isFirstStart,
    		request,
    		breakpoints,
    		texture,
    		colors,
    		limit,
    		counter,
    		cursor,
    		db,
    		items_arr,
    		status,
    		id,
    		isScrolling,
    		scrollTimer,
    		refreshList,
    		createPage,
    		viewPage,
    		destroy,
    		contextualMenu,
    		openOption,
    		setTheme
    	});

    	$$self.$inject_state = $$props => {
    		if ("refreshing" in $$props) refreshing = $$props.refreshing;
    		if ("deferredPrompt" in $$props) $$invalidate(0, deferredPrompt = $$props.deferredPrompt);
    		if ("theme" in $$props) $$invalidate(1, theme = $$props.theme);
    		if ("isFirstStart" in $$props) isFirstStart = $$props.isFirstStart;
    		if ("limit" in $$props) limit = $$props.limit;
    		if ("counter" in $$props) counter = $$props.counter;
    		if ("cursor" in $$props) cursor = $$props.cursor;
    		if ("db" in $$props) db = $$props.db;
    		if ("items_arr" in $$props) $$invalidate(2, items_arr = $$props.items_arr);
    		if ("status" in $$props) $$invalidate(3, status = $$props.status);
    		if ("id" in $$props) id = $$props.id;
    		if ("isScrolling" in $$props) isScrolling = $$props.isScrolling;
    		if ("scrollTimer" in $$props) scrollTimer = $$props.scrollTimer;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		deferredPrompt,
    		theme,
    		items_arr,
    		status,
    		installPwa,
    		breakpoints,
    		refreshList,
    		createPage,
    		viewPage,
    		contextualMenu,
    		openOption,
    		refreshing,
    		isFirstStart,
    		request,
    		limit,
    		counter,
    		cursor,
    		db,
    		isScrolling,
    		scrollTimer,
    		texture,
    		colors,
    		id,
    		destroy,
    		grid_items_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
