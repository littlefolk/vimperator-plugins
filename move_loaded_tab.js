// 次の未読タブへ移動 {{{
(function(){
  if (liberator.plugins.browser_object_api) {
    let bo = liberator.plugins.browser_object_api;
    let ts = TreeStyleTabService;
    let tap = function () (bo.istap(gBrowser.mCurrentTab)? 0: 1);
    let carryover = function (all, remnant, count) {
      let i = ((count && (count % all.length) - remnant.length) || 0);
      if (i < 0)
        i += all.length;
      return i;
    };
    [
      [
        ['gj', 'sj'], 'Go to the next tab *loaded*.',
        function (count) {
          let right = bo.loaded(bo.right()), all = bo.loaded();
          tabs.select(
            (
              right[(count || tap())] ||
              all[carryover(all, right, count)]
            )._tPos
          );
        }
      ], [
        ['gk', 'sk'], 'Go to the previous tab *loaded*.',
        function (count) {
          let left = bo.loaded(bo.left()).reverse(), all = bo.loaded().reverse();
          tabs.select(
            (
              left[(count || tap())] ||
              all[carryover(all, left, count)]
            )._tPos
          );
        }
      ], [
        ['gJ', 'sJ'], 'Go to the next *root* tab *loaded*.',
        function (count) {
          let parent = ts.getParentTab(gBrowser.mCurrentTab);
          let right = bo.right(bo.loaded(ts.rootTabs)), all = bo.loaded(ts.rootTabs);
          tabs.select(
            (
              right[(parent && 0) || (count || tap())] ||
              all[carryover(all, right, count)]
            )._tPos
          );
        }
      ], [
        ['gK', 'sK'], 'Go to the previous *root* tab *loaded*.',
        function (count) {
          let parent = ts.getParentTab(gBrowser.mCurrentTab);
          let left = bo.left(bo.loaded(ts.rootTabs)).reverse(), all = bo.loaded(ts.rootTabs).reverse();
          tabs.select(
            (
              left[(parent && 0) || (count || tap())] ||
              all[carryover(all, left, count)]
            )._tPos
          );
        }
      ],
    ].forEach(function ([keys, description, action]) mappings.addUserMap([modes.NORMAL], keys, description, action, {count: true}));
  };
})();

// }}}
// vim: sw=2 ts=2 et si fdm=marker:
