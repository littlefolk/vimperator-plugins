// 次の未読タブへ移動 {{{
(function(){
  if (liberator.plugins.browser_object_api) {
    let bo = liberator.plugins.browser_object_api;
    let ts = TreeStyleTabService;
    let tap = function () (bo.istap(gBrowser.mCurrentTab)? 0: 1);
    [
      [
        ['gj', 'sj'], 'Go to the next tab *loaded*.',
        function (count) {
          tabs.select(
            (
              bo.loaded(bo.right())[(count || tap())] ||
              bo.loaded()[((count && count - 1) || 0)] ||
              bo.loaded().pop()
            )._tPos
          );
        }
      ], [
        ['gk', 'sk'], 'Go to the previous tab *loaded*.',
        function (count) {
          tabs.select(
            (
              bo.loaded(bo.left()).reverse()[(count || tap())] ||
              bo.loaded().reverse()[((count && count - 1) || 0)] ||
              bo.loaded().shift()
            )._tPos
          );
        }
      ], [
        ['gJ', 'sJ'], 'Go to the next *root* tab *loaded*.',
        function (count) {
          let parent = ts.getParentTab(gBrowser.mCurrentTab);
          tabs.select(
            (
              bo.right(bo.loaded(ts.rootTabs))[((parent)? 0: (count || tap()))] ||
              bo.loaded(ts.rootTabs)[((count && count - 1) || 0)] ||
              bo.loaded(ts.rootTabs).pop()
            )._tPos
          );
        }
      ], [
        ['gK', 'sK'], 'Go to the previous *root* tab *loaded*.',
        function (count) {
          let parent = ts.getParentTab(gBrowser.mCurrentTab);
          tabs.select(
            (
              bo.left(bo.loaded(ts.rootTabs)).reverse()[(parent)? 0: (count || tap())] ||
              bo.loaded(ts.rootTabs).reverse()[((count && count - 1) || 0)] ||
              bo.loaded().shift()
            )._tPos
          );
        }
      ],
    ].forEach(function ([keys, description, action]) mappings.addUserMap([modes.NORMAL], keys, description, action, {count: true}));
  };
})();

// }}}
// vim: sw=2 ts=2 et si fdm=marker:
