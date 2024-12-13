console.log(window.env);

const firebaseConfig = {
    apiKey: window.env.FIREBASE_API_KEY,
    authDomain: window.env.FIREBASE_AUTH_DOMAIN,
    projectId: window.env.FIREBASE_PROJECT_ID,
    storageBucket: window.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: window.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: window.env.FIREBASE_APP_ID,
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();



// Datenbank-Verbindung testen
async function testDatabaseConnection() {
    try {
        const recipesRef = db.collection("recipes");
        const querySnapshot = await recipesRef.get();

        querySnapshot.forEach((doc) => {
            console.log(`Rezept-ID: ${doc.id}, Daten:`, doc.data());
        });

        alert("Verbindung erfolgreich! Siehe Konsole für Daten.");
    } catch (error) {
        console.error("Fehler beim Abrufen der Daten:", error);
        alert("Fehler: Überprüfe die Firebase-Verbindung.");
    }
}

window.onload = testDatabaseConnection;

async function searchRecipes(selectedIngredients) {
    try {
        // Alle Rezepte aus der Datenbank abrufen
        const recipesRef = db.collection("recipes");
        const querySnapshot = await recipesRef.get();

        const exactMatches = []; // Rezepte, bei denen alle Zutaten übereinstimmen
        const partialMatches = []; // Rezepte, bei denen einige Zutaten übereinstimmen

        // Durch alle Rezepte iterieren
        querySnapshot.forEach((doc) => {
            const recipe = doc.data();
            const recipeIngredients = recipe.ingredients;

            // Fehlende Zutaten berechnen
            const missingIngredients = recipeIngredients.filter(
                (ingredient) => !selectedIngredients.includes(ingredient)
            );

            if (missingIngredients.length === 0) {
                // Alle Zutaten stimmen überein -> Exact Match
                exactMatches.push(recipe);
            } else if (missingIngredients.length < recipeIngredients.length) {
                // Teilweise Übereinstimmung -> Partial Match
                partialMatches.push({ recipe, missingIngredients });
            }
        });

        // Ergebnisse anzeigen
        const recipesDiv = document.getElementById("recipes");
        recipesDiv.innerHTML = "<h2>Gefundene Rezepte:</h2>"; // Alte Ergebnisse löschen

        if (exactMatches.length === 0 && partialMatches.length === 0) {
            // Keine passenden Rezepte gefunden
            recipesDiv.innerHTML += "<p>Keine Rezepte mit diesen Zutaten.</p>";
        }

        // Genaue Übereinstimmungen anzeigen
        if (exactMatches.length > 0) {
            recipesDiv.innerHTML += "<h3>Komplett passende Rezepte:</h3>";
            exactMatches.forEach((recipe) => {
                const recipeElement = document.createElement("div");
                recipeElement.textContent = `Rezept: ${recipe.name}`;
                recipesDiv.appendChild(recipeElement);
            });
        }

        // Teilweise passende Rezepte anzeigen
        if (partialMatches.length > 0) {
            recipesDiv.innerHTML += "<h3>Teilweise passende Rezepte (fehlende Zutaten):</h3>";
            partialMatches.forEach(({ recipe, missingIngredients }) => {
                const recipeElement = document.createElement("div");
                recipeElement.innerHTML = `
                    <p><strong>Rezept:</strong> ${recipe.name}</p>
                    <p><em>Fehlende Zutaten:</em> ${missingIngredients.join(", ")}</p>
                `;
                recipesDiv.appendChild(recipeElement);
            });
        }
    } catch (error) {
        console.error("Fehler beim Suchen der Rezepte:", error);
        alert("Fehler beim Abrufen der Rezepte.");
    }
}



// Zutaten-Auswahl mit Buttons
const ingredientButtons = document.querySelectorAll('#ingredient-buttons button');
let selectedIngredients = [];

ingredientButtons.forEach(button => {
    button.addEventListener('click', () => {
        const ingredient = button.getAttribute('data-value');
        if (selectedIngredients.includes(ingredient)) {
            // Zutat entfernen
            selectedIngredients = selectedIngredients.filter(item => item !== ingredient);
            button.classList.remove('active');
        } else {
            // Zutat hinzufügen
            selectedIngredients.push(ingredient);
            button.classList.add('active');
        }
    });
});

// Event-Listener für das Formular
const form = document.getElementById("ingredients-form");
form.addEventListener("submit", (event) => {
    event.preventDefault(); // Verhindert Seiten-Neuladen
    searchRecipes(selectedIngredients); // Rezepte suchen
});

