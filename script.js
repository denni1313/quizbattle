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

  function render() {
    var item = QUESTIONS[index];
    locked = false;
    $("counter").textContent = "Вопрос " + (index + 1) + " из " + QUESTIONS.length;
    renderScores();
    renderTurn();
    $("barFill").style.width = (index / QUESTIONS.length * 100) + "%";
    $("question").textContent = item.q;
    $("feedback").innerHTML = "";
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
    startTimer();
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
    var item = QUESTIONS[index];
    var timedOut = i === -1;

    if (mode === "solo") {
      var ok = i === item.right;
      // ниже нуля счёт не опускается
      var lost = !ok && !timedOut && scores[0] > 0;
      markAnswers(i);
      if (ok) scores[0]++;
      else if (lost) scores[0]--;
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
        $("resEmoji").textContent = "🤝";
        $("resTitle").textContent = "Ничья!";
        $("resText").textContent = "Вы знаете меня одинаково хорошо. Сыграйте ещё раз, чтобы выявить победителя!";
      } else {
        var w = scores[0] > scores[1] ? 0 : 1;
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
    $("resLabel").textContent = "Твой результат";
    $("resEmoji").textContent = r.emoji;
    $("resScore").textContent = scores[0] + " из " + QUESTIONS.length;
    $("resTitle").textContent = r.title;
    $("resText").textContent = r.text;
    show("result");
  }

  function begin() {
    index = 0; turn = 0; picks = []; scores = [0, 0];
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
    renderTurn();
    startTimer();
  });
  $("againBtn").addEventListener("click", function () { stopTimer(); show("start"); });
})();
