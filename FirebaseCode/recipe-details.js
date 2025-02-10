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
  
      const docSnapshot = await favoriteRef.get();
      updateFavoriteButton(docSnapshot.exists);
    } catch (error) {
      console.error("Fehler beim Überprüfen der Favoriten:", error);
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
  

  async function toggleFavorite() {
    const user = firebase.auth().currentUser;
    if (!user) {
      alert("Bitte loggen Sie sich ein, um Favoriten zu verwalten.");
      return;
    }
  
    const recipeName = document.getElementById("recipe-name").textContent;
    const favoriteRef = db
      .collection("users")
      .doc(user.uid)
      .collection("favorites")
      .doc(recipeName);
  
    try {
      const docSnapshot = await favoriteRef.get();
  
      if (docSnapshot.exists) {
        // Rezept ist bereits favorisiert – entferne es
        await favoriteRef.delete();
        alert(`${recipeName} wurde aus deinen Favoriten entfernt.`);
        updateFavoriteButton(false);
      } else {
        // Rezept hinzufügen (zusätzlich kannst du weitere Felder speichern, z.B. Level)
        const recipeImage = document.getElementById("recipe-image").src;
        await favoriteRef.set({
            name: recipeName,
            image: recipeImage,
            level: currentRecipe ? currentRecipe.level : "",
            time: currentRecipe ? currentRecipe.time : "",
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
        alert(`${recipeName} wurde zu deinen Favoriten hinzugefügt.`);
        updateFavoriteButton(true);
      }
      // Favoritenliste in der linken Sidebar neu laden
      loadFavorites();
    } catch (error) {
      console.error("Fehler beim Verwalten der Favoriten:", error);
      alert("Fehler beim Verwalten der Favoriten: " + error.message);
    }
  }
  
  // Event-Listener für den Favoriten-Button
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


function updateUI(user) {
    const userInfo = document.getElementById("user-info");
    const userStatus = document.getElementById("user-status");
    const logoutButton = document.getElementById("logout-button");

    if (user) {
        userInfo.style.display = "block";
        userStatus.textContent = `Angemeldet als: ${user.email}`;
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

async function loadFavorites() {
    const favoritesList = document.getElementById("favorite-recipes");
    if (!favoritesList) return;
    
    // Liste zunächst leeren
    favoritesList.innerHTML = "";
    
    // Prüfe, ob ein Nutzer eingeloggt ist
    const user = firebase.auth().currentUser;
    if (!user) {
      const messageItem = document.createElement("li");
      messageItem.textContent = "Bitte Einloggen um Favoriten zu sehen";
      messageItem.style.fontStyle = "italic";
      messageItem.style.color = "#999";
      favoritesList.appendChild(messageItem);
      return;
    }
  
    try {
      const querySnapshot = await db.collection("users")
        .doc(user.uid)
        .collection("favorites")
        .orderBy("timestamp", "desc")
        .get();
  
      if (querySnapshot.empty) {
        // Kein Favorit vorhanden – zeige entsprechenden Hinweis
        const messageItem = document.createElement("li");
        messageItem.textContent = "Füge deine Lieblingsrezepte als Favoriten hinzu um sie hier stehen zu haben.";
        messageItem.style.fontStyle = "italic";
        messageItem.style.color = "#999";
        favoritesList.appendChild(messageItem);
        return;
      }
  
      // Falls Favoriten vorhanden sind, erstelle die Listeneinträge
      querySnapshot.forEach((doc) => {
        const favorite = doc.data();
  
        const listItem = document.createElement("li");
        listItem.classList.add("favorite-item");
  
        // Thumbnail (falls vorhanden)
        if (favorite.image) {
          const thumbnail = document.createElement("img");
          thumbnail.src = favorite.image;
          thumbnail.alt = favorite.name;
          thumbnail.classList.add("favorite-thumbnail");
          listItem.appendChild(thumbnail);
        }
  
        // Container für Text (Name, Zeit und Level)
        const infoDiv = document.createElement("div");
        infoDiv.classList.add("favorite-info");
  
        const title = document.createElement("h4");
        title.textContent = favorite.name;
        infoDiv.appendChild(title);
  
        const details = document.createElement("p");
        details.textContent = `Zeit: ${favorite.time ? favorite.time + " min" : "unbekannt"} | Level: ${favorite.level || "unbekannt"}`;
        infoDiv.appendChild(details);
  
        listItem.appendChild(infoDiv);
  
        // Klick-Event: Navigiere zur Rezeptdetailseite
        listItem.addEventListener("click", () => {
          window.location.href = `recipe-details.html?name=${encodeURIComponent(favorite.name)}`;
        });
  
        favoritesList.appendChild(listItem);
      });
    } catch (error) {
      console.error("Fehler beim Laden der Favoriten:", error);
    }
  }
  
  
  
  document.addEventListener("DOMContentLoaded", () => {
    loadFavorites();
  });
  