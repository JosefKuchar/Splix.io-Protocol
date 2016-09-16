function getServers() {
  var a = new XMLHttpRequest;
  a.onreadystatechange = function() {
    if (a.readyState == XMLHttpRequest.DONE && 200 == a.status) {
      serversJsonGetTime = Date.now();
      var b = JSON.parse(a.responseText),
        c = b.groups;
      servers = [];
      for (var d = 0; d < c.length; d++) {
        var e = c[d],
          f = generateServerGroup(e.pingIp, e.servers);
        servers.push(f), serversRequestDone = !0
      }
      doConnectAfterServersGet && doConnect(), startPingServers()
    }
  }, a.open("GET", "/json/servers.json", !0), a.send()
}

function generateServerGroup(a, b) {
  return {
    pingUrl: a + ":7999/ping",
    servers: b,
    ws: null,
    pingTries: 0,
    avgPing: 0,
    open: !1,
    initSocket: function() {
      this.ws = new WebSocket("ws://" + this.pingUrl), this.ws.binaryType = "arraybuffer";
      var a = this;
      this.ws.onmessage = function() {
        if (a.waitingForPing) {
          var b = Date.now() - a.lastPingTime;
          a.avgPing = a.avgPing * a.pingTries + b, a.pingTries++, a.avgPing /= a.pingTries, a.lastPingTime = Date.now(), a.waitingForPing = !1, a.pingTries >= 4 && (a.open = !1, a.ws.close())
        }
      }, this.ws.onopen = function() {
        a.open = !0
      }, this.ws.onclose = function() {
        a.open = !1
      }
    },
    lastPingTime: 0,
    waitingForPing: !1,
    ping: function() {
      this.open && this.ws && this.ws.readyState == WebSocket.OPEN && !this.waitingForPing && (this.waitingForPing = !0, this.lastPingTime = Date.now(), this.ws.send(new Uint8Array([0])))
    }
  }
}

function startPingServers() {
  for (var a = 0; a < servers.length; a++) {
    var b = servers[a];
    b.initSocket()
  }
}

function pingServers() {
  if (donePing = !0, servers.length > 0)
    for (var a = 0; a < servers.length; a++) {
      var b = servers[a];
      b.ping(), b.pingTries < 4 && (donePing = !1)
    } else donePing = !1
}

function getServer() {
  var a, b, c;
  if (servers.length <= 0) return null;
  if (location.hash) {
    if (location.hash.startsWith("#dev-")) return {
      ip: "ws://" + location.hash.substring(5),
      ping: 30
    };
    for (var d = 0; d < servers.length; d++) {
      a = servers[d];
      for (var e = 0; e < a.servers.length; e++) {
        b = a.servers[e];
        for (var f = 0; f < b.lobbies.length; f++)
          if (c = b.lobbies[f], c.hash == location.hash.substring(1)) return {
            ip: "ws://" + b.ip + ":" + c.port + "/splix",
            ping: a.avgPing
          }
      }
    }
  }
  for (var g = null, h = 1 / 0, i = 0; i < servers.length; i++) a = servers[i], a.avgPing < h && a.pingTries > 0 && (h = a.avgPing, g = a);
  if (null === g && (g = randFromArray(servers)), g.servers.length <= 0) return null;
  b = randFromArray(g.servers), c = randFromArray(b.lobbies);
  var j = location.href;
  return (location.hash || j.lastIndexOf("#") == j.length - 1) && (location.hash = c.hash), {
    ip: "ws://" + b.ip + ":" + c.port + "/splix",
    ping: g.avgPing
  }
}

function getBlock(a, b, c) {
  var d;
  void 0 === c && (c = blocks);
  for (var e = 0; e < c.length; e++)
    if (d = c[e], d.x == a && d.y == b) return d;
  return d = {
    x: a,
    y: b,
    currentBlock: -1,
    nextBlock: -1,
    animDirection: 0,
    animProgress: 0,
    animDelay: 0,
    setBlockId: function(a, b) {
      if (b === !1) this.currentBlock = this.nextBlock = a, this.animDirection = 0, this.animProgress = 1;
      else {
        void 0 === b && (b = 0), this.animDelay = b;
        var c = a == this.currentBlock,
          d = a == this.nextBlock;
        c && d && this.animDirection == -1 && (this.animDirection = 1), c && !d && (this.animDirection = 1, this.nextBlock = this.currentBlock), !c && d && 1 == this.animDirection && (this.animDirection = -1), c || d || (this.nextBlock = a, this.animDirection = -1)
      }
    }
  }, c.push(d), d
}

function getPlayer(a, b) {
  var c;
  void 0 === b && (b = players);
  for (var d = 0; d < b.length; d++)
    if (c = b[d], c.id == a) return c;
  return c = {
    id: a,
    pos: [0, 0],
    drawPos: [-1, -1],
    drawPosSet: !1,
    serverPos: [0, 0],
    dir: 0,
    isMyPlayer: 0 === a,
    isDead: !1,
    deathWasCertain: !1,
    didUncertainDeathLastTick: !1,
    isDeadTimer: 0,
    uncertainDeathPosition: [0, 0],
    die: function(a) {
      if (a = !!a, this.isDead) this.deathWasCertain = a || this.deathWasCertain;
      else if (a || !this.didUncertainDeathLastTick) {
        a || (this.didUncertainDeathLastTick = !0, this.uncertainDeathPosition = [this.pos[0], this.pos[1]]), this.isDead = !0, this.deathWasCertain = a, this.deadAnimParts = [0], this.isDeadTimer = 0, this.isMyPlayer && doCamShakeDir(this.dir);
        for (var b = 0;;) {
          if (b += .4 * Math.random() + .5, b >= 2 * Math.PI) {
            this.deadAnimParts.push(2 * Math.PI);
            break
          }
          this.deadAnimParts.push(b), this.deadAnimPartsRandDist.push(Math.random())
        }
      }
    },
    deadAnimParts: [],
    deadAnimPartsRandDist: [],
    addHitLine: function(a, b) {
      this.hitLines.push({
        pos: a,
        vanishTimer: 0,
        color: b
      })
    },
    hitLines: [],
    doHonk: function(a) {
      this.honkTimer = 0, this.honkMaxTime = a
    },
    moveRelativeToServerPosNextFrame: !1,
    lastServerPosSentTime: 0,
    honkTimer: 0,
    honkMaxTime: 0,
    trails: [],
    name: "",
    skinBlock: 0,
    lastBlock: null
  }, b.push(c), c.isMyPlayer && (myPlayer = c), c
}

function lsSet(a, b) {
  try {
    return localStorage.setItem(a, b), !0
  } catch (a) {
    return !1
  }
}

function setName(a) {
  if (lsSet("name", a), "Denniskoe" == a) {
    var b = document.body.style;
    b.webkitFilter = b.filter = "contrast(200%) hue-rotate(90deg) invert(100%)"
  } else "Kwebbelkop" == a ? (lsSet("skinColor", 12), lsSet("skinPattern", 18), updateSkin()) : "Jelly" == a && (lsSet("skinColor", 8), lsSet("skinPattern", 19), updateSkin())
}

function sendName() {
  if (void 0 !== localStorage.name) wsSendMsg(sendAction.SET_USERNAME, localStorage.name);
  else {
    var a = nameInput.value;
    void 0 !== a && null !== a && "" !== a && "" !== a.trim() && wsSendMsg(sendAction.SET_USERNAME, a)
  }
}

function sendSkin() {
  var a = localStorage.getItem("skinColor");
  null === a && (a = 0);
  var b = localStorage.getItem("skinPattern");
  null === b && (b = 0), wsSendMsg(sendAction.SKIN, {
    blockColor: a,
    pattern: b
  })
}

function sendDir(a) {
  if (ws && myPos && !(!myPlayer || myPlayer.dir == a || 0 === a && 2 == myPlayer.dir || 2 == a && 0 === myPlayer.dir || 1 == a && 3 == myPlayer.dir || 3 == a && 1 == myPlayer.dir)) {
    mouseHidePos = [lastMousePos[0], lastMousePos[1]], document.body.style.cursor = "none";
    var b = 0 === a || 2 == a,
      c = myPos[b ? 1 : 0],
      d = [myPos[0], myPos[1]],
      e = Math.round(c);
    if (d[b ? 1 : 0] = e, !(0 === myPlayer.dir && d[0] <= lastChangeMyDirPos[0] || 1 == myPlayer.dir && d[1] <= lastChangeMyDirPos[1] || 2 == myPlayer.dir && d[0] >= lastChangeMyDirPos[0] || 3 == myPlayer.dir && d[1] >= lastChangeMyDirPos[1])) {
      var f = !1,
        g = c - Math.floor(c);
      myPlayer.dir <= 1 ? g < .45 && (f = !0) : g > .55 && (f = !0), f ? changeMyDir(a, d) : (myNextDir = a, changeDirAt = e, changeDirAtIsHorizontal = b), wsSendMsg(sendAction.UPDATE_DIR, {
        dir: a,
        coord: d
      })
    }
  }
}

function changeMyDir(a, b, c, d) {
  myPlayer.dir = myNextDir = a, myPlayer.pos = [b[0], b[1]], lastChangeMyDirPos = [b[0], b[1]], void 0 === c && (c = !0), void 0 === d && (d = !0), c && trailPush(myPlayer), d && lastClientsideMoves.push({
    dir: a,
    pos: b
  })
}

function startRequestMyTrail() {
  isRequestingMyTrail = !0, trailPushesDuringRequest = [], wsSendMsg(sendAction.REQUEST_MY_TRAIL)
}

function trailPush(a, b) {
  if (a.trails.length > 0) {
    var c = a.trails[a.trails.length - 1].trail;
    if (c.length > 0) {
      var d = c[c.length - 1];
      d[0] == a.pos[0] && d[1] == a.pos[1] || (b = void 0 === b ? [a.pos[0], a.pos[1]] : [b[0], b[1]], c.push(b), a.isMyPlayer && isRequestingMyTrail && trailPushesDuringRequest.push(b))
    }
  }
}

function honkStart() {
  honkStartTime = Date.now()
}

function honkEnd() {
  var a = Date.now();
  if (a > lastHonkTime) {
    var b = a - honkStartTime;
    b = clamp(b, 0, 1e3), lastHonkTime = a + b, b = iLerp(0, 1e3, b), b *= 255, b = Math.floor(b), wsSendMsg(sendAction.HONK, b);
    for (var c = 0; c < players.length; c++) {
      var d = players[c];
      d.isMyPlayer && d.doHonk(Math.max(70, b))
    }
  }
}

function onOpen() {
  isConnecting = !1, sendName(), sendSkin(), wsSendMsg(sendAction.READY), playingAndReady && hideBeginShowMainCanvas(), ga("send", "event", "Game", "game_start"), wsOnOpenTime = Date.now()
}

function hideBeginShowMainCanvas() {
  hideBegin(), showMainCanvas()
}

function hideBegin() {
  beginScreen.style.display = "none", beginScreenVisible = !1
}

function showMainCanvas() {
  playUI.style.display = null, mainCanvas.style.display = null, "ontouchstart" in window && (touchControlsElem.style.display = null), myNameAlphaTimer = 0, setNotification("")
}

function setNotification(a) {
  notificationElem.innerHTML = a, notificationElem.style.display = a ? null : "none"
}

function showBegin() {
  beginScreen.style.display = null, beginScreenVisible = !0, nameInput.focus()
}

function hideMainCanvas() {
  playUI.style.display = "none", mainCanvas.style.display = "none", touchControlsElem.style.display = "none"
}

function showSkinScreen() {
  skinScreenVisible = !0, skinScreen.style.display = null
}

function hideSkinScreen() {
  skinScreenVisible = !1, skinScreen.style.display = "none"
}

function openSkinScreen() {
  hideBegin(), showSkinScreen()
}

function showBeginHideMainCanvas() {
  showBegin(), hideMainCanvas()
}

function showBeginHideSkin() {
  showBegin(), hideSkinScreen()
}

function onClose() {
  if (ws && ws.readyState == WebSocket.OPEN && ws.close(), playingAndReady)
    if (closedBecauseOfDeath) {
      var a = Date.now() - wsOnOpenTime;
      ga("send", "timing", "Game", "game_session_time", a)
    } else doTransition("", !1, resetAll), ga("send", "event", "Game", "lost_connection_mid_game"), setNotification("The connection was lost :/");
  else isTransitioning ? showCouldntConnectAfterTransition = !0 : couldntConnect() && showBeginHideMainCanvas();
  ws = null, isConnecting = !1
}

function couldntConnect() {
  var a = Date.now() - serversJsonGetTime;
  return resetAll(), a /= 1e3, a > 5 ? (doConnectAfterServersGet = !0, getServers(), !1) : (setNotification("Couldn't connect to the server :/"), isTransitioning = !0, !0)
}

function connectWithTransition(a) {
  isConnectingWithTransition || isWaitingForAd || (isConnectingWithTransition = !0, doConnect(a) && (doTransition("", !1, function() {
    playingAndReady || (isTransitioning = !1), showCouldntConnectAfterTransition ? couldntConnect() : hideBeginShowMainCanvas(), showCouldntConnectAfterTransition = !1
  }), nameInput.blur(), setName(nameInput.value)), isConnectingWithTransition = !1)
}

function doConnect(a) {
  if (!ws && !isConnecting && !isTransitioning) {
    if (!a && flashIsInstalled && (canRunAds || localStorage.refreshDuringAd)) {
      var b = getAdCounter(),
        c = localStorage.lastAdTime;
      if (c = parseInt(c), c = Date.now() - c, 1 == b || !isNaN(c) && c > 3e5) return displayAd(), !1;
      countAd()
    }
    if (isConnecting = !0, showCouldntConnectAfterTransition = !1, closedBecauseOfDeath = !1, !serversRequestDone) return doConnectAfterServersGet = !0, !0;
    var d = getServer();
    return d ? (thisServerAvgPing = d.ping, ws = new WebSocket(d.ip), ws.binaryType = "arraybuffer", ws.onmessage = function(a) {
      ws == this && onMessage(a)
    }, ws.onclose = function(a) {
      ws == this && onClose(a)
    }, ws.onopen = function(a) {
      ws == this && onOpen(a)
    }, !0) : (onClose(), !1)
  }
  return !1
}

function onMessage(a) {
  var b, c, d, e, f, g, h, i, j, k, l, m = new Uint8Array(a.data);
  if (m[0] == receiveAction.UPDATE_BLOCKS && (b = bytesToInt(m[1], m[2]), c = bytesToInt(m[3], m[4]), d = m[5], i = getBlock(b, c), i.setBlockId(d)), m[0] == receiveAction.PLAYER_POS) {
    b = bytesToInt(m[1], m[2]), c = bytesToInt(m[3], m[4]), e = bytesToInt(m[5], m[6]), f = getPlayer(e), f.moveRelativeToServerPosNextFrame = !0, f.lastServerPosSentTime = Date.now();
    var n = m[7],
      o = [b, c],
      p = [b, c],
      q = !0;
    if (f.isMyPlayer) {
      var r = thisServerAvgPing / 2 * GLOBAL_SPEED;
      if (movePos(p, n, r), (f.dir == n || myNextDir == n) && Math.abs(p[0] - f.pos[0]) < 1 && Math.abs(p[1] - f.pos[1]) < 1 && (q = !1), lastClientsideMoves.length > 0) {
        var s = lastClientsideMoves.shift();
        s.dir == n && s.pos[0] == o[0] && s.pos[1] == o[1] ? q = !1 : lastClientsideMoves = []
      }
      q && (myNextDir = n, changeMyDir(n, o, !1, !1), startRequestMyTrail()), f.serverPos = [p[0], p[1]], f.serverDir = n, removeBlocksOutsideViewport(f.pos)
    } else f.dir = n;
    if (q) {
      f.pos = p;
      var t = m.length > 8;
      t && trailPush(f, o)
    }
    f.drawPosSet || (f.drawPos = [f.pos[0], f.pos[1]], f.drawPosSet = !0)
  }
  if (m[0] == receiveAction.FILL_AREA) {
    b = bytesToInt(m[1], m[2]), c = bytesToInt(m[3], m[4]), g = bytesToInt(m[5], m[6]), h = bytesToInt(m[7], m[8]), d = m[9];
    var u = m[10];
    fillArea(b, c, g, h, d, u)
  }
  if (m[0] == receiveAction.SET_TRAIL) {
    e = bytesToInt(m[1], m[2]), f = getPlayer(e);
    var v = [],
      w = !1;
    for (j = 3; j < m.length; j += 4) {
      var x = [bytesToInt(m[j], m[j + 1]), bytesToInt(m[j + 2], m[j + 3])];
      v.push(x)
    }
    if (f.isMyPlayer)
      if (skipTrailRequestResponse) skipTrailRequestResponse = !1, trailPushesDuringRequest = [];
      else {
        if (isRequestingMyTrail) {
          for (isRequestingMyTrail = !1, w = !0, j = 0; j < trailPushesDuringRequest.length; j++) v.push(trailPushesDuringRequest[j]);
          trailPushesDuringRequest = []
        }
        if (f.trails.length > 0) {
          var y = f.trails[f.trails.length - 1];
          y.trail.length <= 0 && v.length > 0 && startRequestMyTrail()
        }
      }
    if (w)
      if (f.trails.length > 0) {
        var z = f.trails[f.trails.length - 1];
        z.trail = v, z.vanishTimer = 0
      } else w = !1;
    w || f.trails.push({
      trail: v,
      vanishTimer: 0
    })
  }
  if (m[0] == receiveAction.EMPTY_TRAIL_WITH_LAST_POS) {
    if (e = bytesToInt(m[1], m[2]), f = getPlayer(e), f.trails.length > 0) {
      var A = f.trails[f.trails.length - 1].trail;
      A.length > 0 && (b = bytesToInt(m[3], m[4]), c = bytesToInt(m[5], m[6]), A.push([b, c]))
    }
    f.isMyPlayer && isRequestingMyTrail && (skipTrailRequestResponse = !0), f.trails.push({
      trail: [],
      vanishTimer: 0
    })
  }
  if (m[0] == receiveAction.PLAYER_DIE && (e = bytesToInt(m[1], m[2]), f = getPlayer(e), m.length > 3 && (b = bytesToInt(m[3], m[4]), c = bytesToInt(m[5], m[6]), f.pos = [b, c]), f.die(!0)), m[0] == receiveAction.CHUNK_OF_BLOCKS) {
    for (b = bytesToInt(m[1], m[2]), c = bytesToInt(m[3], m[4]), g = bytesToInt(m[5], m[6]), h = bytesToInt(m[7], m[8]), j = 9, k = b; k < b + g; k++)
      for (var B = c; B < c + h; B++) i = getBlock(k, B), i.setBlockId(m[j], !1), j++;
    hasReceivedChunkThisGame || (hasReceivedChunkThisGame = !0, wsSendMsg(sendAction.READY), didSendSecondReady = !0)
  }
  if (m[0] == receiveAction.REMOVE_PLAYER)
    for (e = bytesToInt(m[1], m[2]), j = players.length - 1; j >= 0; j--) f = players[j], e == f.id && players.splice(j, 1);
  if (m[0] == receiveAction.PLAYER_NAME) {
    e = bytesToInt(m[1], m[2]), l = m.subarray(3, m.length);
    var C = Utf8ArrayToStr(l);
    f = getPlayer(e), f.name = filter(C)
  }
  if (m[0] == receiveAction.MY_SCORE) {
    var D = bytesToInt(m[1], m[2], m[3], m[4]),
      E = 0;
    m.length > 5 && (E = bytesToInt(m[5], m[6])), scoreStatTarget = D, realScoreStatTarget = D + 500 * E, myKillsElem.innerHTML = E
  }
  if (m[0] == receiveAction.MY_RANK && (myRank = bytesToInt(m[1], m[2]), myRankSent = !0, updateStats()), m[0] == receiveAction.LEADERBOARD) {
    leaderboardElem.innerHTML = "", totalPlayers = bytesToInt(m[1], m[2]), updateStats(), j = 3;
    for (var F = 1;;) {
      if (j >= m.length) break;
      var G = bytesToInt(m[j], m[j + 1], m[j + 2], m[j + 3]),
        H = m[j + 4];
      l = m.subarray(j + 5, j + 5 + H);
      var I = Utf8ArrayToStr(l),
        J = document.createElement("tr");
      J.className = "scoreRank";
      var K = document.createElement("td");
      K.innerHTML = "#" + F, J.appendChild(K);
      var L = document.createElement("td");
      L.innerHTML = filter(htmlEscape(I)), J.appendChild(L);
      var M = document.createElement("td");
      M.innerHTML = G, J.appendChild(M), leaderboardElem.appendChild(J), j = j + 5 + H, F++
    }
    totalPlayers < 30 && doRefreshAfterDie && (closeNotification.style.display = null)
  }
  if (m[0] == receiveAction.MAP_SIZE && (mapSize = bytesToInt(m[1], m[2])), m[0] == receiveAction.YOU_DED) {
    if (m.length > 1) switch (lastStatBlocks = bytesToInt(m[1], m[2], m[3], m[4]), lastStatKills = bytesToInt(m[5], m[6]), lastStatLbRank = bytesToInt(m[7], m[8]), lastStatAlive = bytesToInt(m[9], m[10], m[11], m[12]), lastStatNo1Time = bytesToInt(m[13], m[14], m[15], m[16]), lastStatDeathType = m[17], lastStatKiller = "", document.getElementById("lastStats").style.display = null, lastStatCounter = 0, lastStatTimer = 0, lastStatValueElem.innerHTML = "", lastStatDeathType) {
      case 1:
        m.length > 18 && (l = m.subarray(18, m.length), lastStatKiller = Utf8ArrayToStr(l));
        break;
      case 2:
        lastStatKiller = "the wall";
        break;
      case 3:
        lastStatKiller = "yourself"
    }
    closedBecauseOfDeath = !0, allowSkipDeathTransition = !0, deathTransitionTimeout = window.setTimeout(function() {
      skipDeathTransition ? doTransition("", !1, function() {
        window.setTimeout(afterDeath, 700), onClose(), resetAll()
      }) : doTransition("GAME OVER", !0, null, function() {
        window.setTimeout(afterDeath, 250), onClose(), resetAll()
      }), deathTransitionTimeout = null
    }, 1e3)
  }
  if (m[0] == receiveAction.MINIMAP) {
    var N = m[1],
      O = 20 * N;
    for (minimapCtx.clearRect(2 * O, 0, 40, 160), minimapCtx.fillStyle = "#000000", j = 1; j < m.length; j++)
      for (k = 0; k < 8; k++) {
        var P = 0 !== (m[j] & 1 << k);
        if (P) {
          var Q = 8 * (j - 2) + k;
          b = Math.floor(Q / 80) % 80 + O, c = Q % 80, minimapCtx.fillRect(2 * b, 2 * c, 2, 2)
        }
      }
  }
  if (m[0] == receiveAction.PLAYER_SKIN && (e = bytesToInt(m[1], m[2]), f = getPlayer(e), f.isMyPlayer && colorUI(m[3]), f.skinBlock = m[3]), m[0] == receiveAction.READY && (playingAndReady = !0, isTransitioning || (isTransitioning = !0, hideBeginShowMainCanvas())), m[0] == receiveAction.PLAYER_HIT_LINE) {
    e = bytesToInt(m[1], m[2]), f = getPlayer(e);
    var R = getColorForBlockSkinId(m[3]);
    b = bytesToInt(m[4], m[5]), c = bytesToInt(m[6], m[7]), f.addHitLine([b, c], R), f.isMyPlayer && doCamShakeDir(f.dir, 10, !1)
  }
  if (m[0] == receiveAction.REFRESH_AFTER_DIE && (doRefreshAfterDie = !0), m[0] == receiveAction.PLAYER_HONK) {
    e = bytesToInt(m[1], m[2]), f = getPlayer(e);
    var S = m[3];
    f.doHonk(S)
  }
  if (m[0] == receiveAction.PONG) {
    var T = Date.now() - lastPingTime;
    thisServerAvgPing = lerp(thisServerAvgPing, T, .5), lastPingTime = Date.now(), waitingForPing = !1
  }
}

//a is packet name
//b is packet data
function wsSendMsg(a, b) {
  if (ws && ws.readyState == WebSocket.OPEN) {
    var c = [a];
    //If it is direction update
    if (a == sendAction.UPDATE_DIR) {
      // c is [1]

      c.push(b.dir);
      var d = intToBytes(b.coord[0], 2);
      c.push(d[0]), c.push(d[1]);
      var e = intToBytes(b.coord[1], 2);
      c.push(e[0]), c.push(e[1])
    }
    if (a == sendAction.SET_USERNAME) {
      var f = toUTF8Array(b);
      c.push.apply(c, f)
    }
    if (a == sendAction.SKIN && (c.push(b.blockColor), c.push(b.pattern)), a == sendAction.REQUEST_CLOSE)
      for (var g = 0; g < b.length; g++) c.push(b[g]);
    a == sendAction.HONK && c.push(b);
    var h = new Uint8Array(c);
    try {
      return ws.send(h), !0
    } catch (d) {
      console.log("error sending message", a, b, c, d)
    }
  }
  return !1
}

function resetAll() {
  ws && ws.readyState == WebSocket.OPEN && ws.close(), ws = null, isConnecting = !1, blocks = [], players = [], camPosSet = !1, beginScreenVisible = !0, myPos = null, myRank = 0, scoreStat = scoreStatTarget = realScoreStat = realScoreStatTarget = 25, myRankSent = !1, totalPlayers = 0, playingAndReady = !1, camShakeForces = [], titleComplete = !1, resetTitleNextFrame = !0, allowSkipDeathTransition = !1, skipDeathTransition = !1, minimapCtx.clearRect(0, 0, 160, 160), hasReceivedChunkThisGame = !1, didSendSecondReady = !1, showBeginHideMainCanvas(), doRefreshAfterDie && location.reload()
}

function initTutorial() {
  tutorialBlocks = [];
  for (var a = 0; a < 10; a++)
    for (var b = 0; b < 10; b++) {
      var c = getBlock(a, b, tutorialBlocks),
        d = 1;
      a >= 1 && a <= 3 && b >= 1 && b <= 3 && (d = 10), c.setBlockId(d, !1)
    }
  tutorialPlayers = [];
  var e = getPlayer(1, tutorialPlayers);
  e.skinBlock = 8;
  var f = getPlayer(2, tutorialPlayers);
  f.skinBlock = 0, f.pos = [-2, 7]
}

function initSkinScreen() {
  skinButtonCanvas = document.getElementById("skinButton"), skinButtonShadow = document.getElementById("skinButtonShadow"), shareTw = document.getElementById("shareTw"), shareFb = document.getElementById("shareFb"), shareTw.onclick = function() {
    popUp("https://twitter.com/intent/tweet?text=Check%20out%20this%20game%20I%27ve%20just%20found&amp;url=http://splix.io&amp;hashtags=splixio&amp;related=splixio%3AOfficial%20Twitter%20account,jespertheend%3ADeveloper,", 500, 300), share()
  }, shareFb.onclick = function() {
    popUp("https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.facebook.com%2Fsplix.io%2F&display=popup&ref=plugin&src=like&app_id=840486436000126", 500, 300), share()
  }, shareToUnlock = document.getElementById("shareToUnlock"), skinButtonCtx = skinButtonCanvas.getContext("2d"), skinButtonCanvas.onclick = function() {
    ws || isTransitioning || playingAndReady || doTransition("", !1, openSkinScreen)
  };
  var a = localStorage.getItem("skinColor");
  null === a && (a = 0), a = parseInt(a);
  var b = localStorage.getItem("skinPattern");
  null === b && (b = 0), b = parseInt(b), skinScreenBlocks = [], fillArea(0, 0, 2 * VIEWPORT_RADIUS, 2 * VIEWPORT_RADIUS, a + 1, b, skinScreenBlocks), document.getElementById("prevColor").onclick = function() {
    skinButton(-1, 0)
  }, document.getElementById("nextColor").onclick = function() {
    skinButton(1, 0)
  }, document.getElementById("prevPattern").onclick = function() {
    skinButton(-1, 1)
  }, document.getElementById("nextPattern").onclick = function() {
    skinButton(1, 1)
  }, document.getElementById("skinSave").onclick = function() {
    doTransition("", !1, showBeginHideSkin)
  };
  var c = getBlock(0, 0, skinButtonBlocks);
  c.setBlockId(a + 1, !1), skinButtonCanvas.onmouseover = function() {
    var a = localStorage.getItem("skinColor");
    null === a && (a = 0), a = parseInt(a), a > 0 && skinButtonBlocks[0].setBlockId(a + 1 + SKIN_BLOCK_COUNT, !1)
  }, skinButtonCanvas.onmouseout = function() {
    var a = localStorage.getItem("skinColor");
    null === a && (a = 0), skinButtonBlocks[0].setBlockId(parseInt(a) + 1, !1)
  }, checkShared()
}

function initTitle() {
  for (var a = 0; a < titleLines.length; a++)
    for (var b = titleLines[a], c = 0; c < b.line.length; c++)
      for (var d = b.line[c], e = 0; e < d.length; e += 2) d[e] += b.posOffset[0] - 40, d[e + 1] += b.posOffset[1] - 20;
  titCanvas = document.getElementById("logoCanvas"), titCtx = titCanvas.getContext("2d")
}

function displayAd() {
  isWaitingForAd = !0;
  var a = vastUrl.replace("[referrer_url]", document.referrer);
  a = a.replace("[timestamp]", (new Date).getTime()), a = encodeURIComponent(a), a = a.replace(/'/g, "%27").replace(/"/g, "%22");
  var b = '<center>  <object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"          codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=10,0,0,0"          width="960"          height="540"          id="jalAdPreloader"          align="middle">    <param name="allowScriptAccess" value="always" />    <param name="allowFullScreen" value="false" />    <param name="movie" value="http://api.adinplay.com/player.swf" />    <param name="quality" value="high" />    <param name="bgcolor" value="#000000" />    <param name="flashvars" value="adTagUrl=' + a + '">    <embed src="http://api.adinplay.com/player.swf"           quality="high"           bgcolor="#000000"           width="960"           height="540"           name="jalAdPreloader"           align="middle"           allowScriptAccess="always"           allowFullScreen="false"           type="application/x-shockwave-flash"           flashVars="adTagUrl=' + a + '"           pluginspage="http://www.adobe.com/go/getflashplayer" />  </object></center>';
  formElem.style.display = "none", prerollElem.innerHTML = b, scrollAd()
}

function fullslotAdReturned() {
  onAdLoaded()
}

function removeAdSwf() {
  onAdFinish()
}

function noAdsReturned() {
  onAdError("no ads returned")
}

function onAdLoaded(a) {
  console.log("ad loaded"), lsSet("refreshDuringAd", "true"), ga("send", "event", "ads", "ad_loaded"), document.getElementById("shareText").className = shareToUnlock.className = "adRunning"
}

function scrollAd() {
  var a = prerollElem.offsetTop,
    b = a + prerollElem.offsetHeight,
    c = document.documentElement.scrollTop || document.body.scrollTop,
    d = c + window.innerHeight,
    e = (a + b) / 2;
  (a < c || b > d) && window.scroll(0, e - window.innerHeight / 2)
}

function onAdError(a) {
  console.log("ad error: " + a), onAdFinish()
}

function onAdFinish() {
  countAd(), lsSet("refreshDuringAd", ""), lsSet("lastAdTime", Date.now()), formElem.style.display = null, prerollElem.innerHTML = "", document.getElementById("shareText").className = shareToUnlock.className = null, isConnectingWithTransition = !1, isWaitingForAd = !1, connectWithTransition(!0)
}

function getAdCounter() {
  var a = localStorage.adCounter;
  return void 0 === a && (a = 0), a = parseInt(a), isNaN(a) && (a = 0), a
}

function countAd() {
  var a = getAdCounter();
  a++, a > 5 && (a = 0), lsSet("adCounter", a)
}

function showCursor() {
  document.body.style.cursor = null
}

function afterDeath() {
  switch (afterDeathCounter++, afterDeathCounter) {
    case 1:
      window.twttr = function(a, b, c) {
          var d, e = a.getElementsByTagName(b)[0],
            f = window.twttr || {};
          return a.getElementById(c) ? f : (d = a.createElement(b), d.id = c, d.src = "https://platform.twitter.com/widgets.js", e.parentNode.insertBefore(d, e), f._e = [], f.ready = function(a) {
            f._e.push(a)
          }, f)
        }(document, "script", "twitter-wjs"), twttr.ready(function(a) {
          a.events.bind("rendered", function() {
            twttrIsInit = !0, testSocialReady()
          }), a.events.bind("tweet", function() {
            share()
          })
        }), window.fbAsyncInit = function() {
          FB.Event.subscribe("xfbml.render", function() {
            fbIsInit = !0, testSocialReady()
          })
        },
        function(a, b, c) {
          var d, e = a.getElementsByTagName(b)[0];
          a.getElementById(c) || (d = a.createElement(b), d.id = c, d.src = "//connect.facebook.net/en_US/sdk/xfbml.ad.js#xfbml=1&version=v2.5&appId=1812921762327343", e.parentNode.insertBefore(d, e))
        }(document, "script", "facebook-jssdk");
      var a = document.getElementsByTagName("head")[0],
        b = document.createElement("script");
      b.type = "text/javascript", b.src = "https://apis.google.com/js/platform.js", b.onload = function() {
        ytIsInit = !0
      }, a.appendChild(b);
      var c = document.createElement("script");
      c.type = "text/javascript", c.src = "/js/ads.js", c.onload = function() {
        ga("set", "dimension2", canRunAds ? "yes" : "no")
      }, c.onerror = function() {
        ga("set", "dimension2", "no")
      }, a.appendChild(c), document.getElementById("adbox").style.display = null
  }
}

function testSocialReady() {
  twttrIsInit && fbIsInit && ytIsInit && !doneOnSocialReady && (doneOnSocialReady = !0, onSocialReady())
}

function onSocialReady() {
  socialIsReady = !0, socialElem.style.display = null, window.setTimeout(function() {
    testSocialTarget()
  }, 500)
}

function testSocialTarget() {
  socialOTarget = socialIsReady ? socialHovering ? 1 : .2 : 0
}

function popUp(a, b, c) {
  var d = screen.width / 2 - b / 2,
    e = screen.height / 2 - c / 2;
  window.open(a, "_blank", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=" + b + ", height=" + c + ", top=" + e + ", left=" + d)
}

function share(a) {
  void 0 === a && (a = 3e3), window.setTimeout(function() {
    lsSet("s", 1), checkShared()
  }, a)
}

function checkShared() {
  var a = !!localStorage.s,
    b = a ? null : "none",
    c = a ? "none" : null;
  skinButtonCanvas.style.display = b, skinButtonShadow.style.display = b, shareToUnlock.style.display = c
}

function colorUI(a) {
  for (var b = getColorForBlockSkinId(a), c = b.brighter, d = b.darker, e = 0; e < uiElems.length; e++) {
    var f = uiElems[e];
    f.style.backgroundColor = c, f.style.boxShadow = "1px 1px " + d + ",2px 2px " + d + ",3px 3px " + d + ",4px 4px " + d + ",5px 5px " + d + ",10px 30px 80px rgba(0,0,0,0.3)"
  }
}

function skinButton(a, b) {
  if (0 === b) {
    var c = localStorage.getItem("skinColor");
    null === c && (c = 0), c = mod(parseInt(c) + a, SKIN_BLOCK_COUNT + 1), lsSet("skinColor", c)
  } else if (1 == b) {
    var d = localStorage.getItem("skinPattern"),
      e = [18, 19];
    null === d && (d = 0), d = parseInt(d);
    for (var f = !1; !f;) d += a, d = mod(d, SKIN_PATTERN_COUNT), e.indexOf(d) < 0 && (f = !0);
    lsSet("skinPattern", d)
  }
  updateSkin()
}

function updateSkin() {
  var a = parseInt(localStorage.skinColor) + 1;
  fillArea(0, 0, 2 * VIEWPORT_RADIUS, 2 * VIEWPORT_RADIUS, a, parseInt(localStorage.skinPattern), skinScreenBlocks), skinButtonBlocks[0].setBlockId(a)
}

function removeBlocksOutsideViewport(a) {
  for (i = blocks.length - 1; i >= 0; i--) {
    var b = blocks[i];
    (b.x < a[0] - 2 * VIEWPORT_RADIUS || b.x > a[0] + 2 * VIEWPORT_RADIUS || b.y < a[1] - 2 * VIEWPORT_RADIUS || b.y > a[1] + 2 * VIEWPORT_RADIUS) && blocks.splice(i, 1)
  }
}

function getColorForBlockSkinId(a) {
  switch (a) {
    case 0:
      return colors.red;
    case 1:
      return colors.red2;
    case 2:
      return colors.pink;
    case 3:
      return colors.pink2;
    case 4:
      return colors.purple;
    case 5:
      return colors.blue;
    case 6:
      return colors.blue2;
    case 7:
      return colors.green;
    case 8:
      return colors.green2;
    case 9:
      return colors.leaf;
    case 10:
      return colors.yellow;
    case 11:
      return colors.orange;
    default:
      return {
        brighter: "#000000",
        darker: "#000000",
        slightlyBrighter: "#000000"
      }
  }
}

function ctxCanvasSize(a) {
  var b = window.innerWidth,
    c = window.innerHeight;
  canvasTransformType == canvasTransformTypes.TUTORIAL && (b = c = 300), canvasTransformType == canvasTransformTypes.SKIN_BUTTON && (b = c = 30), canvasTransformType == canvasTransformTypes.TITLE && (b = 520, c = 180);
  var d = a.canvas;
  d.width = b * PIXEL_RATIO, d.height = c * PIXEL_RATIO;
  var e = 1;
  canvasTransformType == canvasTransformTypes.TITLE && (e = Math.min(1, (window.innerWidth - 30) / b)), d.style.width = b * e + "px", d.style.height = c * e + "px"
}

function ctxApplyCamTransform(a, b) {
  if (b && ctxCanvasSize(a), a.save(), canvasTransformType != canvasTransformTypes.MAIN && canvasTransformType != canvasTransformTypes.SKIN && a.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0), canvasTransformType == canvasTransformTypes.MAIN || canvasTransformType == canvasTransformTypes.SKIN) {
    var c = canvasTransformType == canvasTransformTypes.MAIN;
    a.translate(mainCanvas.width / 2, mainCanvas.height / 2);
    var d = Math.max(mainCanvas.width, mainCanvas.height),
      e = d / MAX_ZOOM,
      f = mainCanvas.width * mainCanvas.height,
      g = f / BLOCKS_ON_SCREEN,
      h = Math.sqrt(g) / 10,
      i = Math.max(h, e);
    c && a.rotate(camRotOffset), a.scale(i, i), c ? a.translate(10 * -camPosPrevFrame[0] - camPosOffset[0], 10 * -camPosPrevFrame[1] - camPosOffset[1]) : a.translate(10 * -VIEWPORT_RADIUS, 10 * -VIEWPORT_RADIUS)
  } else canvasTransformType != canvasTransformTypes.TUTORIAL && canvasTransformType != canvasTransformTypes.SKIN_BUTTON || a.scale(3, 3)
}

function doCamShake(a, b, c) {
  void 0 === c && (c = !0), camShakeForces.push([a, b, 0, !!c])
}

function doCamShakeDir(a, b, c) {
  void 0 === b && (b = 6);
  var d = 0,
    e = 0;
  switch (a) {
    case 0:
      d = b;
      break;
    case 1:
      e = b;
      break;
    case 2:
      d = -b;
      break;
    case 3:
      e = -b
  }
  doCamShake(d, e, c)
}

function calcCamOffset() {
  camPosOffset = [0, 0], camRotOffset = 0;
  for (var a = camShakeForces.length - 1; a >= 0; a--) {
    var b = camShakeForces[a];
    b[2] += .003 * deltaTime;
    var c = b[2],
      d = 0,
      e = 0;
    c < 1 ? (e = ease.out(c), d = ease.inout(c)) : c < 8 ? (e = ease.inout(iLerp(8, 1, c)), d = ease.in(iLerp(8, 1, c))) : camShakeForces.splice(a, 1), camPosOffset[0] += b[0] * e, camPosOffset[1] += b[1] * e, camPosOffset[0] += b[0] * Math.cos(8 * c) * .04 * d, camPosOffset[1] += b[1] * Math.cos(7 * c) * .04 * d, b[3] && (camRotOffset += .003 * Math.cos(9 * c) * d)
  }
  var f = 80;
  camPosOffset[0] /= f, camPosOffset[1] /= f, camPosOffset[0] = smoothLimit(camPosOffset[0]), camPosOffset[1] = smoothLimit(camPosOffset[1]), camPosOffset[0] *= f, camPosOffset[1] *= f
}

function lerp(a, b, c) {
  return a + c * (b - a)
}

function iLerp(a, b, c) {
  return (c - a) / (b - a)
}

function lerpt(a, b, c) {
  var d = 1 - Math.pow(1 - c, deltaTime / 16.66666);
  return lerp(a, b, d)
}

function lerpA(a, b, c) {
  for (var d = [], e = 0; e < a.length; e++) d.push(lerp(a[e], b[e], c));
  return d
}

function mod(a, b) {
  return (a % b + b) % b
}

function clamp(a, b, c) {
  return Math.max(b, Math.min(c, a))
}

function clamp01(a) {
  return clamp(a, 0, 1)
}

function randFromArray(a) {
  return a[Math.floor(Math.random() * a.length)]
}

function smoothLimit(a) {
  var b = a < 0;
  return b && (a *= -1), a = 1 - Math.pow(2, -a), b && (a *= -1), a
}

function updateStats() {
  myRank > totalPlayers && myRankSent ? totalPlayers = myRank : (totalPlayers < myRank || 0 === myRank && totalPlayers > 0) && (myRank = totalPlayers), myRankElem.innerHTML = myRank, totalPlayersElem.innerHTML = totalPlayers
}

function drawTrailOnCtx(a, b, c) {
  if (b.length > 0)
    for (var d = 0; d < a.length; d++) {
      var e = a[d],
        f = e.ctx;
      f.lineCap = "round", f.lineJoin = "round", f.lineWidth = 6, f.strokeStyle = e.color;
      var g = e.offset;
      f.beginPath(), f.moveTo(10 * b[0][0] + g, 10 * b[0][1] + g);
      for (var h = 1; h < b.length; h++) f.lineTo(10 * b[h][0] + g, 10 * b[h][1] + g);
      null !== c && f.lineTo(10 * c[0] + g, 10 * c[1] + g), f.stroke()
    }
}

function drawDiagonalLines(a, b, c, d, e) {
  if (c > 0) {
    a.lineCap = "butt", a.strokeStyle = b, a.lineWidth = c;
    var f = 20 * VIEWPORT_RADIUS,
      g = 0,
      h = 0;
    null !== camPosPrevFrame && canvasTransformType == canvasTransformTypes.MAIN && (g = Math.round((10 * camPosPrevFrame[0] - f / 2) / d) * d, h = Math.round((10 * camPosPrevFrame[1] - f / 2) / d) * d), g += e % d;
    for (var i = -f; i < f; i += d) {
      var j = g + i;
      a.beginPath(), a.moveTo(j, h), a.lineTo(j + f, h + f), a.stroke()
    }
  }
}

function drawAnimatedText(a, b, c, d, e, f, g, h, i, j, k) {
  var l;
  void 0 === g && (g = "white"), a.fillStyle = g, void 0 === h && (h = "Arial, Helvetica, sans-serif"), a.font = h = f + "px " + h, void 0 === k && (k = 0);
  for (var m = 0, n = 0; n < transitionText.length; n++) {
    var o = rndSeed(n + k);
    void 0 === j && (j = 3);
    var p = c * j - o * (j - o),
      q = transitionText[n],
      r = a.measureText(q).width,
      s = e - .77 * f;
    if (p < .8) tempCanvas.width = r, tempCanvas.height = f, tempCtx.font = h, tempCtx.fillStyle = "white", tempCtx.fillText(q, 0, .77 * f), p < .4 ? (l = p / .4, tempCtx.beginPath(), tempCtx.moveTo(0, lerp(f, 0, l)), tempCtx.lineTo(0, f), tempCtx.lineTo(lerp(0, r, l), f), tempCtx.closePath()) : (l = p / .4 - 1, tempCtx.moveTo(0, 0), tempCtx.lineTo(0, f), tempCtx.lineTo(r, f), tempCtx.lineTo(r, lerp(f, 0, l)), tempCtx.lineTo(lerp(0, r, l), 0)), tempCtx.globalCompositeOperation = "destination-in", tempCtx.fill(), a.drawImage(tempCanvas, d + m, s);
    else {
      l = Math.min(1, 5 * p - 4);
      var t = l * i;
      a.fillStyle = colors.green2.darker;
      for (var u = 0; u < t; u++) a.fillText(q, d + m - t + u, e - t + u);
      a.fillStyle = "white", a.fillText(q, d + m - t, e - t)
    }
    m += r - .5
  }
}

function orderTwoPos(a, b) {
  var c = Math.min(a[0], b[0]),
    d = Math.min(a[1], b[1]),
    e = Math.max(a[0], b[0]),
    f = Math.max(a[1], b[1]);
  return [
    [c, d],
    [e, f]
  ]
}

function fillArea(a, b, c, d, e, f, g) {
  var h = void 0 === g;
  h && (g = blocks), void 0 === f && (f = 0);
  var i = a + c,
    j = b + d;
  null !== myPos && h && (a = Math.max(a, Math.round(myPos[0]) - VIEWPORT_RADIUS), b = Math.max(b, Math.round(myPos[1]) - VIEWPORT_RADIUS), i = Math.min(i, Math.round(myPos[0]) + VIEWPORT_RADIUS), j = Math.min(j, Math.round(myPos[1]) + VIEWPORT_RADIUS));
  for (var k = a; k < i; k++)
    for (var l = b; l < j; l++) {
      var m = getBlock(k, l, g),
        n = applyPattern(e, f, k, l);
      m.setBlockId(n, 400 * Math.random())
    }
}

function applyPattern(a, b, c, d) {
  var e, f;
  if (a < 2) return a;
  var g = !1;
  switch (b) {
    case 1:
      g = c % 2 === 0 && d % 2 === 0;
      break;
    case 2:
      g = c % 2 == (d % 2 === 0 ? 0 : 1);
      break;
    case 3:
      g = d % 3 < 1 ? c % 3 > 0 : c % 3 < 1;
      break;
    case 4:
      g = c % 5 === 0 || d % 5 === 0;
      break;
    case 5:
      g = (c - d) % 5 === 0;
      break;
    case 6:
      g = Math.random() > .5;
      break;
    case 7:
      e = (c + 7) % 100, f = (d + 7) % 100, g = f < 2 && (e < 2 || e > 3 && e < 6) || 2 == f && e > 1 && e < 4 || f > 2 && f < 5 && e > 0 && e < 5 || 5 == f && (1 == e || 4 == e);
      break;
    case 8:
      g = c % 2 == (d % 2 === 0 ? 0 : 1) && c % 4 !== 0 && d % 4 != 1;
      break;
    case 9:
      g = mod(c % 8 < 4 ? c + d : c - d - 4, 8) < 3;
      break;
    case 10:
      g = c % 2 == (d % 2 === 0 ? 0 : 1) && mod(c % 8 < 4 ? c + d : c - d - 4, 8) < 3;
      break;
    case 11:
      e = c % 10, f = d % 10, g = (0 === e || 6 == e) && f < 7 || (2 == e || 4 == e) && f > 1 && f < 5 || (7 == e || 9 == e) && f > 6 || (0 === f || 6 == f) && e < 7 || (2 == f || 4 == f) && e > 1 && e < 5 || (7 == f || 9 == f) && e > 6;
      break;
    case 12:
      e = (d % 12 < 6 ? c + 5 : c) % 10, f = d % 6, g = f < 4 && e > 0 && e < 6 && 3 != e || f > 0 && f < 3 && e < 7 || e > 1 && e < 5 && f > 2 && f < 5 || 3 == e && 5 == f;
      break;
    case 13:
      g = !(!((c + d) % 10 < 1 || mod(c - d, 10) < 1 || (c + 1) % 10 < 3 && (d + 1) % 10 < 3 || (c + 6) % 10 < 3 && (d + 6) % 10 < 3) || c % 10 === 0 && d % 10 === 0 || c % 10 == 5 && d % 10 == 5);
      break;
    case 14:
      e = (d % 10 < 5 ? c + 5 : c) % 10, f = d % 5, g = (1 == e || 4 == e) && f > 1 && f < 4 || (1 == f || 4 == f) && e > 1 && e < 4;
      break;
    case 15:
      g = (c + d) % 6 < 1 || mod(c - d, 6) < 1 && c % 6 < 3;
      break;
    case 16:
      e = c % 6, f = d % 6, g = 1 == e && f > 2 && f < 5 || 4 == e && f > 0 && f < 3 || 4 == f && e > 2 && e < 5 || 1 == f && e > 0 && e < 3;
      break;
    case 17:
      g = Math.random() > .99;
      break;
    case 18:
    case 19:
      var h, i, j, k = 0,
        l = 0;
      switch (b) {
        case 18:
          i = 18, j = 18, l = 6, h = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
            [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
            [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0],
            [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
            [1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
            [1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0],
            [1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0],
            [1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
            [1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
            [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0]
          ];
          break;
        case 19:
          i = 14, j = 10, k = 7, l = 0, h = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0],
            [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          ]
      }
      k *= Math.floor(d / j), l *= Math.floor(c / i), e = (c + k) % i, f = (d + l) % j, g = 1 == h[f][e]
  }
  return g && (a += SKIN_BLOCK_COUNT), a
}

function bindSwipeEvents() {
  touchControlsElem.addEventListener("touchstart", onTouchStart), touchControlsElem.addEventListener("touchmove", onTouchMove), touchControlsElem.addEventListener("touchend", onTouchEnd), touchControlsElem.addEventListener("touchcancel", onTouchEnd)
}

function onTouchStart(a) {
  var b = a.touches[a.touches.length - 1];
  currentTouches.push({
    prevPos: [b.pageX, b.pageY],
    prevTime: Date.now(),
    id: b.identifier
  })
}

function onTouchMove(a) {
  for (var b = a.touches, c = 0; c < b.length; c++) {
    for (var d = b[c], e = null, f = 0; f < currentTouches.length; f++)
      if (currentTouches[f].id == d.identifier) {
        e = currentTouches[f];
        break
      }
    e && calcTouch(e, d)
  }
  a.preventDefault()
}

function calcTouch(a, b) {
  var c = Date.now(),
    d = c - a.prevTime,
    e = [b.pageX, b.pageY],
    f = a.prevPos,
    g = f[0] - e[0],
    h = f[1] - e[1],
    i = Math.sqrt(Math.pow(g, 2) + Math.pow(h, 2)),
    j = i / d;
  j *= PIXEL_RATIO, a.prevTime = c, a.prevPos = e, d > 0 && j > 2 && sendDir(Math.abs(g) > Math.abs(h) ? g > 0 ? 2 : 0 : h > 0 ? 3 : 1)
}

function onTouchEnd(a) {
  for (var b = currentTouches.length - 1; b >= 0; b--)
    for (var c = 0; c < a.touches.length; c++) currentTouches[b].id == a.touches[c].identifier && (calcTouch(currentTouches[b], a.touches[c]), currentTouches.splice(b, 1))
}

function doTransition(a, b, c, d) {
  isTransitioning || (transitionText = a, isTransitioning = !0, transitionDirection = 1, transitionTimer = transitionPrevTimer = 0, transitionCanvas.style.display = null, void 0 === b && (b = !1), transitionReverseOnHalf = b, transitionCallback1 = c, transitionCallback2 = d)
}

function doSkipDeathTransition() {
  allowSkipDeathTransition && (null !== deathTransitionTimeout && (window.clearTimeout(deathTransitionTimeout), deathTransitionTimeout = null, onClose(), doTransition("", !1, function() {
    window.setTimeout(afterDeath, 700), resetAll()
  })), skipDeathTransition = !0)
}

function rndSeed(a) {
  var b = 1e4 * Math.sin(a);
  return b - Math.floor(b)
}

function drawTitle(a, b, c, d, e) {
  a.strokeStyle = c ? colors.red.patternEdge : colors.red.brighter, a.lineWidth = 16, a.lineJoin = "round", a.lineCap = "round", e ? (a.shadowBlur = 40 * PIXEL_RATIO, a.shadowColor = "rgba(0,0,0,0.4)", a.shadowOffsetX = a.shadowOffsetY = 10 * PIXEL_RATIO) : a.shadowColor = "rgba(0,0,0,0)";
  for (var f = titleTimer, g = 0; g < titleLines.length; g++) {
    var h = titleLines[g],
      i = clamp01(f * h.speed - h.offset),
      j = clamp01(f);
    j *= 5, void 0 !== d && (j = Math.min(j, d)), a.beginPath();
    for (var k = 0; k < h.line.length; k++) {
      var l = h.line[k],
        m = clamp01(i * (h.line.length - 1) - k + 1);
      if (m > 0)
        if (1 == m) 0 === k && 2 == l.length ? a.moveTo(l[0] - j, l[1] - j) : 2 == l.length ? a.lineTo(l[0] - j, l[1] - j) : 6 == l.length && a.bezierCurveTo(l[0] - j, l[1] - j, l[2] - j, l[3] - j, l[4] - j, l[5] - j);
        else {
          var n = h.line[k - 1],
            o = [n[n.length - 2], n[n.length - 1]];
          if (2 == l.length) a.lineTo(lerp(o[0], l[0], m) - j, lerp(o[1], l[1], m) - j);
          else if (6 == l.length) {
            var p = o,
              q = [l[0], l[1]],
              r = [l[2], l[3]],
              s = [l[4], l[5]],
              t = lerpA(p, q, m),
              u = lerpA(q, r, m),
              v = lerpA(r, s, m),
              w = lerpA(t, u, m),
              x = lerpA(u, v, m),
              y = lerpA(w, x, m);
            a.bezierCurveTo(t[0] - j, t[1] - j, w[0] - j, w[1] - j, y[0] - j, y[1] - j)
          }
        }
    }
    a.stroke()
  }
}

function drawBlocks(a, b, c) {
  for (var d, e = 0; e < b.length; e++) {
    var f = b[e];
    if (c && (f.x < camPos[0] - VIEWPORT_RADIUS || f.x > camPos[0] + VIEWPORT_RADIUS || f.y < camPos[1] - VIEWPORT_RADIUS || f.y > camPos[1] + VIEWPORT_RADIUS));
    else if (f.animDelay > 0 ? f.animDelay -= deltaTime : f.animProgress += deltaTime * f.animDirection * .003, f.animProgress > 1 && (f.animDirection = 0, f.animProgress = 1), f.animProgress < 0) f.currentBlock = f.nextBlock, f.animDirection = 1, f.animProgress = 0;
    else {
      var g = f.animProgress;
      if (0 === f.currentBlock && (a.fillStyle = colors.red.boundsDark, a.fillRect(10 * f.x, 10 * f.y, 10, 10), linesCtx.fillStyle = colors.grey.diagonalLines, linesCtx.fillRect(10 * f.x, 10 * f.y, 10, 10)), 1 == f.currentBlock && (g > .8 && (a.fillStyle = colors.grey.darker, a.fillRect(10 * f.x + 2, 10 * f.y + 2, 7, 7)), a.fillStyle = colors.grey.brighter, 1 == g ? a.fillRect(10 * f.x + 1, 10 * f.y + 1, 7, 7) : g < .4 ? (d = 2.5 * g, a.beginPath(), a.moveTo(10 * f.x + 2, 10 * f.y + lerp(9, 2, d)), a.lineTo(10 * f.x + 2, 10 * f.y + 9), a.lineTo(10 * f.x + lerp(2, 9, d), 10 * f.y + 9), a.fill()) : g < .8 ? (d = 2.5 * g - 1, a.beginPath(), a.moveTo(10 * f.x + 2, 10 * f.y + 2), a.lineTo(10 * f.x + 2, 10 * f.y + 9), a.lineTo(10 * f.x + 9, 10 * f.y + 9), a.lineTo(10 * f.x + 9, 10 * f.y + lerp(9, 2, d)), a.lineTo(10 * f.x + lerp(2, 9, d), 10 * f.y + 2), a.fill()) : (d = 5 * g - 4, a.fillRect(10 * f.x + lerp(2, 1, d), 10 * f.y + lerp(2, 1, d), 7, 7))), f.currentBlock >= 2) {
        var h = getColorForBlockSkinId((f.currentBlock - 2) % SKIN_BLOCK_COUNT),
          i = f.currentBlock > SKIN_BLOCK_COUNT + 1,
          j = i ? h.pattern : h.brighter,
          k = i ? h.patternEdge : h.darker;
        g > .8 && (a.fillStyle = k, a.fillRect(10 * f.x + 1, 10 * f.y + 1, 9, 9)), a.fillStyle = j, 1 == g ? a.fillRect(10 * f.x, 10 * f.y, 9, 9) : g < .4 ? (d = 2.5 * g, a.beginPath(), a.moveTo(10 * f.x + 1, 10 * f.y + lerp(10, 1, d)), a.lineTo(10 * f.x + 1, 10 * f.y + 10), a.lineTo(10 * f.x + lerp(1, 10, d), 10 * f.y + 10), a.fill()) : g < .8 ? (d = 2.5 * g - 1, a.beginPath(), a.moveTo(10 * f.x + 1, 10 * f.y + 1), a.lineTo(10 * f.x + 1, 10 * f.y + 10), a.lineTo(10 * f.x + 10, 10 * f.y + 10), a.lineTo(10 * f.x + 10, 10 * f.y + lerp(10, 1, d)), a.lineTo(10 * f.x + lerp(1, 10, d), 10 * f.y + 1), a.fill()) : (d = 5 * g - 4, a.fillRect(10 * f.x + lerp(1, 0, d), 10 * f.y + lerp(1, 0, d), 9, 9))
      }
    }
  }
}

function drawPlayer(a, b, c) {
  var d, e, f = getColorForBlockSkinId(b.skinBlock);
  if (b.trails.length > 0)
    for (var g = b.trails.length - 1; g >= 0; g--) {
      var h = b.trails[g],
        i = g == b.trails.length - 1;
      if (!i || b.isDead) {
        var j = b.isDead && i ? .006 : .02;
        h.vanishTimer += deltaTime * j, !i && h.vanishTimer > 10 && b.trails.splice(g, 1)
      }
      if (h.trail.length > 0) {
        var k = i ? b.drawPos : null;
        h.vanishTimer > 0 ? (ctxApplyCamTransform(tempCtx, !0), drawTrailOnCtx([{
          ctx: tempCtx,
          color: f.darker,
          offset: 5
        }, {
          ctx: tempCtx,
          color: f.brighter,
          offset: 4
        }], h.trail, k), tempCtx.globalCompositeOperation = "destination-out", drawDiagonalLines(tempCtx, "white", h.vanishTimer, 10, .003 * c), a.restore(), tempCtx.restore(), linesCtx.restore(), a.drawImage(tempCanvas, 0, 0), tempCtx.fillStyle = colors.grey.diagonalLines, tempCtx.globalCompositeOperation = "source-in", tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height), linesCtx.drawImage(tempCanvas, 0, 0), ctxApplyCamTransform(a), ctxApplyCamTransform(linesCtx)) : drawTrailOnCtx([{
          ctx: a,
          color: f.darker,
          offset: 5
        }, {
          ctx: a,
          color: f.brighter,
          offset: 4
        }, {
          ctx: linesCtx,
          color: colors.grey.diagonalLines,
          offset: 4
        }], h.trail, k)
      }
    }
  var l = [10 * b.drawPos[0] + 4.5, 10 * b.drawPos[1] + 4.5],
    m = 6,
    n = .3,
    o = a.createRadialGradient(l[0] - 3, l[1] - 3, 0, l[0], l[1], m);
  if (o.addColorStop(0, f.slightlyBrighter), o.addColorStop(1, f.brighter), linesCtx.fillStyle = "white", b.isDead) {
    b.isDeadTimer += .003 * deltaTime, a.fillStyle = o;
    for (var p = 0; p < b.deadAnimParts.length - 1; p++) {
      var q = b.deadAnimParts[p],
        r = b.deadAnimParts[p + 1],
        s = lerp(q, r, .5),
        t = b.dir * Math.PI / 2 - Math.PI,
        u = Math.min(Math.abs(t - s), Math.abs(t - 2 * Math.PI - s), Math.abs(t + 2 * Math.PI - s)),
        v = b.deadAnimPartsRandDist[p],
        x = (1 - Math.pow(2, -2 * b.isDeadTimer)) * u * 5 * (v + 1),
        y = [Math.cos(s) * x, Math.sin(s) * x];
      a.globalAlpha = linesCtx.globalAlpha = Math.max(0, 1 - .2 * b.isDeadTimer), a.beginPath(), a.arc(l[0] - n + y[0], l[1] - n + y[1], m, q, r, !1), a.lineTo(l[0] - n + y[0], l[1] - n + y[1]), a.fill(), linesCtx.beginPath(), linesCtx.arc(l[0] - n + y[0], l[1] - n + y[1], m, q, r, !1), linesCtx.lineTo(l[0] - n + y[0], l[1] - n + y[1]), linesCtx.fill()
    }
    a.globalAlpha = linesCtx.globalAlpha = 1
  } else a.fillStyle = f.darker, a.beginPath(), a.arc(l[0] + n, l[1] + n, m, 0, 2 * Math.PI, !1), a.fill(), a.fillStyle = o, a.beginPath(), a.arc(l[0] - n, l[1] - n, m, 0, 2 * Math.PI, !1), a.fill(), linesCtx.beginPath(), linesCtx.arc(l[0] + n, l[1] + n, m, 0, 2 * Math.PI, !1), linesCtx.fill(), linesCtx.beginPath(), linesCtx.arc(l[0] - n, l[1] - n, m, 0, 2 * Math.PI, !1), linesCtx.fill();
  if (b.isMyPlayer && "true" == localStorage.drawActualPlayerPos && (a.fillStyle = "#FF0000", a.beginPath(), a.arc(10 * b.serverPos[0] + 5, 10 * b.serverPos[1] + 5, m, 0, 2 * Math.PI, !1), a.fill()), b.hitLines.length > 0)
    for (var z = b.hitLines.length - 1; z >= 0; z--) {
      var A = b.hitLines[z];
      A.vanishTimer += .004 * deltaTime;
      var B = A.vanishTimer;
      if (B > 4 && b.hitLines.splice(z, 1), d = 10 * A.pos[0] + 5, e = 10 * A.pos[1] + 5, B < 2) {
        var C = Math.max(0, 18 * ease.out(iLerp(0, 2, B))),
          D = Math.max(0, 18 * ease.out(iLerp(.5, 2, B)));
        a.fillStyle = f.brighter, a.beginPath(), a.arc(d, e, C, 0, 2 * Math.PI, !1), a.arc(d, e, D, 0, 2 * Math.PI, !1), a.fill("evenodd"), linesCtx.beginPath(), linesCtx.arc(d, e, C, 0, 2 * Math.PI, !1), linesCtx.arc(d, e, D, 0, 2 * Math.PI, !1), linesCtx.fill("evenodd")
      }
      if (void 0 !== A.color) {
        a.save(), a.font = linesCtx.font = "6px Arial, Helvetica, sans-serif", a.fillStyle = A.color.brighter, a.shadowColor = A.color.darker, a.shadowOffsetX = a.shadowOffsetY = 2, w = a.measureText("+500").width;
        var E, F;
        F = B < .5 ? iLerp(0, .5, B) : B < 3.5 ? 1 : iLerp(4, 3.5, B), F = clamp01(F), E = B < 2 ? 20 * ease.out(B / 2) : 20, a.globalAlpha = F, a.fillText("+500", d - w / 2, e - E), a.restore()
      }
    }
  if (b.honkTimer < b.honkMaxTime && (b.honkTimer += .255 * deltaTime, a.fillStyle = f.brighter, a.globalAlpha = clamp01(iLerp(b.honkMaxTime, 0, b.honkTimer)), a.beginPath(), a.arc(10 * b.drawPos[0] + 4.5 + n, 10 * b.drawPos[1] + 4.5 + n, m + .1 * b.honkTimer, 0, 2 * Math.PI, !1), a.fill(), a.globalAlpha = 1, linesCtx.globalAlpha = clamp01(iLerp(b.honkMaxTime, 0, b.honkTimer)), linesCtx.beginPath(), linesCtx.arc(10 * b.drawPos[0] + 4.5 + n, 10 * b.drawPos[1] + 4.5 + n, m + .1 * b.honkTimer, 0, 2 * Math.PI, !1), linesCtx.fill(), linesCtx.globalAlpha = 1), myNameAlphaTimer += .001 * deltaTime, a.font = linesCtx.font = USERNAME_SIZE + "px Arial, Helvetica, sans-serif", b.name) {
    var G = 1,
      H = 1;
    b.isMyPlayer && (H = 9 - myNameAlphaTimer), b.isDead && (G = 1 - b.isDeadTimer);
    var I = Math.min(G, H);
    if (I > 0) {
      a.save(), linesCtx.save(), a.globalAlpha = clamp01(I);
      var J = a.measureText(b.name).width;
      J = Math.min(100, J), d = 10 * b.drawPos[0] + 5 - J / 2, e = 10 * b.drawPos[1] - 5, a.rect(d - 4, e - 1.2 * USERNAME_SIZE, J + 8, 2 * USERNAME_SIZE), a.clip(), linesCtx.rect(d - 4, e - 1.2 * USERNAME_SIZE, J + 8, 2 * USERNAME_SIZE), linesCtx.clip(), linesCtx.fillText(b.name, d, e), a.shadowColor = "rgba(0,0,0,0.9)", a.shadowBlur = 10, a.shadowOffsetX = a.shadowOffsetY = 2, a.fillStyle = f.brighter, a.fillText(b.name, d, e), a.shadowColor = f.darker, a.shadowBlur = 0, a.shadowOffsetX = a.shadowOffsetY = .8, a.fillText(b.name, d, e), a.restore(), linesCtx.restore()
    }
  }
}

function moveDrawPosToPos(a) {
  var b = null;
  b = a.isDead && !a.deathWasCertain ? a.uncertainDeathPosition : a.pos, a.drawPos[0] = lerpt(a.drawPos[0], b[0], .23), a.drawPos[1] = lerpt(a.drawPos[1], b[1], .23)
}

function movePos(a, b, c) {
  switch (b) {
    case 0:
      a[0] += c;
      break;
    case 1:
      a[1] += c;
      break;
    case 2:
      a[0] -= c;
      break;
    case 3:
      a[1] -= c
  }
}

function getDtCap(a) {
  return dtCaps[clamp(a, 0, dtCaps.length - 1)]
}

function loop(a) {
  var b, c, d, e, f = a - prevTimeStamp;
  if (f < lerp(getDtCap(currentDtCap), getDtCap(currentDtCap - 1), .9))
    for (gainedFrames.push(Date.now()); gainedFrames.length > 190;) {
      if (!(Date.now() - gainedFrames[0] > 1e4)) {
        currentDtCap--, gainedFrames = [], currentDtCap = clamp(currentDtCap, 0, dtCaps.length - 1);
        break
      }
      gainedFrames.splice(0, 1)
    }
  if (f > lerp(getDtCap(currentDtCap), getDtCap(currentDtCap + 1), .05))
    for (missedFrames.push(Date.now()), gainedFrames = []; missedFrames.length > 5;) {
      if (!(Date.now() - missedFrames[0] > 5e3)) {
        currentDtCap++, missedFrames = [], currentDtCap = clamp(currentDtCap, 0, dtCaps.length - 1);
        break
      }
      missedFrames.splice(0, 1)
    }
  if (deltaTime = f + totalDeltaTimeFromCap, prevTimeStamp = a, deltaTime < getDtCap(currentDtCap) && "true" != localStorage.dontCapFps) totalDeltaTimeFromCap += f;
  else {
    totalDeltaTimeFromCap = 0, canvasTransformType = canvasTransformTypes.MAIN, ctxCanvasSize(ctx), ctxCanvasSize(linesCtx), ctx.fillStyle = colors.grey.BG, ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height), linesCtx.fillStyle = "white", linesCtx.fillRect(0, 0, linesCanvas.width, linesCanvas.height), camPosPrevFrame = [camPos[0], camPos[1]], calcCamOffset(), ctxApplyCamTransform(ctx), ctxApplyCamTransform(linesCtx), drawBlocks(ctx, blocks, !0);
    for (var g = deltaTime * GLOBAL_SPEED, h = 0; h < players.length; h++) {
      var i = players[h];
      if (!i.isDead || !i.deathWasCertain) {
        if (i.moveRelativeToServerPosNextFrame && (g = (Date.now() - i.lastServerPosSentTime) * GLOBAL_SPEED), i.isMyPlayer && (movePos(i.serverPos, i.serverDir, g), i.serverDir == i.dir)) {
          var j = 0;
          "true" != localStorage.dontSlowPlayersDown && (0 === i.dir || 2 == i.dir ? i.pos.y == i.serverPos.y && (j = 0 === i.dir ? i.pos[0] - i.serverPos[0] : i.serverPos[0] - i.pos[0]) : i.pos.x == i.serverPos.x && (j = 1 == i.dir ? i.pos[1] - i.serverPos[1] : i.serverPos[1] - i.pos[1])), j = Math.max(0, j), g *= lerp(.5, 1, iLerp(5, 0, j))
        }
        movePos(i.pos, i.dir, g)
      }
      i.moveRelativeToServerPosNextFrame = !1, moveDrawPosToPos(i);
      var k = !1;
      if (i.drawPos[0] <= 0 || i.drawPos[1] <= 0 || i.drawPos[0] >= mapSize - 1 || i.drawPos[1] >= mapSize - 1) k = !0;
      else if (i.trails.length > 0) {
        c = i.trails[i.trails.length - 1].trail;
        var l = [Math.round(i.drawPos[0]), Math.round(i.drawPos[1])];
        if (Math.abs(l[0] - i.drawPos[0]) < .2 && Math.abs(l[1] - i.drawPos[1]) < .2) {
          var m = !0;
          for (b = c.length - 3; b >= 0; b--) {
            var n = [Math.round(c[b][0]), Math.round(c[b][1])],
              o = [Math.round(c[b + 1][0]), Math.round(c[b + 1][1])],
              p = orderTwoPos(n, o);
            l[0] >= p[0][0] && l[0] <= p[1][0] && l[1] >= p[0][1] && l[1] <= p[1][1] ? (m || (k = !0), m = !0) : m = !1
          }
        }
      }
      if (k ? i.isDead || i.die() : i.didUncertainDeathLastTick = !1, i.isDead && !i.deathWasCertain && i.isDeadTimer > 1.5 && (i.isDead = !1, i.trails.length > 0 && (c = i.trails[i.trails.length - 1], c.vanishTimer = 0)), i.isMyPlayer && (myPos = [i.pos[0], i.pos[1]], lastMyPosSetTime = Date.now(), miniMapPlayer.style.left = myPos[0] / mapSize * 160 + 1.5 + "px", miniMapPlayer.style.top = myPos[1] / mapSize * 160 + 1.5 + "px", camPosSet ? (camPos[0] = lerpt(camPos[0], i.pos[0], .03), camPos[1] = lerpt(camPos[1], i.pos[1], .03)) : (camPos = [i.pos[0], i.pos[1]], camPosSet = !0), myNextDir != i.dir)) {
        var q = 0 === i.dir || 2 == i.dir;
        if (changeDirAtIsHorizontal != q) {
          var r = !1,
            s = i.pos[q ? 0 : 1];
          if (0 === i.dir || 1 == i.dir ? changeDirAt < s && (r = !0) : changeDirAt > s && (r = !0), r) {
            var t = [i.pos[0], i.pos[1]],
              u = Math.abs(changeDirAt - s);
            t[q ? 0 : 1] = changeDirAt, changeMyDir(myNextDir, t), movePos(i.pos, i.dir, u)
          }
        }
      }
      drawPlayer(ctx, i, a)
    }
    if (drawDiagonalLines(linesCtx, "white", 5, 10, .008 * a), ctx.restore(), linesCtx.restore(), ctx.globalCompositeOperation = "multiply", ctx.drawImage(linesCanvas, 0, 0), ctx.globalCompositeOperation = "source-over", scoreStat = lerpt(scoreStat, scoreStatTarget, .1), myScoreElem.innerHTML = Math.ceil(scoreStat), realScoreStat = lerpt(realScoreStat, realScoreStatTarget, .1), myRealScoreElem.innerHTML = Math.ceil(realScoreStat), isTransitioning) {
      var v = 10,
        w = 60,
        x = 2,
        y = 10,
        z = 5;
      if (w *= PIXEL_RATIO, z *= PIXEL_RATIO, transitionTimer += deltaTime * transitionDirection * .001, 1 == transitionDirection && null !== transitionCallback1 && transitionTimer >= .5 && transitionPrevTimer < .5 && (transitionTimer = .5, transitionCallback1()), transitionDirection == -1 && null !== transitionCallback2 && transitionTimer <= .5 && transitionPrevTimer > .5 && (transitionTimer = .5, transitionCallback2()), transitionReverseOnHalf && 1 == transitionDirection && transitionTimer >= 1 + x && transitionPrevTimer < 1 + x && (transitionDirection = -1, transitionTimer = 1), transitionPrevTimer = transitionTimer, transitionTimer <= 0 && transitionReverseOnHalf || transitionTimer >= x + 1.5 && !transitionReverseOnHalf) transitionDirection = 0, isTransitioning = !1, transitionCanvas.style.display = "none";
      else {
        ctxCanvasSize(tCtx);
        var A = transitionCanvas.width,
          B = transitionCanvas.height;
        if (d = transitionTimer, d < .5 ? (e = 2 * d, e = ease.in(e), tCtx.fillStyle = colors.green2.darker, tCtx.fillRect(0, lerp(-v, B / 2, e), A, v), tCtx.fillStyle = colors.green2.brighter, tCtx.fillRect(0, -v, A, lerp(0, B / 2 + v, e)), tCtx.fillRect(0, lerp(B, B / 2, e), A, B)) : d < 1 ? (e = 2 * d - 1, e = ease.out(e), transitionText ? (tCtx.fillStyle = colors.green2.darker, tCtx.fillRect(0, lerp(0, B / 2 - w / 2, e), A, lerp(B, w + v, e)), tCtx.fillStyle = colors.green2.brighter, tCtx.fillRect(0, lerp(0, B / 2 - w / 2, e), A, lerp(B, w, e))) : (tCtx.fillStyle = colors.green2.darker, tCtx.fillRect(0, lerp(0, B / 2, e), A, lerp(B, v, e)), tCtx.fillStyle = colors.green2.brighter, tCtx.fillRect(0, lerp(0, B / 2, e), A, lerp(B, 0, e)))) : d < 1 + x ? transitionText ? (tCtx.fillStyle = colors.green2.darker, tCtx.fillRect(0, B / 2, A, w / 2 + v), tCtx.fillStyle = colors.green2.brighter, tCtx.fillRect(0, B / 2 - w / 2, A, w)) : transitionTimer = x + 1.5 : d < x + 1.5 && (e = 2 * (d - x - 1), e = ease.in(e), tCtx.fillStyle = colors.green2.darker, tCtx.fillRect(0, B / 2, A, lerp(w / 2 + v, v, e)), tCtx.fillStyle = colors.green2.brighter, tCtx.fillRect(0, lerp(B / 2 - w / 2, B / 2, e), A, lerp(w, 0, e))), d > .5 && d < 3.5) {
          var C = w - 2 * y;
          tCtx.font = C + "px Arial, Helvetica, sans-serif";
          var D = tCtx.measureText(transitionText).width,
            E = A / 2 - D / 2 + z / 2,
            F = B / 2 + .37 * C + z / 2;
          e = d, e = d < 1.1 ? iLerp(.5, 1.1, d) : d < 2.9 ? 1 : iLerp(3.5, 2.9, d), drawAnimatedText(tCtx, transitionText, e, E, F, C, "white", "Arial, Helvetica, sans-serif", z, 3, 16842438)
        }
        tCtx.restore()
      }
      skipDeathTransition && "GAME OVER" == transitionText && transitionTimer > 1 && (transitionTimer = 1.1, transitionDirection = -1, allowSkipDeathTransition = !1, skipDeathTransition = !1)
    }
    if (beginScreenVisible && a - titleLastRender > 49 && (resetTitleNextFrame && (resetTitleNextFrame = !1, titleTimer = -1, titleLastRender = a), titleTimer += .002 * (a - titleLastRender), titleLastRender = a, canvasTransformType = canvasTransformTypes.TITLE, ctxCanvasSize(titCtx), ctxApplyCamTransform(titCtx), drawTitle(titCtx, titleTimer, !0, 0, !0), drawTitle(titCtx, titleTimer, !0, 2.5), drawTitle(titCtx, titleTimer), titCtx.restore()), beginScreenVisible) {
      tutorialTimer += deltaTime * GLOBAL_SPEED * .7, canvasTransformType = canvasTransformTypes.TUTORIAL, ctxCanvasSize(tutCtx), ctxCanvasSize(linesCtx), tutCtx.fillStyle = colors.grey.BG, tutCtx.fillRect(0, 0, tutorialCanvas.width, tutorialCanvas.height), linesCtx.fillStyle = "white", linesCtx.fillRect(0, 0, linesCanvas.width, linesCanvas.height), ctxApplyCamTransform(tutCtx), ctxApplyCamTransform(linesCtx), d = tutorialTimer, drawBlocks(tutCtx, tutorialBlocks);
      var G = getPlayer(1, tutorialPlayers),
        H = getPlayer(2, tutorialPlayers);
      d < 10 ? G.pos = [2, 2] : d < 15 ? G.pos = [d - 8, 2] : d < 18 ? G.pos = [7, d - 13] : d < 23 ? G.pos = [25 - d, 5] : d < 26 ? G.pos = [2, 28 - d] : d < 30 || (d < 36 ? G.pos = [2, d - 28] : d < 39 && (G.pos = [d - 34, 8])), d < 12 || (d < 15 ? G.trails = [{
        trail: [
          [4, 2]
        ],
        vanishTimer: 0
      }] : d < 18 ? G.trails = [{
        trail: [
          [4, 2],
          [7, 2]
        ],
        vanishTimer: 0
      }] : d < 23 ? G.trails = [{
        trail: [
          [4, 2],
          [7, 2],
          [7, 5]
        ],
        vanishTimer: 0
      }] : d < 24 && (G.trails = [{
        trail: [
          [4, 2],
          [7, 2],
          [7, 5],
          [2, 5]
        ],
        vanishTimer: 0
      }])), d > 24 && tutorialPrevTimer < 24 && (G.trails = [{
        trail: [
          [4, 2],
          [7, 2],
          [7, 5],
          [2, 5],
          [2, 4]
        ],
        vanishTimer: 0
      }, {
        trail: [],
        vanishTimer: 0
      }]), d < 34 || (d < 36 ? G.trails = [{
        trail: [
          [2, 6]
        ],
        vanishTimer: 0
      }] : d < 39 && (G.trails = [{
        trail: [
          [2, 6],
          [2, 8]
        ],
        vanishTimer: 0
      }])), d < 34 || d < 50 && (H.pos = [d - 37, 7], H.trails = [{
        trail: [
          [-2, 7]
        ],
        vanishTimer: 0
      }]), d > 25 && tutorialPrevTimer < 25 && fillArea(2, 2, 6, 4, 10, 0, tutorialBlocks), d > 39 && tutorialPrevTimer < 39 && (G.die(!0), fillArea(1, 1, 7, 5, 1, 0, tutorialBlocks), H.addHitLine([2, 7])), d > 50 && (tutorialTimer = tutorialPrevTimer = 0, fillArea(1, 1, 3, 3, 10, 0, tutorialBlocks), G.isDeadTimer = 0, G.isDead = !1, G.trails = [], G.pos = [100, 100], H.trails = [{
        trail: [
          [-2, 7],
          [12, 7]
        ],
        vanishTimer: 0
      }, {
        trail: [],
        vanishTimer: 0
      }], H.pos = H.drawPos = [-2, 7]), d > 1 && tutorialPrevTimer < 1 && (tutorialText.innerHTML = "Close an area to fill it with your color."), d > 30 && tutorialPrevTimer < 30 && (tutorialText.innerHTML = "Don't get hit by other players.");
      var I = clamp01(5 - Math.abs(.5 * (d - 20)));
      I += clamp01(4 - Math.abs(.5 * (d - 40))), tutorialText.style.opacity = clamp(I, 0, .9), moveDrawPosToPos(G), moveDrawPosToPos(H), tutCtx.globalAlpha = Math.min(1, Math.max(0, .3 * d - 1)), drawPlayer(tutCtx, G, a), drawPlayer(tutCtx, H, a), tutCtx.globalAlpha = 1, tutorialPrevTimer = d, drawDiagonalLines(linesCtx, "white", 5, 10, .008 * a), tutCtx.restore(), linesCtx.restore(), tutCtx.globalCompositeOperation = "multiply", tutCtx.drawImage(linesCanvas, 0, 0), tutCtx.globalCompositeOperation = "source-over"
    }
    if (beginScreenVisible && (canvasTransformType = canvasTransformTypes.SKIN_BUTTON, ctxApplyCamTransform(skinButtonCtx, !0), drawBlocks(skinButtonCtx, skinButtonBlocks), skinButtonCtx.restore()), skinScreenVisible && (canvasTransformType = canvasTransformTypes.SKIN, ctxApplyCamTransform(skinCtx, !0), drawBlocks(skinCtx, skinScreenBlocks), skinCtx.restore()), beginScreenVisible && (socialOpacity = lerpt(socialOpacity, socialOTarget, .1), socialElem.style.opacity = Math.min(1, socialOpacity)), beginScreenVisible) {
      if (lastStatTimer += deltaTime, d = lastStatTimer / 2e3, d > 1) {
        if (lastStatTimer = 0, lastStatCounter++, lastStatCounter > 5 && (lastStatCounter = 0), 0 === lastStatCounter && (lastStatNo1Time <= 0 ? lastStatCounter++ : lastStatValueElem.innerHTML = parseTimeToString(lastStatNo1Time) + " on #1"), 1 == lastStatCounter && ("" === lastStatKiller && lastStatKiller.replace(/\s/g, "").length > 0 ? lastStatCounter++ : lastStatValueElem.innerHTML = "killed by " + filter(htmlEscape(lastStatKiller))), 2 == lastStatCounter)
          if (lastStatKills <= 0) lastStatCounter++;
          else {
            var J = 1 == lastStatKills ? "" : "s";
            lastStatValueElem.innerHTML = lastStatKills + " player" + J + " killed"
          }
        if (3 == lastStatCounter && (lastStatValueElem.innerHTML = parseTimeToString(lastStatAlive) + " alive"), 4 == lastStatCounter)
          if (lastStatBlocks <= 0) lastStatCounter++;
          else {
            var K = 1 == lastStatBlocks ? "" : "s";
            lastStatValueElem.innerHTML = lastStatBlocks + " block" + K + " captured"
          }
        5 == lastStatCounter && (lastStatLbRank <= 0 ? lastStatCounter = 0 : lastStatValueElem.innerHTML = "#" + lastStatLbRank + " highest rank")
      }
      var L = 5;
      lastStatValueElem.style.opacity = L - Math.abs((d - .5) * L * 2)
    }
    if ("true" == localStorage.drawDebug) {
      var M = Math.round(thisServerAvgPing);
      ctx.font = "14px Arial, Helvetica, sans-serif", ctx.fillStyle = colors.red.brighter;
      var N = ctx.measureText(M).width;
      ctx.fillText(M, ctx.canvas.width - N - 10, ctx.canvas.height - 10)
    }
  }
  donePing || pingServers();
  var O = waitingForPing ? 6e4 : 5e3;
  null !== ws && Date.now() - lastPingTime > O && (lastPingTime = Date.now(), wsSendMsg(sendAction.PING) && (waitingForPing = !0)), parseGamepads(), window.requestAnimationFrame(loop)
}

function getButton(a) {
  if (currentGamepad && currentGamepad.buttons) {
    var b = currentGamepad.buttons[currentMap.buttonMap[a]];
    if (b) return b.pressed
  }
  return !1
}

function getAxis(a) {
  if (currentGamepad && currentGamepad.axes) {
    var b = currentGamepad.axes[currentMap.axesMap[a]];
    if (void 0 !== b) return b
  }
  return 0
}

function parseGamepads() {
  if ("getGamepads" in navigator) {
    for (var a = navigator.getGamepads(), b = !1, c = 0; c < a.length; c++)
      if (currentGamepad = a[c], void 0 !== currentGamepad) {
        var d = !1;
        if ("standard" == currentGamepad.mapping) currentMap = {
          buttonMap: {
            0: 0,
            1: 1,
            2: 2,
            3: 3,
            4: 4,
            5: 5,
            6: 6,
            7: 7,
            8: 8,
            9: 9,
            10: 10,
            11: 11,
            12: 12,
            13: 13,
            14: 14,
            15: 15
          },
          axesMap: {
            0: 0,
            1: 1,
            2: 2,
            3: 3
          }
        }, d = !0;
        else
          for (var e = 0; e < customMappings.length; e++) currentGamepad.id.indexOf(customMappings[e].name) >= 0 && (d = !0, currentMap = customMappings[e]);
        d && (getButton(12) && sendDir(3), getButton(13) && sendDir(1), getButton(14) && sendDir(2), getButton(15) && sendDir(0), getButton(0) && (b = !0), getButton(1) && doSkipDeathTransition(), (getAxis(0) < -.9 || getAxis(2) < -.9) && sendDir(2), (getAxis(0) > .9 || getAxis(2) > .9) && sendDir(0), (getAxis(1) < -.9 || getAxis(3) < -.9) && sendDir(3), (getAxis(1) > .9 || getAxis(3) > .9) && sendDir(1))
      }
    b ? beginScreenVisible ? connectWithTransition() : gamePadIsHonking || (gamePadIsHonking = !0, honkStart()) : gamePadIsHonking && (gamePadIsHonking = !1, honkEnd())
  }
}

function toUTF8Array(a) {
  for (var b = [], c = 0; c < a.length; c++) {
    var d = a.charCodeAt(c);
    d < 128 ? b.push(d) : d < 2048 ? b.push(192 | d >> 6, 128 | 63 & d) : d < 55296 || d >= 57344 ? b.push(224 | d >> 12, 128 | d >> 6 & 63, 128 | 63 & d) : (c++, d = 65536 + ((1023 & d) << 10 | 1023 & a.charCodeAt(c)), b.push(240 | d >> 18, 128 | d >> 12 & 63, 128 | d >> 6 & 63, 128 | 63 & d))
  }
  return b
}

function htmlEscape(a) {
  return String(a).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function filter(a) {
  for (var b = a.split(" "), c = 0; c < b.length; c++) {
    for (var d = b[c], e = d.toUpperCase() == d, f = 0; f < swearArr.length; f++) {
      var g = swearArr[f];
      d.toLowerCase().indexOf(g) >= 0 && (d = d.length < g.length + 2 ? swearRepl : d.toLowerCase().replace(g, swearRepl))
    }
    e && (d = d.toUpperCase()), b[c] = d
  }
  return b.join(" ")
}

function Utf8ArrayToStr(a) {
  var b, c, d, e, f, g;
  for (b = "", d = a.length, c = 0; c < d;) switch (e = a[c++], e >> 4) {
    case 0:
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
      b += String.fromCharCode(e);
      break;
    case 12:
    case 13:
      f = a[c++], b += String.fromCharCode((31 & e) << 6 | 63 & f);
      break;
    case 14:
      f = a[c++], g = a[c++], b += String.fromCharCode((15 & e) << 12 | (63 & f) << 6 | (63 & g) << 0)
  }
  return b
}

function bytesToInt() {
  for (var a = 0, b = 0, c = arguments.length - 1; c >= 0; c--) {
    var d = arguments[c];
    a = (a | (255 & d) << b >>> 0) >>> 0, b += 8
  }
  return a
}

function intToBytes(a, b) {
  for (var c = [], d = 0; d < b; d++) {
    var e = 255 & a;
    c[b - d - 1] = e, a = (a - e) / 256
  }
  return c
}

function parseTimeToString(a) {
  var b = Math.floor(a / 3600),
    c = Math.floor((a - 3600 * b) / 60);
  if (a = a - 3600 * b - 60 * c, b <= 0) {
    var d = 1 == a ? "" : "s";
    if (c <= 0) return a + " second" + d;
    var e = 1 == c ? "" : "s";
    return c + " minute" + e + " and " + a + " second" + d
  }
  return b < 10 && (b = "0" + b), c < 10 && (c = "0" + c), a < 10 && (a = "0" + a), b + ":" + c + ":" + a
}
var GLOBAL_SPEED = .006,
  VIEWPORT_RADIUS = 30,
  MAX_ZOOM = 430,
  BLOCKS_ON_SCREEN = 1100,
  USERNAME_SIZE = 6,
  PIXEL_RATIO = function() {
    var a = document.createElement("canvas").getContext("2d"),
      b = window.devicePixelRatio || 1,
      c = a.webkitBackingStorePixelRatio || a.mozBackingStorePixelRatio || a.msBackingStorePixelRatio || a.oBackingStorePixelRatio || a.backingStorePixelRatio || 1;
    return b / c
  }(),
  flashIsInstalled = !1;
try {
  flashIsInstalled = Boolean(new ActiveXObject("ShockwaveFlash.ShockwaveFlash"))
} catch (a) {
  flashIsInstalled = "undefined" != typeof navigator.mimeTypes["application/x-shockwave-flash"]
}
ga("set", "dimension1", flashIsInstalled ? "yes" : "no");
var SKIN_BLOCK_COUNT = 12,
  SKIN_PATTERN_COUNT = 20,
  ws = null,
  mainCanvas, ctx, prevTimeStamp = null,
  blocks = [],
  players = [],
  camPos = [0, 0],
  camPosSet = !1,
  camPosPrevFrame = [0, 0],
  lastMyPosSetTime = 0,
  myNameAlphaTimer = 0,
  myPos = null,
  myPlayer = null,
  changeDirAt = null,
  changeDirAtIsHorizontal = !1,
  myNextDir = 0,
  lastChangeMyDirPos = null,
  lastClientsideMoves = [],
  trailPushesDuringRequest = [],
  isRequestingMyTrail = !1,
  skipTrailRequestResponse = !1,
  mapSize = 2e3,
  closedBecauseOfDeath = !1,
  minimapCtx, beginScreenVisible = !0,
  wsOnOpenTime, minimapCanvas, currentDtCap = 0,
  totalDeltaTimeFromCap = 0,
  deltaTime = 16.66,
  missedFrames = [],
  gainedFrames = [],
  myScoreElem, myKillsElem, myRealScoreElem, myRankElem, myRank = 0,
  myRankSent = !1,
  totalPlayersElem, totalPlayers = 0,
  leaderboardElem, miniMapPlayer, playUI, beginScreen, notificationElem, formElem, closeNotification, scoreStatTarget = 25,
  scoreStat = 25,
  realScoreStatTarget = 25,
  realScoreStat = 25,
  linesCanvas, linesCtx, tempCanvas, tempCtx, showCouldntConnectAfterTransition = !1,
  playingAndReady = !1,
  canRunAds = !1,
  transitionCanvas, tCtx, transitionTimer = 0,
  transitionPrevTimer = 0,
  transitionDirection = 1,
  transitionText = "GAME OVER",
  isTransitioning = !1,
  transitionCallback1 = null,
  transitionCallback2 = null,
  transitionReverseOnHalf = !1,
  tutorialCanvas, tutCtx, tutorialTimer = 0,
  tutorialPrevTimer = 0,
  tutorialBlocks, tutorialPlayers, tutorialText, skinButtonCanvas, skinButtonCtx, skinButtonBlocks = [],
  skinButtonShadow, shareToUnlock, skinCanvas, skinCtx, skinScreen, skinScreenVisible = !1,
  skinScreenBlocks, shareTw, shareFb, titCanvas, titCtx, titleTimer = -1,
  resetTitleNextFrame = !0,
  titleLastRender = 0,
  currentTouches = [],
  doRefreshAfterDie = !1,
  pressedKeys = [],
  camPosOffset = [0, 0],
  camRotOffset = 0,
  camShakeForces = [],
  socialOpacity = 0,
  socialOTarget = 0,
  twttrIsInit = !1,
  fbIsInit = !1,
  ytIsInit = !1,
  socialElem, socialIsReady = !1,
  socialHovering = !1,
  honkStartTime, lastHonkTime = 0,
  skipDeathTransition = !1,
  allowSkipDeathTransition = !1,
  deathTransitionTimeout = null,
  servers = [],
  donePing = !1,
  serversRequestDone = !1,
  doConnectAfterServersGet = !1,
  thisServerAvgPing = 0,
  lastPingTime = 0,
  waitingForPing = !1,
  serversJsonGetTime = 0,
  uiElems = [],
  hasReceivedChunkThisGame = !1,
  didSendSecondReady = !1,
  lastStatBlocks = 0,
  lastStatKills = 0,
  lastStatLbRank = 0,
  lastStatAlive = 0,
  lastStatNo1Time = 0,
  lastStatDeathType = 0,
  lastStatKiller = "",
  lastStatTimer = 0,
  lastStatCounter = 0,
  lastStatValueElem, lastMousePos = [0, 0],
  mouseHidePos = [0, 0],
  receiveAction = {
    UPDATE_BLOCKS: 1,
    PLAYER_POS: 2,
    FILL_AREA: 3,
    SET_TRAIL: 4,
    PLAYER_DIE: 5,
    CHUNK_OF_BLOCKS: 6,
    REMOVE_PLAYER: 7,
    PLAYER_NAME: 8,
    MY_SCORE: 9,
    MY_RANK: 10,
    LEADERBOARD: 11,
    MAP_SIZE: 12,
    YOU_DED: 13,
    MINIMAP: 14,
    PLAYER_SKIN: 15,
    EMPTY_TRAIL_WITH_LAST_POS: 16,
    READY: 17,
    PLAYER_HIT_LINE: 18,
    REFRESH_AFTER_DIE: 19,
    PLAYER_HONK: 20,
    PONG: 21
  },
  sendAction = {
    UPDATE_DIR: 1,
    SET_USERNAME: 2,
    SKIN: 3,
    READY: 4,
    REQUEST_CLOSE: 5,
    HONK: 6,
    PING: 7,
    REQUEST_MY_TRAIL: 8
  },
  colors = {
    grey: {
      BG: "#3a342f",
      brighter: "#4e463f",
      darker: "#2d2926",
      diagonalLines: "#c7c7c7"
    },
    red: {
      brighter: "#a22929",
      darker: "#7b1e1e",
      slightlyBrighter: "#af2c2c",
      pattern: "#8c2222",
      patternEdge: "#631717",
      boundsDark: "#420707",
      boundsBright: "#4c0808"
    },
    red2: {
      brighter: "#E3295E",
      darker: "#B3224B",
      slightlyBrighter: "#F02B63",
      pattern: "#CC2554",
      patternEdge: "#9C1C40"
    },
    pink: {
      brighter: "#A22974",
      darker: "#7A1F57",
      pattern: "#8A2262",
      patternEdge: "#5E1743",
      slightlyBrighter: "#B02C7E"
    },
    pink2: {
      brighter: "#7D26EF",
      darker: "#5E1DBA",
      pattern: "#6A21D1",
      patternEdge: "#4C1896",
      slightlyBrighter: "#882DFF"
    },
    purple: {
      brighter: "#531880",
      darker: "#391058",
      pattern: "#4b1573",
      patternEdge: "#3b115a",
      slightlyBrighter: "#5a198c"
    },
    blue: {
      brighter: "#27409c",
      darker: "#1d3179",
      pattern: "#213786",
      patternEdge: "#1b2b67",
      slightlyBrighter: "#2a44a9"
    },
    blue2: {
      brighter: "#3873E0",
      darker: "#2754A3",
      pattern: "#2F64BF",
      patternEdge: "#1F4587",
      slightlyBrighter: "#3B79ED"
    },
    green: {
      brighter: "#2ACC38",
      darker: "#1C9626",
      pattern: "#24AF30",
      patternEdge: "#178220",
      slightlyBrighter: "#2FD63D"
    },
    green2: {
      brighter: "#1e7d29",
      darker: "#18561f",
      pattern: "#1a6d24",
      patternEdge: "#14541c",
      slightlyBrighter: "#21882c"
    },
    leaf: {
      brighter: "#6a792c",
      darker: "#576325",
      pattern: "#5A6625",
      patternEdge: "#454F1C",
      slightlyBrighter: "#738430"
    },
    yellow: {
      brighter: "#d2b732",
      darker: "#af992b",
      pattern: "#D1A932",
      patternEdge: "#B5922B",
      slightlyBrighter: "#e6c938"
    },
    orange: {
      brighter: "#d06c18",
      darker: "#ab5a15",
      pattern: "#AF5B16",
      patternEdge: "#914A0F",
      slightlyBrighter: "#da7119"
    }
  },
  titleLines = [{
    line: [
      [86, 82],
      [50, 57, 25, 99, 65, 105],
      [110, 110, 80, 158, 42, 129]
    ],
    speed: 1,
    offset: 0,
    posOffset: [16, 0]
  }, {
    line: [
      [129, 74],
      [129, 169]
    ],
    speed: 1,
    offset: .7,
    posOffset: [10, 0]
  }, {
    line: [
      [129, 106],
      [129, 63, 191, 63, 191, 106],
      [191, 149, 129, 149, 129, 106]
    ],
    speed: 1,
    offset: 1.2,
    posOffset: [10, 0]
  }, {
    line: [
      [236, 41],
      [236, 138]
    ],
    speed: 2,
    offset: .7,
    posOffset: [0, 0]
  }, {
    line: [
      [276, 41],
      [276, 45]
    ],
    speed: 3,
    offset: .4,
    posOffset: [0, 0]
  }, {
    line: [
      [276, 74],
      [276, 138]
    ],
    speed: 2,
    offset: 0,
    posOffset: [0, 0]
  }, {
    line: [
      [318, 74],
      [366, 138]
    ],
    speed: 2,
    offset: .5,
    posOffset: [-5, 0]
  }, {
    line: [
      [318, 138],
      [366, 74]
    ],
    speed: 4,
    offset: 0,
    posOffset: [-5, 0]
  }, {
    line: [
      [415, 136],
      [415, 134, 419, 134, 419, 136],
      [419, 138, 415, 138, 415, 136]
    ],
    speed: 1,
    offset: 0,
    posOffset: [-25, 0]
  }, {
    line: [
      [454, 41],
      [454, 45]
    ],
    speed: 3,
    offset: .8,
    posOffset: [-25, 0]
  }, {
    line: [
      [454, 74],
      [454, 138]
    ],
    speed: 2,
    offset: .5,
    posOffset: [-25, 0]
  }, {
    line: [
      [500, 106],
      [500, 63, 562, 63, 562, 106],
      [562, 149, 500, 149, 500, 106]
    ],
    speed: 1,
    offset: .2,
    posOffset: [-38, 0]
  }];
getServers(), window.onload = function() {
  location.href.indexOf("?") >= 0 && (location.href = location.href.split("?")[0]), mainCanvas = document.getElementById("mainCanvas"), ctx = mainCanvas.getContext("2d"), minimapCanvas = document.getElementById("minimapCanvas"), minimapCtx = minimapCanvas.getContext("2d"), linesCanvas = document.createElement("canvas"), linesCtx = linesCanvas.getContext("2d"), tempCanvas = document.createElement("canvas"), tempCtx = tempCanvas.getContext("2d"), transitionCanvas = document.getElementById("transitionCanvas"), tCtx = transitionCanvas.getContext("2d"), tutorialCanvas = document.getElementById("tutorialCanvas"), tutCtx = tutorialCanvas.getContext("2d"), tutorialText = document.getElementById("tutorialText"), touchControlsElem = document.getElementById("touchControls"), notificationElem = document.getElementById("notification"), skinScreen = document.getElementById("skinScreen"), skinCanvas = document.getElementById("skinScreenCanvas"), skinCtx = skinCanvas.getContext("2d"), lastStatValueElem = document.getElementById("lastStatsRight"), window.onkeydown = function(a) {
    var b = a.keyCode;
    if (pressedKeys.indexOf(b) < 0) {
      pressedKeys.push(b);
      var c = !1;
      38 != b && 87 != b && 56 != b && 73 != b || (sendDir(3), c = !0), 37 != b && 65 != b && 52 != b && 74 != b || (sendDir(2), c = !0), 39 != b && 68 != b && 54 != b && 76 != b || (sendDir(0), c = !0), 40 != b && 83 != b && 50 != b && 75 != b || (sendDir(1), c = !0), 32 != b && 53 != b || (honkStart(), c = !0), 13 == b && (doSkipDeathTransition(), c = !0), c && playingAndReady && a.preventDefault()
    }
  }, window.onkeyup = function(a) {
    var b = a.keyCode,
      c = pressedKeys.indexOf(b);
    pressedKeys.splice(c, 1), 32 != b && 53 != b || honkEnd()
  }, bindSwipeEvents(), window.oncontextmenu = function(a) {
    return "jalAdPreloader" == a.target.name || (a.preventDefault(), !1)
  }, myScoreElem = document.getElementById("blockCaptureCount"), myRealScoreElem = document.getElementById("score"), myKillsElem = document.getElementById("myKills"), myRankElem = document.getElementById("myRank"), totalPlayersElem = document.getElementById("totalPlayers"), leaderboardElem = document.createElement("tbody");
  var a = document.createElement("table");
  a.appendChild(leaderboardElem);
  var b = document.getElementById("leaderboard");
  b.appendChild(a), uiElems.push(b), miniMapPlayer = document.getElementById("miniMapPlayer"), beginScreen = document.getElementById("beginScreen"), playUI = document.getElementById("playUI"), uiElems.push(document.getElementById("scoreBlock")), uiElems.push(document.getElementById("miniMap")), closeNotification = document.getElementById("closeNotification"), uiElems.push(closeNotification), prerollElem = document.getElementById("preroll");
  var c = document.getElementById("nameInput");
  localStorage.name && (c.value = localStorage.name), c.focus(), localStorage.autoConnect && doConnect(), formElem = document.getElementById("nameForm"), formElem.onsubmit = function() {
    try {
      connectWithTransition()
    } catch (a) {
      console.log("Error", a.stack), console.log("Error", a.name), console.log("Error", a.message), setNotification("An error occurred :/")
    }
    return !1
  }, window.addEventListener("click", showCursor), window.addEventListener("mousemove", function(a) {
    lastMousePos = [a.screenX, a.screenY];
    var b = lastMousePos[0] - mouseHidePos[0],
      c = lastMousePos[1] - mouseHidePos[1],
      d = Math.sqrt(Math.pow(b, 2) + Math.pow(c, 2));
    d > 15 && showCursor()
  }), initTutorial(), initSkinScreen(), initTitle(), socialElem = document.getElementById("social"), socialElem.addEventListener("mouseenter", function() {
    socialHovering = !0, testSocialTarget()
  }), socialElem.addEventListener("mouseleave", function() {
    socialHovering = !1, testSocialTarget()
  }), window.requestAnimationFrame(loop)
};
var isConnectingWithTransition = !1,
  isConnecting = !1,
  prerollElem, isWaitingForAd = !1,
  vastUrl = "http://pubads.g.doubleclick.net/gampad/ads?sz=960x540&iu=/421469808/JTE_splix.io_preroll&ciu_szs&impl=s&gdfp_req=1&env=vp&output=xml_vast2&unviewed_position_start=1&url=[referrer_url]&description_url=[description_url]&correlator=[timestamp]",
  afterDeathCounter = 0,
  doneOnSocialReady = !1,
  canvasTransformTypes = {
    MAIN: 1,
    TUTORIAL: 2,
    SKIN: 3,
    SKIN_BUTTON: 4,
    TITLE: 5
  },
  canvasTransformType = canvasTransformTypes.MAIN,
  ease = { in: function(a) {
      return a * a * a * a
    },
    out: function(a) {
      return 1 - Math.pow(1 - a, 4)
    },
    inout: function(a) {
      return a < .5 ? 8 * a * a * a * a : 1 - Math.pow(-2 * a + 2, 4) / 2
    }
  },
  dtCaps = [0, 6.5, 16, 33, 49, 99],
  gamePadIsHonking = !1,
  customMappings = [{
    name: "Generic USB Joystick",
    buttonMap: {
      0: 2,
      1: 1,
      2: 3,
      3: 0,
      4: 4,
      5: 5,
      6: 6,
      7: 7,
      8: 8,
      9: 9,
      10: 10,
      11: 11,
      12: 13,
      13: 14,
      14: 15,
      15: 16
    },
    axesMap: {
      0: 0,
      1: 1,
      2: 2,
      3: 4
    }
  }, {
    name: "Bluetooth Gamepad",
    buttonMap: {
      0: 0,
      1: 1,
      2: 3,
      3: 4,
      4: 6,
      5: 7,
      6: 8,
      7: 9,
      8: 10,
      9: 11,
      10: 13,
      11: 14,
      12: 12,
      13: 13,
      14: 14,
      15: 15
    },
    axesMap: {
      0: 0,
      1: 1,
      2: 2,
      3: 5
    }
  }],
  currentGamepad, currentMap = {
    buttonMap: {
      0: 0,
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
      7: 7,
      8: 8,
      9: 9,
      10: 10,
      11: 11,
      12: 12,
      13: 13,
      14: 14,
      15: 15
    },
    axesMap: {
      0: 0,
      1: 1,
      2: 2,
      3: 3
    }
  },
  swearArr = "penis;fuck;anal;anus;shit;asshole;bitch;butthole;slut;bitch;gay;nigger;xhamster;cock;cunt;dick;porn".split(";"),
  swearRepl = "balaboo";
