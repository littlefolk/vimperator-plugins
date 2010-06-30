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
  let checkInput = function (input) input && /^y(es)?/i.test(input);

  // }}}
  // Public {{{
  let self = {
    STORE: storage.newMap("pixiv_tools", {store: true}),

    EXPIRE: 60 * 60 * 24 * 1000,

    ADD_PUBLIC: {
      user   : true,
      illust : false,
    },

    COMPLETION: {
      // CompletionTags Show
      //   "both"          : Bookmark && Illust
      //   "illust"        : Illust - Bookmark
      //   "illust-full"   : Illust
      //   "bookmark"      : Bookmark - Illust
      //   "bookmark-full" : Bookmark
      //   "sep"           : Separator Space
      tag: ["both", "illust", "bookmark"],
      // Descending Order of Bookmark Count
      sort: true,
    },

    PAGE_MESSAGE: {
      success    : "\u8ffd\u52a0\u3057\u307e\u3057\u305f",                         // # 追加しました
      bookmark   : "\u3042\u306a\u305f\u306e\u30d6\u30c3\u30af\u30de\u30fc\u30af", // # あなたのブックマーク
      toppage    : "\u307f\u3093\u306a\u306e\u65b0\u7740\u30a4\u30e9\u30b9\u30c8", // # みんなの新着イラスト
    },

    ECHO_MESSAGE: {
      add   : "\u304a\u6c17\u306b\u5165\u308a\u306b\u8ffd\u52a0\u3057\u307e\u3057\u305f", // # お気に入りに追加しました
      error : "\u5931\u6557\u3057\u307e\u3057\u305f",                                     // # 失敗しました
      reqtag: "\u767b\u9332\u30bf\u30b0",                                                 // # 登録タグ
    },

    TomblooService: Cc["@brasil.to/tombloo-service;1"].getService().wrappedJSObject.Tombloo.Service,

    ID: {
      get illust () {
        let id = let (e = $("rpc_i_id") || $LX("//input[@name='illust_id']")) e && (e.textContent || e.value);
        liberator.assert(id, "Illust ID does not exist");
        return id;
      },

      get user () {
        let id = let (e = $("rpc_u_id") || $LX("//div[@id='profile']/div/a")) e && (e.textContent || e.getAttribute("href").replace(/^.*id=/, ""));
        liberator.assert(id, "User ID does not exist");
        return id;
      },

      _TT: "",

      get TT ()
        let (e = $LX("//input[@name='tt']")) e && e.value || this._TT,

      set TT (s)
        this._TT = s,
    },

    GET: {
      get Content ()
        $("content2"),

      get MiddleImage ()
        $LX("id('content2')/div/a/img"),

      get MangaViewer ()
        $LX("id('content2')/div/a[contains(@href, 'mode=manga')]"),

      get BigImage ()
        $("BigImage"),

      get ImgTags ()
        $LXs("id('tags')/a[not(img)]").map(function (e) e.text),

      get vicinityImage ()
        [null].concat($LXs("id('content2')/div/a[contains(@href, 'medium&illust_id=')]")).slice(-2),
    },

    CHECK: {
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

    FUNC: {
      toggleIllust: function () {
        liberator.assert(self.CHECK.inIllust, "This Page is not Illust Page");
        let BigImage = self.GET.BigImage;
        let MangaViewer = self.GET.MangaViewer;
        if (BigImage)
          BigImage.style.display = ((BigImage.style.display == "none")? "": "none");
        else if (!BigImage && MangaViewer)
          liberator.open(MangaViewer.href);
        else if (!BigImage && !MangaViewer)
          _addBigImage();
      },

      postBookmark: function (_addUserFlag) {
        if (self.CHECK.inFront || self.CHECK.inList || _addUserFlag)
        {
          liberator.assert(!self.CHECK.isFavUser, "This User is Bookmarked");
          commandline.input(
            "Add User Bookmark? [Y/n]: ",
            function (input) checkInput(input) && _postBookmark("user")
          );
        }
        else if (self.CHECK.inIllust)
        {
          commandline.input(
            (self.CHECK.isFavIllust? "Update": "Add") + " Illust Bookmark [Tags]: ",
            function (input) _postBookmark("illust", input),
            {
              completer: function (context) {
                context.completions = _getCompTags();
                context.title.push((new Date(self.STORE.get("EXPIRE", 0))).toISOString());
              }
            }
          );
        }
        else
          Logger.echoerr("postBookmark.Error");
      },

      postTombloo: function () {
        liberator.assert(self.CHECK.inIllust, "This Page is not Illust Page");
        commandline.input(
          "Post Tombloo? [Y/n]: ",
          function (input) checkInput(input) && _postTombloo()
        );
      },
    },

  };

  // }}}
  // Private {{{
  let _addBigImage = function (_tomblooFlag)
  {
    let Body = window.content.document.documentElement;
    let Content = self.GET.Content;
    let MiddleImage = self.GET.MiddleImage;
    let BigImageElem = new Image();
    MiddleImage.setAttribute("style", "border: 1px ridge #B7B7B7;");
    BigImageElem.onload = function ()
    {
      // x: 中画像の中心(中画像の左端 + 中画像の半分) - 大画像の半分 = 大画像の中心と中画像の中心を同じに
      //      大画像が画面右にはみ出したら、はみ出た分だけ左に寄せて、
      //      大画像が画面左にはみ出したら、左端から始める。
      // y: 中画像の上辺
      let x = (MiddleImage.offsetLeft + Content.offsetLeft) + (MiddleImage.width / 2) - (BigImageElem.naturalWidth / 2) - 3;
          x = let (drop = (x + BigImageElem.naturalWidth) - Body.clientWidth) (drop >= 0)? x - drop - 5: x;
          x = (x <= 0)? 0: x;
      let y = MiddleImage.offsetTop + Content.offsetTop - 3;
      
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

  let _getBookmarkTags = function (_getFlag)
  {
    let data = self.STORE.get("data", null);
    let now = new Date().getTime();
    if (!data || _getFlag || ((now - self.STORE.get("EXPIRE", 0)) >= self.EXPIRE))
    {
      let req = new libly.Request(
        "http://www.pixiv.net/bookmark.php",
        {Referrer: "http://www.pixiv.net/"}
      );
      req.addEventListener("onSuccess", function (res) {
        let tagList = res.getHTMLDocument("id('bookmark_list')/ul/li[@class!='level0']/a")
        if (tagList)
        {
          let obj = {};
          tagList.forEach(function (e) obj[$LX("./text()", e).textContent] = $LX("./span/text()", e).textContent)
          self.STORE.set("data", obj);
          self.STORE.set("EXPIRE", now);
          self.STORE.save();
          Logger.log("_getBookmarkTags.Success(" + tagList.length + ")");
        }
        else
        {
          self.STORE.remove();
          Logger.echoerr("_getBookmarkTags.Error(" + res.req.body + ")");
        };
      });
      req.addEventListener("onFailure",   function (res) Logger.echoerr("_getBookmarkTags.Failure"  ));
      req.addEventListener("onException", function (res) Logger.echoerr("_getBookmarkTags.Exception"));
      req.get();
    }
    else
      return data || {};
  };

  let _getCompTags = function ()
  {
    let _dict = {};
    let _store = util.cloneObject(_getBookmarkTags());
    let _imgtags = self.GET.ImgTags;
    _dict["sep"] = [["", ""]];
    _dict["both"] = _imgtags.filter(function (t) _store[t]).map(function (t) [t, _store[t] + " + " + self.ECHO_MESSAGE["reqtag"]]);
    _dict["illust-full"] = _imgtags.map(function (s) [s, self.ECHO_MESSAGE["reqtag"]]);
    _dict["bookmark-full"] = [[k, _store[k]] for (k in _store)];
    let (_c = util.Array.toObject(_dict["both"]))
    {
      _dict["illust"] = _dict["illust-full"].filter(function ([t, d]) !_c[t]);
      _dict["bookmark"] = _dict["bookmark-full"].filter(function ([t, d]) !_c[t]);
    };
    let sortFunc = (self.COMPLETION.sort)?
      let (_calc = function ([t, d]) (d == self.ECHO_MESSAGE["reqtag"])? t: d.match(/\d+/g).map(parseFloat).reduce(function (a, b) a + b))
        function (arr) arr.sort(function (a, b) CompletionContext.Sort.number(_calc(a), _calc(b))):
      util.identity;
    return util.Array.flatten((self.COMPLETION.tag || ["illust-full", "bookmark-full"]).map(function (key) sortFunc(_dict[key] || [])));
  };

  let _postBookmark = function (type, tag, limit)
  {
    commandline.close();
    liberator.assert(!(limit && limit > 3), "Accessed Limit");
    
    let req = new libly.Request(
      "http://www.pixiv.net/bookmark_add.php",
      {Referrer: liberator.modules.buffer.URL},
      {postBody: toQuery({
        mode: "add",
        type: type,
        id: self.ID[type],
        tag: tag || "",
        restrict: (self.ADD_PUBLIC[type]? "0": "1"),
        tt: self.ID.TT || "",
      })}
    );
    req.addEventListener("onSuccess", function (res) {
      let _limit = limit || 0;
      let status = [type, self.ID[type], tag, limit].join(", ");
      let responseIs = function (text) [message for (message in self.PAGE_MESSAGE) if (~text.indexOf(self.PAGE_MESSAGE[message]))][0];
      switch (responseIs(res.responseText)) {
        case "success":
          Logger.log("_postBookmark.Success(" + status + ")");
          break;
        case "bookmark":
          Logger.log("_postBookmark.reSuccess(" + status + ")");
          break;
        case "toppage":
          Logger.log("_postBookmark.SessionOut(" + status + ")");
          _postBookmark(type, tag, ++_limit);
          break;
        default:
          if (!self.ID.TT)
          {
            Logger.log("_postBookmark.MoreTry(" + status + res.req.body + ")");
            _getTT(function () _postBookmark(type, tag, ++_limit));
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
    commandline.close();
    
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
      self.GET.BigImage || (self.GET.MangaViewer && $LX("img", self.GET.MangaViewer).src.replace("_m.", "_p0.")) || _addBigImage(true)
    );
    let ext = self.TomblooService.check(ctx)[0];
    self.TomblooService.share(ctx, ext, !/^Photo/.test(ext.name)).addCallback(function ()
      Logger.log("_postTombloo.Success(" + ext.name + ": " + self.ID.illust + ")")
    ).addErrback(function (err)
      Logger.log("_postTombloo.Error(" + err + ")")
    );
  };

  let _getTT = function (callback) {
    let req = new libly.Request(
      "http://www.pixiv.net/mypage.php",
        {Referrer: "http://www.pixiv.net/"}
    );
    req.addEventListener("onSuccess", function (res) {
      let e = res.getHTMLDocument("//input[@name='tt']");
      if (e && e[0])
      {
        self.ID.TT = e[0].value;
        Logger.log("_getTT.Success(" + self.ID.TT + ")");
        if (callback && typeof callback == 'function')
          callback.call(this);
      }
      else
        Logger.log("_getTT.Error(" + res.req.body + ")");
    });
    req.addEventListener("onFailure",   function (res) Logger.echoerr("_getTT.Failure"  ));
    req.addEventListener("onException", function (res) Logger.echoerr("_getTT.Exception"));
    req.get();
  };

  // }}}

  let addCommands = function ()
  {
    let add = function (_name, _lambda, _option)
      commands.addUserCommand(["Pixiv" + _name], _name.replace(/\W/g, "").replace(/\B[A-Z]/g, " $&"), _lambda, _option || {}, true);
    
    [
      ["UserFr[ont]"      , function () "http://www.pixiv.net/member.php?id=" + self.ID.user],
      ["UserL[ist]"       , function () "http://www.pixiv.net/member_illust.php?id=" + self.ID.user],
      ["UserBb[s]"        , function () "http://www.pixiv.net/member_board.php?id=" + self.ID.user],
      ["UserBo[okmark]"   , function () "http://www.pixiv.net/bookmark.php?id=" + self.ID.user],
      ["UserI[llustTag]"  , function () "http://www.pixiv.net/member_tag_all.php?id=" + self.ID.user],
      ["UserR[esponse]"   , function () "http://www.pixiv.net/response.php?mode=all&id=" + self.ID.user],
      ["UserM[yPic]"      , function () "http://www.pixiv.net/mypixiv_all.php?id=" + self.ID.user],
      ["UserFa[vUser]"    , function () "http://www.pixiv.net/bookmark.php?type=user&id=" + self.ID.user],
      ["Illust"           , function () "http://www.pixiv.net/member_illust.php?mode=medium&illust_id=" + self.ID.illust],
      ["IllustB[ookmark]" , function () "http://www.pixiv.net/bookmark_illust_user.php?illust_id=" + self.ID.illust],
      ["IllustP[rev]"     , function () self.GET.vicinityImage[1].href],
      ["IllustN[ext]"     , function () self.GET.vicinityImage[0].href],
    ].forEach(function ([_name, _url])
      add("Cd" + _name, function (args) liberator.open(_url(), args.bang? liberator.NEW_TAB: liberator.CURRENT_TAB), {bang: true})
    );
    add("FavA[uto]"      , function () self.FUNC.postBookmark());
    add("FavI[llust]"    , function () self.FUNC.postBookmark(false));
    add("FavU[ser]"      , function () self.FUNC.postBookmark(true));
    add("ToggleI[llust]" , self.FUNC.toggleIllust);
    add("ToggleC[omment]", function () window.content.wrappedJSObject.one_comment_view());
    add("Post[Tombloo]"  , self.FUNC.postTombloo);
    add("U[pdate]"       , function () _getBookmarkTags(true) && _getTT());
  };
  addCommands();

  return self;
})(); //}}}

// vim:sw=2 ts=2 et si fenc=utf-8 fdm=marker:

