                // ====== Loop principal de simulacao ======
                function syncGameTimeFromCityTime() {
                    const monthIndex = Math.floor((cityTime % TICKS_PER_YEAR) / TICKS_PER_MONTH);
                    gameTime.monthIndex = monthIndex;
                    gameTime.month = monthIndex + 1;
                    gameTime.year = Math.floor(cityTime / TICKS_PER_YEAR) + 1900;
                }

                function updateGameTime() {
                    const previousMoney = gameState.money;
                    cityTime += 1;
                    gameState.cityTime = cityTime;
                    gameState.time = cityTime;

                    syncGameTimeFromCityTime();

                    if (cityTime % TICKS_PER_YEAR === 0) {
                        collectRevenueIfNeeded();
                        maybeShowMonthlySummary(previousMoney);
                        maybeShowLossAlert(previousMoney);
                    }
                    updateFinanceUI();
                }

                function simulationTick() {
                    // Aqui entram futuras atualizacoes: economia, populacao, eventos, etc.
                    updateGameTime();
                    const isShortCensus = cityTime % CENSUS_SHORT_TICKS === 0;
                    const isLongCensus = cityTime % CENSUS_LONG_TICKS === 0;
                    if (isShortCensus) {
                        updateZoneDynamics(cityTime, { short: true, long: isLongCensus });
                        maybeEmitCityAlerts();
                    }
                    if (isLongCensus) {
                        updatePopulation();
                        updateHappiness();
                    }
                }

                function setSimulationSpeed(ms) {
                    simulationSpeedMs = ms;
                    if (simulationTimer) {
                        clearInterval(simulationTimer);
                        simulationTimer = null;
                    }
                    if (ms > 0) {
                        simulationTimer = setInterval(simulationTick, ms);
                    }
                    updateSpeedUI();
                }

                function getSessionKey() {
                    return currentSaveId ? `${sessionSaveKey}_${currentSaveId}` : `${sessionSaveKey}_temp`;
                }

                function saveSession() {
                    const payload = {
                        data: gameState,
                        cityTime: cityTime,
                        time: gameTime,
                        camera: { x: camera.x, y: camera.y, zoom: camera.zoom },
                        savedAt: new Date().toISOString()
                    };
                    localStorage.setItem(getSessionKey(), JSON.stringify(payload));
                }

                function loadSession() {
                    const raw = localStorage.getItem(getSessionKey());
                    if (!raw) return false;
                    try {
                        const parsed = JSON.parse(raw);
                        const data = parsed && parsed.data ? parsed.data : parsed;
                        Object.assign(gameState, data);
                        if (!Array.isArray(gameState.buildings)) gameState.buildings = [];
                        if (!Array.isArray(gameState.roads)) gameState.roads = [];
                        if (!Array.isArray(gameState.avenues)) gameState.avenues = [];
                        if (!Array.isArray(gameState.wires)) gameState.wires = [];
                        ensureTaxState();
                        ensureDemandState();
                        ensureZonesForLoadedBuildings();
                        population = gameState.population;
                        calculateHousing();
                        calculateJobs();
                        money = gameState.money;
                        taxRate = gameState.taxes.rate;
                        if (parsed && parsed.time) {
                            gameTime = parsed.time;
                        }
                        if (parsed && typeof parsed.cityTime === 'number') {
                            cityTime = parsed.cityTime;
                        } else if (typeof gameState.cityTime === 'number') {
                            cityTime = gameState.cityTime;
                        }
                        syncGameTimeFromCityTime();
                        if (parsed && parsed.camera) {
                            camera.x = parsed.camera.x;
                            camera.y = parsed.camera.y;
                            camera.zoom = parsed.camera.zoom;
                        }
                        return true;
                    } catch (error) {
                        console.error(error);
                        return false;
                    }
                }

	                function updateSpeedUI() {
	                    const speedMap = [
	                        [btnSpeedPause, simulationSpeedMs === 0, 'PAUSADO'],
	                        [btnSpeedSlow, simulationSpeedMs === SIM_SPEED_SLOW_MS, 'LENTO'],
	                        [btnSpeedNormal, simulationSpeedMs === SIM_SPEED_NORMAL_MS, 'NORMAL'],
	                        [btnSpeedFast, simulationSpeedMs === SIM_SPEED_FAST_MS, 'RAPIDO']
	                    ];
                    speedMap.forEach(([button, isActive]) => {
                        if (!button) return;
                        button.classList.toggle('active', isActive);
                        button.classList.toggle('is-active', isActive);
                    });
                    const active = speedMap.find(([, isActive]) => isActive);
                    if (modeIndicatorText && active) {
                        modeIndicatorText.textContent = active[2];
                    }
                }

                // ====== Ajusta zoom mantendo o ponto sob o cursor ======
                function zoomAtCursor(mouseX, mouseY, factor) {
                    const rect = gameCanvas.getBoundingClientRect();
                    const localX = mouseX - rect.left;
                    const localY = mouseY - rect.top;

                    // Converte para coordenadas do mundo antes do zoom
                    const worldX = (localX - camera.x) / camera.zoom;
                    const worldY = (localY - camera.y) / camera.zoom;

                    const nextZoom = Math.min(zoomLimits.max, Math.max(zoomLimits.min, camera.zoom * factor));
                    camera.zoom = nextZoom;

                    // Reposiciona camera para manter o ponto do mundo sob o cursor
                    camera.x = localX - worldX * camera.zoom;
                    camera.y = localY - worldY * camera.zoom;
                    clampCameraToMap();
                    renderGameMap();
                }

                function clampCameraToMap() {
                    if (!currentMap || !gameCanvas) return;
                    const viewportWidth = gameCanvas.width / canvasScale;
                    const viewportHeight = gameCanvas.height / canvasScale;
                    const mapPixelWidth = currentMap.width * baseTileSize * camera.zoom;
                    const mapPixelHeight = currentMap.height * baseTileSize * camera.zoom;

                    if (mapPixelWidth <= viewportWidth) {
                        camera.x = Math.round((viewportWidth - mapPixelWidth) / 2);
                    } else {
                        camera.x = Math.min(0, Math.max(viewportWidth - mapPixelWidth, camera.x));
                    }

                    if (mapPixelHeight <= viewportHeight) {
                        camera.y = Math.round((viewportHeight - mapPixelHeight) / 2);
                    } else {
                        camera.y = Math.min(0, Math.max(viewportHeight - mapPixelHeight, camera.y));
                    }
                }

                // ====== Ajusta o canvas ao tamanho do viewport ======
                function resizeGameCanvas(options = {}) {
                    const { recenter = false } = options;
                    const rect = gameViewport.getBoundingClientRect();
                    const dpr = window.devicePixelRatio || 1;
                    canvasScale = dpr;
                    gameCanvas.width = Math.floor(rect.width * dpr);
                    gameCanvas.height = Math.floor(rect.height * dpr);
                    gameCanvas.style.width = `${rect.width}px`;
                    gameCanvas.style.height = `${rect.height}px`;

                    if (currentMap && recenter) {
                        const mapPixelWidth = currentMap.width * baseTileSize * camera.zoom;
                        const mapPixelHeight = currentMap.height * baseTileSize * camera.zoom;
                        camera.x = (gameCanvas.width / dpr - mapPixelWidth) / 2;
                        camera.y = (gameCanvas.height / dpr - mapPixelHeight) / 2;
                    }
                    clampCameraToMap();
                    if (currentMap) {
                        renderGameMap();
                    }
                }

                // ====== Cria um preview individual ======
                function createPreview(mapData, index) {
                    const card = document.createElement('div');
                    card.className = 'map-card';
                    card.setAttribute('role', 'button');
                    card.setAttribute('tabindex', '0');
                    card.dataset.index = index;

                    const canvas = document.createElement('canvas');
                    canvas.width = 160;
                    canvas.height = 90;
                    canvas.className = 'map-canvas';

                    renderPreviewMap(canvas, mapData);
                    card.appendChild(canvas);

                    card.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            selectMap(index);
                        }
                    });

                    return card;
                }

                // ====== Cria um preview de save ======
                function createSavePreview(entry, index) {
                    const card = document.createElement('div');
                    card.className = 'map-card';
                    card.setAttribute('role', 'button');
                    card.setAttribute('tabindex', '0');
                    card.dataset.index = index;

                    const header = document.createElement('div');
                    header.className = 'map-card-header';

                    const menu = document.createElement('div');
                    menu.className = 'map-menu';

                    const menuButton = document.createElement('button');
                    menuButton.className = 'map-menu-button';
                    menuButton.type = 'button';
                    menuButton.textContent = '?';
                    menuButton.setAttribute('aria-label', 'Opcoes do save');

                    const menuList = document.createElement('div');
                    menuList.className = 'map-menu-list';

                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'map-menu-item';
                    deleteBtn.type = 'button';
                    deleteBtn.textContent = 'Excluir save';

                    menuList.appendChild(deleteBtn);
                    menu.appendChild(menuButton);
                    menu.appendChild(menuList);
                    header.appendChild(menu);
                    card.appendChild(header);

                    const canvas = document.createElement('canvas');
                    canvas.width = 160;
                    canvas.height = 90;
                    canvas.className = 'map-canvas';

                    if (entry && entry.data && entry.data.map) {
                        renderPreviewMap(canvas, entry.data.map);
                    }

                    card.appendChild(canvas);

                    const meta = document.createElement('div');
                    meta.style.marginTop = '8px';
                    meta.style.color = 'var(--text-soft)';
                    meta.style.fontSize = '0.75rem';
                    meta.style.letterSpacing = '1px';
                    meta.textContent = entry && entry.name ? entry.name : 'Save';
                    card.appendChild(meta);

                    menuButton.addEventListener('click', (event) => {
                        event.stopPropagation();
                        menuList.classList.toggle('open');
                    });

                    deleteBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        deleteSave(index);
                    });

                    card.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            selectSave(index);
                        }
                    });

                    return card;
                }

                // ====== Gera a lista completa de mapas ======
                function generateMapList() {
                    mapGrid.innerHTML = '';
                    mapList = [];
                    selectedIndex = null;
                    btnStartGame.classList.remove('start-visible');
                    btnStartGame.classList.add('start-hidden');

                    for (let i = 0; i < 6; i++) {
                        const mapData = generateMap();
                        mapList.push(mapData);
                        const preview = createPreview(mapData, i);
                        mapGrid.appendChild(preview);
                    }
                }

                // ====== Lista de saves ======
                function getSaves() {
                    const savesRaw = localStorage.getItem('citybuilder_saves');
                    if (savesRaw) {
                        try {
                            const parsed = JSON.parse(savesRaw);
                            if (Array.isArray(parsed)) return parsed;
                        } catch (error) {
                            console.error(error);
                        }
                    }

                    // Compatibilidade com save antigo
                    const legacy = localStorage.getItem('citybuilder_save');
                    if (legacy) {
                        try {
                            const parsed = JSON.parse(legacy);
                            const data = parsed && parsed.data ? parsed.data : parsed;
                            return [{
                                id: 'legacy',
                                name: parsed && parsed.name ? parsed.name : 'Save antigo',
                                data
                            }];
                        } catch (error) {
                            console.error(error);
                        }
                    }
                    return [];
                }

                function saveSaves(list) {
                    localStorage.setItem('citybuilder_saves', JSON.stringify(list));
                }

                function findSaveById(list, id) {
                    return list.find((entry) => entry.id === id);
                }

                function getCityName(id) {
                    const list = getSaves();
                    const entry = findSaveById(list, id);
                    return entry && entry.name ? entry.name : 'Sem nome';
                }

                function generateSaveList() {
                    saveGrid.innerHTML = '';
                    saveList = getSaves();
                    selectedSaveIndex = null;
                    btnLoadSelected.classList.remove('start-visible');
                    btnLoadSelected.classList.add('start-hidden');

                    saveList.forEach((entry, index) => {
                        const preview = createSavePreview(entry, index);
                        saveGrid.appendChild(preview);
                    });
                }

                function deleteSave(index) {
                    if (index < 0 || index >= saveList.length) return;
                    const name = saveList[index] && saveList[index].name ? saveList[index].name : 'Save';
                    const confirmed = confirm(`Excluir o save "${name}"?`);
                    if (!confirmed) return;
                    saveList.splice(index, 1);
                    saveSaves(saveList);
                    generateSaveList();
                }

                // ====== Seleciona um mapa ======
                function selectMap(index) {
                    selectedIndex = index;
                    const cards = mapGrid.querySelectorAll('.map-card');
                    cards.forEach((card) => {
                        card.classList.toggle('selected', Number(card.dataset.index) === index);
                    });
                    btnStartGame.classList.remove('start-hidden');
                    btnStartGame.classList.add('start-visible');
                }

                function selectSave(index) {
                    selectedSaveIndex = index;
                    const cards = saveGrid.querySelectorAll('.map-card');
                    cards.forEach((card) => {
                        card.classList.toggle('selected', Number(card.dataset.index) === index);
                    });
                    btnLoadSelected.classList.remove('start-hidden');
                    btnLoadSelected.classList.add('start-visible');
                }

                // ====== Abre a tela de jogo com o mapa selecionado ======
                function openGameScreen(mapData) {
                    currentMap = mapData;
                    gameState.map = mapData;
                    if (!Array.isArray(gameState.buildings)) {
                        gameState.buildings = [];
                    }
                    if (!Array.isArray(gameState.roads)) {
                        gameState.roads = [];
                    }
                    if (!Array.isArray(gameState.avenues)) {
                        gameState.avenues = [];
                    }
                    if (!Array.isArray(gameState.wires)) {
                        gameState.wires = [];
                    }
                    if (typeof gameState.nextBuildingId !== 'number') {
                        gameState.nextBuildingId = 1;
                    }
                    if (typeof gameState.money !== 'number' || Number.isNaN(gameState.money)) {
                        gameState.money = 10000;
                    }
                    if (gameState.money === 0 && gameState.time === 0 && gameState.buildings.length === 0) {
                        gameState.money = 10000;
                    }
                    gameScreen.classList.add('open');
                    if (hudShell) {
                        hudShell.classList.remove('bottom-collapsed');
                    }
                    if (controlsPanel) {
                        controlsPanel.classList.add('controls-hidden');
                    }
                    gameScreen.setAttribute('aria-hidden', 'false');
                    resizeGameCanvas({ recenter: true });
                    setSidePanelView('analysis');
                    updateFinanceUI();
                    if (!simulationTimer) {
                        setSimulationSpeed(simulationSpeedMs);
                    }
                    saveSession();
                }

	                function closeGameScreen() {
	                    gameScreen.classList.remove('open');
	                    gameScreen.setAttribute('aria-hidden', 'true');
	                    setSpacePanCursor(false);
	                    resetTransientInteractionState();
	                    if (controlsPanel) {
	                        controlsPanel.classList.add('controls-hidden');
	                    }
	                    if (toolsPanel) {
	                        toolsPanel.classList.remove('open');
                        toolsPanel.setAttribute('aria-hidden', 'true');
                    }
	                    setSimulationSpeed(0);
	                }

                function returnToLobby() {
                    closeGameScreen();
                    updateMessage('Cidade pronta para ser criada');
                }

	                function resetGameStateForNewCity(mapData) {
	                    resetTransientInteractionState();
	                    gameState.map = mapData;
	                    gameState.buildings = [];
	                    gameState.roads = [];
	                    gameState.avenues = [];
	                    gameState.wires = [];
                    gameState.nextBuildingId = 1;
                    gameState.money = 10000;
                    gameState.population = 0;
                    gameState.time = 0;
                    gameState.cityTime = 0;
                    gameState.difficulty = 'medium';
                    gameState.demand = {
                        residential: 0,
                        commercial: 0,
                        industrial: 0,
                        population: 0
                    };
                    gameState.demandCaps = {
                        stadium: false,
                        seaport: false,
                        airport: false
                    };
                    gameState.taxes = {
                        rate: 7,
                        allocations: {
                            roads: 20,
                            hospitals: 20,
                            schools: 20,
                            services: 20,
                            leisure: 20
                        }
                    };
                    population = 0;
                    availableJobs = 0;
                    housingCapacity = 0;
                    money = gameState.money;
                    taxRate = gameState.taxes.rate;
	                    gameTime = { year: 1900, month: 1, monthIndex: 0 };
	                    cityTime = 0;
	                    gameState.cityTime = 0;
	                    // Reinicia camera para nao herdar o enquadramento da cidade anterior
	                    camera.x = 0;
	                    camera.y = 0;
	                    camera.zoom = 2.2;
	                    // Limpa o auto-resume para nao puxar cidade antiga
	                    localStorage.removeItem('citybuilder_save');
	                    localStorage.removeItem('citybuilder_active_save');
	                    // Limpa sessao temporaria para evitar reuso de estado antigo ao criar uma nova cidade sem save
	                    localStorage.removeItem(`${sessionSaveKey}_temp`);
	                    currentSaveId = null;
	                }

	                function resetTransientInteractionState() {
	                    isDragging = false;
	                    suppressNextViewportClick = false;
	                    dragDistance = 0;
	                    selectedBuildType = null;
	                    hoverBuildPos = null;
	                    hoverBuildValid = false;

	                    isDrawingRoad = false;
	                    isDrawingAvenue = false;
	                    isDrawingWire = false;
	                    lastRoadPos = null;
	                    lastAvenuePos = null;
	                    lastWirePos = null;

	                    isAreaSelecting = false;
	                    areaSelectionStart = null;
	                    areaSelectionEnd = null;
	                    areaSelectionRect = null;
	                    areaSelectionStats = null;

	                    demolitionRemaining = 0;
	                    if (demolitionTimerId) {
	                        clearInterval(demolitionTimerId);
	                        demolitionTimerId = null;
	                    }
	                    updateDemolitionTimerUI();
	                }

                // ====== Abrir e fechar a tela de mapas ======
                function openMapScreen() {
                    mapScreen.classList.add('open');
                    mapScreen.setAttribute('aria-hidden', 'false');
                    generateMapList();
                }

                function closeMapScreen() {
                    mapScreen.classList.remove('open');
                    mapScreen.setAttribute('aria-hidden', 'true');
                }

                function openLoadScreen() {
                    loadScreen.classList.add('open');
                    loadScreen.setAttribute('aria-hidden', 'false');
                    generateSaveList();
                }

                function closeLoadScreen() {
                    loadScreen.classList.remove('open');
                    loadScreen.setAttribute('aria-hidden', 'true');
                }

                // ====== Eventos do lobby ======
                btnNew.addEventListener('click', function() {
                    updateMessage('Preparando nova cidade...');
                    openMapScreen();
                });

                btnLoad.addEventListener('click', function() {
                    updateMessage('Abrir seletor de saves...');
                    openLoadScreen();
                });

                btnConfig.addEventListener('click', function() {
                    updateMessage('Ajustes do simulador');
                });

                // ====== Sistema de salvamento ======
                function persistSaveEntry(name) {
                    const payload = {
                        id: currentSaveId || `${Date.now()}`,
                        name,
                        data: gameState,
                        cityTime: cityTime,
                        time: gameTime,
                        savedAt: new Date().toISOString()
                    };
                    const list = getSaves();
                    let existingIndex = -1;
                    if (currentSaveId) {
                        existingIndex = list.findIndex((entry) => entry.id === currentSaveId);
                    }
                    if (existingIndex < 0) {
                        existingIndex = list.findIndex((entry) => entry.name === name);
                    }
                    if (existingIndex >= 0) {
                        list[existingIndex] = payload;
                    } else {
                        list.push(payload);
                    }
                    saveSaves(list);
                    localStorage.setItem('citybuilder_save', JSON.stringify(payload));
                    localStorage.setItem('citybuilder_active_save', payload.id);
                    currentSaveId = payload.id;
                    return payload;
                }

                function saveGame() {
                    const name = (saveNameInput.value || '').trim();
                    if (!name) {
                        saveFeedback.innerText = 'Informe um nome para o save';
                        return;
                    }

                    try {
                        persistSaveEntry(name);
                        saveFeedback.innerText = 'Jogo salvo';
                        showToast('Jogo salvo');
                        closeSaveModal();
                    } catch (error) {
                        console.error(error);
                        saveFeedback.innerText = 'Falha ao salvar';
                        showToast('Falha ao salvar');
                    }
                }

                function loadGame() {
                    const save = localStorage.getItem('citybuilder_save');
                    if (!save) {
                        console.log('Nenhum save encontrado');
                        return;
                    }
                    const parsed = JSON.parse(save);
                    const data = parsed && parsed.data ? parsed.data : parsed;
                    Object.assign(gameState, data);
                    if (typeof gameState.money !== 'number' || Number.isNaN(gameState.money)) {
                        gameState.money = 10000;
                    }
                    if (gameState.money === 0 && gameState.time === 0 && (!gameState.buildings || gameState.buildings.length === 0)) {
                        gameState.money = 10000;
                    }
                    if (!Array.isArray(gameState.buildings)) {
                        gameState.buildings = [];
                    }
                    if (!Array.isArray(gameState.roads)) {
                        gameState.roads = [];
                    }
                    if (!Array.isArray(gameState.avenues)) {
                        gameState.avenues = [];
                    }
                    if (!Array.isArray(gameState.wires)) {
                        gameState.wires = [];
                    }
                    ensureTaxState();
                    ensureDemandState();
                    ensureZonesForLoadedBuildings();
                    population = gameState.population;
                    calculateHousing();
                    calculateJobs();
                    money = gameState.money;
                    taxRate = gameState.taxes.rate;
                    if (parsed && parsed.time) {
                        gameTime = parsed.time;
                    } else if (!gameTime || typeof gameTime !== 'object') {
                        gameTime = { year: 1900, month: 1, monthIndex: 0 };
                    }
                    if (parsed && typeof parsed.cityTime === 'number') {
                        cityTime = parsed.cityTime;
                    } else if (typeof gameState.cityTime === 'number') {
                        cityTime = gameState.cityTime;
                    }
                    syncGameTimeFromCityTime();
                    if (parsed && parsed.id) {
                        currentSaveId = parsed.id;
                        localStorage.setItem('citybuilder_active_save', parsed.id);
                    }
                    renderMap();
                    updateFinanceUI();
                }

                function resumeLastSession() {
                    if (!settings.resumeLastCity) return;
                    const activeId = localStorage.getItem('citybuilder_active_save');
                    if (activeId) {
                        currentSaveId = activeId;
                    }
                    const sessionOk = loadSession();
                    if (sessionOk && gameState.map && gameState.map.tiles) {
                        openGameScreen(gameState.map);
                        updateFinanceUI();
                        return;
                    }
                    if (!activeId) return;
                    try {
                        const list = getSaves();
                        const entry = findSaveById(list, activeId);
                        if (!entry || !entry.data) return;
                        Object.assign(gameState, entry.data);
                        if (!Array.isArray(gameState.buildings)) {
                            gameState.buildings = [];
                        }
                        if (!Array.isArray(gameState.roads)) {
                            gameState.roads = [];
                        }
                        if (!Array.isArray(gameState.avenues)) {
                            gameState.avenues = [];
                        }
                        if (!Array.isArray(gameState.wires)) {
                            gameState.wires = [];
                        }
                        if (typeof gameState.nextBuildingId !== 'number') {
                            gameState.nextBuildingId = 1;
                        }
                        ensureZonesForLoadedBuildings();
                        if (entry.time) {
                            gameTime = entry.time;
                        }
                        if (typeof entry.cityTime === 'number') {
                            cityTime = entry.cityTime;
                        } else if (typeof gameState.cityTime === 'number') {
                            cityTime = gameState.cityTime;
                        }
                        syncGameTimeFromCityTime();
                        currentSaveId = entry.id;
                        localStorage.setItem('citybuilder_save', JSON.stringify(entry));
                        if (gameState.map && gameState.map.tiles) {
                            openGameScreen(gameState.map);
                        }
                        updateFinanceUI();
                    } catch (error) {
                        console.error(error);
                    }
                }

                // ====== Exportar save (opcional) ======
                function exportSave() {
                    const payload = JSON.stringify(gameState, null, 2);
                    const blob = new Blob([payload], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'citybuilder_save.json';
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    URL.revokeObjectURL(url);
                }

                // ====== Eventos da tela de mapas ======
                btnGenerateMaps.addEventListener('click', generateMapList);

                // Clique em qualquer parte do card seleciona o mapa
                mapGrid.addEventListener('click', (event) => {
                    const card = event.target.closest('.map-card');
                    if (!card) return;
                    selectMap(Number(card.dataset.index));
                });

                btnStartGame.addEventListener('click', function() {
                    if (selectedIndex !== null) {
                        updateMessage('Mapa selecionado. Iniciando jogo...');
                        closeMapScreen();
                        resetGameStateForNewCity(mapList[selectedIndex]);
                        openGameScreen(mapList[selectedIndex]);
                        saveSession();
                    }
                });

                btnCloseMapScreen.addEventListener('click', closeMapScreen);

                // ====== Eventos da tela de load ======
                btnRefreshSaves.addEventListener('click', generateSaveList);

                saveGrid.addEventListener('click', (event) => {
                    const card = event.target.closest('.map-card');
                    if (!card) return;
                    selectSave(Number(card.dataset.index));
                });

                btnLoadSelected.addEventListener('click', () => {
                    if (selectedSaveIndex === null) return;
                    const entry = saveList[selectedSaveIndex];
                    if (!entry || !entry.data) return;
                    Object.assign(gameState, entry.data);
                    localStorage.setItem('citybuilder_save', JSON.stringify(entry));
                    localStorage.setItem('citybuilder_active_save', entry.id);
                    currentSaveId = entry.id;
                    closeLoadScreen();
                    openGameScreen(gameState.map);
                    saveSession();
                });

                btnCloseLoadScreen.addEventListener('click', closeLoadScreen);

                function setSpacePanCursor(active) {
                    document.body.classList.toggle('is-space-pan', active);
                }

                // ====== Controles de arrastar com barra de espaco ======
                window.addEventListener('keydown', (event) => {
                    if (event.code === 'Space' && gameScreen.classList.contains('open')) {
                        isSpaceDown = true;
                        setSpacePanCursor(true);
                        gameViewport.classList.add('panning');
                        event.preventDefault();
                    }
                    if (event.code === 'AltLeft' || event.code === 'AltRight') {
                        if (gameScreen.classList.contains('open')) {
                            event.preventDefault();
                        }
                    }
                });

                window.addEventListener('keyup', (event) => {
                    if (event.code === 'Space') {
                        isSpaceDown = false;
                        isDragging = false;
                        setSpacePanCursor(false);
                        gameViewport.classList.remove('panning');
                    }
                    if (event.code === 'AltLeft' || event.code === 'AltRight') {
                        if (gameScreen.classList.contains('open')) {
                            event.preventDefault();
                        }
                    }
                });

                gameViewport.addEventListener('mousedown', (event) => {
                    if (!canPanWithMouse(event)) return;
                    isDragging = true;
                    dragDistance = 0;
                    suppressNextViewportClick = false;
                    lastMouse = { x: event.clientX, y: event.clientY };
                    gameViewport.classList.add('panning');
                    event.preventDefault();
                });

                gameViewport.addEventListener('mousedown', (event) => {
                    if (event.button !== 0) return;
                    if (isDragging) return;
                    if (selectedBuildType !== 'area_select') return;
                    if (!currentMap) return;
                    isAreaSelecting = true;
                    const tile = getTileFromEvent(event);
                    areaSelectionStart = tile;
                    areaSelectionEnd = tile;
                    areaSelectionRect = normalizeSelectionRect(areaSelectionStart, areaSelectionEnd);
                    renderGameMap();
                });

                gameViewport.addEventListener('mousedown', (event) => {
                    if (event.button !== 0) return;
                    if (isDragging) return;
                    if (selectedBuildType !== 'road') return;
                    if (!hoverBuildPos) return;
                    isDrawingRoad = true;
                    const dir = getRoadDir(lastRoadPos, hoverBuildPos);
                    if (placeRoadAt(hoverBuildPos.x, hoverBuildPos.y, dir)) {
                        updateFinanceUI();
                        renderGameMap();
                        saveSession();
                    }
                    if (lastRoadPos) {
                        updatePreviousRoadDir(lastRoadPos, hoverBuildPos);
                    }
                    lastRoadPos = { x: hoverBuildPos.x, y: hoverBuildPos.y };
                });

                gameViewport.addEventListener('mousedown', (event) => {
                    if (event.button !== 0) return;
                    if (isDragging) return;
                    if (selectedBuildType !== 'avenue') return;
                    if (!hoverBuildPos) return;
                    isDrawingAvenue = true;
                    const dir = hoverBuildPos.dir || getRoadDir(lastAvenuePos, hoverBuildPos);
                    if (placeAvenueAt(hoverBuildPos.x, hoverBuildPos.y, dir)) {
                        updateFinanceUI();
                        renderGameMap();
                        saveSession();
                    }
                    if (lastAvenuePos) {
                        updatePreviousAvenueDir(lastAvenuePos, hoverBuildPos);
                    }
                    lastAvenuePos = { x: hoverBuildPos.x, y: hoverBuildPos.y };
                });

                gameViewport.addEventListener('mousedown', (event) => {
                    if (event.button !== 0) return;
                    if (isDragging) return;
                    if (selectedBuildType !== 'wire') return;
                    if (!hoverBuildPos) return;
                    isDrawingWire = true;
                    const dir = getRoadDir(lastWirePos, hoverBuildPos);
                    if (placeWireAt(hoverBuildPos.x, hoverBuildPos.y, dir)) {
                        updateFinanceUI();
                        renderGameMap();
                        saveSession();
                    }
                    if (lastWirePos) {
                        updatePreviousWireDir(lastWirePos, hoverBuildPos);
                    }
                    lastWirePos = { x: hoverBuildPos.x, y: hoverBuildPos.y };
                });

                gameViewport.addEventListener('contextmenu', (event) => {
                    if (shouldUseRightDragPan()) {
                        event.preventDefault();
                    }
                });

                // ====== Preview e colocacao de construcoes ======
                function canPlaceBuilding(x, y, size) {
                    if (selectedBuildType !== 'bulldozer') {
                        const cost = getBuildCost(selectedBuildType);
                        if (gameState.money < cost) return false;
                    }
                    for (let oy = 0; oy < size; oy++) {
                        for (let ox = 0; ox < size; ox++) {
                            if (isWaterTile(x + ox, y + oy)) return false;
                            if (isForestTile(x + ox, y + oy)) return false;
                            if (roadExistsAt(x + ox, y + oy)) return false;
                            if (avenueExistsAt(x + ox, y + oy)) return false;
                        }
                    }
                    return !gameState.buildings.some((b) => {
                        const bSize = b.size || defaultBuildSize;
                        const overlapX = x < b.x + bSize && x + size > b.x;
                        const overlapY = y < b.y + bSize && y + size > b.y;
                        return overlapX && overlapY;
                    });
                }

                function roadExistsAt(x, y) {
                    return gameState.roads.some((r) => r.x === x && r.y === y);
                }

                function avenueExistsAt(x, y) {
                    if (!Array.isArray(gameState.avenues)) return false;
                    return gameState.avenues.some((a) => {
                        if (a.dir === 'h') {
                            return a.y === y && (a.x === x || a.x + 1 === x);
                        }
                        return a.x === x && (a.y === y || a.y + 1 === y);
                    });
                }

                function wireExistsAt(x, y) {
                    return gameState.wires.some((w) => w.x === x && w.y === y);
                }

                function canPlaceRoad(x, y) {
                    if (gameState.money < getBuildCost('road')) return false;
                    if (roadExistsAt(x, y)) return false;
                    if (avenueExistsAt(x, y)) return false;
                    if (isForestTile(x, y)) return false;
                    const overlap = gameState.buildings.some((b) => {
                        const bSize = b.size || defaultBuildSize;
                        return x >= b.x && x < b.x + bSize && y >= b.y && y < b.y + bSize;
                    });
                    return !overlap;
                }

                function getAvenueFootprint(dir) {
                    return dir === 'v' ? { w: 1, h: 2 } : { w: 2, h: 1 };
                }

                function canPlaceAvenue(x, y, dir) {
                    if (gameState.money < getBuildCost('avenue')) return false;
                    const { w, h } = getAvenueFootprint(dir);
                    for (let oy = 0; oy < h; oy++) {
                        for (let ox = 0; ox < w; ox++) {
                            const tx = x + ox;
                            const ty = y + oy;
                            if (isWaterTile(tx, ty)) return false;
                            if (isForestTile(tx, ty)) return false;
                            if (roadExistsAt(tx, ty)) return false;
                            if (avenueExistsAt(tx, ty)) return false;
                        }
                    }
                    const overlap = gameState.buildings.some((b) => {
                        const bSize = b.size || defaultBuildSize;
                        const overlapX = x < b.x + bSize && x + w > b.x;
                        const overlapY = y < b.y + bSize && y + h > b.y;
                        return overlapX && overlapY;
                    });
                    return !overlap;
                }

                function canPlaceWire(x, y) {
                    if (gameState.money < getBuildCost('wire')) return false;
                    if (wireExistsAt(x, y)) return false;
                    if (isWaterTile(x, y)) return false;
                    if (isForestTile(x, y)) return false;
                    const overlap = gameState.buildings.some((b) => {
                        const bSize = b.size || defaultBuildSize;
                        return x >= b.x && x < b.x + bSize && y >= b.y && y < b.y + bSize;
                    });
                    return !overlap;
                }

                function isWaterTile(x, y) {
                    if (!currentMap || !currentMap.tiles) return false;
                    const index = y * currentMap.width + x;
                    return currentMap.tiles[index] === 'water';
                }

                function isForestTile(x, y) {
                    if (!currentMap || !currentMap.tiles) return false;
                    const index = y * currentMap.width + x;
                    return currentMap.tiles[index] === 'forest';
                }

                function setTile(x, y, type) {
                    if (!currentMap || !currentMap.tiles) return;
                    const index = y * currentMap.width + x;
                    currentMap.tiles[index] = type;
                    if (gameState.map && gameState.map.tiles) {
                        gameState.map.tiles[index] = type;
                    }
                }

                function getTileFromEvent(event) {
                    const rect = gameViewport.getBoundingClientRect();
                    const localX = event.clientX - rect.left;
                    const localY = event.clientY - rect.top;
                    const worldX = (localX - camera.x) / camera.zoom;
                    const worldY = (localY - camera.y) / camera.zoom;
                    const tileX = Math.floor(worldX / baseTileSize);
                    const tileY = Math.floor(worldY / baseTileSize);
                    return { x: tileX, y: tileY };
                }

                function normalizeSelectionRect(start, end) {
                    let minX = Math.min(start.x, end.x);
                    let minY = Math.min(start.y, end.y);
                    let maxX = Math.max(start.x, end.x);
                    let maxY = Math.max(start.y, end.y);
                    if (currentMap) {
                        minX = Math.max(0, minX);
                        minY = Math.max(0, minY);
                        maxX = Math.min(currentMap.width - 1, maxX);
                        maxY = Math.min(currentMap.height - 1, maxY);
                    }
                    return { minX, minY, maxX, maxY };
                }

                function computeAreaSelection(rect) {
                    const buildingIds = new Set();
                    let roadCount = 0;
                    let avenueCount = 0;
                    let wireCount = 0;
                    let forestCount = 0;
                    for (let y = rect.minY; y <= rect.maxY; y++) {
                        for (let x = rect.minX; x <= rect.maxX; x++) {
                            if (roadExistsAt(x, y)) roadCount += 1;
                            if (avenueExistsAt(x, y)) avenueCount += 1;
                            if (wireExistsAt(x, y)) wireCount += 1;
                            if (isForestTile(x, y)) forestCount += 1;
                            const bIndex = findBuildingAt(x, y);
                            if (bIndex >= 0) {
                                const b = gameState.buildings[bIndex];
                                if (b && typeof b.id !== 'undefined') {
                                    buildingIds.add(b.id);
                                }
                            }
                        }
                    }
                    let buildingTileCount = 0;
                    buildingIds.forEach((id) => {
                        const b = gameState.buildings.find((item) => item.id === id);
                        if (!b) return;
                        const size = b.size || defaultBuildSize;
                        buildingTileCount += size * size;
                    });
                    const totalTiles = roadCount + avenueCount + wireCount + forestCount + buildingTileCount;
                    const cost = totalTiles * getBuildCost('bulldozer');
                    const timeSeconds = Math.max(1, Math.ceil(totalTiles * 0.2));
                    return {
                        rect,
                        buildingIds,
                        roadCount,
                        avenueCount,
                        wireCount,
                        forestCount,
                        buildingTileCount,
                        totalTiles,
                        cost,
                        timeSeconds
                    };
                }

                function openAreaModal(stats) {
                    areaSelectionStats = stats;
                    areaTargetsValue.textContent = stats.totalTiles.toLocaleString('pt-BR');
                    areaCostValue.textContent = `$ ${Math.round(stats.cost).toLocaleString('pt-BR')}`;
                    areaTimeValue.textContent = `${stats.timeSeconds}s`;
                    areaModal.classList.add('open');
                    areaModal.setAttribute('aria-hidden', 'false');
                }

                function closeAreaModal() {
                    areaModal.classList.remove('open');
                    areaModal.setAttribute('aria-hidden', 'true');
                }

                function updateDemolitionTimerUI() {
                    if (!demolitionTimer || !demolitionTimeValue) return;
                    if (demolitionRemaining > 0) {
                        demolitionTimeValue.textContent = `${demolitionRemaining}s`;
                        demolitionTimer.classList.add('show');
                        demolitionTimer.setAttribute('aria-hidden', 'false');
                    } else {
                        demolitionTimer.classList.remove('show');
                        demolitionTimer.setAttribute('aria-hidden', 'true');
                    }
                }

                function startDemolitionTimer(stats) {
                    demolitionRemaining = stats.timeSeconds;
                    updateDemolitionTimerUI();
                    if (demolitionTimerId) clearInterval(demolitionTimerId);
                    demolitionTimerId = setInterval(() => {
                        demolitionRemaining -= 1;
                        if (demolitionRemaining <= 0) {
                            clearInterval(demolitionTimerId);
                            demolitionTimerId = null;
                            demolitionRemaining = 0;
                            applyAreaDestruction(stats);
                            updateFinanceUI();
                            renderGameMap();
                            saveSession();
                            updateDemolitionTimerUI();
                            return;
                        }
                        updateDemolitionTimerUI();
                    }, 1000);
                }

                function applyAreaDestruction(stats) {
                    const rect = stats.rect;
                    if (stats.buildingIds && stats.buildingIds.size) {
                        gameState.buildings = gameState.buildings.filter((b) => !stats.buildingIds.has(b.id));
                    }
                    if (Array.isArray(gameState.roads)) {
                        gameState.roads = gameState.roads.filter((r) => r.x < rect.minX || r.x > rect.maxX || r.y < rect.minY || r.y > rect.maxY);
                    }
                    if (Array.isArray(gameState.avenues)) {
                        gameState.avenues = gameState.avenues.filter((a) => {
                            const tiles = a.dir === 'h'
                                ? [{ x: a.x, y: a.y }, { x: a.x + 1, y: a.y }]
                                : [{ x: a.x, y: a.y }, { x: a.x, y: a.y + 1 }];
                            return tiles.every((t) => t.x < rect.minX || t.x > rect.maxX || t.y < rect.minY || t.y > rect.maxY);
                        });
                    }
                    if (Array.isArray(gameState.wires)) {
                        gameState.wires = gameState.wires.filter((w) => w.x < rect.minX || w.x > rect.maxX || w.y < rect.minY || w.y > rect.maxY);
                    }
                    for (let y = rect.minY; y <= rect.maxY; y++) {
                        for (let x = rect.minX; x <= rect.maxX; x++) {
                            if (isForestTile(x, y)) {
                                setTile(x, y, 'land');
                            }
                        }
                    }
                }

                function findBuildingAt(x, y) {
                    return gameState.buildings.findIndex((b) => {
                        const bSize = b.size || defaultBuildSize;
                        return x >= b.x && x < b.x + bSize && y >= b.y && y < b.y + bSize;
                    });
                }

                function getRoadDir(from, to) {
                    if (!from || !to) return 'v';
                    const dx = Math.abs(to.x - from.x);
                    const dy = Math.abs(to.y - from.y);
                    return dx >= dy ? 'h' : 'v';
                }

                function updatePreviousAvenueDir(prev, next) {
                    if (!prev || !next) return;
                    const dir = getRoadDir(prev, next);
                    const idx = gameState.avenues.findIndex((a) => a.x === prev.x && a.y === prev.y);
                    if (idx >= 0) {
                        gameState.avenues[idx].dir = dir;
                    }
                }

                function placeRoadAt(x, y, dir) {
                    if (!canPlaceRoad(x, y)) return false;
                    const existingIndex = gameState.roads.findIndex((r) => r.x === x && r.y === y);
                    const isBridge = isWaterTile(x, y);
                    if (existingIndex >= 0) {
                        gameState.roads[existingIndex].dir = dir || gameState.roads[existingIndex].dir || 'v';
                        gameState.roads[existingIndex].isBridge = isBridge;
                        return true;
                    }
                    gameState.roads.push({ x, y, dir: dir || 'v', isBridge });
                    gameState.money = Math.max(0, gameState.money - getBuildCost('road'));
                    return true;
                }

                function placeAvenueAt(x, y, dir) {
                    const direction = dir || 'h';
                    if (!canPlaceAvenue(x, y, direction)) return false;
                    const existingIndex = gameState.avenues.findIndex((a) => a.x === x && a.y === y);
                    if (existingIndex >= 0) {
                        gameState.avenues[existingIndex].dir = direction;
                        return true;
                    }
                    gameState.avenues.push({ x, y, dir: direction });
                    gameState.money = Math.max(0, gameState.money - getBuildCost('avenue'));
                    return true;
                }

                function placeWireAt(x, y, dir) {
                    if (!canPlaceWire(x, y)) return false;
                    const existingIndex = gameState.wires.findIndex((w) => w.x === x && w.y === y);
                    if (existingIndex >= 0) {
                        gameState.wires[existingIndex].dir = dir || gameState.wires[existingIndex].dir || 'h';
                        return true;
                    }
                    gameState.wires.push({ x, y, dir: dir || 'h' });
                    gameState.money = Math.max(0, gameState.money - getBuildCost('wire'));
                    return true;
                }

                function updatePreviousRoadDir(prev, next) {
                    if (!prev || !next) return;
                    const dx = Math.abs(next.x - prev.x);
                    const dy = Math.abs(next.y - prev.y);
                    const dir = dx >= dy ? 'h' : 'v';
                    const idx = gameState.roads.findIndex((r) => r.x === prev.x && r.y === prev.y);
                    if (idx >= 0) {
                        gameState.roads[idx].dir = dir;
                    }
                }

                function updatePreviousWireDir(prev, next) {
                    if (!prev || !next) return;
                    const dx = Math.abs(next.x - prev.x);
                    const dy = Math.abs(next.y - prev.y);
                    const dir = dx >= dy ? 'h' : 'v';
                    const idx = gameState.wires.findIndex((w) => w.x === prev.x && w.y === prev.y);
                    if (idx >= 0) {
                        gameState.wires[idx].dir = dir;
                    }
                }

                function updateHoverBuild(event) {
                    if (!selectedBuildType || !currentMap) {
                        if (hoverBuildPos) {
                            hoverBuildPos = null;
                            hoverBuildValid = false;
                            renderGameMap();
                        }
                        return;
                    }
                    if (selectedBuildType === 'area_select') {
                        if (hoverBuildPos) {
                            hoverBuildPos = null;
                            hoverBuildValid = false;
                            renderGameMap();
                        }
                        return;
                    }

                    const rect = gameViewport.getBoundingClientRect();
                    const localX = event.clientX - rect.left;
                    const localY = event.clientY - rect.top;
                    const worldX = (localX - camera.x) / camera.zoom;
                    const worldY = (localY - camera.y) / camera.zoom;
                    const tileX = Math.floor(worldX / baseTileSize);
                    const tileY = Math.floor(worldY / baseTileSize);
                    const previousHover = lastHoverTile;
                    lastHoverTile = { x: tileX, y: tileY };

                    if (selectedBuildType === 'avenue') {
                        const dirSource = lastAvenuePos || previousHover;
                        const dir = getRoadDir(dirSource, { x: tileX, y: tileY });
                        const { w, h } = getAvenueFootprint(dir);
                        const topLeftX = tileX;
                        const topLeftY = tileY;
                        if (topLeftX < 0 || topLeftY < 0 || topLeftX + w > currentMap.width || topLeftY + h > currentMap.height) {
                            if (hoverBuildPos) {
                                hoverBuildPos = null;
                                hoverBuildValid = false;
                                renderGameMap();
                            }
                            return;
                        }
                        const nextValid = canPlaceAvenue(topLeftX, topLeftY, dir);
                        if (!hoverBuildPos || hoverBuildPos.x !== topLeftX || hoverBuildPos.y !== topLeftY || hoverBuildValid !== nextValid) {
                            hoverBuildPos = { x: topLeftX, y: topLeftY, dir };
                            hoverBuildValid = nextValid;
                            renderGameMap();
                        }
                        return;
                    }

                    const size = getBuildSize(selectedBuildType);
                    const centerOffset = Math.floor(size / 2);
                    const topLeftX = tileX - centerOffset;
                    const topLeftY = tileY - centerOffset;

                    if (topLeftX < 0 || topLeftY < 0 || topLeftX + size > currentMap.width || topLeftY + size > currentMap.height) {
                        if (hoverBuildPos) {
                            hoverBuildPos = null;
                            hoverBuildValid = false;
                            renderGameMap();
                        }
                        return;
                    }

                    let nextValid = canPlaceBuilding(topLeftX, topLeftY, size);
                    if (selectedBuildType === 'road') {
                        nextValid = canPlaceRoad(topLeftX, topLeftY);
                    }
                    if (selectedBuildType === 'wire') {
                        nextValid = canPlaceWire(topLeftX, topLeftY);
                    }
                    if (selectedBuildType === 'zone_info') {
                        nextValid = findBuildingAt(topLeftX, topLeftY) >= 0;
                    }
                    if (selectedBuildType === 'bulldozer') {
                        nextValid = findBuildingAt(topLeftX, topLeftY) >= 0
                            || roadExistsAt(topLeftX, topLeftY)
                            || avenueExistsAt(topLeftX, topLeftY)
                            || wireExistsAt(topLeftX, topLeftY)
                            || isForestTile(topLeftX, topLeftY);
                    }
                    if (!hoverBuildPos || hoverBuildPos.x !== topLeftX || hoverBuildPos.y !== topLeftY || hoverBuildValid !== nextValid) {
                        hoverBuildPos = { x: topLeftX, y: topLeftY };
                        hoverBuildValid = nextValid;
                        renderGameMap();
                    }
                }

                gameViewport.addEventListener('mousemove', (event) => {
                    if (isAreaSelecting) {
                        const tile = getTileFromEvent(event);
                        areaSelectionEnd = tile;
                        areaSelectionRect = normalizeSelectionRect(areaSelectionStart, areaSelectionEnd);
                        renderGameMap();
                        return;
                    }
                    updateHoverBuild(event);
                    if (isDrawingRoad && selectedBuildType === 'road' && hoverBuildPos) {
                        const dir = getRoadDir(lastRoadPos, hoverBuildPos);
                        if (placeRoadAt(hoverBuildPos.x, hoverBuildPos.y, dir)) {
                            updateFinanceUI();
                            renderGameMap();
                            saveSession();
                        }
                        if (lastRoadPos) {
                            updatePreviousRoadDir(lastRoadPos, hoverBuildPos);
                        }
                        lastRoadPos = { x: hoverBuildPos.x, y: hoverBuildPos.y };
                    }
                    if (isDrawingAvenue && selectedBuildType === 'avenue' && hoverBuildPos) {
                        const dir = hoverBuildPos.dir || getRoadDir(lastAvenuePos, hoverBuildPos);
                        if (placeAvenueAt(hoverBuildPos.x, hoverBuildPos.y, dir)) {
                            updateFinanceUI();
                            renderGameMap();
                            saveSession();
                        }
                        if (lastAvenuePos) {
                            updatePreviousAvenueDir(lastAvenuePos, hoverBuildPos);
                        }
                        lastAvenuePos = { x: hoverBuildPos.x, y: hoverBuildPos.y };
                    }
                    if (isDrawingWire && selectedBuildType === 'wire' && hoverBuildPos) {
                        const dir = getRoadDir(lastWirePos, hoverBuildPos);
                        if (placeWireAt(hoverBuildPos.x, hoverBuildPos.y, dir)) {
                            updateFinanceUI();
                            renderGameMap();
                            saveSession();
                        }
                        if (lastWirePos) {
                            updatePreviousWireDir(lastWirePos, hoverBuildPos);
                        }
                        lastWirePos = { x: hoverBuildPos.x, y: hoverBuildPos.y };
                    }
                });

                gameViewport.addEventListener('mouseleave', () => {
                    hoverBuildPos = null;
                    hoverBuildValid = false;
                    renderGameMap();
                });

                gameViewport.addEventListener('click', (event) => {
                    if (suppressNextViewportClick) {
                        suppressNextViewportClick = false;
                        return;
                    }
                    if (isDragging) return;
                    if (event.button && event.button !== 0) return;
                    if (!selectedBuildType || !hoverBuildPos || !currentMap) return;
                    if (!hoverBuildValid) return;
                    if (selectedBuildType === 'bulldozer') {
                        const index = findBuildingAt(hoverBuildPos.x, hoverBuildPos.y);
                        if (index >= 0) {
                            gameState.buildings.splice(index, 1);
                            gameState.money = Math.max(0, gameState.money - getBuildCost('bulldozer'));
                        } else {
                            const rIndex = gameState.roads.findIndex((r) => r.x === hoverBuildPos.x && r.y === hoverBuildPos.y);
                            if (rIndex >= 0) {
                                gameState.roads.splice(rIndex, 1);
                                gameState.money = Math.max(0, gameState.money - getBuildCost('bulldozer'));
                            } else {
                                const aIndex = (gameState.avenues || []).findIndex((a) => {
                                    if (a.dir === 'h') {
                                        return a.y === hoverBuildPos.y && (a.x === hoverBuildPos.x || a.x + 1 === hoverBuildPos.x);
                                    }
                                    return a.x === hoverBuildPos.x && (a.y === hoverBuildPos.y || a.y + 1 === hoverBuildPos.y);
                                });
                                if (aIndex >= 0) {
                                    gameState.avenues.splice(aIndex, 1);
                                    gameState.money = Math.max(0, gameState.money - getBuildCost('bulldozer'));
                                } else {
                                    const wIndex = gameState.wires.findIndex((w) => w.x === hoverBuildPos.x && w.y === hoverBuildPos.y);
                                    if (wIndex >= 0) {
                                        gameState.wires.splice(wIndex, 1);
                                        gameState.money = Math.max(0, gameState.money - getBuildCost('bulldozer'));
                                    } else if (isForestTile(hoverBuildPos.x, hoverBuildPos.y)) {
                                        setTile(hoverBuildPos.x, hoverBuildPos.y, 'land');
                                        gameState.money = Math.max(0, gameState.money - getBuildCost('bulldozer'));
                                    }
                                }
                            }
                        }
                    } else if (selectedBuildType === 'road') {
                        // click unico tambÃ©m funciona
                        placeRoadAt(hoverBuildPos.x, hoverBuildPos.y, 'v');
                    } else if (selectedBuildType === 'avenue') {
                        const dir = hoverBuildPos.dir || getRoadDir(lastAvenuePos, hoverBuildPos);
                        placeAvenueAt(hoverBuildPos.x, hoverBuildPos.y, dir);
                    } else if (selectedBuildType === 'wire') {
                        placeWireAt(hoverBuildPos.x, hoverBuildPos.y, 'h');
                    } else if (selectedBuildType === 'zone_info') {
                        const index = findBuildingAt(hoverBuildPos.x, hoverBuildPos.y);
                        if (index >= 0) {
                            openZoneModal(gameState.buildings[index]);
                        } else {
                            showToast('Nenhuma zona selecionada');
                        }
                        return;
                    } else {
                        const cost = getBuildCost(selectedBuildType);
                        if (gameState.money < cost) {
                            showToast('Capital insuficiente');
                            return;
                        }
                        gameState.buildings.push({
                            id: gameState.nextBuildingId++,
                            type: selectedBuildType,
                            x: hoverBuildPos.x,
                            y: hoverBuildPos.y,
                            size: getBuildSize(selectedBuildType),
                            powered: selectedBuildType === 'tree',
                            powerAnimUntil: null,
                            powerAnimPending: false,
                            powerAnimStartedAt: null,
                            spriteVariant: selectedBuildType === 'commercial' ? (Math.random() < 0.5 ? 1 : 2) : undefined,
                            zone: {
                                type: ['residential', 'commercial', 'industrial'].includes(selectedBuildType)
                                    ? selectedBuildType
                                    : ['hospital_small', 'police_station', 'fire_station', 'school', 'nuclear_plant', 'park', 'tree'].includes(selectedBuildType)
                                        ? 'public'
                                        : null,
                                densityLevel: 1,
                                level: 1,
                                population: 0,
                                maxCapacity: 0,
                                jobs: 0,
                                devLevel: 0,
                                resLevel: 0,
                                densityScore: 0,
                                landValueScore: 0,
                                crimeScore: 0,
                                pollutionScore: 0,
                                fireScore: 0,
                                growthScore: 0,
                                density: 'Baixo',
                                landValue: 'Classe media',
                                crime: 'Seguro',
                                pollution: 'Nenhum',
                                fire: 'Nenhum',
                                growth: 'Estavel'
                            }
                        });
                        if (selectedBuildType === 'tree') {
                            applyTreePollutionRelief(gameState.buildings[gameState.buildings.length - 1]);
                        }
                        gameState.money = Math.max(0, gameState.money - cost);
                    }
                    updateFinanceUI();
                    renderGameMap();
                    saveSession();
                });

                window.addEventListener('mousemove', (event) => {
                    if (!isDragging) return;
                    const dx = event.clientX - lastMouse.x;
                    const dy = event.clientY - lastMouse.y;
                    dragDistance += Math.abs(dx) + Math.abs(dy);
                    if (dragDistance > 3) {
                        suppressNextViewportClick = true;
                    }
                    const sensitivity = getPanSensitivityMultiplier();
                    camera.x += dx * sensitivity;
                    camera.y += dy * sensitivity;
                    clampCameraToMap();
                    lastMouse = { x: event.clientX, y: event.clientY };
                    renderGameMap();
                    saveSession();
                });

                window.addEventListener('mouseup', () => {
                    isDragging = false;
                    dragDistance = 0;
                    gameViewport.classList.remove('panning');
                    isDrawingRoad = false;
                    isDrawingAvenue = false;
                    isDrawingWire = false;
                    if (isAreaSelecting) {
                        isAreaSelecting = false;
                        if (areaSelectionStart && areaSelectionEnd) {
                            areaSelectionRect = normalizeSelectionRect(areaSelectionStart, areaSelectionEnd);
                            const stats = computeAreaSelection(areaSelectionRect);
                            if (stats.totalTiles > 0) {
                                openAreaModal(stats);
                            } else {
                                areaSelectionRect = null;
                                showToast('Nada selecionado');
                            }
                            renderGameMap();
                        }
                    }
                    if (lastRoadPos) {
                        const prev = gameState.roads.length > 1 ? gameState.roads[gameState.roads.length - 2] : null;
                        if (prev) {
                            updatePreviousRoadDir(prev, lastRoadPos);
                        }
                    }
                    lastRoadPos = null;
                    lastAvenuePos = null;
                    if (lastWirePos) {
                        const prev = gameState.wires.length > 1 ? gameState.wires[gameState.wires.length - 2] : null;
                        if (prev) {
                            updatePreviousWireDir(prev, lastWirePos);
                        }
                    }
                    lastWirePos = null;
                });

                // ====== Touch (pinch zoom) ======
                gameViewport.addEventListener('touchstart', (event) => {
                    if (!gameScreen.classList.contains('open')) return;
                    if (event.touches.length === 2) {
                        isPinching = true;
                        const [t1, t2] = event.touches;
                        lastPinchDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
                        event.preventDefault();
                    } else if (event.touches.length === 1) {
                        const t = event.touches[0];
                        if (selectedBuildType === 'road' && hoverBuildPos) {
                            isDrawingRoad = true;
                            const dir = getRoadDir(lastRoadPos, hoverBuildPos);
                            if (placeRoadAt(hoverBuildPos.x, hoverBuildPos.y, dir)) {
                                updateFinanceUI();
                                renderGameMap();
                                saveSession();
                            }
                            if (lastRoadPos) {
                                updatePreviousRoadDir(lastRoadPos, hoverBuildPos);
                            }
                            lastRoadPos = { x: hoverBuildPos.x, y: hoverBuildPos.y };
                        } else if (selectedBuildType === 'avenue' && hoverBuildPos) {
                            isDrawingAvenue = true;
                            const dir = hoverBuildPos.dir || getRoadDir(lastAvenuePos, hoverBuildPos);
                            if (placeAvenueAt(hoverBuildPos.x, hoverBuildPos.y, dir)) {
                                updateFinanceUI();
                                renderGameMap();
                                saveSession();
                            }
                            if (lastAvenuePos) {
                                updatePreviousAvenueDir(lastAvenuePos, hoverBuildPos);
                            }
                            lastAvenuePos = { x: hoverBuildPos.x, y: hoverBuildPos.y };
                        } else if (selectedBuildType === 'wire' && hoverBuildPos) {
                            isDrawingWire = true;
                            const dir = getRoadDir(lastWirePos, hoverBuildPos);
                            if (placeWireAt(hoverBuildPos.x, hoverBuildPos.y, dir)) {
                                updateFinanceUI();
                                renderGameMap();
                                saveSession();
                            }
                            if (lastWirePos) {
                                updatePreviousWireDir(lastWirePos, hoverBuildPos);
                            }
                            lastWirePos = { x: hoverBuildPos.x, y: hoverBuildPos.y };
                        } else {
                            isDragging = true;
                            lastMouse = { x: t.clientX, y: t.clientY };
                        }
                        event.preventDefault();
                    }
                }, { passive: false });

                gameViewport.addEventListener('touchmove', (event) => {
                    if (!isPinching || event.touches.length !== 2) return;
                    const [t1, t2] = event.touches;
                    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
                    if (lastPinchDistance > 0) {
                        const rawFactor = dist / lastPinchDistance;
                        const factor = 1 + ((rawFactor - 1) * (0.35 + settings.zoomSensitivity / 100));
                        const centerX = (t1.clientX + t2.clientX) / 2;
                        const centerY = (t1.clientY + t2.clientY) / 2;
                        zoomAtCursor(centerX, centerY, factor);
                        renderGameMap();
                        saveSession();
                    }
                    lastPinchDistance = dist;
                    event.preventDefault();
                }, { passive: false });

                gameViewport.addEventListener('touchmove', (event) => {
                    if (isPinching) return;
                    if (event.touches.length !== 1) return;
                    const t = event.touches[0];
                    if (isDragging) {
                        const dx = t.clientX - lastMouse.x;
                        const dy = t.clientY - lastMouse.y;
                        const sensitivity = getPanSensitivityMultiplier();
                        camera.x += dx * sensitivity;
                        camera.y += dy * sensitivity;
                        clampCameraToMap();
                        lastMouse = { x: t.clientX, y: t.clientY };
                        renderGameMap();
                        saveSession();
                    } else if (isDrawingRoad && selectedBuildType === 'road') {
                        updateHoverBuild({
                            clientX: t.clientX,
                            clientY: t.clientY
                        });
                        if (hoverBuildPos) {
                            const dir = getRoadDir(lastRoadPos, hoverBuildPos);
                            if (placeRoadAt(hoverBuildPos.x, hoverBuildPos.y, dir)) {
                                updateFinanceUI();
                                renderGameMap();
                                saveSession();
                            }
                            if (lastRoadPos) {
                                updatePreviousRoadDir(lastRoadPos, hoverBuildPos);
                            }
                            lastRoadPos = { x: hoverBuildPos.x, y: hoverBuildPos.y };
                        }
                    } else if (isDrawingAvenue && selectedBuildType === 'avenue') {
                        updateHoverBuild({
                            clientX: t.clientX,
                            clientY: t.clientY
                        });
                        if (hoverBuildPos) {
                            const dir = hoverBuildPos.dir || getRoadDir(lastAvenuePos, hoverBuildPos);
                            if (placeAvenueAt(hoverBuildPos.x, hoverBuildPos.y, dir)) {
                                updateFinanceUI();
                                renderGameMap();
                                saveSession();
                            }
                            if (lastAvenuePos) {
                                updatePreviousAvenueDir(lastAvenuePos, hoverBuildPos);
                            }
                            lastAvenuePos = { x: hoverBuildPos.x, y: hoverBuildPos.y };
                        }
                    } else if (isDrawingWire && selectedBuildType === 'wire') {
                        updateHoverBuild({
                            clientX: t.clientX,
                            clientY: t.clientY
                        });
                        if (hoverBuildPos) {
                            const dir = getRoadDir(lastWirePos, hoverBuildPos);
                            if (placeWireAt(hoverBuildPos.x, hoverBuildPos.y, dir)) {
                                updateFinanceUI();
                                renderGameMap();
                                saveSession();
                            }
                            if (lastWirePos) {
                                updatePreviousWireDir(lastWirePos, hoverBuildPos);
                            }
                            lastWirePos = { x: hoverBuildPos.x, y: hoverBuildPos.y };
                        }
                    }
                    event.preventDefault();
                }, { passive: false });

                gameViewport.addEventListener('touchend', (event) => {
                    if (event.touches.length < 2) {
                        isPinching = false;
                        lastPinchDistance = 0;
                    }
                    if (event.touches.length === 0) {
                        isDragging = false;
                        isDrawingRoad = false;
                        isDrawingAvenue = false;
                        isDrawingWire = false;
                        lastRoadPos = null;
                        lastAvenuePos = null;
                        lastWirePos = null;
                    }
                });

                // ====== Zoom com Alt + scroll ======
                gameViewport.addEventListener('wheel', (event) => {
                    if (!gameScreen.classList.contains('open')) return;
                    if (!event.altKey) return;
                    event.preventDefault();
                    const zoomIn = settings.invertZoom ? event.deltaY > 0 : event.deltaY < 0;
                    const zoomStep = getZoomStep();
                    const zoomFactor = zoomIn ? 1 + zoomStep : Math.max(0.1, 1 - zoomStep);
                    zoomAtCursor(event.clientX, event.clientY, zoomFactor);
                    saveSession();
                }, { passive: false });

                // ====== Ajuste de tela ao redimensionar ======
                window.addEventListener('resize', () => {
                    if (gameScreen.classList.contains('open')) {
                        resizeGameCanvas();
                    }
                });

                if (btnExitGameFromMenu) {
                    btnExitGameFromMenu.addEventListener('click', returnToLobby);
                }

                if (btnReturnToLobby) {
                    btnReturnToLobby.addEventListener('click', returnToLobby);
                }

                if (btnToolsToggle) {
                    btnToolsToggle.addEventListener('click', () => {
                        openSettingsModal();
                    });
                }

                if (btnClockToggle && clockPanel) {
                    btnClockToggle.addEventListener('click', () => {
                        if (hudShell) {
                            hudShell.classList.toggle('bottom-collapsed');
                            btnClockToggle.textContent = hudShell.classList.contains('bottom-collapsed') ? '^' : 'v';
                        }
                        syncViewportLayout();
                    });
                }

                toolGroupButtons.forEach((button) => {
                    button.addEventListener('click', () => {
                        setToolGroup(button.dataset.buildGroup);
                    });
                });

                panelToolButtons.forEach((button) => {
                    button.addEventListener('click', () => {
                        toggleSidePanelView(button.dataset.panelTool);
                    });
                });

                settingsNavItems.forEach((button) => {
                    button.addEventListener('click', () => {
                        switchSettingsTab(button.dataset.settingsTab);
                        saveSettings();
                    });
                });

                if (settingsClose) {
                    settingsClose.addEventListener('click', () => closeSettingsModal());
                }

                if (settingsBackdrop) {
                    settingsBackdrop.addEventListener('click', (event) => {
                        if (event.target === settingsBackdrop) {
                            closeSettingsModal();
                        }
                    });
                }

                document.addEventListener('keydown', (event) => {
                    if (event.key === 'Escape' && settingsBackdrop && !settingsBackdrop.hidden) {
                        closeSettingsModal();
                    }
                });

                btnZoneResidential.addEventListener('click', () => {
                    setSelectedBuild('residential', btnZoneResidential);
                    showToast('Zona residencial selecionada');
                });
                btnZoneCommercial.addEventListener('click', () => {
                    setSelectedBuild('commercial', btnZoneCommercial);
                    showToast('Zona comercial selecionada');
                });
                btnZoneIndustrial.addEventListener('click', () => {
                    setSelectedBuild('industrial', btnZoneIndustrial);
                    showToast('Zona industrial selecionada');
                });

                btnHospitalSmall.addEventListener('click', () => {
                    setSelectedBuild('hospital_small', btnHospitalSmall);
                    showToast('Hospital pequeno selecionado');
                });

                btnPoliceStation.addEventListener('click', () => {
                    setSelectedBuild('police_station', btnPoliceStation);
                    showToast('Delegacia selecionada');
                });

                if (btnFireStation) {
                    btnFireStation.addEventListener('click', () => {
                        setSelectedBuild('fire_station', btnFireStation);
                        showToast('Posto de bombeiros selecionado');
                    });
                }

                btnSchool.addEventListener('click', () => {
                    setSelectedBuild('school', btnSchool);
                    showToast('Escola selecionada');
                });

                btnNuclearPlant.addEventListener('click', () => {
                    setSelectedBuild('nuclear_plant', btnNuclearPlant);
                    showToast('Uzina nuclear selecionada');
                });

                btnPark.addEventListener('click', () => {
                    setSelectedBuild('park', btnPark);
                    showToast('Parque selecionado');
                });

                if (btnTree) {
                    btnTree.addEventListener('click', () => {
                        setSelectedBuild('tree', btnTree);
                        showToast('Arvore selecionada');
                    });
                }

                btnWire.addEventListener('click', () => {
                    setSelectedBuild('wire', btnWire);
                    showToast('Fiacao selecionada');
                });

                btnRoad.addEventListener('click', () => {
                    setSelectedBuild('road', btnRoad);
                    showToast('Estrada selecionada');
                });
                if (btnAvenue) {
                    btnAvenue.addEventListener('click', () => {
                        setSelectedBuild('avenue', btnAvenue);
                        showToast('Avenida selecionada');
                    });
                }

                if (btnBulldozer) {
                    btnBulldozer.addEventListener('click', () => {
                        setSelectedBuild('bulldozer', btnBulldozerTool || btnBulldozer);
                        showToast('Bulldozer selecionado');
                    });
                }

                if (btnBulldozerTool) {
                    btnBulldozerTool.addEventListener('click', () => {
                        setSelectedBuild('bulldozer', btnBulldozerTool);
                        showToast('Bulldozer selecionado');
                    });
                }

                if (btnAreaSelect) {
                    btnAreaSelect.addEventListener('click', () => {
                        setSelectedBuild('area_select', btnAreaSelect);
                        areaSelectionRect = null;
                        areaSelectionStart = null;
                        areaSelectionEnd = null;
                        areaSelectionStats = null;
                        renderGameMap();
                        showToast('Selecao de area ativa');
                    });
                }

                if (btnToggleBuildMenu && buildSidebar) {
                    btnToggleBuildMenu.addEventListener('click', () => {
                        buildSidebar.classList.toggle('collapsed');
                        if (hudShell) {
                            hudShell.classList.toggle('toolpanel-collapsed', buildSidebar.classList.contains('collapsed'));
                        }
                        btnToggleBuildMenu.innerHTML = buildSidebar.classList.contains('collapsed') ? '&gt;' : '&lt;';
                        syncViewportLayout();
                    });
                }

                // Atalho de teclado: Q para Bulldozer
                window.addEventListener('keydown', (event) => {
                    if (event.code !== 'KeyQ') return;
                    if (!gameScreen.classList.contains('open')) return;
                    setToolGroup('bulldozer');
                    setSelectedBuild('bulldozer', btnBulldozerTool || btnBulldozer);
                    showToast('Bulldozer selecionado');
                });

                if (btnZoneInfo) {
                    btnZoneInfo.addEventListener('click', () => {
                        setSelectedBuild('zone_info', btnZoneInfo);
                        showToast('Selecione uma zona no mapa');
                    });
                }

                if (btnEditTaxes) btnEditTaxes.addEventListener('click', () => openTaxModal());
                if (btnCityInfo) btnCityInfo.addEventListener('click', () => openCityModal());
                if (btnRating) btnRating.addEventListener('click', () => openRatingModal());

                if (btnToggleControls && controlsPanel) {
                    btnToggleControls.addEventListener('click', () => {
                        controlsPanel.classList.toggle('controls-hidden');
                    });
                }

	                if (btnSpeedPause) btnSpeedPause.addEventListener('click', () => setSimulationSpeed(0));
	                if (btnSpeedSlow) btnSpeedSlow.addEventListener('click', () => setSimulationSpeed(SIM_SPEED_SLOW_MS));
	                if (btnSpeedNormal) btnSpeedNormal.addEventListener('click', () => setSimulationSpeed(SIM_SPEED_NORMAL_MS));
	                if (btnSpeedFast) btnSpeedFast.addEventListener('click', () => setSimulationSpeed(SIM_SPEED_FAST_MS));

                if (taxRateSlider) taxRateSlider.addEventListener('input', () => updateTaxValueDisplays());
                if (taxRoadsSlider) taxRoadsSlider.addEventListener('input', updateTaxValueDisplays);
                if (taxHospitalsSlider) taxHospitalsSlider.addEventListener('input', updateTaxValueDisplays);
                if (taxSchoolsSlider) taxSchoolsSlider.addEventListener('input', updateTaxValueDisplays);
                if (taxServicesSlider) taxServicesSlider.addEventListener('input', updateTaxValueDisplays);
                if (taxLeisureSlider) taxLeisureSlider.addEventListener('input', updateTaxValueDisplays);

                if (taxApplyBtn) {
                    taxApplyBtn.addEventListener('click', () => {
                        applyTaxesFromUI();
                        if (settings.revenueMode === 'manual') {
                            applyAnnualBudget();
                            updateFinanceUI();
                            showToast('Receita coletada manualmente');
                        }
                        closeTaxModal();
                        saveSession();
                        if (settings.revenueMode !== 'manual') {
                            showToast('Impostos atualizados');
                        }
                    });
                }

                if (taxCloseBtn) taxCloseBtn.addEventListener('click', () => closeTaxModal());
                if (cityCloseBtn) cityCloseBtn.addEventListener('click', () => closeCityModal());
                if (zoneCloseBtn) zoneCloseBtn.addEventListener('click', () => closeZoneModal());
                if (ratingCloseBtn) ratingCloseBtn.addEventListener('click', () => closeRatingModal());

                // ====== Botoes de salvar/carregar ======
                const saveGameButton = document.getElementById('btnSaveGame');
                const loadGameButton = document.getElementById('btnLoadGame');
                const exportSaveButton = document.getElementById('btnExportSave');

                if (saveGameButton) {
                    saveGameButton.addEventListener('click', () => {
                        saveFeedback.innerText = '';
                        saveNameInput.value = '';
                        saveModal.classList.add('open');
                        saveModal.setAttribute('aria-hidden', 'false');
                    });
                }

                if (loadGameButton) {
                    loadGameButton.addEventListener('click', () => {
                        loadGame();
                        updateMessage('Jogo carregado');
                    });
                }

                if (exportSaveButton) {
                    exportSaveButton.addEventListener('click', exportSave);
                }

                document.querySelectorAll('input[name="theme"]').forEach((input) => {
                    input.addEventListener('change', () => updateSetting('theme', input.value, 'onThemeChange'));
                });
                if (uiScaleSelect) {
                    uiScaleSelect.addEventListener('change', () => updateSetting('uiScale', uiScaleSelect.value, 'onUiScaleChange'));
                }
                document.querySelectorAll('input[name="ui-density"]').forEach((input) => {
                    input.addEventListener('change', () => updateSetting('uiDensity', input.value, 'onUiDensityChange'));
                });
                if (mapGridToggle) {
                    mapGridToggle.addEventListener('change', () => updateSetting('showMapGrid', mapGridToggle.checked, 'onShowMapGridChange'));
                }
                if (tooltipLevelSelect) {
                    tooltipLevelSelect.addEventListener('change', () => updateSetting('tooltipLevel', tooltipLevelSelect.value, 'onTooltipLevelChange'));
                }
                document.querySelectorAll('input[name="info-level"]').forEach((input) => {
                    input.addEventListener('change', () => updateSetting('infoLevel', input.value, 'onInfoLevelChange'));
                });
                if (cameraSensitivityRange) {
                    cameraSensitivityRange.addEventListener('input', () => {
                        updateSetting('cameraSensitivity', Number(cameraSensitivityRange.value), 'onCameraSensitivityChange');
                    });
                }
                if (zoomSensitivityRange) {
                    zoomSensitivityRange.addEventListener('input', () => {
                        updateSetting('zoomSensitivity', Number(zoomSensitivityRange.value), 'onZoomSensitivityChange');
                    });
                }
                if (invertZoomToggle) {
                    invertZoomToggle.addEventListener('change', () => updateSetting('invertZoom', invertZoomToggle.checked, 'onInvertZoomChange'));
                }
                document.querySelectorAll('input[name="map-move-mode"]').forEach((input) => {
                    input.addEventListener('change', () => updateSetting('mapMoveMode', input.value, 'onMapMoveModeChange'));
                });
                if (autosaveSelect) {
                    autosaveSelect.addEventListener('change', () => updateSetting('autosave', autosaveSelect.value, 'onAutosaveChange'));
                }
                if (resumeLastCityToggle) {
                    resumeLastCityToggle.addEventListener('change', () => updateSetting('resumeLastCity', resumeLastCityToggle.checked, 'onResumeLastCityChange'));
                }
                if (confirmExitToggle) {
                    confirmExitToggle.addEventListener('change', () => updateSetting('confirmExit', confirmExitToggle.checked, 'onConfirmExitChange'));
                }
                document.querySelectorAll('input[name="revenue-mode"]').forEach((input) => {
                    input.addEventListener('change', () => updateSetting('revenueMode', input.value, 'onRevenueModeChange'));
                });
                if (monthlySummaryToggle) {
                    monthlySummaryToggle.addEventListener('change', () => updateSetting('monthlySummary', monthlySummaryToggle.checked, 'onMonthlySummaryChange'));
                }
                if (lossAlertToggle) {
                    lossAlertToggle.addEventListener('change', () => updateSetting('lossAlert', lossAlertToggle.checked, 'onLossAlertChange'));
                }
                if (alertEnergyToggle) {
                    alertEnergyToggle.addEventListener('change', () => updateSetting('alertEnergy', alertEnergyToggle.checked, 'onAlertEnergyChange'));
                }
                if (alertUnemploymentToggle) {
                    alertUnemploymentToggle.addEventListener('change', () => updateSetting('alertUnemployment', alertUnemploymentToggle.checked, 'onAlertUnemploymentChange'));
                }
                if (alertPollutionToggle) {
                    alertPollutionToggle.addEventListener('change', () => updateSetting('alertPollution', alertPollutionToggle.checked, 'onAlertPollutionChange'));
                }
                if (alertCrimeToggle) {
                    alertCrimeToggle.addEventListener('change', () => updateSetting('alertCrime', alertCrimeToggle.checked, 'onAlertCrimeChange'));
                }
                if (alertFireToggle) {
                    alertFireToggle.addEventListener('change', () => updateSetting('alertFire', alertFireToggle.checked, 'onAlertFireChange'));
                }
                if (alertFrequencySelect) {
                    alertFrequencySelect.addEventListener('change', () => updateSetting('alertFrequency', alertFrequencySelect.value, 'onAlertFrequencyChange'));
                }
                if (alertMessagesToggle) {
                    alertMessagesToggle.addEventListener('change', () => updateSetting('alertMessages', alertMessagesToggle.checked, 'onAlertMessagesChange'));
                }
                document.querySelectorAll('input[name="tutorial-mode"]').forEach((input) => {
                    input.addEventListener('change', () => updateSetting('tutorialMode', input.value, 'onTutorialModeChange'));
                });
                if (autoTipsToggle) {
                    autoTipsToggle.addEventListener('change', () => updateSetting('autoTips', autoTipsToggle.checked, 'onAutoTipsChange'));
                }
                if (smartAssistToggle) {
                    smartAssistToggle.addEventListener('change', () => updateSetting('smartAssist', smartAssistToggle.checked, 'onSmartAssistChange'));
                }
                if (masterVolumeRange) {
                    masterVolumeRange.addEventListener('input', () => updateSetting('masterVolume', Number(masterVolumeRange.value), 'onMasterVolumeChange'));
                }
                if (musicVolumeRange) {
                    musicVolumeRange.addEventListener('input', () => updateSetting('musicVolume', Number(musicVolumeRange.value), 'onMusicVolumeChange'));
                }
                if (effectsVolumeRange) {
                    effectsVolumeRange.addEventListener('input', () => updateSetting('effectsVolume', Number(effectsVolumeRange.value), 'onEffectsVolumeChange'));
                }

                window.addEventListener('beforeunload', (event) => {
                    if (!gameScreen.classList.contains('open')) return;
                    saveSession();
                    if (!settings.confirmExit) return;
                    event.preventDefault();
                    event.returnValue = '';
                });

                function showToast(message) {
                    toast.textContent = message;
                    toast.classList.add('show');
                    if (toastTimer) clearTimeout(toastTimer);
                    toastTimer = setTimeout(() => {
                        toast.classList.remove('show');
                    }, 2200);
                }

                function closeSaveModal() {
                    saveModal.classList.remove('open');
                    saveModal.setAttribute('aria-hidden', 'true');
                }

                if (btnCancelSave) {
                    btnCancelSave.addEventListener('click', () => {
                        closeSaveModal();
                    });
                }

                if (btnConfirmSave) {
                    btnConfirmSave.addEventListener('click', () => {
                        saveGame();
                    });
                }

                if (saveNameInput) {
                    saveNameInput.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter') {
                            saveGame();
                        }
                    });
                }

                // ====== Mensagem inicial ======
                applySettings();
                updateMessage('Cidade pronta para ser criada');
                setToolGroup('zones');
                setSidePanelView('analysis');
                updateFinanceUI();
                setSimulationSpeed(simulationSpeedMs);
                updateSpeedUI();
                resumeLastSession();

                window.CityBuilder.registerModule('runtime', {
                    ...window.CityBuilder.pickFunctions([
                        'syncGameTimeFromCityTime',
                        'updateGameTime',
                        'simulationTick',
                        'setSimulationSpeed',
                        'getSessionKey',
                        'saveSession',
                        'loadSession',
                        'updateSpeedUI',
                        'zoomAtCursor',
                        'resizeGameCanvas',
                        'createPreview',
                        'createSavePreview',
                        'generateMapList',
                        'getSaves',
                        'saveSaves',
                        'findSaveById',
                        'getCityName',
                        'generateSaveList',
                        'deleteSave',
                        'selectMap',
                        'selectSave',
                        'openGameScreen',
                        'closeGameScreen',
                        'returnToLobby',
                        'resetGameStateForNewCity',
                        'resetTransientInteractionState',
                        'openMapScreen',
                        'closeMapScreen',
                        'openLoadScreen',
                        'closeLoadScreen',
                        'persistSaveEntry',
                        'saveGame',
                        'loadGame',
                        'resumeLastSession',
                        'exportSave',
                        'canPlaceBuilding',
                        'roadExistsAt',
                        'avenueExistsAt',
                        'wireExistsAt',
                        'canPlaceRoad',
                        'getAvenueFootprint',
                        'canPlaceAvenue',
                        'canPlaceWire',
                        'isWaterTile',
                        'isForestTile',
                        'setTile',
                        'getTileFromEvent',
                        'normalizeSelectionRect',
                        'computeAreaSelection',
                        'openAreaModal',
                        'closeAreaModal',
                        'updateDemolitionTimerUI',
                        'startDemolitionTimer',
                        'applyAreaDestruction',
                        'findBuildingAt',
                        'getRoadDir',
                        'updatePreviousAvenueDir',
                        'placeRoadAt',
                        'placeAvenueAt',
                        'placeWireAt',
                        'updatePreviousRoadDir',
                        'updatePreviousWireDir',
                        'updateHoverBuild',
                        'showToast',
                        'closeSaveModal'
                    ])
                });
