// :reloadTabSubtree --- ツリーを再読み込み {{{
// @http://piro.sakura.ne.jp/xul/_treestyletab.html#focused-folding-item(folding-item-api-14)
// @http://www.cozmixng.org/retro/projects/piro/browse/treestyletab/trunk/content/treestyletab/treestyletab.xul?rev=6675#ln58
(function(){
  if (liberator.hasExtension("\u30c4\u30ea\u30fc\u578b\u30bf\u30d6")) {
    let reloadTabSubtree = function () TreeStyleTabService.reloadTabSubTree(TreeStyleTabService.getRootTab(gBrowser.mCurrentTab));
    commands.addUserCommand(
      ["reloadT[abSubtree]"], "Reload the tabs with TabSubtree",
      reloadTabSubtree,
      {}, true
    );
    mappings.addUserMap(
      [modes.NORMAL],
      [(liberator.globalVariables.browser_object_prefix || "") + "rtt"], "Reload the tabs with TabSubtree",
      reloadTabSubtree,
      {}
    );
  };
})();

// }}}
// vim: sw=2 ts=2 et si fdm=marker:
