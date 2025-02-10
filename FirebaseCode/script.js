// Firebase-Konfiguration
const firebaseConfig = {
    apiKey: "AIzaSyA61kcGoFKvMUz88mJhKYbB8FBbylGLT6g",
    authDomain: "kuehlschrank-koch.firebaseapp.com",
    projectId: "kuehlschrank-koch",
    storageBucket: "kuehlschrank-koch.firebasestorage.app",
    messagingSenderId: "107624432024",
    appId: "1:107624432024:web:bc03288da99fa6d2092bed"
};

// Firebase initialisieren
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

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

function createRecipeCard(recipe, missingIngredients) {
    const recipeCard = document.createElement("div");
    recipeCard.classList.add("recipe-card");
  
    const recipeImage = document.createElement("img");
    recipeImage.src = recipe.image;
    recipeImage.alt = recipe.name;
    recipeImage.classList.add("recipe-image");
  
    // Zeige Name, Zutaten, Zeit und Level an
    const recipeDetails = `
        <div class="recipe-content">
            <h3 class="recipe-title">${recipe.name}</h3>
            <p><strong>Zutaten:</strong> ${recipe.ingredients.join(", ")}</p>
            <p><strong>Zeit:</strong> ${recipe.time} min</p>
            <p><strong>Level:</strong> ${recipe.level}</p>
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
    loadFavorites(); // Lade Favoriten beim Start
});

// Login-Funktion
async function login() {
    const emailOrUsername = document.getElementById("email-or-username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        let email = emailOrUsername;

        // Prüfen, ob es eine Email ist
        if (!isEmail(emailOrUsername)) {
            const querySnapshot = await db.collection("users")
                .where("username", "==", emailOrUsername)
                .get();

            if (querySnapshot.empty) {
                throw new Error("Benutzername nicht gefunden.");
            }

            // Benutzername zu Email umwandeln
            email = querySnapshot.docs[0].data().email;
        }

        // Login mit der Email
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        alert(`Login erfolgreich! Willkommen, ${user.email}`);
        updateUI(user);
    } catch (error) {
        console.error("Fehler beim Login:", error);
        alert("Fehler beim Login: " + error.message);
    }
}

// Registrierung
async function register() {
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email-or-username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username) {
        alert("Bitte einen Benutzernamen eingeben.");
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Benutzername in der Firestore-Datenbank speichern
        await db.collection("users").doc(user.uid).set({
            username: username,
            email: email,
        });

        // Bestätigungs-E-Mail senden
        await user.sendEmailVerification();
        alert("Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse.");
        updateUI(user);
    } catch (error) {
        console.error("Fehler bei der Registrierung:", error);
        alert("Fehler bei der Registrierung: " + error.message);
    }
}


// Logout-Funktion
function logout() {
    auth.signOut()
        .then(() => {
            alert("Erfolgreich ausgeloggt!");
            updateUI(null);
        })
        .catch((error) => {
            console.error("Fehler beim Logout:", error);
        });
}

function updateUI(user) {
    if (user) {
      document.getElementById("auth-section").style.display = "none";
      document.getElementById("user-section").style.display = "block";
      document.getElementById("user-email").textContent = `Angemeldet als: ${user.email}`;
    } else {
      document.getElementById("auth-section").style.display = "block";
      document.getElementById("user-section").style.display = "none";
      // Direkt Favoriten-Bereich leeren und Hinweis setzen:
      const favoritesList = document.getElementById("favorite-recipes");
      if (favoritesList) {
        favoritesList.innerHTML = "<li style='font-style: italic; color: #999;'>Bitte Einloggen um Favoriten zu sehen</li>";
      }
    }
  }
  

// Überwache Login-Status
auth.onAuthStateChanged((user) => {
    if (user) {
        updateUI(user);
    } else {
        updateUI(null);
    }
});

// E-Mail-Validierung
function isEmail(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
}

// Event-Listener
if (document.getElementById("login-btn")) {
    document.getElementById("login-btn").addEventListener("click", login);
}
if (document.getElementById("register-btn")) {
    document.getElementById("register-btn").addEventListener("click", register);
}
if (document.getElementById("logout-btn")) {
    document.getElementById("logout-btn").addEventListener("click", logout);
}

// Google Signup Funktion
async function googleSignup() {
    console.log("Google-Signup gestartet"); // Debugging
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        // Benutzer in Firestore speichern, falls neu
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (!userDoc.exists) {
            await db.collection("users").doc(user.uid).set({
                username: user.displayName || "Google-Benutzer",
                email: user.email,
            });
        }

        alert(`Willkommen, ${user.displayName || "Benutzer"}!`);
        updateUI(user);
    } catch (error) {
        console.error("Fehler beim Google-Signup:", error);
        alert("Fehler beim Google-Signup: " + error.message);
    }
}

if (document.getElementById("google-signup-btn")) {
    document.getElementById("google-signup-btn").addEventListener("click", (event) => {
        event.preventDefault(); // Verhindert das Neuladen der Seite
        googleSignup(); // Ruft die Google-Signup-Funktion auf
    });
}

// Global: Stelle sicher, dass currentRecipe (das aktuell geladene Rezept)
// in deiner loadRecipeDetails-Funktion gesetzt wird.
let currentRecipe = null;

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
  
  
  
  
  // Event: Beim DOMContentLoaded Zutaten laden und Favoriten (falls User eingeloggt)
  document.addEventListener("DOMContentLoaded", () => {
    loadAllIngredients(); // Zutaten laden
    loadFavorites();      // Favoriten laden, falls ein User angemeldet ist
  });
  
  // Überwache Login-Status (Firebase Auth)
  firebase.auth().onAuthStateChanged((user) => {
    updateUI(user);
    if (user) {
      loadFavorites();
    }
  });

/**
 * Funktion, um ein Rezept als Favorit hinzuzufügen oder zu entfernen.
 */
 async function toggleFavorite() {
    const user = firebase.auth().currentUser;

  
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
        updateFavoriteButton(true);
      }
      // Favoritenliste in der linken Sidebar neu laden
      loadFavorites();
    } catch (error) {
      console.error("Fehler beim Verwalten der Favoriten:", error);
      alert("Fehler beim Verwalten der Favoriten: " + error.message);
    }
  }
  const recipeName = getRecipeNameFromURL();
loadRecipeDetails(recipeName);

/**
 * Beispielhafte Funktion, um den Button-Status zu aktualisieren.
 * Passe diese Funktion an dein Design an.
 */
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

  
  


auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    // Jetzt wird der Login-Zustand auch bei Seitenwechseln beibehalten.
  })
  .catch((error) => {
    console.error("Fehler beim Setzen der Persistenz:", error);
  });


// Beim Laden der Seite den Login-Status überprüfen
document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
        updateUI(user);
    } else {
        updateUI(null);
    }
});

window.loadFavorites = async function () {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const favoritesList = document.getElementById("favorite-recipes");
    if (!favoritesList) return;

    favoritesList.innerHTML = ""; // Liste leeren

    try {
        const querySnapshot = await db.collection("users")
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
};

  

document.addEventListener("DOMContentLoaded", () => {
    // Event-Listener für den Toggle-Button
    const toggleButton = document.getElementById("toggle-more-ingredients");
    const ingredientContainer = document.getElementById("ingredient-buttons");
    
    toggleButton.addEventListener("click", () => {
        ingredientContainer.classList.toggle("expanded");
        if (ingredientContainer.classList.contains("expanded")) {
            toggleButton.textContent = "Zutaten einklappen";
        } else {
            toggleButton.textContent = "Weitere Zutaten ausklappen";
        }
    });
    
    // Zutaten und Favoriten laden
    loadAllIngredients();
    loadFavorites();
});
