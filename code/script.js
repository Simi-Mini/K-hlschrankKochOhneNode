// Firebase-Konfiguration
const firebaseConfig = {
    apiKey: window.env.FIREBASE_API_KEY,
    authDomain: window.env.FIREBASE_AUTH_DOMAIN,
    projectId: window.env.FIREBASE_PROJECT_ID,
    storageBucket: window.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: window.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: window.env.FIREBASE_APP_ID,
};

// Firebase initialisieren
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Liste der ausgewählten Zutaten
let selectedIngredients = [];

// Zutaten aus der Datenbank laden und Buttons generieren
async function loadAllIngredients() {
    try {
        const recipesRef = db.collection("recipes");
        const querySnapshot = await recipesRef.get();

        const uniqueIngredients = new Set();

        // Zutaten aus den Rezepten sammeln
        querySnapshot.forEach(doc => {
            const recipe = doc.data();
            if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
                recipe.ingredients.forEach(ingredient => uniqueIngredients.add(ingredient));
            }
        });

        const sortedIngredients = Array.from(uniqueIngredients).sort();
        renderIngredientButtons(sortedIngredients);
    } catch (error) {
        console.error("Fehler beim Laden der Zutaten:", error);
        alert("Fehler beim Laden der Zutaten: " + error.message);
    }
}

// Zutaten-Buttons generieren
function renderIngredientButtons(ingredients) {
    const ingredientContainer = document.getElementById("ingredient-buttons");
    const toggleButton = document.getElementById("toggle-more-ingredients");
    ingredientContainer.innerHTML = ""; // Bestehende Buttons löschen

    ingredients.forEach(ingredient => {
        const button = createIngredientButton(ingredient);
        ingredientContainer.appendChild(button);
    });

    // Wenn mehr als 2 Reihen an Zutaten existieren, zeige den Toggle-Button
    const maxVisibleHeight = 150; // Höhe, bei der die Box abgeschnitten wird
    if (ingredientContainer.scrollHeight > maxVisibleHeight) {
        toggleButton.style.display = "block";

        toggleButton.addEventListener("click", () => {
            const isExpanded = ingredientContainer.classList.toggle("expanded");
            toggleButton.textContent = isExpanded ? "Zutaten einklappen" : "Weitere Zutaten ausklappen";
        });
    } else {
        toggleButton.style.display = "none";
    }
}

// Button für einzelne Zutat erstellen
function createIngredientButton(ingredient) {
    const button = document.createElement("button");
    button.textContent = ingredient;
    button.dataset.value = ingredient;
    button.className = "ingredient-button";
    button.addEventListener("click", () => toggleIngredientSelection(button)); // Klick-Event hinzufügen
    return button;
}

// Zutaten-Auswahl toggeln
function toggleIngredientSelection(button) {
    const ingredient = button.dataset.value;

    if (selectedIngredients.includes(ingredient)) {
        // Zutat entfernen
        selectedIngredients = selectedIngredients.filter(item => item !== ingredient);
        button.classList.remove("active");
    } else {
        // Zutat hinzufügen
        selectedIngredients.push(ingredient);
        button.classList.add("active");
    }

    console.log("Ausgewählte Zutaten:", selectedIngredients); // Debugging
}

// Suche nach Rezepten starten, wenn der Button geklickt wird
async function searchRecipesHandler(event) {
    event.preventDefault(); // Verhindert Seiten-Neuladen
    if (selectedIngredients.length === 0) {
        alert("Bitte wähle mindestens eine Zutat aus!");
        return;
    }
    console.log("Starte Rezeptsuche mit Zutaten:", selectedIngredients); // Debugging
    searchRecipes(selectedIngredients); // Rezepte basierend auf ausgewählten Zutaten suchen
}

// Rezepte basierend auf ausgewählten Zutaten suchen
async function searchRecipes(selectedIngredients) {
    try {
        const recipesRef = db.collection("recipes");
        const querySnapshot = await recipesRef.get();

        const recipesDiv = document.getElementById("recipes");
        recipesDiv.innerHTML = ""; // Alte Ergebnisse löschen

        const completeRecipes = [];
        const incompleteRecipes = [];

        querySnapshot.forEach(doc => {
            const recipe = doc.data();
            const recipeIngredients = recipe.ingredients;

            const missingIngredients = recipeIngredients.filter(
                ingredient => !selectedIngredients.includes(ingredient)
            );

            if (missingIngredients.length === 0) {
                completeRecipes.push(recipe);
            } else if (missingIngredients.length < recipeIngredients.length) {
                incompleteRecipes.push({ recipe, missingIngredients });
            }
        });

        if (completeRecipes.length > 0) {
            const completeSection = document.createElement("div");
            completeSection.classList.add("recipe-section");

            const completeHeading = document.createElement("h2");
            completeHeading.textContent = "Rezepte, die du machen kannst:";
            completeSection.appendChild(completeHeading);

            const completeGrid = document.createElement("div");
            completeGrid.classList.add("recipe-grid");

            completeRecipes.forEach(recipe => {
                const recipeCard = createRecipeCard(recipe);
                completeGrid.appendChild(recipeCard);
            });

            completeSection.appendChild(completeGrid);
            recipesDiv.appendChild(completeSection);
        }

        if (incompleteRecipes.length > 0) {
            const incompleteSection = document.createElement("div");
            incompleteSection.classList.add("recipe-section");

            const incompleteHeading = document.createElement("h2");
            incompleteHeading.textContent = "Unvollständige Rezepte:";
            incompleteSection.appendChild(incompleteHeading);

            const incompleteGrid = document.createElement("div");
            incompleteGrid.classList.add("recipe-grid");

            incompleteRecipes.forEach(({ recipe, missingIngredients }) => {
                const recipeCard = createRecipeCard(recipe, missingIngredients);
                incompleteGrid.appendChild(recipeCard);
            });

            incompleteSection.appendChild(incompleteGrid);
            recipesDiv.appendChild(incompleteSection);
        }

        if (completeRecipes.length === 0 && incompleteRecipes.length === 0) {
            recipesDiv.innerHTML = "<p>Keine passenden Rezepte gefunden.</p>";
        }
    } catch (error) {
        console.error("Fehler beim Suchen der Rezepte:", error);
        alert("Fehler beim Suchen der Rezepte: " + error.message);
    }
}

// Dynamische Rezeptkarten erstellen
function createRecipeCard(recipe, missingIngredients) {
    const recipeCard = document.createElement("div");
    recipeCard.classList.add("recipe-card");

    const recipeImage = document.createElement("img");
    recipeImage.src = recipe.image;
    recipeImage.alt = recipe.name;
    recipeImage.classList.add("recipe-image");

    const recipeDetails = `
        <div class="recipe-content">
            <h3 class="recipe-title">${recipe.name}</h3>
            <p><strong>Ingredients:</strong> ${recipe.ingredients.join(", ")}</p>
            <p><strong>Time:</strong> ${recipe.time} min</p>
        </div>
    `;

    recipeCard.appendChild(recipeImage);
    recipeCard.innerHTML += recipeDetails;

    recipeCard.addEventListener("click", () => {
        window.location.href = `recipe-details.html?name=${encodeURIComponent(recipe.name)}`;
    });

    return recipeCard;
}

// Event-Listener für das Formular
document.getElementById("ingredients-form").addEventListener("submit", searchRecipesHandler);

// Event-Listener für das Laden der Zutaten
document.addEventListener("DOMContentLoaded", () => {
    loadAllIngredients(); // Lade alle Zutaten beim Start
});
