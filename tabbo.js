// :tabbo --- :tabdo + BrowserObject {{{
// @http://code.google.com/p/vimperator-labs/source/browse/common/content/tabs.js#645
(function(){
  if (liberator.plugins.browser_object_api) {
    commands.addUserCommand(
      ['tabb[o]'], ':tabdo + BrowserObject',
      function (args) {
        let current = browser_object_api.current();
        browser_object_api.select(args.string, args["-number"]).forEach(function (aTab) {
          tabs.select(aTab._tPos);
          liberator.execute(args[0], null, true);
        });
        tabs.select(current[0]._tPos);
      },
      {
        argCount: "1",
        completer: function (context) completion.ex(context),
        literal: 0,
        options: browser_object_api.options,
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
            let current = browser_object_api.current();
            browser_object_api.select(scope, args["-number"]).forEach(function (aTab) {
              tabs.select(aTab._tPos);
              liberator.execute(args[0], null, true);
            });
            tabs.select(current[0]._tPos);
          },
          {
            argCount: "1",
            completer: function (context) completion.ex(context),
            literal: 0,
          },
          true
        );
      });
  };
})();

// }}}
// vim: sw=2 ts=2 et si fdm=marker:
