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

// Zutaten-Tabelle rendern
function renderAmountsTable(amounts) {
    const table = document.getElementById("recipe-amounts");

    table.innerHTML = ""; // Tabelle leeren

    if (!amounts || Object.keys(amounts).length === 0) {
        table.innerHTML = "<tr><td colspan='2'>Keine Zutaten verfügbar.</td></tr>";
        return;
    }

    const sortedAmounts = Object.values(amounts).sort((a, b) => {
        const zutatA = a.Zutat.toLowerCase();
        const zutatB = b.Zutat.toLowerCase();
        return zutatA.localeCompare(zutatB);
    });

    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
        <th>Zutat</th>
        <th>Menge</th>
    `;
    table.appendChild(headerRow);

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

        const recipeDoc = querySnapshot.docs[0];
        const recipe = recipeDoc.data();

        document.getElementById("recipe-name").textContent = recipe.name || "Unbekanntes Rezept";
        document.getElementById("recipe-image").src = recipe.image || "https://via.placeholder.com/600";
        document.getElementById("recipe-description").textContent = recipe.beschreibung || "Keine Beschreibung verfügbar.";
        document.getElementById("recipe-level").textContent = `Level: ${recipe.level}`;
        document.getElementById("recipe-time").textContent = `Zeit: ${recipe.time} Minuten`;

        renderAmountsTable(recipe.amounts);

        checkIfFavorite(); // Favoritenstatus prüfen
    } catch (error) {
        console.error("Fehler beim Laden der Rezeptdetails:", error);
        alert("Fehler beim Laden der Rezeptdetails: " + error.message);
    }
}

// Favoriten-Button aktualisieren
function updateFavoriteButton(isFavorite) {
    const favoriteButton = document.getElementById("favorite-button");
    if (isFavorite) {
        favoriteButton.textContent = "Aus Favoriten entfernen";
        favoriteButton.style.backgroundColor = "#e53935";
    } else {
        favoriteButton.textContent = "Zu Favoriten hinzufügen";
        favoriteButton.style.backgroundColor = "#ff9800";
    }
}

// Favoritenstatus prüfen
async function checkIfFavorite() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const recipeName = document.getElementById("recipe-name").textContent;

    try {
        const favoriteRef = db
            .collection("users")
            .doc(user.uid)
            .collection("favorites")
            .doc(recipeName);

        const doc = await favoriteRef.get();
        updateFavoriteButton(doc.exists);
    } catch (error) {
        console.error("Fehler beim Überprüfen der Favoriten:", error);
    }
}

// Favorit hinzufügen oder entfernen
async function toggleFavorite() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Bitte loggen Sie sich ein, um Favoriten zu verwalten.");
        return;
    }

    const recipeName = document.getElementById("recipe-name").textContent;

    try {
        const favoriteRef = db
            .collection("users")
            .doc(user.uid)
            .collection("favorites")
            .doc(recipeName);

        const doc = await favoriteRef.get();

        if (doc.exists) {
            await favoriteRef.delete();
            alert(`${recipeName} wurde aus deinen Favoriten entfernt.`);
            updateFavoriteButton(false);
        } else {
            const recipeImage = document.getElementById("recipe-image").src;

            await favoriteRef.set({
                name: recipeName,
                image: recipeImage,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            });

            alert(`${recipeName} wurde zu deinen Favoriten hinzugefügt.`);
            updateFavoriteButton(true);
        }
    } catch (error) {
        console.error("Fehler beim Verwalten der Favoriten:", error);
        alert("Fehler beim Verwalten der Favoriten: " + error.message);
    }
}

// Favoritenliste laden
async function loadFavorites() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const favoritesList = document.getElementById("favorite-recipes");
    favoritesList.innerHTML = "";

    try {
        const querySnapshot = await db
            .collection("users")
            .doc(user.uid)
            .collection("favorites")
            .orderBy("timestamp", "desc")
            .get();

        querySnapshot.forEach((doc) => {
            const favorite = doc.data();
            const listItem = document.createElement("li");
            listItem.textContent = favorite.name;
            favoritesList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Fehler beim Laden der Favoriten:", error);
    }
}

// Event-Listener für Favoriten-Button
document.getElementById("favorite-button").addEventListener("click", toggleFavorite);

// Rezept laden, wenn die Seite geöffnet wird
const recipeName = getRecipeNameFromURL();
loadRecipeDetails(recipeName);

// Überprüfen, ob der Benutzer eingeloggt ist
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        loadFavorites();
        checkIfFavorite();
    }
});
