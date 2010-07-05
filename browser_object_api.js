// BrowserObject API -- liberator.plugins.browser_object_api {{{
liberator.plugins.browser_object_api = (function () {
  let Selectors = { // {{{
    // @http://piro.sakura.ne.jp/latest/blosxom/mozilla/xul/2009-01-24_tab.htm
    get collection()
      Array.filter(gBrowser.mTabs, function (aNode) aNode.localName == "tab"),

    get active()
      gBrowser.mTabContainer.selectedIndex,

    // @http://coderepos.org/share/browser/lang/javascript/vimperator-plugins/trunk/browser_object.js
    Base: {
      current: function ()
        [gBrowser.mCurrentTab],

      all: function () {
        let ary = Selectors.collection;
        return [ary[i] for (i in ary) if (i < ary.length)];
      },

      left: function (scope) {
        let ary = Support.toTabs(scope) || Selectors.collection;
        return [ary[i] for (i in ary) if (ary[i]._tPos <= Selectors.active)].reverse();
      },

      right: function (scope) {
        let ary = Support.toTabs(scope) || Selectors.collection;
        return [ary[i] for (i in ary) if (ary[i]._tPos >= Selectors.active)];
      },

      other: function (scope) {
        let ary = Support.toTabs(scope) || Selectors.collection;
        return [ary[i] for (i in ary) if (ary[i]._tPos != Selectors.active)];
      },

      same: function (scope) {
        let identify = function (i) {try{return i.linkedBrowser.contentDocument.location.host}catch(e){}};
        let ary = Support.toTabs(scope) || Selectors.collection, activeIdentify = identify(gBrowser.mCurrentTab);
        return [ary[i] for (i in ary) if (identify(ary[i]) == activeIdentify)];
      },
    },

    // @http://piro.sakura.ne.jp/xul/_treestyletab.html#focused-folding-item(folding-item-api-20)
    // @http://piro.sakura.ne.jp/xul/_treestyletab.html#focused-folding-item(folding-item-api-17)
    TreeStyleTab: {
      root: function (aTab)
        TreeStyleTabService.getRootTab(aTab || gBrowser.mCurrentTab),

      child: function (aRoot)
        TreeStyleTabService.getChildTabs(aRoot || gBrowser.mCurrentTab),

      descendant: function (aRoot)
        TreeStyleTabService.getDescendantTabs(aRoot || gBrowser.mCurrentTab),

      tree: function (aRoot)
        let (TST = Selectors.TreeStyleTab)
          [aRoot || TST.root()].concat(TST.descendant(aRoot || TST.root())),
    },

    // @http://github.com/philikon/BarTab/blob/master/modules/prototypes.js#L237
    // @http://github.com/philikon/BarTab/blob/master/modules/prototypes.js#L246
    BarTab: {
      istap: function (aTab)
        (aTab.getAttribute("ontap") == "true"),

      loaded: function (scope)
        (Support.toTabs(scope) || Selectors.Base.all()).filter(function (aTab) !Selectors.BarTab.istap(aTab)),

      unload: function (scope)
        (Support.toTabs(scope) || Selectors.Base.all()).filter(function (aTab) Selectors.BarTab.istap(aTab)),
    },
  }; // }}}

  let Support = { // {{{
    toTabs: function (scope, fail)
      ((scope && typeof (scope) == "string") && Support.charToWhere(scope, fail)) || ((scope && util.Array.isinstance(scope)) && scope),

    // @http://coderepos.org/share/browser/lang/javascript/vimperator-plugins/trunk/lo.js
    charToWhere: function (str, fail) {
      const table = {
        l: Selectors.Base.left,
        r: Selectors.Base.right,
        a: Selectors.Base.all,
        o: Selectors.Base.other,
        s: Selectors.Base.same,
        c: Selectors.TreeStyleTab.child,
        d: Selectors.TreeStyleTab.descendant,
        t: Selectors.TreeStyleTab.tree,
      };
      return ((str && (str.charAt(0) == "-") && table[str.charAt(1).toLowerCase()]) || fail || Selectors.Base.current)();
    },

    options: [
      [["-left"      , "-l"], commands.OPTION_NOARG],
      [["-right"     , "-r"], commands.OPTION_NOARG],
      [["-all"       , "-a"], commands.OPTION_NOARG],
      [["-other"     , "-o"], commands.OPTION_NOARG],
      [["-same"      , "-s"], commands.OPTION_NOARG],
      [["-child"     , "-c"], commands.OPTION_NOARG],
      [["-descendant", "-d"], commands.OPTION_NOARG],
      [["-tree"      , "-t"], commands.OPTION_NOARG],

      [["-number"    , "-n"], commands.OPTION_INT],
    ],
  }; // }}}

  let Functions = { // {{{
    /*
     * Use
     *   select("-right", {count: 15, filter: "\\d+"})
     *
     * @param {string} || {collection}
     * @param {Object}
     *   count      : {number}
     *   filter     : {string}
     *   ignoreCase : {boolean}
     *   fail       : {function}
     */
    select: function (scope, option)
    {
      let option = option || {};
      let aTabs = Support.toTabs(scope, option.fail);

      if (option.count)
        aTabs = aTabs.slice(0, option.count + 1);
      if (option.filter)
        let (re = RegExp(option.filter, "i"))
          aTabs = aTabs.filter(function (aTab) re.test(aTab.label) || re.test(aTab.linkedBrowser.currentURI.spec));

      return aTabs;
    },

    /*
     * Use
     *   forEach("-right", {count: 15, limit: 25, filter: "\\d+"}, function (aTab) liberator.echo(aTab))
     *
     * @param {string} || {collection}
     * @param {Object}
     *   count      : {number}
     *   limit      : {number}
     *   filter     : {string}
     *   ignoreCase : {boolean}
     *   fail       : {function}
     * @param {function}
     */
     forEach: function (scope, option, func)
     {
      let aTabs = Functions.select(scope, option);

      if (func && Object.prototype.toString.call(func) === "[object Function]")
      {
        if (aTabs.length <= (option.limit || 25))
          aTabs.forEach(func)
        else
          commandline.input(
            "Selected " + aTabs.length + " tabs, Do? [Y/n]: ",
            function (input) commandline.close() || (input && input.charAt(0).toLowerCase() == "y") && aTabs.forEach(func)
          );
      };
    },
  }; // }}}

  return {
    Selectors: Selectors,
    Support: Support,
    Functions: Functions,
    select: Functions.select,
    forEach: Functions.forEach,
    options: Support.options.
      filter(function (arr) (arr[1] == commands.OPTION_NOARG)).
      map(function (arr) arr[0][0]),
  };
})();

// }}}
// vim: sw=2 ts=2 et si fdm=marker:
