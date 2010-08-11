/**
 * BrowserObjectAPI
 * @class BrowserObjectAPI
 * @version 0.1
 * @property {Object} TABLE
 * @property {Object} CHAR_TABLE
 * @property {Number} VERSION
 * @requires _libly.js
 *
 * @example
 * let browserObjectAPI = new BrowserObjectAPI;
 */
function BrowserObjectAPI () { // {{{1
    this.VERSION = 0.1;
    this.TABLE = {
        all: {
            action: function (aTabs, aCurrentTab) aTabs,
            options: ["-all", "-a"],
            char: "a",
        },
        left: {
            action: function (aTabs, aCurrentTab) aTabs.filter(function (aTab) aTab._tPos <= aCurrentTab._tPos),
            options: ["-left", "-l"],
            char: "l",
        },
        right: {
            action: function (aTabs, aCurrentTab) aTabs.filter(function (aTab) aTab._tPos >= aCurrentTab._tPos),
            options: ["-right", "-r"],
            char: "r",
        },
        other: {
            action: function (aTabs, aCurrentTab) aTabs.filter(function (aTab) aTab._tPos != aCurrentTab._tPos),
            options: ["-other", "-o"],
            char: "o",
        },
        same: {
            action: function (aTabs, aCurrentTab) {
                let _identify = function (i) {try{return i.linkedBrowser.contentDocument.location.host}catch(e){}};
                let activeIdentify = _identify(aCurrentTab);
                return aTabs.filter(function (aTab) _identify(aTab) == activeIdentify);
            },
            options: ["-same", "-s"],
            char: "s",
        },
        current: {
            action: function (aTabs, aCurrentTab) aCurrentTab,
            options: ["-current"],
        },
    };
    this._makeCharTable();
};
BrowserObjectAPI.prototype = { // {{{1
    toString: function ()
        "[object BrowserObjectAPI]",

    get mTabs ()
        Array.filter(config.tabbrowser.mTabs, function (aNode) aNode.localName == "tab"),

    get mCurrentTab ()
        tabs.getTab(),

    get mCurrentIndex ()
        tabs.index(),

    get keys ()
        keys(this.TABLE),

    get values ()
        values(this.TABLE),

    get charKeys ()
        keys(this.CHAR_TABLE),

    get charValues ()
        values(this.CHAR_TABLE),

    /**
     * BrowserObjectAPI.add
     *
     * @param {Object} obj
     *
     * @example
     * browserObjectAPI.add({
     *     left: {
     *         action: function (aTabs, aCurrentTab) aTabs.filter(function (aTab) aTab._tPos <= aCurrentTab._tPos),
     *         options: ["-left", "-l"],
     *         char: "l",
     *     },
     * });
     */
    add: function (obj) {
        this.TABLE = libly.$U.extend(this.TABLE, obj);
        this._makeCharTable();
    },

    /**
     * BrowserObjectAPI.remove
     *
     * @param {String} selector
     * @returns {Boolean}
     */
    remove: function (selector)
        delete this.TABLE[selector],

    /**
     * BrowserObjectAPI.clear
     *
     * @returns {Array}
     */
    clear: function ()
        [this.TABLE, this.CHAR_TABLE] = [{}, {}],

    /**
     * BrowserObjectAPI.get
     *
     * @param {String} selector
     * @param {Object|Array|String} [options] {@link #_makeOptions}
     * @param {String|XULElement[]} [options.scope] {@link #_scopeTabs}
     * @param {String} [options.filter] {@link #_filterTabs}
     * @param {Boolean} [options.migemo=true] {@link #_filterTabs}
     * @param {Number} [options.count] {@link #_sliceTabs}
     * @returns {Array}
     *
     * @example
     * browserObjectAPI.get("left")
     * browserObjectAPI.get("l")
     * browserObjectAPI.get("-left")
     * browserObjectAPI.get("right", {count: 5, filter: "huga", scope:"loaded"})
     * browserObjectAPI.get("right", {scope: TreeStyleTabService.rootTabs})
     * browserObjectAPI.get("right", "loaded")
     * browserObjectAPI.get("right", TreeStyleTabService.rootTabs)
     */
    get: function (selector, options) {
        let aTabs = this.mTabs, options = this._makeOptions(options);
        let fn = this.TABLE[this._charToSelector(this._findSelector(selector))].action;
        liberator.assert(fn, "Failure, BrowserObjectAPI.get. NotFound " + selector + ".action.");
        aTabs = this._scopeTabs(aTabs, options.scope);
        aTabs = this._filterTabs(aTabs, options.filter, options.migemo);
        let ret = fn.call(this.TABLE, aTabs, this.mCurrentTab);
        if (!isarray(ret))
            ret = Array.concat(ret);
        return this._sliceTabs(ret, options.count);
    },

    /**
     * BrowserObjectAPI._makeOptions
     *
     * @param {Object|Array|String} options
     * @returns {Object}
     *
     * @example
     * browserObjectAPI._makeOptions(); //=> {}
     * browserObjectAPI._makeOptions("all"); //=> {scope: "all"}
     * browserObjectAPI._makeOptions([XULElement...]); //=> {scope: [XULElement...]}
     * browserObjectAPI._makeOptions({count: 5, scope: "all"}); //=> {count: 5, scope: "all"}
     */
    _makeOptions: function (options) {
        if (isarray(options) || isstring(options))
            return {scope: options};
        if (isobject(options))
            return options;
        return {};
    },

    /**
     * BrowserObjectAPI._findSelector
     *
     * @param {String} str
     * @returns {String}
     *
     * @example
     * browserObjectAPI._findSelector("a") //=> "a"
     * browserObjectAPI._findSelector("-a") //=> "a"
     * browserObjectAPI._findSelector("all") //=> "all"
     * browserObjectAPI._findSelector("-all") //=> "all"
     * browserObjectAPI._findSelector("-all --count 3") //=> "all"
     * browserObjectAPI._findSelector("--count 3 -all") //=> "all"
     * browserObjectAPI._findSelector("--count 3") //=> "current"
     */
    _findSelector: function (str) {
        let ret = (/(?:\s|^)+-(\w+)/).exec(str);
        return (ret && ret[1]) || str.replace(/^-/, "") || "current";
    },

    /**
     * BrowserObjectAPI._charToSelector
     *
     * @param {String} str
     * @returns {String}
     *
     * @example
     * browserObjectAPI.CHAR_TABLE = {"a":"all"};
     * browserObjectAPI._charToSelector("a") //=> "all"
     * browserObjectAPI._charToSelector("b") //=> "b"
     * browserObjectAPI._charToSelector("all") //=> "all"
     * browserObjectAPI._charToSelector("hoge") //=> "hoge"
     */
    _charToSelector: function (str)
        this.CHAR_TABLE[str] || str,

    /**
     * BrowserObjectAPI._scopeTabs
     *
     * @param {XULElement[]} aTabs
     * @param {String|XULElement[]} [scope]
     * @returns {Array}
     */
    _scopeTabs: function (aTabs, scope) {
        liberator.assert(aTabs && isarray(aTabs), "Failure, BrowserObjectAPI._scopeTabs. NotFound aTabs.");
        if (scope) {
            if (isstring(scope))
                aTabs = this.get(scope);
            else if (isarray(scope))
                aTabs = scope;
        };
        return aTabs;
    },

    /**
     * BrowserObjectAPI._filterTabs
     *
     * @param {XULElement[]} aTabs
     * @param {String} [filter]
     * @param {Boolean} [migemo=true]
     * @returns {Array}
     */
    _filterTabs: function (aTabs, filter, migemo) {
        liberator.assert(aTabs && isarray(aTabs), "Failure, BrowserObjectAPI._filterTabs. NotFound aTabs.");
        if (filter)
            let (re = RegExp((migemo != false)? XMigemoCore.getRegExp(filter): filter, "i"))
                aTabs = aTabs.filter(function (aTab) re.test(aTab.label) || re.test(aTab.linkedBrowser.currentURI.spec));
        return aTabs;
    },

    /**
     * BrowserObjectAPI._sliceTabs
     *
     * @param {XULElement[]} aTabs
     * @param {Number} [count]
     * @returns {Array}
     */
    _sliceTabs: function (aTabs, count) {
        liberator.assert(aTabs && isarray(aTabs), "Failure, BrowserObjectAPI._sliceTabs. NotFound aTabs.");
        if (count)
            aTabs = aTabs.slice(0, count + 1);
        return aTabs;
    },

    /**
     * BrowserObjectAPI.__noSuchMethod__
     *
     * @param {String} selector
     * @param {Array} args
     * @returns {Array}
     *
     * @example
     * browserObjectAPI.all(); //=> [XULElement...]
     * browserObjectAPI.hoge(); //=> []
     */
    __noSuchMethod__: function (selector, args) {
        if (this.TABLE[selector] || this.CHAR_TABLE[selector])
            return this.get.call(this, selector, args[0]);
        else
            return [];
    },

    /**
     * BrowserObjectAPI._makeCharTable
     *
     * @returns {Object}
     *
     * @example
     * browserObjectAPI.CHAR_TABLE; //=> {}
     * browserObjectAPI.TABLE = {
     *     all: {action: function (x) x, char: "a"},
     *     left: {action: function (x) x, char: "l"},
     *     right: {action: function (x) x, char: "r"},
     *     current: {action: function (x) x},
     * };
     * browserObjectAPI._makeCharTable();
     * browserObjectAPI.CHAR_TABLE; //=> {"a": "all", "l": "left", "r": "right"}
     */
    _makeCharTable: function ()
        this.CHAR_TABLE = util.Array.toObject([[j.char, i] for ([i, j] in Iterator(this.TABLE)) if (j.char)]),

    get options ()
        util.Array.compact(util.map(this.values, function (obj) obj.options && [obj.options, commands.OPTION_NOARG])),

    get subOptions ()
        [
          [["--count", "--c"], commands.OPTION_INT],
          [["--filter", "--f"], commands.OPTION_STRING],
        ],

    get fullOptions ()
        this.options.concat(this.subOptions),
};

// Extension {{{1
    let registSelectors = [];

    // TreeStyleTab {{{2
    if (liberator.hasExtension("\u30c4\u30ea\u30fc\u578b\u30bf\u30d6")) {
        registSelectors.push({
            root: {
                action: function (aTabs, aCurrentTab) TreeStyleTabService.getRootTab(aCurrentTab),
                options: ["-root"],
            },
            child: {
                action: function (aTabs, aCurrentTab) TreeStyleTabService.getChildTabs(aCurrentTab),
                options: ["-child", "-c"],
                char: "c",
            },
            descendant: {
                action: function (aTabs, aCurrentTab) TreeStyleTabService.getDescendantTabs(aCurrentTab),
                options: ["-descendant", "-d"],
                char: "d",
            },
            tree: {
                action: function (aTabs, aCurrentTab)
                    let (root = this.root.action(aTabs, aCurrentTab))
                        [root].concat(this.descendant.action(aTabs, root)),
                options: ["-tree", "-t"],
                char: "t",
            },
        });
    };

    // BarTab {{{2
    if (liberator.hasExtension("BarTab")) {
        let isTap = function (aTab) (aTab.getAttribute("ontap") == "true");
        registSelectors.push({
            loaded: {
                action: function (aTabs, aCurrentTab) aTabs.filter(function (aTab) !isTap(aTab)),
            },
            unload: {
                action: function (aTabs, aCurrentTab) aTabs.filter(function (aTab) isTap(aTab)),
            },
        });
    };

// Register {{{1
liberator.plugins.browser_object_api = new BrowserObjectAPI;
registSelectors.forEach(function (obj) liberator.plugins.browser_object_api.add(obj))

// }}}1

// vim: sw=4 ts=4 et si fdm=marker:
