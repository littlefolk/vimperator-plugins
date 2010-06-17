liberator.plugins.alternates = (function(){ // {{{
  let _alternates = tabs._alternates;

  plugins.libly.$U.around(
    tabs,
    "updateSelectionHistory",
    function(next, args){
      _alternates.unshift(tabs.getTab());
      return next();
    },
    true
  );

  mappings.addUserMap(
    [modes.NORMAL], ["<C-^>", "<C-6>"],
    "Select the alternate tab or the [count]th tab", // FIXME: description
    function(count){
      if (count < 1)
        count = 1;
      else if (count >= _alternates.length)
        count = _alternates.length - 1;

      let alternate = (_alternates.splice(count, 1))[0];

      liberator.assert(alternate != null && tabs.getTab() != alternate, "E23: No alternate page");

      // NOTE: this currently relies on v.tabs.index() returning the
      // currently selected tab index when passed null
      let index = tabs.index(alternate);

      // TODO: since a tab close is more like a bdelete for us we
      // should probably reopen the closed tab when a 'deleted'
      // alternate is selected
      liberator.assert(index >= 0, "E86: Buffer does not exist");  // TODO: This should read "Buffer N does not exist"
      tabs.select(index);
    },
    { count: true }
  );

  return _alternates;
})(); //}}}

// vim:sw=2 ts=2 et si fenc=utf-8 fdm=marker:
