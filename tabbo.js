// :tabbo --- :tabdo + BrowserObject {{{
// @http://code.google.com/p/vimperator-labs/source/browse/common/content/tabs.js#645
(function(){
  if (liberator.plugins.browser_object_api) {
    commands.addUserCommand(
      ['tabb[o]'], ':tabdo + BrowserObject',
      function (args) {
        if (args.literalArg != "")
        {
          let current = browser_object_api.current();
          browser_object_api.select(args.string, args["-number"], function (aTab) {
            tabs.select(aTab._tPos);
            liberator.execute(args[0], null, true);
          });
          tabs.select(current[0]._tPos);
        }
        else
        {
          let context = CompletionContext(args["-filter"] || "");
          let items = browser_object_api.select(args.string, args["-number"]);
          let list = template.commandOutput(
              <div highlight="Completions">
                  { template.completionRow(['Buffer','URL'], "CompTitle") }
                  { template.map(items, function (item) context.createRow({
                      text: item.label,
                      description: item.linkedBrowser.currentURI.spec,
                      icon: item.image || DEFAULT_FAVICON,
                    }), null, 100) }
              </div>);
          commandline.echo(list, commandline.HL_NORMAL, commandline.FORCE_MULTILINE);
        };
      },
      {
        argCount: "?",
        completer: function (context) completion.ex(context),
        literal: 0,
        options: browser_object_api.options.concat([
          [['-filter', '-f'], commands.OPTION_STRING],
        ]),
      },
      true
    );

    browser_object_api.options.
      filter(function (arr) (arr[1] == commands.OPTION_NOARG)).
      map(function (arr) arr[0][0]).
      forEach(function (scope) {
        let sc___ = scope.slice(1, 3);
        let __ope = scope.slice(3);
        commands.addUserCommand(
          [sc___ + "[" + __ope + "]"], ':tabbo ' + scope,
          function (args) {
            if (args.literalArg != "")
            {
              let current = browser_object_api.current();
              browser_object_api.select(scope, args["-number"], function (aTab) {
                tabs.select(aTab._tPos);
                liberator.execute(args[0], null, true);
              });
              tabs.select(current[0]._tPos);
            }
            else
            {
              let context = CompletionContext(args["-filter"] || "");
              let items = browser_object_api.select(scope, args["-number"]);
              let list = template.commandOutput(
                  <div highlight="Completions">
                      { template.completionRow(['Buffer','URL'], "CompTitle") }
                      { template.map(items, function (item) context.createRow({
                          text: item.label,
                          description: item.linkedBrowser.currentURI.spec,
                          icon: item.image || DEFAULT_FAVICON,
                        }), null, 100) }
                  </div>);
              commandline.echo(list, commandline.HL_NORMAL, commandline.FORCE_MULTILINE);
            };
          },
          {
            argCount: "?",
            completer: function (context) completion.ex(context),
            literal: 0,
            options: [
              [['-number', '-n'], commands.OPTION_INT],
              [['-filter', '-f'], commands.OPTION_STRING],
            ],
          },
          true
        );
      });
  };
})();

// }}}
// vim: sw=2 ts=2 et si fdm=marker:
