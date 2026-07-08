const fs = require('fs');
const turfDifference = require('@turf/difference').default;
const turfUnion = require('@turf/union').default;
const { polygon: turfPolygon } = require('@turf/helpers');

const ghanaData = JSON.parse(fs.readFileSync('./public/ghana.geojson', 'utf8'));

let mergedGhana = null;

for (const feature of ghanaData.features) {
  if (!mergedGhana) {
    mergedGhana = feature;
  } else {
    try {
      mergedGhana = turfUnion(mergedGhana, feature);
    } catch(e) {
      console.log('Error merging a feature, ignoring:', e);
    }
  }
}

const world = turfPolygon([[
  [-180, -90],
  [180, -90],
  [180, 90],
  [-180, 90],
  [-180, -90]
]]);

const mask = turfDifference(world, mergedGhana);

fs.writeFileSync('./public/ghana_mask.geojson', JSON.stringify(mask));
console.log('Mask generated successfully at ./public/ghana_mask.geojson');
