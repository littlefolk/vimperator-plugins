/**
 * pixiv_tools.js
 *     [Pixiv](http://www.pixiv.net/)を閲覧する際に便利な機能を詰めこんだplugin
 *
 *     主な機能
 *         直感的なページ移動
 *         イラストの拡大表示
 *         コマンドラインからのタグ補完を使ったブックマーク登録
 *
 * command
 *     Register.commands
 *
 * map
 *     Register.mappings
 *
 * requires
 *     [Tombloo](http://wiki.github.com/to/tombloo/)
 *
 * via
 *     http://github.com/anekos/Ank-Pixiv-Tool
 *     http://d.hatena.ne.jp/showchick/20080507/1210169425
 *     http://d.hatena.ne.jp/uupaa/20080413/1208067631
 *     http://d.hatena.ne.jp/uupaa/20090602/1243933843
 *     http://coderepos.org/share/browser/lang/javascript/vimperator-plugins/trunk/hint-tombloo.js
 *     http://vimperator.g.hatena.ne.jp/nokturnalmortum/20100128/1264675483
 */

liberator.plugins.pixiv_tools = (function(){
    // Utility {{{1
    let Logger = libly.$U.getLogger("pixiv_tools.js");
    let $ = function (a) window.content.document.getElementById(a);
    let $LX = function (a, b) libly.$U.getFirstNodeFromXPath(a, b);
    let $LXs = function (a, b) libly.$U.getNodesFromXPath(a, b);
    let isboolean = function(o) typeof o === 'boolean';

    let TomblooService = Cc["@brasil.to/tombloo-service;1"].getService().wrappedJSObject.Tombloo.Service;

    let PixivTools = { // {{{1
        // Public Method {{{2
        toggleComment: function () { // {{{3
            liberator.assert(this.Check.inIllust, "Failure, toggleComment.");
            this.DOM.js.one_comment_view();
        },

        toggleIllust: function () { // {{{3
            liberator.assert(this.Check.inIllust, "Failure, toggleIllust.");
            if (this.DOM.mangaViewer)
                this.jump("http://www.pixiv.net/member_illust.php?mode=manga&illust_id=#{IllustID}&type=scroll");
            else
                this._toggleDisplay(this.getBigImage);
        },

        postBookmarkAuto: function (_addUserFlag) { // {{{3
            if (this.Check.inFront || this.Check.inList || isboolean(_addUserFlag) && _addUserFlag)
                this.postBookmarkUser();
            else if (this.Check.inIllust)
                this.postBookmarkIllust();
            else
                Logger.echoerr("postBookmarkAuto.Error");
        },

        postBookmarkUser: function () { // {{{3
            let self = this;
            liberator.assert(!this.Check.isFavUser, "Failure, postBookmarkUser.");
            commandline.input(
                "Add User Bookmark? [Y/n]: ",
                function (input) self._checkInput(input) && self._postBookmark("user")
            );
        },

        postBookmarkIllust: function () { // {{{3
            let self = this;
            liberator.assert(this.Check.inIllust, "Failure, postBookmarkIllust.");
            commandline.input(
                (this.Check.isFavIllust? "Update": "Add") + " Illust Bookmark [Tags]: ",
                function (input) self._checkInput("y") && self._postBookmark("illust", input),
                {
                    completer: function (context) {
                        if (context.filter) {
                            let resep = RegExp("^(" + context.filter.replace(/^\s+|\s+$/, "").split(/\s+/).join("|") + ")$", "i");
                            context.filters.push(function(item) !resep.test(item.text));
                        };
                        context.completions = self._getCompleteTags(self.ID.illust, self.getImageTags);
                        context.title.push(self.dataBookmarkTime.toISOString());
                        let (skip = context.filter.match(/^.*\s+/))
                            skip && context.advance(skip[0].length);
                    }
                }
            );
        },

        postTombloo: function () { // {{{3
            let self = this;
            liberator.assert(this.Check.inIllust, "Failure, postTombloo.");
            commandline.input(
                "Post Tombloo? [Y/n]: ",
                function (input) self._checkInput(input) && self._postTombloo()
            );
        },

        replaceURL: function (_url) { // {{{3
            let self = this;
            const REPLACE_TABLE = {
                get UserID () self.ID.user,
                get IllustID () self.ID.illust,
                get PrevIllustID () self.ID.vicinity.prev,
                get NextIllustID () self.ID.vicinity.next,
            };
            return _url.replace(/#\{(.*?)\}/g, function (orig, name) REPLACE_TABLE[name] || "");
        },

        jump: function (_url, _flag) // {{{3
            liberator.open(this.replaceURL(_url), (_flag? liberator.NEW_TAB: liberator.CURRENT_TAB)),

        update: function () { // {{{3
            this.dataCompleteTags = {};
            this._setTT();
            this._getBookmarkTags(true);
        },

        // Private Method {{{2
        _toggleDisplay: function (elem) // {{{3
            elem && (elem.style.display = ((elem.style.display != "none")? "none": "")),

        _toQuery: function (obj) // {{{3
            [encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]) for (i in obj)].join("&"),

        _checkInput: function (input) // {{{3
            commandline.close() || (input && /^y(es)?/i.test(input)),

        _responseIs: function (text) // {{{3
            [message for (message in this.Message.page) if (~text.indexOf(this.Message.page[message]))][0],

        /**
          * イラストページに元画像を非表示で挿入する
          *
          * @returns {HTMLImageElement} 挿入された元画像
          */
        _addBigImage: function () { // {{{3
            let bigImage = this.DOM.bigImage;
            if (!bigImage) {
                let bodyDoc = this.DOM.doc.documentElement;
                let middleImage = this.DOM.middleImage;
                liberator.assert(this.Check.inIllust && bodyDoc && middleImage, "Failure, _addBigImage.");
                bigImage = new Image();
                bigImage.id = "PixivTools-BigImage";
                bigImage.src = middleImage.src.replace(/_m\./, ".");
                bigImage.setAttribute("style", "position: absolute; border : 3px ridge #B7B7B7; z-index : 999; opacity: 1; background-color : #fff;");
                bigImage.style.display = "none";
                bigImage.onload = function _calcInsertPosition () {
                    /**
                      * イラストページに挿入された元画像の表示位置を、縮小画像を拡大したような位置に変更する
                      *
                      *   x(左端): 縮小画像の中心(左端の位置 + 幅の半分) - 元画像の幅の半分
                      *            元画像が画面右にはみ出したらその分だけ左に寄せる
                      *            元画像が画面左にはみ出したら左端から始める
                      *   y(上辺): 縮小画像の上辺
                      */
                    let buffer = 3;
                    let x = (middleImage.offsetLeft + middleImage.width / 2) - (this.naturalWidth / 2);
                    x = let (drop = (x + this.naturalWidth + buffer) - bodyDoc.clientWidth) (drop > 0)? x - drop - buffer: x;
                    x = (x <= 0)? 0: x - buffer;
                    let y = middleImage.offsetTop - buffer;
                    [this.style.left, this.style.top] = [x + "px", y + "px"];
                };
                middleImage.setAttribute("style", "border: 1px ridge #B7B7B7;");
                bodyDoc.appendChild(bigImage);
            };
            return bigImage;
        },

        /**
         * Storageに保存しているブックマークタグのリストを、
         *   - Storageにデータが存在しない
         *   - 強制更新のフラグが立っている
         *   - 最終取得時刻からSetting.expireで設定した以上に経過している
         * のいずれかの場合のみ更新させて、dataBookmarkTagsで保持する
         *
         * @param {Boolean} _getFlag 強制的に更新させる
         */
        _getBookmarkTags: function (_getFlag) { // {{{3
            let storeData = this.Storage.get("data", null);
            if (!storeData || _getFlag || ((new Date() - this.dataBookmarkTime) >= this.Setting.expire))
                this._setBookmarkTags();
            else {
                this.dataBookmarkTags = storeData;
                Logger.log("_getBookmarkTags.Cache");
            };
        },

        /**
         * Storageに保存しているブックマークタグのリストを更新する
         *
         * Pixiv.netのブックマーク管理ページのタグリストから取得した後
         * {タグ名: 個数}のオブジェクトを作成してStorageに保存するのと同時にthis.dataBookmarkTagsを更新する
         */
        _setBookmarkTags: function () { // {{{3
            let self = this;
            let req = new libly.Request("http://www.pixiv.net/bookmark.php", {Referrer: "http://www.pixiv.net/"});
            req.addEventListener("onSuccess", function (res) {
                let tagList = res.getHTMLDocument("id('bookmark_list')/ul/li[@class!='level0']/a");
                if (tagList) {
                    let obj = util.Array.toObject(tagList.map(function (e) [$LX("./text()", e).textContent, $LX("./span/text()", e).textContent]));
                    self.dataBookmarkTags = obj;
                    self.Storage.set("data", obj);
                    self.Storage.set("time", new Date().getTime());
                    self.Storage.save();
                    Logger.log("_setBookmarkTags.Success(" + tagList.length + ")");
                } else
                    Logger.echoerr("_setBookmarkTags.Error(" + res.req.body + ")");
            });
            req.addEventListener("onFailure",   function (res) Logger.echoerr("_setBookmarkTags.Failure"  ));
            req.addEventListener("onException", function (res) Logger.echoerr("_setBookmarkTags.Exception"));
            req.get();
        },

        /**
         * 画像をブックマークする際の補完候補のタグリストを返す
         *
         * @param {Number|String} _imgID タグリストをキャッシュする際の識別子
         * @param {Array} _imgTags 画像に付けられているタグのリスト
         * @returns {Array} 補完候補のタグリスト
         */
        _getCompleteTags: function (_imgID, _imgTags) { // {{{3
            let key = _imgID || "_";
            let bookmarkTags = this.dataBookmarkTags;
            if (bookmarkTags && !this.dataCompleteTags[key]) {
                let _dict = {};
                let reqtag = this.Message.echo["reqtag"];
                _dict["sep"] = [["", ""]];
                _dict["both"] = _imgTags.filter(function (t) bookmarkTags[t]).map(function (t) [t, bookmarkTags[t] + " + " + reqtag]);
                _dict["illust-full"] = _imgTags.map(function (s) [s, reqtag]);
                _dict["bookmark-full"] = [[k, bookmarkTags[k]] for (k in bookmarkTags)];
                let (both = util.Array.toObject(_dict["both"])) {
                    _dict["illust"] = _dict["illust-full"].filter(function ([t, d]) !both[t]);
                    _dict["bookmark"] = _dict["bookmark-full"].filter(function ([t, d]) !both[t]);
                };
                this.dataCompleteTags[key] = this._sortCompleteTags(this.Setting.completion.tag || ["illust-full", "bookmark-full"], _dict);
            };
            return this.dataCompleteTags[key];
        },

        /**
         * 補完候補のタグを、ブックマークタグでの使用頻度でソートして返す
         *
         * @param {String[]} keys 取り出すキーのリスト
         * @param {Object} dict 全ての補完候補のオブジェクト
         * @returns {Array} 補完候補のタグリスト
         */
        _sortCompleteTags: function (_keys, _dict) { // {{{3
            let reqtag = this.Message.echo["reqtag"];
            let calc = function ([t, d]) (d == reqtag)? t: d.match(/\d+/g).map(parseFloat).reduce(function (a, b) a + b);
            let sort = (this.Setting.completion.sort)? function (arr) arr.sort(function (a, b) CompletionContext.Sort.number(calc(a), calc(b))): util.identity;
            return util.Array.flatten(_keys.map(function (key) sort(_dict[key] || [])));
        },

        /**
         * ブックマークに登録する
         *
         * @param {String} _type 登録するタイプ("user" or "illust")
         * @param {String} [_tag] イラストを登録する際に使われるタグ
         * @param {Number} [_limit] 試行回数
         */
        _postBookmark: function (_type, _tag, _limit) { // {{{3
            liberator.assert(!(_limit && _limit > 3), "Failure, _postBookmark. Accessed limit.");
            let self = this;
            let options = {mode: "add", type: _type, restrict: this.Setting.addPublic[_type], tt: this.dataTT};
            if (_type == "illust")
                options = libly.$U.extend(options, {id: this.ID.illust, tag: (_tag && _tag.replace(/,(\s+|\s?)/g, " ").replace(/^\s+|\s+$/, "")) || ""});
            else if (_type == "user")
                options = libly.$U.extend(options, {user_id: this.ID.user});
            _limit = _limit || 0;

            let req = new libly.Request("http://www.pixiv.net/bookmark_add.php", {Referrer: liberator.modules.buffer.URL}, {postBody: this._toQuery(options)});
            req.addEventListener("onSuccess", function (res) {
                let status = [options.type, options.id, options.tag, _limit].join(", ");
                switch (self._responseIs(res.responseText)) {
                    case "success":
                    case "bookmark":
                        Logger.log("_postBookmark.Success(" + status + ")");
                        break;
                    case "toppage":
                    case "error":
                        Logger.log("_postBookmark.reTry(" + status + ")");
                        self._postBookmark(_type, _tag, ++_limit);
                        break;
                    default:
                        if (!self.dataTT)
                            self._setTT(function () self._postBookmark(_type, _tag, ++_limit));
                        else
                            Logger.echoerr("_postBookmark.Error(" + status + res.req.body + ")");
                        break;
                };
            });
            req.addEventListener("onFailure",   function (res) Logger.echoerr("_postBookmark.Failure"  ));
            req.addEventListener("onException", function (res) Logger.echoerr("_postBookmark.Exception"));
            req.post();
        },

        /**
         * 元画像をTomblooに投げる
         */
        _postTombloo: function () { // {{{3
            let self = this;
            let getContext = function (elem)
            let (doc = self.DOM.doc, win = self.DOM.js)
                libly.$U.extend({document: doc, window: win, title: doc.title, selection: win.getSelection().toString(), target: elem}, win.location);
            let ctx = getContext((this.DOM.mangaViewer && $LX("img", this.DOM.mangaViewer).src.replace("_m.", "_p0.")) || this.getBigImage);
            let ext = TomblooService.check(ctx)[0];
            TomblooService.share(ctx, ext, !/^Photo/.test(ext.name))
                .addCallback(function () Logger.log("_postTombloo.Success(" + ctx.href + ")"))
                .addErrback(function (err) Logger.log("_postTombloo.Error(" + err + ")"));
        },

        /**
         * 最新のTT値を取得する
         *
         * @param {Function} [_callback] 取得後に実行する
         */
        _setTT: function (_callback) { // {{{3
            let self = this;
            let req = new libly.Request("http://www.pixiv.net/mypage.php", {Referrer: "http://www.pixiv.net/"});
            req.addEventListener("onSuccess", function (res) {
                let e = res.getHTMLDocument("//input[@name='tt']");
                if (e && e[0]) {
                    self.dataTT = e[0].value;
                    Logger.log("_setTT.Success(" + self.dataTT + ")");
                    if (_callback && callable(_callback))
                        _callback.call(self);
                } else
                    Logger.log("_setTT.Error(" + res.req.body + ")");
            });
            req.addEventListener("onFailure",   function (res) Logger.echoerr("_setTT.Failure"  ));
            req.addEventListener("onException", function (res) Logger.echoerr("_setTT.Exception"));
            req.get();
        },

        // Data {{{2
        get Storage () // {{{3
            storage.newMap("pixiv_tools", {store: true}),

        Cache: { // {{{3
            bookmarkTags: null,
            completeTags: {},
            tt: "",
        },

        Check: { // {{{3
            get currentLocation ()
                window.content.document.location.href,

            get inPixiv ()
                !!(this.currentLocation.match(/^http:\/\/[^\.\/]+\.pixiv\.net\//i)),

            get inFront ()
                !!(this.inPixiv && this.currentLocation.match(/member\.php\?id=\d+/)),

            get inList ()
                !!(this.inPixiv && this.currentLocation.match(/member_illust\.php\?id=\d+/)),

            get inManga ()
                !!(this.inPixiv && this.currentLocation.match(/member_illust\.php\?mode=manga/)),

            get inIllust ()
                !!(this.inPixiv && this.currentLocation.match(/member_illust\.php\?mode=medium&illust_id=\d+/)),

            get isFavIllust ()
                this.inIllust && !$LX("//span[@class='ahref_type05']"),

            get isFavUser ()
                this.inPixiv && !$LX("id('favorite_btn')[@class='add_favorite']"),
        },

        DOM: { // {{{3
            get doc ()
                window.content.document,

            get js ()
                window.content.wrappedJSObject,

            get middleImage ()
                $LX("//div[@class='works_display']/a/img"),

            get mangaViewer ()
                $LX("//div[@class='works_display']/a[contains(@href, 'mode=manga')]"),

            get bigImage ()
                $("PixivTools-BigImage"),

            get imageTags ()
                $LXs("id('tags')/a[not(img)]"),

            get imageNavis ()
                $LXs("//div[@class='centeredNavi']/ul/li/a[contains(@href, 'medium&illust_id=')]"),
        },

        ID: { // {{{3
            get illust ()
                let (ret = let (e = $("rpc_i_id") || $LX("//input[@name='illust_id']")) e && (e.textContent || e.value))
                    liberator.assert(ret, "Failure, ID.illust. Missing illust id.") || ret,

            get user ()
                let (ret = let (e = $("rpc_u_id") || $LX("//input[@name='user_id']")) e && (e.textContent || e.value))
                    liberator.assert(ret, "Failure, ID.user. Missing user id.") || ret,

            get vicinity () {
                let ret =
                    let (e = $LXs("//div[@class='centeredNavi']/ul/li/a[contains(@href, 'medium&illust_id=')]"))
                        [null].concat(e.map(function (e) e.getAttribute("href").replace(/^.*id=/, ""))).slice(-2);
                return {
                    get prev () liberator.assert(ret[1], "Failure, PrevIllustID.") || ret[1],
                    get next () liberator.assert(ret[0], "Failure, NextIllustID.") || ret[0],
                };
            },
        },

        Message: { // {{{3
            page: {
                success: "\u8ffd\u52a0\u3057\u307e\u3057\u305f", // # 追加しました
                bookmark: "\u3042\u306a\u305f\u306e\u30d6\u30c3\u30af\u30de\u30fc\u30af", // # あなたのブックマーク
                toppage: "\u307f\u3093\u306a\u306e\u65b0\u7740\u4f5c\u54c1", // # みんなの新着作品
                error: "\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f", // # エラーが発生しました
            },

            echo: {
                add: "\u304a\u6c17\u306b\u5165\u308a\u306b\u8ffd\u52a0\u3057\u307e\u3057\u305f", // # お気に入りに追加しました
                error: "\u5931\u6557\u3057\u307e\u3057\u305f", // # 失敗しました
                reqtag: "\u767b\u9332\u30bf\u30b0", // # 登録タグ
            },
        },

        Setting: { // {{{3
            expire: 60 * 60 * 24 * 1000,

            addPublic: {
                // "0" : true
                // "1" : false
                user: "0",
                illust: "1",
            },

            completion: {
                // CompletionTags Show
                //   "both"          : Bookmark && Illust
                //   "illust"        : Illust - Bookmark
                //   "illust-full"   : Illust
                //   "bookmark"      : Bookmark - Illust
                //   "bookmark-full" : Bookmark
                //   "sep"           : Separator Space
                tag: ["both", "bookmark", "illust"],

                // Descending Order of Bookmark Count
                sort: true,
            },
        },

        // getImage {{{3
        get getBigImage ()
            this.Check.inIllust && (this.DOM.bigImage || this._addBigImage()),

        get getImageTags ()
            this.Check.inIllust && this.DOM.imageTags.map(function (e) e.text),

        // dataBookmarkTags, dataBookmarkTime {{{3
        get dataBookmarkTags () {
            if (this.Check.inPixiv && !this.Cache.bookmarkTags)
                this._getBookmarkTags();
            return this.Cache.bookmarkTags;
        },
        set dataBookmarkTags (obj)
            this.Cache.bookmarkTags = obj,

        get dataBookmarkTime ()
            new Date(this.Storage.get("time", 0)),

        // dataCompleteTags {{{3
        get dataCompleteTags ()
            this.Cache.completeTags,
        set dataCompleteTags (obj)
            this.Cache.completeTags = obj,

        // dataTT {{{3
        get dataTT ()
            let (e = $LX("//input[@name='tt']")) e && e.value || this.Cache.tt,
        set dataTT (str)
            this.Cache.tt = str,

        //}}}2
    };

    let Register = { // {{{1
        commands: function () { // {{{2
            let jumpTo = function (_url) function (_args) PixivTools.jump(_url, _args && _args.bang || false);
            let optCdUser = {bang: true};
            let optCdIllust = {bang: true, checker: PixivTools.Check.inIllust};
            [
                ["CdUserFr[ont]"      , jumpTo("http://www.pixiv.net/member.php?id=#{UserID}")                                 , optCdUser],
                ["CdUserL[ist]"       , jumpTo("http://www.pixiv.net/member_illust.php?id=#{UserID}")                          , optCdUser],
                ["CdUserBb[s]"        , jumpTo("http://www.pixiv.net/member_board.php?id=#{UserID}")                           , optCdUser],
                ["CdUserBo[okmark]"   , jumpTo("http://www.pixiv.net/bookmark.php?id=#{UserID}")                               , optCdUser],
                ["CdUserI[llustTag]"  , jumpTo("http://www.pixiv.net/member_tag_all.php?id=#{UserID}")                         , optCdUser],
                ["CdUserR[esponse]"   , jumpTo("http://www.pixiv.net/response.php?mode=all&id=#{UserID}")                      , optCdUser],
                ["CdUserM[yPic]"      , jumpTo("http://www.pixiv.net/mypixiv_all.php?id=#{UserID}")                            , optCdUser],
                ["CdUserFa[vUser]"    , jumpTo("http://www.pixiv.net/bookmark.php?type=user&id=#{UserID}")                     , optCdUser],
                ["CdIllust"           , jumpTo("http://www.pixiv.net/member_illust.php?mode=medium&illust_id=#{IllustID}")     , optCdIllust],
                ["CdIllustB[ookmark]" , jumpTo("http://www.pixiv.net/bookmark_add.php?type=illust&illust_id=#{IllustID}")      , optCdIllust],
                ["CdIllustP[rev]"     , jumpTo("http://www.pixiv.net/member_illust.php?mode=medium&illust_id=#{PrevIllustID}") , optCdIllust],
                ["CdIllustN[ext]"     , jumpTo("http://www.pixiv.net/member_illust.php?mode=medium&illust_id=#{NextIllustID}") , optCdIllust],
                ["FavA[uto]"          , PixivTools.postBookmarkAuto   , {checker: PixivTools.Check.inPixiv}],
                ["FavI[llust]"        , PixivTools.postBookmarkIllust , {checker: PixivTools.Check.inIllust}],
                ["FavU[ser]"          , PixivTools.postBookmarkUser   , {checker: PixivTools.Check.inPixiv}],
                ["ToggleI[llust]"     , PixivTools.toggleIllust       , {checker: PixivTools.Check.inIllust}],
                ["ToggleC[omment]"    , PixivTools.toggleComment      , {checker: PixivTools.Check.inIllust}],
                ["Post[Tombloo]"      , PixivTools.postTombloo        , {checker: PixivTools.Check.inIllust}],
                ["U[pdate]"           , PixivTools.update],
            ].forEach(function ([_name, _lambda, _option]) {
                _option = _option || {};
                commands.addUserCommand(
                    ["Pixiv" + _name],
                    _name.replace(/\W/g, "").replace(/\B[A-Z]/g, " $&"),
                    function (args)
                        liberator.assert((_option.checker || PixivTools.Check.inPixiv), "Failure, :Pixiv" + _name) || _lambda.call(PixivTools, args),
                    _option,
                    true
                );
            });
        },

        mappings: function () { // {{{2
            let buffer = /^http:\/\/[^\.\/]+\.pixiv\.net\//i;
            [
                ['a' , ':PixivFavAuto'         ],
                ['A' , ':PixivFavUser'         ],
                ['i' , ':PixivToggleIllust'    ],
                ['I' , ':PixivCdUserList'      ],
                ['c' , ':PixivToggleComment'   ],
                ['x' , ':PixivPostTombloo'     ],
                ['gu', ':PixivCdUserFront'     ],
                ['[[', ':PixivCdIllustPrev'    ],
                [']]', ':PixivCdIllustNext'    ],
            ].forEach(function ([cmd, action])
                mappings.addUserMap([modes.NORMAL], [cmd], "Local mapping for " + buffer, function () liberator.execute(action), {matchingUrls: buffer})
            );
        },
    };

    // }}}1

    Register.commands();
    Register.mappings();
    return PixivTools;
})();

// vim: sw=4 ts=4 et si fdm=marker:
