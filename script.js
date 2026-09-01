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

function createActionButton(text, className, handler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.className = `action-button ${className}`.trim();
    button.addEventListener('click', handler);
    return button;
}

function renderPlayers() {
    const tbody = document.querySelector('#playersTable tbody');
    tbody.innerHTML = '';

    for (const player of players) {
        const row = document.createElement('tr');
        const idCell = document.createElement('td');
        const nameCell = document.createElement('td');
        const actionsCell = document.createElement('td');

        idCell.textContent = player.id;
        nameCell.textContent = player.name;
        actionsCell.className = 'actions';

        actionsCell.append(
            createActionButton('Редактировать', '', () => editPlayer(player)),
            createActionButton('Удалить', 'delete-button', () => deletePlayer(player))
        );

        row.append(idCell, nameCell, actionsCell);
        tbody.appendChild(row);
    }
}

function renderTournaments() {
    const tbody = document.querySelector('#tournamentsTable tbody');
    tbody.innerHTML = '';

    for (const tournament of tournaments) {
        const row = document.createElement('tr');
        const idCell = document.createElement('td');
        const nameCell = document.createElement('td');
        const formatCell = document.createElement('td');
        const actionsCell = document.createElement('td');

        idCell.textContent = tournament.id;
        nameCell.textContent = tournament.name;
        formatCell.textContent = getTournamentFormatName(tournament.format);
        actionsCell.className = 'actions';

        actionsCell.append(
            createActionButton('Редактировать', '', () => editTournament(tournament)),
            createActionButton('Удалить', 'delete-button', () => deleteTournament(tournament))
        );

        row.append(idCell, nameCell, formatCell, actionsCell);
        tbody.appendChild(row);
    }
}

function getTournamentFormatName(format) {
    const names = {
        standings: 'Итоговая таблица',
        knockout: 'Нокаут',
        match: 'Матч'
    };

    return names[format] || format || 'Не указан';
}

function getPlayerName(playerId) {
    const player = players.find(item => item.id === playerId);
    return player ? player.name : playerId;
}

function getTournamentName(tournamentId) {
    const tournament = tournaments.find(item => item.id === tournamentId);
    return tournament ? tournament.name : tournamentId;
}

function renderResults() {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';

    if (results.length === 0) {
        const message = document.createElement('p');
        message.className = 'empty-message';
        message.textContent = 'Результатов пока нет.';
        container.appendChild(message);
        return;
    }

    for (const result of results) {
        const card = document.createElement('div');
        const heading = document.createElement('h3');
        const list = document.createElement('ul');
        const actions = document.createElement('div');

        card.className = 'result-card';
        heading.textContent = `${getTournamentName(result.tournamentId)} (${result.year})`;
        actions.className = 'actions';

        for (const playerResult of result.players) {
            const item = document.createElement('li');
            item.textContent = `${getPlayerName(playerResult.playerId)} — ${playerResult.result}`;
            list.appendChild(item);
        }

        actions.append(
            createActionButton('Редактировать', '', () => editResult(result)),
            createActionButton('Удалить', 'delete-button', () => deleteResult(result))
        );

        card.append(heading, list, actions);
        container.appendChild(card);
    }
}

function renderResultForm() {
    const tournamentSelect = document.getElementById('resultTournamentId');
    const playersContainer = document.getElementById('resultPlayersFields');
    const selectedTournamentId = tournamentSelect.value;

    tournamentSelect.innerHTML = '';

    if (tournaments.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Сначала добавьте турнир';
        tournamentSelect.appendChild(option);
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
        const message = document.createElement('p');
        message.className = 'empty-message';
        message.textContent = 'Сначала добавьте игроков.';
        playersContainer.appendChild(message);
        return;
    }

    for (const player of players) {
        const row = document.createElement('div');
        const label = document.createElement('label');
        const input = document.createElement('input');

        row.className = 'player-result-row';
        label.htmlFor = `result-player-${player.id}`;
        label.textContent = player.name;
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
            headers: { 'Content-Type': 'application/json' },
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
    const formatInput = document.getElementById('tournamentFormat');
    const id = idInput.value.trim();
    const name = nameInput.value.trim();
    const format = formatInput.value;

    if (!id || !name || !format) {
        alert('Заполните ID, название и формат турнира.');
        return;
    }

    try {
        await apiRequest('/tournaments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name, format })
        });

        idInput.value = '';
        nameInput.value = '';
        formatInput.value = 'standings';
        await loadData();
    }
    catch (error) {
        alert(error.message);
    }
}

function collectResultPlayers() {
    return [...document.querySelectorAll(
        '#resultPlayersFields input[data-player-id]'
    )]
        .map(input => ({
            playerId: input.dataset.playerId,
            result: input.value.trim()
        }))
        .filter(item => item.result !== '');
}

async function addResult() {
    const tournamentId = document.getElementById('resultTournamentId').value;
    const yearValue = document.getElementById('resultYear').value.trim();
    const year = Number(yearValue);
    const playerResults = collectResultPlayers();

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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tournamentId,
                year,
                players: playerResults
            })
        });

        document.getElementById('resultYear').value = '';
        await loadData();
    }
    catch (error) {
        alert(error.message);
    }
}

async function editPlayer(player) {
    const name = prompt('Новое имя игрока:', player.name);

    if (name === null) {
        return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
        alert('Имя игрока не может быть пустым.');
        return;
    }

    try {
        await apiRequest(`/players/${encodeURIComponent(player.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: trimmedName })
        });

        await loadData();
    }
    catch (error) {
        alert(error.message);
    }
}

async function deletePlayer(player) {
    if (!confirm(`Удалить игрока «${player.name}»?`)) {
        return;
    }

    try {
        await apiRequest(`/players/${encodeURIComponent(player.id)}`, {
            method: 'DELETE'
        });

        await loadData();
    }
    catch (error) {
        alert(error.message);
    }
}

async function editTournament(tournament) {
    const name = prompt('Новое название турнира:', tournament.name);

    if (name === null) {
        return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
        alert('Название турнира не может быть пустым.');
        return;
    }

    const format = prompt(
        'Новый формат: standings, knockout или match',
        tournament.format || 'standings'
    );

    if (format === null) {
        return;
    }

    const trimmedFormat = format.trim();

    if (!['standings', 'knockout', 'match'].includes(trimmedFormat)) {
        alert('Формат должен быть standings, knockout или match.');
        return;
    }

    try {
        await apiRequest(`/tournaments/${encodeURIComponent(tournament.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: trimmedName,
                format: trimmedFormat
            })
        });

        await loadData();
    }
    catch (error) {
        alert(error.message);
    }
}

async function deleteTournament(tournament) {
    if (!confirm(`Удалить турнир «${tournament.name}»?`)) {
        return;
    }

    try {
        await apiRequest(`/tournaments/${encodeURIComponent(tournament.id)}`, {
            method: 'DELETE'
        });

        await loadData();
    }
    catch (error) {
        alert(error.message);
    }
}

async function editResult(result) {
    const updatedPlayers = [];

    for (const player of players) {
        const existing = result.players.find(
            item => item.playerId === player.id
        );

        const value = prompt(
            `Результат игрока «${player.name}». Оставьте пустым, если игрок не участвовал:`,
            existing ? existing.result : ''
        );

        if (value === null) {
            return;
        }

        const trimmedValue = value.trim();

        if (trimmedValue) {
            updatedPlayers.push({
                playerId: player.id,
                result: trimmedValue
            });
        }
    }

    if (updatedPlayers.length === 0) {
        alert('Укажите результат хотя бы одного игрока.');
        return;
    }

    try {
        await apiRequest('/results', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tournamentId: result.tournamentId,
                year: result.year,
                players: updatedPlayers
            })
        });

        await loadData();
    }
    catch (error) {
        alert(error.message);
    }
}

async function deleteResult(result) {
    const tournamentName = getTournamentName(result.tournamentId);

    if (!confirm(`Удалить результат «${tournamentName} (${result.year})»?`)) {
        return;
    }

    try {
        await apiRequest('/results', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tournamentId: result.tournamentId,
                year: result.year
            })
        });

        await loadData();
    }
    catch (error) {
        alert(error.message);
    }
}

loadData();
