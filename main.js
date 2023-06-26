const searchDropDown = document.querySelector("#search-dropdown");
const searchBtn = document.querySelector("#search-button");
const searchInput = document.querySelector("#search-input");

const map = new ol.Map({
  target: "map",
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
      layerName: "osm",
    }),
  ],
  view: new ol.View({
    center: [0, 0],
    zoom: 2,
  }),
});

let timeOut;
let vectorLayer; // Keep track of the vector layer for the searched country

searchInput.addEventListener("input", (e) => {
  let typed = e.target.value;
  clearTimeout(timeOut);

  timeOut = setTimeout(() => {
    let searchedCountry = fetchCountryBoundingBox(typed);
  }, 1000);
});

function moveMapToCountry(bbox) {
  const extent = ol.proj.transformExtent(bbox, "EPSG:4326", "EPSG:3857");
  map.getView().fit(extent, { duration: 1000 });
}

function createCountryPolygon(bbox) {
  // Remove the existing vector layer if it exists
  if (vectorLayer) {
    map.removeLayer(vectorLayer);
  }

  const extent = ol.proj.transformExtent(bbox, "EPSG:4326", "EPSG:3857");

  const polygon = new ol.geom.Polygon.fromExtent(extent);

  const feature = new ol.Feature({ geometry: polygon });
  const vectorSource = new ol.source.Vector({
    features: [feature],
  });

  vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: "red",
        width: 1,
      }),
      fill: new ol.style.Fill({
        color: "rgba(255, 0, 0, 0.1)",
      }),
    }),
  });

  map.addLayer(vectorLayer);
}

function fetchCountryBoundingBox(countryName) {
  const url = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson`;

  return fetch(url)
    .then((res) => res.json())
    .then((data) => {
      const features = data.features;
      const country = features.find(
        (feature) =>
          feature.properties.ADMIN.toLowerCase() === countryName.toLowerCase()
      );
      if (country) {
        const bbox = country.bbox;
        console.log("Country Name:", country.properties.ADMIN);
        console.log("Bounding Box:", bbox);
        moveMapToCountry(bbox);
        createCountryPolygon(bbox);
      } else {
        console.log("Country not found.");
        // Remove the vector layer if country is not found
        if (vectorLayer) {
          map.removeLayer(vectorLayer);
        }
      }
    })
    .catch((error) => console.error("Error:", error));
}
