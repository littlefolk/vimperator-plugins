/**
 * reload_browser_object.js
 *     BrowserObject風のオプションで指定した範囲のタブを再読み込みするplugin
 *
 * command
 *     reloadB[rowserObject] [-option]
 *         引数で指定した範囲のタブを再読み込みする
 *
 * requires
 *     [browser_object_api.js](http://github.com/littlefolk/vimperator-plugins/blob/master/browser_object_api.js)
 */

(function(){
    if (liberator.plugins.browser_object_api) {
        commands.addUserCommand(
            ["reloadB[rowserObject]"],
            "Reload some tabs with BrowserObject",
            function (args)
                browser_object_api.get(args.string, {count: args["--count"], filter: args["--filter"]})
                                      .forEach(function (aTab) tabs.reload(aTab, args.bang)),
            {options: browser_object_api.fullOptions},
            true
        );
    };
})();

// vim: sw=4 ts=4 et si fdm=marker:
