// Все тексты интерфейса на трёх языках. Правила:
// - {name} — подстановка, делается через tr();
// - results[] идёт в том же порядке, что RESULT_META в script.js: 5, 4, 3, 2, 0 баллов.
var I18N = {
  ru: {
    title: "Насколько хорошо ты меня знаешь?",
    startTitle: "Насколько хорошо ты меня знаешь?",
    startSub: "{n} {q}. Выбирай ответ и узнай, настоящий ли ты друг!",
    soloBtn: "Играть одному",
    duelBtn: "⚔️ Дуэль вдвоём",
    setupTitle: "Дуэль!",
    setupSub: "Играете вдвоём на одном телефоне. Вводи имена (можно не вводить).",
    player1: "Игрок 1",
    player2: "Игрок 2",
    goBtn: "Поехали!",
    passTitle: "Передай телефон",
    passSub: "Первый игрок не подсматривает! Ответ ещё не показан.",
    readyBtn: "Я готов!",
    counter: "Вопрос {i} из {n}",
    hint: "💡 50 / 50",
    soundAria: "Звук",
    langRu: "Русский",
    langPt: "Португальский",
    langEn: "Английский",
    letters: ["А", "Б", "В", "Г"],
    score: "Счёт: {s}",
    turn: "Ход: {name}",
    timeUp: "Время вышло! ⏰",
    plus1: "+1 балл",
    minus1: "−1 балл.",
    noChange: "Балл не меняется.",
    next: "Дальше",
    toResult: "Узнать результат",
    whoWon: "Кто победил?",
    correctLine: "{name}: верно! +1 ✅",
    timeoutLine: "{name}: не успел ⏰ 0",
    wrongLine: "{name}: мимо −1 ❌",
    wrongZeroLine: "{name}: мимо ❌ 0",
    resultLabel: "Твой результат",
    percentLabel: "{p}% правильных",
    scoreOf: "{s} из {t}",
    best: "🏆 Лучший результат: {p}% ({c} из {t})",
    record: "🎉 Новый рекорд: {p}% ({c} из {t})",
    againBtn: "Играть ещё раз",
    duelResultLabel: "Итог дуэли",
    drawTitle: "Ничья!",
    drawText: "Вы знаете меня одинаково хорошо. Сыграйте ещё раз, чтобы выявить победителя!",
    winTitle: "Победитель — {name}!",
    winText: "{name} знает меня лучше: {c} из {t} ({p}% правильных). Поздравляем!",
    duelPercents: "{n0} — {p0}% • {n1} — {p1}%",
    praise: ["Верно! 🎉", "Точно в цель! 🎯", "Ты знаешь меня! 💪", "Да! Так держать! 🔥", "Вот это память! 🧠"],
    oops: ["Мимо! 😅", "Не угадал! 🙈", "Ой, не то! 😬"],
    results: [
      { title: "Ты мой лучший друг!", text: "Ты знаешь обо мне абсолютно всё. Это просто космос!" },
      { title: "Почти идеально!", text: "Ты знаешь меня очень хорошо. Не хватило совсем чуть-чуть!" },
      { title: "Неплохо!", text: "Ты знаешь меня довольно хорошо, но есть что узнать." },
      { title: "Давай познакомимся!", text: "Кое-что ты угадал. Пора нам почаще общаться!" },
      { title: "Мы почти не знакомы!", text: "Ничего страшного! Поиграем вместе, и ты узнаешь меня лучше." }
    ]
  },

  pt: {
    title: "Quão bem me conheces?",
    startTitle: "Quão bem me conheces?",
    startSub: "{n} {q}. Escolhe a resposta e descobre se és mesmo meu amigo!",
    soloBtn: "Jogar a solo",
    duelBtn: "⚔️ Duelo a dois",
    setupTitle: "Duelo!",
    setupSub: "Jogam os dois no mesmo telemóvel. Escreve os nomes (podes deixar em branco).",
    player1: "Jogador 1",
    player2: "Jogador 2",
    goBtn: "Vamos lá!",
    passTitle: "Passa o telemóvel",
    passSub: "O primeiro jogador não espreita! A resposta ainda não foi mostrada.",
    readyBtn: "Continuar",
    counter: "Pergunta {i} de {n}",
    hint: "💡 50 / 50",
    soundAria: "Som",
    langRu: "Russo",
    langPt: "Português",
    langEn: "Inglês",
    letters: ["A", "B", "C", "D"],
    score: "Pontos: {s}",
    turn: "É a vez de {name}",
    timeUp: "O tempo acabou! ⏰",
    plus1: "+1 ponto",
    minus1: "−1 ponto.",
    noChange: "Pontos inalterados.",
    next: "Seguinte",
    toResult: "Ver resultado",
    whoWon: "Quem ganhou?",
    correctLine: "{name}: certo! +1 ✅",
    timeoutLine: "{name}: sem resposta ⏰ 0",
    wrongLine: "{name}: falhou −1 ❌",
    wrongZeroLine: "{name}: falhou ❌ 0",
    resultLabel: "O teu resultado",
    percentLabel: "{p}% de respostas certas",
    scoreOf: "{s} de {t}",
    best: "🏆 Melhor resultado: {p}% ({c} de {t})",
    record: "🎉 Novo recorde: {p}% ({c} de {t})",
    againBtn: "Jogar outra vez",
    duelResultLabel: "Resultado do duelo",
    drawTitle: "Empate!",
    drawText: "Conhecem-me os dois igualmente bem. Joguem outra vez para desempatar!",
    winTitle: "Vencedor: {name}!",
    winText: "{name} conhece-me melhor: {c} de {t} ({p}% de respostas certas). Parabéns!",
    duelPercents: "{n0} — {p0}% • {n1} — {p1}%",
    praise: ["Certo! 🎉", "Em cheio! 🎯", "Conheces-me bem! 💪", "Isso mesmo! 🔥", "Que memória! 🧠"],
    oops: ["Falhaste! 😅", "Não era essa! 🙈", "Ups, errado! 😬"],
    results: [
      { title: "Sabes tudo sobre mim!", text: "És oficialmente um especialista na minha vida. Incrível!" },
      { title: "Quase perfeito!", text: "Conheces-me muito bem. Faltou só um bocadinho!" },
      { title: "Nada mal!", text: "Conheces-me razoavelmente bem, mas ainda há coisas para descobrir." },
      { title: "Vamos conhecer-nos melhor!", text: "Acertaste em algumas. Está na hora de falarmos mais!" },
      { title: "Quase não nos conhecemos!", text: "Não faz mal! Joga comigo outra vez e vais saber mais sobre mim." }
    ]
  },

  en: {
    title: "How well do you know me?",
    startTitle: "How well do you know me?",
    startSub: "{n} {q}. Pick an answer and find out if you're a real friend!",
    soloBtn: "Play alone",
    duelBtn: "⚔️ Two-player duel",
    setupTitle: "Duel!",
    setupSub: "You play together on one phone. Enter your names (optional).",
    player1: "Player 1",
    player2: "Player 2",
    goBtn: "Let's go!",
    passTitle: "Pass the phone",
    passSub: "Player one, no peeking! The answer hasn't been shown yet.",
    readyBtn: "I'm ready!",
    counter: "Question {i} of {n}",
    hint: "💡 50 / 50",
    soundAria: "Sound",
    langRu: "Russian",
    langPt: "Portuguese",
    langEn: "English",
    letters: ["A", "B", "C", "D"],
    score: "Score: {s}",
    turn: "{name}'s turn",
    timeUp: "Time's up! ⏰",
    plus1: "+1 point",
    minus1: "−1 point.",
    noChange: "Score unchanged.",
    next: "Next",
    toResult: "See result",
    whoWon: "Who won?",
    correctLine: "{name}: correct! +1 ✅",
    timeoutLine: "{name}: out of time ⏰ 0",
    wrongLine: "{name}: wrong −1 ❌",
    wrongZeroLine: "{name}: wrong ❌ 0",
    resultLabel: "Your result",
    percentLabel: "{p}% correct",
    scoreOf: "{s} of {t}",
    best: "🏆 Best result: {p}% ({c} of {t})",
    record: "🎉 New record: {p}% ({c} of {t})",
    againBtn: "Play again",
    duelResultLabel: "Duel result",
    drawTitle: "It's a draw!",
    drawText: "You both know me equally well. Play again to break the tie!",
    winTitle: "{name} wins!",
    winText: "{name} knows me better: {c} of {t} ({p}% correct). Congratulations!",
    duelPercents: "{n0} — {p0}% • {n1} — {p1}%",
    praise: ["Correct! 🎉", "Spot on! 🎯", "You know me! 💪", "Yes! Keep going! 🔥", "What a memory! 🧠"],
    oops: ["Missed it! 😅", "Not that one! 🙈", "Oops, wrong! 😬"],
    results: [
      { title: "You're my best friend!", text: "You know absolutely everything about me. That's out of this world!" },
      { title: "Almost perfect!", text: "You know me really well. You were just a tiny bit short!" },
      { title: "Not bad!", text: "You know me pretty well, but there's still more to learn." },
      { title: "Let's get to know each other!", text: "You got a few right. We should hang out more!" },
      { title: "We barely know each other!", text: "No worries! Play with me and you'll get to know me better." }
    ]
  }
};

// Подстановка {ключ} в строку. Если строки нет — возвращаем ключ, чтобы это было видно.
function tr(lang, key, params) {
  var dict = I18N[lang] || I18N.ru;
  var value = dict[key];
  if (value === undefined) value = I18N.ru[key];
  if (value === undefined) return key;
  if (typeof value !== "string" || !params) return value;
  return value.replace(/\{(\w+)\}/g, function (m, k) {
    return params[k] !== undefined ? String(params[k]) : m;
  });
}

// Склонение: ru — три формы, pt/en — две.
function plural(lang, n, forms) {
  var f = forms[lang] || forms.ru;
  n = Math.abs(Math.round(n));
  if (lang === "ru") {
    var n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return f[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return f[1];
    return f[2];
  }
  return n === 1 ? f[0] : f[1];
}
