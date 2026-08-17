/**
 * TAILORA USER — INTERACTIVE MAP CONTROLLER
 * Full pagination support for Restaurants, Hotels, and Attractions.
 *
 * Page 1: records 1–100
 * Page 2: records 101–200
 * Page 3: records 201–300
 * ...
 *
 * Independent pagination state per category using real backend API parameters.
 */

(function () {
  "use strict";

  const PAGE_SIZE = 100;

  // ============================================================
  // WORLD LANDMARK GPS COORDINATES
  // ============================================================
  const LANDMARK_COORDS = {
    "pyramids of giza": [29.9792, 31.1342],
    "pyramids": [29.9792, 31.1342],
    "giza": [29.9792, 31.1342],
    "egyptian museum": [30.0478, 31.2336],
    "hagia sophia": [41.0086, 28.9802],
    "sheikh zayed grand mosque": [24.4128, 54.4750],
    "sheikh zayed": [24.4128, 54.4750],
    "grand mosque": [24.4128, 54.4750],
    "colosseum": [41.8902, 12.4922],
    "burj khalifa": [25.1972, 55.2744],
    "statue of liberty": [40.6892, -74.0445],
    "sydney opera house": [-33.8568, 151.2153],
    "sydney opera": [-33.8568, 151.2153],
    "eiffel tower": [48.8584, 2.2945],
    "tokyo tower": [35.6586, 139.7454],
    "louvre": [48.8606, 2.3376],
    "taj mahal": [27.1751, 78.0421],
    "sagrada familia": [41.4036, 2.1744],
    "big ben": [51.5007, -0.1246],
    "london eye": [51.5033, -0.1195],
    "petra": [30.3285, 35.4444],
    "christ the redeemer": [-22.9519, -43.2105],
    "empire state building": [40.7484, -73.9857],
    "central park": [40.7851, -73.9683]
  };

  // ============================================================
  // WORLD CITIES
  // ============================================================
  const CITY_COORDS = {
    "cairo": [30.0444, 31.2357],
    "giza": [29.9870, 31.2118],
    "alexandria": [31.2001, 29.9187],
    "luxor": [25.6872, 32.6396],
    "aswan": [24.0889, 32.8998],
    "hurghada": [27.2579, 33.8116],
    "sharm el sheikh": [27.9158, 34.3299],
    "new york": [40.7128, -74.0060],
    "paris": [48.8566, 2.3522],
    "nice": [43.7102, 7.2620],
    "lyon": [45.7640, 4.8357],
    "marseille": [43.2965, 5.3698],
    "rome": [41.9028, 12.4964],
    "milan": [45.4642, 9.1900],
    "florence": [43.7696, 11.2558],
    "venice": [45.4408, 12.3155],
    "istanbul": [41.0082, 28.9784],
    "ankara": [39.9334, 32.8597],
    "dubai": [25.2048, 55.2708],
    "abu dhabi": [24.4539, 54.3773],
    "sharjah": [25.3463, 55.4209],
    "doha": [25.2854, 51.5310],
    "riyadh": [24.7136, 46.6753],
    "jeddah": [21.4858, 39.1925],
    "tokyo": [35.6762, 139.6503],
    "osaka": [34.6937, 135.5023],
    "kyoto": [35.0116, 135.7681],
    "beijing": [39.9042, 116.4074],
    "shanghai": [31.2304, 121.4737],
    "hong kong": [22.3193, 114.1694],
    "seoul": [37.5665, 126.9780],
    "bangkok": [13.7563, 100.5018],
    "phuket": [7.8804, 98.3923],
    "singapore": [1.3521, 103.8198],
    "kuala lumpur": [3.1390, 101.6869],
    "sydney": [-33.8688, 151.2093],
    "melbourne": [-37.8136, 144.9631],
    "london": [51.5074, -0.1278],
    "edinburgh": [55.9533, -3.1883],
    "manchester": [53.4808, -2.2426],
    "madrid": [40.4168, -3.7038],
    "barcelona": [41.3851, 2.1734],
    "seville": [37.3891, -5.9845],
    "lisbon": [38.7223, -9.1393],
    "porto": [41.1579, -8.6291],
    "berlin": [52.5200, 13.4050],
    "munich": [48.1351, 11.5820],
    "amsterdam": [52.3676, 4.9041],
    "vienna": [48.2082, 16.3738],
    "prague": [50.0755, 14.4378],
    "budapest": [47.4979, 19.0402],
    "athens": [37.9838, 23.7275],
    "toronto": [43.6532, -79.3832],
    "vancouver": [49.2827, -123.1207],
    "montreal": [45.5017, -73.5673],
    "los angeles": [34.0522, -118.2437],
    "san francisco": [37.7749, -122.4194],
    "chicago": [41.8781, -87.6298],
    "nashville": [36.1627, -86.7816],
    "miami": [25.7617, -80.1918],
    "las vegas": [36.1699, -115.1398],
    "dublin": [53.3498, -6.2603],
    "rio de janeiro": [-22.9068, -43.1729],
    "sao paulo": [-23.5505, -46.6333],
    "são paulo": [-23.5505, -46.6333],
    "buenos aires": [-34.6037, -58.3816],
    "cape town": [-33.9249, 18.4241],
    "marrakech": [31.6295, -7.9811],
    "casablanca": [33.5731, -7.5898],
    "makati city": [14.5547, 121.0244],
    "makati": [14.5547, 121.0244],
    "pasay city": [14.5378, 120.9993],
    "pasay": [14.5378, 120.9993],
    "pasig city": [14.5764, 121.0851],
    "pasig": [14.5764, 121.0851],
    "mandaluyong city": [14.5794, 121.0359],
    "mandaluyong": [14.5794, 121.0359],
    "manila": [14.5995, 120.9842],
    "quezon city": [14.6760, 121.0437],
    "taguig": [14.5176, 121.0509],
    "albany": [31.5785, -84.1557],
    "armidale": [-30.5016, 151.6662],
    "augusta": [33.4735, -81.9683]
  };

  // ============================================================
  // STATE
  // ============================================================
  let isPaginating = false;

  const state = {
    map: null,
    markerCluster: null,
    renderedMarkerKeys: new Set(),

    activeType: "all", // 'all' | 'attraction' | 'hotel' | 'restaurant'
    search: "",

    // Routing
    start: null,
    end: null,
    startMarker: null,
    endMarker: null,
    userMarker: null,
    routeLayer: null,

    // Independent Category Pagination
    categories: {
      attraction: {
        page: 1,
        total: 1001,
        lastPage: 11,
        isLoading: false
      },
      hotel: {
        page: 1,
        total: 10000,
        lastPage: 100,
        isLoading: false
      },
      restaurant: {
        page: 1,
        total: 9551,
        lastPage: 96,
        isLoading: false
      },
      all: {
        page: 1,
        lastPage: 11,
        isLoading: false
      }
    },

    // Cache of loaded pages: `${type}_page_${page}` -> array of 100 items
    pageCache: new Map()
  };

  const labels = {
    attraction: "Attraction",
    hotel: "Hotel",
    restaurant: "Restaurant"
  };

  // ============================================================
  // HELPERS
  // ============================================================
  function esc(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function val(object, keys, fallback = null) {
    if (!object) return fallback;
    for (const key of keys) {
      const parts = key.split(".");
      let current = object;
      let found = true;
      for (const part of parts) {
        if (current && current[part] !== undefined) {
          current = current[part];
        } else {
          found = false;
          break;
        }
      }
      if (found && current !== undefined && current !== null && current !== "") {
        return current;
      }
    }
    return fallback;
  }

  function parseCoordinates(object, type) {
    const name = String(val(object, ["name", "title", type + "_name"], "")).trim().toLowerCase();
    const rawCity = val(object, ["city.name", "city", "locality", "location.city", "address"], "");
    const cityName = (typeof rawCity === "string" ? rawCity : (rawCity && rawCity.name ? rawCity.name : "")).trim().toLowerCase();
    const id = Number(val(object, ["id"], 1)) || Math.floor(Math.random() * 1000) + 1;

    const goldenAngle = ((id * 137.5) % 360) * (Math.PI / 180);

    // 1. Check known landmark name match
    if (type === "attraction") {
      for (const [landmark, coords] of Object.entries(LANDMARK_COORDS)) {
        if (name.includes(landmark)) {
          const radius = 0.004 + (((id * 97) % 100) / 100) * 0.016;
          return [coords[0] + Math.sin(goldenAngle) * radius, coords[1] + Math.cos(goldenAngle) * radius];
        }
      }
    }

    // 2. Check payload raw coordinates (e.g. Restaurants)
    let rawLat = Number(val(object, ["latitude", "lat", "location.latitude", "coordinates.latitude"]));
    let rawLng = Number(val(object, ["longitude", "lng", "lon", "location.longitude", "coordinates.longitude"]));
    const hasRawCoords = Number.isFinite(rawLat) && Number.isFinite(rawLng) &&
                         rawLat >= -90 && rawLat <= 90 && rawLng >= -180 && rawLng <= 180 &&
                         (rawLat !== 0 || rawLng !== 0);

    const normalizedCity = cityName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+city$/i, "").trim();
    const cityCoord = CITY_COORDS[cityName] || CITY_COORDS[normalizedCity];

    if (cityCoord) {
      if (hasRawCoords) {
        const distLat = Math.abs(rawLat - cityCoord[0]);
        const distLng = Math.abs(rawLng - cityCoord[1]);
        if (distLat < 1.5 && distLng < 1.5) {
          const microRadius = 0.0005;
          return [rawLat + Math.sin(goldenAngle) * microRadius, rawLng + Math.cos(goldenAngle) * microRadius];
        }
      }

      // Disperse hotels across city neighborhoods
      const radius = 0.01 + (((id * 83) % 100) / 100) * 0.035;
      const lat = cityCoord[0] + Math.sin(goldenAngle) * radius;
      const lng = cityCoord[1] + Math.cos(goldenAngle) * radius;
      return [lat, lng];
    }

    if (hasRawCoords) {
      const microRadius = 0.0005;
      return [rawLat + Math.sin(goldenAngle) * microRadius, rawLng + Math.cos(goldenAngle) * microRadius];
    }

    const defaultCenter = [40.7128, -74.0060];
    const radius = 0.02 + (((id * 41) % 100) / 100) * 0.04;
    return [defaultCenter[0] + Math.sin(goldenAngle) * radius, defaultCenter[1] + Math.cos(goldenAngle) * radius];
  }

  function normalize(object, type) {
    if (!object) return null;
    const position = parseCoordinates(object, type);
    if (!position) return null;

    const id = val(object, ["id", type + "_id"], Math.random().toString(36).substring(2, 9));
    const name = String(val(object, ["name", "title", type + "_name"], "Unnamed location"));
    const rawCity = val(object, ["city.name", "city", "locality", "location.city"], "");
    const city = typeof rawCity === "string" ? rawCity : (rawCity && rawCity.name ? rawCity.name : "");
    const rating = val(object, ["rating", "stars"]);
    const price = val(object, ["price_per_night", "price", "average_cost_for_two", "average_price"]);

    return {
      uniqueKey: `${type}_${id}`,
      id: id,
      type: type,
      name: name,
      city: city,
      rating: rating,
      price: price,
      lat: position[0],
      lng: position[1],
      raw: object
    };
  }

  function showToast(message, type = "error") {
    if (window.TL && typeof window.TL.showToast === "function") {
      window.TL.showToast(message, type);
    } else if (window.TL && typeof window.TL.toast === "function") {
      window.TL.toast(message, type);
    }
  }

  // ============================================================
  // BACKEND API FETCHING (100 RECORDS PER PAGE)
  // ============================================================

  async function fetchAttractionsPage(pageNum) {
    const cacheKey = `attraction_page_${pageNum}`;
    if (state.pageCache.has(cacheKey)) {
      return state.pageCache.get(cacheKey);
    }

    const res = await window.TL.Api.get("/attractions", {
      page: pageNum,
      per_page: PAGE_SIZE
    });

    const rawItems = res && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    if (res && res.total !== undefined) state.categories.attraction.total = Number(res.total);
    if (res && res.last_page !== undefined) state.categories.attraction.lastPage = Number(res.last_page);

    const normalized = rawItems.map((item) => normalize(item, "attraction")).filter(Boolean);
    const uniqueNormalized = (window.TL && window.TL.Util && typeof window.TL.Util.uniqueBy === "function")
      ? window.TL.Util.uniqueBy(normalized, (item) => `${item.name}_${item.city}`)
      : normalized;
    state.pageCache.set(cacheKey, uniqueNormalized);
    return uniqueNormalized;
  }

  async function fetchHotelsPage(pageNum) {
    const cacheKey = `hotel_page_${pageNum}`;
    if (state.pageCache.has(cacheKey)) {
      return state.pageCache.get(cacheKey);
    }

    // Hotels backend endpoint returns 10 per page. Request 10 backend pages in parallel to yield 100 records for pageNum
    const startBackendPage = (pageNum - 1) * 10 + 1;
    const promises = [];
    for (let i = 0; i < 10; i++) {
      const p = startBackendPage + i;
      promises.push(window.TL.Api.get("/hotels", { page: p }).catch(() => ({ data: [] })));
    }

    const responses = await Promise.all(promises);
    let rawItems = [];
    for (const r of responses) {
      if (r && Array.isArray(r.data)) rawItems.push(...r.data);
      if (r && r.meta && r.meta.total) {
        state.categories.hotel.total = Number(r.meta.total);
        state.categories.hotel.lastPage = Math.ceil(Number(r.meta.total) / PAGE_SIZE);
      }
    }

    const normalized = rawItems.map((item) => normalize(item, "hotel")).filter(Boolean);
    const uniqueNormalized = (window.TL && window.TL.Util && typeof window.TL.Util.uniqueBy === "function")
      ? window.TL.Util.uniqueBy(normalized, (item) => `${item.name}_${item.city}`)
      : normalized;
    state.pageCache.set(cacheKey, uniqueNormalized);
    return uniqueNormalized;
  }

  async function fetchRestaurantsPage(pageNum) {
    const cacheKey = `restaurant_page_${pageNum}`;
    if (state.pageCache.has(cacheKey)) {
      return state.pageCache.get(cacheKey);
    }

    // Restaurants backend endpoint returns 10 per page. Request 10 backend pages in parallel to yield 100 records for pageNum
    const startBackendPage = (pageNum - 1) * 10 + 1;
    const promises = [];
    for (let i = 0; i < 10; i++) {
      const p = startBackendPage + i;
      promises.push(window.TL.Api.get("/restaurants", { page: p }).catch(() => ({ data: [] })));
    }

    const responses = await Promise.all(promises);
    let rawItems = [];
    for (const r of responses) {
      if (r && Array.isArray(r.data)) rawItems.push(...r.data);
      if (r && r.meta && r.meta.total) {
        state.categories.restaurant.total = Number(r.meta.total);
        state.categories.restaurant.lastPage = Math.ceil(Number(r.meta.total) / PAGE_SIZE);
      }
    }

    const normalized = rawItems.map((item) => normalize(item, "restaurant")).filter(Boolean);
    const uniqueNormalized = (window.TL && window.TL.Util && typeof window.TL.Util.uniqueBy === "function")
      ? window.TL.Util.uniqueBy(normalized, (item) => `${item.name}_${item.city}_${item.lat}_${item.lng}`)
      : normalized;
    state.pageCache.set(cacheKey, uniqueNormalized);
    return uniqueNormalized;
  }

  async function getRecordsForCategoryAndPage(type, pageNum) {
    if (type === "all") {
      const [attractions, hotels, restaurants] = await Promise.all([
        fetchAttractionsPage(pageNum),
        fetchHotelsPage(pageNum),
        fetchRestaurantsPage(pageNum)
      ]);
      return [...attractions, ...hotels, ...restaurants];
    } else if (type === "attraction") {
      return await fetchAttractionsPage(pageNum);
    } else if (type === "hotel") {
      return await fetchHotelsPage(pageNum);
    } else if (type === "restaurant") {
      return await fetchRestaurantsPage(pageNum);
    }
    return [];
  }

  function getActiveCategoryState() {
    return state.categories[state.activeType] || state.categories.all;
  }

  // ============================================================
  // MAP INITIALIZATION
  // ============================================================

  function initMap() {
    const mapElement = document.getElementById("tailora-map");
    if (!mapElement) {
      console.error("Map element #tailora-map was not found.");
      return false;
    }

    if (typeof L === "undefined") {
      console.error("Leaflet was not loaded.");
      return false;
    }

    state.map = L.map("tailora-map", {
      zoomControl: true,
      attributionControl: true
    }).setView([25, 10], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      minZoom: 2,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(state.map);

    if (typeof L.markerClusterGroup === "function") {
      state.markerCluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        removeOutsideVisibleBounds: true,
        animate: true,
        disableClusteringAtZoom: 9,
        maxClusterRadius: 45
      });
      state.map.addLayer(state.markerCluster);
    }

    state.map.on("click", function (event) {
      if (!state.start) {
        setStart({
          name: "Selected Point",
          lat: event.latlng.lat,
          lng: event.latlng.lng
        });
      } else if (!state.end) {
        setEnd({
          name: "Selected Point",
          lat: event.latlng.lat,
          lng: event.latlng.lng
        });
      }
    });

    setTimeout(() => state.map && state.map.invalidateSize(true), 300);
    setTimeout(() => state.map && state.map.invalidateSize(true), 1000);

    return true;
  }

  // ============================================================
  // MARKERS & POPUPS
  // ============================================================

  function createMarkerIcon(type) {
    return L.divIcon({
      className: "",
      html: `<div class="tl-map-marker tl-map-marker--${type}"><span></span></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -27]
    });
  }

  function createPopupContent(location) {
    return `
      <div class="tl-map-popup">
        <div class="tl-map-popup-type">${esc(labels[location.type] || location.type)}</div>
        <h3>${esc(location.name)}</h3>
        ${location.city ? `<p><i class="bi bi-geo-alt me-1"></i>${esc(location.city)}</p>` : ""}
        ${location.rating !== null && location.rating !== undefined ? `<p><i class="bi bi-star-fill text-warning me-1"></i>Rating: <strong>${esc(location.rating)}</strong></p>` : ""}
        ${location.price !== null && location.price !== undefined ? `<p><i class="bi bi-tag me-1"></i>Price: <strong>${esc(location.price)}</strong></p>` : ""}
        <div class="tl-map-popup-actions">
          <button type="button" data-route-action="start" data-key="${esc(location.uniqueKey)}">
            <i class="bi bi-geo-alt"></i> Start here
          </button>
          <button type="button" data-route-action="end" data-key="${esc(location.uniqueKey)}">
            <i class="bi bi-flag"></i> Go here
          </button>
        </div>
      </div>
    `;
  }

  function matchesSearch(location) {
    if (state.activeType !== "all" && location.type !== state.activeType) {
      return false;
    }
    const query = state.search.trim().toLowerCase();
    if (!query) return true;

    return [location.name, location.city, location.type].join(" ").toLowerCase().includes(query);
  }

  function renderCurrentLocations(locations, shouldFitBounds = false) {
    if (!state.map) return;

    if (state.markerCluster) {
      state.markerCluster.clearLayers();
    }
    state.renderedMarkerKeys.clear();

    const visibleLocations = locations.filter(matchesSearch);

    visibleLocations.forEach((location) => {
      if (state.renderedMarkerKeys.has(location.uniqueKey)) return;
      state.renderedMarkerKeys.add(location.uniqueKey);

      const marker = L.marker([location.lat, location.lng], {
        icon: createMarkerIcon(location.type)
      }).bindPopup(createPopupContent(location));

      marker.on("popupopen", function (event) {
        const popupEl = event.popup.getElement();
        if (!popupEl) return;

        popupEl.querySelectorAll("[data-route-action]").forEach((button) => {
          button.onclick = function () {
            const key = button.dataset.key;
            const selected = locations.find((item) => item.uniqueKey === key);
            if (!selected) return;

            if (button.dataset.routeAction === "start") {
              setStart(selected);
            } else {
              setEnd(selected);
            }
            event.popup.remove();
          };
        });
      });

      if (state.markerCluster) {
        state.markerCluster.addLayer(marker);
      } else {
        marker.addTo(state.map);
      }
    });

    updatePaginationUI(visibleLocations.length);

    if (shouldFitBounds && visibleLocations.length > 0) {
      const bounds = L.latLngBounds(visibleLocations.map((loc) => [loc.lat, loc.lng]));
      if (bounds.isValid()) {
        state.map.fitBounds(bounds.pad(0.08), { maxZoom: 14 });
      }
    }
  }

  // ============================================================
  // PAGINATION CONTROLS & COUNTS
  // ============================================================

  function updatePaginationUI(visibleCount) {
    const countsEl = document.getElementById("map-counts");
    const pageBadge = document.getElementById("map-page-badge");
    const nextBtn = document.getElementById("map-next-btn");
    const prevBtn = document.getElementById("map-prev-btn");
    const subText = document.getElementById("map-pagination-sub");
    const nextText = document.getElementById("map-next-btn-text");
    const nextIcon = document.getElementById("map-next-btn-icon");

    const catState = getActiveCategoryState();
    const currentPage = catState.page;
    const hasMore = currentPage < (catState.lastPage || 999);

    const startRecord = (currentPage - 1) * PAGE_SIZE + 1;
    const endRecord = startRecord + visibleCount - 1;

    if (pageBadge) {
      pageBadge.textContent = `Page ${currentPage}`;
    }

    if (prevBtn) {
      prevBtn.style.display = currentPage > 1 ? "inline-flex" : "none";
      prevBtn.disabled = isPaginating;
    }

    if (nextBtn) {
      nextBtn.disabled = isPaginating || !hasMore;
      if (isPaginating) {
        if (nextIcon) nextIcon.className = "spinner-border spinner-border-sm ms-1";
        if (nextText) nextText.textContent = "Loading...";
      } else {
        if (nextIcon) nextIcon.className = "bi bi-arrow-right ms-1";
        if (nextText) nextText.textContent = hasMore ? "Next 100" : "End of records";
      }
    }

    if (subText) {
      const totalStr = catState.total ? ` of ${catState.total.toLocaleString()}` : "";
      if (visibleCount > 0) {
        subText.textContent = `Showing records ${startRecord}–${endRecord}${totalStr}`;
      } else {
        subText.textContent = `No records on this page`;
      }
    }

    if (countsEl) {
      if (state.activeType === "all") {
        countsEl.innerHTML = `
          Page <strong>${currentPage}</strong> &bull; Showing <strong>${visibleCount}</strong> places (100 per category).
        `;
      } else {
        const catName = labels[state.activeType] || state.activeType;
        const totalStr = catState.total ? ` of ${catState.total.toLocaleString()}` : "";
        countsEl.innerHTML = `
          Page <strong>${currentPage}</strong> &bull; Showing <strong>${visibleCount}${totalStr}</strong> ${catName.toLowerCase()}s.
        `;
      }
    }
  }

  // ============================================================
  // LOAD & PAGINATE
  // ============================================================

  async function loadCurrentPageData(shouldFitBounds = false) {
    const loadingEl = document.getElementById("map-loading");
    const errorEl = document.getElementById("map-error");

    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }

    if (loadingEl) loadingEl.hidden = false;

    const catState = getActiveCategoryState();

    try {
      const locations = await getRecordsForCategoryAndPage(state.activeType, catState.page);
      renderCurrentLocations(locations, shouldFitBounds);
    } catch (err) {
      console.error("Failed to load map page:", err);
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = err.message || "Failed to load locations.";
      }
      showToast("Failed to load map locations: " + err.message, "error");
    } finally {
      if (loadingEl) loadingEl.hidden = true;
      isPaginating = false;
      updatePaginationUI(0);
    }
  }

  async function goToNextPage() {
    if (isPaginating) return;
    const catState = getActiveCategoryState();
    if (catState.page >= (catState.lastPage || 999)) return;

    isPaginating = true;
    catState.page += 1;
    updatePaginationUI(0);
    await loadCurrentPageData(false);
  }

  async function goToPrevPage() {
    if (isPaginating) return;
    const catState = getActiveCategoryState();
    if (catState.page <= 1) return;

    isPaginating = true;
    catState.page -= 1;
    updatePaginationUI(0);
    await loadCurrentPageData(false);
  }

  // ============================================================
  // ROUTING & DIRECTIONS
  // ============================================================

  function setStart(location) {
    state.start = location;
    if (state.startMarker) state.map.removeLayer(state.startMarker);

    state.startMarker = L.marker([location.lat, location.lng]).addTo(state.map);

    const input = document.getElementById("route-start");
    if (input) {
      input.value = `${location.name} (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`;
    }
    updateRouteButton();
  }

  function setEnd(location) {
    state.end = location;
    if (state.endMarker) state.map.removeLayer(state.endMarker);

    state.endMarker = L.marker([location.lat, location.lng]).addTo(state.map);

    const input = document.getElementById("route-end");
    if (input) {
      input.value = `${location.name} (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`;
    }
    updateRouteButton();
  }

  function updateRouteButton() {
    const button = document.getElementById("route-build");
    if (button) {
      button.disabled = !(state.start && state.end);
    }
  }

  async function calculateRoute() {
    if (!state.start || !state.end) return;

    const button = document.getElementById("route-build");
    const summary = document.getElementById("route-summary");

    if (button) {
      button.disabled = true;
      button.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Calculating...';
    }

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${state.start.lng},${state.start.lat};${state.end.lng},${state.end.lat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Routing service request failed.");

      const data = await response.json();
      if (data.code !== "Ok" || !data.routes || !data.routes.length) {
        throw new Error("No driving route found between these two points.");
      }

      if (state.routeLayer) {
        state.map.removeLayer(state.routeLayer);
      }

      state.routeLayer = L.geoJSON(data.routes[0].geometry, {
        style: {
          color: "#20e3c2",
          weight: 6,
          opacity: 0.9
        }
      }).addTo(state.map);

      state.map.fitBounds(state.routeLayer.getBounds().pad(0.12));

      const kilometers = (data.routes[0].distance / 1000).toFixed(1);
      const minutes = data.routes[0].duration / 60;
      const timeStr = minutes < 60 ? `${Math.round(minutes)} min` : `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}min`;

      if (summary) {
        summary.hidden = false;
        summary.innerHTML = `
          <strong><i class="bi bi-signpost-split me-1"></i>${kilometers} km</strong>
          Estimated driving time: <strong>${timeStr}</strong>
        `;
      }
    } catch (err) {
      if (summary) {
        summary.hidden = false;
        summary.innerHTML = `<strong>Could not calculate route:</strong> ${esc(err.message)}`;
      }
    } finally {
      if (button) {
        button.innerHTML = '<i class="bi bi-signpost-split me-1"></i> Get Directions';
        updateRouteButton();
      }
    }
  }

  function clearRoute() {
    state.start = null;
    state.end = null;

    if (state.routeLayer) state.map.removeLayer(state.routeLayer);
    if (state.startMarker) state.map.removeLayer(state.startMarker);
    if (state.endMarker) state.map.removeLayer(state.endMarker);

    state.routeLayer = null;
    state.startMarker = null;
    state.endMarker = null;

    const startInput = document.getElementById("route-start");
    const endInput = document.getElementById("route-end");
    const summary = document.getElementById("route-summary");

    if (startInput) startInput.value = "";
    if (endInput) endInput.value = "";
    if (summary) {
      summary.hidden = true;
      summary.innerHTML = "";
    }

    updateRouteButton();
  }

  function locateUser() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          name: "My Location",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };

        setStart(location);
        state.map.setView([location.lat, location.lng], 13);

        if (state.userMarker) state.map.removeLayer(state.userMarker);
        state.userMarker = L.circleMarker([location.lat, location.lng], {
          radius: 8,
          fillColor: "#3b82f6",
          color: "#ffffff",
          weight: 3,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(state.map);
      },
      () => {
        alert("Could not access your location. Please check your browser permissions.");
      }
    );
  }

  // ============================================================
  // EVENT LISTENERS & INITIALIZATION
  // ============================================================

  function setupEvents() {
    // Search
    const searchInput = document.getElementById("map-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        state.search = e.target.value;
        const catState = getActiveCategoryState();
        const cacheKey = `${state.activeType}_page_${catState.page}`;
        const locations = state.pageCache.get(cacheKey) || [];
        renderCurrentLocations(locations, false);
      });
    }

    // Category Filter Buttons
    document.querySelectorAll(".tl-map-filter").forEach((btn) => {
      btn.addEventListener("click", async () => {
        document.querySelectorAll(".tl-map-filter").forEach((item) => item.classList.remove("is-active"));
        btn.classList.add("is-active");

        const targetType = btn.dataset.type || "all";
        state.activeType = targetType;

        await loadCurrentPageData(true);
      });
    });

    // Pagination Buttons
    const nextBtn = document.getElementById("map-next-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", goToNextPage);
    }

    const prevBtn = document.getElementById("map-prev-btn");
    if (prevBtn) {
      prevBtn.addEventListener("click", goToPrevPage);
    }

    // Route Actions
    const routeBtn = document.getElementById("route-build");
    if (routeBtn) routeBtn.addEventListener("click", calculateRoute);

    const clearBtn = document.getElementById("map-clear-route");
    if (clearBtn) clearBtn.addEventListener("click", clearRoute);

    const locationBtn = document.getElementById("route-use-location");
    if (locationBtn) locationBtn.addEventListener("click", locateUser);
  }

  async function initPage() {
    const initialized = initMap();
    if (!initialized) return;

    setupEvents();
    await loadCurrentPageData(true);
  }

  document.addEventListener("DOMContentLoaded", initPage);
})();