const firebaseConfig = {
    apiKey: "AIzaSyA61kcGoFKvMUz88mJhKYbB8FBbylGLT6g",
    authDomain: "kuehlschrank-koch.firebaseapp.com",
    projectId: "kuehlschrank-koch",
    storageBucket: "kuehlschrank-koch.firebasestorage.app",
    messagingSenderId: "107624432024",
    appId: "1:107624432024:web:bc03288da99fa6d2092bed"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Rezeptname aus der URL holen
function getRecipeNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("name"); // ?name=<Rezeptname>
}

// Zutaten-Tabelle rendern (mit Sortierung)
function renderAmountsTable(amounts) {
    const table = document.getElementById("recipe-amounts");

    // Tabelle leeren
    table.innerHTML = "";

    if (!amounts || Object.keys(amounts).length === 0) {
        table.innerHTML = "<tr><td colspan='2'>Keine Zutaten verfügbar.</td></tr>";
        return;
    }

    // Einträge sortieren
    const sortedAmounts = Object.values(amounts).sort((a, b) => {
        const zutatA = a.Zutat.toLowerCase();
        const zutatB = b.Zutat.toLowerCase();
        return zutatA.localeCompare(zutatB);
    });

    // Kopfzeile erstellen
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
        <th>Zutat</th>
        <th>Menge</th>
    `;
    table.appendChild(headerRow);

    // Datenzeilen hinzufügen
    sortedAmounts.forEach(amount => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${amount.Zutat || "Keine Zutat"}</td>
            <td>${amount.Menge || "Keine Menge"}</td>
        `;
        table.appendChild(row);
    });
}

// Rezeptdetails laden
async function loadRecipeDetails(recipeName) {
    if (!recipeName) {
        alert("Kein Rezept ausgewählt.");
        return;
    }

    try {
        const querySnapshot = await db.collection("recipes")
            .where("name", "==", recipeName)
            .get();

        if (querySnapshot.empty) {
            alert("Rezept nicht gefunden.");
            return;
        }

        // Nur das erste passende Dokument verwenden
        const recipeDoc = querySnapshot.docs[0];
        const recipe = recipeDoc.data();

        // Rezeptdaten anzeigen
        document.getElementById("recipe-name").textContent = recipe.name || "Unbekanntes Rezept";
        document.getElementById("recipe-image").src = recipe.image || "https://via.placeholder.com/600";
        document.getElementById("recipe-description").textContent = recipe.beschreibung || "Keine Beschreibung verfügbar.";
        document.getElementById("recipe-level").textContent = `Level: ${recipe.level}`;
        document.getElementById("recipe-time").textContent = `Zeit: ${recipe.time} Minuten`;

        // Zutaten-Tabelle rendern
        renderAmountsTable(recipe.amounts);
    } catch (error) {
        console.error("Fehler beim Laden der Rezeptdetails:", error);
        alert("Fehler beim Laden der Rezeptdetails: " + error.message);
    }
}

document.getElementById("back-to-home").addEventListener("click", () => {
    window.location.href = "index.html"; // Verlinkung zur Startseite
});

// Rezept laden, wenn die Seite geöffnet wird
const recipeName = getRecipeNameFromURL();
loadRecipeDetails(recipeName);