/**
 * move_loaded_tab.js
 *     Bartabで読み込まれているタブだけで「次のタブ」「前のタブ」をするplugin
 *
 * map
 *     [count] gj
 *         読み込まれているタブだけで「次のタブ」
 *     [count] gk
 *         読み込まれているタブだけで「前のタブ」
 *     [count] gJ
 *         読み込まれている親タブだけで「前のタブ」
 *     [count] gK
 *         読み込まれている親タブだけで「前のタブ」
 *
 * requires
 *     [BarTab](https://addons.mozilla.org/ja/firefox/addon/67651/)
 *     [Tree Style Tab](http://piro.sakura.ne.jp/xul/_treestyletab.html)
 *     [browser_object_api.js](http://github.com/littlefolk/vimperator-plugins/blob/master/browser_object_api.js)
 */

(function(){ // {{{1
    if (liberator.plugins.browser_object_api) {
        // base {{{2
        const SELECTORS = liberator.plugins.browser_object_api;
        const TREESTYLE = TreeStyleTabService;
        let OPTION = {
            // Countがタブの先端・終端を越える数だけ与えられた場合に、反対側に飛んで続けるか、端で止まるか。
            loop: true,
        };

        // function {{{2
        let tap = function () ((SELECTORS.mCurrentTab.getAttribute("ontap") == "true")? 0: 1);
        let select = function (candidate, all, count, flag) {
            let carryover =
                (OPTION.loop)?
                    function _loopTab (all, remnant, count)
                        let (i = ((count && (count % all.length) - remnant.length) || 0))
                            (((i < 0) && i + all.length) || i):
                    function _lastTab (all, remnant)
                            (remnant.length == 1)? 0: all.length - 1;
            tabs.select((
                candidate[parseInt((flag && TREESTYLE.getParentTab(gBrowser.mCurrentTab) && ((count && count - 1) || "0")) || (count || tap()))] ||
                all[carryover(all, candidate, count)]
            )._tPos);
        };

        // mappings {{{2
        [
            [
                ['gj', 'sj'], 'Go to the next tab *loaded*.',
                function (count)
                    select(SELECTORS.get("right", "loaded"),
                           SELECTORS.get("loaded"),
                           count),
            ], [
                ['gk', 'sk'], 'Go to the previous tab *loaded*.',
                function (count)
                    select(SELECTORS.get("left", "loaded").reverse(),
                           SELECTORS.get("loaded").reverse(),
                           count),
            ], [
                ['gJ', 'sJ'], 'Go to the next *root* tab *loaded*.',
                function (count)
                    select(SELECTORS.right(SELECTORS.loaded(TREESTYLE.rootTabs)),
                           SELECTORS.loaded(TREESTYLE.rootTabs),
                           count, true),
            ], [
                ['gK', 'sK'], 'Go to the previous *root* tab *loaded*.',
                function (count)
                    select(SELECTORS.left(SELECTORS.loaded(TREESTYLE.rootTabs)).reverse(),
                           SELECTORS.loaded(TREESTYLE.rootTabs).reverse(),
                           count, true),
            ],
        ].forEach(function ([keys, description, action, flag])
              mappings.addUserMap([modes.NORMAL], keys, description, action, {count: true})
        );
    };
})(); // }}}1

// vim: sw=4 ts=4 et si fdm=marker:
