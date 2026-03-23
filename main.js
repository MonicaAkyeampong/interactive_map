// ------------------ MAP SETUP ------------------

      // Create map centered on Ghana
      const map = L.map("map").setView([7.9465, -1.0232], 6);

      // Add base map
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      // ------------------ COLOR FUNCTION ------------------

      // Function to assign colors based on emission values
      function getColor(d) {
        return d > 8000
          ? "#800026" // very high
          : d > 6000
            ? "#BD0026"
            : d > 4000
              ? "#E31A1C"
              : d > 3000
                ? "#FC4E2A"
                : d > 2000
                  ? "#FD8D3C"
                  : d > 1000
                    ? "#FEB24C"
                    : "#FFEDA0"; // very low
      }

      // ------------------ STYLE FUNCTION ------------------

      function style(feature) {
        return {
          fillColor: getColor(feature.properties.emissions),
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
          weight: 3,
          color: "#666",
        });

        info.update(layer.feature.properties);
      }

      function resetHighlight(e) {
        geojson.resetStyle(e.target);
        info.update();
      }

      function onEachFeature(feature, layer) {
        layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
        });
      }

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

const grades = [1000, 2000, 3000, 4000, 6000, 8000];

for (let i = 0; i < grades.length; i++) {
  legendContent.innerHTML +=
    '<div class="legend-item">' +
    '<span style="background:' + getColor(grades[i] + 1) + '"></span>' +
    grades[i] +
    " – " +
    (grades[i + 1] ? grades[i + 1] : "9000+") +
    " tCO₂e</div>";
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

toggleBtn.addEventListener("click", () => {
  panel.classList.toggle("open");
});