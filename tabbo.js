/**
 * tabbo.js
 *     browser_object.js���̃I�v�V�����ōi�荞�񂾕����^�u�ɑ΂��ē����R�}���h�����s������plugin
 *     �����̃R�}���h�u:tabdo�v�͑S�Ẵ^�u�Ŏ��s����܂����A�u:tabbo�v�ł͎w�肵���͈͂̃^�u�݂̂Ŏ��s����܂��B
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
        let moreCommands = browser_object_api.options.map(function (scope) [[scope], ":tabbo -" + scope, scope]);

        (baseCommands.concat(moreCommands)).forEach(function ([cmd, desc, scope]) {
            commands.addUserCommand(
                cmd, desc,
                function (args) {
                    if (args.literalArg != "") {
                        let current = browser_object_api.Selectors.Base.current();
                        browser_object_api.forEach(scope || args.string, {count: args["-number"], filter: args["-filter"]}, function (aTab) {
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
                        context.completions = browser_object_api.select(scope || args.string, {count: args["-number"], filter: args["-filter"]});
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
                    options: browser_object_api[(scope? "optionsPlus": "optionsFull")],
                },
                true
            );
        });
    };
})();

// vim: sw=4 ts=4 et si fdm=marker:
