                function generateMap() {
                    const mapWidth = 160;
                    const mapHeight = 90;
                    const total = mapWidth * mapHeight;

                    // Base de ruido suavizado para distribuir florestas em blocos
                    let values = new Array(total).fill(0).map(() => Math.random());

                    // Suavizacao para criar manchas naturais
                    for (let pass = 0; pass < 3; pass++) {
                        const next = values.slice();
                        for (let y = 0; y < mapHeight; y++) {
                            for (let x = 0; x < mapWidth; x++) {
                                let sum = 0;
                                let count = 0;
                                for (let oy = -1; oy <= 1; oy++) {
                                    for (let ox = -1; ox <= 1; ox++) {
                                        const nx = x + ox;
                                        const ny = y + oy;
                                        if (nx >= 0 && nx < mapWidth && ny >= 0 && ny < mapHeight) {
                                            sum += values[ny * mapWidth + nx];
                                            count++;
                                        }
                                    }
                                }
                                // Peso maior no valor atual para manter identidade local
                                const current = values[y * mapWidth + x];
                                next[y * mapWidth + x] = (sum + current * 3) / (count + 3);
                            }
                        }
                        values = next;
                    }

                    // ====== Agua em formato de rios ======
                    const waterTarget = Math.round(total * 0.2);
                    const waterMask = new Array(total).fill(false);

                    function markWater(x, y, radius) {
                        const r2 = radius * radius;
                        for (let oy = -radius; oy <= radius; oy++) {
                            for (let ox = -radius; ox <= radius; ox++) {
                                const nx = x + ox;
                                const ny = y + oy;
                                if (nx < 0 || nx >= mapWidth || ny < 0 || ny >= mapHeight) continue;
                                if (ox * ox + oy * oy <= r2) {
                                    waterMask[ny * mapWidth + nx] = true;
                                }
                            }
                        }
                    }

                    function carveRiver() {
                        // Rio atravessando a cidade de uma borda para outra
                        const edges = ['top', 'bottom', 'left', 'right'];
                        const startEdge = edges[Math.floor(Math.random() * edges.length)];
                        const endEdge = (startEdge === 'top') ? 'bottom'
                            : (startEdge === 'bottom') ? 'top'
                            : (startEdge === 'left') ? 'right'
                            : 'left';

                        let x = 0;
                        let y = 0;
                        let tx = 0;
                        let ty = 0;

                        if (startEdge === 'top') { x = Math.floor(Math.random() * mapWidth); y = 0; }
                        if (startEdge === 'bottom') { x = Math.floor(Math.random() * mapWidth); y = mapHeight - 1; }
                        if (startEdge === 'left') { x = 0; y = Math.floor(Math.random() * mapHeight); }
                        if (startEdge === 'right') { x = mapWidth - 1; y = Math.floor(Math.random() * mapHeight); }

                        if (endEdge === 'top') { tx = Math.floor(Math.random() * mapWidth); ty = 0; }
                        if (endEdge === 'bottom') { tx = Math.floor(Math.random() * mapWidth); ty = mapHeight - 1; }
                        if (endEdge === 'left') { tx = 0; ty = Math.floor(Math.random() * mapHeight); }
                        if (endEdge === 'right') { tx = mapWidth - 1; ty = Math.floor(Math.random() * mapHeight); }

                        let currentX = x;
                        let currentY = y;
                        const steps = Math.max(mapWidth, mapHeight) * 2;

                        for (let i = 0; i < steps; i++) {
                            // Direcao principal apontando ao destino
                            const dx = tx - currentX;
                            const dy = ty - currentY;
                            const len = Math.max(1, Math.hypot(dx, dy));
                            const vx = dx / len;
                            const vy = dy / len;

                            // Desvio leve para criar meandros
                            const jitterX = (Math.random() - 0.5) * 0.8;
                            const jitterY = (Math.random() - 0.5) * 0.8;

                            currentX += Math.round(vx + jitterX);
                            currentY += Math.round(vy + jitterY);

                            currentX = Math.max(1, Math.min(mapWidth - 2, currentX));
                            currentY = Math.max(1, Math.min(mapHeight - 2, currentY));

                            // Largura do rio variando
                            const riverWidth = 2 + Math.floor(Math.random() * 3);
                            markWater(currentX, currentY, riverWidth);

                            // Se chegou na borda destino, encerra
                            if ((endEdge === 'top' && currentY === 0) ||
                                (endEdge === 'bottom' && currentY === mapHeight - 1) ||
                                (endEdge === 'left' && currentX === 0) ||
                                (endEdge === 'right' && currentX === mapWidth - 1)) {
                                break;
                            }
                        }
                    }

                    carveRiver();

                    // Se ainda houver pouca agua, adiciona um segundo rio
                    let waterCount = waterMask.filter(Boolean).length;
                    if (waterCount < waterTarget * 0.7) {
                        carveRiver();
                        waterCount = waterMask.filter(Boolean).length;
                    }

                    // Completa agua criando margens largas perto das bordas (tipo mar)
                    if (waterCount < waterTarget) {
                        const band = 6 + Math.floor(Math.random() * 6);
                        const edge = Math.floor(Math.random() * 4);
                        for (let y = 0; y < mapHeight; y++) {
                            for (let x = 0; x < mapWidth; x++) {
                                const distTop = y;
                                const distBottom = mapHeight - 1 - y;
                                const distLeft = x;
                                const distRight = mapWidth - 1 - x;
                                let dist = distTop;
                                if (edge === 1) dist = distBottom;
                                if (edge === 2) dist = distLeft;
                                if (edge === 3) dist = distRight;
                                if (dist < band && Math.random() > dist / band) {
                                    waterMask[y * mapWidth + x] = true;
                                }
                            }
                        }
                    }

                    // ====== Monta tiles respeitando proporcoes ======
                    const forestTarget = Math.round(total * 0.2);
                    const tiles = new Array(total).fill('land');

                    // Aplica agua
                    for (let i = 0; i < total; i++) {
                        if (waterMask[i]) tiles[i] = 'water';
                    }

                    // Escolhe floresta entre as areas nao-agua usando o ruido suavizado
                    const candidates = [];
                    for (let i = 0; i < total; i++) {
                        if (tiles[i] !== 'water') {
                            candidates.push({ value: values[i], index: i });
                        }
                    }
                    candidates.sort((a, b) => b.value - a.value);

                    const forestCount = Math.min(forestTarget, candidates.length);
                    for (let i = 0; i < forestCount; i++) {
                        tiles[candidates[i].index] = 'forest';
                    }

                    return { width: mapWidth, height: mapHeight, tiles };
                }

                function hash01(x, y, seed) {
                    let h = (Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ (seed | 0)) | 0;
                    h = Math.imul(h ^ (h >>> 13), 1274126177);
                    h = (h ^ (h >>> 16)) >>> 0;
                    return h / 4294967296;
                }

                function loadImageWithFallback(img, primarySrc, fallbackSrc, onReady) {
                    let triedFallback = false;
                    img.onload = () => {
                        img._loadedSrc = img.src;
                        onReady();
                    };
                    img.onerror = () => {
                        if (triedFallback || !fallbackSrc) return;
                        triedFallback = true;
                        img.src = fallbackSrc;
                    };
                    img.src = primarySrc;
                }

                // ====== Desenha um mapa em um canvas (preview) ======
                function renderPreviewMap(canvas, mapData) {
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = false;
                    const rawTileSize = Math.min(canvas.width / mapData.width, canvas.height / mapData.height);
                    const tileSize = Math.max(1, Math.floor(rawTileSize));
                    const offsetX = Math.floor((canvas.width - mapData.width * tileSize) / 2);
                    const offsetY = Math.floor((canvas.height - mapData.height * tileSize) / 2);
                    const mapWidth = mapData.width;
                    const mapHeight = mapData.height;
                    const mapTiles = mapData.tiles;

                    const isWaterAt = (x, y) => {
                        if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return false;
                        return mapTiles[y * mapWidth + x] === 'water';
                    };
                    const isShoreAt = (x, y) => {
                        if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return false;
                        if (isWaterAt(x, y)) return false;
                        return isWaterAt(x - 1, y) || isWaterAt(x + 1, y) || isWaterAt(x, y - 1) || isWaterAt(x, y + 1);
                    };
                    const isGrassAt = (x, y) => {
                        if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return false;
                        if (isWaterAt(x, y)) return false;
                        return !isShoreAt(x, y);
                    };

                    if (grassReady) {
                        const pattern = ctx.createPattern(grassPatternCanvas, 'repeat');
                        if (pattern) {
                            ctx.fillStyle = pattern;
                            ctx.fillRect(offsetX, offsetY, mapData.width * tileSize, mapData.height * tileSize);
                        }
                    }
                    for (let y = 0; y < mapData.height; y++) {
                        for (let x = 0; x < mapData.width; x++) {
                            const tile = mapData.tiles[y * mapData.width + x];
                            const px = offsetX + x * tileSize;
                            const py = offsetY + y * tileSize;

                            if (tile === 'water') {
                                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--water');
                                // Overdraw 1px to eliminar qualquer fenda entre tiles
                                if (waterTexture.complete && waterTexture.naturalWidth > 0) {
                                    ctx.drawImage(waterTextureCanvas, px, py, tileSize + 1, tileSize + 1);
                                } else {
                                    ctx.fillRect(px, py, tileSize + 1, tileSize + 1);
                                }
                            } else if (!grassReady) {
                                // Sem textura de grama: mantem cores solidas
                                if (tile === 'land') ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--land');
                                if (tile === 'forest') ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--forest');
                                ctx.fillRect(px, py, tileSize + 1, tileSize + 1);
                            }

                            if (tile !== 'water' && sandReady) {
                                const isShore = isShoreAt(x, y);
                                if (isShore) {
                                    ctx.drawImage(sandTileCanvas, px, py, tileSize + 1, tileSize + 1);

                                    if (sandTransitionReady) {
                                        let mask = 0;
                                        if (isGrassAt(x, y - 1)) mask |= 1;
                                        if (isGrassAt(x + 1, y)) mask |= 2;
                                        if (isGrassAt(x, y + 1)) mask |= 4;
                                        if (isGrassAt(x - 1, y)) mask |= 8;

                                        if (mask !== 0) {
                                            const sx = (mask % 4) * terrainAtlasTileSize;
                                            const sy = Math.floor(mask / 4) * terrainAtlasTileSize;
                                            ctx.drawImage(sandTransitionTexture, sx, sy, terrainAtlasTileSize, terrainAtlasTileSize, px, py, tileSize + 1, tileSize + 1);
                                        }
                                    }
                                }
                            }

                            if (tile === 'forest' && treeReady && tileSize >= 2) {
                                let neighborCount = 0;
                                const up = y > 0 && mapData.tiles[(y - 1) * mapData.width + x] === 'forest';
                                const down = y < mapData.height - 1 && mapData.tiles[(y + 1) * mapData.width + x] === 'forest';
                                const left = x > 0 && mapData.tiles[y * mapData.width + (x - 1)] === 'forest';
                                const right = x < mapData.width - 1 && mapData.tiles[y * mapData.width + (x + 1)] === 'forest';
                                for (let oy = -1; oy <= 1; oy++) {
                                    for (let ox = -1; ox <= 1; ox++) {
                                        if (ox === 0 && oy === 0) continue;
                                        const nx = x + ox;
                                        const ny = y + oy;
                                        if (nx < 0 || ny < 0 || nx >= mapData.width || ny >= mapData.height) continue;
                                        if (mapData.tiles[ny * mapData.width + nx] === 'forest') neighborCount++;
                                    }
                                }

                                const hasAdj = up || down || left || right;
                                const bleed = tileSize * 0.22;
                                let extraL = left ? bleed : 0;
                                let extraR = right ? bleed : 0;
                                let extraU = up ? bleed : 0;
                                let extraD = down ? bleed : 0;
                                if (neighborCount >= 5) {
                                    // Floresta fechada: invade todos os lados para sumir qualquer espaco
                                    extraL = bleed;
                                    extraR = bleed;
                                    extraU = bleed;
                                    extraD = bleed;
                                }
                                const drawW = tileSize + extraL + extraR;
                                const drawH = tileSize + extraU + extraD;
                                const drawX = px - extraL;
                                const drawY = py - extraU;

                                const layers = !hasAdj ? 1 : Math.min(7, 2 + Math.floor(neighborCount / 2));
                                for (let i = 0; i < layers; i++) {
                                    const j = i === 0 ? tileSize * 0.04 : tileSize * 0.12;
                                    const dx = (hash01(x, y, 100 + i * 2) - 0.5) * j;
                                    const dy = (hash01(x, y, 101 + i * 2) - 0.5) * j;
                                    ctx.drawImage(treeTexture, drawX + dx, drawY + dy, drawW, drawH);
                                }
                            }
                         }
                     }
                 }

                // ====== Renderiza o mapa no canvas principal com zoom ======
                function renderGameMap() {
                    if (!currentMap) return;
                    const ctx = gameCanvas.getContext('2d');
                    const width = gameCanvas.width;
                    const height = gameCanvas.height;
                    const mapWidth = currentMap.width;
                    const mapHeight = currentMap.height;
                    const mapTiles = currentMap.tiles;

                    const isWaterAt = (x, y) => {
                        if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return false;
                        return mapTiles[y * mapWidth + x] === 'water';
                    };
                    const isShoreAt = (x, y) => {
                        if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return false;
                        if (isWaterAt(x, y)) return false;
                        return isWaterAt(x - 1, y) || isWaterAt(x + 1, y) || isWaterAt(x, y - 1) || isWaterAt(x, y + 1);
                    };
                    const isGrassAt = (x, y) => {
                        if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return false;
                        if (isWaterAt(x, y)) return false;
                        return !isShoreAt(x, y);
                    };

                    ctx.imageSmoothingEnabled = false;
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.clearRect(0, 0, width, height);

                    // Aplica zoom e deslocamento (camera)
                    const scale = camera.zoom * canvasScale;
                    const snapX = Math.round(camera.x * canvasScale);
                    const snapY = Math.round(camera.y * canvasScale);
                    ctx.setTransform(scale, 0, 0, scale, snapX, snapY);

                    if (grassReady) {
                        if (!grassPatternMain) {
                            grassPatternMain = ctx.createPattern(grassPatternCanvas, 'repeat');
                        }
                        if (grassPatternMain) {
                            ctx.fillStyle = grassPatternMain;
                            ctx.fillRect(0, 0, currentMap.width * baseTileSize, currentMap.height * baseTileSize);
                        }
                    }
                    for (let y = 0; y < mapHeight; y++) {
                        for (let x = 0; x < mapWidth; x++) {
                            const tile = mapTiles[y * mapWidth + x];
                            const px = x * baseTileSize;
                            const py = y * baseTileSize;

                            if (tile === 'water') {
                                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--water');
                                if (waterTexture.complete && waterTexture.naturalWidth > 0) {
                                    ctx.drawImage(waterTextureCanvas, px, py, baseTileSize + 1, baseTileSize + 1);
                                } else {
                                    ctx.fillRect(px, py, baseTileSize + 1, baseTileSize + 1);
                                }
                            } else if (!grassReady) {
                                if (tile === 'land') ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--land');
                                if (tile === 'forest') ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--forest');
                                ctx.fillRect(px, py, baseTileSize + 1, baseTileSize + 1);
                            }

                            if (tile !== 'water' && sandReady) {
                                const isShore = isShoreAt(x, y);
                                if (isShore) {
                                    ctx.drawImage(sandTileCanvas, px, py, baseTileSize + 1, baseTileSize + 1);

                                    if (sandTransitionReady) {
                                        let mask = 0;
                                        if (isGrassAt(x, y - 1)) mask |= 1;
                                        if (isGrassAt(x + 1, y)) mask |= 2;
                                        if (isGrassAt(x, y + 1)) mask |= 4;
                                        if (isGrassAt(x - 1, y)) mask |= 8;

                                        if (mask !== 0) {
                                            const sx = (mask % 4) * terrainAtlasTileSize;
                                            const sy = Math.floor(mask / 4) * terrainAtlasTileSize;
                                            ctx.drawImage(sandTransitionTexture, sx, sy, terrainAtlasTileSize, terrainAtlasTileSize, px, py, baseTileSize + 1, baseTileSize + 1);
                                        }
                                    }
                                }
                            }

                            if (tile === 'forest' && treeReady) {
                                let neighborCount = 0;
                                const up = y > 0 && currentMap.tiles[(y - 1) * currentMap.width + x] === 'forest';
                                const down = y < currentMap.height - 1 && currentMap.tiles[(y + 1) * currentMap.width + x] === 'forest';
                                const left = x > 0 && currentMap.tiles[y * currentMap.width + (x - 1)] === 'forest';
                                const right = x < currentMap.width - 1 && currentMap.tiles[y * currentMap.width + (x + 1)] === 'forest';
                                for (let oy = -1; oy <= 1; oy++) {
                                    for (let ox = -1; ox <= 1; ox++) {
                                        if (ox === 0 && oy === 0) continue;
                                        const nx = x + ox;
                                        const ny = y + oy;
                                        if (nx < 0 || ny < 0 || nx >= currentMap.width || ny >= currentMap.height) continue;
                                        if (currentMap.tiles[ny * currentMap.width + nx] === 'forest') neighborCount++;
                                    }
                                }

                                const hasAdj = up || down || left || right;
                                const bleed = baseTileSize * 0.22;
                                let extraL = left ? bleed : 0;
                                let extraR = right ? bleed : 0;
                                let extraU = up ? bleed : 0;
                                let extraD = down ? bleed : 0;
                                if (neighborCount >= 5) {
                                    extraL = bleed;
                                    extraR = bleed;
                                    extraU = bleed;
                                    extraD = bleed;
                                }
                                const drawW = baseTileSize + extraL + extraR;
                                const drawH = baseTileSize + extraU + extraD;
                                const drawX = px - extraL;
                                const drawY = py - extraU;

                                const layers = !hasAdj ? 1 : Math.min(7, 2 + Math.floor(neighborCount / 2));
                                for (let i = 0; i < layers; i++) {
                                    const j = i === 0 ? baseTileSize * 0.04 : baseTileSize * 0.12;
                                    const dx = (hash01(x, y, 200 + i * 2) - 0.5) * j;
                                    const dy = (hash01(x, y, 201 + i * 2) - 0.5) * j;
                                    ctx.drawImage(treeCanvas, drawX + dx, drawY + dy, drawW, drawH);
                                }
                            }
                        }
                    }

                    // Estradas
                    if (gameState.roads && gameState.roads.length) {
                        const fallback = getComputedStyle(document.documentElement).getPropertyValue('--road');
                        const roadLookup = new Set(gameState.roads.map((r) => `${r.x},${r.y}`));
                        const hasRoad = (x, y) => roadLookup.has(`${x},${y}`);
                        const getRoadTexture = (road) => {
                            const up = hasRoad(road.x, road.y - 1);
                            const down = hasRoad(road.x, road.y + 1);
                            const left = hasRoad(road.x - 1, road.y);
                            const right = hasRoad(road.x + 1, road.y);
                            const count = (up ? 1 : 0) + (down ? 1 : 0) + (left ? 1 : 0) + (right ? 1 : 0);
                            const hasHoriz = left || right;
                            const hasVert = up || down;
                            const isBridge = (road.isBridge === true) || isWaterTile(road.x, road.y);

                            if (isBridge && bridgeReady) {
                                if (count === 2 && hasHoriz && hasVert && bridgeTurnReady) {
                                    if (up && right) return bridgeTurnCanvasNE;
                                    if (up && left) return bridgeTurnCanvasNW;
                                    if (down && right) return bridgeTurnCanvasSE;
                                    if (down && left) return bridgeTurnCanvasSW;
                                }
                                if (hasHoriz && (!hasVert || left && right)) return bridgeTextureCanvasH;
                                if (hasVert) return bridgeTextureCanvasV;
                                return road.dir === 'h' ? bridgeTextureCanvasH : bridgeTextureCanvasV;
                            }

                            // Curvas (exatamente dois vizinhos perpendiculares)
                            if (count === 2 && hasHoriz && hasVert) {
                                if (up && right) return roadTurnCanvasNE;
                                if (up && left) return roadTurnCanvasNW;
                                if (down && right) return roadTurnCanvasSE;
                                if (down && left) return roadTurnCanvasSW;
                            }

                            // Cruzamentos
                            if (count === 4) return road4Canvas;

                            // Intersecoes em T (3 vizinhos)
                            if (count === 3) {
                                if (!up) return roadTCanvasMissingDown;
                                if (!right) return roadTCanvasMissingLeft;
                                if (!down) return roadTCanvasMissingUp;
                                return roadTCanvasMissingRight;
                            }

                            // Retas (ou 1 vizinho)
                            if (hasHoriz && (!hasVert || left && right)) return roadTextureCanvasH;
                            if (hasVert) return roadTextureCanvasV;

                            // Isolado: usa direcao salva ou vertical como padrao
                            return road.dir === 'h' ? roadTextureCanvasH : roadTextureCanvasV;
                        };

                        gameState.roads.forEach((r) => {
                            const px = r.x * baseTileSize;
                            const py = r.y * baseTileSize;
                            if (roadTexturesReady) {
                                const tex = getRoadTexture(r);
                                ctx.drawImage(tex, px, py, baseTileSize + 1, baseTileSize + 1);
                            } else {
                                ctx.fillStyle = fallback;
                                ctx.fillRect(px, py, baseTileSize + 1, baseTileSize + 1);
                            }
                        });
                    }

                    // Avenidas (sem curvas)
                    if (gameState.avenues && gameState.avenues.length) {
                        const fallback = getComputedStyle(document.documentElement).getPropertyValue('--road');
                        gameState.avenues.forEach((a) => {
                            const px = a.x * baseTileSize;
                            const py = a.y * baseTileSize;
                            if (avenueReady) {
                                const tex = a.dir === 'v' ? avenueCanvasV : avenueCanvasH;
                                ctx.drawImage(tex, px, py, tex.width, tex.height);
                            } else {
                                const w = a.dir === 'v' ? baseTileSize : baseTileSize * 2;
                                const h = a.dir === 'v' ? baseTileSize * 2 : baseTileSize;
                                ctx.fillStyle = fallback;
                                ctx.fillRect(px, py, w, h);
                            }
                        });
                    }

                    // Fiacao
                    if (gameState.wires && gameState.wires.length) {
                        const wireLookup = new Set(gameState.wires.map((w) => `${w.x},${w.y}`));
                        const hasWire = (x, y) => wireLookup.has(`${x},${y}`);

                        const drawWireSlice = (textureCanvas, px, py, sx, sy, sw, sh, dx, dy, dw, dh) => {
                            ctx.drawImage(textureCanvas, sx, sy, sw, sh, px + dx, py + dy, dw, dh);
                        };

                        ctx.save();
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';

                        gameState.wires.forEach((w) => {
                            const px = w.x * baseTileSize;
                            const py = w.y * baseTileSize;
                            const up = hasWire(w.x, w.y - 1);
                            const down = hasWire(w.x, w.y + 1);
                            const left = hasWire(w.x - 1, w.y);
                            const right = hasWire(w.x + 1, w.y);
                            const hasHoriz = left || right;
                            const hasVert = up || down;

                            if (!wireReady) {
                                // Fallback: linhas
                                const wireColor = getComputedStyle(document.documentElement).getPropertyValue('--wire');
                                const mid = baseTileSize / 2;
                                const offset = baseTileSize * 0.18;
                                ctx.strokeStyle = wireColor;
                                ctx.lineWidth = 2;
                                ctx.lineCap = 'round';
                                const drawHoriz = hasHoriz || (!hasVert && (w.dir || 'h') === 'h');
                                const drawVert = hasVert || (!hasHoriz && (w.dir || 'h') === 'v');
                                if (drawHoriz) {
                                    ctx.beginPath();
                                    ctx.moveTo(px + 2, py + mid - offset);
                                    ctx.lineTo(px + baseTileSize - 2, py + mid - offset);
                                    ctx.stroke();
                                    ctx.beginPath();
                                    ctx.moveTo(px + 2, py + mid + offset);
                                    ctx.lineTo(px + baseTileSize - 2, py + mid + offset);
                                    ctx.stroke();
                                }
                                if (drawVert) {
                                    ctx.beginPath();
                                    ctx.moveTo(px + mid - offset, py + 2);
                                    ctx.lineTo(px + mid - offset, py + baseTileSize - 2);
                                    ctx.stroke();
                                    ctx.beginPath();
                                    ctx.moveTo(px + mid + offset, py + 2);
                                    ctx.lineTo(px + mid + offset, py + baseTileSize - 2);
                                    ctx.stroke();
                                }
                                return;
                            }

                            const halfA = Math.floor(baseTileSize / 2);
                            const halfB = baseTileSize - halfA;
                            const count = (up ? 1 : 0) + (down ? 1 : 0) + (left ? 1 : 0) + (right ? 1 : 0);
                            if (count === 0) {
                                const dir = (w.dir || 'h');
                                ctx.drawImage(dir === 'v' ? wireCanvasV : wireCanvasH, px, py, baseTileSize, baseTileSize);
                                return;
                            }

                            const fullS = baseTileSize * wireRenderScale;
                            const halfAS = halfA * wireRenderScale;
                            const halfBS = halfB * wireRenderScale;

                            if (left) drawWireSlice(wireCanvasH, px, py, 0, 0, halfAS, fullS, 0, 0, halfA, baseTileSize);
                            if (right) drawWireSlice(wireCanvasH, px, py, halfAS, 0, halfBS, fullS, halfA, 0, halfB, baseTileSize);
                            if (up) drawWireSlice(wireCanvasV, px, py, 0, 0, fullS, halfAS, 0, 0, baseTileSize, halfA);
                            if (down) drawWireSlice(wireCanvasV, px, py, 0, halfAS, fullS, halfBS, 0, halfA, baseTileSize, halfB);
                        });

                        ctx.restore();
                    }

                    updatePowerState();

                    // Desenha construcoes ja colocadas
                    if (gameState.buildings && gameState.buildings.length) {
                        const drawBuildingTexture = (img, px, py, w, h, padMultiplier) => {
                            const pad = baseTileSize * padMultiplier;
                            ctx.save();
                            ctx.imageSmoothingEnabled = false;
                            ctx.beginPath();
                            ctx.rect(px, py, w, h);
                            ctx.clip();
                            ctx.drawImage(img, px - pad, py - pad, w + pad * 2, h + pad * 2);
                            ctx.restore();
                        };
                        const drawBuildingTextureExact = (img, px, py, w, h) => {
                            ctx.save();
                            ctx.imageSmoothingEnabled = false;
                            ctx.drawImage(img, px, py, w, h);
                            ctx.restore();
                        };
                        const getResidentialTextureForLevel = (level) => {
                            if (level >= 3 && residential3Ready) return residentialTexture3;
                            if (level >= 3 && residential2Ready) return residentialTexture2;
                            if (level >= 2 && residential2Ready) return residentialTexture2;
                            if (level >= 1 && residential1Ready) return residentialTexture1;
                            return null;
                        };
                        const getCommercialTextureForLevel = (level) => {
                            if (level >= 5 && commercial3Ready) return commercialTexture3;
                            if (level >= 3 && commercial2Ready) return commercialTexture2;
                            if (level >= 3 && commercial1Ready) return commercialTexture1;
                            if (level >= 1 && commercial1Ready) return commercialTexture1;
                            return null;
                        };
                        const getIndustrialTextureForLevel = (level) => {
                            // devLevel vai de 0..IND_LEVELS_MAX (IND_LEVELS_MAX=4).
                            // Mapeia para 3 estágios visuais: 1 (0-1), 2 (2-3), 3 (4).
                            if (level >= 4 && industrial3Ready) return industrialTexture3;
                            if (level >= 4 && industrial2Ready) return industrialTexture2; // fallback caso a 3 não esteja pronta
                            if (level >= 2 && industrial2Ready) return industrialTexture2;
                            if (level >= 1 && industrial1Ready) return industrialTexture1;
                            return null;
                        };

                        gameState.buildings.forEach((b) => {
                            if (b.type === 'residential') ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--zone-res');
                            if (b.type === 'commercial') {
                                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--zone-com');
                            }
                            if (b.type === 'industrial') ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--zone-ind');
                            if (b.type === 'hospital_small') ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--hospital');
                            if (b.type === 'police_station') ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--police');
                            if (b.type === 'fire_station') ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--fire');
                            if (b.type === 'school') ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--school');
                            if (b.type === 'nuclear_plant') ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--nuclear');
                            if (b.type === 'park') ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--park');
                            if (b.type === 'tree') ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--park');
                            const size = b.size || defaultBuildSize;
                            const px = b.x * baseTileSize;
                            const py = b.y * baseTileSize;
                            const w = size * baseTileSize + 1;
                            const h = size * baseTileSize + 1;
                            const nowMs = Date.now();
                            let isConstructing = false;
                            if (b.powered === true) {
                                if (b.powerAnimPending === true && constructingReady) {
                                    b.powerAnimPending = false;
                                    b.powerAnimStartedAt = nowMs;
                                    b.powerAnimUntil = nowMs + BUILD_POWER_ANIM_MS;
                                    ensureBuildingPowerAnimationLoop();
                                }
                                isConstructing = (b.powerAnimPending === true) ||
                                    (typeof b.powerAnimUntil === 'number' && b.powerAnimUntil > nowMs);
                            }

                            if (b.powered === false) {
                                if (emptyBuildingReady) {
                                    drawBuildingTextureExact(emptyBuildingTexture, px, py, w, h);
                                } else {
                                    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--land');
                                    ctx.fillRect(px, py, w, h);
                                }
                            } else if (isConstructing && constructingReady) {
                                const startedAt = (typeof b.powerAnimStartedAt === 'number')
                                    ? b.powerAnimStartedAt
                                    : (typeof b.powerAnimUntil === 'number' ? (b.powerAnimUntil - BUILD_POWER_ANIM_MS) : nowMs);
                                const frameIndex = Math.min(
                                    CONSTRUCTING_FRAME_COUNT - 1,
                                    Math.max(0, Math.floor((nowMs - startedAt) / CONSTRUCTING_FRAME_MS))
                                );
                                const frame = constructingFrames[frameIndex] || constructingFrames[0];
                                if (frame && frame.complete && frame.naturalWidth > 0) {
                                    drawBuildingTextureExact(frame, px, py, w, h);
                                } else if (emptyBuildingReady) {
                                    drawBuildingTextureExact(emptyBuildingTexture, px, py, w, h);
                                }
                            } else if (isConstructing && !constructingReady) {
                                // Enquanto o GIF ainda carrega, evita "pular" direto para a textura final.
                                if (emptyBuildingReady) {
                                    drawBuildingTextureExact(emptyBuildingTexture, px, py, w, h);
                                }
                            } else {
                            const isParkTextured = b.type === 'park' && parkReady && size === 3;
                            const isNuclearTextured = b.type === 'nuclear_plant' && nuclearReady && size === 4;
                            if (b.type === 'commercial' && size === 3) {
                                const level = b.zone ? (b.zone.devLevel || 0) : 0;
                                const texture = getCommercialTextureForLevel(Math.max(1, level));
                                if (texture) {
                                    drawBuildingTexture(texture, px, py, w, h, 0.45);
                                } else {
                                    ctx.fillRect(px, py, w, h);
                                }
                            } else if (b.type === 'residential' && size === 3) {
                                const level = b.zone ? (b.zone.resLevel || 0) : 0;
                                const texture = getResidentialTextureForLevel(Math.max(1, level));
                                if (texture) {
                                    drawBuildingTextureExact(texture, px, py, w, h);
                                } else {
                                    ctx.fillRect(px, py, w, h);
                                }
                            } else if (b.type === 'industrial' && size === 3) {
                                const level = b.zone ? (b.zone.devLevel || 0) : 0;
                                const texture = getIndustrialTextureForLevel(Math.max(1, level));
                                if (texture) {
                                    drawBuildingTextureExact(texture, px, py, w, h);
                                } else {
                                    ctx.fillRect(px, py, w, h);
                                }
                            } else if (b.type === 'hospital_small' && hospitalReady && size === 4) {
                                drawBuildingTextureExact(hospitalTexture, px, py, w, h);
                            } else if (b.type === 'school' && schoolReady && size === 4) {
                                drawBuildingTextureExact(schoolTexture, px, py, w, h);
                            } else if (b.type === 'police_station' && policeReady && size === 3) {
                                // O sprite "police.png" veio com rua na borda; desenha com crop para "dar zoom" e remover a rua.
                                const loadedSrc = (policeTexture && typeof policeTexture._loadedSrc === 'string') ? policeTexture._loadedSrc : '';
                                if (loadedSrc.includes('police.png')) {
                                    const iw = policeTexture.naturalWidth || policeTexture.width || 0;
                                    const ih = policeTexture.naturalHeight || policeTexture.height || 0;
                                    const side = Math.min(iw, ih);
                                    const inset = Math.max(0, Math.round(side * 0.14));
                                    const cropSide = Math.max(1, side - inset * 2);
                                    const sx = Math.round((iw - side) / 2) + inset;
                                    const sy = Math.round((ih - side) / 2) + inset;
                                    ctx.save();
                                    ctx.imageSmoothingEnabled = false;
                                    ctx.drawImage(policeTexture, sx, sy, cropSide, cropSide, px, py, w, h);
                                    ctx.restore();
                                } else {
                                    drawBuildingTextureExact(policeTexture, px, py, w, h);
                                }
                            } else if (b.type === 'fire_station' && fireReady && size === 3) {
                                // O sprite "bombeiro.png" veio com rua na borda; desenha com crop para "dar zoom" e remover a rua.
                                const loadedSrc = (fireTexture && typeof fireTexture._loadedSrc === 'string') ? fireTexture._loadedSrc : '';
                                if (loadedSrc.includes('bombeiro.png')) {
                                    const iw = fireTexture.naturalWidth || fireTexture.width || 0;
                                    const ih = fireTexture.naturalHeight || fireTexture.height || 0;
                                    const side = Math.min(iw, ih);
                                    // Menor inset = menos "zoom". Primeiro centraliza (crop no centro), depois aplica pequenos ajustes.
                                    const inset = Math.max(0, Math.round(side * 0.082));
                                    const cropSide = Math.max(1, side - inset * 2);
                                    const biasX = Math.round(side * 0.006);
                                    const biasY = Math.round(side * -0.01);
                                    let sx = Math.round((iw - cropSide) / 2) + biasX;
                                    let sy = Math.round((ih - cropSide) / 2) + biasY;
                                    sx = Math.max(0, Math.min(iw - cropSide, sx));
                                    sy = Math.max(0, Math.min(ih - cropSide, sy));
                                    ctx.save();
                                    ctx.imageSmoothingEnabled = false;
                                    ctx.drawImage(fireTexture, sx, sy, cropSide, cropSide, px, py, w, h);
                                    ctx.restore();
                                } else {
                                    drawBuildingTextureExact(fireTexture, px, py, w, h);
                                }
                            } else if (isNuclearTextured) {
                                    // O sprite "nuclear.png" veio com rua na borda; desenha com crop para "dar zoom" e remover a rua.
                                    const loadedSrc = (nuclearTexture && typeof nuclearTexture._loadedSrc === 'string') ? nuclearTexture._loadedSrc : '';
                                    if (loadedSrc.includes('nuclear.png')) {
                                        const iw = nuclearTexture.naturalWidth || nuclearTexture.width || 0;
                                        const ih = nuclearTexture.naturalHeight || nuclearTexture.height || 0;
                                        const side = Math.min(iw, ih);
                                        const inset = Math.max(0, Math.round(side * 0.14));
                                        const cropSide = Math.max(1, side - inset * 2);
                                        const sx = Math.round((iw - side) / 2) + inset;
                                        const sy = Math.round((ih - side) / 2) + inset;
                                        ctx.save();
                                        ctx.imageSmoothingEnabled = false;
                                        ctx.drawImage(nuclearTexture, sx, sy, cropSide, cropSide, px, py, w, h);
                                        ctx.restore();
                                    } else {
                                        drawBuildingTextureExact(nuclearTexture, px, py, w, h);
                                    }
                                } else if (b.type === 'tree' && treeReady && size === 1) {
                                    drawBuildingTextureExact(treeCanvas, px, py, w, h);
                                } else if (isParkTextured) {
                                    drawBuildingTextureExact(parkTexture, px, py, w, h);
                                } else {
                                    ctx.fillRect(
                                        px,
                                        py,
                                        w,
                                        h
                                    );
                                }
                                if (b.type === 'park' && !isParkTextured) {
                                    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--park-edge');
                                    ctx.lineWidth = 2;
                                    ctx.strokeRect(
                                        b.x * baseTileSize + 1,
                                        b.y * baseTileSize + 1,
                                        size * baseTileSize - 1,
                                        size * baseTileSize - 1
                                    );
                                }
                                if (b.type === 'nuclear_plant' && !isNuclearTextured) {
                                    const coreSize = Math.max(1, Math.floor(size / 2));
                                    const coreOffset = Math.floor((size - coreSize) / 2);
                                    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--nuclear-core');
                                    ctx.fillRect(
                                        (b.x + coreOffset) * baseTileSize,
                                        (b.y + coreOffset) * baseTileSize,
                                        coreSize * baseTileSize + 1,
                                        coreSize * baseTileSize + 1
                                    );
                                }
                            }
                            if (b.powered === false) {
                                const centerX = (b.x + size / 2) * baseTileSize;
                                const centerY = (b.y + size / 2) * baseTileSize;
                                if (noPowerIconReady) {
                                    const iconSize = Math.max(12, Math.floor(baseTileSize * 0.95));
                                    ctx.drawImage(
                                        noPowerIcon,
                                        Math.round(centerX - iconSize / 2),
                                        Math.round(centerY - iconSize / 2),
                                        iconSize,
                                        iconSize
                                    );
                                } else {
                                    ctx.fillStyle = '#ffe066';
                                    ctx.font = `${Math.max(12, Math.floor(baseTileSize * 0.9))}px sans-serif`;
                                    ctx.textAlign = 'center';
                                    ctx.textBaseline = 'middle';
                                    ctx.fillText('?', centerX, centerY);
                                }
                            }
                        });
                    }

                    if (areaSelectionRect) {
                        const width = (areaSelectionRect.maxX - areaSelectionRect.minX + 1) * baseTileSize;
                        const height = (areaSelectionRect.maxY - areaSelectionRect.minY + 1) * baseTileSize;
                        ctx.fillStyle = 'rgba(120, 200, 255, 0.18)';
                        ctx.fillRect(areaSelectionRect.minX * baseTileSize, areaSelectionRect.minY * baseTileSize, width, height);
                        ctx.strokeStyle = 'rgba(120, 200, 255, 0.65)';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(areaSelectionRect.minX * baseTileSize + 1, areaSelectionRect.minY * baseTileSize + 1, width - 2, height - 2);
                    }

                    // Preview da construcao selecionada
                    if (selectedBuildType && hoverBuildPos) {
                        let previewColor = 'rgba(255, 255, 255, 0.45)';
                        if (selectedBuildType === 'residential') previewColor = 'rgba(95, 211, 111, 0.45)';
                        if (selectedBuildType === 'commercial') previewColor = 'rgba(74, 163, 255, 0.45)';
                        if (selectedBuildType === 'industrial') previewColor = 'rgba(245, 200, 75, 0.45)';
                        if (selectedBuildType === 'hospital_small') previewColor = 'rgba(217, 75, 75, 0.45)';
                        if (selectedBuildType === 'police_station') previewColor = 'rgba(29, 45, 90, 0.5)';
                        if (selectedBuildType === 'fire_station') previewColor = 'rgba(217, 75, 75, 0.5)';
                        if (selectedBuildType === 'school') previewColor = 'rgba(226, 200, 90, 0.5)';
                        if (selectedBuildType === 'nuclear_plant') previewColor = 'rgba(245, 209, 75, 0.5)';
                        if (selectedBuildType === 'park') previewColor = 'rgba(184, 241, 184, 0.6)';
                        if (selectedBuildType === 'tree') previewColor = 'rgba(118, 199, 118, 0.65)';
                        if (selectedBuildType === 'wire') previewColor = 'rgba(201, 214, 226, 0.5)';
                        if (selectedBuildType === 'bulldozer') previewColor = 'rgba(255, 255, 255, 0.25)';
                        if (selectedBuildType === 'road') previewColor = 'rgba(123, 127, 134, 0.55)';
                        if (selectedBuildType === 'avenue') previewColor = 'rgba(123, 127, 134, 0.55)';

                        const drawEmptyLotPreview = (x, y, wTiles, hTiles) => {
                            if (!emptyBuildingReady) return;
                            const px = x * baseTileSize;
                            const py = y * baseTileSize;
                            const wPx = wTiles * baseTileSize + 1;
                            const hPx = hTiles * baseTileSize + 1;
                            ctx.save();
                            ctx.imageSmoothingEnabled = false;
                            ctx.globalAlpha = 0.32;
                            ctx.drawImage(emptyBuildingTexture, px, py, wPx, hPx);
                            ctx.restore();
                        };

                        if (selectedBuildType === 'avenue' && hoverBuildPos) {
                            const dir = hoverBuildPos.dir || getRoadDir(lastAvenuePos, hoverBuildPos);
                            const { w, h } = getAvenueFootprint(dir);
                            const fillColor = hoverBuildValid ? previewColor : 'rgba(255, 60, 60, 0.5)';
                            drawEmptyLotPreview(hoverBuildPos.x, hoverBuildPos.y, w, h);
                            ctx.fillStyle = fillColor;
                            ctx.fillRect(
                                hoverBuildPos.x * baseTileSize,
                                hoverBuildPos.y * baseTileSize,
                                w * baseTileSize + 1,
                                h * baseTileSize + 1
                            );
                            ctx.strokeStyle = hoverBuildValid ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 60, 60, 0.9)';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(
                                hoverBuildPos.x * baseTileSize + 1,
                                hoverBuildPos.y * baseTileSize + 1,
                                w * baseTileSize - 1,
                                h * baseTileSize - 1
                            );
                            return;
                        }
                        const size = getBuildSize(selectedBuildType);
                        const fillColor = hoverBuildValid ? previewColor : 'rgba(255, 60, 60, 0.5)';
                        drawEmptyLotPreview(hoverBuildPos.x, hoverBuildPos.y, size, size);
                        ctx.fillStyle = fillColor;
                        ctx.fillRect(
                            hoverBuildPos.x * baseTileSize,
                            hoverBuildPos.y * baseTileSize,
                            size * baseTileSize + 1,
                            size * baseTileSize + 1
                        );
                        ctx.strokeStyle = hoverBuildValid ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 60, 60, 0.9)';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(
                            hoverBuildPos.x * baseTileSize + 1,
                            hoverBuildPos.y * baseTileSize + 1,
                            size * baseTileSize - 1,
                            size * baseTileSize - 1
                        );
                    }
                }

                // ====== Renderiza o mapa do estado do jogo ======
                function renderMap() {
                    if (!gameState.map || !gameState.map.tiles) return;
                    currentMap = gameState.map;
                    renderGameMap();
                }

                window.CityBuilder.registerModule('render', {
                    ...window.CityBuilder.pickFunctions([
                        'generateMap',
                        'hash01',
                        'loadImageWithFallback',
                        'renderPreviewMap',
                        'renderGameMap',
                        'renderMap',
                        'resizeGameCanvas'
                    ])
                });

                function updateFinanceUI() {
                    if (topbarMoney) {
                        topbarMoney.textContent = `$ ${Math.round(gameState.money).toLocaleString('pt-BR')}`;
                    }
                    if (topbarPopulation) {
                        topbarPopulation.textContent = `${Math.round(gameState.population).toLocaleString('pt-BR')}`;
                    }
                    if (topbarTaxRate) {
                        topbarTaxRate.textContent = `${gameState.taxes ? gameState.taxes.rate : taxRate}%`;
                    }
                    if (topbarDate) {
                        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const monthIndex = typeof gameTime.monthIndex === 'number'
                            ? gameTime.monthIndex
                            : ((gameTime.month - 1 + 12) % 12);
                        const label = monthLabels[monthIndex];
                        topbarDate.textContent = `${label} ${gameTime.year}`;
                    }
                    if (topbarCity) {
                        topbarCity.textContent = currentSaveId ? getCityName(currentSaveId) : 'Sem nome';
                    }
                    const budgetRevenue = document.getElementById('budgetRevenue');
                    const budgetExpense = document.getElementById('budgetExpense');
                    const budgetNet = document.getElementById('budgetNet');
                    const lastBudget = gameState.lastBudget || {};
                    const revenueValue = Number.isFinite(lastBudget.taxFund)
                        ? lastBudget.taxFund
                        : (Number.isFinite(gameState.lastTaxFund) ? gameState.lastTaxFund : 0);
                    const expenseValue = Number.isFinite(lastBudget.expense)
                        ? lastBudget.expense
                        : (Number.isFinite(gameState.lastExpense) ? gameState.lastExpense : 0);
                    const netValue = Number.isFinite(lastBudget.cashFlow)
                        ? lastBudget.cashFlow
                        : (Number.isFinite(gameState.lastCashFlow) ? gameState.lastCashFlow : revenueValue - expenseValue);
                    if (budgetRevenue) {
                        budgetRevenue.textContent = `$ ${Math.round(revenueValue).toLocaleString('pt-BR')}`;
                    }
                    if (budgetExpense) {
                        budgetExpense.textContent = `$ ${Math.round(expenseValue).toLocaleString('pt-BR')}`;
                    }
                    if (budgetNet) {
                        budgetNet.textContent = `$ ${Math.round(netValue).toLocaleString('pt-BR')}`;
                        budgetNet.style.color = netValue < 0 ? '#f87171' : '#86efac';
                    }
                    if (infoPopulation) {
                        updateCityInfo();
                    }
                    updateAnalysisMetrics();
                    updateHappinessUI();
                }
