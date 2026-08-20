                // ====== Elementos principais ======
                const btnNew = document.getElementById('btnNewCity');
                const btnLoad = document.getElementById('btnLoadCity');
                const btnConfig = document.getElementById('btnSettings');
                const messageSpan = document.getElementById('messageText');

                const mapScreen = document.getElementById('mapScreen');
                const mapGrid = document.getElementById('mapGrid');
                const btnGenerateMaps = document.getElementById('btnGenerateMaps');
                const btnStartGame = document.getElementById('btnStartGame');
                const btnCloseMapScreen = document.getElementById('btnCloseMapScreen');

                const loadScreen = document.getElementById('loadScreen');
                const saveGrid = document.getElementById('saveGrid');
                const btnRefreshSaves = document.getElementById('btnRefreshSaves');
                const btnLoadSelected = document.getElementById('btnLoadSelected');
                const btnCloseLoadScreen = document.getElementById('btnCloseLoadScreen');

                const gameScreen = document.getElementById('gameScreen');
                const hudShell = document.querySelector('.hud-shell');
                const gameViewport = document.getElementById('gameViewport');
                const gameCanvas = document.getElementById('gameCanvas');
                const btnExitGameFromMenu = document.getElementById('btnExitGameFromMenu');
                const btnReturnToLobby = document.getElementById('btnReturnToLobby');
                const btnToolsToggle = document.getElementById('btnToolsToggle');
                const toolsPanel = document.getElementById('toolsPanel');
                const btnClockToggle = document.getElementById('btnClockToggle');
                const clockPanel = document.getElementById('clockPanel');
                const controlsPanel = document.getElementById('controlsPanel');
                const btnToggleControls = document.getElementById('btnToggleControls');
                const btnZoneResidential = document.getElementById('btnZoneResidential');
                const btnZoneCommercial = document.getElementById('btnZoneCommercial');
                const btnZoneIndustrial = document.getElementById('btnZoneIndustrial');
                const btnHospitalSmall = document.getElementById('btnHospitalSmall');
                const btnPoliceStation = document.getElementById('btnPoliceStation');
                const btnFireStation = document.getElementById('btnFireStation');
                const btnSchool = document.getElementById('btnSchool');
                const btnNuclearPlant = document.getElementById('btnNuclearPlant');
                const btnPark = document.getElementById('btnPark');
                const btnTree = document.getElementById('btnTree');
                const btnWire = document.getElementById('btnWire');
                const btnRoad = document.getElementById('btnRoad');
                const btnAvenue = document.getElementById('btnAvenue');
                const btnBulldozer = document.getElementById('btnBulldozer');
                const btnBulldozerTool = document.getElementById('btnBulldozerTool');
                const btnAreaSelect = document.getElementById('btnAreaSelect');
                const btnZoneInfo = document.getElementById('btnZoneInfo');
                const buildSidebar = document.getElementById('buildSidebar');
                const btnToggleBuildMenu = document.getElementById('btnToggleBuildMenu');
                const btnFinanceToggle = document.getElementById('btnFinanceToggle');
                const financeDrawer = document.getElementById('financeDrawer');
                const topbarMoney = document.getElementById('topbarMoney');
                const topbarPopulation = document.getElementById('topbarPopulation');
                const topbarHappiness = document.getElementById('topbarHappiness');
                const topbarTaxRate = document.getElementById('topbarTaxRate');
                const topbarDate = document.getElementById('topbarDate');
                const topbarCity = document.getElementById('topbarCity');
                const btnEditTaxes = document.getElementById('btnEditTaxes');
                const btnCityInfo = document.getElementById('btnCityInfo');
                const btnRating = document.getElementById('btnRating');
                const btnSpeedPause = document.getElementById('btnSpeedPause');
                const btnSpeedSlow = document.getElementById('btnSpeedSlow');
                const btnSpeedNormal = document.getElementById('btnSpeedNormal');
                const btnSpeedFast = document.getElementById('btnSpeedFast');
                const saveModal = document.getElementById('saveModal');
                const saveNameInput = document.getElementById('saveNameInput');
                const saveFeedback = document.getElementById('saveFeedback');
                const btnCancelSave = document.getElementById('btnCancelSave');
                const btnConfirmSave = document.getElementById('btnConfirmSave');
                const taxModal = document.getElementById('taxModal');
                const taxRateSlider = document.getElementById('taxRateSlider');
                const taxRateValue = document.getElementById('taxRateValue');
                const taxRoadsSlider = document.getElementById('taxRoadsSlider');
                const taxRoadsValue = document.getElementById('taxRoadsValue');
                const taxHospitalsSlider = document.getElementById('taxHospitalsSlider');
                const taxHospitalsValue = document.getElementById('taxHospitalsValue');
                const taxSchoolsSlider = document.getElementById('taxSchoolsSlider');
                const taxSchoolsValue = document.getElementById('taxSchoolsValue');
                const taxServicesSlider = document.getElementById('taxServicesSlider');
                const taxServicesValue = document.getElementById('taxServicesValue');
                const taxLeisureSlider = document.getElementById('taxLeisureSlider');
                const taxLeisureValue = document.getElementById('taxLeisureValue');
                const taxApplyBtn = document.getElementById('taxApplyBtn');
                const taxCloseBtn = document.getElementById('taxCloseBtn');
                const cityModal = document.getElementById('cityModal');
                const cityCloseBtn = document.getElementById('cityCloseBtn');
                const infoPopulation = document.getElementById('infoPopulation');
                const infoResidences = document.getElementById('infoResidences');
                const infoAcceptance = document.getElementById('infoAcceptance');
                const infoJobs = document.getElementById('infoJobs');
                const infoEmployed = document.getElementById('infoEmployed');
                const infoHospitalLoad = document.getElementById('infoHospitalLoad');
                const infoSchoolLoad = document.getElementById('infoSchoolLoad');
                const infoPollutionLevel = document.getElementById('infoPollutionLevel');
                const infoSafety = document.getElementById('infoSafety');
                const zoneModal = document.getElementById('zoneModal');
                const zoneCloseBtn = document.getElementById('zoneCloseBtn');
                const zoneTypeValue = document.getElementById('zoneTypeValue');
                const zoneOccupancyValue = document.getElementById('zoneOccupancyValue');
                const zoneDensityValue = document.getElementById('zoneDensityValue');
                const zoneValueValue = document.getElementById('zoneValueValue');
                const zoneCrimeValue = document.getElementById('zoneCrimeValue');
                const zonePollutionValue = document.getElementById('zonePollutionValue');
                const zoneFireValue = document.getElementById('zoneFireValue');
                const zoneGrowthValue = document.getElementById('zoneGrowthValue');
                const ratingModal = document.getElementById('ratingModal');
                const ratingCloseBtn = document.getElementById('ratingCloseBtn');
                const demolitionTimer = document.getElementById('demolitionTimer');
                const demolitionTimeValue = document.getElementById('demolitionTimeValue');
                const areaModal = document.getElementById('areaModal');
                const areaTargetsValue = document.getElementById('areaTargetsValue');
                const areaCostValue = document.getElementById('areaCostValue');
                const areaTimeValue = document.getElementById('areaTimeValue');
                const areaConfirmBtn = document.getElementById('areaConfirmBtn');
                const areaCancelBtn = document.getElementById('areaCancelBtn');
                const ratingHappinessFill = document.getElementById('ratingHappinessFill');
                const ratingHappinessStatus = document.getElementById('ratingHappinessStatus');
                const ratingComplaintsList = document.getElementById('ratingComplaintsList');
                const happinessFill = document.getElementById('happinessFill');
                const happinessStatus = document.getElementById('happinessStatus');
                const complaintsList = document.getElementById('complaintsList');
                const activeModeLabel = document.getElementById('activeModeLabel');
                const toolPanelTitle = document.getElementById('toolPanelTitle');
                const toolGroupButtons = Array.from(document.querySelectorAll('.hud-group-button'));
                const groupedBuildButtons = Array.from(document.querySelectorAll('.hud-build-button'));
                const panelToolButtons = Array.from(document.querySelectorAll('[data-panel-tool]'));
                const panelViews = Array.from(document.querySelectorAll('.panel-view[data-panel-view]'));
                const modeIndicatorText = document.getElementById('modeIndicatorText');
                const settingsBackdrop = document.getElementById('settings-backdrop');
                const settingsModal = document.getElementById('settings-modal');
                const settingsClose = document.getElementById('settings-close');
                const settingsNavItems = Array.from(document.querySelectorAll('.settings-nav-item[data-settings-tab]'));
                const settingsPanels = Array.from(document.querySelectorAll('.settings-panel[data-settings-panel]'));
                const settingsSectionLabel = document.getElementById('settings-section-label');
                const settingsSaveIndicator = document.getElementById('settings-save-indicator');
                const uiScaleSelect = document.getElementById('ui-scale-select');
                const mapGridToggle = document.getElementById('map-grid-toggle');
                const mapGridCopy = document.getElementById('map-grid-copy');
                const tooltipLevelSelect = document.getElementById('tooltip-level-select');
                const cameraSensitivityRange = document.getElementById('camera-sensitivity-range');
                const cameraSensitivityValue = document.getElementById('camera-sensitivity-value');
                const zoomSensitivityRange = document.getElementById('zoom-sensitivity-range');
                const zoomSensitivityValue = document.getElementById('zoom-sensitivity-value');
                const invertZoomToggle = document.getElementById('invert-zoom-toggle');
                const invertZoomCopy = document.getElementById('invert-zoom-copy');
                const autosaveSelect = document.getElementById('autosave-select');
                const resumeLastCityToggle = document.getElementById('resume-last-city-toggle');
                const resumeLastCityCopy = document.getElementById('resume-last-city-copy');
                const confirmExitToggle = document.getElementById('confirm-exit-toggle');
                const confirmExitCopy = document.getElementById('confirm-exit-copy');
                const monthlySummaryToggle = document.getElementById('monthly-summary-toggle');
                const monthlySummaryCopy = document.getElementById('monthly-summary-copy');
                const lossAlertToggle = document.getElementById('loss-alert-toggle');
                const lossAlertCopy = document.getElementById('loss-alert-copy');
                const alertEnergyToggle = document.getElementById('alert-energy-toggle');
                const alertUnemploymentToggle = document.getElementById('alert-unemployment-toggle');
                const alertPollutionToggle = document.getElementById('alert-pollution-toggle');
                const alertCrimeToggle = document.getElementById('alert-crime-toggle');
                const alertFireToggle = document.getElementById('alert-fire-toggle');
                const alertFrequencySelect = document.getElementById('alert-frequency-select');
                const alertMessagesToggle = document.getElementById('alert-messages-toggle');
                const alertMessagesCopy = document.getElementById('alert-messages-copy');
                const autoTipsToggle = document.getElementById('auto-tips-toggle');
                const autoTipsCopy = document.getElementById('auto-tips-copy');
                const smartAssistToggle = document.getElementById('smart-assist-toggle');
                const smartAssistCopy = document.getElementById('smart-assist-copy');
                const masterVolumeRange = document.getElementById('master-volume-range');
                const masterVolumeValue = document.getElementById('master-volume-value');
                const musicVolumeRange = document.getElementById('music-volume-range');
                const musicVolumeValue = document.getElementById('music-volume-value');
                const effectsVolumeRange = document.getElementById('effects-volume-range');
                const effectsVolumeValue = document.getElementById('effects-volume-value');
                const toast = document.getElementById('toast');
                let toastTimer = null;
                const buildButtons = [
                    btnZoneResidential,
                    btnZoneCommercial,
                    btnZoneIndustrial,
                    btnHospitalSmall,
                    btnPoliceStation,
                    btnFireStation,
                    btnSchool,
                    btnNuclearPlant,
                    btnPark,
                    btnTree,
                    btnWire,
                    btnRoad,
                    btnAvenue,
                    btnBulldozerTool,
                    btnAreaSelect,
                    btnZoneInfo
                ].filter(Boolean);

                function setSelectedBuild(type, button) {
                    selectedBuildType = type;
                    buildButtons.forEach((btn) => btn.classList.remove('selected'));
                    if (button) {
                        button.classList.add('selected');
                        const label = button.querySelector('.tool-option-label');
                        if (activeModeLabel) {
                            activeModeLabel.textContent = label ? label.textContent : button.textContent.trim();
                        }
                    }
                }

                function setToolGroup(group) {
                    const titles = {
                        zones: 'Zonas',
                        roads: 'Estradas',
                        energy: 'Energia',
                        services: 'Servicos',
                        bulldozer: 'Bulldozer'
                    };
                    if (buildSidebar) {
                        buildSidebar.classList.remove('collapsed');
                    }
                    if (hudShell) {
                        hudShell.classList.remove('toolpanel-collapsed');
                    }
                    if (btnToggleBuildMenu) {
                        btnToggleBuildMenu.innerHTML = '&lt;';
                    }
                    toolGroupButtons.forEach((button) => {
                        button.classList.toggle('is-active', button.dataset.buildGroup === group);
                    });
                    groupedBuildButtons.forEach((button) => {
                        button.classList.toggle('is-hidden', button.dataset.buildGroup !== group);
                    });
                    if (toolPanelTitle) {
                        toolPanelTitle.textContent = titles[group] || 'Construcoes';
                    }
                    if (activeModeLabel) {
                        activeModeLabel.textContent = titles[group] || 'Construcoes';
                    }
                    syncViewportLayout();
                }

                function setSidePanelView(viewName) {
                    if (financeDrawer) {
                        financeDrawer.classList.remove('is-collapsed');
                    }
                    if (hudShell) {
                        hudShell.classList.remove('panel-collapsed');
                    }
                    panelToolButtons.forEach((button) => {
                        button.classList.toggle('is-active', button.dataset.panelTool === viewName);
                    });
                    panelViews.forEach((view) => {
                        view.classList.toggle('is-active', view.dataset.panelView === viewName);
                    });
                    syncViewportLayout();
                }

                function toggleSidePanelView(viewName) {
                    const isSameActiveView = panelToolButtons.some((button) => {
                        return button.dataset.panelTool === viewName && button.classList.contains('is-active');
                    });
                    const isCollapsed = financeDrawer ? financeDrawer.classList.contains('is-collapsed') : false;

                    if (isSameActiveView && !isCollapsed) {
                        if (financeDrawer) {
                            financeDrawer.classList.add('is-collapsed');
                        }
                        if (hudShell) {
                            hudShell.classList.add('panel-collapsed');
                        }
                        syncViewportLayout();
                        return;
                    }

                    setSidePanelView(viewName);
                }

                function switchSettingsTab(tabName) {
                    const labels = {
                        interface: 'Interface',
                        controls: 'Controles',
                        save: 'Salvamento',
                        economy: 'Economia',
                        alerts: 'Alertas',
                        experience: 'Experiencia',
                        audio: 'Audio'
                    };
                    settings.activeTab = tabName;
                    settingsNavItems.forEach((button) => {
                        const isActive = button.dataset.settingsTab === tabName;
                        button.classList.toggle('is-active', isActive);
                        button.setAttribute('aria-pressed', String(isActive));
                    });
                    settingsPanels.forEach((panel) => {
                        panel.classList.toggle('is-active', panel.dataset.settingsPanel === tabName);
                    });
                    if (settingsSectionLabel) settingsSectionLabel.textContent = labels[tabName] || 'Configuracoes';
                    if (settingsSaveIndicator) settingsSaveIndicator.textContent = 'Salvo';
                }

                function openSettingsModal() {
                    if (!settingsBackdrop || !settingsModal) return;
                    settingsBackdrop.hidden = false;
                    document.body.style.overflow = 'hidden';
                    settingsModal.focus();
                }

                function closeSettingsModal() {
                    if (!settingsBackdrop) return;
                    settingsBackdrop.hidden = true;
                    document.body.style.overflow = '';
                }

                function syncViewportLayout() {
                    if (!gameScreen.classList.contains('open')) return;
                    window.requestAnimationFrame(() => {
                        window.requestAnimationFrame(() => {
                            resizeGameCanvas({ recenter: false });
                        });
                    });
                }

                // ====== Estado do jogo (persistente) ======
                const gameState = {
                    map: [],
                    buildings: [],
                    roads: [],
                    avenues: [],
                    wires: [],
                    nextBuildingId: 1,
                    money: 10000,
                    population: 0,
                    time: 0,
                    cityTime: 0,
                    difficulty: 'medium',
                    demand: {
                        residential: 0,
                        commercial: 0,
                        industrial: 0,
                        population: 0
                    },
                    demandCaps: {
                        stadium: false,
                        seaport: false,
                        airport: false
                    },
                    taxes: {
                        rate: 7,
                        allocations: {
                            roads: 20,
                            hospitals: 20,
                            schools: 20,
                            services: 20,
                            leisure: 20
                        }
                    }
                };

                // ====== Estado de selecao ======
                let selectedIndex = null;
                let mapList = [];
                let selectedSaveIndex = null;
                let saveList = [];

                // ====== Estado do mapa em jogo ======
                let currentMap = null;
                const baseTileSize = 21;
                const wireRenderScale = Math.max(2, Math.round(window.devicePixelRatio || 1));
                const terrainAtlasTileSize = 108;
                const camera = { x: 0, y: 0, zoom: 2.2 };
                let isSpaceDown = false;
                let isDragging = false;
                let lastMouse = { x: 0, y: 0 };
                let suppressNextViewportClick = false;
                let dragDistance = 0;
                let canvasScale = 1;
                const zoomLimits = { min: 0.6, max: 3.5 };
                const defaultBuildSize = 3;
                const buildCosts = {
                    residential: 100,
                    commercial: 100,
                    industrial: 100,
                    hospital_small: 600,
                    police_station: 500,
                    fire_station: 500,
                    school: 1000,
                    nuclear_plant: 3000,
                    park: 800,
                    tree: 50,
                    wire: 2,
                    bulldozer: 1,
                    road: 5,
                    avenue: 6
                };
                let currentSaveId = null;
                let isDrawingRoad = false;
                let lastRoadPos = null;
                let isDrawingAvenue = false;
                let lastAvenuePos = null;
                let isDrawingWire = false;
                let lastWirePos = null;
                let lastHoverTile = null;
                let isPinching = false;
                let lastPinchDistance = 0;
                const sessionSaveKey = 'citybuilder_session';
                const roadTexture = new Image();
                const roadTextureCanvasV = document.createElement('canvas');
                const roadTextureCanvasH = document.createElement('canvas');
                const roadTurnTexture = new Image();
                const roadTurnCanvasNE = document.createElement('canvas');
                const roadTurnCanvasSE = document.createElement('canvas');
                const roadTurnCanvasSW = document.createElement('canvas');
                const roadTurnCanvasNW = document.createElement('canvas');
                const roadTTexture = new Image();
                const roadTCanvasMissingUp = document.createElement('canvas');
                const roadTCanvasMissingRight = document.createElement('canvas');
                const roadTCanvasMissingDown = document.createElement('canvas');
                const roadTCanvasMissingLeft = document.createElement('canvas');
                const road4Texture = new Image();
                const road4Canvas = document.createElement('canvas');
                const avenueTexture = new Image();
                const avenueCanvasH = document.createElement('canvas');
                const avenueCanvasV = document.createElement('canvas');
                const treeTexture = new Image();
                const noPowerIcon = new Image();
                const emptyBuildingTexture = new Image();
                const constructingFrames = Array.from({ length: 6 }, () => new Image());
                const treeCanvas = document.createElement('canvas');
                const wireTexture = new Image();
                const wireCanvasV = document.createElement('canvas');
                const wireCanvasH = document.createElement('canvas');
                const commercialTexture1 = new Image();
                const commercialTexture2 = new Image();
                const commercialTexture3 = new Image();
                const residentialTexture1 = new Image();
                const residentialTexture2 = new Image();
                const residentialTexture3 = new Image();
                const industrialTexture1 = new Image();
                const industrialTexture2 = new Image();
                const industrialTexture3 = new Image();
                const bridgeTexture = new Image();
                const bridgeTextureCanvasV = document.createElement('canvas');
                const bridgeTextureCanvasH = document.createElement('canvas');
                const bridgeTurnTexture = new Image();
                const bridgeTurnCanvasNE = document.createElement('canvas');
                const bridgeTurnCanvasSE = document.createElement('canvas');
                const bridgeTurnCanvasSW = document.createElement('canvas');
                const bridgeTurnCanvasNW = document.createElement('canvas');
                const grassTexture = new Image();
                const grassTextureCanvas = document.createElement('canvas');
                const grassPatternCanvas = document.createElement('canvas');
                const grassPatternSize = 32;
                const waterTexture = new Image();
                const waterTextureCanvas = document.createElement('canvas');
                const waterPatternSize = 10;
                let waterPatternMain = null;
                const sandTexture = new Image();
                const sandTileCanvas = document.createElement('canvas');
                const sandTransitionTexture = new Image();
                const parkTexture = new Image();
                const schoolTexture = new Image();
                const hospitalTexture = new Image();
                const policeTexture = new Image();
                const fireTexture = new Image();
                const nuclearTexture = new Image();
                let roadTexturesReady = false;
                let roadBaseReady = false;
                let roadTurnReady = false;
                let roadTReady = false;
                let road4Ready = false;
                let avenueReady = false;
                let treeReady = false;
                let noPowerIconReady = false;
                let emptyBuildingReady = false;
                let constructingReady = false;
                const CONSTRUCTING_FRAME_MS = 500;
                const CONSTRUCTING_FRAME_COUNT = 6;
                const BUILD_POWER_ANIM_MS = CONSTRUCTING_FRAME_MS * CONSTRUCTING_FRAME_COUNT;
                let wireReady = false;
                let commercial1Ready = false;
                let commercial2Ready = false;
                let commercial3Ready = false;
                let residential1Ready = false;
                let residential2Ready = false;
                let residential3Ready = false;
                let industrial1Ready = false;
                let industrial2Ready = false;
                let industrial3Ready = false;
                let sandReady = false;
                let sandTransitionReady = false;
                let parkReady = false;
                let schoolReady = false;
                let hospitalReady = false;
                let policeReady = false;
                let fireReady = false;
                let nuclearReady = false;
                let bridgeReady = false;
                let bridgeTurnReady = false;
                let grassReady = false;
                let grassPatternMain = null;
                let selectedBuildType = null;
                let hoverBuildPos = null;
                let hoverBuildValid = false;
                let isAreaSelecting = false;
                let areaSelectionStart = null;
                let areaSelectionEnd = null;
                let areaSelectionRect = null;
                let areaSelectionStats = null;
                let demolitionTimerId = null;
                let demolitionRemaining = 0;

                // ====== Populacao (dinamica) ======
                let population = 0;
                let availableJobs = 0;
                let housingCapacity = 0;
                const VALVE_LIMITS = {
                    residential: 2000,
                    commercial: 1500,
                    industrial: 1500
                };
	                const RES_POP_LEVELS = [0, 16, 24, 32, 40];
	                // Capacidade residencial por nivel de evolucao (resLevel).
	                // Hoje existem 3 patamares (50/100/150); niveis acima saturam em 150
	                // ate adicionarmos um 4o patamar no futuro.
	                const RESIDENTIAL_CAPACITY_LEVELS = [50, 50, 100, 150, 150];
	                const COM_LEVELS_MAX = 5;
	                const IND_LEVELS_MAX = 4;
                const RESIDENTIAL_CAPACITY_PER_TILE = 10;
                const COMMERCIAL_JOBS_PER_TILE = 4;
	                const INDUSTRIAL_JOBS_PER_TILE = 6;
	                let money = 0;
	                let taxRate = 7;
	                // Base tributavel anual (antes da aliquota) por cidadao.
	                let baseIncomePerCitizen = 22;
	                // Base tributavel anual (antes da aliquota) por emprego.
	                const COMMERCIAL_INCOME_PER_JOB = 8;
	                const INDUSTRIAL_INCOME_PER_JOB = 10;
	                // Manutencao anual por tile de infraestrutura (antes de dificuldade).
	                const ROAD_UPKEEP_PER_TILE = 0.22;
	                const WIRE_UPKEEP_PER_TILE = 0.04;
	                const POLICE_UPKEEP_PER_STATION = 220;
	                const FIRE_UPKEEP_PER_STATION = 220;
	                const HOSPITAL_UPKEEP_PER_BUILDING = 180;
	                const SCHOOL_UPKEEP_PER_BUILDING = 160;
	                const PARK_UPKEEP_PER_BUILDING = 70;
	                const SERVICES_UPKEEP_PER_1000_POP = 120;
	                const LEISURE_UPKEEP_PER_1000_POP = 80;
	                let happiness = 50;
	                let complaints = [];

	                // ====== Tempo do jogo (manual Micropolis) ======
	                const TICKS_PER_MONTH = 4;
	                const TICKS_PER_YEAR = 48;
	                const CENSUS_SHORT_TICKS = 4;
	                const CENSUS_LONG_TICKS = 40;
	                let cityTime = 0;
                let gameTime = {
                    year: 1900,
                    month: 1,
                    monthIndex: 0
                };
                let simulationTimer = null;
	                // Escala de tempo (ms por tick). Um ano tem 48 ticks.
	                // Valores mais baixos = tempo passa mais rapido.
	                const SIM_SPEED_SLOW_MS = 1000;
	                const SIM_SPEED_NORMAL_MS = 500;
	                const SIM_SPEED_FAST_MS = 100;
	                let simulationSpeedMs = SIM_SPEED_NORMAL_MS;
                let autosaveTimerId = null;
                let saveIndicatorTimer = null;
                let lastAlertTimestamp = 0;

                const SETTINGS_STORAGE_KEY = 'hid-hud-settings';
                const defaultSettings = {
                    activeTab: 'interface',
                    theme: 'dark',
                    uiScale: 'medium',
                    uiDensity: 'compact',
                    showMapGrid: true,
                    tooltipLevel: 'basic',
                    infoLevel: 'advanced',
                    cameraSensitivity: 50,
                    zoomSensitivity: 50,
                    invertZoom: false,
                    mapMoveMode: 'right-drag',
                    autosave: '1m',
                    resumeLastCity: true,
                    confirmExit: true,
                    revenueMode: 'automatic',
                    monthlySummary: true,
                    lossAlert: true,
                    alertEnergy: true,
                    alertUnemployment: true,
                    alertPollution: true,
                    alertCrime: true,
                    alertFire: true,
                    alertFrequency: 'medium',
                    alertMessages: true,
                    tutorialMode: 'on',
                    autoTips: true,
                    smartAssist: true,
                    masterVolume: 80,
                    musicVolume: 70,
                    effectsVolume: 75
                };

                const F_LEVELS = {
                    easy: 1.4,
                    medium: 1.2,
                    hard: 0.8
                };
                const R_LEVELS = {
                    easy: 0.7,
                    medium: 0.9,
                    hard: 1.2
                };

                function getDifficultyLevel() {
                    return (gameState && gameState.difficulty) ? gameState.difficulty : 'medium';
                }

                function loadSettings() {
                    try {
                        const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
                        return { ...defaultSettings, ...saved };
                    } catch (error) {
                        console.error(error);
                        return { ...defaultSettings };
                    }
                }

                let settings = loadSettings();

                function setBooleanCopy(element, value, onLabel, offLabel) {
                    if (!element) return;
                    element.textContent = value ? onLabel : offLabel;
                }

                function setSaveIndicator(stateName, label) {
                    if (!settingsSaveIndicator) return;
                    settingsSaveIndicator.textContent = label;
                    settingsSaveIndicator.classList.remove('is-dirty', 'is-saved');
                    if (stateName) {
                        settingsSaveIndicator.classList.add(stateName);
                    }
                }

                function queueSavedIndicator() {
                    clearTimeout(saveIndicatorTimer);
                    setSaveIndicator('is-dirty', 'Salvando');
                    saveIndicatorTimer = window.setTimeout(() => {
                        setSaveIndicator('is-saved', 'Salvo');
                    }, 180);
                }

                function saveSettings() {
                    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
                    queueSavedIndicator();
                }

                function applyTooltipMode(value) {
                    const tooltipTargets = document.querySelectorAll('[data-tooltip]');
                    tooltipTargets.forEach((element) => {
                        if (value === 'off') {
                            element.removeAttribute('title');
                            return;
                        }
                        element.setAttribute('title', element.dataset.tooltip || '');
                    });
                }

                function getPanSensitivityMultiplier() {
                    return 0.35 + (settings.cameraSensitivity / 100) * 1.65;
                }

                function getZoomStep() {
                    return 0.03 + (settings.zoomSensitivity / 100) * 0.17;
                }

                function getAutosaveIntervalMs(mode) {
                    if (mode === '30s') return 30000;
                    if (mode === '1m') return 60000;
                    if (mode === '5m') return 300000;
                    return 0;
                }

                function getAlertCooldownMs() {
                    if (settings.alertFrequency === 'high') return 15000;
                    if (settings.alertFrequency === 'low') return 90000;
                    return 45000;
                }

                function shouldUseRightDragPan() {
                    return settings.mapMoveMode === 'right-drag';
                }

                function canPanWithMouse(event) {
                    if (!gameScreen.classList.contains('open')) return false;
                    if (event.button === 0 && isSpaceDown) return true;
                    if (shouldUseRightDragPan() && event.button === 2) return true;
                    return false;
                }

                function startAutosave() {
                    if (autosaveTimerId) {
                        clearInterval(autosaveTimerId);
                        autosaveTimerId = null;
                    }
                    const intervalMs = getAutosaveIntervalMs(settings.autosave);
                    if (!intervalMs) return;
                    autosaveTimerId = setInterval(() => {
                        if (!gameScreen.classList.contains('open')) return;
                        if (currentSaveId) {
                            persistSaveEntry(getCityName(currentSaveId));
                        }
                        saveSession();
                    }, intervalMs);
                }

                const settingsActions = {
                    onThemeChange(value) {
                        document.body.classList.toggle('theme-light', value === 'light');
                    },
                    onUiScaleChange(value) {
                        document.body.dataset.uiScale = value;
                    },
                    onUiDensityChange(value) {
                        document.body.dataset.uiDensity = value;
                    },
                    onShowMapGridChange(value) {
                        document.body.classList.toggle('hide-map-grid', !value);
                    },
                    onTooltipLevelChange(value) {
                        document.body.dataset.tooltipLevel = value;
                        applyTooltipMode(value);
                    },
                    onInfoLevelChange(value) {
                        document.body.dataset.infoLevel = value;
                    },
                    onCameraSensitivityChange(value) {
                        if (cameraSensitivityValue) {
                            cameraSensitivityValue.textContent = String(value);
                        }
                    },
                    onZoomSensitivityChange(value) {
                        if (zoomSensitivityValue) {
                            zoomSensitivityValue.textContent = String(value);
                        }
                    },
                    onInvertZoomChange(value) {
                        setBooleanCopy(invertZoomCopy, value, 'Sim', 'Nao');
                    },
                    onMapMoveModeChange() {
                        isDragging = false;
                        isSpaceDown = false;
                        if (gameViewport) {
                            gameViewport.classList.remove('panning');
                        }
                    },
                    onAutosaveChange() {
                        startAutosave();
                    },
                    onResumeLastCityChange(value) {
                        setBooleanCopy(resumeLastCityCopy, value, 'Sim', 'Nao');
                    },
                    onConfirmExitChange(value) {
                        setBooleanCopy(confirmExitCopy, value, 'Ligado', 'Desligado');
                    },
                    onRevenueModeChange(value) {
                        document.body.dataset.revenueMode = value;
                    },
                    onMonthlySummaryChange(value) {
                        setBooleanCopy(monthlySummaryCopy, value, 'Ligado', 'Desligado');
                    },
                    onLossAlertChange(value) {
                        setBooleanCopy(lossAlertCopy, value, 'Ligado', 'Desligado');
                    },
                    onAlertEnergyChange() {},
                    onAlertUnemploymentChange() {},
                    onAlertPollutionChange() {},
                    onAlertCrimeChange() {},
                    onAlertFireChange() {},
                    onAlertFrequencyChange(value) {
                        document.body.dataset.alertFrequency = value;
                    },
                    onAlertMessagesChange(value) {
                        setBooleanCopy(alertMessagesCopy, value, 'Ligado', 'Desligado');
                    },
                    onTutorialModeChange(value) {
                        document.body.dataset.tutorialMode = value;
                    },
                    onAutoTipsChange(value) {
                        document.body.dataset.autoTips = String(value);
                        setBooleanCopy(autoTipsCopy, value, 'Ligado', 'Desligado');
                    },
                    onSmartAssistChange(value) {
                        document.body.dataset.smartAssist = String(value);
                        setBooleanCopy(smartAssistCopy, value, 'Ligado', 'Desligado');
                    },
                    onMasterVolumeChange(value) {
                        if (masterVolumeValue) masterVolumeValue.textContent = String(value);
                        document.body.style.setProperty('--hud-master-volume', String(value / 100));
                    },
                    onMusicVolumeChange(value) {
                        if (musicVolumeValue) musicVolumeValue.textContent = String(value);
                        document.body.style.setProperty('--hud-music-volume', String(value / 100));
                    },
                    onEffectsVolumeChange(value) {
                        if (effectsVolumeValue) effectsVolumeValue.textContent = String(value);
                        document.body.style.setProperty('--hud-effects-volume', String(value / 100));
                    }
                };

                function applySettings() {
                    Object.entries({
                        theme: 'onThemeChange',
                        uiScale: 'onUiScaleChange',
                        uiDensity: 'onUiDensityChange',
                        showMapGrid: 'onShowMapGridChange',
                        tooltipLevel: 'onTooltipLevelChange',
                        infoLevel: 'onInfoLevelChange',
                        cameraSensitivity: 'onCameraSensitivityChange',
                        zoomSensitivity: 'onZoomSensitivityChange',
                        invertZoom: 'onInvertZoomChange',
                        mapMoveMode: 'onMapMoveModeChange',
                        autosave: 'onAutosaveChange',
                        resumeLastCity: 'onResumeLastCityChange',
                        confirmExit: 'onConfirmExitChange',
                        revenueMode: 'onRevenueModeChange',
                        monthlySummary: 'onMonthlySummaryChange',
                        lossAlert: 'onLossAlertChange',
                        alertEnergy: 'onAlertEnergyChange',
                        alertUnemployment: 'onAlertUnemploymentChange',
                        alertPollution: 'onAlertPollutionChange',
                        alertCrime: 'onAlertCrimeChange',
                        alertFire: 'onAlertFireChange',
                        alertFrequency: 'onAlertFrequencyChange',
                        alertMessages: 'onAlertMessagesChange',
                        tutorialMode: 'onTutorialModeChange',
                        autoTips: 'onAutoTipsChange',
                        smartAssist: 'onSmartAssistChange',
                        masterVolume: 'onMasterVolumeChange',
                        musicVolume: 'onMusicVolumeChange',
                        effectsVolume: 'onEffectsVolumeChange'
                    }).forEach(([key, actionName]) => {
                        if (settingsActions[actionName]) {
                            settingsActions[actionName](settings[key]);
                        }
                    });

                    document.querySelectorAll('input[name="theme"]').forEach((input) => {
                        input.checked = input.value === settings.theme;
                    });
                    if (uiScaleSelect) uiScaleSelect.value = settings.uiScale;
                    document.querySelectorAll('input[name="ui-density"]').forEach((input) => {
                        input.checked = input.value === settings.uiDensity;
                    });
                    if (mapGridToggle) mapGridToggle.checked = settings.showMapGrid;
                    setBooleanCopy(mapGridCopy, settings.showMapGrid, 'Ligado', 'Desligado');
                    if (tooltipLevelSelect) tooltipLevelSelect.value = settings.tooltipLevel;
                    document.querySelectorAll('input[name="info-level"]').forEach((input) => {
                        input.checked = input.value === settings.infoLevel;
                    });
                    if (cameraSensitivityRange) cameraSensitivityRange.value = String(settings.cameraSensitivity);
                    if (zoomSensitivityRange) zoomSensitivityRange.value = String(settings.zoomSensitivity);
                    if (invertZoomToggle) invertZoomToggle.checked = settings.invertZoom;
                    document.querySelectorAll('input[name="map-move-mode"]').forEach((input) => {
                        input.checked = input.value === settings.mapMoveMode;
                    });
                    if (autosaveSelect) autosaveSelect.value = settings.autosave;
                    if (resumeLastCityToggle) resumeLastCityToggle.checked = settings.resumeLastCity;
                    if (confirmExitToggle) confirmExitToggle.checked = settings.confirmExit;
                    document.querySelectorAll('input[name="revenue-mode"]').forEach((input) => {
                        input.checked = input.value === settings.revenueMode;
                    });
                    if (monthlySummaryToggle) monthlySummaryToggle.checked = settings.monthlySummary;
                    if (lossAlertToggle) lossAlertToggle.checked = settings.lossAlert;
                    if (alertEnergyToggle) alertEnergyToggle.checked = settings.alertEnergy;
                    if (alertUnemploymentToggle) alertUnemploymentToggle.checked = settings.alertUnemployment;
                    if (alertPollutionToggle) alertPollutionToggle.checked = settings.alertPollution;
                    if (alertCrimeToggle) alertCrimeToggle.checked = settings.alertCrime;
                    if (alertFireToggle) alertFireToggle.checked = settings.alertFire;
                    if (alertFrequencySelect) alertFrequencySelect.value = settings.alertFrequency;
                    if (alertMessagesToggle) alertMessagesToggle.checked = settings.alertMessages;
                    document.querySelectorAll('input[name="tutorial-mode"]').forEach((input) => {
                        input.checked = input.value === settings.tutorialMode;
                    });
                    if (autoTipsToggle) autoTipsToggle.checked = settings.autoTips;
                    if (smartAssistToggle) smartAssistToggle.checked = settings.smartAssist;
                    if (masterVolumeRange) masterVolumeRange.value = String(settings.masterVolume);
                    if (musicVolumeRange) musicVolumeRange.value = String(settings.musicVolume);
                    if (effectsVolumeRange) effectsVolumeRange.value = String(settings.effectsVolume);

                    switchSettingsTab(settings.activeTab);
                    setSaveIndicator('is-saved', 'Salvo');
                }

                function updateSetting(key, value, actionName) {
                    settings[key] = value;
                    if (actionName && settingsActions[actionName]) {
                        settingsActions[actionName](value);
                    }
                    saveSettings();
                }

                // ====== Feedback do lobby ======
                function updateMessage(text) {
                    if (messageSpan) {
                        messageSpan.innerText = text;
                    }
                }

                // ====== Gera um mapa com agrupamento natural ======

                window.CityBuilder.registerModule('core', {
                    state: window.CityBuilder.defineState({
                        gameState: () => gameState,
                        settings: () => settings
                    }),
                    ...window.CityBuilder.pickFunctions([
                        'setSelectedBuild',
                        'setToolGroup',
                        'setSidePanelView',
                        'toggleSidePanelView',
                        'switchSettingsTab',
                        'openSettingsModal',
                        'closeSettingsModal',
                        'syncViewportLayout',
                        'loadSettings',
                        'saveSettings',
                        'applySettings',
                        'updateSetting',
                        'updateMessage'
                    ])
                });
