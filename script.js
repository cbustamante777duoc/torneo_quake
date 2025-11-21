class LeagueStandings {
    constructor() {
        this.teams = [];
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadTeams();
        this.calculateStandings();
        this.loadFromStorage();
    }

    cacheElements() {
        this.container = document.querySelector('.tournament-container');
        this.table = document.querySelector('.standings-table');
        this.teamRows = document.querySelectorAll('.team-row');
    }

    bindEvents() {
        // Event listeners para elementos editables
        document.addEventListener('input', this.handleInput.bind(this));
        document.addEventListener('focus', this.handleFocus.bind(this), true);
        document.addEventListener('blur', this.handleBlur.bind(this), true);
        document.addEventListener('click', this.handleRowClick.bind(this));

        // Auto-save
        document.addEventListener('input', this.debounce(this.saveToStorage.bind(this), 500));

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));

        // Sort functionality
        document.addEventListener('click', this.handleSortClick.bind(this));
    }

    loadTeams() {
        this.teams = [];
        this.teamRows.forEach((row, index) => {
            const teamData = this.extractTeamData(row);
            teamData.originalIndex = index;
            teamData.element = row;
            this.teams.push(teamData);
        });
    }

    extractTeamData(row) {
        const teamName = row.querySelector('.team-name');
        const stats = {
            pj: parseInt(row.querySelector('.pj').textContent) || 0,
            pg: parseInt(row.querySelector('.pg').textContent) || 0,
            pe: parseInt(row.querySelector('.pe').textContent) || 0,
            pp: parseInt(row.querySelector('.pp').textContent) || 0,
            gf: parseInt(row.querySelector('.gf').textContent) || 0,
            gc: parseInt(row.querySelector('.gc').textContent) || 0
        };

        // Calcular puntos y diferencia de gol
        stats.pts = stats.pg * 3 + stats.pe;
        stats.dg = stats.gf - stats.gc;

        // Extraer forma
        const formElements = row.querySelectorAll('.form-result');
        stats.form = Array.from(formElements).map(el => ({
            element: el,
            result: el.textContent.trim()
        }));

        return {
            name: teamName,
            element: row,
            stats: stats,
            position: parseInt(row.querySelector('.position').textContent) || (index + 1)
        };
    }

    calculateStandings() {
        // Ordenar equipos por puntos, luego por diferencia de gol, luego por goles a favor
        this.teams.sort((a, b) => {
            if (b.stats.pts !== a.stats.pts) {
                return b.stats.pts - a.stats.pts;
            }
            if (b.stats.dg !== a.stats.dg) {
                return b.stats.dg - a.stats.dg;
            }
            if (b.stats.gf !== a.stats.gf) {
                return b.stats.gf - a.stats.gf;
            }
            return a.originalIndex - b.originalIndex; // Mantener orden original si todo es igual
        });

        // Actualizar posiciones y clases
        this.teams.forEach((team, index) => {
            team.position = index + 1;
            this.updateTeamRow(team, index);
        });

        // Actualizar clases de promoción y playoffs
        this.updatePlayoffPositions();
    }

    updateTeamRow(team, index) {
        const row = team.element;

        // Actualizar posición
        const positionElement = row.querySelector('.position');
        positionElement.textContent = team.position;

        // Actualizar estadísticas
        row.querySelector('.pj').textContent = team.stats.pj;
        row.querySelector('.pg').textContent = team.stats.pg;
        row.querySelector('.pe').textContent = team.stats.pe;
        row.querySelector('.pp').textContent = team.stats.pp;
        row.querySelector('.gf').textContent = team.stats.gf;
        row.querySelector('.gc').textContent = team.stats.gc;
        row.querySelector('.dg').textContent = team.stats.dg >= 0 ? `+${team.stats.dg}` : team.stats.dg;
        row.querySelector('.points').textContent = team.stats.pts;

        // Remover clases de posición anteriores
        row.classList.remove('promotion', 'playoff');
    }

    updatePlayoffPositions() {
        this.teams.forEach((team, index) => {
            const row = team.element;

            // Primeros 2 lugares - Promoción directa
            if (index < 2) {
                row.classList.add('promotion');
            }
            // Siguientes 2 lugares - Playoffs
            else if (index < 4) {
                row.classList.add('playoff');
            }
        });
    }

    updateTeamStats(teamElement) {
        const row = teamElement.closest('.team-row');
        if (!row) return;

        // Extraer estadísticas actuales
        const pj = parseInt(row.querySelector('.pj').textContent) || 0;
        const pg = parseInt(row.querySelector('.pg').textContent) || 0;
        const pe = parseInt(row.querySelector('.pe').textContent) || 0;
        const pp = parseInt(row.querySelector('.pp').textContent) || 0;
        const gf = parseInt(row.querySelector('.gf').textContent) || 0;
        const gc = parseInt(row.querySelector('.gc').textContent) || 0;

        // Calcular puntos y diferencia de gol
        const pts = pg * 3 + pe;
        const dg = gf - gc;

        // Actualizar valores calculados
        row.querySelector('.dg').textContent = dg >= 0 ? `+${dg}` : dg;
        row.querySelector('.points').textContent = pts;

        // Recalcular standings
        this.loadTeams();
        this.calculateStandings();
    }

    handleInput(event) {
        const target = event.target;

        if (target.classList.contains('team-name')) {
            this.updateTeamName(target);
        } else if (target.classList.contains('pj') ||
                   target.classList.contains('pg') ||
                   target.classList.contains('pe') ||
                   target.classList.contains('pp') ||
                   target.classList.contains('gf') ||
                   target.classList.contains('gc')) {
            this.updateStat(target);
        }
    }

    handleFocus(event) {
        const target = event.target;
        if (target.hasAttribute('contenteditable') || target.classList.contains('editable-stat')) {
            target.dataset.originalValue = target.textContent;
        }
    }

    handleBlur(event) {
        const target = event.target;
        if (target.hasAttribute('contenteditable') || target.classList.contains('editable-stat')) {
            this.validateInput(target);
        }
    }

    handleRowClick(event) {
        const formResult = event.target.closest('.form-result');
        if (formResult) {
            this.cycleFormResult(formResult);
        }
    }

    handleSortClick(event) {
        const header = event.target.closest('th');
        if (header && (header.classList.contains('col-pts') ||
                      header.classList.contains('col-dg') ||
                      header.classList.contains('col-gf'))) {
            this.sortByColumn(header);
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
            if (confirm('¿Estás seguro de que quieres resetear la tabla?')) {
                this.resetTable();
            }
        }

        // Ctrl/Cmd + N para añadir nuevo equipo
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
            event.preventDefault();
            this.addNewTeam();
        }
    }

    updateTeamName(nameElement) {
        const value = nameElement.textContent.trim();

        // Validar nombre de equipo
        if (value.length > 30) {
            nameElement.textContent = value.substring(0, 30);
        }
    }

    updateStat(statElement) {
        const value = statElement.textContent.trim();

        // Validar que sea un número
        if (value && !isNaN(value) && parseInt(value) >= 0) {
            statElement.textContent = value;
            this.updateTeamStats(statElement);
        } else if (value === '') {
            statElement.textContent = '0';
            this.updateTeamStats(statElement);
        } else {
            statElement.textContent = statElement.dataset.lastValidValue || '0';
        }

        statElement.dataset.lastValidValue = statElement.textContent;
    }

    cycleFormResult(formElement) {
        const results = ['G', 'E', 'P'];
        const currentResult = formElement.textContent.trim();
        const currentIndex = results.indexOf(currentResult);
        const nextIndex = (currentIndex + 1) % results.length;

        // Remover todas las clases de resultado
        formElement.classList.remove('win', 'draw', 'loss');

        // Establecer nuevo resultado
        const newResult = results[nextIndex];
        formElement.textContent = newResult;

        // Agregar clase correspondiente
        if (newResult === 'G') {
            formElement.classList.add('win');
        } else if (newResult === 'E') {
            formElement.classList.add('draw');
        } else if (newResult === 'P') {
            formElement.classList.add('loss');
        }
    }

    validateInput(input) {
        const value = input.textContent.trim();
        const originalValue = input.dataset.originalValue;

        if (input.classList.contains('pj') ||
            input.classList.contains('pg') ||
            input.classList.contains('pe') ||
            input.classList.contains('pp') ||
            input.classList.contains('gf') ||
            input.classList.contains('gc')) {

            // Validar que sea un número válido
            if (value && !isNaN(value) && parseInt(value) >= 0) {
                input.textContent = value;
            } else {
                input.textContent = originalValue || '0';
            }
        }

        delete input.dataset.originalValue;
    }

    sortByColumn(headerCell) {
        const columnClass = Array.from(headerCell.classList).find(cls => cls.startsWith('col-'));
        if (!columnClass) return;

        const column = columnClass.replace('col-', '');

        // Determinar orden de clasificación
        let sortKey;
        switch (column) {
            case 'pts': sortKey = 'pts'; break;
            case 'dg': sortKey = 'dg'; break;
            case 'gf': sortKey = 'gf'; break;
            default: return;
        }

        // Ordenar temporalmente para visualización
        const sortedTeams = [...this.teams].sort((a, b) => {
            if (b.stats[sortKey] !== a.stats[sortKey]) {
                return b.stats[sortKey] - a.stats[sortKey];
            }
            return b.stats.pts - a.stats.pts; // Desempate por puntos
        });

        // Aplicar orden temporal
        const tbody = this.table.querySelector('tbody');
        sortedTeams.forEach(team => {
            tbody.appendChild(team.element);
        });
    }

    addNewTeam() {
        const tbody = this.table.querySelector('tbody');
        const newRow = this.createTeamRow({
            name: 'Nuevo Equipo',
            stats: {
                pj: 0, pg: 0, pe: 0, pp: 0,
                gf: 0, gc: 0, pts: 0, dg: 0
            },
            form: ['P', 'P', 'P', 'P', 'P']
        });

        tbody.appendChild(newRow);
        this.loadTeams();
        this.calculateStandings();

        // Enfocar el nombre del nuevo equipo
        const nameElement = newRow.querySelector('.team-name');
        nameElement.focus();

        // Seleccionar todo el texto
        const range = document.createRange();
        range.selectNodeContents(nameElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    createTeamRow(teamData) {
        const template = document.querySelector('.team-row');
        const newRow = template.cloneNode(true);

        // Actualizar nombre
        newRow.querySelector('.team-name').textContent = teamData.name;

        // Actualizar logo (aleatorio)
        const logos = ['🔥', '⚡', '🎯', '🛡️', '🚀', '💎', '🌟', '🎮', '⚔️', '🏹'];
        newRow.querySelector('.team-logo').textContent = logos[Math.floor(Math.random() * logos.length)];

        // Actualizar estadísticas
        newRow.querySelector('.pj').textContent = teamData.stats.pj;
        newRow.querySelector('.pg').textContent = teamData.stats.pg;
        newRow.querySelector('.pe').textContent = teamData.stats.pe;
        newRow.querySelector('.pp').textContent = teamData.stats.pp;
        newRow.querySelector('.gf').textContent = teamData.stats.gf;
        newRow.querySelector('.gc').textContent = teamData.stats.gc;
        newRow.querySelector('.dg').textContent = teamData.stats.dg >= 0 ? `+${teamData.stats.dg}` : teamData.stats.dg;
        newRow.querySelector('.points').textContent = teamData.stats.pts;

        // Actualizar forma
        const formResults = newRow.querySelectorAll('.form-result');
        teamData.form.forEach((result, index) => {
            if (formResults[index]) {
                formResults[index].textContent = result;
                formResults[index].className = `form-result ${result === 'G' ? 'win' : result === 'E' ? 'draw' : 'loss'}`;
            }
        });

        // Remover clases de posición
        newRow.classList.remove('promotion', 'playoff');

        return newRow;
    }

    resetTable() {
        if (confirm('¿Estás seguro de que quieres resetear todas las estadísticas?')) {
            this.teamRows.forEach(row => {
                row.querySelector('.pj').textContent = '0';
                row.querySelector('.pg').textContent = '0';
                row.querySelector('.pe').textContent = '0';
                row.querySelector('.pp').textContent = '0';
                row.querySelector('.gf').textContent = '0';
                row.querySelector('.gc').textContent = '0';
                row.querySelector('.dg').textContent = '+0';
                row.querySelector('.points').textContent = '0';

                // Resetear forma
                const formResults = row.querySelectorAll('.form-result');
                formResults.forEach(result => {
                    result.textContent = 'P';
                    result.className = 'form-result loss';
                });
            });

            this.loadTeams();
            this.calculateStandings();
            localStorage.removeItem('leagueStandings');
            this.showNotification('Tabla reseteada exitosamente');
        }
    }

    saveToStorage() {
        const standingsData = {
            teams: [],
            timestamp: new Date().toISOString()
        };

        // Guardar datos de cada equipo
        this.teams.forEach(team => {
            const teamData = {
                name: team.name.textContent.trim(),
                stats: {
                    pj: parseInt(team.element.querySelector('.pj').textContent) || 0,
                    pg: parseInt(team.element.querySelector('.pg').textContent) || 0,
                    pe: parseInt(team.element.querySelector('.pe').textContent) || 0,
                    pp: parseInt(team.element.querySelector('.pp').textContent) || 0,
                    gf: parseInt(team.element.querySelector('.gf').textContent) || 0,
                    gc: parseInt(team.element.querySelector('.gc').textContent) || 0
                },
                form: Array.from(team.element.querySelectorAll('.form-result')).map(el => el.textContent.trim()),
                logo: team.element.querySelector('.team-logo').textContent
            };
            standingsData.teams.push(teamData);
        });

        localStorage.setItem('leagueStandings', JSON.stringify(standingsData));
        this.showNotification('Tabla guardada exitosamente');
    }

    loadFromStorage() {
        const savedData = localStorage.getItem('leagueStandings');

        if (savedData) {
            try {
                const standingsData = JSON.parse(savedData);

                // Cargar datos de equipos
                standingsData.teams.forEach((teamData, index) => {
                    if (this.teams[index]) {
                        const team = this.teams[index];

                        // Actualizar nombre
                        team.name.textContent = teamData.name;

                        // Actualizar logo
                        if (teamData.logo) {
                            team.element.querySelector('.team-logo').textContent = teamData.logo;
                        }

                        // Actualizar estadísticas
                        team.element.querySelector('.pj').textContent = teamData.stats.pj;
                        team.element.querySelector('.pg').textContent = teamData.stats.pg;
                        team.element.querySelector('.pe').textContent = teamData.stats.pe;
                        team.element.querySelector('.pp').textContent = teamData.stats.pp;
                        team.element.querySelector('.gf').textContent = teamData.stats.gf;
                        team.element.querySelector('.gc').textContent = teamData.stats.gc;

                        // Actualizar forma
                        const formResults = team.element.querySelectorAll('.form-result');
                        teamData.form.forEach((result, formIndex) => {
                            if (formResults[formIndex]) {
                                formResults[formIndex].textContent = result;
                                formResults[formIndex].className = `form-result ${result === 'G' ? 'win' : result === 'E' ? 'draw' : 'loss'}`;
                            }
                        });
                    }
                });

                // Recalcular standings
                this.loadTeams();
                this.calculateStandings();

                this.showNotification('Tabla cargada exitosamente');
            } catch (error) {
                console.error('Error loading standings data:', error);
            }
        }
    }

    showNotification(message) {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = 'league-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff6b6b, #ffd93d);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
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

// CSS para notificaciones
const notificationStyles = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;

// Agregar estilos de notificación al head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Inicializar la tabla cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.leagueStandings = new LeagueStandings();
});

// Exportar para uso global
window.LeagueStandings = LeagueStandings;