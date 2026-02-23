/* ===== POINT CLOUD GLOBE ===== */
(function () {
    const canvas = document.getElementById('pointcloudCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const wrap = canvas.parentElement;

    let W, H, cx, cy, radius;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = wrap.clientWidth;
        H = wrap.clientHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx = W / 2;
        cy = H / 2;
        radius = Math.min(W, H) * 0.42;
    }

    resize();
    window.addEventListener('resize', resize);

    // Lat/lng to 3D unit sphere
    function ll(lat, lng) {
        const la = lat * Math.PI / 180;
        const lo = lng * Math.PI / 180;
        return {
            x: Math.cos(la) * Math.cos(lo),
            y: -Math.sin(la),
            z: -Math.cos(la) * Math.sin(lo)
        };
    }

    // Ray-casting point-in-polygon test (2D, for lat/lng)
    function pointInPoly(lat, lng, poly) {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const yi = poly[i][0], xi = poly[i][1];
            const yj = poly[j][0], xj = poly[j][1];
            if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    // Continent coastline outlines (closed polygons) — detailed coordinates
    const continents = [
        // Eurasia — single unified polygon tracing the entire coastline
        // Portugal → Atlantic Europe → Scandinavia → Arctic Russia → Pacific → China → India → Arabia → Turkey → Mediterranean → back to Portugal
        {
            outline: [
                // Portugal/Spain Atlantic coast (going north)
                [36.2, -5.6], [36.8, -7.0], [37.0, -8.9], [38.7, -9.5], [39.5, -9.4], [40.4, -8.8],
                [41.2, -8.8], [42.1, -8.9], [43.0, -9.3], [43.4, -8.2], [43.7, -7.7],
                // Northern Spain → France
                [43.5, -5.3], [43.4, -3.0], [43.4, -1.8], [43.3, -1.0],
                // French Atlantic coast
                [46.2, -1.2], [47.0, -2.5], [48.0, -5.0], [48.6, -4.5], [48.5, -3.0],
                [48.8, -1.5], [49.5, 0.0], [50.5, 1.5], [51.0, 2.0], [51.5, 3.5],
                // Netherlands / Germany coast
                [52.5, 5.0], [53.0, 7.0], [53.5, 8.5], [54.0, 9.0], [54.5, 10.0], [55.0, 10.5],
                // Denmark
                [55.5, 8.5], [57.0, 8.5], [57.6, 10.0], [56.5, 10.5],
                // Up Scandinavia — Norway west coast (detailed)
                [58.0, 6.0], [58.5, 5.5], [59.0, 5.5], [59.5, 5.0], [60.0, 5.0],
                [60.5, 5.0], [61.0, 5.0], [62.0, 5.5], [63.0, 7.0], [63.5, 9.0],
                [64.0, 11.0], [65.0, 12.0], [66.0, 13.0], [67.0, 14.5],
                [68.0, 15.5], [69.0, 16.0], [70.0, 18.0], [70.5, 20.0],
                // North Cape (tip of Norway)
                [71.0, 25.0], [71.1, 27.5],
                // East along northern Norway/Finland coast
                [70.5, 28.0], [70.0, 29.0], [69.5, 30.0], [69.0, 29.0], [68.5, 28.0],
                // Finland coast (Gulf of Bothnia east side)
                [67.5, 26.0], [66.0, 25.0], [65.0, 25.5], [64.0, 24.0],
                [63.0, 22.0], [62.0, 21.5], [61.0, 21.0], [60.5, 22.0],
                [60.0, 24.0], [59.5, 24.5], [60.0, 25.0], [60.5, 27.0], [61.0, 27.5], [62.0, 28.5],
                // Finland/Russia border → Murmansk
                [61.0, 28.0], [62.0, 30.0], [65.0, 35.0], [67.0, 38.0], [68.5, 40.0],
                // Arctic Russia coast going east
                [69.0, 44.0], [69.5, 50.0], [70.0, 55.0], [70.5, 60.0],
                [71.0, 70.0], [72.0, 80.0], [73.0, 90.0], [74.0, 100.0],
                [75.0, 110.0], [76.0, 120.0], [75.0, 140.0], [74.0, 160.0],
                [72.0, 175.0],
                // Kamchatka / Siberia Pacific coast going south
                [70.0, 175.0], [68.0, 170.0], [66.0, 165.0], [64.0, 160.0],
                [62.0, 155.0], [60.0, 150.0],
                [58.0, 141.0], [57.0, 139.0], [55.0, 138.0], [54.0, 139.0],
                [52.0, 141.0], [50.0, 141.0], [48.0, 140.0], [46.0, 137.0], [45.0, 134.0],
                // Russia/China border → Manchuria
                [44.0, 132.0], [43.0, 132.0], [42.0, 130.0], [41.0, 127.0],
                // Korea (east coast loop)
                [40.0, 124.0], [38.0, 126.0], [37.0, 127.0], [35.0, 126.0],
                // East China coast
                [38.0, 122.0], [36.0, 122.0], [34.0, 121.0], [32.0, 122.0],
                [31.0, 122.0], [30.0, 121.0], [28.0, 114.0], [26.0, 112.0], [24.0, 110.0],
                [22.0, 108.0], [21.0, 106.0], [18.0, 107.0], [16.0, 108.0],
                // Vietnam coast
                [12.0, 109.0], [10.0, 107.0], [8.0, 106.0],
                // Malay Peninsula
                [1.0, 104.0], [2.0, 104.0], [4.0, 103.0], [7.0, 101.0], [10.0, 100.0],
                [14.0, 99.0],
                // Thailand/Myanmar
                [15.0, 98.0], [16.0, 96.0], [18.0, 94.0], [21.0, 92.0], [22.0, 90.0],
                // Bangladesh → India east coast
                [22.0, 88.0], [20.0, 86.0], [17.0, 82.0], [15.0, 80.0], [13.0, 80.0],
                [10.0, 80.0], [8.0, 80.0],
                // India south tip → west coast
                [6.0, 80.0], [7.0, 78.0], [8.0, 77.0],
                [10.0, 76.0], [12.0, 76.0], [14.0, 75.0], [16.0, 74.0], [18.0, 73.0],
                [20.0, 72.0], [21.0, 70.0], [22.0, 69.5], [23.0, 68.5], [24.0, 68.0],
                // Pakistan → Iran → Persian Gulf
                [25.0, 66.0], [26.0, 63.0], [27.0, 60.0], [28.0, 57.0],
                [30.0, 52.0], [33.0, 52.0], [32.0, 48.0], [31.0, 47.0],
                // Persian Gulf coast → Oman/UAE
                [30.0, 48.0], [29.0, 48.0], [28.0, 49.0], [27.0, 50.0],
                [26.0, 52.0], [25.0, 55.0], [24.0, 56.0], [23.0, 58.0], [22.0, 59.0],
                // Oman south → Yemen
                [20.0, 58.0], [18.0, 57.0], [16.0, 53.0], [14.0, 50.0], [13.0, 48.0],
                // Yemen → Red Sea coast going north
                [15.0, 44.0], [13.0, 45.0], [12.0, 45.0],
                [18.0, 43.0], [20.0, 42.0], [22.0, 39.0], [24.0, 38.0],
                [26.0, 37.0], [28.0, 38.0], [30.0, 40.0], [32.0, 42.0],
                // Levant → Turkey
                [33.0, 44.0], [34.0, 44.0], [35.0, 46.0], [36.0, 48.0],
                [37.0, 44.0], [38.0, 40.0], [39.0, 36.0], [40.0, 30.0],
                [41.0, 29.0], [42.0, 28.0],
                // Turkey Thrace → Greece
                [41.5, 29.0], [41.0, 26.0], [40.5, 23.0],
                [39.6, 20.5], [39.0, 20.0], [38.5, 21.5], [38.0, 23.5], [37.5, 24.0],
                [37.2, 23.5], [37.0, 23.0], [36.5, 22.5], [36.0, 23.0], [35.5, 24.0], [35.0, 25.0], [35.5, 26.0], [36.0, 27.0],
                [37.8, 23.0], [38.0, 22.0], [37.5, 20.5], [37.0, 21.5], [36.5, 22.5],
                // Peloponnese → up Adriatic
                [37.0, 22.0], [37.5, 21.5], [38.0, 21.0], [38.5, 20.0],
                [39.5, 20.0], [40.5, 19.5], [41.5, 19.5], [42.5, 18.5], [43.0, 17.0],
                [43.5, 16.0], [44.0, 15.5], [44.5, 14.5], [45.0, 14.0], [45.5, 13.5],
                // North Adriatic → Italy
                [45.5, 12.5], [44.5, 12.3], [44.0, 12.5], [43.5, 13.5], [42.5, 14.0],
                // Italy east coast going south
                [42.0, 15.1], [41.0, 16.0], [40.5, 17.5], [40.0, 18.5],
                // Italy boot toe
                [39.0, 17.0], [38.2, 16.0], [37.5, 15.5], [38.0, 13.0],
                // Sicily, back up west coast
                [38.5, 12.5], [39.0, 14.5], [39.5, 16.0], [40.0, 15.0], [40.5, 14.5],
                [41.0, 13.5], [41.5, 12.5], [42.0, 11.5], [42.5, 11.0], [43.0, 10.5],
                // Ligurian coast → French Riviera
                [43.5, 10.0], [44.0, 9.5], [43.8, 8.0], [43.5, 7.0], [43.3, 6.5], [43.3, 5.0],
                [43.0, 3.5], [42.5, 3.1],
                // South France / Spanish Mediterranean
                [41.5, 2.0], [41.0, 1.0], [40.5, 0.5], [39.5, 0.0], [38.5, -0.5],
                [38.0, -0.5], [37.5, -1.0], [37.0, -1.5], [36.7, -2.5],
                // Strait of Gibraltar back to start
                [36.3, -4.5], [36.2, -5.6]
            ], fill: true
        },
        // North America + Central America — clean loop: Alaska → Pacific coast → Mexico → Central America → Panama → Caribbean/Gulf → Florida → East coast → Canada → Arctic → back
        {
            outline: [
                // Alaska/BC border south along Pacific
                [60.0, -141.0], [59.0, -138.0], [57.5, -136.0], [56.0, -133.0],
                [55.0, -131.0], [54.0, -130.0], [53.0, -129.5], [51.5, -128.0],
                [50.5, -127.5], [49.5, -126.5], [49.0, -125.5],
                // Washington / Oregon / California
                [48.5, -124.7], [47.5, -124.3], [46.5, -124.0], [45.5, -124.0],
                [44.0, -124.2], [43.0, -124.4], [42.0, -124.3], [41.0, -124.1],
                [40.0, -124.3], [39.0, -123.5], [38.0, -122.8], [37.5, -122.5],
                [37.0, -122.4], [36.5, -122.0], [36.0, -121.5], [35.5, -120.8],
                // Southern California
                [34.5, -120.5], [34.0, -119.5], [33.8, -118.4], [33.5, -117.8],
                [32.7, -117.2], [32.0, -117.0],
                // Baja California
                [31.0, -116.0], [30.0, -115.5], [28.5, -114.0], [27.0, -112.5],
                [25.0, -111.0], [23.5, -110.0], [23.0, -110.0],
                // Mexican Pacific coast (going south)
                [22.0, -105.5], [21.0, -105.2], [20.0, -105.5], [19.0, -105.0],
                [18.0, -103.5], [17.5, -101.5], [16.5, -99.0], [15.5, -96.5],
                [15.0, -93.0], [14.5, -91.0],
                // Central America Pacific coast (Guatemala → El Salvador → Nicaragua → Costa Rica → Panama)
                [14.0, -90.5], [13.5, -89.5], [13.0, -88.0], [12.5, -87.5],
                [12.0, -86.5], [11.5, -85.5], [11.0, -84.0], [10.5, -83.5],
                [10.0, -83.0], [9.5, -84.0], [9.0, -83.5], [8.5, -82.5],
                [8.0, -82.0], [8.0, -80.0], [8.0, -79.0], [8.0, -77.5],
                // Panama/Colombia border → Caribbean side going north
                [9.0, -77.5], [9.5, -76.5], [10.0, -76.0], [11.0, -75.5],
                [12.0, -72.0], [12.5, -71.5],
                // Venezuela/Caribbean coast → Yucatan
                [12.0, -70.0], [12.5, -68.0], [12.0, -65.0],
                // Jump up through Caribbean (Lesser Antilles skipped, to Yucatan)
                [15.0, -83.0], [16.0, -83.5], [17.0, -83.5],
                [18.0, -84.0], [19.0, -85.0], [20.0, -86.5],
                // Yucatan east coast going north
                [20.5, -87.0], [21.0, -87.5], [21.5, -88.5], [21.5, -90.0],
                [21.0, -90.5], [20.0, -91.0], [19.0, -91.0],
                // Gulf coast Texas/Louisiana
                [18.5, -93.0], [19.0, -95.0], [20.5, -97.0],
                [22.0, -97.5], [24.0, -98.0], [26.0, -97.2],
                [27.0, -97.0], [28.0, -96.5], [29.0, -95.0],
                [29.5, -94.0], [29.5, -93.0], [29.5, -91.0],
                // Mississippi Delta / Gulf coast east
                [29.0, -89.5], [29.5, -89.0], [30.0, -88.5], [30.5, -87.5],
                [30.0, -86.0], [30.0, -85.0], [30.0, -84.0],
                // Florida panhandle → Florida peninsula
                [29.5, -83.0], [29.0, -82.5], [28.5, -82.5], [27.5, -82.5],
                [26.0, -82.0], [25.5, -81.0], [25.0, -80.5],
                // Florida tip → up east coast
                [25.5, -80.2], [26.0, -80.1], [26.5, -80.0], [27.0, -80.2],
                [27.5, -80.4], [28.0, -80.5], [29.0, -81.0], [30.0, -81.5], [30.5, -81.3],
                [31.5, -81.0], [32.0, -80.8],
                // East coast: Georgia → Carolinas → Virginia
                [33.0, -79.5], [34.0, -78.0], [35.0, -76.0], [35.5, -75.5],
                [36.5, -76.0], [37.0, -76.0], [37.5, -76.2], [38.5, -75.5],
                // Mid-Atlantic / New England
                [39.0, -75.0], [39.5, -74.2], [40.5, -74.0], [41.0, -72.0],
                [41.5, -71.0], [42.0, -70.5], [42.5, -70.0], [43.0, -70.5],
                [44.0, -68.5], [44.5, -67.0], [45.0, -67.0],
                // Maritime Canada
                [45.5, -64.5], [46.0, -61.0], [47.0, -60.0], [47.5, -59.0],
                [48.5, -56.0], [49.0, -55.5],
                // Labrador
                [50.0, -55.5], [51.5, -55.5], [53.0, -56.5], [55.0, -59.5],
                [57.0, -61.5], [58.5, -63.0], [60.0, -64.0],
                // Hudson Bay east side
                [60.5, -65.0], [61.0, -70.0], [62.0, -72.0], [63.0, -76.0],
                [63.5, -78.0], [63.0, -81.0], [62.0, -83.0],
                // Hudson Bay south/west
                [60.0, -85.0], [58.0, -88.0], [57.0, -92.0], [56.5, -94.0],
                [57.5, -93.0], [58.5, -94.0], [60.0, -94.0],
                // Northern Manitoba/Nunavut coast
                [62.0, -92.0], [63.0, -90.0], [64.0, -90.0], [65.0, -88.0],
                [66.0, -86.0], [67.0, -87.0], [68.0, -90.0],
                // Arctic Archipelago (wide sweep)
                [69.0, -95.0], [70.0, -100.0], [71.0, -107.0], [72.0, -113.0],
                [73.0, -120.0], [74.0, -125.0], [73.5, -130.0],
                [72.5, -135.0], [71.5, -137.0],
                // Alaska north coast (wide)
                [70.0, -141.0], [70.5, -145.0], [71.0, -150.0], [70.5, -152.0],
                [70.0, -155.0], [69.0, -157.0], [68.0, -160.0],
                [66.5, -163.0], [65.0, -166.0], [64.0, -167.0],
                // Alaska west coast (bulge out)
                [63.0, -165.0], [62.5, -167.0], [62.0, -166.5],
                [61.0, -165.0], [60.5, -165.0], [60.0, -164.0],
                [59.5, -163.0], [59.0, -161.0], [58.5, -158.0],
                [58.0, -155.0], [57.5, -152.0],
                [59.0, -150.0], [59.5, -146.0],
                [60.0, -141.0]
            ], fill: true
        },
        // South America — starts at Colombia/Venezuela (~8°N), shares border with Central America
        {
            outline: [
                // Colombia/Venezuela Caribbean coast
                [12.5, -71.5], [12, -70], [11.5, -74], [11, -75], [10.5, -76], [10, -77],
                // Colombia Pacific coast
                [9, -77], [8, -78], [7, -78], [5, -77], [4, -77.5], [2, -79], [0, -80],
                // Ecuador / Peru
                [-2, -80.5], [-4, -81], [-6, -81], [-7, -79], [-8, -77], [-10, -76], [-12, -77], [-14, -76],
                [-16, -75], [-18, -71],
                // Chile / Argentina
                [-20, -70], [-22, -70], [-24, -70], [-26, -70], [-28, -71], [-30, -71],
                [-33, -72], [-35, -72], [-37, -73], [-40, -73], [-42, -72], [-44, -73], [-46, -74], [-48, -74],
                // Tierra del Fuego
                [-50, -74], [-52, -70], [-53, -69], [-55, -67], [-55, -65], [-53, -64], [-50, -65],
                // Argentina / Uruguay / Brazil east coast going north
                [-48, -65], [-46, -65], [-44, -64], [-42, -63], [-40, -62], [-38, -57], [-36, -54], [-34, -52],
                [-32, -51], [-30, -50], [-28, -49], [-26, -48], [-24, -46], [-22, -44], [-20, -41], [-18, -40], [-17, -38],
                [-14, -36], [-12, -35], [-10, -34], [-8, -34.5],
                // Brazil northeast bulge
                [-5, -35], [-3, -38], [-2, -44], [0, -50], [1, -51], [2, -52],
                // Guyana / Venezuela coast
                [4, -52], [6, -55], [7, -57], [8, -60], [9, -62], [10, -65],
                [11, -68], [12, -70], [12.5, -71.5]
            ], fill: true
        },
        // Africa — proper continuous coastline: Morocco → West Africa coast → Angola → Cape → East Africa → Horn of Africa → Egypt → back
        {
            outline: [
                // North Africa: Morocco → Tunisia
                [35.8, -5.5], [36, -2], [36.5, 0], [37, 3], [37, 10], [36.5, 11],
                // Libya/Egypt Mediterranean coast
                [33, 12], [32, 15], [31, 17], [31, 20], [31, 25], [31, 28], [31, 30], [31, 32],
                // Sinai/Red Sea
                [30, 33], [28, 34], [26, 35], [24, 36], [22, 37], [20, 38], [18, 40],
                // Horn of Africa (Somalia)
                [15, 42], [12, 44], [11, 46], [10, 48], [10, 50], [12, 51],
                [10, 51], [8, 49], [5, 47], [2, 46], [0, 45], [-1, 44],
                // East African coast going south
                [-2, 41], [-4, 40], [-6, 39], [-8, 40], [-10, 40],
                [-12, 41], [-14, 41], [-16, 40], [-18, 38], [-20, 36],
                [-22, 35], [-24, 36], [-26, 35], [-28, 33], [-30, 32], [-31, 31],
                // South Africa
                [-32, 29], [-33, 27], [-34, 25], [-34.5, 22], [-34, 19], [-34, 18],
                // Cape of Good Hope → up west coast
                [-33, 17], [-31, 16], [-29, 15], [-27, 14], [-25, 14],
                [-23, 13], [-21, 13], [-19, 12], [-17, 12], [-15, 12],
                [-13, 13], [-11, 14], [-9, 13], [-7, 12], [-6, 10],
                // West Africa coast: Gabon → Cameroon → Nigeria → Ghana
                [-4, 10], [-2, 10], [0, 9], [1, 10], [3, 9.5], [4, 7], [5, 5], [5, 2],
                [5, 0], [5, -2], [5, -5],
                // Gulf of Guinea coast
                [6, -5], [6, -3], [6, -1], [5, 0], [5, 2],
                // Ivory Coast → Liberia → Sierra Leone → Guinea
                [5, -4], [6, -8], [7, -11], [8, -13], [9, -14],
                // Senegal → Mauritania → Morocco coast
                [10, -15], [12, -16], [14, -17], [15, -17], [17, -16], [19, -17], [21, -17],
                [23, -16], [25, -16], [27, -14], [29, -12], [31, -10],
                [33, -8], [34, -6], [35, -5], [35.8, -5.5]
            ], fill: true
        },
        // Australia
        {
            outline: [
                [-12, 130], [-12, 133], [-12, 136], [-13, 137], [-14, 138], [-15, 139], [-17, 141],
                [-19, 145], [-20, 148], [-22, 150], [-24, 152], [-26, 153], [-28, 153], [-30, 153],
                [-32, 152], [-34, 151], [-36, 150], [-37, 149], [-38, 147], [-39, 146], [-38, 144],
                [-38, 141], [-37, 139], [-36, 137], [-35, 137], [-34, 135], [-33, 131], [-32, 128],
                [-31, 125], [-32, 121], [-33, 118], [-34, 115], [-32, 115], [-30, 114], [-28, 114], [-26, 114], [-24, 114], [-22, 114], [-20, 116],
                [-18, 119], [-16, 122], [-14, 126], [-13, 129], [-12, 130]
            ], fill: true
        },
        // Greenland
        {
            outline: [
                [60, -43], [62, -41], [64, -40], [66, -36], [68, -33], [70, -28], [72, -24], [74, -20],
                [76, -19], [78, -20], [79, -25], [80, -30], [81, -38], [82, -44], [81, -50], [80, -55],
                [78, -60], [76, -65], [74, -67], [72, -68], [70, -65], [68, -58], [66, -52], [64, -47],
                [63, -43], [61, -43], [60, -43]
            ], fill: true
        },
        // UK (Great Britain)
        {
            outline: [
                [50.0, -5.5], [50.5, -4.5], [50.8, -1.0], [51.0, 1.0], [51.5, 1.3], [52.0, 1.5],
                [52.8, 1.2], [53.5, 0.0], [54.0, -0.5], [54.5, -1.5], [55.0, -1.8], [55.5, -2.0],
                [56.0, -3.0], [56.5, -4.5], [57.0, -5.5], [57.5, -5.0], [58.0, -5.0], [58.5, -3.0],
                [57.5, -2.0], [57.0, -2.0], [56.5, -3.0], [56.0, -3.5], [55.5, -4.5], [55.0, -5.0],
                [54.5, -5.5], [54.0, -5.0], [53.5, -4.5], [53.0, -4.0], [52.5, -4.5], [52.0, -5.0],
                [51.5, -5.0], [51.0, -5.0], [50.0, -5.5]
            ], fill: true
        },
        // Ireland
        {
            outline: [
                [51.4, -10.0], [52.0, -10.5], [52.5, -10.0], [53.0, -10.0], [53.5, -10.0],
                [54.0, -10.0], [54.5, -8.5], [55.0, -7.5], [55.3, -6.5], [55.0, -6.0],
                [54.5, -6.0], [54.0, -6.0], [53.5, -6.0], [53.0, -6.0], [52.5, -6.5],
                [52.0, -7.0], [51.5, -9.5], [51.4, -10.0]
            ], fill: true
        },
        // Japan (Honshu + Hokkaido)
        {
            outline: [
                [31.0, 131.0], [32.0, 131.5], [33.0, 132.5], [33.5, 133.5], [34.0, 134.5],
                [34.5, 135.0], [35.0, 136.0], [35.5, 136.5], [36.0, 137.0], [36.5, 137.5],
                [37.0, 138.0], [37.5, 139.0], [38.0, 139.5], [38.5, 140.0], [39.0, 140.0],
                [39.5, 140.0], [40.0, 140.0], [40.5, 140.5], [41.0, 141.0], [41.5, 141.0],
                [42.0, 141.5], [42.5, 142.0], [43.0, 143.0], [43.5, 145.0], [44.0, 145.5],
                [45.0, 142.0], [44.0, 143.0], [43.0, 141.5], [42.0, 140.0], [41.5, 140.5],
                [41.0, 140.0], [40.0, 139.5], [39.0, 138.5], [38.0, 138.5], [37.0, 137.0],
                [36.0, 136.0], [35.0, 135.0], [34.0, 133.0], [33.0, 132.0], [31.0, 131.0]
            ], fill: true
        },
        // Sumatra
        {
            outline: [
                [5.5, 95.5], [5, 96], [4, 98], [3, 100], [2, 101], [1, 103], [0, 104],
                [-1, 104.5], [-2, 105], [-3, 105.5], [-5, 105], [-5.5, 104],
                [-5, 103], [-4, 102], [-3, 101], [-2, 100], [-1, 99], [0, 98],
                [1, 97], [2, 96], [3, 95.5], [4, 95], [5.5, 95.5]
            ], fill: true
        },
        // Java
        {
            outline: [
                [-6, 105.5], [-6, 107], [-6.5, 108], [-7, 109], [-7.5, 110], [-8, 111],
                [-8, 112], [-8, 113], [-8, 114], [-7.5, 114.5], [-7, 114],
                [-6.5, 112], [-6, 111], [-6, 110], [-5.5, 109], [-5.5, 108],
                [-5.5, 107], [-6, 106], [-6, 105.5]
            ], fill: true
        },
        // Borneo (Kalimantan)
        {
            outline: [
                [7, 117], [6, 118], [5, 118.5], [4, 118], [3, 118], [2, 117.5],
                [1, 117], [0, 117], [-1, 116.5], [-2, 116], [-3, 116], [-4, 115.5],
                [-4, 114], [-3, 112], [-2, 111], [-1, 110], [0, 109], [1, 109],
                [2, 110], [3, 110.5], [4, 111], [5, 113], [6, 114],
                [7, 115], [7, 116], [7, 117]
            ], fill: true
        },
        // Sulawesi
        {
            outline: [
                [-1, 120], [0, 121], [1, 122], [1, 123], [0, 123], [-1, 122.5],
                [-2, 122], [-3, 121], [-4, 122], [-5, 122.5], [-5, 121],
                [-4, 120], [-3, 120], [-2, 120], [-1, 120]
            ], fill: true
        },
        // Papua / New Guinea
        {
            outline: [
                [-2, 132], [-1, 134], [0, 136], [-1, 138], [-2, 140], [-3, 142],
                [-4, 144], [-5, 146], [-6, 148], [-7, 148], [-8, 147], [-9, 146],
                [-10, 144], [-9, 142], [-8, 140], [-7, 138], [-6, 136], [-5, 135],
                [-4, 134], [-3, 133], [-2, 132]
            ], fill: true
        },
        // Philippines (Luzon + Visayas + Mindanao as one shape)
        {
            outline: [
                [18.5, 120.5], [18, 121], [17, 121.5], [16, 121], [15, 121.5],
                [14, 122], [13, 123], [12, 124], [11, 124.5], [10, 124],
                [9, 125], [8, 126], [7, 126.5], [7, 126], [8, 125],
                [9, 124], [10, 123.5], [11, 123], [12, 122], [13, 121],
                [14, 120.5], [15, 120], [16, 120], [17, 120.5], [18, 121], [18.5, 120.5]
            ], fill: true
        },
        // Taiwan
        {
            outline: [
                [25, 121], [24.5, 121.5], [24, 121.5], [23, 121], [22.5, 120.5],
                [22, 120], [22.5, 120], [23, 120.5], [24, 121], [25, 121]
            ], fill: true
        },
        // New Zealand
        {
            outline: [
                [-35, 174], [-36, 175], [-37, 176], [-38, 177], [-39, 177], [-40, 176],
                [-41, 175], [-42, 173], [-43, 172], [-44, 170], [-46, 168], [-45, 167],
                [-44, 168], [-43, 170], [-42, 171], [-41, 173], [-40, 175], [-39, 176],
                [-38, 176], [-37, 176], [-36, 175], [-35, 174]
            ], fill: true
        },
        // Madagascar
        {
            outline: [
                [-12, 49], [-13, 49], [-15, 48], [-17, 46], [-18, 44], [-20, 44], [-22, 44],
                [-24, 44], [-25, 46], [-26, 47], [-25, 48], [-24, 49], [-22, 50], [-20, 50],
                [-18, 50], [-16, 50], [-14, 50], [-12, 49]
            ], fill: true
        },
        // Iceland
        {
            outline: [
                [64, -22], [64.5, -21], [65, -18], [65.5, -16], [66, -15], [66, -14],
                [65.5, -14], [65, -16], [64.5, -18], [64, -20], [63.5, -21], [63.8, -22], [64, -22]
            ], fill: true
        },
        // Sri Lanka
        {
            outline: [
                [9.5, 80], [8.5, 81], [7.5, 81.5], [7, 81.5], [6.5, 81], [6, 80.5], [6.5, 80], [7, 79.8],
                [8, 79.8], [9, 80], [9.5, 80]
            ], fill: true
        },
    ];

    const points = [];

    // Generate continent outline points (coastlines)
    continents.forEach(({ outline }) => {
        for (let i = 0; i < outline.length - 1; i++) {
            const [lat1, lng1] = outline[i];
            const [lat2, lng2] = outline[i + 1];
            const dist = Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2);
            const steps = Math.max(1, Math.round(dist / 1.2));
            for (let s = 0; s <= steps; s++) {
                const stepT = s / steps;
                const flat = lat1 + (lat2 - lat1) * stepT;
                const flng = lng1 + (lng2 - lng1) * stepT;
                const p = ll(flat, flng);

                // Categorize point for color sync
                let cat = 'global';
                if (flng < -30 && flng > -170 && flat > -10) cat = 'na'; // N. America
                else if (flng > -15 && flng < 40 && flat > 35) cat = 'eu'; // Europe

                points.push({
                    ...p, ox: p.x, oy: p.y, oz: p.z,
                    size: 1.3 + Math.random() * 0.3,
                    isHub: false, isContinent: true,
                    alpha: 0.6 + Math.random() * 0.25,
                    category: cat
                });
            }
        }
    });

    // Fill continent interiors with scattered dots using point-in-polygon
    const fillDensity = 2.8; // degrees between fill dots
    continents.forEach(({ outline, fill }) => {
        if (!fill) return;
        // Find bounding box
        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        outline.forEach(([la, lo]) => {
            if (la < minLat) minLat = la;
            if (la > maxLat) maxLat = la;
            if (lo < minLng) minLng = lo;
            if (lo > maxLng) maxLng = lo;
        });
        // Fill with grid + jitter
        for (let lat = minLat; lat <= maxLat; lat += fillDensity) {
            for (let lng = minLng; lng <= maxLng; lng += fillDensity) {
                const jLat = lat + (Math.random() - 0.5) * fillDensity * 0.8;
                const jLng = lng + (Math.random() - 0.5) * fillDensity * 0.8;
                if (pointInPoly(jLat, jLng, outline)) {
                    const p = ll(jLat, jLng);

                    // Categorize point for color sync
                    let cat = 'global';
                    if (jLng < -30 && jLng > -170 && jLat > -10) cat = 'na'; // N. America
                    else if (jLng > -15 && jLng < 40 && jLat > 35) cat = 'eu'; // Europe

                    points.push({
                        ...p, ox: p.x, oy: p.y, oz: p.z,
                        size: 0.8 + Math.random() * 0.5,
                        isHub: false, isContinent: true,
                        alpha: 0.25 + Math.random() * 0.25,
                        category: cat
                    });
                }
            }
        }
    });

    // North American hubs (Secure)
    const naHubs = [
        [42.4, -71.1],   // Boston
        [40.7, -74.0],   // NYC
        [38.9, -77.0],   // Washington DC
        [39.9, -75.2],   // Philadelphia
        [34.1, -118.2],  // Los Angeles
        [37.8, -122.4],  // San Francisco
        [47.6, -122.3],  // Seattle
        [41.9, -87.6],   // Chicago
        [29.8, -95.4],   // Houston
        [33.7, -84.4],   // Atlanta
        [39.7, -105.0],  // Denver
        [19.4, -99.1],   // Mexico City
        [43.7, -79.4],   // Toronto
        [49.3, -123.1],  // Vancouver
    ];
    // EU hubs
    const euHubs = [
        [51.5, -0.1],    // London
        [50.1, 8.7],     // Frankfurt
        [48.9, 2.3],     // Paris
        [47.4, 8.5],     // Zurich
        [52.5, 13.4],    // Berlin
        [45.5, 9.2],     // Milan
        [59.3, 18.1],    // Stockholm
        [40.4, -3.7],    // Madrid
    ];
    // Global hubs (will lose connections in Phase 3)
    const globalHubs = [
        [35.7, 139.7],   // Tokyo
        [1.4, 103.8],    // Singapore
        [31.2, 121.5],   // Shanghai
        [19.1, 72.9],    // Mumbai
        [25.3, 55.3],    // Dubai
        [-23.5, -46.6],  // São Paulo
        [22.3, 114.2],   // Hong Kong
        [37.6, 127.0],   // Seoul
        [-26.2, 28.0],   // Johannesburg
        [30.0, 31.2],    // Cairo
        [6.5, 3.4],      // Lagos
        [-1.3, 36.8],    // Nairobi
        [33.6, -7.6],    // Casablanca
        [-34.6, -58.4],  // Buenos Aires
        [-33.4, -70.6],  // Santiago
        [4.7, -74.1],    // Bogota
        [-12.0, -77.0],  // Lima
        [-33.9, 151.2],  // Sydney
        [-37.8, 144.9],  // Melbourne
        [-36.8, 174.8],  // Auckland
        [24.7, 46.7],    // Riyadh
        [41.0, 29.0],    // Istanbul
        [39.9, 116.4],   // Beijing
        [28.6, 77.2],    // Delhi
        [13.7, 100.5],   // Bangkok
        [-6.2, 106.8],   // Jakarta
        [14.6, 121.0],   // Manila
        // Additional China Hubs
        [23.1, 113.3],   // Guangzhou
        [30.6, 104.1],   // Chengdu
        [39.1, 117.2],   // Tianjin
        [32.0, 118.8],   // Nanjing
        [30.3, 120.2],   // Hangzhou
    ];

    const hubs = [...naHubs, ...euHubs, ...globalHubs];
    const hubStart = points.length;

    // Track which category each hub belongs to
    const hubCategories = [];
    naHubs.forEach(() => hubCategories.push('na'));
    euHubs.forEach(() => hubCategories.push('eu'));
    globalHubs.forEach(() => hubCategories.push('global'));

    hubs.forEach((h, idx) => {
        const [lat, lng] = h;
        const p = ll(lat, lng);
        points.push({
            ...p, ox: p.x, oy: p.y, oz: p.z,
            size: 4, isHub: true, isContinent: false, alpha: 1,
            category: hubCategories[idx]
        });
    });

    // Subtle grid dots on the sphere (latitude/longitude grid feel)
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < 180; i++) {
        const y = 1 - (i / 179) * 2;
        const r = Math.sqrt(1 - y * y);
        const x = Math.cos(ga * i) * r;
        const z = Math.sin(ga * i) * r;
        const lat = Math.asin(-y) * 180 / Math.PI;
        const lng = Math.atan2(-z, x) * 180 / Math.PI;
        let onLand = false;
        for (const c of continents) {
            if (pointInPoly(lat, lng, c.outline)) { onLand = true; break; }
        }
        if (!onLand) {
            points.push({
                x, y, z, ox: x, oy: y, oz: z,
                size: 0.35, isHub: false, isContinent: false,
                alpha: 0.06, category: 'global'
            });
        }
    }

    // Create connections that look like an evenly distributed global supply chain
    const connections = [];
    const addedPairs = new Set();

    // For each hub, connect to a mix of nearest and mid-range neighbors to spread the web
    for (let i = 0; i < hubs.length; i++) {
        const hi = hubStart + i;
        const dists = [];
        for (let j = 0; j < hubs.length; j++) {
            if (i === j) continue;
            const hj = hubStart + j;
            const dx = points[hi].ox - points[hj].ox;
            const dy = points[hi].oy - points[hj].oy;
            const dz = points[hi].oz - points[hj].oz;
            dists.push({ idx: j, hj, d: Math.sqrt(dx * dx + dy * dy + dz * dz) });
        }

        // Sort by distance
        dists.sort((a, b) => a.d - b.d);

        // Pick 4 connections: 2 nearest, 2 randomly from the next 6 closest (for spread)
        const targets = [];
        if (dists.length > 0) targets.push(dists[0]);
        if (dists.length > 1) targets.push(dists[1]);

        const possibleMidRange = dists.slice(2, 8);
        // Shuffle the midrange candidates
        for (let m = possibleMidRange.length - 1; m > 0; m--) {
            const j = Math.floor(Math.random() * (m + 1));
            [possibleMidRange[m], possibleMidRange[j]] = [possibleMidRange[j], possibleMidRange[m]];
        }
        if (possibleMidRange.length > 0) targets.push(possibleMidRange[0]);
        if (possibleMidRange.length > 1) targets.push(possibleMidRange[1]);

        for (let k = 0; k < targets.length; k++) {
            const tgt = targets[k];
            const pairKey = Math.min(i, tgt.idx) + '-' + Math.max(i, tgt.idx);
            if (addedPairs.has(pairKey)) continue;
            addedPairs.add(pairKey);

            const catI = hubCategories[i];
            const catJ = hubCategories[tgt.idx];

            let type = 'global';
            if ((catI === 'na' && catJ === 'eu') || (catI === 'eu' && catJ === 'na')) {
                type = 'corridor';
            } else if (catI === 'na' && catJ === 'na') {
                type = 'na-internal';
            } else if (catI === 'eu' && catJ === 'eu') {
                type = 'eu-internal';
            }

            connections.push({ i: hi, j: tgt.hj, type: type });
        }
    }

    // Explicitly add some long-distance global connections (US-Asia, EU-Asia, US-EU) 
    // to ensure the network bridges large gaps
    let naHubIdxs = [], euHubIdxs = [], asiaHubIdxs = [];
    hubs.forEach((hub, idx) => {
        const cat = hubCategories[idx];
        if (cat === 'na') naHubIdxs.push(idx);
        else if (cat === 'eu') euHubIdxs.push(idx);
        // Approximation for Asia hubs (positive longitude mostly)
        else if (hub[1] > 60 && hub[1] < 150 && hub[0] > -10 && hub[0] < 50) asiaHubIdxs.push(idx);
    });

    function addExplicitConnection(listA, listB, type = 'global') {
        if (!listA.length || !listB.length) return;
        const i1 = listA[Math.floor(Math.random() * listA.length)];
        const i2 = listB[Math.floor(Math.random() * listB.length)];
        const pairKey = Math.min(i1, i2) + '-' + Math.max(i1, i2);
        if (!addedPairs.has(pairKey)) {
            addedPairs.add(pairKey);
            connections.push({ i: hubStart + i1, j: hubStart + i2, type });
        }
    }

    // Add 3 NA-Asia and 3 EU-Asia connections
    for (let i = 0; i < 3; i++) {
        addExplicitConnection(naHubIdxs, asiaHubIdxs);
        addExplicitConnection(euHubIdxs, asiaHubIdxs);
    }

    // Add 4 explicit NA-EU connections (these will be stylized as 'corridor' later)
    for (let i = 0; i < 4; i++) {
        addExplicitConnection(naHubIdxs, euHubIdxs, 'corridor');
    }

    // Floating particles
    const floaters = [];
    for (let i = 0; i < 20; i++) {
        const h = points[hubStart + Math.floor(Math.random() * hubs.length)];
        floaters.push({
            x: h.ox, y: h.oy, z: h.oz,
            vx: (Math.random() - .5) * .002, vy: (Math.random() - .5) * .002, vz: (Math.random() - .5) * .002,
            life: Math.random(), speed: .002 + Math.random() * .003
        });
    }

    // Give each point a starting position shaped like a stylized Heparin space-filling model
    points.forEach(p => p.mT = Math.random());

    // Define a 3D skeleton for the '7' shape (X, Y, Z, Radius)
    const moleculeSkeleton = [
        // Top hook (left to right)
        [-1.8, 1.5, 0.5, 0.45],
        [-1.2, 1.7, 0.3, 0.50],
        [-0.5, 1.8, 0.0, 0.55],
        [0.2, 1.7, -0.2, 0.50],
        [0.8, 1.4, -0.4, 0.45],
        [1.2, 0.9, -0.2, 0.45],
        // Corner joint (bulky)
        [1.0, 0.2, 0.0, 0.60],
        // Main diagonal trunk (top right down to bottom left)
        [0.6, -0.4, 0.1, 0.50],
        [0.2, -1.0, 0.2, 0.55],
        [-0.2, -1.6, 0.1, 0.50],
        [-0.6, -2.1, 0.0, 0.45],
        [-1.0, -2.6, -0.1, 0.50],
        [-1.5, -3.0, -0.2, 0.55]
    ];

    points.forEach((p, i) => {
        // Assign each particle to one of the "atoms" evenly
        const atomIdx = i % moleculeSkeleton.length;
        const [cx, cy, cz, baseRadius] = moleculeSkeleton[atomIdx];

        // Add a tiny bit of random drift to the center so they aren't totally uniform
        const seed = atomIdx * 123.45 + i;
        const driftX = Math.sin(seed * 0.1) * 0.15;
        const driftY = Math.cos(seed * 0.15) * 0.15;
        const driftZ = Math.sin(seed * 0.2) * 0.15;

        // Randomly adjust the radius for this specific point to create a lumpy surface
        // Using pow(random, 0.5) ensures they pack efficiently towards the surface of the sphere
        const r = baseRadius * Math.pow(Math.random(), 0.5) * (0.8 + Math.random() * 0.3);

        // Random spherical coordinates
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const pointOffX = r * Math.sin(phi) * Math.cos(theta);
        const pointOffY = r * Math.sin(phi) * Math.sin(theta);
        const pointOffZ = r * Math.cos(phi);

        p.sx = cx + driftX + pointOffX;
        p.sy = cy + driftY + pointOffY;
        p.sz = cz + driftZ + pointOffZ;
    });

    // Supply Flow Particles (moving along connection arcs)
    const supplyFlows = [];
    connections.forEach((conn, idx) => {
        // Add 2-4 particles per connection to show bi-directional flow
        const numParticles = 2 + Math.floor(Math.random() * 2);
        for (let p = 0; p < numParticles; p++) {
            supplyFlows.push({
                connIdx: idx,
                t: Math.random(), // random start position
                speed: 0.003 + Math.random() * 0.005,
                size: 1.2 + Math.random() * 0.8,
                dir: (p % 2 === 0) ? 1 : -1 // Movement direction: Guaranteed bi-directional flow per connection
            });
        }
    });

    let mouseInf = 0, mouseTgt = 0;
    wrap.addEventListener('mousemove', e => {
        const r = wrap.getBoundingClientRect();
        mouseTgt = ((e.clientX - r.left) / r.width - .5) * .5;
    });
    wrap.addEventListener('mouseleave', () => { mouseTgt = 0; });

    function rY(x, y, z, a) { const c = Math.cos(a), s = Math.sin(a); return { x: x * c + z * s, y, z: -x * s + z * c }; }
    function rX(x, y, z, a) { const c = Math.cos(a), s = Math.sin(a); return { x, y: y * c - z * s, z: y * s + z * c }; }
    function proj(x, y, z, sMod = 1, offX = 0, offY = 0) {
        const perspective = 3;
        const s = (perspective / (perspective + z)) * sMod;
        return { x: cx + offX + x * radius * s, y: cy + offY + y * radius * s, s, z };
    }

    // Scroll tracking
    const scrollContainer = document.querySelector('.globe-scroll-container');
    const labelsEl = wrap.querySelector('.pointcloud-labels');
    const securityHeader = document.querySelector('#security-header');
    let scrollProgress = 0;
    let animRunning = false;

    function updateScrollProgress() {
        if (!scrollContainer) return;
        const rect = scrollContainer.getBoundingClientRect();
        const containerHeight = scrollContainer.offsetHeight;
        const viewportH = window.innerHeight;
        // Progress: 0 when top of container hits viewport bottom, 1 when bottom hits viewport top
        const raw = -rect.top / (containerHeight - viewportH);
        scrollProgress = Math.max(0, Math.min(1, raw));
    }

    // Easing function
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function smoothStep(t) { return t * t * (3 - 2 * t); }

    let autoRot = 0;
    let lastTime = 0;

    function draw(time) {
        ctx.clearRect(0, 0, W, H);
        updateScrollProgress();

        // Handle auto-rotation for the molecule state
        const deltaTime = time ? (time - lastTime) : 0;
        lastTime = time || 0;
        if (deltaTime > 100) { // Catch tab-wake jumps
            autoRot += 0.01;
        } else {
            autoRot += deltaTime * 0.0005;
        }

        mouseInf += (mouseTgt - mouseInf) * 0.04;

        let formedness, ya, globalArcAlpha, corridorArcAlpha, breakProgress;
        const curScale = { mod: 1, offX: 0, offY: 0 };

        /**
         * Unified 5-Phase Narrative (Natural Scrolling w/ Animation Space):
         * P0: Heparin Molecule (0.0 -> 0.08) - Molecule visible next to Heparin text
         * P1: Transformation (0.08 -> 0.25) - Rapid transform into globe while transitioning sections
         * P2: Global Network (0.25 -> 0.45) - Security header appears, connections active
         * P3: Breakdown (0.45 -> 0.85) - Expanded narrative of breakdown during the 250vh spacer
         * P4: Locked Corridor (0.85 -> 1.0) - Transatlantic bridge focus 
         */
        const P0_END = 0.08;
        const P1_END = 0.25;
        const P2_END = 0.45;
        const P3_END = 0.85;

        let xa = 0.22; // Default tilt

        if (scrollProgress <= P0_END) {
            // Phase 0: Heparin Molecule
            formedness = 0;
            ya = autoRot + mouseInf;
            globalArcAlpha = 0;
            corridorArcAlpha = 0;
            breakProgress = 0;
            curScale.mod = 0.5; // Made molecule smaller
            curScale.offX = W * 0.25; // Reduced offset slightly to match smaller size
            curScale.offY = 0;
        } else if (scrollProgress <= P1_END) {
            // Phase 1: Transformation (Molecule -> Globe)
            const p = (scrollProgress - P0_END) / (P1_END - P0_END);
            formedness = smoothStep(p);
            ya = autoRot * (1 - p) + mouseInf;
            globalArcAlpha = 0;
            corridorArcAlpha = 0;
            breakProgress = 0;
            curScale.mod = 0.5 + (p * 0.35); // Scale from 0.5 up to 0.85
            curScale.offX = (W * 0.25) * (1 - p); // Shift to center
            curScale.offY = (H * 0.25) * p; // Shift downwards as it transforms into the globe
        } else if (scrollProgress <= P2_END) {
            // Phase 2: Global Supply Chains
            formedness = 1;
            const p = (scrollProgress - P1_END) / (P2_END - P1_END);
            ya = p * Math.PI * 2.0 + mouseInf;
            const arcFadeIn = Math.min(1, p * 3);
            globalArcAlpha = arcFadeIn;
            corridorArcAlpha = arcFadeIn;
            breakProgress = 0;
            curScale.mod = 0.85;
            curScale.offY = H * 0.15; // Raised slightly to sit closer to the header
        } else if (scrollProgress <= P3_END) {
            // Phase 3: Connections break
            formedness = 1;
            const p = (scrollProgress - P2_END) / (P3_END - P2_END);
            ya = Math.PI * 2.0 + p * Math.PI * 1.5 + mouseInf;
            globalArcAlpha = 1 - easeOutCubic(p);
            corridorArcAlpha = 1;
            breakProgress = easeOutCubic(p);
            curScale.mod = 0.85;
            curScale.offY = H * 0.15;
        } else {
            // Phase 4: Locked Corridor Zoom
            formedness = 1;
            const p = (scrollProgress - P3_END) / (1 - P3_END);
            const easeP = smoothStep(p); // smooth easing for zoom

            // Base rotation at start of this phase is Math.PI * 3.5
            // Add a larger pan across the Atlantic to face the US more directly
            const baseRotation = Math.PI * 3.5;
            ya = baseRotation + (easeP * Math.PI * 0.25) + mouseInf;

            globalArcAlpha = 0;
            corridorArcAlpha = 1;
            breakProgress = 1;

            // Zoom in effect
            curScale.mod = 0.85 + (easeP * 0.7); // Zoom from 0.85 to 1.55

            // Since we zoom in, we need to adjust X tilt to keep Northern Hemisphere in view
            xa = 0.22 + (easeP * 0.15); // Tilt further down slightly to see NA/EU clearly

            // Shift Y offset down so the zoomed top half stays roughly in the middle of screen
            curScale.offY = (H * 0.15) + (easeP * H * 0.35);
        }
        // Reset connection paths each frame to prevent "ghost" particles 
        for (const conn of connections) conn.path = null;

        // Update label opacity
        if (labelsEl) {
            labelsEl.style.opacity = formedness < 0.8 ? 0 : ((formedness - 0.8) / 0.2);
        }

        // Update security header opacity (fade in during phase 2)
        if (securityHeader) {
            if (scrollProgress < P1_END) {
                securityHeader.style.opacity = 0;
            } else {
                securityHeader.style.opacity = 1;
            }
        }

        const pr = points.map(p => {
            const ix = p.sx + (p.ox - p.sx) * formedness;
            const iy = p.sy + (p.oy - p.sy) * formedness;
            const iz = p.sz + (p.oz - p.sz) * formedness;

            const r1 = rX(ix, iy, iz, xa);
            const r2 = rY(r1.x, r1.y, r1.z, ya);
            p.x = r2.x; p.y = r2.y; p.z = r2.z;
            const pj = proj(r2.x, r2.y, r2.z, curScale.mod, curScale.offX, curScale.offY);
            return { ...pj, isHub: p.isHub, isContinent: p.isContinent, size: p.size, alpha: p.alpha, category: p.category };
        });

        // Connection arcs
        // Phase 2: all connections look the same (uniform light gold)
        // Phase 3+: corridor goes bright gold, global fades out
        for (const conn of connections) {
            const { i, j, type } = conn;
            const isSecure = type === 'corridor' || type === 'na-internal' || type === 'eu-internal';
            const arcVis = isSecure ? corridorArcAlpha : globalArcAlpha;
            if (arcVis < 0.01) continue;

            const az = (points[i].z + points[j].z) / 2;
            if (az < -0.2) continue;
            // Boost depth alpha so lines are more opaque overall
            const depthAlpha = Math.max(0, Math.min(1, az + 0.8));

            if (breakProgress < 0.01) {
                // All uniform — Gold
                const alpha = depthAlpha * 0.6 * arcVis;
                ctx.strokeStyle = `rgba(210,185,140,${alpha})`;
                ctx.lineWidth = 1.2;
            } else if (isSecure) {
                // Corridor/Internal transition from Gold to a professional blue (20, 70, 160)
                const alpha = depthAlpha * (0.6 + breakProgress * 0.4);
                const r = Math.round(210 - breakProgress * 170); // 210 -> 40
                const g = Math.round(185 - breakProgress * 85);  // 185 -> 100
                const b = Math.round(140 + breakProgress * 80);  // 140 -> 220
                ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx.lineWidth = 1.2 + breakProgress * 1.2;
            } else {
                // Global transition from Gold to Deep Red then fades
                const r = Math.round(210 + breakProgress * 45); // 210 -> 255
                const g = Math.round(185 - breakProgress * 155); // 185 -> 30
                const b = Math.round(140 - breakProgress * 110); // 140 -> 30
                const alpha = depthAlpha * 0.7 * arcVis;
                ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx.lineWidth = 1.2 - breakProgress * 0.4;
            }

            // To make lines curve *around* the globe rather than cutting through,
            // we calculate a true 3D midpoint that bulges out from the sphere center
            const p1 = points[i], p2 = points[j];
            // Midpoint on the surface (roughly)
            let midX = (p1.x + p2.x) / 2;
            let midY = (p1.y + p2.y) / 2;
            let midZ = (p1.z + p2.z) / 2;

            // Normalize and push out to create a bulge
            const len = Math.sqrt(midX * midX + midY * midY + midZ * midZ) || 1;
            // The further apart they are, the more it needs to bulge to clear the surface
            const dist = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);
            const bulge = 1.0 + (dist * 0.3); // Push out dynamically based on distance

            midX = (midX / len) * bulge;
            midY = (midY / len) * bulge;
            midZ = (midZ / len) * bulge;

            // Project the 3D control point to 2D screen space
            const pMid = proj(midX, midY, midZ, curScale.mod, curScale.offX, curScale.offY);

            // Store curved path data for particles
            conn.path = { p1: pr[i], p2: pr[j], cp: pMid, az };

            ctx.beginPath();
            ctx.moveTo(pr[i].x, pr[i].y);
            // using the projected projected 3D bulge point as our curve control point
            ctx.quadraticCurveTo(pMid.x, pMid.y, pr[j].x, pr[j].y);
            ctx.stroke();
        }

        // Supply flow dots moving along the lines
        if (formedness > 0.5) {
            for (const f of supplyFlows) {
                const conn = connections[f.connIdx];
                if (!conn || !conn.path) continue;

                const isSecure = conn.type === 'corridor' || conn.type === 'na-internal' || conn.type === 'eu-internal';
                const arcVis = isSecure ? corridorArcAlpha : globalArcAlpha;
                if (arcVis < 0.01) continue;

                // Move particle in its assigned direction
                f.t += f.speed * f.dir;
                if (f.t > 1) f.t = 0;
                if (f.t < 0) f.t = 1;

                // Quadratic Bezier interpolation for the projected 2D path
                const t = f.t;
                const path = conn.path;
                const mt = 1 - t;
                const px = mt * mt * path.p1.x + 2 * mt * t * path.cp.x + t * t * path.p2.x;
                const py = mt * mt * path.p1.y + 2 * mt * t * path.cp.y + t * t * path.p2.y;

                const alpha = Math.max(0, Math.min(1, path.az + 0.8)) * arcVis * 0.8;
                if (alpha < 0.05) continue;

                // Calculate color to match the connection line exactly
                let color;
                if (breakProgress < 0.01) {
                    // Gold
                    color = `rgba(255,230,180,${alpha})`;
                } else if (isSecure) {
                    // Corridor/Internal transitions to a dark-electric blue particle
                    const r = Math.round(255 - breakProgress * 215); // 255 -> 40
                    const g = Math.round(230 - breakProgress * 120); // 230 -> 110
                    const b = Math.round(180 + breakProgress * 60);  // 180 -> 240
                    color = `rgba(${r},${g},${b},${alpha})`;
                } else {
                    // Global transitions to Red then fades
                    const r = 255;
                    const g = Math.round(230 - breakProgress * 200); // 230 -> 30
                    const b = Math.round(180 - breakProgress * 150); // 180 -> 30
                    color = `rgba(${r},${g},${b},${alpha})`;
                }

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(px, py, f.size * path.p1.s, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Points sorted by depth (back to front)
        const sorted = [...pr].sort((a, b) => a.z - b.z);
        for (const p of sorted) {
            const da = formedness > 0.5 ? Math.max(0, (p.z + 0.8)) * 0.9 : 1;
            // Boost size and alpha for standard points during molecule phase (formedness < 0.5)
            const moleculeBoost = 1 - Math.min(1, formedness * 2);
            let a = (p.alpha || 0.1) * da;
            if (moleculeBoost > 0) {
                a = Math.max(a, 0.4 * moleculeBoost * da); // Brighter dots for molecule
            }

            const baseSize = (p.size || 1);
            const r = (moleculeBoost > 0 ? (baseSize + 1.2 * moleculeBoost) : baseSize) * p.s;

            if (a < 0.01 || r < 0.2) continue;

            let dotColor = `rgba(240,237,232,${a * 0.85})`; // Default white-ish
            if (p.isHub) dotColor = `rgba(210,175,130,${a})`;

            // Color sync with breakdown (Hubs only)
            if (p.isHub && breakProgress > 0.01) {
                if (p.category === 'na' || p.category === 'eu') {
                    // Transition NA/EU points (hubs) to a professional blue (20, 70, 160)
                    const rV = Math.round(210 - breakProgress * 190); // 210 -> 20
                    const gV = Math.round(175 - breakProgress * 105); // 175 -> 70
                    const bV = Math.round(130 + breakProgress * 30);  // 130 -> 160
                    dotColor = `rgba(${rV},${gV},${bV},${a})`;
                } else {
                    // Transition Global points to Red then fade
                    const rV = 255;
                    const gV = Math.round(255 - breakProgress * 200);
                    const bV = Math.round(255 - breakProgress * 200);
                    a *= (1 - breakProgress * 0.7);
                    dotColor = `rgba(${rV},${gV},${bV},${a})`;
                }
            }

            ctx.fillStyle = dotColor;

            if (p.isHub) {
                ctx.shadowColor = 'rgba(210,175,130,.5)';
                ctx.shadowBlur = 12 * formedness;
            } else {
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Floaters (only when fully formed)
        if (formedness > 0.9) {
            const fAlpha = (formedness - 0.9) / 0.1;
            for (const f of floaters) {
                f.x += f.vx; f.y += f.vy; f.z += f.vz;
                f.life -= f.speed;
                if (f.life <= 0) {
                    const h = points[hubStart + Math.floor(Math.random() * hubs.length)];
                    f.x = h.ox; f.y = h.oy; f.z = h.oz;
                    f.vx = (Math.random() - .5) * .002;
                    f.vy = (Math.random() - .5) * .002;
                    f.vz = (Math.random() - .5) * .002;
                    f.life = 1;
                }
                const r1 = rX(f.x, f.y, f.z, xa);
                const r2 = rY(r1.x, r1.y, r1.z, ya);
                const pj = proj(r2.x, r2.y, r2.z, curScale.mod, curScale.offX);
                if (r2.z < -.5) continue;
                ctx.fillStyle = `rgba(210,175,130,${f.life * .4 * fAlpha})`;
                ctx.beginPath();
                ctx.arc(pj.x, pj.y, 1.2 * pj.s, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        requestAnimationFrame(draw);
    }

    // Start animation as soon as visible
    const obs = new IntersectionObserver(e => {
        if (e[0].isIntersecting && !animRunning) {
            animRunning = true;
            requestAnimationFrame(draw);
        }
    }, { threshold: 0.05 });
    obs.observe(scrollContainer || wrap);
})();
