// :reloadBrowserObject --- :reload + BrowserObject {{{
(function(){
  if (liberator.plugins.browser_object_api) {
    commands.addUserCommand(
      ["reloadB[rowserObject]"], "Reload the tabs with BrowserObject",
      function (args) browser_object_api.select(args.string, args["-number"]).forEach(function (aTab) tabs.reload(aTab, args.bang)),
      {options: browser_object_api.options},
      true
    );
  };
})();

// }}}
// vim: sw=2 ts=2 et si fdm=marker:
