const QUESTION_FILES = {
    "nba": "questions/nba.js",
    "nfl": "questions/nfl.js",
    "nhl": "questions/nhl.js",
    "ufc": "questions/ufc.js",
    "f1": "questions/f1.js",
    "formula e": "questions/formula_e.js",
    "motogp": "questions/motogp.js",
    "indycar": "questions/indycar.js",
    "imsa sportscar": "questions/imsa_sportscar.js",
    "ferrari challenge na": "questions/ferrari_challenge_na.js",
    "wec": "questions/wec.js",
    "gtwc endurance": "questions/gtwc_endurance.js",
    "gtwc sprint": "questions/gtwc_sprint.js",
    "wrc": "questions/wrc.js",
    "dakar rally": "questions/dakar_rally.js",
    "super gt": "questions/super_gt.js",
    "cfl": "questions/cfl.js",
    "ufl": "questions/ufl.js",
    "mls": "questions/mls.js",
    "epl": "questions/epl.js",
    "la liga": "questions/la_liga.js",
    "bundesliga": "questions/bundesliga.js",
    "euroleague bb": "questions/euroleague_bb.js",
    "australian nbl": "questions/australian_nbl.js",
    "ncaa hockey": "questions/ncaa_hockey.js",
    "swedish hockey": "questions/swedish_hockey.js",
    "boxing": "questions/boxing.js",
    "one champ": "questions/one_champ.js",
    "mlb": "questions/mlb.js",
    "kbo league": "questions/kbo_league.js",
    "nippon": "questions/nippon.js",
    "cuban": "questions/cuban.js",
    "pga golf": "questions/pga_golf.js",
    "liv golf": "questions/liv_golf.js"
};

let currentStreak = 0;

async function loadQuestionsForSelectedSports() {
    const selected = JSON.parse(localStorage.getItem('selectedSports') || '[]');

    let allQuestions = [];

    for (const sport of selected) {
        const file = QUESTION_FILES[sport];
        if (!file) continue;
        
        // load the JS file dynamically
        await import(`./${file}`).then(module => {
            // Each file should export a variable like nbaQuestions or nflQuestions
            const sportQuestions = module.default || Object.values(module)[0];
            allQuestions.push(...sportQuestions);
        });
    }

    return allQuestions;
}

function getRandomQuestion(questions) {
    return questions[Math.floor(Math.random() * questions.length)];
}

function displayQuestion(q) {
    const container = document.getElementById("quiz-container");

    container.innerHTML = `
        <h2>${q.question}</h2>
        <div class="choices">
            ${q.choices.map((c, i) =>
                `<button class="choice-btn" data-index="${i}">${c}</button>`
            ).join('')}
        </div>
    `;

    container.style.display = 'block';

    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.style.display = 'none';

    // Attach handlers for each choice
    document.querySelectorAll(".choice-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const chosen = Number(btn.dataset.index);
            const correctIndex = q.answer;  // each question object needs q.answer

            handleAnswer(chosen === correctIndex);
        });
    });
}


function handleAnswer(isCorrect) {
    const container = document.getElementById("quiz-container");

    container.classList.remove("flash-correct", "flash-wrong");
    void container.offsetWidth;

    if (isCorrect) {
        currentStreak++;
        container.classList.add("flash-correct");
    } else {
        currentStreak = 0;
        container.classList.add("flash-wrong");
    }

    // Update the streak display
    document.getElementById("current-streak").textContent = `Streak 🔥${currentStreak}`;

    setTimeout(async () => {
        const questions = await loadQuestionsForSelectedSports();
        const next = getRandomQuestion(questions);
        displayQuestion(next);
    }, 600);
}


// Attach start handler safely — support being loaded before/after the button exists
function attachStartHandler() {
    const startBtn = document.getElementById('startBtn');
    if (!startBtn) {
        console.warn('startBtn not found yet — will retry on DOMContentLoaded');
        return false;
    }

    startBtn.addEventListener('click', async () => {
        const questions = await loadQuestionsForSelectedSports();
        if (!questions || questions.length === 0) {
            alert('No questions available for selected sports. Please enable some sports in the main filters.');
            return;
        }
        document.getElementById("stat-container").classList.add("stat-visible");
        
        // Show category count
        document.getElementById("category-count").textContent =
            `Categories Selected: ${JSON.parse(localStorage.getItem('selectedSports') || '[]').length}`;

        // Reset and show streak
        currentStreak = 0;
        document.getElementById("current-streak").textContent = `Streak 🔥0`;

        // Display the stats section
        document.getElementById("stat-container").style.display = "block";

        const question = getRandomQuestion(questions);
        displayQuestion(question);
    });

    return true;
}

if (!attachStartHandler()) {
    document.addEventListener('DOMContentLoaded', () => {
        attachStartHandler();
    });
}
