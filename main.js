import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyByikN6_CXfiJnb1_0ppP60oBQxN8zVxYA",
    authDomain: "site-para-rifa-de-pascoa-25745.firebaseapp.com",
    projectId: "site-para-rifa-de-pascoa-25745",
    storageBucket: "site-para-rifa-de-pascoa-25745.firebasestorage.app",
    messagingSenderId: "1004843167683",
    appId: "1:1004843167683:web:93211e8925926723c3d776"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const numbersContainer = document.getElementById("numbers");
const counter = document.getElementById("counter");
const summary = document.getElementById("summary");
const buyBtn = document.getElementById("buyBtn");
const message = document.getElementById("message");

let soldNumbers = [];
let selectedNumbers = [];

async function loadNumbers() {
    const querySnapshot = await getDocs(collection(db, "rifa"));
    querySnapshot.forEach(doc => {
        soldNumbers.push(doc.data().number);
    });

    createNumbers();
    updateCounter();
}

function createNumbers() {
    for (let i = 1; i <= 100; i++) {
        const div = document.createElement("div");
        div.classList.add("number");
        div.innerText = i;

        if (soldNumbers.includes(i)) {
            div.classList.add("sold");
        }

        div.addEventListener("click", () => {
            if (soldNumbers.includes(i)) return;

            if (selectedNumbers.includes(i)) {
                selectedNumbers = selectedNumbers.filter(n => n !== i);
                div.classList.remove("selected");
            } else {
                selectedNumbers.push(i);
                div.classList.add("selected");
            }

            updateSummary();
        });

        numbersContainer.appendChild(div);
    }
}

function updateSummary() {
    if (selectedNumbers.length === 0) {
        summary.innerText = "Nenhum número selecionado.";
        return;
    }

    const total = selectedNumbers.length * 3.5;
    summary.innerHTML =
        `Números: <strong>${selectedNumbers.join(", ")}</strong><br>
         Total: <strong>R$${total.toFixed(2)}</strong>`;
}

function updateCounter() {
    counter.innerText = `Disponíveis: ${100 - soldNumbers.length} | Vendidos: ${soldNumbers.length}`;
}

buyBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const turma = document.getElementById("turma").value.trim();

    if (!name) {
        message.innerText = "Digite seu nome.";
        return;
    }

    if (!turma) {
        message.innerText = "Digite sua turma.";
        return;
    }

    if (selectedNumbers.length === 0) {
        message.innerText = "Selecione pelo menos um número.";
        return;
    }

    if (!confirm(`Confirmar reserva dos números ${selectedNumbers.join(", ")}?`)) {
        return;
    }

    buyBtn.disabled = true;
    document.body.classList.add("loading");

    for (let number of selectedNumbers) {
        await addDoc(collection(db, "rifa"), {
            name: name,
            number: number,
            createdAt: new Date()
        });
    }

    const phone = "5511971254661";
    const text = `Olá! Reservei os números ${selectedNumbers.join(", ")} da Rifa de Páscoa. Meu nome é ${name}. Total: R$${selectedNumbers.length * 5}.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

    window.open(url, "_blank");
    location.reload();
});

loadNumbers();