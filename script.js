const API_URL =
    'https://chess-api-production-4ee5.up.railway.app';

let players = [];
let tournaments = [];
let results = [];

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data;
}

async function loadData() {
    try {
        [players, tournaments, results] = await Promise.all([
            apiRequest('/players'),
            apiRequest('/tournaments'),
            apiRequest('/results')
        ]);

        renderPlayers();
        renderTournaments();
        renderResults();
        renderResultForm();
    }
    catch (error) {
        alert(`Не удалось загрузить данные: ${error.message}`);
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function renderPlayers() {
    const tbody = document.querySelector('#playersTable tbody');
    tbody.innerHTML = '';

    for (const player of players) {
        tbody.insertAdjacentHTML(
            'beforeend',
            `
            <tr>
                <td>${escapeHtml(player.id)}</td>
                <td>${escapeHtml(player.name)}</td>
            </tr>
            `
        );
    }
}

function renderTournaments() {
    const tbody = document.querySelector('#tournamentsTable tbody');
    tbody.innerHTML = '';

    for (const tournament of tournaments) {
        tbody.insertAdjacentHTML(
            'beforeend',
            `
            <tr>
                <td>${escapeHtml(tournament.id)}</td>
                <td>${escapeHtml(tournament.name)}</td>
            </tr>
            `
        );
    }
}

function getPlayerName(playerId) {
    const player = players.find(
        item => item.id === playerId
    );

    return player ? player.name : playerId;
}

function getTournamentName(tournamentId) {
    const tournament = tournaments.find(
        item => item.id === tournamentId
    );

    return tournament ? tournament.name : tournamentId;
}

function renderResults() {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';

    if (results.length === 0) {
        container.innerHTML = '<p class="empty-message">Результатов пока нет.</p>';
        return;
    }

    for (const result of results) {
        const playersHtml = result.players
            .map(player => `
                <li>
                    ${escapeHtml(getPlayerName(player.playerId))}
                    —
                    ${escapeHtml(player.result)}
                </li>
            `)
            .join('');

        container.insertAdjacentHTML(
            'beforeend',
            `
            <div class="result-card">
                <h3>
                    ${escapeHtml(getTournamentName(result.tournamentId))}
                    (${escapeHtml(result.year)})
                </h3>
                <ul>${playersHtml}</ul>
            </div>
            `
        );
    }
}

function renderResultForm() {
    const tournamentSelect = document.getElementById('resultTournamentId');
    const playersContainer = document.getElementById('resultPlayersFields');

    const selectedTournamentId = tournamentSelect.value;

    tournamentSelect.innerHTML = '';

    if (tournaments.length === 0) {
        tournamentSelect.innerHTML = '<option value="">Сначала добавьте турнир</option>';
        tournamentSelect.disabled = true;
    }
    else {
        tournamentSelect.disabled = false;

        for (const tournament of tournaments) {
            const option = document.createElement('option');
            option.value = tournament.id;
            option.textContent = tournament.name;
            tournamentSelect.appendChild(option);
        }

        if (tournaments.some(item => item.id === selectedTournamentId)) {
            tournamentSelect.value = selectedTournamentId;
        }
    }

    playersContainer.innerHTML = '';

    if (players.length === 0) {
        playersContainer.innerHTML = '<p class="empty-message">Сначала добавьте игроков.</p>';
        return;
    }

    for (const player of players) {
        const row = document.createElement('div');
        row.className = 'player-result-row';

        const label = document.createElement('label');
        label.htmlFor = `result-player-${player.id}`;
        label.textContent = player.name;

        const input = document.createElement('input');
        input.id = `result-player-${player.id}`;
        input.type = 'text';
        input.placeholder = 'Место или результат';
        input.dataset.playerId = player.id;

        row.append(label, input);
        playersContainer.appendChild(row);
    }
}

async function addPlayer() {
    const idInput = document.getElementById('playerId');
    const nameInput = document.getElementById('playerName');

    const id = idInput.value.trim();
    const name = nameInput.value.trim();

    if (!id || !name) {
        alert('Заполните ID и имя игрока.');
        return;
    }

    try {
        await apiRequest('/players', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, name })
        });

        idInput.value = '';
        nameInput.value = '';

        await loadData();
    }
    catch (error) {
        alert(error.message);
    }
}

async function addTournament() {
    const idInput = document.getElementById('tournamentId');
    const nameInput = document.getElementById('tournamentName');

    const id = idInput.value.trim();
    const name = nameInput.value.trim();

    if (!id || !name) {
        alert('Заполните ID и название турнира.');
        return;
    }

    try {
        await apiRequest('/tournaments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, name })
        });

        idInput.value = '';
        nameInput.value = '';

        await loadData();
    }
    catch (error) {
        alert(error.message);
    }
}

async function addResult() {
    const tournamentId = document
        .getElementById('resultTournamentId')
        .value;

    const yearValue = document
        .getElementById('resultYear')
        .value
        .trim();

    const year = Number(yearValue);

    const playerResults = [...document.querySelectorAll(
        '#resultPlayersFields input[data-player-id]'
    )]
        .map(input => ({
            playerId: input.dataset.playerId,
            result: input.value.trim()
        }))
        .filter(item => item.result !== '');

    if (!tournamentId) {
        alert('Выберите турнир.');
        return;
    }

    if (!Number.isInteger(year) || year <= 0) {
        alert('Укажите корректный год.');
        return;
    }

    if (playerResults.length === 0) {
        alert('Укажите результат хотя бы одного игрока.');
        return;
    }

    try {
        await apiRequest('/results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tournamentId,
                year,
                players: playerResults
            })
        });

        document.getElementById('resultYear').value = '';

        for (const input of document.querySelectorAll(
            '#resultPlayersFields input[data-player-id]'
        )) {
            input.value = '';
        }

        await loadData();
    }
    catch (error) {
        alert(error.message);
    }
}

loadData();
