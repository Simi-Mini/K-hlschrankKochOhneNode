const express = require('express');
const app = express();
const PORT = 3000;

// Einfacher Endpunkt zum Testen
app.get('/', (req, res) => {
  res.send('Hello, Kühlschrankkoch API ist online!');
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});

app.use(express.json());

// Beispiel-Rezepte (als Platzhalter)
const rezepte = [
    { id: 1, name: 'Spaghetti Bolognese', description: 'Ein italienisches Nudelgericht.' },
    { id: 2, name: 'Omelette', description: 'Ein einfaches Omelette mit Eiern.' }
  ];
  
  // Endpunkt, um alle Rezepte anzuzeigen
  app.get('/recipes', (req, res) => {
    res.json(rezepte);
  });
  
  // Endpunkt, um ein bestimmtes Rezept anhand der ID anzuzeigen
  app.get('/recipes/:id', (req, res) => {
    const recipeId = parseInt(req.params.id);
    const recipe = rezepte.find(r => r.id === recipeId);
    if (recipe) {
      res.json(recipe);
    } else {
      res.status(404).json({ message: 'Rezept nicht gefunden' });
    }
  });
  
  // Endpunkt zum Hinzufügen eines neuen Rezepts
app.post('/recipes', (req, res) => {
    const newRecipe = req.body;
    newRecipe.id = rezepte.length + 1; // einfache ID-Generierung
    rezepte.push(newRecipe);
    res.status(201).json(newRecipe); // 201 bedeutet „Created“
  });
  