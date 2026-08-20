                function getBuildSize(type) {
                    if (type === 'bulldozer') return 1;
                    if (type === 'road') return 1;
                    if (type === 'avenue') return 2;
                    if (type === 'wire') return 1;
                    if (type === 'zone_info') return 1;
                    if (type === 'hospital_small') return 4;
                    if (type === 'police_station') return 3;
                    if (type === 'fire_station') return 3;
                    if (type === 'school') return 4;
                    if (type === 'nuclear_plant') return 4;
                    if (type === 'park') return 3;
                    if (type === 'tree') return 1;
                    return defaultBuildSize;
                }

                function getBuildCost(type) {
                    return buildCosts[type] || 0;
                }

                // ====== Impostos ======
                function ensureTaxState() {
                    if (!gameState.taxes) {
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
                    }
                    if (!gameState.taxes.allocations) {
                        gameState.taxes.allocations = {
                            roads: 20,
                            hospitals: 20,
                            schools: 20,
                            services: 20,
                            leisure: 20
                        };
                    }
                }

                function ensureDemandState() {
                    if (!gameState.demand) {
                        gameState.demand = {
                            residential: 0,
                            commercial: 0,
                            industrial: 0,
                            population: 0
                        };
                    }
                    if (typeof gameState.demand.population !== 'number') {
                        gameState.demand.population = 0;
                    }
                    if (typeof gameState.demand.residential !== 'number') gameState.demand.residential = 0;
                    if (typeof gameState.demand.commercial !== 'number') gameState.demand.commercial = 0;
                    if (typeof gameState.demand.industrial !== 'number') gameState.demand.industrial = 0;
                    if (!gameState.demandCaps) {
                        gameState.demandCaps = { stadium: false, seaport: false, airport: false };
                    }
                    if (!gameState.difficulty) {
                        gameState.difficulty = 'medium';
                    }
                    if (typeof gameState.cityTime !== 'number') {
                        gameState.cityTime = 0;
                    }
                }

                function updateTaxValueDisplays() {
                    if (taxRateValue) taxRateValue.textContent = `${taxRateSlider.value}%`;
                    if (taxRoadsValue) taxRoadsValue.textContent = `${taxRoadsSlider.value}%`;
                    if (taxHospitalsValue) taxHospitalsValue.textContent = `${taxHospitalsSlider.value}%`;
                    if (taxSchoolsValue) taxSchoolsValue.textContent = `${taxSchoolsSlider.value}%`;
                    if (taxServicesValue) taxServicesValue.textContent = `${taxServicesSlider.value}%`;
                    if (taxLeisureValue) taxLeisureValue.textContent = `${taxLeisureSlider.value}%`;
                }

                function syncTaxModalFromState() {
                    ensureTaxState();
                    taxRateSlider.value = gameState.taxes.rate;
                    taxRoadsSlider.value = gameState.taxes.allocations.roads;
                    taxHospitalsSlider.value = gameState.taxes.allocations.hospitals;
                    taxSchoolsSlider.value = gameState.taxes.allocations.schools;
                    taxServicesSlider.value = gameState.taxes.allocations.services;
                    taxLeisureSlider.value = gameState.taxes.allocations.leisure;
                    updateTaxValueDisplays();
                }

                function applyTaxesFromUI() {
                    ensureTaxState();
                    gameState.taxes.rate = Number(taxRateSlider.value);
                    gameState.taxes.allocations.roads = Number(taxRoadsSlider.value);
                    gameState.taxes.allocations.hospitals = Number(taxHospitalsSlider.value);
                    gameState.taxes.allocations.schools = Number(taxSchoolsSlider.value);
                    gameState.taxes.allocations.services = Number(taxServicesSlider.value);
                    gameState.taxes.allocations.leisure = Number(taxLeisureSlider.value);
                    taxRate = gameState.taxes.rate;
                }

                function openTaxModal() {
                    syncTaxModalFromState();
                    setSidePanelView('taxes');
                }

                function closeTaxModal() {
                    setSidePanelView('analysis');
                }

                // ====== Crescimento da populacao ======
                function calculateHousing() {
                    let capacity = 0;
                    gameState.buildings.forEach((b) => {
                        if (b.type !== 'residential') return;
                        if (b.zone && b.zone.maxCapacity) {
                            capacity += b.zone.maxCapacity;
                        } else {
                            const size = b.size || defaultBuildSize;
                            capacity += (size * size) * RESIDENTIAL_CAPACITY_PER_TILE;
                        }
                    });
                    housingCapacity = capacity;
                    return capacity;
                }

                function calculateJobs() {
                    let jobs = 0;
                    gameState.buildings.forEach((b) => {
                        if (b.zone && b.zone.jobs) {
                            jobs += b.zone.jobs;
                            return;
                        }
                        const size = b.size || defaultBuildSize;
                        if (b.type === 'commercial') {
                            jobs += (size * size) * COMMERCIAL_JOBS_PER_TILE;
                        }
                        if (b.type === 'industrial') {
                            jobs += (size * size) * INDUSTRIAL_JOBS_PER_TILE;
                        }
                    });
                    availableJobs = jobs;
                    return jobs;
                }

                function clampValve(value, limit) {
                    return Math.max(-limit, Math.min(limit, value));
                }

                function updatePopulation() {
                    calculateHousing();
                    calculateJobs();
                    let demand = (availableJobs * 1.2) - gameState.population;
                    const currentTaxRate = gameState.taxes ? gameState.taxes.rate : taxRate;
                    if (currentTaxRate > 15) {
                        demand -= (currentTaxRate - 15) * 2;
                    }
                    if (gameState.demandCaps) {
                        const capPenaltyCount = ['stadium', 'seaport', 'airport'].filter((key) => gameState.demandCaps[key] === true).length;
                        if (capPenaltyCount > 0) {
                            demand *= (1 - (0.15 * capPenaltyCount));
                        }
                    }
                    if (gameState.buildings && gameState.buildings.some((b) => b.zone && b.zone.type === 'residential')) {
                        population = gameState.population;
                        gameState.demand.population = demand;
                        gameState.demand.residential = clampValve(Math.round(demand), VALVE_LIMITS.residential);
                        gameState.demand.commercial = clampValve(Math.round(gameState.demand.commercial || 0), VALVE_LIMITS.commercial);
                        gameState.demand.industrial = clampValve(Math.round(gameState.demand.industrial || 0), VALVE_LIMITS.industrial);
                        return;
                    }
                    // Futuro: aplicar modificadores (felicidade, impostos, energia, estradas, poluicao).
                    const growth = demand * 0.05;

                    if (gameState.population < housingCapacity || demand < 0) {
                        gameState.population += growth;
                    }

                    if (gameState.population > housingCapacity) {
                        gameState.population = housingCapacity;
                    }
                    if (gameState.population < 0) {
                        gameState.population = 0;
                    }

                    population = gameState.population;
                    gameState.demand.population = demand;
                    gameState.demand.residential = clampValve(Math.round(demand), VALVE_LIMITS.residential);
                    gameState.demand.commercial = clampValve(Math.round(gameState.demand.commercial || 0), VALVE_LIMITS.commercial);
                    gameState.demand.industrial = clampValve(Math.round(gameState.demand.industrial || 0), VALVE_LIMITS.industrial);
                }

	                function calculateAverageLandValue() {
	                    if (!Array.isArray(gameState.buildings) || gameState.buildings.length === 0) return 0;
	                    let sum = 0;
	                    let count = 0;
                    gameState.buildings.forEach((b) => {
                        if (!b.zone) return;
                        const score = typeof b.zone.landValueScore === 'number' ? b.zone.landValueScore : 0;
                        const clampedScore = Math.max(-5, Math.min(5, score));
                        const value = Math.round(((clampedScore + 5) / 10) * 250);
                        sum += value;
                        count += 1;
                    });
	                    return count > 0 ? Math.round(sum / count) : 0;
	                }

	                function clampPercent(value) {
	                    const n = Number(value);
	                    if (!Number.isFinite(n)) return 0;
	                    return Math.max(0, Math.min(100, Math.round(n)));
	                }

	                function getFundingLevels() {
	                    ensureTaxState();
	                    const allocations = gameState.taxes && gameState.taxes.allocations ? gameState.taxes.allocations : {};
	                    return {
	                        roads: clampPercent(allocations.roads),
	                        hospitals: clampPercent(allocations.hospitals),
	                        schools: clampPercent(allocations.schools),
	                        services: clampPercent(allocations.services),
	                        leisure: clampPercent(allocations.leisure)
	                    };
	                }

	                function collectTaxes() {
	                    taxRate = gameState.taxes ? gameState.taxes.rate : taxRate;
	                    const totalPop = Math.max(0, Math.round(gameState.population));
	                    const landValueAverage = calculateAverageLandValue();
	                    const taxRateDecimal = taxRate / 100;
	                    const difficulty = getDifficultyLevel();

	                    // Multiplicador por valor do solo (0..250) => 0.75..1.5
	                    const landValueMultiplier = 0.75 + (Math.max(0, Math.min(250, landValueAverage)) / 250) * 0.75;

	                    let commercialJobsTotal = 0;
	                    let industrialJobsTotal = 0;
	                    if (Array.isArray(gameState.buildings)) {
	                        gameState.buildings.forEach((b) => {
	                            const size = b.size || defaultBuildSize;
	                            if (b.type === 'commercial') {
	                                const jobs = b.zone && typeof b.zone.jobs === 'number' ? b.zone.jobs : (size * size) * COMMERCIAL_JOBS_PER_TILE;
	                                commercialJobsTotal += Math.max(0, Math.round(jobs));
	                            }
	                            if (b.type === 'industrial') {
	                                const jobs = b.zone && typeof b.zone.jobs === 'number' ? b.zone.jobs : (size * size) * INDUSTRIAL_JOBS_PER_TILE;
	                                industrialJobsTotal += Math.max(0, Math.round(jobs));
	                            }
	                        });
	                    }

	                    const citizenBase = totalPop * baseIncomePerCitizen * landValueMultiplier;
	                    const businessBase = (commercialJobsTotal * COMMERCIAL_INCOME_PER_JOB) + (industrialJobsTotal * INDUSTRIAL_INCOME_PER_JOB);
	                    const taxableBase = citizenBase + businessBase;
	                    const fund = Math.floor(taxableBase * taxRateDecimal * (F_LEVELS[difficulty] || F_LEVELS.medium));
	                    return Math.max(0, fund);
	                }

                function collectRevenueIfNeeded() {
                    if (settings.revenueMode === 'automatic') {
                        applyAnnualBudget();
                    }
                }

	                function applyAnnualBudget() {
	                    const taxFund = collectTaxes();
	                    const difficulty = getDifficultyLevel();
	                    const funding = getFundingLevels();
	                    const totalPop = Math.max(0, Math.round(gameState.population));
	                    const policeStations = Array.isArray(gameState.buildings)
	                        ? gameState.buildings.filter((b) => b.type === 'police_station').length
	                        : 0;
	                    const fireStations = Array.isArray(gameState.buildings)
	                        ? gameState.buildings.filter((b) => b.type === 'fire_station').length
	                        : 0;
	                    const hospitals = Array.isArray(gameState.buildings)
	                        ? gameState.buildings.filter((b) => b.type === 'hospital_small').length
	                        : 0;
	                    const schools = Array.isArray(gameState.buildings)
	                        ? gameState.buildings.filter((b) => b.type === 'school').length
	                        : 0;
	                    const parks = Array.isArray(gameState.buildings)
	                        ? gameState.buildings.filter((b) => b.type === 'park').length
	                        : 0;
	                    const roadTiles = Array.isArray(gameState.roads) ? gameState.roads.length : 0;
	                    const avenueTiles = Array.isArray(gameState.avenues) ? (gameState.avenues.length * 2) : 0;
	                    const wireTiles = Array.isArray(gameState.wires) ? gameState.wires.length : 0;
	                    const infraTiles = roadTiles + avenueTiles;
	                    const railCost = Array.isArray(gameState.rails) ? (gameState.rails.length * 2) : 0;

	                    const roadRequired = Math.floor((infraTiles + railCost) * ROAD_UPKEEP_PER_TILE * (R_LEVELS[difficulty] || R_LEVELS.medium));
	                    const wireRequired = Math.floor(wireTiles * WIRE_UPKEEP_PER_TILE * (R_LEVELS[difficulty] || R_LEVELS.medium));
	                    const hospitalRequired = hospitals * HOSPITAL_UPKEEP_PER_BUILDING;
	                    const schoolRequired = schools * SCHOOL_UPKEEP_PER_BUILDING;
	                    const servicesRequired = Math.floor((totalPop / 1000) * SERVICES_UPKEEP_PER_1000_POP)
	                        + (policeStations * POLICE_UPKEEP_PER_STATION)
	                        + (fireStations * FIRE_UPKEEP_PER_STATION);
	                    const leisureRequired = Math.floor((totalPop / 1000) * LEISURE_UPKEEP_PER_1000_POP)
	                        + (parks * PARK_UPKEEP_PER_BUILDING);

	                    const roadBudget = Math.floor(roadRequired * (funding.roads / 100));
	                    const wireBudget = Math.floor(wireRequired * (funding.roads / 100));
	                    const hospitalBudget = Math.floor(hospitalRequired * (funding.hospitals / 100));
	                    const schoolBudget = Math.floor(schoolRequired * (funding.schools / 100));
	                    const servicesBudget = Math.floor(servicesRequired * (funding.services / 100));
	                    const leisureBudget = Math.floor(leisureRequired * (funding.leisure / 100));

	                    const totalExpense = roadBudget + wireBudget + hospitalBudget + schoolBudget + servicesBudget + leisureBudget;
	                    const cashFlow = taxFund - totalExpense;
	                    gameState.money = Math.round(gameState.money + cashFlow);
	                    if (gameState.money < 0) gameState.money = 0;
	                    gameState.lastCashFlow = cashFlow;
	                    gameState.lastTaxFund = taxFund;
	                    gameState.lastExpense = totalExpense;
	                    gameState.budgetShortfall = cashFlow < 0;
	                    gameState.lastBudget = {
	                        taxFund,
	                        expense: totalExpense,
	                        cashFlow,
	                        funding,
	                        required: {
	                            road: roadRequired,
	                            wire: wireRequired,
	                            hospitals: hospitalRequired,
	                            schools: schoolRequired,
	                            services: servicesRequired,
	                            leisure: leisureRequired
	                        },
	                        spent: {
	                            roads: roadBudget,
	                            wires: wireBudget,
	                            hospitals: hospitalBudget,
	                            schools: schoolBudget,
	                            services: servicesBudget,
	                            leisure: leisureBudget,
	                            total: totalExpense
	                        }
	                    };
	                }

                let buildingPowerAnimRafId = null;

                function hasActiveBuildingPowerAnimations() {
                    if (!Array.isArray(gameState.buildings) || gameState.buildings.length === 0) return false;
                    const now = Date.now();
                    return gameState.buildings.some((b) =>
                        (b && b.powerAnimPending === true) ||
                        (typeof b.powerAnimUntil === 'number' && b.powerAnimUntil > now)
                    );
                }

                function ensureBuildingPowerAnimationLoop() {
                    if (buildingPowerAnimRafId !== null) return;
                    const tick = () => {
                        renderGameMap();
                        if (!hasActiveBuildingPowerAnimations()) {
                            buildingPowerAnimRafId = null;
                            return;
                        }
                        buildingPowerAnimRafId = window.requestAnimationFrame(tick);
                    };
                    buildingPowerAnimRafId = window.requestAnimationFrame(tick);
                }

                function updatePowerState() {
                    if (!Array.isArray(gameState.buildings)) return;
                    if (!Array.isArray(gameState.wires)) gameState.wires = [];

                    const previousPowered = new WeakMap();
                    gameState.buildings.forEach((b) => previousPowered.set(b, b.powered));

                    const wireSet = new Set(gameState.wires.map((w) => `${w.x},${w.y}`));
                    const poweredWires = new Set();
                    const queue = [];
                    const plantTiles = [];

                    gameState.buildings.forEach((b) => {
                        if (b.type !== 'nuclear_plant') return;
                        const size = b.size || defaultBuildSize;
                        for (let oy = 0; oy < size; oy++) {
                            for (let ox = 0; ox < size; ox++) {
                                plantTiles.push({ x: b.x + ox, y: b.y + oy });
                            }
                        }
                    });

                    const addWireNeighbor = (x, y) => {
                        const key = `${x},${y}`;
                        if (wireSet.has(key)) queue.push({ x, y });
                    };

                    plantTiles.forEach((t) => {
                        addWireNeighbor(t.x + 1, t.y);
                        addWireNeighbor(t.x - 1, t.y);
                        addWireNeighbor(t.x, t.y + 1);
                        addWireNeighbor(t.x, t.y - 1);
                    });

                    while (queue.length) {
                        const node = queue.shift();
                        const key = `${node.x},${node.y}`;
                        if (poweredWires.has(key)) continue;
                        poweredWires.add(key);
                        const neighbors = [
                            { x: node.x + 1, y: node.y },
                            { x: node.x - 1, y: node.y },
                            { x: node.x, y: node.y + 1 },
                            { x: node.x, y: node.y - 1 }
                        ];
                        neighbors.forEach((n) => {
                            const nKey = `${n.x},${n.y}`;
                            if (wireSet.has(nKey) && !poweredWires.has(nKey)) {
                                queue.push(n);
                            }
                        });
                    }

                    gameState.buildings.forEach((b) => {
                        b.powered = b.type === 'tree';
                    });

                    const poweredBuildingTiles = new Set();

                    const addBuildingTiles = (b) => {
                        const size = b.size || defaultBuildSize;
                        for (let oy = 0; oy < size; oy++) {
                            for (let ox = 0; ox < size; ox++) {
                                poweredBuildingTiles.add(`${b.x + ox},${b.y + oy}`);
                            }
                        }
                    };

                    // Nucleares sempre geram energia
                    gameState.buildings.forEach((b) => {
                        if (b.type === 'nuclear_plant') {
                            b.powered = true;
                            addBuildingTiles(b);
                        }
                    });

                    let changed = true;
                    while (changed) { 
                        changed = false; 
                        gameState.buildings.forEach((b) => { 
                            if (b.powered) return; 
                            const size = b.size || defaultBuildSize;
                            let powered = false;
                            for (let oy = 0; oy < size; oy++) {
                                for (let ox = 0; ox < size; ox++) {
                                    const x = b.x + ox;
                                    const y = b.y + oy;
                                    if (poweredWires.has(`${x + 1},${y}`) ||
                                        poweredWires.has(`${x - 1},${y}`) ||
                                        poweredWires.has(`${x},${y + 1}`) ||
                                        poweredWires.has(`${x},${y - 1}`) ||
                                        poweredBuildingTiles.has(`${x + 1},${y}`) ||
                                        poweredBuildingTiles.has(`${x - 1},${y}`) ||
                                        poweredBuildingTiles.has(`${x},${y + 1}`) ||
                                        poweredBuildingTiles.has(`${x},${y - 1}`)) {
                                        powered = true;
                                        break;
                                    }
                                }
                                if (powered) break;
                            }
                            if (powered) {
                                b.powered = true;
                                addBuildingTiles(b);
                                changed = true;
                            } 
                        }); 
                    } 

                    const now = Date.now();
                    let shouldAnimate = false;
                    gameState.buildings.forEach((b) => {
                        if (b.powered === false) {
                            b.powerAnimUntil = null;
                            b.powerAnimPending = false;
                            b.powerAnimStartedAt = null;
                            return;
                        }
                        const wasPowered = previousPowered.get(b);
                        if (wasPowered === false && b.powered === true) {
                            b.powerAnimUntil = null;
                            b.powerAnimPending = true;
                            b.powerAnimStartedAt = null;
                            shouldAnimate = true;
                        }
                    });
                    if (shouldAnimate && constructingReady) ensureBuildingPowerAnimationLoop();
                } 

                // ====== Informacoes da cidade ======
                const HOSPITAL_CAPACITY_PER_TILE = 8;
                const SCHOOL_CAPACITY_PER_TILE = 10;
                const WORKFORCE_RATIO = 0.55;
                const STUDENT_RATIO = 0.2;

                function calculateResidentialTiles() {
                    let tiles = 0;
                    gameState.buildings.forEach((b) => {
                        if (b.type !== 'residential') return;
                        const size = b.size || defaultBuildSize;
                        tiles += size * size;
                    });
                    return tiles;
                }

                function calculateHospitalCapacity() {
                    let capacity = 0;
                    gameState.buildings.forEach((b) => {
                        if (b.type !== 'hospital_small') return;
                        const size = b.size || defaultBuildSize;
                        capacity += (size * size) * HOSPITAL_CAPACITY_PER_TILE;
                    });
                    return capacity;
                }

                function calculateSchoolCapacity() {
                    let capacity = 0;
                    gameState.buildings.forEach((b) => {
                        if (b.type !== 'school') return;
                        const size = b.size || defaultBuildSize;
                        capacity += (size * size) * SCHOOL_CAPACITY_PER_TILE;
                    });
                    return capacity;
                }

                function getSafetyLevel() {
                    const policeCount = gameState.buildings.filter((b) => b.type === 'police_station').length;
                    if (policeCount >= 4) return 'Quase zero';
                    if (policeCount >= 2) return 'Baixa';
                    if (policeCount >= 1) return 'Segura';
                    return 'Criminalidade alta';
                }

                // ====== Zonas dinamicas ======
                function ensureZoneState(building) {
                    if (!building.zone) {
                        building.zone = {
                            type: ['residential', 'commercial', 'industrial'].includes(building.type)
                                ? building.type
                                : ['hospital_small', 'police_station', 'fire_station', 'school', 'nuclear_plant', 'park', 'tree'].includes(building.type)
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
                        };
                    } else {
                        if (typeof building.zone.fireScore !== 'number') building.zone.fireScore = 0;
                        if (typeof building.zone.fire !== 'string') building.zone.fire = fireLabel(building.zone.fireScore);
                        if (typeof building.zone.devLevel !== 'number') building.zone.devLevel = 0;
                        if (typeof building.zone.resLevel !== 'number') building.zone.resLevel = 0;
                    }
                }

                function ensureZonesForLoadedBuildings() {
                    if (!Array.isArray(gameState.buildings)) return;
                    gameState.buildings.forEach((b) => ensureZoneState(b));
                }

                function analyzeSurroundings(building, radius) {
                    const near = { commercial: 0, industrial: 0, public: 0, residential: 0 };
                    const cx = building.x;
                    const cy = building.y;
                    gameState.buildings.forEach((b) => {
                        if (b === building) return;
                        const dx = Math.abs((b.x + (b.size || defaultBuildSize) / 2) - cx);
                        const dy = Math.abs((b.y + (b.size || defaultBuildSize) / 2) - cy);
                        if (dx > radius || dy > radius) return;
                        if (b.type === 'commercial') near.commercial += 1;
                        if (b.type === 'industrial') near.industrial += 1;
                        if (b.type === 'residential') near.residential += 1;
                        if (['hospital_small', 'police_station', 'fire_station', 'school', 'nuclear_plant', 'park', 'tree'].includes(b.type)) near.public += 1;
                    });
                    return near;
                }

                function getRandom16Signed() {
                    return Math.floor(Math.random() * 65536) - 32768;
                }

                function hasRoadAccess(building) {
                    const roadSet = new Set((gameState.roads || []).map((r) => `${r.x},${r.y}`));
                    const avenueSet = new Set();
                    (gameState.avenues || []).forEach((a) => {
                        if (a.dir === 'h') {
                            avenueSet.add(`${a.x},${a.y}`);
                            avenueSet.add(`${a.x + 1},${a.y}`);
                        } else {
                            avenueSet.add(`${a.x},${a.y}`);
                            avenueSet.add(`${a.x},${a.y + 1}`);
                        }
                    });
                    if (!roadSet.size && !avenueSet.size) return false;
                    const size = building.size || defaultBuildSize;
                    for (let oy = 0; oy < size; oy++) {
                        for (let ox = 0; ox < size; ox++) {
                            const tx = building.x + ox;
                            const ty = building.y + oy;
                            if (roadSet.has(`${tx + 1},${ty}`) || avenueSet.has(`${tx + 1},${ty}`)) return true;
                            if (roadSet.has(`${tx - 1},${ty}`) || avenueSet.has(`${tx - 1},${ty}`)) return true;
                            if (roadSet.has(`${tx},${ty + 1}`) || avenueSet.has(`${tx},${ty + 1}`)) return true;
                            if (roadSet.has(`${tx},${ty - 1}`) || avenueSet.has(`${tx},${ty - 1}`)) return true;
                        }
                    }
                    return false;
                }

                function hasNearbyZone(building, type, radius) {
                    return gameState.buildings.some((b) => {
                        if (b.type !== type) return false;
                        const dx = Math.abs((b.x + (b.size || defaultBuildSize) / 2) - (building.x + (building.size || defaultBuildSize) / 2));
                        const dy = Math.abs((b.y + (b.size || defaultBuildSize) / 2) - (building.y + (building.size || defaultBuildSize) / 2));
                        return dx <= radius && dy <= radius;
                    });
                }

                function getResidentialLocationScore(zone, near) {
                    const base = (zone.landValueScore || 0) * 600;
                    const bonus = (near.commercial || 0) * 60;
                    const penalty = (near.industrial || 0) * 120;
                    return Math.max(-3000, Math.min(3000, Math.round(base + bonus - penalty)));
                }

                function getCommercialLocationScore(building) {
                    if (!currentMap) return 0;
                    const centerX = currentMap.width / 2;
                    const centerY = currentMap.height / 2;
                    const dx = (building.x - centerX);
                    const dy = (building.y - centerY);
                    const dist = Math.hypot(dx, dy);
                    const maxDist = Math.hypot(centerX, centerY) || 1;
                    const normalized = Math.min(1, dist / maxDist);
                    return Math.round((1 - normalized) * 128 - 64);
                }

                function getPollutionValue(zone) {
                    const score = typeof zone.pollutionScore === 'number' ? zone.pollutionScore : 0;
                    return Math.max(0, Math.min(250, Math.round(score * 25)));
                }

                function updateValvesFromEconomy() {
                    const jobDemand = Math.round((gameState.population * 1.1) - availableJobs);
                    const resValve = clampValve(Math.round(availableJobs - gameState.population), VALVE_LIMITS.residential);
                    const baseJobValve = clampValve(Math.round(jobDemand), VALVE_LIMITS.industrial);
                    const comValve = clampValve(Math.round(baseJobValve * 0.5), VALVE_LIMITS.commercial);
                    const indValve = clampValve(Math.round(baseJobValve * 0.5), VALVE_LIMITS.industrial);
                    gameState.demand.residential = resValve;
                    gameState.demand.commercial = comValve;
                    gameState.demand.industrial = indValve;
                    return { resValve, comValve, indValve };
                }

	                function applyMicropolisGrowth(building, zone, near, valves) {
                    const isPowered = building.powered !== false;
                    const type = zone.type;
                    const shouldEvaluate = zone.population === 0
                        || (type !== 'residential' && zone.devLevel === 0)
                        || (Math.random() < (1 / 7));
                    if (!shouldEvaluate) return;

                    let zoneScore = 0;
                    let trafficFail = false;

                    if (type === 'residential') {
                        const pollutionValue = getPollutionValue(zone);
                        if (pollutionValue > 128) {
                            zoneScore = -3000;
                        } else {
                            zoneScore = (valves.resValve || 0) + getResidentialLocationScore(zone, near);
                        }
                        if (!isPowered) zoneScore = -500;
                        trafficFail = !hasNearbyZone(building, 'commercial', 6) || !hasRoadAccess(building);
                    } else if (type === 'commercial') {
                        zoneScore = (valves.comValve || 0) + getCommercialLocationScore(building);
                        if (!isPowered) zoneScore = -500;
                        trafficFail = !hasNearbyZone(building, 'industrial', 6) || !hasRoadAccess(building);
                        if (trafficFail) zoneScore -= 1000;
                    } else if (type === 'industrial') {
                        zoneScore = (valves.indValve || 0);
                        trafficFail = !hasNearbyZone(building, 'residential', 6) || !hasRoadAccess(building);
                        if (trafficFail) zoneScore -= 1000;
                        if (!isPowered) zoneScore = -500;
                    }

                    const rand = getRandom16Signed();
                    const grows = zoneScore > -350 && (zoneScore - 26380) > rand;
                    const degrades = zoneScore < 350 && (zoneScore + 26380) < rand;

	                    if (type === 'residential') {
	                        let level = Math.max(0, Math.min(4, zone.resLevel || 0));
	                        if (grows && level < 4) level += 1;
	                        if (degrades && level > 0) level -= 1;
	                        zone.resLevel = level;
	                        zone.maxCapacity = calculateResidentialCapacity(zone);
	                        if (typeof zone.population === 'number' && zone.population > zone.maxCapacity) {
	                            zone.population = zone.maxCapacity;
	                        }
	                        zone.level = Math.max(1, Math.min(3, Math.ceil(level / 2)));
	                    } else if (type === 'commercial') {
                        let level = Math.max(0, Math.min(COM_LEVELS_MAX, zone.devLevel || 0));
                        if (grows && level < COM_LEVELS_MAX) level += 1;
                        if (degrades && level > 0) level -= 1;
                        zone.devLevel = level;
                        const baseJobs = calculateCommercialJobs(zone);
                        zone.jobs = Math.round((level / COM_LEVELS_MAX) * baseJobs);
                        zone.level = Math.max(1, Math.min(3, Math.ceil(level / 2)));
                    } else if (type === 'industrial') {
                        let level = Math.max(0, Math.min(IND_LEVELS_MAX, zone.devLevel || 0));
                        if (grows && level < IND_LEVELS_MAX) level += 1;
                        if (degrades && level > 0) level -= 1;
                        zone.devLevel = level;
                        const baseJobs = calculateIndustrialJobs(zone);
                        zone.jobs = Math.round((level / IND_LEVELS_MAX) * baseJobs);
                        zone.level = Math.max(1, Math.min(3, Math.ceil(level / 2)));
                    }
                }

                function isBuildingWithinTreeAura(tree, building) {
                    const radius = 2;
                    const minX = tree.x - radius;
                    const maxX = tree.x + radius;
                    const minY = tree.y - radius;
                    const maxY = tree.y + radius;
                    const buildingSize = building.size || defaultBuildSize;
                    const buildingMaxX = building.x + buildingSize - 1;
                    const buildingMaxY = building.y + buildingSize - 1;
                    return building.x <= maxX && buildingMaxX >= minX && building.y <= maxY && buildingMaxY >= minY;
                }

                function applyTreePollutionRelief(treeBuilding) {
                    if (!treeBuilding || treeBuilding.type !== 'tree' || !Array.isArray(gameState.buildings)) return;
                    gameState.buildings.forEach((building) => {
                        if (!building.zone || building === treeBuilding) return;
                        if (!isBuildingWithinTreeAura(treeBuilding, building)) return;
                        building.zone.pollutionScore = Math.max(0, (building.zone.pollutionScore || 0) - 5);
                    });
                }

                function densityLabel(score) {
                    if (score >= 9) return 'Muito alto';
                    if (score >= 6) return 'Alto';
                    if (score >= 3) return 'Medio';
                    return 'Baixo';
                }

                function landValueLabel(score) {
                    if (score <= -3) return 'Favela';
                    if (score <= 0) return 'Classe baixa';
                    if (score <= 3) return 'Classe media';
                    return 'Classe alta';
                }

                function crimeLabel(score) {
                    return score >= 5 ? 'Perigoso' : 'Seguro';
                }

                function pollutionLabel(score) {
                    if (score <= 0) return 'Nenhum';
                    if (score <= 4) return 'Baixo';
                    return 'Alto';
                }

                function fireLabel(score) {
                    if (score <= 0) return 'Nenhum';
                    if (score <= 4) return 'Baixo';
                    return 'Alto';
                }

                function growthLabel(score) {
                    if (score >= 6) return 'Auge';
                    if (score > 0) return 'Crescendo';
                    if (score < 0) return 'Em declinio';
                    return 'Estavel';
                }

	                function calculateResidentialCapacity(zone) {
	                    if (typeof zone.resLevel === 'number') {
	                        const idx = Math.max(0, Math.min(RESIDENTIAL_CAPACITY_LEVELS.length - 1, Math.round(zone.resLevel)));
	                        return RESIDENTIAL_CAPACITY_LEVELS[idx];
	                    }
	                    let base = 500;
	                    if (zone.densityLevel === 2) base = 2000;
	                    if (zone.densityLevel === 3) base = 5000;
	                    return base * zone.level;
	                }

                function calculateIndustrialJobs(zone) {
                    let base = 300;
                    if (zone.densityLevel === 2) base = 1200;
                    if (zone.densityLevel === 3) base = 3000;
                    return base * zone.level;
                }

                function calculateCommercialJobs(zone) {
                    let base = 100;
                    if (zone.densityLevel === 2) base = 400;
                    if (zone.densityLevel === 3) base = 1200;
                    return base * zone.level;
                }

                function updateZoneLevel(zone) {
                    if (zone.growthScore > 0 && zone.level < 3 && zone.pollutionScore < 5) {
                        zone.level += 1;
                    }
                    if (zone.growthScore < 0 && zone.level > 1) {
                        zone.level -= 1;
                    }
                }

	                function densityLevelFromScore(score) {
	                    if (score >= 6) return 3;
	                    if (score >= 3) return 2;
	                    return 1;
	                }

	                function approachZero(value, step) {
	                    if (typeof value !== 'number' || Number.isNaN(value)) return 0;
	                    if (value > 0) return Math.max(0, value - step);
	                    if (value < 0) return Math.min(0, value + step);
	                    return 0;
	                }

	                function clampNumber(value, min, max) {
	                    const n = Number(value);
	                    if (!Number.isFinite(n)) return min;
	                    return Math.max(min, Math.min(max, n));
	                }

	                function updateZoneDynamics(tick, census = {}) {
                    if (!Array.isArray(gameState.buildings)) return;
                    updatePowerState();
                    const radius = 4;
                    let totalPopulation = 0;
                    calculateJobs();
                    calculateHousing();
                    const globalDemand = (availableJobs * 1.2) - gameState.population;
                    const valves = updateValvesFromEconomy();
                    const isShortCensus = Boolean(census.short);
                    const isLongCensus = Boolean(census.long);
                    const cityAgeYears = Math.floor((typeof tick === 'number' ? tick : cityTime) / TICKS_PER_YEAR);

	                    gameState.buildings.forEach((b) => {
	                        ensureZoneState(b);
	                        const zone = b.zone;
	                        const near = analyzeSurroundings(b, radius);
	                        const isPowered = b.powered !== false;

                        if (isShortCensus) {
                            zone.pollutionScore = Math.max(0, zone.pollutionScore + (near.industrial > 1 ? 3 : 0) - (near.public > 0 ? 1 : 0));
                            zone.crimeScore = Math.max(0, zone.crimeScore + (near.public > 0 ? -2 : 0) + (near.industrial > 1 ? 1 : 0));
                            // Risco de incendio: piora com industria e densidade, melhora com presenca de servicos publicos.
                            const densityPenalty = zone.densityLevel >= 3 ? 1 : 0;
                            zone.fireScore = Math.max(0, (zone.fireScore || 0) + (near.industrial > 1 ? 1 : 0) + densityPenalty - (near.public > 0 ? 1 : 0));
                        }

	                        if (isLongCensus) {
	                            // Decaimento para evitar que scores só acumulem e tudo vire "classe alta".
	                            zone.landValueScore = approachZero(zone.landValueScore || 0, 1);
	                            zone.growthScore = approachZero(zone.growthScore || 0, 1);
	                            zone.densityScore = approachZero(zone.densityScore || 0, 1);
	                            zone.pollutionScore = Math.max(0, (zone.pollutionScore || 0) - 1);
	                            zone.crimeScore = Math.max(0, (zone.crimeScore || 0) - 1);
	                            zone.fireScore = Math.max(0, (zone.fireScore || 0) - 1);

	                            zone.landValueScore += (near.commercial > 2 ? 2 : 0);
	                            zone.growthScore += (near.commercial > 2 ? 2 : 0);

	                            // Industria sempre pesa (mesmo 1 proximo). Mais industria = pior.
	                            if (near.industrial >= 1) {
	                                zone.pollutionScore += 2;
	                                zone.landValueScore -= 2;
	                                zone.growthScore -= 1;
	                            }
	                            if (near.industrial >= 3) {
	                                zone.pollutionScore += 2;
	                                zone.landValueScore -= 2;
	                                zone.growthScore -= 1;
	                            }

	                            if (zone.pollutionScore < 2 && near.industrial === 0) {
	                                zone.landValueScore += 2;
	                            }

	                            if (zone.pollutionScore > 5) {
	                                zone.landValueScore -= 3;
	                                zone.densityScore += 1;
	                            }

	                            if (near.public > 0) {
	                                zone.crimeScore = Math.max(0, zone.crimeScore - 2);
	                                zone.landValueScore += 1;
	                                zone.growthScore += 1;
	                            }

                            // Parques reduzem poluicao em um raio maior
                            const parkInfluence = gameState.buildings.some((p) => {
                                if (p.type !== 'park') return false;
                                const dx = Math.abs((p.x + (p.size || defaultBuildSize) / 2) - (b.x + (b.size || defaultBuildSize) / 2));
                                const dy = Math.abs((p.y + (p.size || defaultBuildSize) / 2) - (b.y + (b.size || defaultBuildSize) / 2));
                                return dx <= 15 && dy <= 15;
                            });
                            const policeInfluence = gameState.buildings.some((p) => {
                                if (p.type !== 'police_station') return false;
                                const dx = Math.abs((p.x + (p.size || defaultBuildSize) / 2) - (b.x + (b.size || defaultBuildSize) / 2));
                                const dy = Math.abs((p.y + (p.size || defaultBuildSize) / 2) - (b.y + (b.size || defaultBuildSize) / 2));
                                return dx <= 15 && dy <= 15;
                            });
                            const fireInfluence = gameState.buildings.some((p) => {
                                if (p.type !== 'fire_station') return false;
                                const dx = Math.abs((p.x + (p.size || defaultBuildSize) / 2) - (b.x + (b.size || defaultBuildSize) / 2));
                                const dy = Math.abs((p.y + (p.size || defaultBuildSize) / 2) - (b.y + (b.size || defaultBuildSize) / 2));
                                return dx <= 15 && dy <= 15;
                            });
                            if (parkInfluence) {
                                zone.pollutionScore = Math.max(0, zone.pollutionScore - 6);
                                zone.growthScore += 2;
                            }
                            const treeInfluence = gameState.buildings.filter((tree) => {
                                return tree.type === 'tree' && isBuildingWithinTreeAura(tree, b);
                            }).length;
                            if (treeInfluence > 0) {
                                zone.pollutionScore = Math.max(0, zone.pollutionScore - (treeInfluence * 5));
                            }
	                            if (policeInfluence) {
	                                zone.crimeScore = Math.max(0, zone.crimeScore - 6);
	                                zone.growthScore += 1;
	                            }
	                            if (fireInfluence) {
	                                zone.fireScore = Math.max(0, (zone.fireScore || 0) - 6);
	                                zone.growthScore += 1;
	                            }

                                // Risco alto de incendio prejudica valor do solo e crescimento
                                if ((zone.fireScore || 0) > 6) {
                                    zone.landValueScore -= 2;
                                    zone.growthScore -= 1;
                                }

	                            if (!isPowered && ['residential', 'commercial', 'industrial'].includes(zone.type)) {
	                                zone.growthScore -= 2;
	                                zone.landValueScore -= 1;
	                            }

	                            // Acesso e seguranca impactam valor do solo.
	                            if (['residential', 'commercial', 'industrial'].includes(zone.type)) {
	                                const hasAccess = hasRoadAccess(b);
	                                if (!hasAccess) {
	                                    zone.growthScore -= 2;
	                                    zone.landValueScore -= 1;
	                                }
	                                if ((zone.crimeScore || 0) > 6) zone.landValueScore -= 2;
	                                if ((zone.pollutionScore || 0) > 6) zone.landValueScore -= 2;
	                            }

	                            zone.densityLevel = densityLevelFromScore(zone.densityScore);
	                            updateZoneLevel(zone);
	                            if (zone.type === 'residential') {
	                                zone.maxCapacity = calculateResidentialCapacity(zone);
	                                zone.maxCapacity = Math.max(0, Math.round(zone.maxCapacity || 0));
	                            }
	                            if (zone.type === 'industrial') {
	                                zone.jobs = isPowered ? calculateIndustrialJobs(zone) : 0;
	                            }
	                            if (zone.type === 'commercial') {
	                                zone.jobs = isPowered ? calculateCommercialJobs(zone) : 0;
	                            }
	                            if (['residential', 'commercial', 'industrial'].includes(zone.type)) {
	                                applyMicropolisGrowth(b, zone, near, valves);
	                            }

	                            // Clamp final (evita runaway e estabiliza classe).
	                            zone.landValueScore = clampNumber(zone.landValueScore || 0, -8, 8);
	                            zone.growthScore = clampNumber(zone.growthScore || 0, -10, 10);
	                            zone.densityScore = clampNumber(zone.densityScore || 0, 0, 12);
	                            zone.pollutionScore = clampNumber(zone.pollutionScore || 0, 0, 12);
	                            zone.crimeScore = clampNumber(zone.crimeScore || 0, 0, 12);
	                            zone.fireScore = clampNumber(zone.fireScore || 0, 0, 12);
	                        }

                        if (isLongCensus) {
                            if (zone.type === 'residential') {
                                const capacity = zone.maxCapacity || calculateResidentialCapacity(zone);
                                let growthModifier = 0;
                                if (happiness > 60) growthModifier += 1;
                                if (happiness < 40) growthModifier -= 1;
                                const baseGrowth = globalDemand > 0 ? 2 : 0;
                                const baseDecline = globalDemand < 0 ? 1 : 0;
                                const earlyBoost = cityAgeYears <= 3 ? 2 : (cityAgeYears <= 8 ? 1 : 0);
                                if (!isPowered) {
                                    zone.population = Math.max(0, zone.population - 10);
                                } else if ((zone.growthScore > 0 || baseGrowth > 0) && zone.population < capacity) {
                                    zone.population = Math.min(
                                        capacity,
                                        zone.population + (Math.max(1, zone.growthScore + baseGrowth + growthModifier + earlyBoost) * 40)
                                    );
                                } else if (zone.growthScore < 0 || baseDecline > 0) {
                                    zone.population = Math.max(
                                        0,
                                        zone.population - Math.max(1, Math.abs(zone.growthScore) + baseDecline + Math.abs(growthModifier))
                                    );
                                }
                                if (happiness < 30) {
                                    zone.population = Math.max(0, zone.population - 1);
                                }
                            } else {
                                zone.population = 0;
                            }
                        }

                        if (zone.type === 'residential') {
                            const cap = zone.maxCapacity || calculateResidentialCapacity(zone);
                            zone.occupancy = `${Math.round(zone.population).toLocaleString('pt-BR')}/${Math.round(cap).toLocaleString('pt-BR')}`;
                        } else if (zone.type === 'commercial' || zone.type === 'industrial') {
                            const jobs = zone.jobs || 0;
                            zone.occupancy = `${Math.round(jobs).toLocaleString('pt-BR')}`;
                        } else if (zone.type === 'public') {
                            const size = b.size || defaultBuildSize;
                            if (b.type === 'hospital_small') {
                                const cap = (size * size) * HOSPITAL_CAPACITY_PER_TILE;
                                zone.occupancy = `${Math.round(Math.min(gameState.population, cap)).toLocaleString('pt-BR')}/${Math.round(cap).toLocaleString('pt-BR')}`;
                            } else if (b.type === 'school') {
                                const cap = (size * size) * SCHOOL_CAPACITY_PER_TILE;
                                zone.occupancy = `${Math.round(Math.min(gameState.population, cap)).toLocaleString('pt-BR')}/${Math.round(cap).toLocaleString('pt-BR')}`;
                            } else {
                                zone.occupancy = 'ND';
                            }
                        }

                        zone.density = densityLabel(zone.densityScore);
                        zone.landValue = landValueLabel(zone.landValueScore);
                        zone.crime = crimeLabel(zone.crimeScore);
                        zone.pollution = pollutionLabel(zone.pollutionScore);
                        zone.fire = fireLabel(zone.fireScore);
                        zone.growth = growthLabel(zone.growthScore);

                        if (zone.type === 'residential') {
                            totalPopulation += zone.population;
                        }
                    });

                    // Suavizacao espacial do valor do solo
                    const zoneValueScores = new Map();
                    gameState.buildings.forEach((b) => {
                        ensureZoneState(b);
                        zoneValueScores.set(b.id, b.zone.landValueScore);
                    });
	                    gameState.buildings.forEach((b) => {
	                        const zone = b.zone;
	                        if (!zone) return;
                        let sum = zoneValueScores.get(b.id) || 0;
                        let count = 1;
                        gameState.buildings.forEach((other) => {
                            if (other === b) return;
                            const dx = Math.abs((other.x + (other.size || defaultBuildSize) / 2) - (b.x + (b.size || defaultBuildSize) / 2));
                            const dy = Math.abs((other.y + (other.size || defaultBuildSize) / 2) - (b.y + (b.size || defaultBuildSize) / 2));
                            if (dx <= 2 && dy <= 2) {
                                sum += zoneValueScores.get(other.id) || 0;
                                count += 1;
                            }
                        });
	                        zone.landValueScore = Math.round(sum / count);
	                        zone.landValueScore = clampNumber(zone.landValueScore || 0, -8, 8);
	                        zone.landValue = landValueLabel(zone.landValueScore);
	                    });

	                    if (totalPopulation > 0) {
	                        gameState.population = totalPopulation;
	                    }
	                    refreshZoneModalIfOpen();
	                }

                function updateCityInfo() {
                    calculateHousing();
                    calculateJobs();
                    const capacity = housingCapacity;
                    const residents = Math.min(Math.round(gameState.population), capacity);
                    const workforce = Math.round(gameState.population * WORKFORCE_RATIO);
                    const employed = Math.min(workforce, availableJobs);
                    const hospitalCapacity = calculateHospitalCapacity();
                    const schoolCapacity = calculateSchoolCapacity();
                    const hospitalLoad = hospitalCapacity > 0 ? Math.min(100, (gameState.population / hospitalCapacity) * 100) : 0;
                    const students = Math.round(gameState.population * STUDENT_RATIO);
                    const schoolLoad = schoolCapacity > 0 ? Math.min(100, (students / schoolCapacity) * 100) : 0;
                    const pollutionLevel = Math.min(10, Math.max(0, Math.round(calculateAveragePollution())));
                    if (infoPopulation) infoPopulation.textContent = Math.round(gameState.population).toLocaleString('pt-BR');
                    if (infoResidences) infoResidences.textContent = `${capacity.toLocaleString('pt-BR')}/${residents.toLocaleString('pt-BR')}`;
                    if (infoAcceptance) infoAcceptance.textContent = `${Math.round(happiness)}%`;
                    if (infoJobs) infoJobs.textContent = Math.round(availableJobs).toLocaleString('pt-BR');
                    if (infoEmployed) infoEmployed.textContent = Math.round(employed).toLocaleString('pt-BR');
                    if (infoHospitalLoad) infoHospitalLoad.textContent = `${Math.round(hospitalLoad)}%`;
                    if (infoSchoolLoad) infoSchoolLoad.textContent = `${Math.round(schoolLoad)}%`;
                    if (infoPollutionLevel) infoPollutionLevel.textContent = pollutionLevel.toLocaleString('pt-BR');
                    if (infoSafety) infoSafety.textContent = getSafetyLevel();
                }

                function setMetricValue(key, value, inverted = false) {
                    const fill = document.querySelector(`[data-metric-fill="${key}"]`);
                    const text = document.querySelector(`[data-metric-text="${key}"]`);
                    let level = 'bad';
                    if (!inverted) {
                        if (value >= 70) level = 'good';
                        else if (value >= 45) level = 'warn';
                    } else {
                        if (value <= 30) level = 'good';
                        else if (value <= 60) level = 'warn';
                    }
                    if (fill) {
                        fill.style.width = `${value}%`;
                        fill.dataset.level = level;
                    }
                    if (text) {
                        text.textContent = `${Math.round(value)}%`;
                    }
                }

                function formatMonthlyCurrencyDelta(value) {
                    const rounded = Math.round(value);
                    const prefix = rounded > 0 ? '+' : '';
                    return `${prefix}$ ${rounded.toLocaleString('pt-BR')}`;
                }

                function maybeShowMonthlySummary(previousMoney) {
                    if (!settings.monthlySummary) return;
                    const delta = gameState.money - previousMoney;
                    showToast(`Resumo mensal: ${formatMonthlyCurrencyDelta(delta)}`);
                }

                function maybeShowLossAlert(previousMoney) {
                    if (!settings.lossAlert) return;
                    if (gameState.money >= previousMoney) return;
                    if (gameState.money > 0) return;
                    showToast('Tesouro zerado. Revise impostos e gastos.');
                }

                function maybeEmitCityAlerts() {
                    const now = Date.now();
                    if (now - lastAlertTimestamp < getAlertCooldownMs()) return;

                    calculateHousing();
                    calculateJobs();
                    updatePowerState();

                    const workforce = Math.round(gameState.population * WORKFORCE_RATIO);
                    const hasEnergyIssue = Array.isArray(gameState.buildings) && gameState.buildings.some((building) => {
                        return building.type !== 'nuclear_plant' && building.type !== 'park' && building.type !== 'tree' && !building.powered;
                    });
                    const hasUnemploymentIssue = availableJobs < workforce;
                    const hasPollutionIssue = calculateAveragePollution() > 5;
                    const hasCrimeIssue = calculateAverageCrime() > 5;
                    const hasFireIssue = calculateAverageFire() > 5;

                    const alerts = [];
                    if (settings.alertEnergy && hasEnergyIssue) {
                        alerts.push(settings.alertMessages ? 'Alerta: parte da cidade esta sem energia.' : 'Sem energia');
                    }
                    if (settings.alertUnemployment && hasUnemploymentIssue) {
                        alerts.push(settings.alertMessages ? 'Alerta: desemprego acima do ideal.' : 'Desemprego alto');
                    }
                    if (settings.alertPollution && hasPollutionIssue) {
                        alerts.push(settings.alertMessages ? 'Alerta: poluicao elevada em zonas urbanas.' : 'Poluicao alta');
                    }
                    if (settings.alertCrime && hasCrimeIssue) {
                        alerts.push(settings.alertMessages ? 'Alerta: criminalidade em crescimento.' : 'Crime alto');
                    }
                    if (settings.alertFire && hasFireIssue) {
                        alerts.push(settings.alertMessages ? 'Alerta: risco de incendio elevado em zonas urbanas.' : 'Incendio alto');
                    }

                    if (!alerts.length) return;
                    lastAlertTimestamp = now;
                    showToast(alerts[0]);
                }

                function getCityCategory(populationValue) {
                    if (populationValue < 2000) return 'Village';
                    if (populationValue < 10000) return 'Town';
                    if (populationValue < 50000) return 'City';
                    if (populationValue < 100000) return 'Capital';
                    if (populationValue < 500000) return 'Metropolis';
                    return 'Megalopolis';
                }

                function updateAnalysisMetrics() {
                    calculateHousing();
                    calculateJobs();
                    const workforce = Math.max(1, Math.round(gameState.population * WORKFORCE_RATIO));
                    const employed = Math.min(workforce, availableJobs);
                    const employment = Math.min(100, Math.round((employed / workforce) * 100));
                    const health = Math.min(100, Math.round(calculateHospitalCapacity() > 0 ? (gameState.population / Math.max(calculateHospitalCapacity(), 1)) * 100 : 0));
                    const educationDemand = Math.max(1, Math.round(gameState.population * STUDENT_RATIO));
                    const education = Math.min(100, Math.round(calculateSchoolCapacity() > 0 ? (Math.round(gameState.population * STUDENT_RATIO) / Math.max(calculateSchoolCapacity(), 1)) * 100 : 0));
                    const housing = housingCapacity > 0 ? Math.min(100, Math.round((gameState.population / housingCapacity) * 100)) : 0;
                    const pollution = Math.min(100, Math.round(calculateAveragePollution() * 10));
                    const crime = Math.min(100, Math.round(calculateAverageCrime() * 10));
                    const fire = Math.min(100, Math.round(calculateAverageFire() * 10));

                    setMetricValue('employment', employment);
                    setMetricValue('health', 100 - Math.min(100, health), true);
                    setMetricValue('education', 100 - Math.min(100, education), true);
                    setMetricValue('housing', housing);
                    setMetricValue('pollution', pollution, true);
                    setMetricValue('crime', crime, true);
                    setMetricValue('fire', fire, true);

                    const approvalYes = document.getElementById('evaluation-approval-yes');
                    const approvalNo = document.getElementById('evaluation-approval-no');
                    const evaluationPopulation = document.getElementById('evaluation-population');
                    const evaluationMigration = document.getElementById('evaluation-migration');
                    const evaluationCityValue = document.getElementById('evaluation-city-value');
                    const evaluationCategory = document.getElementById('evaluation-category');
                    const evaluationProblems = document.getElementById('evaluation-problems');
                    const approval = Math.round(happiness);
                    const disapproval = Math.max(0, 100 - approval);
                    const cityValue = (gameState.money || 0) + (gameState.buildings.length * 250) + (gameState.roads.length * 5);

                    if (approvalYes) approvalYes.textContent = `${approval}%`;
                    if (approvalNo) approvalNo.textContent = `${disapproval}%`;
                    if (evaluationPopulation) evaluationPopulation.textContent = Math.round(gameState.population).toLocaleString('pt-BR');
                    if (evaluationMigration) evaluationMigration.textContent = employed >= workforce ? '+' + Math.max(0, employed - workforce).toLocaleString('pt-BR') : '-' + Math.max(0, workforce - employed).toLocaleString('pt-BR');
                    if (evaluationCityValue) evaluationCityValue.textContent = `$ ${Math.round(cityValue).toLocaleString('pt-BR')}`;
                    if (evaluationCategory) evaluationCategory.textContent = getCityCategory(gameState.population);
                    if (evaluationProblems) {
                        evaluationProblems.innerHTML = '';
                        const items = complaints.length ? complaints.slice(0, 4) : ['Sem reclamacoes'];
                        items.forEach((item) => {
                            const chip = document.createElement('span');
                            chip.className = 'evaluation-chip';
                            chip.textContent = item;
                            evaluationProblems.appendChild(chip);
                        });
                    }
                }

                function calculateAveragePollution() {
                    if (!Array.isArray(gameState.buildings) || gameState.buildings.length === 0) return 0;
                    let sum = 0;
                    let count = 0;
                    gameState.buildings.forEach((b) => {
                        if (b.zone) {
                            sum += b.zone.pollutionScore || 0;
                            count += 1;
                        }
                    });
                    let avg = count > 0 ? sum / count : 0;
                    const parkCount = gameState.buildings.filter((b) => b.type === 'park').length;
                    if (parkCount > 0) {
                        avg = Math.max(0, avg - (parkCount * 2));
                    }
                    return avg;
                }

                function calculateAverageCrime() {
                    if (!Array.isArray(gameState.buildings) || gameState.buildings.length === 0) return 0;
                    let sum = 0;
                    let count = 0;
                    gameState.buildings.forEach((b) => {
                        if (b.zone) {
                            sum += b.zone.crimeScore || 0;
                            count += 1;
                        }
                    });
                    return count > 0 ? sum / count : 0;
                }

                function calculateAverageFire() {
                    if (!Array.isArray(gameState.buildings) || gameState.buildings.length === 0) return 0;
                    let sum = 0;
                    let count = 0;
                    gameState.buildings.forEach((b) => {
                        if (b.zone) {
                            sum += b.zone.fireScore || 0;
                            count += 1;
                        }
                    });
                    return count > 0 ? sum / count : 0;
                }

	                function updateHappiness() {
	                    happiness = 50;
	                    complaints = [];
	                    calculateHousing();
	                    calculateJobs();
	                    const workforce = Math.round(gameState.population * WORKFORCE_RATIO);

                    if (availableJobs < workforce) {
                        happiness -= 15;
                        complaints.push('Falta de empregos');
                    } else {
                        happiness += 10;
                    }

                    if (housingCapacity < gameState.population || (housingCapacity > 0 && (gameState.population / housingCapacity) > 0.9)) {
                        happiness -= 15;
                        complaints.push('Falta de moradia');
                    }

	                    if (taxRate > 15) {
	                        happiness -= (taxRate - 15) * 2;
	                        complaints.push('Impostos altos');
	                    } else {
	                        happiness += 5;
	                    }

	                    // Orçamento e financiamento (impacta aprovacao e crescimento).
	                    const lastBudget = gameState.lastBudget;
	                    if (lastBudget && lastBudget.funding && lastBudget.required) {
	                        if (typeof lastBudget.cashFlow === 'number' && lastBudget.cashFlow < 0) {
	                            happiness -= 10;
	                            complaints.push('Orcamento deficitario');
	                        }
	                        const infraRequired = (lastBudget.required.road || 0) + (lastBudget.required.wire || 0);
	                        if (infraRequired > 0 && (lastBudget.funding.roads || 0) < 40) {
	                            happiness -= 8;
	                            complaints.push('Manutencao de infraestrutura baixa');
	                        }
	                        const hospitalCapacity = calculateHospitalCapacity();
	                        const hospitalLoad = hospitalCapacity > 0 ? (gameState.population / hospitalCapacity) * 100 : 0;
	                        if (hospitalLoad > 90 && (lastBudget.funding.hospitals || 0) < 60) {
	                            happiness -= 6;
	                            complaints.push('Saude subfinanciada');
	                        }
	                        const schoolCapacity = calculateSchoolCapacity();
	                        const students = Math.round(gameState.population * STUDENT_RATIO);
	                        const schoolLoad = schoolCapacity > 0 ? (students / schoolCapacity) * 100 : 0;
	                        if (schoolLoad > 90 && (lastBudget.funding.schools || 0) < 60) {
	                            happiness -= 6;
	                            complaints.push('Educacao subfinanciada');
	                        }
	                        const hasSecurityBuildings = Array.isArray(gameState.buildings)
	                            ? gameState.buildings.some((b) => b.type === 'police_station' || b.type === 'fire_station')
	                            : false;
	                        if (hasSecurityBuildings && (lastBudget.funding.services || 0) < 45) {
	                            happiness -= 6;
	                            complaints.push('Servicos subfinanciados');
	                        }
	                    }

	                    const pollutionLevel = calculateAveragePollution();
	                    if (pollutionLevel > 5) {
	                        happiness -= 10;
	                        complaints.push('Muita poluicao');
	                    }

                        const fireLevel = calculateAverageFire();
                        if (fireLevel > 5) {
                            happiness -= 8;
                            complaints.push('Risco de incendio');
                        }

                     const crimeLevel = calculateAverageCrime();
                     if (crimeLevel > 5) {
                         happiness -= 10;
                         complaints.push('Alta criminalidade');
                    }

                    const publicServices = gameState.buildings.filter((b) => ['hospital_small', 'police_station', 'fire_station', 'school', 'park'].includes(b.type)).length;
                    const idealServices = Math.max(1, Math.ceil(gameState.population / 200));
                    if (publicServices < idealServices) {
                        happiness -= 10;
                        complaints.push('Falta de servicos publicos');
                    } else {
                        happiness += 10;
                    }

                    const leisureLevel = gameState.buildings.filter((b) => b.type === 'park').length;
                    if (leisureLevel < 3) {
                        happiness -= 5;
                        complaints.push('Falta de lazer');
                    }

                    if (complaints.length === 0) {
                        happiness += 10;
                    }

                    happiness = Math.max(0, Math.min(100, happiness));
                    updateHappinessUI();
                }

                function getHappinessStatus() {
                    if (happiness <= 20) return 'Muito ruim';
                    if (happiness <= 40) return 'Ruim';
                    if (happiness <= 60) return 'Neutro';
                    if (happiness <= 80) return 'Bom';
                    return 'Excelente';
                }

                function updateHappinessUI() {
                    if (happinessFill) {
                        happinessFill.style.width = `${happiness}%`;
                    }
                    if (happinessStatus) {
                        happinessStatus.textContent = `Felicidade: ${Math.round(happiness)} (${getHappinessStatus()})`;
                    }
                    if (topbarHappiness) {
                        topbarHappiness.textContent = `${Math.round(happiness)}`;
                    }
                    if (complaintsList) {
                        complaintsList.innerHTML = '';
                        const items = complaints.length ? complaints.slice(0, 3) : ['Sem reclamacoes'];
                        items.forEach((text) => {
                            const li = document.createElement('li');
                            li.textContent = text;
                            complaintsList.appendChild(li);
                        });
                    }
                    if (ratingHappinessFill) {
                        ratingHappinessFill.style.width = `${happiness}%`;
                    }
                    if (ratingHappinessStatus) {
                        ratingHappinessStatus.textContent = `Felicidade: ${Math.round(happiness)} (${getHappinessStatus()})`;
                    }
                    if (ratingComplaintsList) {
                        ratingComplaintsList.innerHTML = '';
                        const items = complaints.length ? complaints.slice(0, 3) : ['Sem reclamacoes'];
                        items.forEach((text) => {
                            const li = document.createElement('li');
                            li.textContent = text;
                            ratingComplaintsList.appendChild(li);
                        });
                    }
                    updateAnalysisMetrics();
                }

                function openCityModal() {
                    updateCityInfo();
                    setSidePanelView('analysis');
                }

                function closeCityModal() {
                    setSidePanelView('analysis');
                }

                function getZoneLabel(type) {
                    if (type === 'residential') return 'Residencial';
                    if (type === 'commercial') return 'Comercial';
                    if (type === 'industrial') return 'Industrial';
                    if (['hospital_small', 'police_station', 'fire_station', 'school', 'nuclear_plant', 'park'].includes(type)) return 'Prefeitura';
                    return 'ND';
                }

	                function getZoneInfoFromBuilding(building) {
                    if (!building) {
                        return {
                            zone: 'ND',
                            occupancy: '0',
                            density: 'ND',
                            value: 'ND',
                                crime: 'ND',
                                pollution: 'ND',
                                fire: 'ND',
                                growth: 'ND'
                            };
                        }

                    if (building.zone) {
                        return {
                            zone: getZoneLabel(building.zone.type || building.type),
                            occupancy: building.zone.occupancy || '0',
                            density: building.zone.density || 'ND',
                            value: building.zone.landValue || 'ND',
                            crime: building.zone.crime || 'ND',
                            pollution: building.zone.pollution || 'ND',
                            fire: building.zone.fire || 'ND',
                            growth: building.zone.growth || 'ND'
                        };
                    }

                    let density = 'Baixo';
                    const size = building.size || defaultBuildSize;
                    if (size >= 6) density = 'Muito alto';
                    else if (size >= 4) density = 'Alto';
                    else if (size >= 3) density = 'Medio';

                    let value = 'Classe media';
                    if (building.type === 'industrial') value = 'Classe baixa';
                    if (building.type === 'commercial') value = 'Classe alta';

                    let crime = 'Seguro';
                    let pollution = 'Baixo';
                    let fire = 'Baixo';
                    if (building.type === 'industrial') {
                        pollution = 'Alto';
                        crime = 'Perigoso';
                        fire = 'Alto';
                    }
                    if (building.type === 'nuclear_plant') {
                        pollution = 'Alto';
                    }

	                    return {
	                        zone: getZoneLabel(building.type),
	                        occupancy: '0',
	                        density,
	                        value,
	                        crime,
	                        pollution,
	                        fire,
	                        growth: 'Crescendo'
	                    };
	                }

	                let activeZoneModalBuildingId = null;

	                function refreshZoneModalIfOpen() {
	                    if (!zoneModal || !zoneModal.classList.contains('open')) return;
	                    if (!activeZoneModalBuildingId) return;
	                    const building = Array.isArray(gameState.buildings)
	                        ? gameState.buildings.find((b) => b && b.id === activeZoneModalBuildingId)
	                        : null;
	                    if (!building) return;
	                    const info = getZoneInfoFromBuilding(building);
	                    zoneTypeValue.textContent = info.zone;
	                    zoneOccupancyValue.textContent = info.occupancy || '0';
	                    zoneDensityValue.textContent = info.density;
	                    zoneValueValue.textContent = info.value;
	                    zoneCrimeValue.textContent = info.crime;
	                    zonePollutionValue.textContent = info.pollution;
	                    zoneFireValue.textContent = info.fire;
	                    zoneGrowthValue.textContent = info.growth;
	                }

	                function openZoneModal(building) {
	                    activeZoneModalBuildingId = building && building.id ? building.id : null;
	                    const info = getZoneInfoFromBuilding(building);
	                    zoneTypeValue.textContent = info.zone;
	                    zoneOccupancyValue.textContent = info.occupancy || '0';
	                    zoneDensityValue.textContent = info.density;
                    zoneValueValue.textContent = info.value;
                    zoneCrimeValue.textContent = info.crime;
                    zonePollutionValue.textContent = info.pollution;
                    zoneFireValue.textContent = info.fire;
                    zoneGrowthValue.textContent = info.growth;
	                    zoneModal.classList.add('open');
	                    zoneModal.setAttribute('aria-hidden', 'false');
	                }

	                function closeZoneModal() {
	                    activeZoneModalBuildingId = null;
	                    zoneModal.classList.remove('open');
	                    zoneModal.setAttribute('aria-hidden', 'true');
	                }

                if (areaCancelBtn) {
                    areaCancelBtn.addEventListener('click', () => {
                        closeAreaModal();
                        areaSelectionRect = null;
                        areaSelectionStats = null;
                        renderGameMap();
                    });
                }

                if (areaConfirmBtn) {
                    areaConfirmBtn.addEventListener('click', () => {
                        if (!areaSelectionStats) return;
                        if (gameState.money < areaSelectionStats.cost) {
                            showToast('Capital insuficiente');
                            return;
                        }
                        if (demolitionTimerId) {
                            showToast('Demolicao em andamento');
                            return;
                        }
                        gameState.money = Math.max(0, Math.round(gameState.money - areaSelectionStats.cost));
                        startDemolitionTimer(areaSelectionStats);
                        closeAreaModal();
                        areaSelectionRect = null;
                        areaSelectionStats = null;
                        updateFinanceUI();
                        renderGameMap();
                    });
                }

                function openRatingModal() {
                    updateHappinessUI();
                    setSidePanelView('evaluation');
                }

                function closeRatingModal() {
                    setSidePanelView('analysis');
                }

                function finalizeRoadTextures() {
                    roadTexturesReady = roadBaseReady && roadTurnReady && roadTReady && road4Ready;
                    if (roadTexturesReady) {
                        renderGameMap();
                    }
                }

                function drawRotatedTexture(source, canvas, angle) {
                    canvas.width = baseTileSize;
                    canvas.height = baseTileSize;
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.clearRect(0, 0, baseTileSize, baseTileSize);
                    ctx.translate(baseTileSize / 2, baseTileSize / 2);
                    ctx.rotate(angle);
                    ctx.drawImage(source, -baseTileSize / 2, -baseTileSize / 2, baseTileSize, baseTileSize);
                }

                // ====== Texturas da rua ======
                roadTexture.onload = () => {
                    // vertical (original)
                    roadTextureCanvasV.width = baseTileSize;
                    roadTextureCanvasV.height = baseTileSize;
                    const vctx = roadTextureCanvasV.getContext('2d');
                    vctx.imageSmoothingEnabled = true;
                    vctx.clearRect(0, 0, baseTileSize, baseTileSize);
                    vctx.drawImage(roadTexture, 0, 0, baseTileSize, baseTileSize);

                    // horizontal (rotacionado)
                    roadTextureCanvasH.width = baseTileSize;
                    roadTextureCanvasH.height = baseTileSize;
                    const hctx = roadTextureCanvasH.getContext('2d');
                    hctx.imageSmoothingEnabled = true;
                    hctx.clearRect(0, 0, baseTileSize, baseTileSize);
                    hctx.translate(baseTileSize / 2, baseTileSize / 2);
                    hctx.rotate(Math.PI / 2);
                    hctx.drawImage(roadTexture, -baseTileSize / 2, -baseTileSize / 2, baseTileSize, baseTileSize);

                    roadBaseReady = true;
                    finalizeRoadTextures();
                };
                roadTexture.src = 'src/assets/street.svg';

                roadTurnTexture.onload = () => {
                    // base assumida: curva SE (baixo -> direita)
                    drawRotatedTexture(roadTurnTexture, roadTurnCanvasSE, 0);
                    drawRotatedTexture(roadTurnTexture, roadTurnCanvasSW, Math.PI / 2);
                    drawRotatedTexture(roadTurnTexture, roadTurnCanvasNW, Math.PI);
                    drawRotatedTexture(roadTurnTexture, roadTurnCanvasNE, -Math.PI / 2);

                    roadTurnReady = true;
                    finalizeRoadTextures();
                };
                roadTurnTexture.src = 'src/assets/street-turn.svg';

                roadTTexture.onload = () => {
                    // base assumida: T sem conexao para baixo (ligada em cima + esquerda + direita)
                    drawRotatedTexture(roadTTexture, roadTCanvasMissingDown, 0);
                    drawRotatedTexture(roadTTexture, roadTCanvasMissingLeft, Math.PI / 2);
                    drawRotatedTexture(roadTTexture, roadTCanvasMissingRight, -Math.PI / 2);
                    drawRotatedTexture(roadTTexture, roadTCanvasMissingUp, Math.PI);

                    roadTReady = true;
                    finalizeRoadTextures();
                };
                roadTTexture.src = 'src/assets/street-t.svg';

                road4Texture.onload = () => {
                    drawRotatedTexture(road4Texture, road4Canvas, 0);
                    road4Ready = true;
                    finalizeRoadTextures();
                };
                road4Texture.src = 'src/assets/street-4.svg';

                avenueTexture.onload = () => {
                    avenueCanvasH.width = baseTileSize * 2;
                    avenueCanvasH.height = baseTileSize;
                    const hctx = avenueCanvasH.getContext('2d');
                    hctx.imageSmoothingEnabled = true;
                    hctx.clearRect(0, 0, avenueCanvasH.width, avenueCanvasH.height);
                    hctx.drawImage(avenueTexture, 0, 0, avenueCanvasH.width, avenueCanvasH.height);

                    avenueCanvasV.width = baseTileSize;
                    avenueCanvasV.height = baseTileSize * 2;
                    const vctx = avenueCanvasV.getContext('2d');
                    vctx.imageSmoothingEnabled = true;
                    vctx.clearRect(0, 0, avenueCanvasV.width, avenueCanvasV.height);
                    vctx.save();
                    vctx.translate(avenueCanvasV.width / 2, avenueCanvasV.height / 2);
                    vctx.rotate(Math.PI / 2);
                    vctx.drawImage(avenueTexture, -avenueCanvasH.width / 2, -avenueCanvasH.height / 2, avenueCanvasH.width, avenueCanvasH.height);
                    vctx.restore();

                    avenueReady = true;
                    renderGameMap();
                };
                avenueTexture.src = 'src/assets/avenida.svg';

                treeTexture.onload = () => {
                    treeCanvas.width = baseTileSize;
                    treeCanvas.height = baseTileSize;
                    const tctx = treeCanvas.getContext('2d');
                    tctx.imageSmoothingEnabled = true;
                    tctx.clearRect(0, 0, baseTileSize, baseTileSize);
                    tctx.drawImage(treeTexture, 0, 0, baseTileSize, baseTileSize);
                    treeReady = true;
                    renderMap();
                    renderGameMap();
                };
                treeTexture.src = 'src/assets/tree.svg';

                noPowerIcon.onload = () => {
                    noPowerIconReady = true;
                    renderGameMap();
                };
                noPowerIcon.src = 'src/constuções-icons/sem-energia.svg';

                emptyBuildingTexture.onload = () => {
                    emptyBuildingReady = true;
                    renderGameMap();
                };
                emptyBuildingTexture.src = 'src/assets/terreno-vazio.png';

                let constructingFramesLoaded = 0;
                constructingFrames.forEach((frame, index) => {
                    frame.onload = () => {
                        constructingFramesLoaded += 1;
                        if (constructingFramesLoaded >= constructingFrames.length) {
                            constructingReady = true;
                            renderGameMap();
                        }
                    };
                    frame.onerror = () => {
                        console.warn('Falha ao carregar frame de construcao', index + 1);
                    };
                    frame.src = encodeURI(`src/assets/build frames/${index + 1}.png`);
                });

                grassTexture.onload = () => {
                    grassReady = true;
                    grassTextureCanvas.width = baseTileSize;
                    grassTextureCanvas.height = baseTileSize;
                    const gctx = grassTextureCanvas.getContext('2d');
                    gctx.imageSmoothingEnabled = false;
                    gctx.clearRect(0, 0, baseTileSize, baseTileSize);
                    gctx.drawImage(grassTexture, 0, 0, baseTileSize, baseTileSize);
                    grassPatternCanvas.width = grassPatternSize;
                    grassPatternCanvas.height = grassPatternSize;
                    const pctx = grassPatternCanvas.getContext('2d');
                    pctx.imageSmoothingEnabled = false;
                    pctx.clearRect(0, 0, grassPatternSize, grassPatternSize);
                    pctx.drawImage(grassTexture, 0, 0, grassPatternSize, grassPatternSize);
                    grassPatternMain = null;
                    renderMap();
                    renderGameMap();
                };
                grassTexture.src = 'src/assets/grass.svg';

                waterTexture.onload = () => {
                    waterTextureCanvas.width = waterPatternSize;
                    waterTextureCanvas.height = waterPatternSize;
                    const wctx = waterTextureCanvas.getContext('2d');
                    wctx.imageSmoothingEnabled = false;
                    wctx.clearRect(0, 0, waterPatternSize, waterPatternSize);
                    wctx.drawImage(waterTexture, 0, 0, waterPatternSize, waterPatternSize);
                    waterPatternMain = null;
                    renderMap();
                    renderGameMap();
                };
                waterTexture.src = 'src/assets/water.svg';

                sandTexture.onload = () => {
                    sandTileCanvas.width = baseTileSize;
                    sandTileCanvas.height = baseTileSize;
                    const sctx = sandTileCanvas.getContext('2d');
                    sctx.imageSmoothingEnabled = false;
                    sctx.clearRect(0, 0, baseTileSize, baseTileSize);
                    sctx.drawImage(sandTexture, 0, 0, sandTexture.width || baseTileSize, sandTexture.height || baseTileSize, 0, 0, baseTileSize, baseTileSize);
                    sandReady = true;
                    renderMap();
                    renderGameMap();
                };
                sandTexture.src = 'src/assets/areia.png';

                sandTransitionTexture.onload = () => {
                    sandTransitionReady = true;
                    renderMap();
                    renderGameMap();
                };
                sandTransitionTexture.src = 'src/assets/grama-areias.png';

                parkTexture.onload = () => {
                    parkReady = true;
                    renderGameMap();
                };
                parkTexture.src = 'src/assets/parque.png';

                hospitalTexture.onload = () => {
                    hospitalReady = true;
                    renderGameMap();
                };
                hospitalTexture.src = 'src/assets/hospital.png';

                schoolTexture.onload = () => {
                    schoolReady = true;
                    renderGameMap();
                };
                schoolTexture.src = 'src/assets/escola.png';

                loadImageWithFallback(
                    policeTexture,
                    'src/assets/police.png',
                    null,
                    () => {
                        policeReady = true;
                        renderGameMap();
                    }
                );

                loadImageWithFallback(
                    fireTexture,
                    'src/assets/bombeiro.png',
                    null,
                    () => {
                        fireReady = true;
                        renderGameMap();
                    }
                );

                loadImageWithFallback(
                    nuclearTexture,
                    'src/assets/nuclear.png',
                    'src/assets/uzina.png',
                    () => {
                        nuclearReady = true;
                        renderGameMap();
                    }
                );

                wireTexture.onload = () => {
                    wireCanvasV.width = baseTileSize * wireRenderScale;
                    wireCanvasV.height = baseTileSize * wireRenderScale;
                    const vctx = wireCanvasV.getContext('2d');
                    vctx.imageSmoothingEnabled = true;
                    vctx.imageSmoothingQuality = 'high';
                    vctx.clearRect(0, 0, wireCanvasV.width, wireCanvasV.height);
                    vctx.drawImage(wireTexture, 0, 0, wireCanvasV.width, wireCanvasV.height);

                    // horizontal (rotacionado) - sem smoothing para ficar mais nitido
                    wireCanvasH.width = baseTileSize * wireRenderScale;
                    wireCanvasH.height = baseTileSize * wireRenderScale;
                    const hctx = wireCanvasH.getContext('2d');
                    hctx.imageSmoothingEnabled = true;
                    hctx.imageSmoothingQuality = 'high';
                    hctx.clearRect(0, 0, wireCanvasH.width, wireCanvasH.height);
                    hctx.translate(wireCanvasH.width / 2, wireCanvasH.height / 2);
                    hctx.rotate(Math.PI / 2);
                    hctx.drawImage(wireTexture, -wireCanvasH.width / 2, -wireCanvasH.height / 2, wireCanvasH.width, wireCanvasH.height);
                    wireReady = true;
                    renderGameMap();
                };
                wireTexture.src = 'src/assets/wire.svg';

                commercialTexture1.onload = () => {
                    commercial1Ready = true;
                    renderGameMap();
                };
                commercialTexture1.src = 'src/assets/comercio1.png';

                loadImageWithFallback(
                    commercialTexture2,
                    'src/assets/comercio2.png',
                    'src/assets/comercio1.png',
                    () => {
                        commercial2Ready = true;
                        renderGameMap();
                    }
                );

                loadImageWithFallback(
                    commercialTexture3,
                    'src/assets/comercio3.png',
                    'src/assets/comercio1.png',
                    () => {
                        commercial3Ready = true;
                        renderGameMap();
                    }
                );

                residentialTexture1.onload = () => {
                    residential1Ready = true;
                    renderGameMap();
                };
                residentialTexture1.src = 'src/assets/casas1.png';

                residentialTexture2.onload = () => {
                    residential2Ready = true;
                    renderGameMap();
                };
                residentialTexture2.src = 'src/assets/casas2.png';

                residentialTexture3.onload = () => {
                    residential3Ready = true;
                    renderGameMap();
                };
                residentialTexture3.src = 'src/assets/casas3.png';

                industrialTexture1.onload = () => {
                    industrial1Ready = true;
                    renderGameMap();
                };
                industrialTexture1.src = 'src/assets/industria1.png';

                industrialTexture2.onload = () => {
                    industrial2Ready = true;
                    renderGameMap();
                };
                industrialTexture2.src = 'src/assets/industria2.png';

                industrialTexture3.onload = () => {
                    industrial3Ready = true;
                    renderGameMap();
                };
                industrialTexture3.src = 'src/assets/industria3.png';

                bridgeTexture.onload = () => {
                    // vertical (original)
                    bridgeTextureCanvasV.width = baseTileSize;
                    bridgeTextureCanvasV.height = baseTileSize;
                    const vctx = bridgeTextureCanvasV.getContext('2d');
                    vctx.imageSmoothingEnabled = true;
                    vctx.clearRect(0, 0, baseTileSize, baseTileSize);
                    vctx.drawImage(bridgeTexture, 0, 0, baseTileSize, baseTileSize);

                    // horizontal (rotacionado)
                    bridgeTextureCanvasH.width = baseTileSize;
                    bridgeTextureCanvasH.height = baseTileSize;
                    const hctx = bridgeTextureCanvasH.getContext('2d');
                    hctx.imageSmoothingEnabled = true;
                    hctx.clearRect(0, 0, baseTileSize, baseTileSize);
                    hctx.translate(baseTileSize / 2, baseTileSize / 2);
                    hctx.rotate(Math.PI / 2);
                    hctx.drawImage(bridgeTexture, -baseTileSize / 2, -baseTileSize / 2, baseTileSize, baseTileSize);

                    bridgeReady = true;
                    renderGameMap();
                };
                bridgeTexture.src = 'src/assets/bridge.svg';

                bridgeTurnTexture.onload = () => {
                    // base assumida: curva SE (baixo -> direita)
                    drawRotatedTexture(bridgeTurnTexture, bridgeTurnCanvasSE, 0);
                    drawRotatedTexture(bridgeTurnTexture, bridgeTurnCanvasSW, Math.PI / 2);
                    drawRotatedTexture(bridgeTurnTexture, bridgeTurnCanvasNW, Math.PI);
                    drawRotatedTexture(bridgeTurnTexture, bridgeTurnCanvasNE, -Math.PI / 2);

                    bridgeTurnReady = true;
                    renderGameMap();
                };
                bridgeTurnTexture.src = 'src/assets/bridge-turn.svg';

                window.CityBuilder.registerModule('systems', {
                    ...window.CityBuilder.pickFunctions([
                        'updateFinanceUI',
                        'getBuildSize',
                        'getBuildCost',
                        'ensureTaxState',
                        'ensureDemandState',
                        'updateTaxValueDisplays',
                        'syncTaxModalFromState',
                        'applyTaxesFromUI',
                        'openTaxModal',
                        'closeTaxModal',
                        'calculateHousing',
                        'calculateJobs',
                        'clampValve',
                        'updatePopulation',
                        'calculateAverageLandValue',
                        'clampPercent',
                        'getFundingLevels',
                        'collectTaxes',
                        'collectRevenueIfNeeded',
                        'applyAnnualBudget',
                        'updatePowerState',
                        'calculateResidentialTiles',
                        'calculateHospitalCapacity',
                        'calculateSchoolCapacity',
                        'getSafetyLevel',
                        'ensureZoneState',
                        'ensureZonesForLoadedBuildings',
                        'updateZoneDynamics',
                        'updateCityInfo',
                        'setMetricValue',
                        'formatMonthlyCurrencyDelta',
                        'maybeShowMonthlySummary',
                        'maybeShowLossAlert',
                        'maybeEmitCityAlerts',
                        'getCityCategory',
                        'updateAnalysisMetrics',
                        'calculateAveragePollution',
                        'calculateAverageCrime',
                        'calculateAverageFire',
                        'updateHappiness',
                        'getHappinessStatus',
                        'updateHappinessUI',
                        'openCityModal',
                        'closeCityModal',
                        'getZoneLabel',
                        'getZoneInfoFromBuilding',
                        'refreshZoneModalIfOpen',
                        'openZoneModal',
                        'closeZoneModal',
                        'openRatingModal',
                        'closeRatingModal',
                        'finalizeRoadTextures',
                        'drawRotatedTexture'
                    ])
                });
