const API_URL = 'https://chess-api-production-4ee5.up.railway.app';

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

loadData();