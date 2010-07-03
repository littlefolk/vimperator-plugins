// :tabbo --- :tabdo + BrowserObject {{{
// @http://code.google.com/p/vimperator-labs/source/browse/common/content/tabs.js#645
(function(){
  if (liberator.plugins.browser_object_api) {
    [[['tabb[o]'], ':tabdo + BrowserObject']].concat(
      browser_object_api.options.map(function (scope) [[scope.slice(1, 3) + "[" + scope.slice(3) + "]"], ':tabbo ' + scope, scope])
    ).forEach(function ([cmd, desc, scope]) {
      commands.addUserCommand(
        cmd, desc,
        function (args) {
          if (args.literalArg != "")
          {
            let current = browser_object_api.Selectors.Base.current();
            browser_object_api.forEach(scope || args.string, {count: args["-number"]}, function (aTab) {
              tabs.select(aTab._tPos);
              liberator.execute(args[0], null, true);
            });
            tabs.select(current[0]._tPos);
          }
          else
          {
            let context = CompletionContext(args["-filter"] || "");
            context.title = ['Buffer','URL'];
            context.filters = [CompletionContext.Filter.textDescription];
            context.keys = {
              text: function (item) item._tPos + 1 + ": " + (item.label || "(Untitled)"),
              description: function (item) item.linkedBrowser.currentURI.spec,
              icon: function (item) item.image || DEFAULT_FAVICON,
              indicator: function (item) let (i = item._tPos) (i == tabs.index() && "%") || (i == tabs.index(tabs.alternate) && "#") || " ",
            };
            context.completions = browser_object_api.select(scope || args.string, {count: args["-number"]});
            let process = context.process[0];
            context.process = [function (item, text) <>
              <span highlight="Indicator" style="display: inline-block; width: 2em; text-align: center">{item.indicator}</span>
              { process.call(this, item, text) }
            </>];
            let list = template.commandOutput(
              <div highlight="Completions">
                { template.completionRow(context.title, "CompTitle") }
                { template.map(context.items, function (item) context.createRow(item), null, 100) }
              </div>);
            commandline.echo(list, commandline.HL_NORMAL, commandline.FORCE_MULTILINE);
          };
        },
        {
          argCount: "?",
          completer: function (context) completion.ex(context),
          literal: 0,
          options: (scope)?
            [
              [['-number', '-n'], commands.OPTION_INT],
              [['-filter', '-f'], commands.OPTION_STRING],
            ]:
            browser_object_api.Support.options.concat([
              [['-filter', '-f'], commands.OPTION_STRING],
            ]),
        },
        true
      );
    });
  };
})();

// }}}
// vim: sw=2 ts=2 et si fdm=marker:
