// 次の未読タブへ移動 {{{
(function(){
  if (liberator.plugins.browser_object_api) {
    let OPTION = {
      // Countがタブの先端・終端を越える数だけ与えられた場合に、反対側に飛んで続けるか、端で止まるか。
      loop: true,
    };
    let bo = liberator.plugins.browser_object_api.Selectors;
    let ts = TreeStyleTabService;
    let tap = function () (bo.BarTab.istap(gBrowser.mCurrentTab)? 0: 1);
    let select = function (candidate, all, count, flag) {
      let carryover = (OPTION.loop)?
        function (all, remnant, count) {
          let i = ((count && (count % all.length) - remnant.length) || 0);
          return (((i < 0) && i + all.length) || i);
        }:
        function (all, remnant) (remnant.length == 1)? 0: all.length - 1;
      tabs.select(
        (
          candidate[parseInt((flag && ts.getParentTab(gBrowser.mCurrentTab) && ((count && count - 1) || "0")) || (count || tap()))] || 
          all[carryover(all, candidate, count)]
        )._tPos
      );
    };

    [
      [
        ['gj', 'sj'], 'Go to the next tab *loaded*.',
        function (count) select(bo.BarTab.loaded("-right"), bo.BarTab.loaded(), count),
      ], [
        ['gk', 'sk'], 'Go to the previous tab *loaded*.',
        function (count) select(bo.BarTab.loaded("-left").reverse(), bo.BarTab.loaded().reverse(), count),
      ], [
        ['gJ', 'sJ'], 'Go to the next *root* tab *loaded*.',
        function (count) select(bo.Base.right(bo.BarTab.loaded(ts.rootTabs)), bo.BarTab.loaded(ts.rootTabs), count, true),
      ], [
        ['gK', 'sK'], 'Go to the previous *root* tab *loaded*.',
        function (count) select(bo.Base.left(bo.BarTab.loaded(ts.rootTabs)).reverse(), bo.BarTab.loaded(ts.rootTabs).reverse(), count, true),
      ],
    ].forEach(function ([keys, description, action]) mappings.addUserMap([modes.NORMAL], keys, description, action, {count: true}));
  };
})();

// }}}
// vim: sw=2 ts=2 et si fdm=marker:
