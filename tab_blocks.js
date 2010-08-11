/**
 * Tab Blocks
 *     隣接するタブが同じドメインなタブ列を、ブロックとして扱かってタブ選択をする
 *
 * map
 *     gb^
 *         現在のブロックの先頭タブに移動
 *     gb$
 *         現在のブロックの最終タブに移動
 *     [count]gbp
 *         前のブロックの最終タブに移動
 *     [count]gbn
 *         次のブロックの先頭タブに移動
 *     [count]gbP
 *         前のブロックの最終タブに移動(読み込まれているタブから)
 *     [count]gbN
 *         次のブロックの先頭タブに移動(読み込まれているタブから)
 *
 * requires
 *     [BarTab](https://addons.mozilla.org/ja/firefox/addon/67651/)
 *     [Tree Style Tab](http://piro.sakura.ne.jp/xul/_treestyletab.html)
 *     [_libly.js](http://coderepos.org/share/browser/lang/javascript/vimperator-plugins/trunk/_libly.js)
 *     [browser_object_api.js](http://github.com/littlefolk/vimperator-plugins/blob/master/browser_object_api.js)
 */

(function(){
    if (liberator.plugins.browser_object_api) {
        liberator.plugins.Block = function (flag) { // {{{1
            let mTabs = browser_object_api.get((flag)? "loaded": "all");
            let mCurrentIndex = browser_object_api.mCurrentIndex;
            let mTabHost = function (aTab) {try{return aTab.linkedBrowser.contentDocument.location.host}catch(e){}};
            let mTabIsTap = function (aTab) !!(aTab.getAttribute("ontap") == "true");
            let mTabIsParent = function (aTab) !(TreeStyleTabService.getParentTab(aTab));
            let tabBlocks = [], cacheHost, cacheTap, cacheIndex;
            mTabs.forEach(function (aTab) {
                let [tabHost, tabTap] = [mTabHost(aTab), mTabIsTap(aTab)];
                if ((cacheHost != tabHost || cacheTap != tabTap) && mTabIsParent(aTab)) {
                    tabBlocks.push([]);
                    [cacheHost, cacheTap] = [tabHost, tabTap];
                };
                let (index = tabBlocks.length - 1) {
                    tabBlocks[index].push(aTab);
                    if (aTab._tPos == mCurrentIndex)
                        cacheIndex = index;
                };
            });
            let method = { // {{{2
                get activeBlockIndex ()
                    cacheIndex,

                activeBlock: function ()
                    this.__proto__[this.activeBlockIndex] || [],

                activeBlockTop: function ()
                    this.activeBlock()[0],

                activeBlockEnd: function ()
                    this.activeBlock().reverse()[0],

                previousBlock: function (i)
                    this.__proto__[this.activeBlockIndex - (i || 1)] || [],

                previousBlockTop: function (i)
                    this.previousBlock(i)[0],

                previousBlockEnd: function (i)
                    this.previousBlock(i).reverse()[0],

                nextBlock: function (i)
                    this.__proto__[this.activeBlockIndex + (i || 1)] || [],

                nextBlockTop: function (i)
                    this.nextBlock(i)[0],

                nextBlockEnd: function (i)
                    this.nextBlock(i).reverse()[0],

                firstBlock: function ()
                    this.__proto__[0] || [],

                firstBlockTop: function ()
                    this.firstBlock()[0],

                firstBlockEnd: function ()
                    this.firstBlock().reverse()[0],

                lastBlock: function ()
                    this.__proto__.reverse()[0] || [],

                lastBlockTop: function ()
                    this.lastBlock()[0],

                lastBlockEnd: function ()
                    this.lastBlock().reverse()[0],
            };
            // }}}
            return libly.$U.extend(util.Array(tabBlocks), method);
        };

        // mappings {{{1
        [
            [
                "^", "Switch to the this Block's first tab.",
                function ()
                    let (block = plugins.Block())
                        let (target = block.activeBlockTop())
                            tabs.select(target && target._tPos.toString()),
            ],
            [
                "$", "Switch to the this Block's last tab.",
                function ()
                    let (block = plugins.Block())
                        let (target = block.activeBlockEnd())
                            tabs.select(target && target._tPos.toString()),
            ],
            [
                "p", "Switch to the Previous Block's first tab.",
                function (count)
                    let (block = plugins.Block())
                        let (target = block.previousBlockEnd(count), sub = block.lastBlockEnd())
                            tabs.select((target && target._tPos.toString()) || (sub && sub._tPos.toString())),
            ],
            [
                "n", "Switch to the Next Block's first tab.",
                function (count)
                    let (block = plugins.Block())
                        let (target = block.nextBlockTop(count), sub = block.firstBlockTop())
                            tabs.select((target && target._tPos.toString()) || (sub && sub._tPos.toString())),
            ],
            [
                "P", "Switch to the Previous NotTapBlock's first tab.",
                function (count)
                    let (block = plugins.Block(true))
                        let (target = block.previousBlockEnd(count), sub = block.lastBlockEnd())
                            tabs.select((target && target._tPos.toString()) || (sub && sub._tPos.toString())),
            ],
            [
                "N", "Switch to the Next NotTapBlock's first tab.",
                function (count)
                    let (block = plugins.Block(true))
                        let (target = block.nextBlockTop(count), sub = block.firstBlockTop())
                            tabs.select((target && target._tPos.toString()) || (sub && sub._tPos.toString())),
            ],
        ].map(function ([cmd, desc, func]) mappings.addUserMap([modes.NORMAL], ["gb" + cmd], desc, func, {count: true}));

        // }}}1
    };
})();

// vim: sw=4 ts=4 et si fdm=marker:
