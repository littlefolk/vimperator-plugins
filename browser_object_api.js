// BrowserObject API -- liberator.plugins.browser_object_api {{{
// @http://coderepos.org/share/browser/lang/javascript/vimperator-plugins/trunk/browser_object.js
// @http://piro.sakura.ne.jp/latest/blosxom/mozilla/xul/2009-01-24_tab.htm
liberator.plugins.browser_object_api = (function () {
  let collection = function () Array.slice(gBrowser.mTabs).filter(function (aNode) aNode.localName == 'tab');
  let active = function () gBrowser.mTabContainer.selectedIndex;
  let identify = function (i) {try{return i.linkedBrowser.contentDocument.location.host}catch(e){}};
  let browser_object_api = {
  /* BrowserObject API */
    current: function () {
      return [gBrowser.mCurrentTab];
    },
    all: function () {
      let ary = collection(), len = ary.length;
      let res = [ary[i] for (i in ary) if(i < len)];
      return res;
    },
    left: function (aTabs) {
      let ary = aTabs || collection();
      let res = [ary[i] for (i in ary) if(ary[i]._tPos <= active())];
      return res;
    },
    right: function (aTabs) {
      let ary = aTabs || collection();
      let res = [ary[i] for (i in ary) if(ary[i]._tPos >= active())];
      return res;
    },
    other: function (aTabs) {
      let ary = aTabs || collection();
      let res = [ary[i] for (i in ary) if(ary[i]._tPos != active())];
      return res;
    },
    same: function (aTabs) {
      let ary = aTabs || collection(), activeIdentify = identify(gBrowser.mCurrentTab);
      let res = [ary[i] for (i in ary) if(identify(ary[i]) == activeIdentify)];
      return res;
    },


  /* TreeStyleTab API */
    // @http://piro.sakura.ne.jp/xul/_treestyletab.html#focused-folding-item(folding-item-api-20)
    // @http://piro.sakura.ne.jp/xul/_treestyletab.html#focused-folding-item(folding-item-api-17)
    root: function (aTab)
      TreeStyleTabService.getRootTab(aTab || gBrowser.mCurrentTab),

    child: function (aRoot)
      TreeStyleTabService.getChildTabs(aRoot || gBrowser.mCurrentTab),

    descendant: function (aRoot)
      TreeStyleTabService.getDescendantTabs(aRoot || gBrowser.mCurrentTab),

    tree: function (aRoot)
      [aRoot || browser_object_api.root()].concat(browser_object_api.descendant(aRoot || browser_object_api.root())),


  /* BarTab API */
    // @http://github.com/philikon/BarTab/blob/master/modules/prototypes.js#L237
    // @http://github.com/philikon/BarTab/blob/master/modules/prototypes.js#L246
    istap: function (aTab)
      (aTab.getAttribute("ontap") == "true"),

    loaded: function (aTabs) 
      (aTabs || browser_object_api.all()).filter(function (aTab) !browser_object_api.istap(aTab)),

    unload: function (aTabs) 
      (aTabs || browser_object_api.all()).filter(function (aTab) browser_object_api.istap(aTab)),


  /* BrowserObject API Support */
    charToWhere: function (str, fail) {
    // via. lo.js
      const table = {
        l: browser_object_api.left,
        r: browser_object_api.right,
        a: browser_object_api.all,
        o: browser_object_api.other,
        s: browser_object_api.same,
        c: browser_object_api.child,
        d: browser_object_api.descendant,
        t: browser_object_api.tree,
      };
      return (str && (str.charAt(0) == "-") && table[str.charAt(1).toLowerCase()]) || fail;
    },
    select: function (str, count) {
      let tabs = browser_object_api.charToWhere(str, browser_object_api.current)();
      return (count && tabs.slice(0, count + 1)) || tabs;
    },
    options: [
      [['-left'      , '-l'], commands.OPTION_NOARG],
      [['-right'     , '-r'], commands.OPTION_NOARG],
      [['-all'       , '-a'], commands.OPTION_NOARG],
      [['-other'     , '-o'], commands.OPTION_NOARG],
      [['-same'      , '-s'], commands.OPTION_NOARG],
      [['-child'     , '-c'], commands.OPTION_NOARG],
      [['-descendant', '-d'], commands.OPTION_NOARG],
      [['-tree'      , '-t'], commands.OPTION_NOARG],

      [['-number'    , '-n'], commands.OPTION_INT],
    ],
  };

  return browser_object_api;
})();

// }}}
// vim: sw=2 ts=2 et si fdm=marker:
