class TournamentBracket {
    constructor() {
        this.matches = [];
        this.bracketData = {
            winnerBracket: {},
            loserBracket: {},
            finals: {}
        };
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.initializeMatches();
        this.loadFromStorage();
        this.updateAllMatches();
    }

    cacheElements() {
        this.container = document.querySelector('.tournament-container');
        this.matches = document.querySelectorAll('.match');
        this.championName = document.querySelector('.champion-name');
    }

    bindEvents() {
        // Event listeners para elementos editables
        document.addEventListener('input', this.handleInput.bind(this));
        document.addEventListener('focus', this.handleFocus.bind(this), true);
        document.addEventListener('blur', this.handleBlur.bind(this), true);
        document.addEventListener('click', this.handleMatchClick.bind(this));

        // Auto-save
        document.addEventListener('input', this.debounce(this.saveToStorage.bind(this), 500));

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    initializeMatches() {
        this.matchesData = [];

        this.matches.forEach((match) => {
            const teams = match.querySelectorAll('.team');
            const matchData = {
                element: match,
                matchId: match.dataset.match,
                teams: [],
                winner: null,
                bracket: this.getBracketFromMatch(match),
                round: this.getRoundFromMatch(match)
            };

            teams.forEach((team) => {
                const nameElement = team.querySelector('.name');
                const scoreElement = team.querySelector('.score');
                const seedElement = team.querySelector('.seed');

                matchData.teams.push({
                    element: team,
                    name: nameElement,
                    score: scoreElement,
                    seed: seedElement,
                    isPlaceholder: nameElement.textContent.includes('Winner') || nameElement.textContent.includes('Loser') || nameElement.textContent === 'TBD'
                });
            });

            this.matchesData.push(matchData);
        });
    }

    getBracketFromMatch(match) {
        const matchId = match.dataset.match;

        // Winner bracket matches (A, B, C)
        if (matchId.startsWith('A') || matchId.startsWith('B') || matchId.startsWith('C')) {
            return 'winner';
        }

        // Loser bracket matches (L)
        if (matchId.startsWith('L')) {
            return 'loser';
        }

        // Finals (F, GF)
        if (matchId.startsWith('F') || matchId === 'GF') {
            return 'final';
        }

        return 'unknown';
    }

    getRoundFromMatch(match) {
        const matchId = match.dataset.match;

        // Winner bracket rounds
        if (matchId.startsWith('A')) return 'wb-round1';
        if (matchId.startsWith('B')) return 'wb-round2';
        if (matchId.startsWith('C')) return 'wb-round3';

        // Loser bracket rounds
        if (matchId.match(/^L[1-4]$/)) return 'lb-round1';
        if (matchId.match(/^L[5-8]$/)) return 'lb-round2';
        if (matchId.match(/^L(9|10)$/)) return 'lb-round3';

        // Finals
        if (matchId === 'F1') return 'wb-final';
        if (matchId === 'GF') return 'grand-final';

        return 'unknown';
    }

    handleInput(event) {
        const target = event.target;

        if (target.classList.contains('score')) {
            this.updateScore(target);
        } else if (target.classList.contains('name')) {
            this.updateTeamName(target);
        } else if (target.classList.contains('champion-name')) {
            this.updateChampion(target);
        }
    }

    handleFocus(event) {
        const target = event.target;
        if (target.hasAttribute('contenteditable')) {
            target.dataset.originalValue = target.textContent;
        }
    }

    handleBlur(event) {
        const target = event.target;
        if (target.hasAttribute('contenteditable')) {
            this.validateInput(target);
        }
    }

    handleMatchClick(event) {
        const team = event.target.closest('.team');
        if (team && !event.target.hasAttribute('contenteditable')) {
            this.selectWinner(team);
        }
    }

    handleKeyboard(event) {
        // Ctrl/Cmd + S para guardar
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            this.saveToStorage();
        }

        // Ctrl/Cmd + R para resetear
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            if (confirm('¿Estás seguro de que quieres resetear el torneo?')) {
                this.resetTournament();
            }
        }

        // Ctrl/Cmd + A para avanzar automáticamente
        if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
            event.preventDefault();
            this.autoAdvanceTournament();
        }
    }

    updateScore(scoreElement) {
        const value = scoreElement.textContent.trim();
        const team = scoreElement.closest('.team');
        const match = team.closest('.match');

        // Validar que sea un número válido
        if (value && !isNaN(value) && parseInt(value) >= 0) {
            scoreElement.textContent = value;
            this.checkMatchWinner(match);
        } else if (value === '' || value === '-') {
            scoreElement.textContent = '-';
            team.classList.remove('winner');
        } else {
            scoreElement.textContent = scoreElement.dataset.lastValidValue || '0';
        }

        scoreElement.dataset.lastValidValue = scoreElement.textContent;
    }

    updateTeamName(nameElement) {
        const value = nameElement.textContent.trim();

        // Validar nombre de equipo
        if (value.length > 30) {
            nameElement.textContent = value.substring(0, 30);
        }
    }

    updateChampion(championElement) {
        const value = championElement.textContent.trim();

        if (value.length > 50) {
            championElement.textContent = value.substring(0, 50);
        }
    }

    validateInput(input) {
        const value = input.textContent.trim();
        const originalValue = input.dataset.originalValue;

        if (input.classList.contains('score')) {
            // Validar que sea un número válido
            if (value && !isNaN(value) && parseInt(value) >= 0) {
                input.textContent = value;
            } else if (value === '' || value === '-') {
                input.textContent = '-';
            } else {
                input.textContent = originalValue || '0';
            }
        }

        delete input.dataset.originalValue;
    }

    checkMatchWinner(match) {
        const teams = match.querySelectorAll('.team');
        let winner = null;
        let highestScore = -1;

        teams.forEach(team => {
            const scoreElement = team.querySelector('.score');
            const scoreText = scoreElement.textContent.trim();
            const score = scoreText === '-' ? 0 : parseInt(scoreText) || 0;

            if (score > highestScore) {
                highestScore = score;
                winner = team;
            }
        });

        // Si hay empate, no hay ganador
        const scores = Array.from(teams).map(team => {
            const scoreText = team.querySelector('.score').textContent.trim();
            return scoreText === '-' ? 0 : parseInt(scoreText) || 0;
        });

        const hasDraw = scores.length > 1 && scores[0] === scores[1] && scores[0] > 0;

        // Actualizar estilos de ganador
        teams.forEach(team => {
            if (team === winner && !hasDraw) {
                team.classList.add('winner');
            } else {
                team.classList.remove('winner');
            }
        });

        // Si hay ganador claro, avanzar según el bracket
        if (winner && !hasDraw && highestScore > 0) {
            this.advanceWinner(winner, match);
        }

        // Si es la final, actualizar campeón
        if (match.dataset.match === 'GF' && winner && !hasDraw) {
            this.updateChampionFromFinal(winner);
        }
    }

    selectWinner(team) {
        const match = team.closest('.match');
        const teams = match.querySelectorAll('.team');

        // Toggle selection
        const isWinner = team.classList.contains('winner');

        teams.forEach(t => {
            t.classList.remove('winner');
        });

        if (!isWinner) {
            team.classList.add('winner');
            this.advanceWinner(team, match);

            if (match.dataset.match === 'GF') {
                this.updateChampionFromFinal(team);
            }
        }
    }

    advanceWinner(winnerTeam, currentMatch) {
        const winnerName = winnerTeam.querySelector('.name').textContent.trim();
        const winnerSeed = winnerTeam.querySelector('.seed').textContent.trim();

        if (!winnerName || winnerName === '' || winnerName.includes('Winner') || winnerName.includes('Loser')) {
            return;
        }

        const currentMatchId = currentMatch.dataset.match;
        const bracket = this.getBracketFromMatch(currentMatch);

        if (bracket === 'winner') {
            this.advanceWinnerBracket(winnerTeam, currentMatchId);
        } else if (bracket === 'loser') {
            this.advanceLoserBracket(winnerTeam, currentMatchId);
        } else if (bracket === 'final') {
            this.advanceFinals(winnerTeam, currentMatchId);
        }
    }

    advanceWinnerBracket(winnerTeam, currentMatchId) {
        const winnerName = winnerTeam.querySelector('.name').textContent.trim();

        // Winner bracket advancement mapping
        const wbAdvancement = {
            // Round 1 -> Round 2
            'A1': 'B1', 'A2': 'B1',
            'A3': 'B2', 'A4': 'B2',
            'A5': 'B3', 'A6': 'B3',
            'A7': 'B4', 'A8': 'B4',

            // Round 2 -> Round 3
            'B1': 'C1', 'B2': 'C1',
            'B3': 'C2', 'B4': 'C2',

            // Round 3 -> WB Final
            'C1': 'F1', 'C2': 'F1',

            // WB Final -> Grand Final
            'F1': 'GF'
        };

        const nextMatchId = wbAdvancement[currentMatchId];
        if (nextMatchId) {
            this.updateNextMatch(nextMatchId, winnerName, 'W' + currentMatchId);

            // Losers from winner bracket go to loser bracket
            if (currentMatchId.startsWith('A')) {
                this.advanceToLoserBracket(currentMatchId, winnerTeam);
            } else if (currentMatchId.startsWith('B')) {
                this.advanceToLoserBracket(currentMatchId, winnerTeam);
            }
        }
    }

    advanceLoserBracket(winnerTeam, currentMatchId) {
        const winnerName = winnerTeam.querySelector('.name').textContent.trim();

        // Loser bracket advancement mapping
        const lbAdvancement = {
            // LB Round 1 -> LB Round 2
            'L1': 'L5', 'L2': 'L6', 'L3': 'L7', 'L4': 'L8',

            // LB Round 2 -> LB Round 3
            'L5': 'L9', 'L6': 'L9',
            'L7': 'L10', 'L8': 'L10',

            // LB Round 3 -> Grand Final
            'L9': 'GF', 'L10': 'GF'
        };

        const nextMatchId = lbAdvancement[currentMatchId];
        if (nextMatchId) {
            this.updateNextMatch(nextMatchId, winnerName, 'W' + currentMatchId);
        }
    }

    advanceToLoserBracket(winnerMatchId, winnerTeam) {
        // Get the loser from the current match
        const currentMatch = winnerTeam.closest('.match');
        const teams = currentMatch.querySelectorAll('.team');
        let loserTeam = null;

        teams.forEach(team => {
            if (team !== winnerTeam) {
                loserTeam = team;
            }
        });

        if (loserTeam) {
            const loserName = loserTeam.querySelector('.name').textContent.trim();
            if (loserName && !loserName.includes('Winner')) {
                // Map winner bracket losses to loser bracket
                const wbToLbMapping = {
                    'A1': 'L1', 'A2': 'L1',
                    'A3': 'L2', 'A4': 'L2',
                    'A5': 'L3', 'A6': 'L3',
                    'A7': 'L4', 'A8': 'L4',

                    'B1': 'L5', 'B2': 'L6',
                    'B3': 'L7', 'B4': 'L8',

                    'C1': 'L9', 'C2': 'L10'
                };

                const lbMatchId = wbToLbMapping[winnerMatchId];
                if (lbMatchId) {
                    this.updateNextMatch(lbMatchId, loserName, 'L' + winnerMatchId);
                }
            }
        }
    }

    advanceFinals(winnerTeam, currentMatchId) {
        if (currentMatchId === 'F1') {
            // WB Final winner goes to Grand Final
            const winnerName = winnerTeam.querySelector('.name').textContent.trim();
            if (winnerName) {
                this.updateNextMatch('GF', winnerName, 'W' + currentMatchId);
            }
        }
    }

    updateNextMatch(matchId, teamName, seed) {
        const nextMatch = document.querySelector(`[data-match="${matchId}"]`);
        if (!nextMatch) return;

        const teams = nextMatch.querySelectorAll('.team');

        // Find the first empty slot or update based on seed pattern
        let targetTeam = null;

        for (let team of teams) {
            const nameElement = team.querySelector('.name');
            const seedElement = team.querySelector('.seed');
            const scoreElement = team.querySelector('.score');

            if (nameElement.textContent.includes('Winner') ||
                nameElement.textContent.includes('Loser') ||
                nameElement.textContent.trim() === '') {
                targetTeam = team;
                break;
            }
        }

        if (targetTeam) {
            const nameElement = targetTeam.querySelector('.name');
            const seedElement = targetTeam.querySelector('.seed');
            const scoreElement = targetTeam.querySelector('.score');

            nameElement.textContent = teamName;
            seedElement.textContent = seed;

            if (scoreElement.textContent === '-') {
                scoreElement.textContent = '0';
            }
        }
    }

    updateChampionFromFinal(winnerTeam) {
        const winnerName = winnerTeam.querySelector('.name').textContent.trim();
        if (this.championName && winnerName) {
            this.championName.textContent = winnerName;
            this.showNotification(`¡${winnerName} es el CAMPEÓN! 🏆`);
        }
    }

    autoAdvanceTournament() {
        if (!confirm('¿Auto-avanzar torneo? Esto completará todos los partidos con resultados aleatorios.')) {
            return;
        }

        this.matchesData.forEach(matchData => {
            if (matchData.teams.length === 2) {
                const team1 = matchData.teams[0];
                const team2 = matchData.teams[1];

                // Solo generar resultados para partidos con equipos reales
                if (!this.isPlaceholderTeam(team1) && !this.isPlaceholderTeam(team2)) {

                    // Generar resultado aleatorio
                    const score1 = Math.floor(Math.random() * 3);
                    const score2 = Math.floor(Math.random() * 3);

                    // Asegurar que no haya empate
                    if (score1 === score2) {
                        team1.score.textContent = score1 + 1;
                        team2.score.textContent = score2;
                    } else {
                        team1.score.textContent = score1;
                        team2.score.textContent = score2;
                    }

                    this.checkMatchWinner(matchData.element);
                }
            }
        });

        this.showNotification('Torneo auto-avanzado 🎲');
    }

    isPlaceholderTeam(team) {
        const name = team.name.textContent.trim();
        const seed = team.seed.textContent.trim();

        return name.includes('Winner') ||
               name.includes('Loser') ||
               name === 'TBD' ||
               seed === 'TBD';
    }

    resetTournament() {
        // Resetear todos los scores
        document.querySelectorAll('.score').forEach(scoreElement => {
            scoreElement.textContent = '0';
        });

        // Resetear nombres de placeholder
        document.querySelectorAll('.name').forEach(nameElement => {
            if (nameElement.textContent.includes('Winner') ||
                nameElement.textContent.includes('Loser')) {
                // Mantener placeholders
            }
        });

        // Resetear campeón
        if (this.championName) {
            this.championName.textContent = 'TBD';
        }

        // Remover clases de ganador
        document.querySelectorAll('.team').forEach(team => {
            team.classList.remove('winner');
        });

        // Limpiar storage
        localStorage.removeItem('tournamentBracket');

        this.showNotification('Torneo reseteado exitosamente');
    }

    updateAllMatches() {
        this.matchesData.forEach(matchData => {
            this.checkMatchWinner(matchData.element);
        });
    }

    saveToStorage() {
        const tournamentData = {
            matches: [],
            champion: null,
            timestamp: new Date().toISOString()
        };

        // Guardar datos de todos los partidos
        document.querySelectorAll('.match').forEach(match => {
            const matchData = {
                matchId: match.dataset.match,
                teams: []
            };

            match.querySelectorAll('.team').forEach(team => {
                const nameElement = team.querySelector('.name');
                const scoreElement = team.querySelector('.score');
                const seedElement = team.querySelector('.seed');

                matchData.teams.push({
                    name: nameElement.textContent.trim(),
                    score: scoreElement.textContent.trim(),
                    seed: seedElement.textContent.trim(),
                    isWinner: team.classList.contains('winner')
                });
            });

            tournamentData.matches.push(matchData);
        });

        // Guardar campeón
        if (this.championName) {
            tournamentData.champion = this.championName.textContent.trim();
        }

        localStorage.setItem('tournamentBracket', JSON.stringify(tournamentData));
        this.showNotification('Torneo guardado exitosamente');
    }

    loadFromStorage() {
        const savedData = localStorage.getItem('tournamentBracket');

        if (savedData) {
            try {
                const tournamentData = JSON.parse(savedData);

                // Restaurar partidos
                tournamentData.matches.forEach(savedMatch => {
                    const match = document.querySelector(`[data-match="${savedMatch.matchId}"]`);
                    if (match) {
                        const teams = match.querySelectorAll('.team');

                        savedMatch.teams.forEach((savedTeam, index) => {
                            if (teams[index]) {
                                const nameElement = teams[index].querySelector('.name');
                                const scoreElement = teams[index].querySelector('.score');
                                const seedElement = teams[index].querySelector('.seed');

                                if (nameElement) nameElement.textContent = savedTeam.name;
                                if (scoreElement) scoreElement.textContent = savedTeam.score;
                                if (seedElement) seedElement.textContent = savedTeam.seed;

                                if (savedTeam.isWinner) {
                                    teams[index].classList.add('winner');
                                }
                            }
                        });
                    }
                });

                // Restaurar campeón
                if (tournamentData.champion && this.championName) {
                    this.championName.textContent = tournamentData.champion;
                }

                // Verificar ganadores y actualizar estilos
                this.updateAllMatches();

                this.showNotification('Torneo cargado exitosamente');
            } catch (error) {
                console.error('Error loading tournament data:', error);
            }
        }
    }

    showNotification(message) {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = 'tournament-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        `;

        document.body.appendChild(notification);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// CSS para animaciones adicionales
const additionalStyles = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;

// Agregar estilos adicionales
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Inicializar el torneo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.tournamentBracket = new TournamentBracket();
});

// Exportar para uso global
window.TournamentBracket = TournamentBracket;