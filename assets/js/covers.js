/* ============================================================
 * FUTA LAND - SVG COVERS (Architectural Quality)
 * Vẽ kiểu architectural rendering chuyên nghiệp
 * ============================================================ */

// ============================================================
// COVER CHUNG CƯ - architectural sunset render
// ============================================================
function coverApartmentSVG(project) {
  const towers = [
    { x: 80,  w: 65,  h: 200, offset: 0 },
    { x: 155, w: 90,  h: 280, offset: -20 },
    { x: 255, w: 75,  h: 240, offset: -10 },
    { x: 340, w: 55,  h: 180, offset: 5 }
  ];

  return `
    <svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <!-- Sunset sky -->
        <linearGradient id="apSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a2e1e"/>
          <stop offset="35%" stop-color="#2a5a2e"/>
          <stop offset="70%" stop-color="#FFB347"/>
          <stop offset="100%" stop-color="#FF7043"/>
        </linearGradient>
        <!-- Tower facade -->
        <linearGradient id="apTowerFace" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#0F2010"/>
          <stop offset="50%" stop-color="#1B5E20"/>
          <stop offset="100%" stop-color="#0F3D14"/>
        </linearGradient>
        <linearGradient id="apTowerSide" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#0a1810"/>
          <stop offset="100%" stop-color="#162e1a"/>
        </linearGradient>
        <!-- Reflection in water -->
        <linearGradient id="apWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1B5E20" stop-opacity=".7"/>
          <stop offset="100%" stop-color="#0a1810" stop-opacity=".9"/>
        </linearGradient>
        <!-- Window glow -->
        <radialGradient id="windowGlow">
          <stop offset="0%" stop-color="#FFE082" stop-opacity="1"/>
          <stop offset="100%" stop-color="#FFA726" stop-opacity=".3"/>
        </radialGradient>
        <filter id="apBlur"><feGaussianBlur stdDeviation=".4"/></filter>
      </defs>

      <!-- Sky -->
      <rect width="480" height="280" fill="url(#apSky)"/>

      <!-- Sun -->
      <circle cx="380" cy="170" r="30" fill="#FFD180" opacity=".9"/>
      <circle cx="380" cy="170" r="50" fill="#FFAB40" opacity=".25"/>
      <circle cx="380" cy="170" r="80" fill="#FF7043" opacity=".1"/>

      <!-- Far mountains silhouette -->
      <path d="M0,200 L60,180 L130,195 L200,170 L280,185 L360,160 L480,180 L480,210 L0,210 Z"
            fill="#0F2010" opacity=".5"/>
      <path d="M0,210 L100,195 L180,205 L260,190 L340,205 L420,195 L480,205 L480,225 L0,225 Z"
            fill="#0F2010" opacity=".7"/>

      <!-- Towers -->
      ${towers.map((t, idx) => {
        const baseY = 220 + t.offset;
        const cols = Math.floor(t.w / 12);
        const rows = Math.floor(t.h / 14);
        let windows = '';
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const lit = Math.random() > 0.35;
            const wx = t.x + 4 + c * 12;
            const wy = baseY - t.h + 8 + r * 14;
            windows += `<rect x="${wx}" y="${wy}" width="7" height="8" fill="${lit ? '#FFE082' : '#0a1810'}" opacity="${lit ? 0.9 : 0.7}"/>`;
          }
        }
        return `
          <!-- Side shadow -->
          <rect x="${t.x - 6}" y="${baseY - t.h}" width="6" height="${t.h}" fill="url(#apTowerSide)"/>
          <!-- Front facade -->
          <rect x="${t.x}" y="${baseY - t.h}" width="${t.w}" height="${t.h}" fill="url(#apTowerFace)"/>
          <!-- Roof -->
          <rect x="${t.x - 2}" y="${baseY - t.h - 4}" width="${t.w + 4}" height="4" fill="#0a1810"/>
          <!-- Antenna -->
          ${idx === 1 ? `<line x1="${t.x + t.w/2}" y1="${baseY - t.h - 4}" x2="${t.x + t.w/2}" y2="${baseY - t.h - 24}" stroke="#0a1810" stroke-width="2"/><circle cx="${t.x + t.w/2}" cy="${baseY - t.h - 24}" r="1.5" fill="#FF5252"/>` : ''}
          ${windows}
          <!-- Lobby -->
          <rect x="${t.x + t.w/2 - 12}" y="${baseY - 18}" width="24" height="18" fill="#FFE082" opacity=".95"/>
          <rect x="${t.x + t.w/2 - 10}" y="${baseY - 16}" width="20" height="16" fill="url(#windowGlow)"/>
        `;
      }).join('')}

      <!-- Foreground trees -->
      <g opacity=".95">
        <ellipse cx="35" cy="225" rx="22" ry="18" fill="#0F3D14"/>
        <ellipse cx="55" cy="220" rx="18" ry="20" fill="#1B5E20"/>
        <rect x="44" y="225" width="3" height="12" fill="#3E2723"/>
        <ellipse cx="445" cy="225" rx="20" ry="16" fill="#0F3D14"/>
        <ellipse cx="460" cy="222" rx="16" ry="18" fill="#1B5E20"/>
      </g>

      <!-- Ground/water in front -->
      <rect x="0" y="225" width="480" height="55" fill="url(#apWater)"/>
      <!-- Water reflection lines -->
      ${Array.from({length: 8}, (_, i) => `<line x1="${i*60}" y1="${230 + i*3}" x2="${i*60 + 80}" y2="${230 + i*3}" stroke="white" stroke-width=".5" opacity=".15"/>`).join('')}

      <!-- Birds -->
      <g fill="none" stroke="#0F2010" stroke-width="1.5" stroke-linecap="round" opacity=".7">
        <path d="M90,90 q3,-4 6,0 q3,-4 6,0"/>
        <path d="M120,80 q2.5,-3 5,0 q2.5,-3 5,0"/>
        <path d="M70,110 q2,-2.5 4,0 q2,-2.5 4,0"/>
      </g>

      <!-- Subtle FUTA Land watermark -->
      <text x="240" y="270" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="9"
            font-weight="700" fill="white" opacity=".4" letter-spacing="3">
        FUTA LAND
      </text>
    </svg>
  `;
}

// ============================================================
// COVER BIỆT THỰ - architectural site plan view
// ============================================================
function coverVillaSVG(project) {
  return `
    <svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="vSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1B5E20"/>
          <stop offset="40%" stop-color="#43A047"/>
          <stop offset="70%" stop-color="#7dd3fc"/>
          <stop offset="100%" stop-color="#bae6fd"/>
        </linearGradient>
        <linearGradient id="vWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0c4a6e"/>
        </linearGradient>
        <linearGradient id="vGrass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#86efac"/>
          <stop offset="100%" stop-color="#22c55e"/>
        </linearGradient>
        <linearGradient id="vRoof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#C8102E"/>
          <stop offset="100%" stop-color="#7f1d1d"/>
        </linearGradient>
        <linearGradient id="vWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFF8E1"/>
          <stop offset="100%" stop-color="#FFE0B2"/>
        </linearGradient>
        <pattern id="grassTexture" patternUnits="userSpaceOnUse" width="20" height="20">
          <rect width="20" height="20" fill="url(#vGrass)"/>
          <path d="M2,18 q2,-4 4,0 M8,18 q2,-4 4,0 M14,18 q2,-4 4,0" stroke="#15803d" stroke-width=".4" fill="none" opacity=".4"/>
        </pattern>
        <filter id="vShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5"/>
        </filter>
      </defs>

      <!-- Sky -->
      <rect width="480" height="100" fill="url(#vSky)"/>
      <!-- Sun -->
      <circle cx="400" cy="40" r="22" fill="#FFE082" opacity=".9"/>
      <circle cx="400" cy="40" r="35" fill="#FFD180" opacity=".3"/>

      <!-- Clouds -->
      <g fill="white" opacity=".7">
        <ellipse cx="80" cy="35" rx="22" ry="8"/>
        <ellipse cx="100" cy="30" rx="18" ry="9"/>
        <ellipse cx="200" cy="55" rx="25" ry="7"/>
        <ellipse cx="280" cy="40" rx="20" ry="8"/>
      </g>

      <!-- Trees background (forest) -->
      <g opacity=".85">
        ${Array.from({length: 12}, (_, i) => {
          const x = 10 + i * 42;
          return `<ellipse cx="${x}" cy="100" rx="28" ry="22" fill="#0F3D14"/>`;
        }).join('')}
      </g>

      <!-- River top -->
      <path d="M0,90 Q120,85 240,95 T480,92 L480,108 L0,108 Z" fill="url(#vWater)"/>
      <!-- River sparkle -->
      ${Array.from({length: 15}, (_, i) => `<circle cx="${20 + i*30}" cy="${96 + Math.sin(i)*3}" r=".8" fill="white" opacity=".8"/>`).join('')}

      <!-- Ground grass -->
      <rect x="0" y="108" width="480" height="172" fill="url(#grassTexture)"/>

      <!-- Walking paths -->
      <path d="M0,180 Q120,160 240,175 T480,170" stroke="#a78b6f" stroke-width="6" fill="none" opacity=".7"/>
      <path d="M240,108 L240,280" stroke="#a78b6f" stroke-width="5" fill="none" opacity=".5"/>

      <!-- Central pool -->
      <ellipse cx="240" cy="190" rx="35" ry="14" fill="url(#vWater)"/>
      <ellipse cx="240" cy="188" rx="30" ry="10" fill="#7dd3fc" opacity=".5"/>
      <text x="240" y="193" text-anchor="middle" font-family="sans-serif" font-size="6" fill="white" font-weight="700">HỒ BƠI</text>

      <!-- Villas row 1 (top) -->
      ${renderVillaRow(60, 130, 5, true)}
      <!-- Villas row 2 (bottom) -->
      ${renderVillaRow(60, 230, 5, false)}

      <!-- Foreground trees -->
      <g>
        <ellipse cx="25" cy="260" rx="16" ry="14" fill="#0F3D14"/>
        <ellipse cx="40" cy="255" rx="12" ry="16" fill="#1B5E20"/>
        <rect x="31" y="262" width="3" height="10" fill="#3E2723"/>

        <ellipse cx="455" cy="265" rx="18" ry="14" fill="#0F3D14"/>
        <ellipse cx="470" cy="258" rx="14" ry="16" fill="#1B5E20"/>
      </g>

      <!-- North arrow compass -->
      <g transform="translate(440,140)">
        <circle r="14" fill="white" opacity=".9"/>
        <polygon points="0,-10 4,5 0,2 -4,5" fill="#C8102E"/>
        <polygon points="0,10 4,-5 0,-2 -4,-5" fill="#0F2010" opacity=".5"/>
        <text y="-15" text-anchor="middle" font-size="6" font-weight="700" fill="#0F2010">N</text>
      </g>

      <!-- Watermark -->
      <text x="240" y="272" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="9"
            font-weight="700" fill="white" opacity=".7" letter-spacing="3">
        FUTA LAND VILLAS
      </text>
    </svg>
  `;
}

function renderVillaRow(startX, y, count, hasGarden) {
  let html = '';
  const spacing = 75;
  for (let i = 0; i < count; i++) {
    const x = startX + i * spacing;
    const isLarge = i % 2 === 0;
    const w = isLarge ? 42 : 36;
    const h = isLarge ? 28 : 24;

    html += `
      <!-- Shadow -->
      <ellipse cx="${x + w/2 + 2}" cy="${y + h + 3}" rx="${w/2}" ry="3" fill="black" opacity=".2" filter="url(#vShadow)"/>
      <!-- House body -->
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#vWall)" stroke="#92400e" stroke-width=".8"/>
      <!-- Roof -->
      <polygon points="${x-2},${y} ${x + w/2},${y - 14} ${x + w + 2},${y}" fill="url(#vRoof)" stroke="#7f1d1d" stroke-width=".8"/>
      <!-- Roof shadow line -->
      <line x1="${x-2}" y1="${y}" x2="${x + w + 2}" y2="${y}" stroke="#7f1d1d" stroke-width="1.5"/>
      <!-- Door -->
      <rect x="${x + w/2 - 3}" y="${y + h - 12}" width="6" height="12" fill="#3E2723"/>
      <!-- Windows -->
      <rect x="${x + 4}" y="${y + 6}" width="8" height="8" fill="#7dd3fc" stroke="#1e3a8a" stroke-width=".6"/>
      <rect x="${x + w - 12}" y="${y + 6}" width="8" height="8" fill="#7dd3fc" stroke="#1e3a8a" stroke-width=".6"/>
      <!-- Window cross -->
      <line x1="${x + 8}" y1="${y + 6}" x2="${x + 8}" y2="${y + 14}" stroke="#1e3a8a" stroke-width=".4"/>
      <line x1="${x + 4}" y1="${y + 10}" x2="${x + 12}" y2="${y + 10}" stroke="#1e3a8a" stroke-width=".4"/>
      ${isLarge ? `
        <!-- 2nd floor windows -->
        <rect x="${x + w/2 - 4}" y="${y - 8}" width="8" height="6" fill="#7dd3fc" stroke="#1e3a8a" stroke-width=".5"/>
      ` : ''}
      ${hasGarden ? `
        <!-- Small garden -->
        <circle cx="${x - 4}" cy="${y + h - 2}" r="3" fill="#1B5E20"/>
        <circle cx="${x + w + 4}" cy="${y + h - 2}" r="3" fill="#1B5E20"/>
      ` : ''}
    `;
  }
  return html;
}

// ============================================================
// MẶT BẰNG 2D ĐẸP - architectural floorplan
// Override floorplanSVG từ shared.js
// ============================================================
function floorplanArchitecturalSVG(unit) {
  const W = Math.sqrt((unit.area || 75) * 1.4);
  const D = (unit.area || 75) / W;
  const scale = 8;  // pixel per meter
  const w = W * scale + 60;
  const h = D * scale + 60;

  // Layout: living room (front) + bedrooms (back) + kitchen + bath
  const padding = 30;

  return `
    <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="background: #FFF8E1;">
      <defs>
        <pattern id="floorTile" patternUnits="userSpaceOnUse" width="20" height="20">
          <rect width="20" height="20" fill="#FFF8E1"/>
          <path d="M0,0 L20,0 M0,0 L0,20" stroke="#E0CFA3" stroke-width=".3"/>
        </pattern>
        <pattern id="bedTexture" patternUnits="userSpaceOnUse" width="8" height="8">
          <rect width="8" height="8" fill="#D7CCC8"/>
          <path d="M0,4 L8,4" stroke="#A1887F" stroke-width=".4"/>
        </pattern>
        <pattern id="kitchenTile" patternUnits="userSpaceOnUse" width="6" height="6">
          <rect width="6" height="6" fill="#E0F2F1"/>
          <rect x="0" y="0" width="3" height="3" fill="#B2DFDB" opacity=".6"/>
        </pattern>
      </defs>

      <!-- Background tiles -->
      <rect x="${padding}" y="${padding}" width="${W*scale}" height="${D*scale}" fill="url(#floorTile)"/>

      <!-- Phòng khách (lớn, trước) -->
      <g>
        <rect x="${padding}" y="${padding + D*scale*0.4}" width="${W*scale*0.6}" height="${D*scale*0.6}" fill="#FFF3E0" stroke="#5D4037" stroke-width="2"/>
        <!-- Sofa -->
        <rect x="${padding + 15}" y="${padding + D*scale - 25}" width="${W*scale*0.4}" height="12" rx="2" fill="#607D8B" stroke="#37474F" stroke-width="1"/>
        <rect x="${padding + 15}" y="${padding + D*scale - 27}" width="${W*scale*0.4}" height="3" rx="1" fill="#37474F"/>
        <!-- Coffee table -->
        <rect x="${padding + W*scale*0.15}" y="${padding + D*scale - 45}" width="30" height="15" rx="2" fill="#8D6E63" stroke="#3E2723" stroke-width=".8"/>
        <!-- TV -->
        <rect x="${padding + 5}" y="${padding + D*scale - 60}" width="${W*scale*0.5}" height="3" fill="#212121"/>
        <rect x="${padding + W*scale*0.2}" y="${padding + D*scale - 63}" width="20" height="6" fill="#1565C0"/>
        <!-- Label -->
        <text x="${padding + 10}" y="${padding + D*scale*0.5}" font-family="sans-serif" font-size="9" font-weight="700" fill="#3E2723">PHÒNG KHÁCH</text>
        <text x="${padding + 10}" y="${padding + D*scale*0.5 + 11}" font-family="sans-serif" font-size="6" fill="#5D4037">${Math.round(unit.area*0.35)} m²</text>
      </g>

      <!-- Bếp -->
      <g>
        <rect x="${padding}" y="${padding}" width="${W*scale*0.35}" height="${D*scale*0.4}" fill="url(#kitchenTile)" stroke="#5D4037" stroke-width="2"/>
        <!-- Counter -->
        <rect x="${padding + 3}" y="${padding + 3}" width="${W*scale*0.32}" height="8" fill="#90A4AE" stroke="#455A64" stroke-width=".5"/>
        <!-- Stove dots -->
        <circle cx="${padding + 10}" cy="${padding + 7}" r="2" fill="#212121"/>
        <circle cx="${padding + 18}" cy="${padding + 7}" r="2" fill="#212121"/>
        <!-- Sink -->
        <rect x="${padding + 5}" y="${padding + 15}" width="14" height="10" fill="#CFD8DC" stroke="#607D8B" stroke-width=".5" rx="1"/>
        <!-- Fridge -->
        <rect x="${padding + W*scale*0.28}" y="${padding + 3}" width="12" height="22" fill="#ECEFF1" stroke="#90A4AE" stroke-width=".5"/>
        <text x="${padding + 5}" y="${padding + D*scale*0.4 - 5}" font-family="sans-serif" font-size="7" font-weight="700" fill="#00695C">BẾP</text>
      </g>

      <!-- WC -->
      <g>
        <rect x="${padding + W*scale*0.35}" y="${padding}" width="${W*scale*0.2}" height="${D*scale*0.4}" fill="#E1F5FE" stroke="#5D4037" stroke-width="2"/>
        <!-- Toilet -->
        <ellipse cx="${padding + W*scale*0.42}" cy="${padding + 15}" rx="6" ry="8" fill="white" stroke="#0277BD" stroke-width=".6"/>
        <!-- Shower -->
        <rect x="${padding + W*scale*0.46}" y="${padding + 5}" width="12" height="15" fill="#B3E5FC" stroke="#0277BD" stroke-width=".5" rx="1"/>
        <circle cx="${padding + W*scale*0.46 + 6}" cy="${padding + 7}" r="1.5" fill="#0277BD"/>
        <text x="${padding + W*scale*0.37}" y="${padding + D*scale*0.4 - 5}" font-family="sans-serif" font-size="6" font-weight="700" fill="#01579B">WC</text>
      </g>

      <!-- Phòng ngủ 1 (master) -->
      <g>
        <rect x="${padding + W*scale*0.6}" y="${padding}" width="${W*scale*0.4}" height="${D*scale*0.55}" fill="#FFF3E0" stroke="#5D4037" stroke-width="2"/>
        <!-- Bed -->
        <rect x="${padding + W*scale*0.65}" y="${padding + 8}" width="${W*scale*0.3}" height="${D*scale*0.3}" fill="url(#bedTexture)" stroke="#5D4037" stroke-width=".8" rx="2"/>
        <!-- Pillows -->
        <rect x="${padding + W*scale*0.66}" y="${padding + 10}" width="${W*scale*0.12}" height="6" fill="white" stroke="#A1887F" stroke-width=".4" rx="1"/>
        <rect x="${padding + W*scale*0.82}" y="${padding + 10}" width="${W*scale*0.12}" height="6" fill="white" stroke="#A1887F" stroke-width=".4" rx="1"/>
        <!-- Wardrobe -->
        <rect x="${padding + W*scale*0.6 + 3}" y="${padding + D*scale*0.45}" width="${W*scale*0.35}" height="10" fill="#5D4037" stroke="#3E2723" stroke-width=".5"/>
        <text x="${padding + W*scale*0.63}" y="${padding + D*scale*0.6}" font-family="sans-serif" font-size="7" font-weight="700" fill="#3E2723">PHÒNG NGỦ 1</text>
        <text x="${padding + W*scale*0.63}" y="${padding + D*scale*0.6 + 9}" font-family="sans-serif" font-size="5" fill="#5D4037">${Math.round(unit.area*0.2)} m²</text>
      </g>

      ${unit.bedrooms >= 2 ? `
        <!-- Phòng ngủ 2 -->
        <g>
          <rect x="${padding + W*scale*0.6}" y="${padding + D*scale*0.55}" width="${W*scale*0.4}" height="${D*scale*0.45}" fill="#FFF3E0" stroke="#5D4037" stroke-width="2"/>
          <rect x="${padding + W*scale*0.65}" y="${padding + D*scale*0.6}" width="${W*scale*0.25}" height="${D*scale*0.25}" fill="url(#bedTexture)" stroke="#5D4037" stroke-width=".8" rx="2"/>
          <rect x="${padding + W*scale*0.66}" y="${padding + D*scale*0.62}" width="${W*scale*0.1}" height="5" fill="white" stroke="#A1887F" stroke-width=".4" rx="1"/>
          <!-- Desk -->
          <rect x="${padding + W*scale*0.92}" y="${padding + D*scale*0.62}" width="6" height="${D*scale*0.2}" fill="#8D6E63" stroke="#5D4037" stroke-width=".5"/>
          <text x="${padding + W*scale*0.63}" y="${padding + D*scale*0.92}" font-family="sans-serif" font-size="7" font-weight="700" fill="#3E2723">PHÒNG NGỦ 2</text>
          <text x="${padding + W*scale*0.63}" y="${padding + D*scale*0.92 + 8}" font-family="sans-serif" font-size="5" fill="#5D4037">${Math.round(unit.area*0.15)} m²</text>
        </g>
      ` : ''}

      <!-- Ban công -->
      ${unit.balcony ? `
        <g>
          <rect x="${padding}" y="${padding + D*scale}" width="${W*scale}" height="8" fill="#90A4AE" stroke="#455A64" stroke-width="1"/>
          <text x="${padding + W*scale/2}" y="${padding + D*scale + 6}" text-anchor="middle" font-family="sans-serif" font-size="5" font-weight="700" fill="white">BAN CÔNG</text>
        </g>
      ` : ''}

      <!-- Dimension lines -->
      <g stroke="#3E2723" stroke-width=".5" fill="#3E2723">
        <!-- Top width -->
        <line x1="${padding}" y1="${padding - 12}" x2="${padding + W*scale}" y2="${padding - 12}"/>
        <line x1="${padding}" y1="${padding - 15}" x2="${padding}" y2="${padding - 9}"/>
        <line x1="${padding + W*scale}" y1="${padding - 15}" x2="${padding + W*scale}" y2="${padding - 9}"/>
        <text x="${padding + W*scale/2}" y="${padding - 14}" text-anchor="middle" font-family="sans-serif" font-size="7" font-weight="600">${W.toFixed(1)} m</text>

        <!-- Left height -->
        <line x1="${padding - 12}" y1="${padding}" x2="${padding - 12}" y2="${padding + D*scale}"/>
        <line x1="${padding - 15}" y1="${padding}" x2="${padding - 9}" y2="${padding}"/>
        <line x1="${padding - 15}" y1="${padding + D*scale}" x2="${padding - 9}" y2="${padding + D*scale}"/>
        <text x="${padding - 18}" y="${padding + D*scale/2}" text-anchor="middle" font-family="sans-serif" font-size="7" font-weight="600" transform="rotate(-90 ${padding - 18} ${padding + D*scale/2})">${D.toFixed(1)} m</text>
      </g>

      <!-- North arrow -->
      <g transform="translate(${w - 25}, ${h - 20})">
        <circle r="10" fill="white" stroke="#3E2723" stroke-width=".8"/>
        <polygon points="0,-7 3,4 0,2 -3,4" fill="#C8102E"/>
        <text y="-12" text-anchor="middle" font-size="5" font-weight="700" fill="#3E2723">B</text>
      </g>

      <!-- Direction indicator -->
      <text x="${w/2}" y="${h - 5}" text-anchor="middle" font-family="sans-serif" font-size="6" fill="#5D4037">
        Hướng: ${unit.direction || 'Nam'} · View: ${unit.view || 'Đẹp'}
      </text>
    </svg>
  `;
}

// ============================================================
// VILLA ILLUSTRATION ĐẸP - perspective view
// ============================================================
function villaArchitecturalSVG(villa) {
  return `
    <svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vSky2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1976D2"/>
          <stop offset="100%" stop-color="#BBDEFB"/>
        </linearGradient>
        <linearGradient id="vGround2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#86efac"/>
          <stop offset="100%" stop-color="#1B5E20"/>
        </linearGradient>
        <linearGradient id="vRoof2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#EF5350"/>
          <stop offset="100%" stop-color="#7f1d1d"/>
        </linearGradient>
        <linearGradient id="vWall2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFDE7"/>
          <stop offset="100%" stop-color="#FFE0B2"/>
        </linearGradient>
        <linearGradient id="vWallShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFE0B2"/>
          <stop offset="100%" stop-color="#FFAB91"/>
        </linearGradient>
      </defs>

      <!-- Sky -->
      <rect width="480" height="180" fill="url(#vSky2)"/>
      <!-- Sun -->
      <circle cx="380" cy="45" r="25" fill="#FFE082"/>
      <circle cx="380" cy="45" r="40" fill="#FFD180" opacity=".4"/>
      <!-- Clouds -->
      <g fill="white" opacity=".85">
        <ellipse cx="80" cy="50" rx="30" ry="10"/>
        <ellipse cx="110" cy="45" rx="20" ry="11"/>
        <ellipse cx="220" cy="70" rx="28" ry="9"/>
      </g>

      <!-- Mountains background -->
      <path d="M0,180 L80,130 L160,160 L240,110 L320,150 L400,120 L480,160 L480,180 Z" fill="#0F3D14" opacity=".4"/>
      <path d="M0,180 L100,150 L180,170 L260,140 L340,165 L420,145 L480,170 L480,180 Z" fill="#0F3D14" opacity=".6"/>

      <!-- Distant trees -->
      ${Array.from({length: 15}, (_, i) => {
        const x = i * 35;
        return `<ellipse cx="${x}" cy="180" rx="14" ry="11" fill="#1B5E20"/>`;
      }).join('')}

      <!-- Ground -->
      <rect x="0" y="180" width="480" height="100" fill="url(#vGround2)"/>

      <!-- Driveway -->
      <polygon points="200,280 280,280 250,200 230,200" fill="#90A4AE" stroke="#607D8B" stroke-width="1"/>
      <line x1="240" y1="280" x2="240" y2="200" stroke="white" stroke-width="1" stroke-dasharray="4,3" opacity=".6"/>

      <!-- Villa main building (perspective) -->
      <g>
        <!-- Side wall (shadow) -->
        <polygon points="120,150 170,130 170,250 120,250" fill="url(#vWallShadow)" stroke="#92400e" stroke-width=".8"/>
        <!-- Front wall -->
        <rect x="170" y="130" width="180" height="120" fill="url(#vWall2)" stroke="#92400e" stroke-width="1"/>
        <!-- 2nd floor line -->
        <line x1="170" y1="180" x2="350" y2="180" stroke="#92400e" stroke-width=".5" opacity=".5"/>

        <!-- Side roof -->
        <polygon points="120,150 170,130 170,90 120,110" fill="#7f1d1d"/>
        <!-- Front roof -->
        <polygon points="170,130 350,130 350,90 170,90" fill="url(#vRoof2)" stroke="#7f1d1d" stroke-width="1"/>
        <!-- Roof line -->
        <line x1="120" y1="110" x2="120" y2="150" stroke="#7f1d1d" stroke-width="1"/>
        <line x1="350" y1="90" x2="350" y2="130" stroke="#7f1d1d" stroke-width="1"/>

        <!-- Chimney -->
        <rect x="290" y="75" width="14" height="25" fill="#5D4037"/>
        <rect x="288" y="73" width="18" height="4" fill="#3E2723"/>

        <!-- Front door -->
        <rect x="245" y="195" width="30" height="55" fill="#3E2723" stroke="#1A0E08" stroke-width="1"/>
        <circle cx="270" cy="222" r="1.5" fill="#FFB300"/>
        <!-- Steps -->
        <rect x="240" y="250" width="40" height="4" fill="#90A4AE"/>
        <rect x="235" y="254" width="50" height="4" fill="#78909C"/>

        <!-- Ground floor windows -->
        <g>
          <rect x="185" y="190" width="40" height="40" fill="#BBDEFB" stroke="#1565C0" stroke-width="1"/>
          <line x1="205" y1="190" x2="205" y2="230" stroke="#1565C0" stroke-width=".8"/>
          <line x1="185" y1="210" x2="225" y2="210" stroke="#1565C0" stroke-width=".8"/>
          <!-- Window frame shadow -->
          <rect x="185" y="190" width="40" height="40" fill="none" stroke="#FFF8E1" stroke-width="1.5"/>

          <rect x="295" y="190" width="40" height="40" fill="#BBDEFB" stroke="#1565C0" stroke-width="1"/>
          <line x1="315" y1="190" x2="315" y2="230" stroke="#1565C0" stroke-width=".8"/>
          <line x1="295" y1="210" x2="335" y2="210" stroke="#1565C0" stroke-width=".8"/>
          <rect x="295" y="190" width="40" height="40" fill="none" stroke="#FFF8E1" stroke-width="1.5"/>
        </g>

        <!-- 2nd floor windows -->
        <g>
          <rect x="185" y="145" width="30" height="28" fill="#BBDEFB" stroke="#1565C0" stroke-width=".8"/>
          <line x1="200" y1="145" x2="200" y2="173" stroke="#1565C0" stroke-width=".5"/>
          <rect x="230" y="145" width="30" height="28" fill="#BBDEFB" stroke="#1565C0" stroke-width=".8"/>
          <line x1="245" y1="145" x2="245" y2="173" stroke="#1565C0" stroke-width=".5"/>
          <rect x="275" y="145" width="30" height="28" fill="#BBDEFB" stroke="#1565C0" stroke-width=".8"/>
          <line x1="290" y1="145" x2="290" y2="173" stroke="#1565C0" stroke-width=".5"/>
          <rect x="315" y="145" width="30" height="28" fill="#BBDEFB" stroke="#1565C0" stroke-width=".8"/>
          <line x1="330" y1="145" x2="330" y2="173" stroke="#1565C0" stroke-width=".5"/>
        </g>

        <!-- Balcony -->
        <rect x="180" y="178" width="170" height="5" fill="#78909C"/>
        <g stroke="#37474F" stroke-width="1" fill="none">
          ${Array.from({length: 8}, (_, i) => `<line x1="${190 + i*20}" y1="178" x2="${190 + i*20}" y2="173"/>`).join('')}
        </g>
      </g>

      <!-- Pool (if luxury) -->
      ${villa.area >= 250 ? `
        <ellipse cx="400" cy="245" rx="40" ry="15" fill="#0288D1"/>
        <ellipse cx="400" cy="243" rx="35" ry="11" fill="#4FC3F7" opacity=".6"/>
      ` : ''}

      <!-- Garden elements -->
      <g>
        <!-- Front bushes -->
        <ellipse cx="180" cy="260" rx="15" ry="10" fill="#1B5E20"/>
        <ellipse cx="340" cy="260" rx="15" ry="10" fill="#1B5E20"/>
        <!-- Trees -->
        <g>
          <rect x="78" y="200" width="4" height="20" fill="#3E2723"/>
          <circle cx="80" cy="195" r="22" fill="#0F3D14"/>
          <circle cx="73" cy="200" r="15" fill="#1B5E20"/>
          <circle cx="88" cy="200" r="15" fill="#2E7D32"/>
        </g>
        <g>
          <rect x="430" y="210" width="4" height="20" fill="#3E2723"/>
          <circle cx="432" cy="205" r="20" fill="#0F3D14"/>
          <circle cx="425" cy="208" r="14" fill="#1B5E20"/>
        </g>
        <!-- Lamp posts -->
        <line x1="195" y1="260" x2="195" y2="245" stroke="#212121" stroke-width="1.5"/>
        <circle cx="195" cy="243" r="2.5" fill="#FFE082"/>
        <line x1="325" y1="260" x2="325" y2="245" stroke="#212121" stroke-width="1.5"/>
        <circle cx="325" cy="243" r="2.5" fill="#FFE082"/>
      </g>

      <!-- Info card overlay -->
      <g transform="translate(20,200)">
        <rect width="85" height="65" fill="white" opacity=".95" rx="6" stroke="#1B5E20" stroke-width="1"/>
        <text x="6" y="14" font-family="sans-serif" font-size="9" font-weight="700" fill="#1B5E20">${villa.id || 'V-01'}</text>
        <line x1="6" y1="18" x2="79" y2="18" stroke="#1B5E20" stroke-width=".5"/>
        <text x="6" y="30" font-family="sans-serif" font-size="6" fill="#3E2723">${villa.type || 'Biệt thự'}</text>
        <text x="6" y="40" font-family="sans-serif" font-size="6" fill="#3E2723">DTXD: ${villa.area || 250} m²</text>
        <text x="6" y="50" font-family="sans-serif" font-size="6" fill="#3E2723">DT đất: ${villa.landArea || 400} m²</text>
        <text x="6" y="60" font-family="sans-serif" font-size="6" fill="#C8102E" font-weight="700">${villa.bedrooms || 4} PN · ${villa.direction || 'Đông'}</text>
      </g>

      <!-- FUTA Watermark -->
      <text x="240" y="273" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="8"
            font-weight="700" fill="white" opacity=".7" letter-spacing="2">FUTA LAND VILLAS</text>
    </svg>
  `;
}
