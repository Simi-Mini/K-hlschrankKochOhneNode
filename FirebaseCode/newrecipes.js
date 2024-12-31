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

async function updateRecipe(docId) {
    const updatedData = {
        level: "3", // Beispiel: Level ändern
        time: "30", // Beispiel: Zeit ändern
        amounts: [
            { Zutat: "Spaghetti", Menge: "500 g" }, // Beispiel: Menge ändern
            { Zutat: "Eier", Menge: "5 Stück" },
            { Zutat: "Parmesan", Menge: "120 g, gerieben" },
            { Zutat: "Speck", Menge: "200 g, gewürfelt" },
            { Zutat: "Pfeffer", Menge: "Nach Geschmack" }
        ]
    };

    try {
        await db.collection("recipes").doc(docId).update(updatedData);
        console.log("Rezept erfolgreich aktualisiert!");
        alert("Rezept wurde erfolgreich aktualisiert!");
    } catch (error) {
        console.error("Fehler beim Aktualisieren des Rezepts:", error);
        alert("Fehler beim Aktualisieren des Rezepts: " + error.message);
    }
}

// Beispiel: Aktualisiere das Rezept mit der Dokument-ID
updateRecipe("Spaghetti Crabonara");
