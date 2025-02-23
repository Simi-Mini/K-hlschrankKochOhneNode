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

function getRecipeNameFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("name"); 
}

function renderAmountsTable(amounts) {
  const table = document.getElementById("recipe-amounts");

  table.innerHTML = ""; 

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
    showModal("Kein Rezept ausgewählt.");
      return;
  }

  try {
      const querySnapshot = await db.collection("recipes")
          .where("name", "==", recipeName)
          .get();

      if (querySnapshot.empty) {
        showModal("Rezept nicht gefunden.");
        return;
      }

      const recipeDoc = querySnapshot.docs[0];
      const recipe = recipeDoc.data();

      currentRecipe = recipe;

      document.getElementById("recipe-name").textContent = recipe.name || "Unbekanntes Rezept";
      document.getElementById("recipe-image").src = recipe.image || "https://via.placeholder.com/600";
      renderDescription(recipe.beschreibung || "Keine Beschreibung verfügbar.");
      document.getElementById("recipe-level").textContent = `Level: ${recipe.level}`;
      document.getElementById("recipe-time").textContent = `Zeit: ${recipe.time} Minuten`;

      renderAmountsTable(recipe.amounts);

      checkIfFavorite(); 
  } catch (error) {
      console.error("Fehler beim Laden der Rezeptdetails:", error);
      showModal("Fehler beim Laden der Rezeptdetails: " + error.message);
    }
}

function renderDescription(description) {
  const descriptionElement = document.getElementById("recipe-description");

  const listPattern = /^\d+\.\s+/gm;
  if (listPattern.test(description)) {
      const listItems = description.split(listPattern).filter(item => item.trim() !== "");
      const listElement = document.createElement("ol");
      listItems.forEach(item => {
          const listItem = document.createElement("li");
          listItem.textContent = item.trim();
          listElement.appendChild(listItem);
      });
      descriptionElement.innerHTML = "";
      descriptionElement.appendChild(listElement);
  } else {
      descriptionElement.textContent = description;
  }
}

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
    showModal("Bitte loggen Sie sich ein, um Favoriten zu verwalten.");
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
      await favoriteRef.delete();
      showModal(`${recipeName} wurde aus deinen Favoriten entfernt.`);
      updateFavoriteButton(false);
    } else {
      const recipeImage = document.getElementById("recipe-image").src;
      await favoriteRef.set({
          name: recipeName,
          image: recipeImage,
          level: currentRecipe ? currentRecipe.level : "",
          time: currentRecipe ? currentRecipe.time : "",
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
      showModal(`${recipeName} wurde zu deinen Favoriten hinzugefügt.`);
      updateFavoriteButton(true);
    }
    loadFavorites();
  } catch (error) {
    console.error("Fehler beim Verwalten der Favoriten:", error);
    showModal("Fehler beim Verwalten der Favoriten: " + error.message);
  }
}

document.getElementById("favorite-button").addEventListener("click", toggleFavorite);

const recipeName = getRecipeNameFromURL();
loadRecipeDetails(recipeName);

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
      loadFavorites();
      checkIfFavorite();
  }
});

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
      localStorage.setItem("user", JSON.stringify({ email: user.email, uid: user.uid }));
      updateUI(user);
  } else {
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
          window.location.href = "index.html";  
      });
  }
});

async function loadFavorites() {
  const favoritesList = document.getElementById("favorite-recipes");
  if (!favoritesList) return;
  
  favoritesList.innerHTML = "";
  
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
      const messageItem = document.createElement("li");
      messageItem.textContent = "Füge deine Lieblingsrezepte als Favoriten hinzu um sie hier stehen zu haben.";
      messageItem.style.fontStyle = "italic";
      messageItem.style.color = "#999";
      favoritesList.appendChild(messageItem);
      return;
    }

    querySnapshot.forEach((doc) => {
      const favorite = doc.data();

      const listItem = document.createElement("li");
      listItem.classList.add("favorite-item");

      if (favorite.image) {
        const thumbnail = document.createElement("img");
        thumbnail.src = favorite.image;
        thumbnail.alt = favorite.name;
        thumbnail.classList.add("favorite-thumbnail");
        listItem.appendChild(thumbnail);
      }

      const infoDiv = document.createElement("div");
      infoDiv.classList.add("favorite-info");

      const title = document.createElement("h4");
      title.textContent = favorite.name;
      infoDiv.appendChild(title);

      const details = document.createElement("p");
      details.textContent = `Zeit: ${favorite.time ? favorite.time + " min" : "unbekannt"} | Level: ${favorite.level || "unbekannt"}`;
      infoDiv.appendChild(details);

      listItem.appendChild(infoDiv);

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

function showModal(message) {
  const modal = document.getElementById("modal");
  const modalMessage = document.getElementById("modal-message");
  modalMessage.textContent = message;
  modal.style.display = "block";
}

function closeModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "none";
}