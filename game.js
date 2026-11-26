
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const $ = id => document.getElementById(id);

let player = {
    x: 470,
    y: 390,
    speed: 3,
    hp: 120,
    maxHp: 120,
    mp: 60,
    maxMp: 60,
    level: 1,
    exp: 0,
    maxExp: 100
};

let keys = {};
let battle = false;
let guarding = false;
let enemy = null;
let gameLocked = false;
let dialogueOpen = false;
let battleEnding = false;

const mirror = { x: 790, y: 210 };

const enemyTemplates = [
    { name: "SHADOW", hp: 100, maxHp: 100, attack: 13, exp: 45 },
    { name: "DARK WOLF", hp: 140, maxHp: 140, attack: 17, exp: 65 },
    { name: "VOID KNIGHT", hp: 190, maxHp: 190, attack: 22, exp: 100 }
];

// Keyboard controls
window.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();

    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        e.preventDefault();
    }

    keys[key] = true;

    if (key === "e" && !battle && !dialogueOpen) {
        interact();
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

// PIXEL ART HELPERS

function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function text(str, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px monospace`;
    ctx.fillText(str, x, y);
}

// BACKGROUND

function drawWorld() {
    // Grass
    rect(0, 0, W, H, "#263d36");

    // Pixel grass pattern
    for (let y = 0; y < H; y += 32) {
        for (let x = 0; x < W; x += 32) {
            const n = (x * 7 + y * 13) % 4;
            rect(x + 5, y + 8, 3, 3,
                n === 0 ? "#405c45" : "#304a3b");
        }
    }

    // Main stone path
    rect(0, 340, W, 115, "#77716a");
    rect(0, 345, W, 5, "#a69c89");
    rect(0, 450, W, 5, "#504c4c");

    // Path tiles
    for (let x = 0; x < W; x += 64) {
        rect(x, 390, 2, 55, "#655f5b");
    }

    // Buildings
    drawBuilding(65, 90, 210, 170, "#704b55");
    drawBuilding(350, 40, 180, 190, "#4d536b");

    // Buildings windows
    rect(95, 130, 40, 45, "#e4c77c");
    rect(205, 130, 40, 45, "#e4c77c");
    rect(390, 90, 35, 45, "#d9bb76");
    rect(455, 90, 35, 45, "#d9bb76");

    // Mirror altar
    drawMirror();

    // Trees
    drawTree(40, 300);
    drawTree(300, 290);
    drawTree(610, 300);
    drawTree(900, 310);
}

function drawBuilding(x, y, w, h, color) {
    rect(x + 8, y + 10, w, h, "#171b24");
    rect(x, y, w, h, color);
    rect(x - 8, y - 12, w + 16, 20, "#b45e69");
    rect(x + 12, y + 18, w - 24, 8, "#c68a7c");
    rect(x + w / 2 - 22, y + h - 55, 44, 55, "#342a40");
    rect(x + w / 2 - 3, y + h - 55, 6, 55, "#9b7184");
}

function drawTree(x, y) {
    rect(x + 12, y + 35, 13, 35, "#714832");
    rect(x, y + 5, 38, 42, "#315c42");
    rect(x + 7, y - 5, 27, 25, "#47734d");
    rect(x + 8, y + 12, 8, 8, "#70905a");
}

// MAGIC MIRROR

function drawMirror() {
    // Glow
    ctx.fillStyle = "rgba(122, 60, 255, 0.15)";
    ctx.beginPath();
    ctx.arc(mirror.x, mirror.y + 30, 65, 0, Math.PI * 2);
    ctx.fill();

    // Pedestal
    rect(mirror.x - 35, mirror.y + 65, 70, 15, "#8b6a9f");
    rect(mirror.x - 23, mirror.y + 43, 46, 22, "#50406f");

    // Frame
    rect(mirror.x - 24, mirror.y - 35, 48, 85, "#d6b26e");
    rect(mirror.x - 18, mirror.y - 29, 36, 73, "#47315e");

    // Glass
    rect(mirror.x - 13, mirror.y - 24, 26, 62, "#7e58bc");
    rect(mirror.x - 8, mirror.y - 18, 5, 38, "#d9b6ff");
    rect(mirror.x + 5, mirror.y + 2, 5, 20, "#bd8eff");

    // Sparkles
    const t = Date.now() / 300;
    rect(mirror.x - 35 + Math.sin(t) * 5, mirror.y - 30, 4, 4, "#ffffff");
    rect(mirror.x + 30, mirror.y + Math.cos(t) * 12, 4, 4, "#ffffff");
}

// PLAYER SPRITE

function drawPlayer() {
    const x = Math.round(player.x);
    const y = Math.round(player.y);

    // Shadow
    rect(x - 12, y + 17, 25, 5, "#19251f");

    // Legs
    rect(x - 9, y + 5, 7, 15, "#29263c");
    rect(x + 2, y + 5, 7, 15, "#29263c");

    // Shoes
    rect(x - 10, y + 18, 9, 4, "#e4d6c8");
    rect(x + 2, y + 18, 9, 4, "#e4d6c8");

    // Body
    rect(x - 12, y - 15, 25, 24, "#262a49");
    rect(x - 15, y - 12, 5, 18, "#262a49");
    rect(x + 12, y - 12, 5, 18, "#262a49");

    // Shirt
    rect(x - 5, y - 13, 10, 20, "#c4d1df");

    // Scarf
    rect(x - 10, y - 13, 20, 5, "#c93e68");
    rect(x + 6, y - 9, 5, 13, "#c93e68");

    // Head
    rect(x - 9, y - 31, 19, 17, "#e9b58d");

    // Hair
    rect(x - 11, y - 34, 22, 8, "#29233b");
    rect(x - 11, y - 27, 5, 9, "#29233b");
    rect(x + 7, y - 28, 5, 8, "#29233b");

    // Eyes
    rect(x - 5, y - 24, 3, 3, "#252033");
    rect(x + 4, y - 24, 3, 3, "#252033");
}

// NPC
function drawNPC() {
    const x = 665;
    const y = 385;

    rect(x - 9, y + 5, 7, 15, "#302b46");
    rect(x + 2, y + 5, 7, 15, "#302b46");
    rect(x - 12, y - 15, 25, 24, "#bd4263");
    rect(x - 9, y - 31, 19, 17, "#e9b58d");
    rect(x - 11, y - 34, 22, 8, "#d5bd84");
    rect(x - 5, y - 24, 3, 3, "#17101c");
    rect(x + 4, y - 24, 3, 3, "#17101c");

    text("?", x + 16, y - 22, 15, "#ffffff");
}

// ENEMY ART
function drawEnemy() {
    if (!battle || !enemy) return;

    const x = 680;
    const y = 235;

    // Shadow aura
    ctx.fillStyle = "rgba(130, 40, 200, 0.25)";
    ctx.beginPath();
    ctx.arc(x, y, 100, 0, Math.PI * 2);
    ctx.fill();

    // Shadow body
    rect(x - 42, y - 42, 84, 85, "#1b132a");
    rect(x - 30, y - 60, 60, 30, "#28183e");
    rect(x - 51, y - 12, 13, 47, "#271a39");
    rect(x + 38, y - 12, 13, 47, "#271a39");

    // Horns
    rect(x - 38, y - 70, 12, 25, "#4a2d70");
    rect(x + 27, y - 70, 12, 25, "#4a2d70");

    // Eyes
    rect(x - 23, y - 20, 15, 8, "#ff315f");
    rect(x + 10, y - 20, 15, 8, "#ff315f");

    // Core
    rect(x - 10, y + 5, 20, 25, "#783ab3");
    rect(x - 5, y + 10, 10, 15, "#c88aff");

    // Particles
    const t = Date.now() / 150;
    rect(x - 65, y + Math.sin(t) * 30, 5, 5, "#a65aff");
    rect(x + 55, y + Math.cos(t) * 30, 5, 5, "#a65aff");
}

// INTERACTION

function interact() {
    const dx = player.x - mirror.x;
    const dy = player.y - mirror.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 90) {
        startDialogue(
            "Chiếc gương phát ra ánh sáng tím. Một giọng nói vang lên: 'Ngươi có dám đối mặt với bóng tối bên trong mình không?'"
        );
    } else {
        startDialogue(
            "Một thị trấn yên bình... nhưng có điều gì đó rất kỳ lạ đang xảy ra."
        );
    }
}

function startDialogue(message) {
    dialogueOpen = true;
    $("dialogueText").textContent = message;
    $("dialogue").classList.remove("hidden");
}

function closeDialogue() {
    dialogueOpen = false;
    $("dialogue").classList.add("hidden");

    const dx = player.x - mirror.x;
    const dy = player.y - mirror.y;

    if (Math.sqrt(dx * dx + dy * dy) < 90) {
        startBattle();
    }
}

// BATTLE SYSTEM

function startBattle() {
    battle = true;
    guarding = false;
    battleEnding = false;

    const template = enemyTemplates[
        Math.floor(Math.random() * enemyTemplates.length)
    ];

    enemy = { ...template };

    $("battleScreen").classList.remove("hidden");
    $("skillMenu").classList.add("hidden");
    $("location").classList.add("hidden");
    $("interaction").style.display = "none";

    $("battleMessage").textContent = "A SHADOW APPEARED!";

    drawBattleUI();
}

function showSkills() {
    if (!battle || battleEnding) return;
    $("skillMenu").classList.remove("hidden");
}

function hideSkills() {
    $("skillMenu").classList.add("hidden");
}

function drawBattleUI() {
    if (!enemy) return;

    $("enemyName").textContent = enemy.name;

    $("enemyHp").style.width =
        Math.max(0, enemy.hp / enemy.maxHp * 100) + "%";

    $("enemyHpText").textContent =
        `${Math.max(0, enemy.hp)} / ${enemy.maxHp} HP`;

    $("battleHP").textContent =
        `${player.hp} / ${player.maxHp}`;

    $("battleMP").textContent =
        `${player.mp} / ${player.maxMp}`;

    $("playerHp").style.width =
        player.hp / player.maxHp * 100 + "%";

    $("playerMp").style.width =
        player.mp / player.maxMp * 100 + "%";

    updateWorldHUD();
}

function battleAction(action) {
    if (!battle || battleEnding) return;

    guarding = false;

    let damage = 0;
    let cost = 0;
    let message = "";

    if (action === "attack") {
        damage = random(18, 27);
        message = `YOU ATTACKED! ${damage} DAMAGE!`;
    }

    if (action === "fire") {
        cost = 8;
        damage = random(35, 48);
        message = `FIRE! ${damage} DAMAGE!`;

        if (enemy.name === "SHADOW") {
            damage = Math.floor(damage * 1.5);
            message += " WEAKNESS!";
        }
    }

    if (action === "ice") {
        cost = 8;
        damage = random(30, 43);
        message = `ICE! ${damage} DAMAGE!`;
    }

    if (action === "thunder") {
        cost = 12;
        damage = random(45, 60);
        message = `THUNDER! ${damage} DAMAGE!`;
    }

    if (action === "guard") {
        guarding = true;
        message = "YOU PREPARE TO DEFEND!";
        $("battleMessage").textContent = message;
        enemyTurn();
        return;
    }

    if (action === "escape") {
        if (Math.random() < 0.65) {
            $("battleMessage").textContent = "ESCAPED SUCCESSFULLY!";
            setTimeout(endBattle, 1000);
        } else {
            $("battleMessage").textContent = "ESCAPE FAILED!";
            enemyTurn();
        }
        return;
    }

    if (player.mp < cost) {
        $("battleMessage").textContent = "NOT ENOUGH MP!";
        return;
    }

    player.mp -= cost;
    enemy.hp -= damage;

    $("battleMessage").textContent = message;

    drawBattleUI();

    if (enemy.hp <= 0) {
        winBattle();
        return;
    }

    setTimeout(enemyTurn, 800);
}

function enemyTurn() {
    if (!battle || battleEnding) return;

    const damage = random(enemy.attack - 4, enemy.attack + 5);
    const finalDamage = guarding ? Math.ceil(damage / 2) : damage;

    player.hp = Math.max(0, player.hp - finalDamage);

    $("battleMessage").textContent =
        `${enemy.name} ATTACKED! ${finalDamage} DAMAGE!`;

    guarding = false;

    drawBattleUI();

    if (player.hp <= 0) {
        player.hp = 1;
        $("battleMessage").textContent =
            "YOU FELL... BUT A MYSTERIOUS POWER SAVED YOU!";

        setTimeout(() => {
            endBattle();
            player.hp = Math.max(1, Math.floor(player.maxHp * 0.5));
            player.mp = Math.max(0, player.mp - 10);
            drawBattleUI();
        }, 1800);
    }
}

function winBattle() {
    battleEnding = true;

    $("battleMessage").textContent = "VICTORY! + EXP " + enemy.exp;

    player.exp += enemy.exp;

    while (player.exp >= player.maxExp) {
        player.exp -= player.maxExp;
        player.level++;
        player.maxExp = Math.floor(player.maxExp * 1.4);
        player.maxHp += 20;
        player.maxMp += 10;
        player.hp = player.maxHp;
        player.mp = player.maxMp;
    }

    setTimeout(() => {
        endBattle();
        updateWorldHUD();
    }, 1800);
}

function endBattle() {
    battle = false;
    battleEnding = false;
    enemy = null;

    $("battleScreen").classList.add("hidden");
    $("location").classList.remove("hidden");

    updateWorldHUD();
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// HUD

function updateWorldHUD() {
    $("worldHp").style.width =
        player.hp / player.maxHp * 100 + "%";

    $("worldMp").style.width =
        player.mp / player.maxMp * 100 + "%";

    $("worldExp").style.width =
        player.exp / player.maxExp * 100 + "%";

    $("worldHpText").textContent =
        `${player.hp}/${player.maxHp}`;

    $("worldMpText").textContent =
        `${player.mp}/${player.maxMp}`;

    $("worldExpText").textContent =
        `${player.exp}/${player.maxExp}`;

    $("levelText").textContent =
        "LEVEL " + player.level;
}

// MOVEMENT

function update() {
    if (battle || dialogueOpen || gameLocked) return;

    let dx = 0;
    let dy = 0;

    if (keys["w"] || keys["arrowup"]) dy--;
    if (keys["s"] || keys["arrowdown"]) dy++;
    if (keys["a"] || keys["arrowleft"]) dx--;
    if (keys["d"] || keys["arrowright"]) dx++;

    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    player.x += dx * player.speed;
    player.y += dy * player.speed;

    // World boundaries
    player.x = Math.max(25, Math.min(W - 25, player.x));
    player.y = Math.max(75, Math.min(H - 25, player.y));

    const distance = Math.hypot(
        player.x - mirror.x,
        player.y - mirror.y
    );

    $("interaction").style.display =
        distance < 90 ? "block" : "none";
}

// MAIN GAME LOOP

function render() {
    ctx.clearRect(0, 0, W, H);

    drawWorld();

    if (battle) {
        drawEnemy();
    } else {
        drawNPC();
        drawPlayer();
    }
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

updateWorldHUD();
gameLoop();
