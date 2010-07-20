//
// pixiv_tools.js
//
// @http://github.com/anekos/Ank-Pixiv-Tool
// @http://d.hatena.ne.jp/showchick/20080507/1210169425
// @http://d.hatena.ne.jp/uupaa/20080413/1208067631
// @http://d.hatena.ne.jp/uupaa/20090602/1243933843
// @http://coderepos.org/share/browser/lang/javascript/vimperator-plugins/trunk/tombloo.js
// @http://coderepos.org/share/browser/lang/javascript/vimperator-plugins/trunk/hint-tombloo.js

liberator.plugins.pixiv_tools = (function(){ //{{{
  // Utility {{{
  let Logger = libly.$U.getLogger("pixiv_tools.js");
  let $ = function (a) window.content.document.getElementById(a);
  let $LX = function (a, b) libly.$U.getFirstNodeFromXPath(a, b);
  let $LXs = function (a, b) libly.$U.getNodesFromXPath(a, b);
  let toQuery = function (so) [encodeURIComponent(i) + "=" + encodeURIComponent(so[i]) for (i in so)].join("&");
  let checkInput = function (input) commandline.close() || (input && /^y(es)?/i.test(input));

  // }}}
  // Public {{{
  let self = {
    setting: {
      expire: 60 * 60 * 24 * 1000,

      addPublic: {
        user: true,
        illust: false,
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

    message: {
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

    id: {
      get illust () {
        let id = let (e = $("rpc_i_id") || $LX("//input[@name='illust_id']")) e && (e.textContent || e.value);
        liberator.assert(id, "Illust ID does not exist");
        return id;
      },

      get user () {
        let id = let (e = $("rpc_u_id") || $("mod_user") || $LX("//div[@class='profile_area']/a"))
                   e && (e.textContent || e.getAttribute("href").replace(/^.*id=/, ""));
        liberator.assert(id, "User ID does not exist");
        return id;
      },

      get TT ()
        let (e = $LX("//input[@name='tt']")) e && e.value || self.cache.TT,

      set TT (str)
        self.cache.TT = str,
    },

    get: {
      get middleImage ()
        $LX("//div[@class='works_display']/a/img"),

      get mangaViewer ()
        $LX("//div[@class='works_display']/a[contains(@href, 'mode=manga')]"),

      get bigImage ()
        $("BigImage"),

      get imgTags ()
        $LXs("id('tags')/a[not(img)]").map(function (e) e.text),

      get vicinityImages ()
        [null].concat($LXs("//div[@class='centeredNavi']/ul/li/a[contains(@href, 'medium&illust_id=')]")).slice(-2),
    },

    check: {
      get currentLocation ()
        window.content.document.location.href,

      get inPixiv ()
        this.currentLocation.match(/^http:\/\/[^\.\/]+\.pixiv\.net\//i),

      get inFront ()
        this.inPixiv && this.currentLocation.match(/member\.php\?id=\d+/),

      get inList ()
        this.inPixiv && this.currentLocation.match(/member_illust\.php\?id=\d+/),

      get inManga ()
        this.inPixiv && this.currentLocation.match(/member_illust\.php\?mode=manga/),

      get inIllust ()
        this.inPixiv && this.currentLocation.match(/member_illust\.php\?mode=medium&illust_id=\d+/),

      get isFavIllust ()
        !$LX("id('bookmark_btn')/ul[@class='bookmark_bt']/li/a[contains(@href, 'bookmark_add')]"),

      get isFavUser ()
        !$LX("id('leftcolumn')/div/ul[@class='profile_bt']/li/a[contains(@href, 'bookmark_add')]"),
    },

    store: storage.newMap("pixiv_tools", {store: true}),

    data: {
      get bookmarkTags () {
        if (!self.cache.bookmarkTags)
          _setBookmarkTags();
        return self.cache.bookmarkTags;
      },

      set bookmarkTags (obj)
        self.cache.bookmarkTags = obj,

      get completeTags ()
        self.cache.completeTags,

      set completeTags (obj)
        self.cache.completeTags = obj,
    },

    cache: {
      bookmarkTags: null,
      completeTags: {},
      TT: "",
    },

    func: {
      toggleIllust: function () {
        liberator.assert(self.check.inIllust, "This Page is not Illust Page");
        let BigImage = self.get.bigImage;
        let MangaViewer = self.get.mangaViewer;
        if (BigImage)
          BigImage.style.display = ((BigImage.style.display == "none")? "": "none");
        else if (!BigImage && MangaViewer)
          liberator.open(MangaViewer.href);
        else if (!BigImage && !MangaViewer)
          _addBigImage();
      },

      postBookmark: function (_addUserFlag) {
        if (self.check.inFront || self.check.inList || _addUserFlag)
        {
          liberator.assert(!self.check.isFavUser, "This User is Bookmarked");
          commandline.input(
            "Add User Bookmark? [Y/n]: ",
            function (input) checkInput(input) && _postBookmark("user")
          );
        }
        else if (self.check.inIllust)
        {
          commandline.input(
            (self.check.isFavIllust? "Update": "Add") + " Illust Bookmark [Tags]: ",
            function (input) checkInput("y") && _postBookmark("illust", input),
            {
              completer: function (context) {
                if (context.filter)
                {
                  let resep = RegExp("^(" + context.filter.replace(/^\s+|\s+$/, "").split(/\s+/).join("|") + ")$", "i");
                  context.filters.push(function(item) !resep.test(item.text));
                };
                context.completions = _getCompleteTags(self.id.illust, self.get.imgTags);
                context.title.push((new Date(self.store.get("time", 0))).toISOString());
                let (skip = context.filter.match(/^.*\s+/))
                  skip && context.advance(skip[0].length);
              }
            }
          );
        }
        else
          Logger.echoerr("postBookmark.Error");
      },

      postTombloo: function () {
        liberator.assert(self.check.inIllust, "This Page is not Illust Page");
        commandline.input(
          "Post Tombloo? [Y/n]: ",
          function (input) checkInput(input) && _postTombloo()
        );
      },
    },

    tomblooService: Cc["@brasil.to/tombloo-service;1"].getService().wrappedJSObject.Tombloo.Service,
  };

  // }}}
  // Private {{{
  let _addBigImage = function (_tomblooFlag)
  {
    let Body = window.content.document.documentElement;
    let MiddleImage = self.get.middleImage;
    let BigImageElem = new Image();
    MiddleImage.setAttribute("style", "border: 1px ridge #B7B7B7;");
    BigImageElem.onload = function ()
    {
      // x: 中画像の中心(中画像の左端 + 中画像の半分) - 大画像の半分 = 大画像の中心と中画像の中心を同じに
      //      大画像が画面右にはみ出したら、はみ出た分だけ左に寄せて、
      //      大画像が画面左にはみ出したら、左端から始める。
      // y: 中画像の上辺
      let x = (MiddleImage.offsetLeft + MiddleImage.width / 2) - (BigImageElem.naturalWidth / 2);
          x = let (drop = (x + BigImageElem.naturalWidth + 2) - Body.clientWidth) (drop > 0)? x - drop - 2: x;
          x = (x <= 0)? 0: x - 2;
      let y = MiddleImage.offsetTop - 2;
      BigImageElem.id = "BigImage";
      BigImageElem.setAttribute("style", "position: absolute; border : 3px ridge #B7B7B7; z-index : 999; opacity: 1; background-color : #fff;");
      BigImageElem.style.top = y + "px";
      BigImageElem.style.left = x + "px";
      BigImageElem.style.display = (_tomblooFlag)? "none": "";
    };
    BigImageElem.style.display = "none";
    BigImageElem.src = MiddleImage.src.replace("_m.", ".");
    Body.appendChild(BigImageElem);
    return BigImageElem;
  };

  let _setBookmarkTags = function (_getFlag)
  {
    let store = self.store.get("data", null);
    let now = new Date().getTime();
    if (!store || _getFlag || ((now - self.store.get("time", 0)) >= self.setting.expire))
    {
      let req = new libly.Request("http://www.pixiv.net/bookmark.php", {Referrer: "http://www.pixiv.net/"});
      req.addEventListener("onSuccess", function (res) {
        let tagList = res.getHTMLDocument("id('bookmark_list')/ul/li[@class!='level0']/a");
        if (tagList)
        {
          let obj = util.Array.toObject(tagList.map(function (e) [$LX("./text()", e).textContent, $LX("./span/text()", e).textContent]));
          self.data.bookmarkTags = obj;
          self.store.set("data", obj);
          self.store.set("time", now);
          self.store.save();
          Logger.log("_setBookmarkTags.Success(" + tagList.length + ")");
        }
        else
        {
          self.data.bookmarkTags = store;
          Logger.echoerr("_setBookmarkTags.Error(" + res.req.body + ")");
        };
      });
      req.addEventListener("onFailure",   function (res) Logger.echoerr("_setBookmarkTags.Failure"  ));
      req.addEventListener("onException", function (res) Logger.echoerr("_setBookmarkTags.Exception"));
      req.get();
    }
    else
    {
      Logger.log("_setBookmarkTags.Cache");
      self.data.bookmarkTags = store;
    };
  };

  let _getCompleteTags = function (_imgID, _imgTags)
  {
    let bookmarkTags = self.data.bookmarkTags;
    let key = _imgID || "_";
    if (!self.data.completeTags[key] && bookmarkTags)
    {
      let _dict = {};
      _dict["sep"] = [["", ""]];
      _dict["both"] = _imgTags.filter(function (t) bookmarkTags[t]).map(function (t) [t, bookmarkTags[t] + " + " + self.message.echo["reqtag"]]);
      _dict["illust-full"] = _imgTags.map(function (s) [s, self.message.echo["reqtag"]]);
      _dict["bookmark-full"] = [[k, bookmarkTags[k]] for (k in bookmarkTags)];
      let (both = util.Array.toObject(_dict["both"]))
      {
        _dict["illust"] = _dict["illust-full"].filter(function ([t, d]) !both[t]);
        _dict["bookmark"] = _dict["bookmark-full"].filter(function ([t, d]) !both[t]);
      };
      self.data.completeTags[key] = _sortCompleteTags(self.setting.completion.tag || ["illust-full", "bookmark-full"], _dict);
    };
    return self.data.completeTags[key];
  };
  let _sortCompleteTags = function (keys, dict)
  {
    let _calc = function ([t, d]) (d == self.message.echo["reqtag"])? t: d.match(/\d+/g).map(parseFloat).reduce(function (a, b) a + b);
    let _sort = (self.setting.completion.sort)? function (arr) arr.sort(function (a, b) CompletionContext.Sort.number(_calc(a), _calc(b))): util.identity;
    return util.Array.flatten(keys.map(function (key) _sort(dict[key] || [])));
  };

  let _postBookmark = function (_type, _tag, _limit)
  {
    liberator.assert(!(_limit && _limit > 3), "Accessed Limit");
    _tag = (_tag && _tag.replace(/,(\s+|\s?)/g, " ").replace(/^\s+|\s+$/, "")) || "";
    let req = new libly.Request(
      "http://www.pixiv.net/bookmark_add.php",
      {Referrer: liberator.modules.buffer.URL},
      {postBody: toQuery({
        mode: "add",
        type: _type,
        id: self.id[_type],
        tag: _tag,
        restrict: (self.setting.addPublic[_type]? "0": "1"),
        tt: self.id.TT,
      })}
    );
    req.addEventListener("onSuccess", function (res) {
      let limit = _limit || 0;
      let status = [_type, self.id[_type], _tag, _limit].join(", ");
      let responseIs = function (text) [message for (message in self.message.page) if (~text.indexOf(self.message.page[message]))][0];
      switch (responseIs(res.responseText)) {
        case "success":
          Logger.log("_postBookmark.Success(" + status + ")");
          break;
        case "bookmark":
          Logger.log("_postBookmark.reSuccess(" + status + ")");
          break;
        case "toppage":
          Logger.log("_postBookmark.SessionOut(" + status + ")");
          _postBookmark(_type, _tag, ++limit);
          break;
        case "error":
          tabs.reload(gBrowser.mCurrentTab);
          Logger.echoerr("_postBookmark.Error(" + status + ")");
          break;
        default:
          if (!self.id.TT)
          {
            Logger.log("_postBookmark.MoreTry(" + status + res.req.body + ")");
            _setTT(function () _postBookmark(_type, _tag, ++limit));
          }
          else
            Logger.echoerr("_postBookmark.Error(" + status + res.req.body + ")");
          break;
      };
    });
    req.addEventListener("onFailure",   function (res) Logger.echoerr("_postBookmark.Failure"  ));
    req.addEventListener("onException", function (res) Logger.echoerr("_postBookmark.Exception"));
    req.post();
  };

  let _postTombloo = function ()
  {
    let getContext = function (elem)
    {
      let doc = window.content.document;
      let win = window.content.wrappedJSObject;
      let context = {
        document  : doc,
        window    : win,
        title     : doc.title,
        selection : win.getSelection().toString(),
        target    : elem,
      };
      for (let p in win.location)
        context[p] = win.location[p];
      return context;
    };
    let ctx = getContext(
      self.get.bigImage || (self.get.mangaViewer && $LX("img", self.get.mangaViewer).src.replace("_m.", "_p0.")) || _addBigImage(true)
    );
    let ext = self.tomblooService.check(ctx)[0];
    self.tomblooService.share(ctx, ext, !/^Photo/.test(ext.name)).addCallback(function ()
      Logger.log("_postTombloo.Success(" + ctx.href + ")")
    ).addErrback(function (err)
      Logger.log("_postTombloo.Error(" + err + ")")
    );
  };

  let _setTT = function (_callback) {
    let req = new libly.Request("http://www.pixiv.net/mypage.php", {Referrer: "http://www.pixiv.net/"});
    req.addEventListener("onSuccess", function (res) {
      let e = res.getHTMLDocument("//input[@name='tt']");
      if (e && e[0])
      {
        self.id.TT = e[0].value;
        Logger.log("_setTT.Success(" + self.id.TT + ")");
        if (_callback && typeof _callback == 'function')
          _callback.call(this);
      }
      else
        Logger.log("_setTT.Error(" + res.req.body + ")");
    });
    req.addEventListener("onFailure",   function (res) Logger.echoerr("_setTT.Failure"  ));
    req.addEventListener("onException", function (res) Logger.echoerr("_setTT.Exception"));
    req.get();
  };

  // }}}

  let addCommands = function ()
  {
    let add = function (_name, _lambda, _option)
      commands.addUserCommand(["Pixiv" + _name], _name.replace(/\W/g, "").replace(/\B[A-Z]/g, " $&"), _lambda, _option || {}, true);
    [
      ["UserFr[ont]"      , function () "http://www.pixiv.net/member.php?id=" + self.id.user],
      ["UserL[ist]"       , function () "http://www.pixiv.net/member_illust.php?id=" + self.id.user],
      ["UserBb[s]"        , function () "http://www.pixiv.net/member_board.php?id=" + self.id.user],
      ["UserBo[okmark]"   , function () "http://www.pixiv.net/bookmark.php?id=" + self.id.user],
      ["UserI[llustTag]"  , function () "http://www.pixiv.net/member_tag_all.php?id=" + self.id.user],
      ["UserR[esponse]"   , function () "http://www.pixiv.net/response.php?mode=all&id=" + self.id.user],
      ["UserM[yPic]"      , function () "http://www.pixiv.net/mypixiv_all.php?id=" + self.id.user],
      ["UserFa[vUser]"    , function () "http://www.pixiv.net/bookmark.php?type=user&id=" + self.id.user],
      ["Illust"           , function () "http://www.pixiv.net/member_illust.php?mode=medium&illust_id=" + self.id.illust],
      ["IllustB[ookmark]" , function () "http://www.pixiv.net/bookmark_add.php?type=illust&illust_id=" + self.id.illust],
      ["IllustP[rev]"     , function () self.get.vicinityImages[1].href],
      ["IllustN[ext]"     , function () self.get.vicinityImages[0].href],
    ].forEach(function ([_name, _url])
      add("Cd" + _name, function (args) liberator.open(_url(), args.bang? liberator.NEW_TAB: liberator.CURRENT_TAB), {bang: true})
    );
    add("FavA[uto]"      , function () self.func.postBookmark());
    add("FavI[llust]"    , function () self.func.postBookmark(false));
    add("FavU[ser]"      , function () self.func.postBookmark(true));
    add("ToggleI[llust]" , self.func.toggleIllust);
    add("ToggleC[omment]", function () window.content.wrappedJSObject.one_comment_view());
    add("Post[Tombloo]"  , self.func.postTombloo);
    add("U[pdate]"       , function () _setBookmarkTags(true) && _setTT() && (self.data.completeTags = {}));
  };
  addCommands();

  return self;
})(); //}}}

// vim:sw=2 ts=2 et si fenc=utf-8 fdm=marker:

