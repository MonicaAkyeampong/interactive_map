const fs = require('fs');
const ghanaData = JSON.parse(fs.readFileSync('./public/ghana.geojson', 'utf8'));

const worldRing = [
  [-180, -90],
  [180, -90],
  [180, 90],
  [-180, 90],
  [-180, -90]
];

const maskCoordinates = [worldRing];

for (const feature of ghanaData.features) {
  if (feature.geometry.type === 'Polygon') {
    // Check winding order of the hole. It should ideally be opposite to the outer ring.
    // For now, let's just push it. Mapbox GL handles it well.
    maskCoordinates.push(feature.geometry.coordinates[0]);
  } else if (feature.geometry.type === 'MultiPolygon') {
    for (const polygon of feature.geometry.coordinates) {
      maskCoordinates.push(polygon[0]);
    }
  }
}

const maskGeojson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: maskCoordinates
      }
    }
  ]
};

fs.writeFileSync('./public/ghana_mask.geojson', JSON.stringify(maskGeojson));
console.log('Done generating mask!');
