//
// hidden_mapping.js
//
// via. common/content/mappings.js
// via. http://vimperator.g.hatena.ne.jp/nokturnalmortum/20100128/1264675483
(function(){
    if (liberator.globalVariables.loaded_hidden_mapping)
        return;

    function addMapCommands(ch, modes, modeDescription) {
        // 0 args -> list all maps
        // 1 arg  -> list the maps starting with args
        // 2 args -> map arg1 to arg*
        function map(args, modes, noremap) {
            let urls = args['-urls'];

            if (!args.length) {
                mappings.list(modes, null, urls && RegExp(urls));
                return;
            }

            let [lhs, rhs] = args;

            if (!rhs) // list the mapping
                mappings.list(modes, mappings._expandLeader(lhs), urls && RegExp(urls));
            else {
                // this matches Vim's behaviour
                if (/^<Nop>$/i.test(rhs))
                    noremap = true;

                mappings.addUserMap(modes, [lhs],
                    "User defined mapping",
                    // function (count) { events.feedkeys((count || "") + this.rhs, this.noremap, this.silent); },
                    (/^[:|;].+<CR>$/i.test(rhs))?
                        function (count) liberator.execute(this.rhs):
                        function (count) events.feedkeys((count || "") + this.rhs, this.noremap),
                    {
                        count: true,
                        // rhs: events.canonicalKeys(rhs),
                        rhs: rhs.replace(/<Space>/ig, " ").replace(/<.+?>/g, ""),
                        noremap: !!noremap,
                        // silent: "<silent>" in args,
                        matchingUrls: urls
                    });
            }
        }

        modeDescription = modeDescription ? " in " + modeDescription + " mode" : "";

        function regexpValidator(expr) {
            try {
                RegExp(expr);
                return true;
            }
            catch (e) {}
            return false;
        }

        function urlsCompleter (modes, current) {
            return function () {
                let completions = util.Array.uniq([
                    m.matchingUrls.source
                    for (m in mappings.getUserIterator(modes))
                    if (m.matchingUrls)
                ]).map(function (re) [re, re]);
                if (current) {
                    if (buffer.URL)
                        completions.unshift([util.escapeRegex(buffer.URL), "Current buffer URL"]);
                    if (content.document && content.document.domain)
                        completions.unshift([util.escapeRegex(content.document.domain), "Current buffer domain"]);
                }
                return completions;
            };
        }

        const opts = {
            completer: function (context, args) completion.userMapping(context, args, modes),
            options: [
                // [["<silent>", "<Silent>"],  commands.OPTION_NOARG],
                [["-urls", "-u"],  commands.OPTION_STRING, regexpValidator, urlsCompleter(modes, true)],
            ],
            literal: 1,
        };

        commands.add([ch ? ch + "m[ap]" : "map"],
            "Map a key sequence" + modeDescription,
            function (args) { map(args, modes, false); },
            opts);

        commands.add([ch + "no[remap]"],
            "Map a key sequence without remapping keys" + modeDescription,
            function (args) { map(args, modes, true); },
            opts);
    }

    // addMapCommands("",  [modes.NORMAL, modes.VISUAL], "");
    addMapCommands("h",  [modes.NORMAL, modes.VISUAL], "hidden");

    liberator.globalVariables.loaded_hidden_mapping = true;
})();

// vim: sw=4 ts=4 et si ft=javascript fdm=marker:
