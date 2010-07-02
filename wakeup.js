// :wakeup --- BarTabで待機させている複数のタブを、BrowserObject風のオプションで指定して読み込む {{{
// @http://github.com/philikon/BarTab/blob/master/modules/prototypes.js#L236
// @http://code.google.com/p/vimperator-labs/source/browse/common/content/tabs.js#415
// @http://code.google.com/p/vimperator-labs/source/browse/common/content/tabs.js#723
(function(){
  if (liberator.plugins.browser_object_api) {
    commands.addUserCommand(
      ['wak[eup]'], 'Wake up! Wake up! Wake up!',
      function (args)
      {
        let matches = (args.literalArg && args.literalArg.match(/^(\d+):?/));
        if (matches)
          gBrowser.BarTabHandler.loadTab(tabs.getTab(parseInt(matches[1], 10) - 1));
        else if (args.bang)
          browser_object_api.all().forEach(function (aTab) gBrowser.BarTabHandler.loadTab(aTab));
        else if (args.string)
          browser_object_api.select(args.string, args["-number"], function (aTab) gBrowser.BarTabHandler.loadTab(aTab));
      },
      {
        options: browser_object_api.options,
        argCount: "?",
        bang: true,
        count: true,
        completer: function (context) {
          context.filters.push(function(item) item.item.ontap);
          completion.buffer(context);
        },
        literal: 0
      },
      true
    );

    // mappings
    //   {g:browser_object_prefix} + w + {scope} + {target}
    browser_object_api.options.
      filter(function (arr) (arr[1] == commands.OPTION_NOARG)).
      map(function (arr) arr[0][0]).
      forEach(function (scope) {
        let _ = scope.charAt(1);
        mappings.addUserMap(
          [modes.NORMAL],
          [(liberator.globalVariables.browser_object_prefix || "") + "w" + _ + "t"],
          "wakeup " + scope + " tabs",
          function (count) browser_object_api.select("-" + _, count, function (aTab) gBrowser.BarTabHandler.loadTab(aTab)),
          {count: true}
        );
      });
  };
})();

// }}}
// vim: sw=2 ts=2 et si fdm=marker:
