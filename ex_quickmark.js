// ex_quickmark {{{
liberator.plugins.exqmarks = (function () {
  if (liberator.plugins.browser_object_api) {
    let qmarks = { // {{{
      init: function () {
        this._qmarks = storage.newMap("quickmarks", {store: true});
        return this;
      },
      get: function (qmark) {
        let items = this._qmarks.get(qmark);
        return this.util.toArray(items);
      },
      set: function (qmark, data) {
        if (data.length)
          this._qmarks.set(qmark, this.util.toString(data));
        else
          quickmarks.remove(qmark);
      },
      util: { // {{{
        check: function (qmark) (/^[a-zA-Z0-9]$/.test(qmark)),
        msg: function (str) liberator.echo("QuickMark: " + str),
        urlseparator: RegExp("\\s*" + options["urlseparator"] + "\\s*"),
        toArray: function (arg) {
          if (typeof(arg) == "string")
          {
            let res = arg.split(this.urlseparator);
            if (typeof(res) == "string")
              return [res];
            else
              return res;
          }
          else if (typeof(arg) == "undefined")
            return [];
          else if (typeof(arg) == "array")
            return arg;
        },
        toString: function (arg) {
          if (typeof(arg) != "string")
            return arg.join(", ");
          else
            return arg;
        },
      }, // }}}
    }.init(); // }}}
    let api = { // {{{
      qmark: {
        type: commands.OPTION_ANY,
        validator: qmarks.util.check,
      },

      append: {
        type: commands.OPTION_STRING,
        cmd: function (qmark, arg)
          (qmark && arg) && this.func(qmark, arg),
        func: function (qmark, location, silent) {
          qmarks.set(qmark, qmarks.get(qmark).concat(
            (browser_object_api[location])?
              browser_object_api[location]().map(function (aTab) aTab.linkedBrowser.lastURI.spec):
              qmarks.util.toArray(qmarks.util.toString((Commands.argTypes[commands.OPTION_LIST]).parse(toString(location))))
          ));
          qmarks.util.msg("Append '" + qmark + "' @ " + location);
        },
        completer: browser_object_api.options.
                     filter(function (arr) (arr[1] == commands.OPTION_NOARG)).
                     map(function (arr) arr[0][0].slice(1)).
                     map(function (str) [str, "BrowserObject " + str]),
      },

      pop: {
        type: commands.OPTION_INT,
        cmd: function (qmark, arg)
          util.copyToClipboard(qmarks.util.toString(this.func(qmark, arg || 1))),
        func: function (qmark, count) {
          let marks = qmarks.get(qmark);
          let res = [];
          for (let i = 0, l = count; i < l; i++)
            res.push(marks.pop());
          res = res.reverse();
          qmarks.set(qmark, marks);
          qmarks.util.msg("Pop '" + qmark + "' @ " + res);
          return res;
        },
      },

      push: {
        type: commands.OPTION_LIST,
        cmd: function (qmark, arg) 
          (qmark && arg) && this.func(qmark, qmarks.util.toString(arg)),
        func: function (qmark, location) {
          let marks = qmarks.get(qmark);
          let arr = qmarks.util.toArray(location);
          for (let i = 0, l = arr.length; i < l; i++)
            marks.push(arr[i]);
          qmarks.set(qmark, marks);
          qmarks.util.msg("Push '" + qmark + "' @ " + location);
        },
      },

      shift: {
        type: commands.OPTION_INT,
        cmd: function (qmark, arg)
          util.copyToClipboard(qmarks.util.toString(this.func(qmark, arg || 1))),
        func: function (qmark, count) {
          let marks = qmarks.get(qmark);
          let res = [];
          for (let i = 0, l = count; i < l; i++)
            res.push(marks.shift());
          res = res.reverse();
          qmarks.set(qmark, marks);
          qmarks.util.msg("Shift '" + qmark + "' @ " + res);
          return res;
        },
      },

      unshift: {
        type: commands.OPTION_LIST,
        cmd: function (qmark, arg)
          (qmark && arg) && this.func(qmark, qmarks.util.toString(arg)),
        func: function (qmark, location) {
          let marks = qmarks.get(qmark);
          let arr = qmarks.util.toArray(location).reverse();
          for (let i = 0, l = arr.length; i < l; i++)
            marks.unshift(a[i]);
          qmarks.set(qmark, marks);
          qmarks.util.msg("Unshift '" + qmark + "' @ " + location);
        },
      },

      uniq: {
        type: commands.OPTION_NOARG,
        cmd: function (qmark, arg)
          this.func(qmark),
        func: function (qmark) {
          let marks = qmarks.get(qmark);
          let res = util.Array.uniq(qmarks.get(qmark), true)
          qmarks.set(qmark, res);
          qmarks.util.msg("Uniq '" + qmark + "' @ " + marks.length + "->" + res.length);
        },
      },

      sort: {
        type: commands.OPTION_NOARG,
        cmd: function (qmark, arg)
          this.func(qmark),
        func: function (qmark, reverse) {
          qmarks.set(qmark, qmarks.get(qmark).sort());
          if (reverse)
            api.reverse(qmark);
          qmarks.util.msg("Sort '" + qmark + "'");
        },
      },

      reverse: {
        type: commands.OPTION_NOARG,
        cmd: function (qmark, arg)
          this.func(qmark),
        func: function (qmark) {
          qmarks.set(qmark, qmarks.get(qmark).reverse());
          qmarks.util.msg("Reverse '" + qmark + "'");
        },
      },

      copy: {
        type: commands.OPTION_NOARG,
        cmd: function (qmark, arg) {
          let items = qmarks.get(qmark);
          util.copyToClipboard(qmarks.util.toString(util.stringToURLArray(qmarks.util.toString(items))));
          qmarks.util.msg("Copy '" + qmark + "' @ " + items);
        },
      },

      remove: {
        type: commands.OPTION_NOARG,
        cmd: function (qmark, arg)
          this.func(qmark),
        func: function (qmark) {
          qmarks.set("_", qmarks.get(qmark));
          quickmarks.remove(qmark);
          qmarks.util.msg("Remove '" + qmark + "'");
        },
      },

      rename: {
        type: commands.OPTION_STRING,
        cmd: function (qmark, arg)
          (qmark && arg) && this.func(qmark, arg),
        func: function (from, to) {
          if (REGISTRY_IS_APPEND)
            api.append(to, qmarks.get(from), false);
          else
            qmarks.set(to, qmarks.get(from));
          qmarks.util.msg("Rename '" + from + "' to '" + to + "'");
          api.remove(from);
        },
        validator: qmarks.util.check,
      },

      echo: {
        type: commands.OPTION_NOARG,
        cmd: function (qmark, arg)
          this.func(qmark),
        func: function (qmark) {
          let items = qmarks.get(qmark);
          if (items.length)
            liberator.echo("QuickMark: Echo '" + qmark + "' @ " + items.length + "items" + 
                           <ol>{items.map(function (h) <li>{template.highlightURL(h)}</li>).reduce(function(a,b) a+b)}</ol>,
                           commandline.FORCE_MULTILINE);
          else
            qmarks.util.msg("Echo '" + qmark + "' @ 0items");
        },
      },

    }; // }}}
    // commands {{{
      commands.addUserCommand(
        ["exq[mark]"], "Extended quickmark",
        function (args)
        {
          let qmark = args["-qmark"] || args[0];
          liberator.assert(qmark, "E471: Argument required (" + qmark + ")");
          let parse = args.string.match(/-(?!qmark)\w+(\s|$)/gi)
          if (parse)
            parse.map(function (s) s.trim().slice(1))
              .filter(function (command) api[command])
              .forEach(function (command){
                api[command].cmd(qmark, args["-" + command]);
              });
          else
              api.echo.func(qmark);
        },
        {
          argCount: "*",
          completer: function (context)
          {
            context.title = ["QuickMark", "URLs"];
            context.completions = qmarks._qmarks;
          },
          options: [[key, api[key]] for (key in api)].map(function ([key, action])
            [
              ["-" + key],
              action["type"] || commands.OPTION_NOARG,
              action["validator"] || null,
              action["completer"] || null,
              true,
            ]
          ),
        },
        true
      );
    // }}}
    // mapping {{{
    // }}}
    return api;
  };
})();

// }}}
// vim:sw=2 ts=2 et si fenc=utf-8 fdm=marker:
