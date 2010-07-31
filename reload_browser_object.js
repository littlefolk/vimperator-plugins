/**
 * reload_browser_object.js
 *     BrowserObject���̃I�v�V�����Ŏw�肵���͈͂̃^�u���ēǂݍ��݂���plugin
 *
 * command
 *     reloadB[rowserObject] [-option]
 *         �����Ŏw�肵���͈͂̃^�u���ēǂݍ��݂���
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
                browser_object_api.forEach(
                  args.string,
                  {count: args["-number"], filter: args["-filter"]},
                  function (aTab) tabs.reload(aTab, args.bang)
                ),
            {options: browser_object_api.optionsFull},
            true
        );
    };
})();

// vim: sw=4 ts=4 et si fdm=marker:
