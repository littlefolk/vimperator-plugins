// ex_quickmark {{{
liberator.plugins.exqmarks = (function () {
  if (liberator.plugins.browser_object_api) {
    let $ = { // {{{
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
        echo: function (str) liberator.echo("QuickMark: " + str),
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
        type: commands.OPTION_STRING,
        validator: $.util.check,
      },

      append: {
        type: commands.OPTION_STRING,
        cmd: function (qmark, arg)
          (qmark && arg) && this.func(qmark, arg),
        func: function (qmark, location) {
          $.set(qmark, $.get(qmark).concat(
            (browser_object_api[location])?
              browser_object_api[location]().map(function (aTab) aTab.linkedBrowser.lastURI.spec):
              $.util.toArray($.util.toString(Commands.argTypes[commands.OPTION_LIST].parse(toString(location))))
          ));
          $.util.echo("Append '" + qmark + "' @ " + location);
        },
        completer: browser_object_api.options
                     .filter(function (arr) (arr[1] == commands.OPTION_NOARG))
                     .map(function (arr) arr[0][0].slice(1))
                     .map(function (str) [str, "BrowserObject " + str]),
      },

      pop: {
        type: commands.OPTION_INT,
        cmd: function (qmark, count)
          util.copyToClipboard($.util.toString(this.func(qmark, count || 1))),
        func: function (qmark, count) {
          let marks = $.get(qmark);
          let res = [];
          for (let i = 0, l = count; i < l; i++)
            res.push(marks.pop());
          res = res.reverse();
          $.set(qmark, marks);
          $.util.echo("Pop '" + qmark + "' @ " + res);
          return res;
        },
      },

      push: {
        type: commands.OPTION_LIST,
        cmd: function (qmark, arg) 
          (qmark && arg) && this.func(qmark, $.util.toString(arg)),
        func: function (qmark, location) {
          let marks = $.get(qmark);
          let arr = $.util.toArray(location);
          for (let i = 0, l = arr.length; i < l; i++)
            marks.push(arr[i]);
          $.set(qmark, marks);
          $.util.echo("Push '" + qmark + "' @ " + location);
        },
      },

      shift: {
        type: commands.OPTION_INT,
        cmd: function (qmark, count)
          util.copyToClipboard($.util.toString(this.func(qmark, count || 1))),
        func: function (qmark, count) {
          let marks = $.get(qmark);
          let res = [];
          for (let i = 0, l = count; i < l; i++)
            res.push(marks.shift());
          res = res.reverse();
          $.set(qmark, marks);
          $.util.echo("Shift '" + qmark + "' @ " + res);
          return res;
        },
      },

      unshift: {
        type: commands.OPTION_LIST,
        cmd: function (qmark, arg)
          (qmark && arg) && this.func(qmark, $.util.toString(arg)),
        func: function (qmark, location) {
          let marks = $.get(qmark);
          let arr = $.util.toArray(location).reverse();
          for (let i = 0, l = arr.length; i < l; i++)
            marks.unshift(a[i]);
          $.set(qmark, marks);
          $.util.echo("Unshift '" + qmark + "' @ " + location);
        },
      },

      uniq: {
        cmd: function (qmark)
          this.func(qmark),
        func: function (qmark) {
          let marks = $.get(qmark);
          let res = util.Array.uniq($.get(qmark), true)
          $.set(qmark, res);
          $.util.echo("Uniq '" + qmark + "' @ " + marks.length + "->" + res.length);
        },
      },

      sort: {
        cmd: function (qmark)
          this.func(qmark),
        func: function (qmark) {
          $.set(qmark, $.get(qmark).sort());
          $.util.echo("Sort '" + qmark + "'");
        },
      },

      reverse: {
        cmd: function (qmark)
          this.func(qmark),
        func: function (qmark) {
          $.set(qmark, $.get(qmark).reverse());
          $.util.echo("Reverse '" + qmark + "'");
        },
      },

      copy: {
        cmd: function (qmark)
          this.func(qmark),
        func: function (qmark) {
          let items = $.get(qmark);
          util.copyToClipboard($.util.toString(util.stringToURLArray($.util.toString(items))));
          $.util.echo("Copy '" + qmark + "' @ " + items);
        },
      },

      remove: {
        cmd: function (qmark)
          this.func(qmark),
        func: function (qmark) {
          $.set("_", $.get(qmark));
          quickmarks.remove(qmark);
          $.util.echo("Remove '" + qmark + "'");
        },
      },

      rename: {
        type: commands.OPTION_STRING,
        cmd: function (qmark, arg)
          (qmark && arg) && this.func(qmark, arg),
        func: function (from, to) {
          if (REGISTRY_IS_APPEND)
            api.append(to, $.get(from), false);
          else
            $.set(to, $.get(from));
          $.util.echo("Rename '" + from + "' to '" + to + "'");
          api.remove(from);
        },
        validator: $.util.check,
      },

      echo: {
        cmd: function (qmark)
          this.func(qmark),
        func: function (qmark) {
          let items = $.get(qmark);
          if (items.length)
            liberator.echo("QuickMark: Echo '" + qmark + "' @ " + items.length + "items" + 
                           <ol>{items.map(function (item) <li>{template.highlightURL(item)}</li>).reduce(function(a,b) a+b)}</ol>,
                           commandline.FORCE_MULTILINE);
          else
            $.util.echo("Echo '" + qmark + "' @ 0items");
        },
      },

    }; // }}}
    // commands {{{
      commands.addUserCommand(
        ["exq[mark]"], "Extended quickmark",
        function (args)
        {
          let qmark = args["-qmark"] || args[0];
          liberator.assert(qmark && $.util.check(qmark),
                           "E471: QuickMark's Name Argument required (-qmark is " + qmark + ")");
          let parse = args.string.match(/-(?!qmark)\w+(\s|$)/gi);
          if (parse)
            parse.map(function (s) s.trim().slice(1))
              .filter(function (command) api[command])
              .forEach(function (command) api[command].cmd(qmark, args["-" + command]));
          else
              api.echo.func(qmark);
        },
        {
          argCount: "*",
          completer: function (context)
          {
            context.title = ["QuickMark", "URLs"];
            context.completions = $._qmarks;
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
