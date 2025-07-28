const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;
app.use(cors());
const masterMenu = JSON.parse(fs.readFileSync(path.join(__dirname, 'masterMenu.json')));
const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function summarizeTasteProfile(tasteArr) {
  const counts = tasteArr.reduce((acc, taste) => {
    acc[taste] = (acc[taste] || 0) + 1;
    return acc;
  }, {});
  const sortedTastes = Object.entries(counts).sort((a,b) => b[1] - a[1]);
  const dominantTaste = sortedTastes[0][0];
  const dominantCount = sortedTastes[0][1];
  if (dominantCount === 3) {
    return `${dominantTaste.charAt(0).toUpperCase() + dominantTaste.slice(1)} dominant`;
  } else if (dominantCount === 2) {
    const secondaryTaste = sortedTastes[1][0];
    return `Mostly ${dominantTaste} with a hint of ${secondaryTaste}`;
  } else {
    return `A mix of ${tasteArr.slice(0, -1).join(', ')} and ${tasteArr[tasteArr.length - 1]}`;
  }
}
function getItemsByCategory(category) {
  return masterMenu.filter(item => item.category === category);
}
function precomputeValidCombos() {
  const mains = getItemsByCategory('main');
  const sides = getItemsByCategory('side');
  const drinks = getItemsByCategory('drink');
  const validCombos = [];
  for (const main of mains) {
    for (const side of sides) {
      for (const drink of drinks) {
        const totalCalories = main.calories + side.calories + drink.calories;
        if (totalCalories >= 500 && totalCalories <= 800) {
          const popularityScore = main.popularity_score + side.popularity_score + drink.popularity_score;
          validCombos.push({
            main: main.item_name,
            side: side.item_name,
            drink: drink.item_name,
            total_calories: totalCalories,
            popularity_score: parseFloat(popularityScore.toFixed(2)),
            taste_summary: summarizeTasteProfile([main.taste_profile, side.taste_profile, drink.taste_profile]),
            reasoning: `Combo with ${[main.taste_profile, side.taste_profile, drink.taste_profile].join(', ')} taste, popularity ${popularityScore.toFixed(2)}, fits calorie range.`
          });
        }
      }
    }
  }
  return validCombos;
}
function pickNUniqueCombos(validCombos, n) {
  if (validCombos.length < n) {
    throw new Error(`Not enough valid combos (${validCombos.length}) to pick ${n} unique combos.`);
  }
  const combosCopy = [...validCombos];
  for (let i = combosCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combosCopy[i], combosCopy[j]] = [combosCopy[j], combosCopy[i]];
  }
  return combosCopy.slice(0, n);
}
const validCombos = precomputeValidCombos();
app.get('/generate-combo-plan', (req, res) => {
  try {
    const startDay = req.query.startDay || 'Wednesday';
    const startIndex = ALL_DAYS.indexOf(startDay);
    if (startIndex === -1) {
      return res.status(400).json({ error: 'Invalid startDay parameter' });
    }
    const combosNeeded = 21;
    const selectedCombos = pickNUniqueCombos(validCombos, combosNeeded);
    const weekdays = [];
    for (let i = 0; i < 7; i++) {
      weekdays.push(ALL_DAYS[(startIndex + i) % 7]);
    }
    const comboTypes = ['breakfast', 'lunch', 'dinner'];
    let comboId = 1;
    const comboPlan = [];
    let comboIndex = 0;
    for (const day of weekdays) {
      for (const comboType of comboTypes) {
        const combo = selectedCombos[comboIndex++];
        comboPlan.push({
          day,
          combo_type: comboType,
          combo_id: comboId++,
          ...combo
        });
      }
    }
    res.json(comboPlan);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to generate combo plan' });
  }
});
app.get('/', (req, res) => {
  res.send('Server is up and running!');
});
app.listen(PORT, () => {
  console.log(`Combo Planner API running on http://localhost:${PORT}`);
});