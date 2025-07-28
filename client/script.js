const outputDiv = document.getElementById('output');
const generateBtn = document.getElementById('generateBtn');
const startDaySelect = document.getElementById('startDay');
generateBtn.addEventListener('click', () => {
  const startDay = startDaySelect.value;
  outputDiv.textContent = 'Loading combo plan...';
  fetch(`http://localhost:3000/generate-combo-plan?startDay=${startDay}`)
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(data => {
      renderComboPlan(data);
    })
    .catch(err => {
      outputDiv.textContent = `Error: ${err.message}`;
    });
});
function renderComboPlan(plan) {
  const combosByDay = {};
  plan.forEach(combo => {
    if (!combosByDay[combo.day]) combosByDay[combo.day] = [];
    combosByDay[combo.day].push(combo);
  });
  outputDiv.innerHTML = '';
  for (const day of Object.keys(combosByDay)) {
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('combo-day');
    const dayHeader = document.createElement('h2');
    dayHeader.textContent = day;
    dayDiv.appendChild(dayHeader);
    combosByDay[day].forEach(combo => {
      const mealDiv = document.createElement('div');
      mealDiv.classList.add('combo-meal');
      mealDiv.innerHTML = `
        <strong>${capitalize(combo.combo_type)}</strong>: ${combo.main}, ${combo.side}, ${combo.drink}<br/>
        Calories: ${combo.total_calories} | Popularity: ${combo.popularity_score}<br/>
        Taste: ${combo.taste_summary}<br/>
        Reasoning: ${combo.reasoning}
      `;
      dayDiv.appendChild(mealDiv);
    });
    outputDiv.appendChild(dayDiv);
  }
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}