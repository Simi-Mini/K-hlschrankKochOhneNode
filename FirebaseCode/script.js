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

        const recipesDiv = document.getElementById("recipes");
        recipesDiv.innerHTML = ""; // Alte Ergebnisse löschen

        const completeRecipes = []; // Rezepte mit vollständigen Zutaten
        const incompleteRecipes = []; // Rezepte mit fehlenden Zutaten

        querySnapshot.forEach((doc) => {
            const recipe = doc.data();
            const recipeIngredients = recipe.ingredients;

            // Fehlende Zutaten berechnen
            const missingIngredients = recipeIngredients.filter(
                (ingredient) => !selectedIngredients.includes(ingredient)
            );

            if (missingIngredients.length === 0) {
                // Alle Zutaten vorhanden
                completeRecipes.push(recipe);
            } else if (missingIngredients.length < recipeIngredients.length) {
                // Einige Zutaten vorhanden, aber nicht alle
                incompleteRecipes.push({ recipe, missingIngredients });
            }
        });

        // 1. Rezepte, die du machen kannst
        if (completeRecipes.length > 0) {
            const completeSection = document.createElement("div");
            completeSection.classList.add("recipe-section");

            const completeHeading = document.createElement("h2");
            completeHeading.textContent = "Rezepte, die du machen kannst:";
            completeSection.appendChild(completeHeading);

            const completeGrid = document.createElement("div");
            completeGrid.classList.add("recipe-grid");

            completeRecipes.forEach((recipe) => {
                const recipeCard = createRecipeCard(recipe); // Dynamische Rezeptkarte
                completeGrid.appendChild(recipeCard);
            });

            completeSection.appendChild(completeGrid);
            recipesDiv.appendChild(completeSection);
        }

        // 2. Unvollständige Rezepte
        if (incompleteRecipes.length > 0) {
            const incompleteSection = document.createElement("div");
            incompleteSection.classList.add("recipe-section");

            const incompleteHeading = document.createElement("h2");
            incompleteHeading.textContent = "Unvollständige Rezepte:";
            incompleteSection.appendChild(incompleteHeading);

            const incompleteGrid = document.createElement("div");
            incompleteGrid.classList.add("recipe-grid");

            incompleteRecipes.forEach(({ recipe, missingIngredients }) => {
                const recipeCard = createRecipeCard(recipe, missingIngredients); // Dynamische Rezeptkarte
                incompleteGrid.appendChild(recipeCard);
            });

            incompleteSection.appendChild(incompleteGrid);
            recipesDiv.appendChild(incompleteSection);
        }

        // 3. Wenn keine Rezepte gefunden werden
        if (completeRecipes.length === 0 && incompleteRecipes.length === 0) {
            recipesDiv.innerHTML = "<p>Keine passenden Rezepte gefunden.</p>";
        }
    } catch (error) {
        console.error("Fehler beim Suchen der Rezepte:", error);
        alert("Fehler beim Abrufen der Rezepte.");
    }
}

function createRecipeCard(recipe) {
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
            <p><strong>Time:</strong> ${recipe.time} min | <strong>Expense:</strong> ${recipe.expense}</p>
        </div>
    `;

    recipeCard.appendChild(recipeImage);
    recipeCard.innerHTML += recipeDetails;

    // Klick-Event hinzufügen
    recipeCard.addEventListener("click", () => {
        console.log("Navigiere zu Rezept:", recipe.name); // Debugging
        window.location.href = `recipe-details.html?name=${encodeURIComponent(recipe.name)}`; // Rezeptname in die URL einfügen
    });

    return recipeCard;
}

// Rezepte aus Firestore laden
async function loadRecipes() {
    const recipesContainer = document.getElementById("recipes");
    recipesContainer.innerHTML = "";

    try {
        // Firestore-Daten abrufen
        const querySnapshot = await db.collection("recipes").get();

        querySnapshot.forEach((doc) => {
            const recipe = doc.data();
            recipe.id = doc.id; // Setze die automatisch generierte Dokument-ID
            const recipeCard = createRecipeCard(recipe);
            recipesContainer.appendChild(recipeCard);
        });
    } catch (error) {
        console.error("Fehler beim Laden der Rezepte:", error);
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

// Firebase Auth-Referenz
const auth = firebase.auth();

// Login-Funktion
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        alert("Eingeloggt als: " + userCredential.user.email);
        showUserInfo(userCredential.user);
    } catch (error) {
        alert("Fehler beim Login: " + error.message);
    }
}

// Registrierung-Funktion
async function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        alert("Registrierung erfolgreich! Eingeloggt als: " + userCredential.user.email);
        showUserInfo(userCredential.user);
    } catch (error) {
        alert("Fehler bei der Registrierung: " + error.message);
    }
}

// Logout-Funktion
function logout() {
    auth.signOut().then(() => {
        alert("Abgemeldet!");
        document.getElementById("user-info").style.display = "none";
        document.getElementById("login-form").style.display = "block";
    });
}

// Benutzerinfo anzeigen
function showUserInfo(user) {
    document.getElementById("login-form").style.display = "none";
    document.getElementById("user-info").style.display = "block";
    document.getElementById("user-email").textContent = "Angemeldet als: " + user.email;
}

// Event-Listener
document.getElementById("login-btn").addEventListener("click", login);
document.getElementById("register-btn").addEventListener("click", register);
document.getElementById("logout-btn").addEventListener("click", logout);

// Benutzerstatus überwachen
auth.onAuthStateChanged((user) => {
    if (user) {
        showUserInfo(user);
    } else {
        document.getElementById("user-info").style.display = "none";
        document.getElementById("login-form").style.display = "block";
    }
});

// Favoriten speichern
async function likeRecipe(recipeId, recipeName, recipeLevel, recipeTime) {
    const user = auth.currentUser;
    if (!user) {
        alert("Bitte logge dich ein, um Favoriten hinzuzufügen.");
        return;
    }

    const favoritesRef = firebase.firestore().collection("users").doc(user.uid).collection("favorites");
    try {
        await favoritesRef.doc(recipeId).set({
            name: recipeName,
            level: recipeLevel,
            time: recipeTime
        });
        alert("Rezept wurde zu Favoriten hinzugefügt!");
        loadFavorites(); // Aktualisiere die Favoritenliste
    } catch (error) {
        alert("Fehler beim Hinzufügen zu Favoriten: " + error.message);
    }
}

// Favoriten laden
async function loadFavorites() {
    const user = auth.currentUser;
    if (!user) return;

    const favoritesRef = firebase.firestore().collection("users").doc(user.uid).collection("favorites");
    try {
        const snapshot = await favoritesRef.get();
        const favoritesList = document.querySelector(".left-sidebar");
        favoritesList.innerHTML = "<h3>Favoriten</h3>";

        snapshot.forEach((doc) => {
            const favorite = doc.data();
            const favoriteItem = document.createElement("div");
            favoriteItem.textContent = `${favorite.name} - Level: ${favorite.level}, Time: ${favorite.time} min`;
            favoritesList.appendChild(favoriteItem);
        });
    } catch (error) {
        alert("Fehler beim Laden der Favoriten: " + error.message);
    }
}

async function loadIngredients() {
    try {
        const querySnapshot = await db.collection("recipes").get();
        const allIngredients = new Set(); // Set für einzigartige Zutaten

        // Iteriere über alle Rezepte und sammle Zutaten
        querySnapshot.forEach(doc => {
            const recipe = doc.data();
            if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
                recipe.ingredients.forEach(ingredient => allIngredients.add(ingredient));
            }
        });

        // Umwandeln von Set zu Array und alphabetisch sortieren
        const sortedIngredients = Array.from(allIngredients).sort();

        // Zutaten in Buttons anzeigen
        renderIngredientButtons(sortedIngredients);
    } catch (error) {
        console.error("Fehler beim Laden der Zutaten:", error);
        alert("Fehler beim Laden der Zutaten: " + error.message);
    }
}

function renderIngredientButtons(ingredients) {
    const ingredientContainer = document.getElementById("ingredient-buttons");
    ingredientContainer.innerHTML = ""; // Bestehende Buttons entfernen

    const maxVisibleButtons = 10; // Maximale Anzahl sichtbarer Buttons
    const visibleIngredients = ingredients.slice(0, maxVisibleButtons);
    const hiddenIngredients = ingredients.slice(maxVisibleButtons);

    // Sichtbare Buttons generieren
    visibleIngredients.forEach(ingredient => {
        const button = createIngredientButton(ingredient);
        ingredientContainer.appendChild(button);
    });

    // Wenn es versteckte Zutaten gibt, füge einen "Noch mehr Zutaten"-Button hinzu
    if (hiddenIngredients.length > 0) {
        const moreButton = document.createElement("button");
        moreButton.textContent = "Noch mehr Zutaten";
        moreButton.className = "more-ingredients-button";
        moreButton.onclick = () => renderHiddenIngredientButtons(hiddenIngredients);
        ingredientContainer.appendChild(moreButton);
    }
}

function renderHiddenIngredientButtons(hiddenIngredients) {
    const ingredientContainer = document.getElementById("ingredient-buttons");

    // Versteckte Zutaten-Buttons generieren
    hiddenIngredients.forEach(ingredient => {
        const button = createIngredientButton(ingredient);
        ingredientContainer.appendChild(button);
    });

    // Entferne den "Noch mehr Zutaten"-Button nach Klick
    const moreButton = document.querySelector(".more-ingredients-button");
    if (moreButton) {
        moreButton.remove();
    }
}

function createIngredientButton(ingredient) {
    const button = document.createElement("button");
    button.textContent = ingredient;
    button.dataset.value = ingredient; // Attribut für den Zutatenwert
    button.className = "ingredient-button";
    button.onclick = () => toggleIngredientSelection(button);
    return button;
}

function toggleIngredientSelection(button) {
    button.classList.toggle("active");
    // Hier kannst du eine Funktion hinzufügen, um ausgewählte Zutaten zu speichern
}

document.addEventListener("DOMContentLoaded", () => {
    loadIngredients();
});
