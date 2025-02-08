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

let currentRecipe = null;

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

        // Speichert das Rezept in der globalen Variable
        currentRecipe = recipe;

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
  
      const docSnapshot = await favoriteRef.get();
  
      if (docSnapshot.exists) {
        await favoriteRef.delete();
        alert(`${recipeName} wurde aus deinen Favoriten entfernt.`);
        updateFavoriteButton(false);
      } else {
        const recipeImage = document.getElementById("recipe-image").src;
        // Voraussetzung: currentRecipe wird in loadRecipeDetails gesetzt.
        await favoriteRef.set({
          name: recipeName,
          image: recipeImage,
          level: currentRecipe.level, // Level wird hier mitgespeichert
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
        alert(`${recipeName} wurde zu deinen Favoriten hinzugefügt.`);
        updateFavoriteButton(true);
      }
      // Nach dem Ändern der Favoriten wird die Favoritenliste aktualisiert:
      loadFavorites();
    } catch (error) {
      console.error("Fehler beim Verwalten der Favoriten:", error);
      alert("Fehler beim Verwalten der Favoriten: " + error.message);
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

// Überwache Login-Status
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // Speichere den Benutzer in localStorage
        localStorage.setItem("user", JSON.stringify({ email: user.email, uid: user.uid }));
        updateUI(user);
    } else {
        // Entferne den Benutzer aus localStorage
        localStorage.removeItem("user");
        updateUI(null);
    }
});

// Funktion zum Aktualisieren der Benutzeroberfläche
function updateUI(user) {
    const userInfo = document.getElementById("user-info");
    const userStatus = document.getElementById("user-status");
    const logoutButton = document.getElementById("logout-button");

    if (user) {
        userInfo.style.display = "block";
        userStatus.textContent = `Eingeloggt als: ${user.email}`;
        logoutButton.style.display = "block";
    } else {
        userInfo.style.display = "none";
        userStatus.textContent = "Nicht eingeloggt";
        logoutButton.style.display = "none";
    }
}

// Beim Laden der Seite den Login-Status überprüfen
document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
        updateUI(user);
    } else {
        updateUI(null);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const backButton = document.getElementById("back-to-home");
    if (backButton) {
        backButton.addEventListener("click", () => {
            window.location.href = "index.html"; // Navigiert zur Startseite
        });
    }
});
