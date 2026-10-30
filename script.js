(function () {
  // Порядок совпадает с I18N[lang].results[] в i18n.js: 5, 4, 3, 2, 0 баллов.
  var RESULT_META = [
    { min: 5, emoji: "🏆" },
    { min: 4, emoji: "🌟" },
    { min: 3, emoji: "👍" },
    { min: 2, emoji: "🤔" },
    { min: 0, emoji: "😄" }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var index = 0, locked = false;
  var mode = "solo";
  var lang = "ru";
  var names = ["", ""];
  var scores = [0, 0];
  var correct = [0, 0];    // сколько ответов верно (для процента), не зависит от штрафов
  var turn = 0, picks = [];
  var TIME_LIMIT = 20;
  var timerId = null, deadline = 0;
  var SECTIONS = ["start", "setup", "pass", "game", "result"];
  var HINTS = 2;            // сколько раз за игру можно взять 50/50
  var hints = [HINTS, HINTS];
  var hintUsed = false;     // на этом вопросе уже брали подсказку
  var BEST_KEY = "qb-best";
  var LANG_KEY = "qb-lang";
  var LANG_KEYS = { ru: "langRu", pt: "langPt", en: "langEn" };
  // Полные названия — только для screen reader, на кнопках короткие «РУ / ПТ / НГ».
  var LANG_ARIA = { ru: "Русский", pt: "Português", en: "English" };
  var best = null;          // { score, percent, total } — лучший результат одиночной игры
  var recordFlag = false;   // текущая одиночная игра побила рекорд (не пересчитываем при смене языка)

  // ---------- Язык ----------
  function t(key, params) { return tr(lang, key, params); }

  function list(key) {
    var dict = I18N[lang] || I18N.ru;
    return dict[key] || I18N.ru[key] || [];
  }

  function qText(item) {
    return (item.q && (item.q[lang] || item.q.ru)) || String(item.q || "");
  }

  function aList(item) {
    return (item.a && (item.a[lang] || item.a.ru)) || [];
  }

  function aText(item, i) {
    return aList(item)[i];
  }

  function matchLang(tag) {
    if (!tag) return null;
    var v = String(tag).toLowerCase();
    if (v.indexOf("pt") === 0) return "pt";
    if (v.indexOf("en") === 0) return "en";
    if (v.indexOf("ru") === 0) return "ru";
    return null;
  }

  function detectLang() {
    var fromUrl = null;
    try { fromUrl = matchLang(new URLSearchParams(window.location.search).get("lang")); } catch (e) {}
    if (fromUrl) return fromUrl;
    var stored = null;
    try { stored = matchLang(localStorage.getItem(LANG_KEY)); } catch (e) {}
    if (stored) return stored;
    if (navigator.languages) {
      for (var i = 0; i < navigator.languages.length; i++) {
        var m = matchLang(navigator.languages[i]);
        if (m) return m;
      }
    }
    return matchLang(navigator.language) || "ru";
  }

  function applyLang(l) {
    lang = l;
    document.documentElement.lang = l;
    document.title = t("title");

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = t(nodes[i].getAttribute("data-i18n"));

    var phs = document.querySelectorAll("[data-i18n-ph]");
    for (var j = 0; j < phs.length; j++) phs[j].setAttribute("placeholder", t(phs[j].getAttribute("data-i18n-ph")));

    var arias = document.querySelectorAll("[data-i18n-aria]");
    for (var k = 0; k < arias.length; k++) arias[k].setAttribute("aria-label", t(arias[k].getAttribute("data-i18n-aria")));

    $("startSub").textContent = t("startSub", {
      n: QUESTIONS.length,
      q: plural(l, QUESTIONS.length, {
        ru: ["вопрос", "вопроса", "вопросов"],
        pt: ["pergunta", "perguntas"],
        en: ["question", "questions"]
      })
    });

    var btns = document.querySelectorAll(".lang");
    for (var b = 0; b < btns.length; b++) {
      var code = btns[b].getAttribute("data-lang");
      var name = t(LANG_KEYS[code]);
      btns[b].textContent = name;
      btns[b].setAttribute("aria-label", LANG_ARIA[code]);
      btns[b].title = LANG_ARIA[code];
      var on = code === l;
      btns[b].classList.toggle("on", on);
      btns[b].setAttribute("aria-pressed", on ? "true" : "false");
    }

    renderBest(recordFlag);
    renderScores();
    renderTurn();
    renderHint();
    if (!$("result").classList.contains("hidden")) renderResult();
  }

  // ---------- Звуки (рисуются прямо в браузере, без файлов) ----------
  var audio = null;
  var muted = false;
  try { muted = localStorage.getItem("qb-muted") === "1"; } catch (e) {}

  function ac() {
    if (!audio) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      audio = new C();
    }
    if (audio.state === "suspended") audio.resume();
    return audio;
  }

  function tone(freq, start, dur, type, vol, freqEnd) {
    var c = ac();
    if (!c || muted) return;
    var t0 = c.currentTime + start;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.25, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  var SOUNDS = {
    // весёлый звонкий «дзынь-дзынь» вверх
    right: function () {
      tone(784, 0, 0.12, "triangle", 0.3);
      tone(1047, 0.09, 0.12, "triangle", 0.3);
      tone(1319, 0.18, 0.3, "triangle", 0.28);
      tone(2637, 0.18, 0.25, "sine", 0.05);
    },
    // низкое «бу-бу» вниз
    wrong: function () {
      tone(311, 0, 0.16, "square", 0.1);
      tone(233, 0.14, 0.32, "square", 0.1, 196);
    },
    timeout: function () {
      tone(440, 0, 0.12, "sawtooth", 0.07);
      tone(330, 0.13, 0.28, "sawtooth", 0.07);
    },
    // «вжух» для подсказки
    hint: function () { tone(380, 0, 0.2, "sine", 0.22, 1200); },
    // фанфары на финале
    win: function () {
      [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.11, 0.22, "triangle", 0.25); });
      tone(1568, 0.46, 0.55, "triangle", 0.2);
    }
  };

  function play(name) { if (!muted && SOUNDS[name]) SOUNDS[name](); }

  function renderMute() { $("muteBtn").textContent = muted ? "🔇" : "🔊"; }

  function drawTimer(left) {
    var t = $("timer");
    var sec = Math.max(0, Math.ceil(left));
    $("timerText").textContent = "⏱ " + sec;
    $("timerFill").style.width = Math.max(0, left / TIME_LIMIT * 100) + "%";
    t.classList.toggle("warn", left <= 10 && left > 5);
    t.classList.toggle("danger", left <= 5);
  }

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    $("timer").classList.remove("danger");
  }

  function startTimer() {
    stopTimer();
    deadline = Date.now() + TIME_LIMIT * 1000;
    drawTimer(TIME_LIMIT);
    timerId = setInterval(function () {
      var left = (deadline - Date.now()) / 1000;
      if (left <= 0) {
        drawTimer(0);
        stopTimer();
        if (!locked) choose(-1);
      } else {
        drawTimer(left);
      }
    }, 200);
  }

  function percent(n) {
    return QUESTIONS.length ? Math.round(n / QUESTIONS.length * 100) : 0;
  }

  // ---------- Лучший результат одиночной игры ----------
  function loadBest() {
    try {
      var raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      var b = JSON.parse(raw);
      if (!b || typeof b.score !== "number" || typeof b.percent !== "number" ||
          b.percent < 0 || b.percent > 100 ||
          b.score < 0 || b.score > QUESTIONS.length) return;
      var total = typeof b.total === "number" && b.total > 0 ? Math.round(b.total) : QUESTIONS.length;
      var cnt = typeof b.correct === "number" && b.correct >= 0 && b.correct <= total
        ? Math.round(b.correct)
        : Math.round(b.percent / 100 * total);   // старые записи без поля correct
      best = {
        score: Math.round(b.score),
        correct: cnt,
        percent: Math.round(b.percent),
        total: total
      };
    } catch (e) { best = null; }
  }

  function saveBest() {
    try { localStorage.setItem(BEST_KEY, JSON.stringify(best)); } catch (e) {}
  }

  function isBetter(p, s) {
    if (!best) return true;
    if (p !== best.percent) return p > best.percent;
    return s > best.score;
  }

  function renderBest(record) {
    var startEl = $("bestStart");
    var resEl = $("bestResult");
    if (best) {
      startEl.textContent = t("best", { p: best.percent, c: best.correct, t: best.total });
      startEl.classList.remove("hidden");
    } else {
      startEl.classList.add("hidden");
    }
    if (record) {
      resEl.textContent = t("record", { p: percent(correct[0]), c: correct[0], t: QUESTIONS.length });
      resEl.classList.remove("hidden");
      resEl.classList.add("record");
    } else if (best) {
      resEl.textContent = t("best", { p: best.percent, c: best.correct, t: best.total });
      resEl.classList.remove("hidden");
      resEl.classList.remove("record");
    } else {
      resEl.classList.add("hidden");
      resEl.classList.remove("record");
    }
  }

  function show(id) {
    SECTIONS.forEach(function (s) {
      var el = $(s);
      if (s === id) { el.classList.remove("hidden"); } else { el.classList.add("hidden"); }
    });
  }

  function renderScores() {
    var box = $("scores");
    box.innerHTML = "";
    if (mode === "solo") {
      var p = document.createElement("div");
      p.className = "pill";
      p.textContent = t("score", { s: scores[0] });
      box.appendChild(p);
      return;
    }
    for (var k = 0; k < 2; k++) {
      var d = document.createElement("div");
      d.className = "pill s" + k;
      d.textContent = names[k] + ": " + scores[k];
      box.appendChild(d);
    }
  }

  function renderTurn() {
    var el = $("turn");
    if (mode === "solo") { el.classList.add("hidden"); return; }
    el.classList.remove("hidden");
    el.className = "turn t" + turn;
    el.textContent = t("turn", { name: names[turn] });
  }

  function renderHint() {
    var p = mode === "solo" ? 0 : turn;
    $("hintLeft").textContent = "×" + hints[p];
    $("hintBtn").disabled = locked || hintUsed || hints[p] <= 0;
  }

  function useHint() {
    var p = mode === "solo" ? 0 : turn;
    if (locked || hintUsed || hints[p] <= 0) return;
    hints[p]--;
    hintUsed = true;
    var item = QUESTIONS[index];
    var wrong = [];
    var count = aList(item).length;
    for (var k = 0; k < count; k++) if (k !== item.right) wrong.push(k);
    // убираем два случайных неправильных ответа
    wrong.sort(function () { return Math.random() - 0.5; });
    var buttons = $("answers").children;
    wrong.slice(0, 2).forEach(function (k) {
      buttons[k].classList.add("gone");
      buttons[k].disabled = true;
    });
    play("hint");
    renderHint();
  }

  function render() {
    var item = QUESTIONS[index];
    locked = false;
    hintUsed = false;
    $("counter").textContent = t("counter", { i: index + 1, n: QUESTIONS.length });
    renderScores();
    renderTurn();
    $("barFill").style.width = (index / QUESTIONS.length * 100) + "%";
    $("question").textContent = qText(item);
    $("feedback").innerHTML = "";
    renderAnswers();
    renderHint();
    startTimer();
  }

  function renderAnswers() {
    var item = QUESTIONS[index];
    var letters = list("letters");
    var box = $("answers");
    box.innerHTML = "";
    aList(item).forEach(function (text, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ans c" + i;
      b.innerHTML = '<span class="letter">' + letters[i] + '</span><span class="txt"></span>';
      b.querySelector(".txt").textContent = text;
      if (item.img) {
        b.classList.add("photo");
        var pic = document.createElement("img");
        pic.alt = text;
        pic.src = item.img[i];
        if (item.pos) pic.style.objectPosition = item.pos;
        b.insertBefore(pic, b.firstChild);
      }
      b.addEventListener("click", function () { choose(i); });
      box.appendChild(b);
    });
  }

  // reveal = true, только если ответ верный: при ошибке правильный вариант не подсвечиваем
  function markAnswers(chosen, reveal) {
    var item = QUESTIONS[index];
    var buttons = $("answers").children;
    for (var k = 0; k < buttons.length; k++) {
      buttons[k].disabled = true;
      if (k === item.right && reveal) buttons[k].classList.add("right");
      else if (k === chosen) buttons[k].classList.add("wrong");
      else buttons[k].classList.add("dim");
    }
  }

  function nextButton(fb) {
    var last = index === QUESTIONS.length - 1;
    var nb = document.createElement("button");
    nb.type = "button";
    nb.className = "next";
    nb.id = "nextBtn";
    nb.textContent = last ? (mode === "duel" ? t("whoWon") : t("toResult")) : t("next");
    nb.addEventListener("click", next);
    fb.appendChild(nb);
  }

  function choose(i) {
    if (locked) return;
    locked = true;
    stopTimer();
    renderHint();
    var item = QUESTIONS[index];
    var timedOut = i === -1;

    if (mode === "solo") {
      var ok = i === item.right;
      // ниже нуля счёт не опускается
      var lost = !ok && !timedOut && scores[0] > 0;
      markAnswers(i, ok);
      if (ok) { scores[0]++; correct[0]++; }
      else if (lost) scores[0]--;
      play(ok ? "right" : (timedOut ? "timeout" : "wrong"));
      renderScores();
      var fb = $("feedback");
      fb.innerHTML = "";
      var line = document.createElement("div");
      line.className = "fb-text";
      var praise = list("praise"), oops = list("oops");
      var msg = timedOut ? t("timeUp") : (ok ? praise[Math.floor(Math.random() * praise.length)] : oops[Math.floor(Math.random() * oops.length)]);
      line.textContent = ok
        ? msg + " " + t("plus1")
        : msg + " " + (lost ? t("minus1") : t("noChange"));
      fb.appendChild(line);
      nextButton(fb);
      return;
    }

    // дуэль
    picks[turn] = i;
    if (turn === 0) {
      turn = 1;
      $("passName").textContent = names[1];
      show("pass");
      return;
    }
    // ответили оба: очки показываем всегда, правильный ответ — только если кто-то угадал
    var reveal = picks[0] === item.right || picks[1] === item.right;
    markAnswers(i, reveal);
    var fb2 = $("feedback");
    fb2.innerHTML = "";
    if (reveal) {
      var rightText = document.createElement("div");
      rightText.className = "fb-text";
      rightText.textContent = t("rightAnswer", { answer: aText(item, item.right) });
      fb2.appendChild(rightText);
    }
    for (var k = 0; k < 2; k++) {
      var okk = picks[k] === item.right;
      // ниже нуля счёт не опускается
      var lostk = !okk && picks[k] !== -1 && scores[k] > 0;
      if (okk) { scores[k]++; correct[k]++; }
      else if (lostk) scores[k]--;
      var key = okk ? "correctLine" : (picks[k] === -1 ? "timeoutLine" : (lostk ? "wrongLine" : "wrongZeroLine"));
      var lineEl = document.createElement("div");
      lineEl.className = "fb-line";
      lineEl.textContent = t(key, { name: names[k] });
      fb2.appendChild(lineEl);
    }
    play(picks[0] === item.right || picks[1] === item.right ? "right" : "wrong");
    renderScores();
    $("turn").classList.add("hidden");
    var sp = document.createElement("div");
    sp.style.height = "10px";
    fb2.appendChild(sp);
    nextButton(fb2);
  }

  function next() {
    index++;
    turn = 0;
    picks = [];
    if (index >= QUESTIONS.length) { finish(); } else { render(); }
  }

  // ---------- Итоговый экран ----------
  function renderSoloResult() {
    var idx = RESULT_META.length - 1;
    for (var i = 0; i < RESULT_META.length; i++) {
      if (scores[0] >= RESULT_META[i].min) { idx = i; break; }
    }
    var meta = RESULT_META[idx];
    var texts = list("results")[idx] || { title: "", text: "" };
    $("resLabel").textContent = t("resultLabel");
    $("resEmoji").textContent = meta.emoji;
    $("resScore").textContent = t("scoreOf", { s: scores[0], t: QUESTIONS.length });
    $("resPercent").textContent = t("percentLabel", { p: percent(correct[0]) });
    renderBest(recordFlag);
    $("resTitle").textContent = texts.title;
    $("resText").textContent = texts.text;
  }

  function renderDuelResult() {
    $("resLabel").textContent = t("duelResultLabel");
    $("resScore").textContent = scores[0] + " : " + scores[1];
    $("bestResult").classList.add("hidden");
    $("bestResult").classList.remove("record");
    $("resPercent").textContent = t("duelPercents", {
      n0: names[0], p0: percent(correct[0]),
      n1: names[1], p1: percent(correct[1])
    });
    if (scores[0] === scores[1]) {
      $("resEmoji").textContent = "🤝";
      $("resTitle").textContent = t("drawTitle");
      $("resText").textContent = t("drawText");
    } else {
      var w = scores[0] > scores[1] ? 0 : 1;
      $("resEmoji").textContent = "🏆";
      $("resTitle").textContent = t("winTitle", { name: names[w] });
      $("resText").textContent = t("winText", {
        name: names[w], c: correct[w], t: QUESTIONS.length, p: percent(correct[w])
      });
    }
  }

  function renderResult() {
    if (mode === "duel") renderDuelResult();
    else renderSoloResult();
  }

  function finish() {
    stopTimer();
    if (mode === "duel") {
      play(scores[0] === scores[1] ? "right" : "win");
      show("result");
      renderResult();
      return;
    }
    play(scores[0] >= 3 ? "win" : "wrong");
    var p = percent(correct[0]);
    recordFlag = isBetter(p, scores[0]);
    if (recordFlag) {
      best = { score: scores[0], correct: correct[0], percent: p, total: QUESTIONS.length };
      saveBest();
    }
    show("result");
    renderResult();
  }

  function begin() {
    index = 0; turn = 0; picks = []; scores = [0, 0]; correct = [0, 0];
    hints = [HINTS, HINTS];
    recordFlag = false;
    ac();   // звук включается после первого нажатия (так требуют браузеры)
    show("game");
    render();
  }

  $("soloBtn").addEventListener("click", function () { mode = "solo"; begin(); });
  $("duelBtn").addEventListener("click", function () { mode = "duel"; show("setup"); });
  $("goBtn").addEventListener("click", function () {
    names[0] = $("n0").value.trim() || t("player1");
    names[1] = $("n1").value.trim() || t("player2");
    if (names[1] === names[0]) names[1] = names[1] + " (2)";
    begin();
  });
  $("readyBtn").addEventListener("click", function () {
    show("game");
    locked = false;
    hintUsed = false;
    renderAnswers();
    renderTurn();
    renderHint();
    startTimer();
  });
  $("againBtn").addEventListener("click", function () { stopTimer(); show("start"); });
  $("hintBtn").addEventListener("click", useHint);
  $("muteBtn").addEventListener("click", function () {
    muted = !muted;
    try { localStorage.setItem("qb-muted", muted ? "1" : "0"); } catch (e) {}
    renderMute();
    if (!muted) play("right");
  });

  var langBtns = document.querySelectorAll(".lang");
  for (var lb = 0; lb < langBtns.length; lb++) {
    langBtns[lb].addEventListener("click", function () {
      var chosen = this.getAttribute("data-lang");
      try { localStorage.setItem(LANG_KEY, chosen); } catch (e) {}
      applyLang(chosen);
    });
  }

  renderMute();
  loadBest();
  applyLang(detectLang());
})();
