/**
 * tabbo.js
 *     browser_object.js風のオプションで絞り込んだ複数タブに対して同じコマンドを実行させるplugin
 *     既存のコマンド「:tabdo」は全てのタブで実行されますが、「:tabbo」では指定した範囲のタブのみで実行されます。
 *
 * command
 *     tabb[o] [-option] {cmd}
 *     left {cmd}
 *     right {cmd}
 *     all {cmd}
 *     other {cmd}
 *     same {cmd}
 *     child {cmd}
 *     descendant {cmd}
 *     tree {cmd}
 *
 * requires
 *     [browser_object_api.js](http://github.com/littlefolk/vimperator-plugins/blob/master/browser_object_api.js)
 *
 * via
 *     http://code.google.com/p/vimperator-labs/source/browse/common/content/tabs.js#645
 *     :help :tabdo
 */

(function(){
    if (liberator.plugins.browser_object_api) {
        let baseCommands = [[["tabb[o]"], ":tabdo with BrowserObject"]];
        let moreCommands = util.map(browser_object_api.keys, function (scope) [[scope], ":tabbo -" + scope, scope]);

        (baseCommands.concat(moreCommands)).forEach(function ([cmd, desc, scope]) {
            commands.addUserCommand(
                cmd, desc,
                function (args) {
                    if (args.literalArg != "") {
                        let current = browser_object_api.mCurrentTab;
                        browser_object_api.get(scope || args.string, {count: args["--count"], filter: args["--filter"]}).forEach(function (aTab) {
                            tabs.select(aTab._tPos);
                            liberator.execute(args[0], null, true);
                        });
                        tabs.select(current[0]._tPos);
                    } else {
                        let context = CompletionContext("");
                        context.title = ["Buffer","URL"];
                        context.filters = [CompletionContext.Filter.textDescription];
                        context.keys = {
                            text: function (item) item._tPos + 1 + ": " + (item.label || "(Untitled)"),
                            description: function (item) item.linkedBrowser.currentURI.spec,
                            icon: function (item) item.image || DEFAULT_FAVICON,
                            indicator: function (item) let (i = item._tPos) (i == tabs.index() && "%") || (i == tabs.index(tabs.alternate) && "#") || " ",
                        };
                        context.completions = browser_object_api.get(scope || args.string, {count: args["--count"], filter: args["--filter"]});
                        let process = context.process[0];
                        context.process = [function (item, text) <>
                            <span highlight="Indicator" style="display: inline-block; width: 2em; text-align: center">{item.indicator}</span>
                            {process.call(this, item, text)}
                        </>];
                        let list = template.commandOutput(
                            <div highlight="Completions">
                                {template.completionRow(context.title, "CompTitle")}
                                {template.map(context.items, function (item) context.createRow(item), null, 100)}
                            </div>
                        );
                        commandline.echo(list, commandline.HL_NORMAL, commandline.FORCE_MULTILINE);
                    };
                }, {
                    argCount: "?",
                    completer: function (context) completion.ex(context),
                    literal: 0,
                    options: scope? browser_object_api.optionSubs: browser_object_api.fullOptions,
                },
                true
            );
        });
    };
})();

// vim: sw=4 ts=4 et si fdm=marker:
