(function () {
  var LETTERS = ["А", "Б", "В", "Г"];
  var PRAISE = ["Верно! 🎉", "Точно в цель! 🎯", "Ты знаешь меня! 💪", "Да! Так держать! 🔥", "Вот это память! 🧠"];
  var OOPS = ["Мимо! 😅", "Не угадал! 🙈", "Ой, не то! 😬"];
  var RESULTS = [
    { min: 5, emoji: "🏆", title: "Ты мой лучший друг!", text: "Ты знаешь обо мне абсолютно всё. Это просто космос!" },
    { min: 4, emoji: "🌟", title: "Почти идеально!", text: "Ты знаешь меня очень хорошо. Не хватило совсем чуть-чуть!" },
    { min: 3, emoji: "👍", title: "Неплохо!", text: "Ты знаешь меня довольно хорошо, но есть что узнать." },
    { min: 2, emoji: "🤔", title: "Давай познакомимся!", text: "Кое-что ты угадал. Пора нам почаще общаться!" },
    { min: 0, emoji: "😄", title: "Мы почти не знакомы!", text: "Ничего страшного! Поиграем вместе, и ты узнаешь меня лучше." }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var index = 0, locked = false;
  var mode = "solo";
  var names = ["Игрок 1", "Игрок 2"];
  var scores = [0, 0];
  var turn = 0, picks = [];
  var TIME_LIMIT = 20;
  var timerId = null, deadline = 0;
  var SECTIONS = ["start", "setup", "pass", "game", "result"];
  var HINTS = 2;            // сколько раз за игру можно взять 50/50
  var hints = [HINTS, HINTS];
  var hintUsed = false;     // на этом вопросе уже брали подсказку

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
      p.textContent = "Счёт: " + scores[0];
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
    var t = $("turn");
    if (mode === "solo") { t.classList.add("hidden"); return; }
    t.classList.remove("hidden");
    t.className = "turn t" + turn;
    t.textContent = "Ход: " + names[turn];
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
    for (var k = 0; k < item.a.length; k++) if (k !== item.right) wrong.push(k);
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
    $("counter").textContent = "Вопрос " + (index + 1) + " из " + QUESTIONS.length;
    renderScores();
    renderTurn();
    $("barFill").style.width = (index / QUESTIONS.length * 100) + "%";
    $("question").textContent = item.q;
    $("feedback").innerHTML = "";
    renderAnswers();
    renderHint();
    startTimer();
  }

  function renderAnswers() {
    var item = QUESTIONS[index];
    var box = $("answers");
    box.innerHTML = "";
    item.a.forEach(function (text, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ans c" + i;
      b.innerHTML = '<span class="letter">' + LETTERS[i] + '</span><span class="txt"></span>';
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

  function markAnswers(chosen) {
    var item = QUESTIONS[index];
    var buttons = $("answers").children;
    for (var k = 0; k < buttons.length; k++) {
      buttons[k].disabled = true;
      if (k === item.right) buttons[k].classList.add("right");
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
    nb.textContent = last ? (mode === "duel" ? "Кто победил?" : "Узнать результат") : "Дальше";
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
      markAnswers(i);
      if (ok) scores[0]++;
      else if (lost) scores[0]--;
      play(ok ? "right" : (timedOut ? "timeout" : "wrong"));
      renderScores();
      var fb = $("feedback");
      fb.innerHTML = "";
      var t = document.createElement("div");
      t.className = "fb-text";
      var msg = timedOut ? "Время вышло! ⏰" : (ok ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : OOPS[Math.floor(Math.random() * OOPS.length)]);
      t.textContent = ok ? msg + " +1 балл" : msg + (lost ? " −1 балл." : " Балл не меняется.") + " Правильный ответ: " + item.a[item.right];
      fb.appendChild(t);
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
    // ответили оба: показываем правильный ответ и очки
    markAnswers(i);
    var fb2 = $("feedback");
    fb2.innerHTML = "";
    var rightText = document.createElement("div");
    rightText.className = "fb-text";
    rightText.textContent = "Правильный ответ: " + item.a[item.right];
    fb2.appendChild(rightText);
    for (var k = 0; k < 2; k++) {
      var okk = picks[k] === item.right;
      // ниже нуля счёт не опускается
      var lostk = !okk && picks[k] !== -1 && scores[k] > 0;
      if (okk) scores[k]++;
      else if (lostk) scores[k]--;
      var line = document.createElement("div");
      line.className = "fb-line";
      line.textContent = names[k] + ": " + (okk ? "верно! +1 ✅" : (picks[k] === -1 ? "не успел ⏰ 0" : (lostk ? "мимо −1 ❌" : "мимо ❌ 0")));
      fb2.appendChild(line);
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

  function finish() {
    stopTimer();
    if (mode === "duel") {
      $("resLabel").textContent = "Итог дуэли";
      $("resScore").textContent = scores[0] + " : " + scores[1];
      if (scores[0] === scores[1]) {
        play("right");
        $("resEmoji").textContent = "🤝";
        $("resTitle").textContent = "Ничья!";
        $("resText").textContent = "Вы знаете меня одинаково хорошо. Сыграйте ещё раз, чтобы выявить победителя!";
      } else {
        var w = scores[0] > scores[1] ? 0 : 1;
        play("win");
        $("resEmoji").textContent = "🏆";
        $("resTitle").textContent = "Победил " + names[w] + "!";
        $("resText").textContent = names[w] + " знает меня лучше: " + scores[w] + " из " + QUESTIONS.length + ". Поздравляем!";
      }
      show("result");
      return;
    }
    var r = RESULTS[RESULTS.length - 1];
    for (var i = 0; i < RESULTS.length; i++) {
      if (scores[0] >= RESULTS[i].min) { r = RESULTS[i]; break; }
    }
    play(scores[0] >= 3 ? "win" : "wrong");
    $("resLabel").textContent = "Твой результат";
    $("resEmoji").textContent = r.emoji;
    $("resScore").textContent = scores[0] + " из " + QUESTIONS.length;
    $("resTitle").textContent = r.title;
    $("resText").textContent = r.text;
    show("result");
  }

  function begin() {
    index = 0; turn = 0; picks = []; scores = [0, 0];
    hints = [HINTS, HINTS];
    ac();   // звук включается после первого нажатия (так требуют браузеры)
    show("game");
    render();
  }

  $("soloBtn").addEventListener("click", function () { mode = "solo"; begin(); });
  $("duelBtn").addEventListener("click", function () { mode = "duel"; show("setup"); });
  $("goBtn").addEventListener("click", function () {
    names[0] = $("n0").value.trim() || "Игрок 1";
    names[1] = $("n1").value.trim() || "Игрок 2";
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
  renderMute();
})();
