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

// Firestore initialisieren
const db = firebase.firestore(); // Firestore richtig initialisieren

// Firebase Auth initialisieren
const auth = firebase.auth();

async function register() {
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email-or-username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username) {
        alert("Bitte einen Benutzernamen eingeben.");
        return;
    }

    try {
        console.log("Registrierung wird versucht mit:", email, username); // Debugging
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        console.log("Benutzer erfolgreich registriert:", user.uid);

        // Benutzername in Firestore speichern
        await db.collection("users").doc(user.uid).set({
            username: username,
            email: email,
        });

        alert("Registrierung erfolgreich!");
        updateUI(user, username); // Benutzername direkt anzeigen
    } catch (error) {
        console.error("Fehler bei der Registrierung:", error);
        alert("Fehler bei der Registrierung: " + error.message);
    }
}



// Login mit Benutzername laden
async function login() {
    const emailOrUsername = document.getElementById("email-or-username").value;
    const password = document.getElementById("password").value;

    try {
        let email;

        if (isEmail(emailOrUsername)) {
            // Login mit E-Mail
            email = emailOrUsername;
        } else {
            // Login mit Benutzername: Benutzername in Firestore suchen
            const querySnapshot = await db.collection("users")
                .where("username", "==", emailOrUsername)
                .get();

            if (querySnapshot.empty) {
                throw new Error("Benutzername nicht gefunden.");
            }

            // E-Mail des Benutzers aus Firestore holen
            email = querySnapshot.docs[0].data().email;
        }

        // Login mit der gefundenen oder eingegebenen E-Mail
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Benutzername aus Firestore laden
        const userDoc = await db.collection("users").doc(user.uid).get();
        const username = userDoc.exists ? userDoc.data().username : "Nutzer";

        alert("Login erfolgreich!");
        updateUI(user, username);
    } catch (error) {
        console.error("Fehler beim Login:", error);
        alert("Fehler beim Login: " + error.message);
    }
}


// Logout-Funktion
function logout() {
    auth.signOut()
        .then(() => {
            alert("Erfolgreich ausgeloggt!");
            updateUI(null); // UI auf ausgeloggten Zustand setzen
        })
        .catch((error) => {
            console.error("Fehler beim Logout:", error);
        });
}

// UI aktualisieren mit Benutzername
function updateUI(user, username = "") {
    if (user) {
        // Eingeloggt
        document.getElementById("auth-section").style.display = "none";
        document.getElementById("user-section").style.display = "block";
        document.getElementById("user-email").textContent = `Angemeldet als: ${username || user.email}`;
    } else {
        // Ausgeloggt
        document.getElementById("auth-section").style.display = "block";
        document.getElementById("user-section").style.display = "none";
    }
}

// Überwache Login-Status
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Benutzername laden
        const userDoc = await db.collection("users").doc(user.uid).get();
        const username = userDoc.exists ? userDoc.data().username : "Nutzer";
        updateUI(user, username);
    } else {
        updateUI(null);
    }
});

// Event-Listener
document.getElementById("login-btn").addEventListener("click", login);
document.getElementById("register-btn").addEventListener("click", register);
document.getElementById("logout-btn").addEventListener("click", logout);

function isEmail(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
}
// Rezepte aus Firestore laden
async function loadRecipes() {
    const recipesContainer = document.getElementById("recipes");
    recipesContainer.innerHTML = "";

    try {
        const querySnapshot = await db.collection("recipes").get();
        querySnapshot.forEach((doc) => {
            const recipe = doc.data();
            recipe.id = doc.id; // Setze die ID des Dokuments
            const recipeCard = createRecipeCard(recipe);
            recipesContainer.appendChild(recipeCard);
        });
    } catch (error) {
        console.error("Fehler beim Laden der Rezepte:", error);
    }
}
