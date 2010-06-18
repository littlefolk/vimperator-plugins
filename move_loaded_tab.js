// 次の未読タブへ移動 {{{
(function(){
  if (liberator.plugins.browser_object_api) {
    let tap = function () (browser_object_api.istap(gBrowser.mCurrentTab)? 0: 1);
    [
      [
        ['gj', 'sj'], 'Go to the next tab *loaded*.',
        function (count) {
          tabs.select(
            (
              browser_object_api.loaded(browser_object_api.right())[(count || tap())] ||
              browser_object_api.loaded()[((count && count - 1) || 0)] ||
              browser_object_api.loaded().pop()
            )._tPos
          );
        }
      ], [
        ['gk', 'sk'], 'Go to the previous tab *loaded*.',
        function (count) {
          tabs.select(
            (
              browser_object_api.loaded(browser_object_api.left()).reverse()[(count || tap())] ||
              browser_object_api.loaded().reverse()[((count && count - 1) || 0)] ||
              browser_object_api.loaded().shift()
            )._tPos
          );
        }
      ], [
        ['gJ', 'sJ'], 'Go to the next *root* tab *loaded*.',
        function (count) {
          let parent = TreeStyleTabService.getParentTab(gBrowser.mCurrentTab);
          tabs.select(
            (
              browser_object_api.right(browser_object_api.loaded(TreeStyleTabService.rootTabs))[((parent)? 0: (count || tap()))] ||
              browser_object_api.loaded(TreeStyleTabService.rootTabs)[((count && count - 1) || 0)] ||
              browser_object_api.loaded(TreeStyleTabService.rootTabs).pop()
            )._tPos
          );
        }
      ], [
        ['gK', 'sK'], 'Go to the previous *root* tab *loaded*.',
        function (count) {
          let parent = TreeStyleTabService.getParentTab(gBrowser.mCurrentTab);
          tabs.select(
            (
              browser_object_api.left(browser_object_api.loaded(TreeStyleTabService.rootTabs)).reverse()[(parent)? 0: (count || tap())] ||
              browser_object_api.loaded(TreeStyleTabService.rootTabs).reverse()[((count && count - 1) || 0)] ||
              browser_object_api.loaded().shift()
            )._tPos
          );
        }
      ],
    ].forEach(function ([keys, description, action]) mappings.addUserMap([modes.NORMAL], keys, description, action, {count: true}));
  };
})();

// }}}
// vim: sw=2 ts=2 et si fdm=marker:
