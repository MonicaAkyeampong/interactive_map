// ------------------ MAP SETUP ------------------

      // Create map centered on Ghana with locked navigation bounds
      const bounds = [
        [1.0, -9.0], // South West coordinates (looser to allow zoom out)
        [15.0, 7.0]  // North East coordinates
      ];
      const map = L.map("map", {
        maxBounds: bounds,
        maxBoundsViscosity: 1.0, // Prevents users from dragging outside bounds
        minZoom: 6.2
      }).setView([7.9465, -1.0232], 6.5);

      // Add base map
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      // ------------------ COLOR FUNCTION ------------------

      // Function to assign colors based on emission values
      function getColor(d) {
        return d > 7463
          ? "#D73027" // red
          : d > 4478
          ? "#FDAE61" // orange
          : d > 2985
          ? "#FEE08B" // yellow
          : d > 1482
          ? "#A1D99B" // light green
          : "#31A354"; // dark green
      }

      // ------------------ STYLE FUNCTION ------------------

      function style(feature) {
        return {
          fillColor: getColor(feature.properties[activeGas] || feature.properties.emissions || 0),
          weight: 2,
          opacity: 1,
          color: "white",
          fillOpacity: 0.7,
        };
      }

      // ------------------ INTERACTION ------------------

      function highlightFeature(e) {
        const layer = e.target;
        layer.setStyle({
          weight: 4,
          color: "#fff",
          dashArray: "",
          fillOpacity: 0.7,
        });
        layer.bringToFront();
        info.update(layer.feature.properties);
      }

      function resetHighlight(e) {
        geojson.resetStyle(e.target);
        info.update();
      }

      let districtGeojson;

      function clickFeature(e) {
        const layer = e.target;
        map.fitBounds(layer.getBounds());

        const regionName = layer.feature.properties.REGION;
        if (!regionName) return;
        loadDistricts(regionName);
      }

      function loadDistricts(regionName) {
        const safeRegionName = regionName.toLowerCase().replace(/ /g, "_").replace(/\//g, "_");
        const districtUrl = `districts_${safeRegionName}.geojson`;

        fetch(districtUrl)
          .then((res) => {
            if (!res.ok) throw new Error("District data not found");
            return res.json();
          })
          .then((data) => {
            // Keep geojson layer visible to show region boundaries
            // if (geojson) map.removeLayer(geojson);
            if (districtGeojson) map.removeLayer(districtGeojson);

            window.labeledDistricts = new Set();
            districtGeojson = L.geoJSON(data, {
              style: {
                fillColor: "#31A354",
                weight: 2,
                opacity: 1,
                color: "#ffffff",
                fillOpacity: 0.5,
              },
              onEachFeature: function (feature, layer) {
                const districtName = feature.properties.DISTRICT || "Unknown District";
                if (!window.labeledDistricts.has(districtName)) {
                  layer.bindTooltip(districtName, {
                    permanent: true,
                    direction: "center",
                    className: "district-label"
                  });
                  window.labeledDistricts.add(districtName);
                }
              },
            }).addTo(map);

            document.getElementById("back-to-regions").style.display = "block";
          })
          .catch((err) => console.error("Error loading districts:", err));
      }

      function onEachFeature(feature, layer) {
        layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: clickFeature,
        });
      }

      // Add zoom listener to clear districts when zooming out
      map.on('zoomend', function() {
        if (map.getZoom() < 6.8 && districtGeojson) {
          map.removeLayer(districtGeojson);
          districtGeojson = null;
          // Restore geojson interaction
          if (geojson) {
            geojson.eachLayer(layer => geojson.resetStyle(layer));
          }
          const backBtn = document.getElementById("back-to-regions");
          if (backBtn) backBtn.style.display = "none";
        }
      });

      // ------------------ INFO BOX ------------------

      const info = L.control();

      info.onAdd = function (map) {
        this._div = L.DomUtil.create("div", "info");
        this.update();
        return this._div;
      };

      info.update = function (props) {
        this._div.innerHTML =
          "<h4>Ghana Emissions</h4>" +
          (props
            ? `<b>${props.REGION}</b><br/>${props.emissions} kt CO2e`
            : "Hover over a region");
      };

      info.addTo(map);

      // ------------------ LOAD GEOJSON ------------------

      let geojson;

      fetch("ghana.geojson")
        .then((res) => res.json())
        .then((data) => {
          geojson = L.geoJSON(data, {
            style: style,
            onEachFeature: onEachFeature,
          }).addTo(map);
        });

        // ------------------ LEGEND ------------------

    const legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
  const div = L.DomUtil.create("div", "legend-collapsed");

  div.innerHTML = `
    <div class="legend-header">Legend ▼</div>
    <div class="legend-content" style="display:none;"></div>
  `;

    L.DomEvent.disableClickPropagation(div);

  return div;
};

legend.addTo(map);

const legendContent = document.querySelector(".legend-content");

const grades = [
  { range: '< 1,482', color: '#31A354' },
  { range: '1,482 – 2,985', color: '#A1D99B' },
  { range: '2,985 – 4,478', color: '#FEE08B' },
  { range: '4,478 – 7,463', color: '#FDAE61' },
  { range: '> 7,463', color: '#D73027' }
];

for (let i = 0; i < grades.length; i++) {
  legendContent.innerHTML +=
    '<div class="legend-item">' +
    '<span style="background:' + grades[i].color + '"></span>' +
    grades[i].range +
    " ktCO₂e</div>";
}

const header = document.querySelector(".legend-header");

header.addEventListener("click", () => {
  const content = document.querySelector(".legend-content");

  if (content.style.display === "none") {
    content.style.display = "block";
    header.innerHTML = "Legend ▲";
  } else {
    content.style.display = "none";
    header.innerHTML = "Legend ▼";
  }
});

const toggleBtn = document.querySelector(".panel-toggle");
const panel = document.getElementById("sidePanel");

if (toggleBtn && panel) {
  toggleBtn.addEventListener("click", () => {
    panel.classList.toggle("open");
  });
}

const backBtn = document.getElementById("back-to-regions");
if (backBtn) {
  backBtn.addEventListener("click", () => {
    if (districtGeojson) {
      map.removeLayer(districtGeojson);
      districtGeojson = null;
    }
    if (geojson) {
      geojson.addTo(map);
    }
    map.setView([7.9465, -1.0232], 6);
    backBtn.style.display = "none";
  });
}