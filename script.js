const API_URL =
    'https://chess-api-production-4ee5.up.railway.app';

let players = [];
let tournaments = [];
let results = [];

async function loadData() {

    const [
        playersResponse,
        tournamentsResponse,
        resultsResponse
    ] = await Promise.all([
        fetch(`${API_URL}/players`),
        fetch(`${API_URL}/tournaments`),
        fetch(`${API_URL}/results`)
    ]);

    players = await playersResponse.json();
    tournaments = await tournamentsResponse.json();
    results = await resultsResponse.json();

    renderPlayers();
    renderTournaments();
    renderResults();
}

function renderPlayers() {

    const tbody =
        document.querySelector(
            '#playersTable tbody'
        );

    tbody.innerHTML = '';

    for (const player of players) {

        tbody.insertAdjacentHTML(
            'beforeend',
            `
            <tr>
                <td>${player.id}</td>
                <td>${player.name}</td>
            </tr>
            `
        );
    }
}

function renderTournaments() {

    const tbody =
        document.querySelector(
            '#tournamentsTable tbody'
        );

    tbody.innerHTML = '';

    for (const tournament of tournaments) {

        tbody.insertAdjacentHTML(
            'beforeend',
            `
            <tr>
                <td>${tournament.id}</td>
                <td>${tournament.name}</td>
            </tr>
            `
        );
    }
}

function getPlayerName(playerId) {

    const player =
        players.find(
            p => p.id === playerId
        );

    return player
        ? player.name
        : playerId;
}

function getTournamentName(tournamentId) {

    const tournament =
        tournaments.find(
            t => t.id === tournamentId
        );

    return tournament
        ? tournament.name
        : tournamentId;
}

function renderResults() {

    const container =
        document.getElementById(
            'resultsContainer'
        );

    container.innerHTML = '';

    for (const result of results) {

        let playersHtml = '';

        for (const player of result.players) {

            playersHtml += `
                <li>
                    ${getPlayerName(player.playerId)}
                    —
                    ${player.result}
                </li>
            `;
        }

        container.insertAdjacentHTML(
            'beforeend',
            `
            <div class="result-card">

                <h3>
                    ${getTournamentName(result.tournamentId)}
                    (${result.year})
                </h3>

                <ul>
                    ${playersHtml}
                </ul>

            </div>
            `
        );
    }
}

async function addPlayer() {

    const id =
        document.getElementById(
            'playerId'
        ).value.trim();

    const name =
        document.getElementById(
            'playerName'
        ).value.trim();

    if (!id || !name) {
        alert('Заполните все поля');
        return;
    }

    const response = await fetch(
        `${API_URL}/players`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id,
                name
            })
        }
    );

    const result =
        await response.json();

    if (!response.ok) {
        alert(result.error);
        return;
    }

    document.getElementById(
        'playerId'
    ).value = '';

    document.getElementById(
        'playerName'
    ).value = '';

    await loadData();
}

async function addTournament() {

    const id =
        document.getElementById(
            'tournamentId'
        ).value.trim();

    const name =
        document.getElementById(
            'tournamentName'
        ).value.trim();

    if (!id || !name) {
        alert('Заполните все поля');
        return;
    }

    const response = await fetch(
        `${API_URL}/tournaments`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id,
                name
            })
        }
    );

    const result =
        await response.json();

    if (!response.ok) {
        alert(result.error);
        return;
    }

    document.getElementById(
        'tournamentId'
    ).value = '';

    document.getElementById(
        'tournamentName'
    ).value = '';

    await loadData();
}

loadData();