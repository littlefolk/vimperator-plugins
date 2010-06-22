// 次の未読タブへ移動 {{{
(function(){
  if (liberator.plugins.browser_object_api) {
    let bo = liberator.plugins.browser_object_api;
    let ts = TreeStyleTabService;
    let tap = function () (bo.istap(gBrowser.mCurrentTab)? 0: 1);
    let select = function (candidate, all, count, flag) {
      let carryover = function (all, remnant, count) {
        let i = ((count && (count % all.length) - remnant.length) || 0);
        return (((i < 0) && i + all.length) || i);
      };
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
        function (count) select(bo.loaded(bo.right()), bo.loaded(), count),
      ], [
        ['gk', 'sk'], 'Go to the previous tab *loaded*.',
        function (count) select(bo.loaded(bo.left()).reverse(), bo.loaded().reverse(), count),
      ], [
        ['gJ', 'sJ'], 'Go to the next *root* tab *loaded*.',
        function (count) select(bo.right(bo.loaded(ts.rootTabs)), bo.loaded(ts.rootTabs), count, true),
      ], [
        ['gK', 'sK'], 'Go to the previous *root* tab *loaded*.',
        function (count) select(bo.left(bo.loaded(ts.rootTabs)).reverse(), bo.loaded(ts.rootTabs).reverse(), count, true),
      ],
    ].forEach(function ([keys, description, action]) mappings.addUserMap([modes.NORMAL], keys, description, action, {count: true}));
  };
})();

// }}}
// vim: sw=2 ts=2 et si fdm=marker:
