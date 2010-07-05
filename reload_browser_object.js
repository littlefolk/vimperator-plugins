// :reloadBrowserObject --- :reload + BrowserObject {{{
(function(){
  if (liberator.plugins.browser_object_api) {
    commands.addUserCommand(
      ["reloadB[rowserObject]"], "Reload the tabs with BrowserObject",
      function (args) browser_object_api.forEach(args.string, {count: args["-number"], filter: args["-filter"]}, function (aTab) tabs.reload(aTab, args.bang)),
      {options: browser_object_api.optionsFull},
      true
    );
  };
})();

// }}}
// vim: sw=2 ts=2 et si fdm=marker:
