/**
 * wakeup.js
 *     BarTabで待機させている複数のタブを、BrowserObject風のオプションでタブを指定して読み込むplugin
 *
 * command
 *     wak[eup][!] [-option]
 *         引数で指定した範囲の待機させているタブを読み込む
 *
 * mappings
 *     [count] {prefix} + w + {scope} + t
 *         prefix
 *             browser_object.jsと共通で、g:browser_object_prefixに代入された文字列
 *             default: ''
 *             usage: let g:browser_object_prefix = ','
 *         scope
 *             browser_object_api.jsを参照
 *
 * requires
 *     [BarTab](https://addons.mozilla.org/ja/firefox/addon/67651/)
 *     [browser_object_api.js](http://github.com/littlefolk/vimperator-plugins/blob/master/browser_object_api.js)
 *
 * via
 *     http://github.com/philikon/BarTab/blob/master/modules/prototypes.js#L236
 *     http://code.google.com/p/vimperator-labs/source/browse/common/content/tabs.js#415
 *     http://code.google.com/p/vimperator-labs/source/browse/common/content/tabs.js#723
 */

(function(){
    if (liberator.plugins.browser_object_api) {
        commands.addUserCommand(
            ["wak[eup]"],
            "Wake up! Wake up! Wake up!",
            function (args) {
                let matches = args.literalArg && args.literalArg.match(/^(\d+):?/);
                if (matches)
                    gBrowser.BarTabHandler.loadTab(tabs.getTab(parseInt(matches[1], 10) - 1));
                else if (args.bang)
                    browser_object_api.forEach("-all", {}, function (aTab) gBrowser.BarTabHandler.loadTab(aTab));
                else if (args.string)
                    browser_object_api.forEach(args.string, {count: args["-number"], filter: args["-filter"]}, function (aTab) gBrowser.BarTabHandler.loadTab(aTab));
            }, {
                options: browser_object_api.optionsFull,
                argCount: "?",
                bang: true,
                count: true,
                completer: function (context) {
                    context.filters.push(function(item) item.item.ontap);
                    completion.buffer(context);
                },
                literal: 0,
            },
            true
        );

        browser_object_api.options.forEach(function (scope) {
            let _ = scope.charAt(1);
            mappings.addUserMap(
                [modes.NORMAL],
                [(liberator.globalVariables.browser_object_prefix || "") + "w" + _ + "t"],
                "wakeup " + scope + " tabs",
                function (count) browser_object_api.forEach("-" + _, {count: count}, function (aTab) gBrowser.BarTabHandler.loadTab(aTab)),
                {count: true}
            );
        });
    };
})();

// vim: sw=4 ts=4 et si fdm=marker:
